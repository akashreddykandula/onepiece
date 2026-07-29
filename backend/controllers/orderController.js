"use strict";
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { Coupon, Notification, Return } = require("../models/index");
const User = require("../models/User");
const { AppError } = require("../middleware/errorMiddleware");
const emailService = require("../services/emailService");

// POST /api/orders
exports.createOrder = async (req, res, next) => {
  const {
    items,
    shippingAddress,
    paymentMethod,
    couponCode,
    guestInfo,
    notes,
  } = req.body;

  if (!items || items.length === 0)
    return next(new AppError("No items in order.", 400));
  if (!shippingAddress)
    return next(new AppError("Shipping address is required.", 400));

  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      return next(
        new AppError(
          `Product "${item.name || item.product}" is no longer available.`,
          400,
        ),
      );
    }

    // Check stock
    if (product.hasVariants) {
      const variant = product.variants.id(item.variant);
      if (!variant || variant.stock < item.quantity) {
        return next(
          new AppError(
            `Insufficient stock for ${product.name} (${item.size || ""}/${item.color || ""}).`,
            400,
          ),
        );
      }
    } else if (product.stock < item.quantity) {
      return next(new AppError(`Insufficient stock for ${product.name}.`, 400));
    }

    const itemPrice = product.price;
    subtotal += itemPrice * item.quantity;

    validatedItems.push({
      product: product._id,
      variant: item.variant,
      name: product.name,
      slug: product.slug,
      image:
        product.images?.find((i) => i.isPrimary)?.url ||
        product.images?.[0]?.url ||
        "",
      size: item.size,
      color: item.color,
      colorHex: item.colorHex,
      quantity: item.quantity,
      price: itemPrice,
      comparePrice: product.comparePrice,
      sku: product.sku,
      isCustomPrint: item.isCustomPrint || false,
      customPrint: item.customPrint,
    });
  }

  // Calculate shipping
  const shippingCost = subtotal >= 999 ? 0 : 79;

  // Apply coupon
  let couponDiscount = 0;
  let couponData = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });
    if (!coupon || !coupon.isValid) {
      return next(new AppError("Invalid or expired coupon code.", 400));
    }
    if (subtotal < coupon.minOrderAmount) {
      return next(
        new AppError(
          `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}.`,
          400,
        ),
      );
    }
    const userId = req.user?._id;
    if (userId) {
      const userUsage = coupon.usedBy.filter(
        (u) => u.user.toString() === userId.toString(),
      ).length;
      if (userUsage >= coupon.usagePerUser) {
        return next(
          new AppError(
            "You have already used this coupon the maximum number of times.",
            400,
          ),
        );
      }
    }
    couponDiscount =
      coupon.discountType === "percentage"
        ? Math.min(
            (subtotal * coupon.discountValue) / 100,
            coupon.maxDiscountAmount || Infinity,
          )
        : coupon.discountValue;
    couponDiscount = Math.min(couponDiscount, subtotal);
    couponData = {
      code: coupon.code,
      discountAmount: couponDiscount,
      discountType: coupon.discountType,
    };
  }

  // GST Calculation (18% inclusive/exclusive based on total taxable)
  const taxableAmount = subtotal - couponDiscount;
  const gstPercentage = 18;
  const gst = Math.round(((taxableAmount * gstPercentage) / 118) * 100) / 100;
  const total =
    Math.round((subtotal - couponDiscount + shippingCost) * 100) / 100;

  // Loyalty points earned
  const loyaltyPointsEarned = Math.floor(total / 10);

  const order = await Order.create({
    user: req.user?._id,
    guestInfo,
    items: validatedItems,
    shippingAddress,
    pricing: {
      subtotal,
      shippingCost,
      couponDiscount,
      gst,
      gstPercentage,
      total,
    },
    coupon: couponData,
    paymentInfo: { method: paymentMethod || "razorpay" },
    notes,
    loyaltyPointsEarned,
    timeline: [
      { status: "pending", message: "Order placed and awaiting payment." },
    ],
  });

  res.status(201).json({ success: true, order });
};

// POST /api/orders/:id/finalize - called after successful payment
exports.finalizeOrder = async (orderId, paymentData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order || order.paymentInfo.status === "paid") {
      await session.abortTransaction();
      session.endSession();
      return order;
    }

    // Update payment & order state
    order.paymentInfo.status = "paid";
    Object.assign(order.paymentInfo, paymentData);
    order.orderStatus = "confirmed";
    order.timeline.push({
      status: "confirmed",
      message: "Payment confirmed. Your order is being processed.",
    });

    // Reduce stock using bulkWrite (atomic inside transaction)
    const bulkOps = order.items.map((item) => {
      if (item.variant) {
        return {
          updateOne: {
            filter: { _id: item.product, "variants._id": item.variant },
            update: {
              $inc: {
                "variants.$.stock": -item.quantity,
                soldCount: item.quantity,
              },
            },
          },
        };
      } else {
        return {
          updateOne: {
            filter: { _id: item.product },
            update: {
              $inc: { stock: -item.quantity, soldCount: item.quantity },
            },
          },
        };
      }
    });

    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps, { session });
    }

    // Update coupon usage
    if (order.coupon?.code) {
      await Coupon.findOneAndUpdate(
        { code: order.coupon.code },
        {
          $inc: { usedCount: 1 },
          $push: {
            usedBy: {
              user: order.user,
              usedAt: new Date(),
              orderId: order._id,
            },
          },
        },
        { session },
      );
    }

    // Update user stats
    if (order.user) {
      await User.findByIdAndUpdate(
        order.user,
        {
          $inc: {
            totalOrders: 1,
            totalSpent: order.pricing.total,
            loyaltyPoints: order.loyaltyPointsEarned,
          },
        },
        { session },
      );
    }

    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    // Async side-effects (Email & Notifications) after transaction commits
    const populatedOrder = await Order.findById(orderId).lean();
    emailService
      .sendOrderConfirmation(populatedOrder)
      .catch((e) => console.error("Order email error:", e.message));

    if (order.user) {
      await Notification.create({
        user: order.user,
        type: "order",
        title: "Order Confirmed!",
        message: `Your order #${order.orderNumber} has been confirmed.`,
        link: `/orders/${order._id}`,
      });
    }

    const adminUsers = await User.find({
      role: { $in: ["admin", "superadmin"] },
    }).select("_id");

    if (adminUsers.length > 0) {
      await Notification.insertMany(
        adminUsers.map((admin) => ({
          user: admin._id,
          type: "order",
          title: "New Order Received",
          message: `Order #${order.orderNumber} has been placed.`,
          link: `/admin/orders/${order._id}`,
        })),
      );
    }

    return order;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// GET /api/orders/my
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id };
    if (status) query.orderStatus = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .select("-timeline"),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      orders,
      total,
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name slug images")
      .populate("timeline.updatedBy", "name");

    if (!order) return next(new AppError("Order not found.", 404));

    const isOwner =
      order.user &&
      req.user &&
      order.user.toString() === req.user._id.toString();

    const isAdmin =
      req.user?.role === "admin" || req.user?.role === "superadmin";

    if (!isOwner && !isAdmin) return next(new AppError("Access denied.", 403));

    const returnRequest = await Return.findOne({ order: order._id });

    res.json({
      success: true,
      order,
      returnRequest,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/orders/track
exports.trackOrder = async (req, res, next) => {
  try {
    const { orderNumber, email } = req.body;
    if (!orderNumber || !email) {
      return next(new AppError("Order number and email are required.", 400));
    }

    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase().trim(),
      $or: [
        { "shippingAddress.email": email.toLowerCase().trim() },
        { "guestInfo.email": email.toLowerCase().trim() },
      ],
    }).populate("timeline.updatedBy", "name");

    if (!order)
      return next(new AppError("No order found with these details.", 404));

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError("Order not found.", 404));

    const isOwner =
      req.user && order.user?.toString() === req.user._id.toString();
    const isAdmin =
      req.user?.role === "admin" || req.user?.role === "superadmin";

    if (!isOwner && !isAdmin) return next(new AppError("Access denied.", 403));

    if (
      ["shipped", "out_for_delivery", "delivered", "cancelled"].includes(
        order.orderStatus,
      )
    ) {
      return next(
        new AppError(
          `Cannot cancel order in "${order.orderStatus}" status.`,
          400,
        ),
      );
    }

    // Only restore stock if the order was paid/confirmed (stock was actually reduced)
    if (
      order.paymentInfo.status === "paid" ||
      order.orderStatus !== "pending"
    ) {
      for (const item of order.items) {
        if (item.variant) {
          await Product.findOneAndUpdate(
            { _id: item.product, "variants._id": item.variant },
            {
              $inc: {
                "variants.$.stock": item.quantity,
                soldCount: -item.quantity,
              },
            },
          );
        } else {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity, soldCount: -item.quantity },
          });
        }
      }
    }

    order.orderStatus = "cancelled";
    order.cancellationReason = reason || "Cancelled by customer";
    order.cancelledAt = new Date();
    order.cancelledBy = isAdmin ? "admin" : "customer";
    order.timeline.push({
      status: "cancelled",
      message: reason || "Order cancelled.",
    });
    await order.save();

    emailService
      .sendOrderStatusUpdate(order, "cancelled", reason)
      .catch(console.error);

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// ─── Admin Controllers ───────────────────────────────────────────────────────

exports.getAllOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate,
      paymentStatus,
    } = req.query;

    const query = {};
    if (status) query.orderStatus = status;
    if (paymentStatus) query["paymentInfo.status"] = paymentStatus;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "shippingAddress.name": { $regex: search, $options: "i" } },
        { "shippingAddress.phone": { $regex: search, $options: "i" } },
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .select("-items.customPrint -timeline"),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      orders,
      total,
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const {
      status,
      message,
      trackingNumber,
      courier,
      trackingUrl,
      estimatedDelivery,
    } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError("Order not found.", 404));

    const validStatuses = [
      "confirmed",
      "packed",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "return_requested",
      "returned",
    ];
    if (!validStatuses.includes(status))
      return next(new AppError("Invalid status.", 400));

    order.orderStatus = status;
    order.timeline.push({
      status,
      message:
        message || `Order status updated to ${status.replace(/_/g, " ")}.`,
      updatedBy: req.user._id,
    });

    if (trackingNumber) order.tracking.trackingNumber = trackingNumber;
    if (courier) order.tracking.courier = courier;
    if (trackingUrl) order.tracking.trackingUrl = trackingUrl;
    if (estimatedDelivery)
      order.tracking.estimatedDelivery = new Date(estimatedDelivery);
    if (status === "delivered") order.tracking.deliveredAt = new Date();

    await order.save();

    // User Notifications with dynamic wording
    if (order.user) {
      const notifMsg = {
        confirmed: {
          title: "Order Confirmed!",
          msg: "Your order has been confirmed!",
        },
        packed: {
          title: "Order Packed",
          msg: "Your order has been packed and is ready to ship.",
        },
        shipped: {
          title: "Order Shipped!",
          msg: `Your order is on its way! Tracking: ${trackingNumber || "N/A"}`,
        },
        out_for_delivery: {
          title: "Out for Delivery",
          msg: "Your order is out for delivery today!",
        },
        delivered: {
          title: "Order Delivered",
          msg: "Your order has been delivered. Enjoy!",
        },
      };

      if (notifMsg[status]) {
        await Notification.create({
          user: order.user,
          type: "order",
          title: notifMsg[status].title,
          message: notifMsg[status].msg,
          link: `/orders/${order._id}`,
        });
      }
    }

    if (status === "shipped") {
      emailService.sendShippingNotification(order).catch(console.error);
    } else {
      emailService
        .sendOrderStatusUpdate(order, status, message)
        .catch(console.error);
    }

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
