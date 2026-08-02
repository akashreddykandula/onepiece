"use strict";
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { Coupon, Notification, Return } = require("../models/index");
const User = require("../models/User");
const { AppError } = require("../middleware/errorMiddleware");
const emailService = require("../services/emailService");
const { getIO } = require("../socket");
const path = require("path");
const fs = require("fs");
const CustomPrintOrder = require("../models/CustomPrintOrder");

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
  let hasFreeShipping = false;

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (product.freeShipping) {
      hasFreeShipping = true;
    }
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
  const shippingCost = hasFreeShipping || subtotal >= 999 ? 0 : 79;
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

  getIO().emit("orderCreated", {
    orderId: order._id,
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
      const updatedProducts = await Product.find({
        _id: { $in: order.items.map((i) => i.product) },
      }).session(session);

      for (const product of updatedProducts) {
        if (product.hasVariants) {
          product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
        }

        product.isInStock = product.stock > 0;

        await product.save({ session });
      }
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

    getIO().emit("orderUpdated", {
      orderId: order._id,
    });

    for (const item of order.items) {
      const product = await Product.findById(item.product);

      getIO().emit("productStockUpdated", {
        productId: product._id,
        stock: product.stock,
        isInStock: product.isInStock,
      });
    }
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
    let customPrintOrder = null;

    if (order.items.some((item) => item.isCustomPrint)) {
      customPrintOrder = await CustomPrintOrder.findOne({
        order: order._id,
      });
    }
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
    const updatedProducts = await Product.find({
      _id: { $in: order.items.map((i) => i.product) },
    });

    for (const product of updatedProducts) {
      if (product.hasVariants) {
        product.stock = product.variants.reduce((sum, v) => sum + v.stock, 0);
      }

      product.isInStock = product.stock > 0;

      await product.save();
    }

    for (const item of order.items) {
      const product = await Product.findById(item.product);

      getIO().emit("productStockUpdated", {
        productId: product._id,
        stock: product.stock,
        isInStock: product.isInStock,
      });
    }

    getIO().emit("orderUpdated", {
      orderId: order._id,
    });

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
    if (trackingNumber) {
      order.tracking.trackingNumber = trackingNumber;
    }

    if (courier) {
      order.tracking.courier = courier;
    }

    if (trackingUrl) {
      order.tracking.trackingUrl = trackingUrl;
    }

    if (estimatedDelivery) {
      order.tracking.estimatedDelivery = estimatedDelivery;
    }
    order.timeline.push({
      status,
      message:
        message || `Order status updated to ${status.replace(/_/g, " ")}.`,
      updatedBy: req.user._id,
    });

    if (status === "delivered") {
      order.tracking.deliveredAt = new Date();

      if (String(order.paymentInfo.method).toLowerCase() === "cod") {
        console.log("COD detected -> marking paid");

        order.paymentInfo.status = "paid";
        order.paymentInfo.paidAt = new Date();
      }
    }

    await order.save();
    if (order.items.some((item) => item.isCustomPrint)) {
      await CustomPrintOrder.findOneAndUpdate({ order: order._id }, { status });
    }
    getIO().emit("orderStatusUpdated", {
      orderId: order._id,

      status: order.orderStatus,
    });
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

// invoice section

const https = require("https");
const PDFDocument = require("pdfkit");

// Helper function to fetch images asynchronously (Handles URLs & Local File Paths)
async function fetchImageBuffer(source) {
  if (!source) return null;

  // Local File System
  if (fs.existsSync(source)) {
    return fs.readFileSync(source);
  }

  // Web URL
  if (source.startsWith("http://") || source.startsWith("https://")) {
    return new Promise((resolve) => {
      https
        .get(source, (res) => {
          const data = [];
          res.on("data", (chunk) => data.push(chunk));
          res.on("end", () => resolve(Buffer.concat(data)));
          res.on("error", () => resolve(null));
        })
        .on("error", () => resolve(null));
    });
  }

  // Base64 String
  if (source.startsWith("data:image")) {
    const base64Data = source.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(base64Data, "base64");
  }

  return null;
}

exports.downloadInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError("Order not found.", 404));
    }

    const isCustomOrder = order.items.some((item) => item.isCustomPrint);
    let customPrintOrder = null;

    if (isCustomOrder) {
      customPrintOrder = await CustomPrintOrder.findOne({
        order: order._id,
      });
    }

    const isOwner =
      order.user &&
      req.user &&
      order.user.toString() === req.user._id.toString();

    const isAdmin =
      req.user?.role === "admin" || req.user?.role === "superadmin";

    if (!isOwner && !isAdmin) {
      return next(new AppError("Access denied.", 403));
    }

    // Initialize document with tight vertical layout margins
    const doc = new PDFDocument({
      size: "A4", // Height: 841.89 pt
      margin: 35,
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice-${order.orderNumber}.pdf`,
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Color Palette
    const PRIMARY = "#0A5ACB";
    const NAVY = "#0A2A80";
    const GREY = "#64748B";

    // Helper to format currency cleanly (PDFKit Standard Helvetica does not support '₹')
    const formatCurrency = (amount) => `Rs. ${Number(amount).toFixed(2)}`;

    // ------------------------------------
    // 1. Header & Brand Section
    // ------------------------------------
    const logoPath = path.join(__dirname, "../public/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 35, 30, { width: 60 });
    }

    doc
      .fillColor(NAVY)
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("ONE PIECE", 105, 32);

    doc
      .fillColor(PRIMARY)
      .fontSize(10)
      .font("Helvetica")
      .text("YOUR STATEMENT. YOUR STYLE.", 105, 60);

    // Right Header Section
    doc
      .fillColor("#111827")
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("TAX INVOICE", 380, 28, { align: "right" });

    doc
      .fontSize(9)
      .fillColor(GREY)
      .text(`Invoice No : ${order.invoiceNumber || "-"}`, 380, 50, {
        align: "right",
      })
      .text(`Order No : ${order.orderNumber}`, 380, 62, { align: "right" })
      .text(
        `Date : ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
        380,
        74,
        { align: "right" },
      );

    // Custom Order Badge (Positioned cleanly inside header)
    if (isCustomOrder) {
      doc.roundedRect(410, 90, 150, 20, 10).fillAndStroke("#F3E8FF", "#A855F7");

      doc
        .fillColor("#7E22CE")
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .text("CUSTOM PRINT ORDER", 410, 96, {
          width: 150,
          align: "center",
        });
    }

    // Header Divider Line
    doc.moveTo(35, 118).lineTo(560, 118).strokeColor("#E2E8F0").stroke();

    // ------------------------------------
    // 2. Seller & Customer Info
    // ------------------------------------
    const startY = 126;
    const boxHeight = 100;

    // Seller Box
    doc
      .roundedRect(35, startY, 255, boxHeight, 6)
      .fillAndStroke("#F8FAFC", "#E2E8F0");
    // Customer Box
    doc
      .roundedRect(305, startY, 255, boxHeight, 6)
      .fillAndStroke("#F8FAFC", "#E2E8F0");

    // -- Seller Info --
    doc
      .fillColor(PRIMARY)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Sold By", 48, startY + 8);
    doc
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text("ONE PIECE", 48, startY + 24);
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#475569")
      .text("Premium Fashion Store", 48, startY + 38)
      .text("Hyderabad, Telangana, India", 48, startY + 50)
      .text("support@onepiece.com | www.onepiece.com", 48, startY + 62);

    // -- Customer Info --
    doc
      .fillColor(PRIMARY)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Bill To", 318, startY + 8);
    doc
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text(order.shippingAddress.name, 318, startY + 24);

    let addrText = `${order.shippingAddress.line1}`;
    if (order.shippingAddress.line2)
      addrText += `, ${order.shippingAddress.line2}`;

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#475569")
      .text(`Phone: ${order.shippingAddress.phone}`, 318, startY + 38)
      .text(addrText, 318, startY + 50, {
        width: 230,
        height: 20,
        ellipsis: true,
      })
      .text(
        `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
        318,
        startY + 70,
      );

    // ------------------------------------
    // 3. Items Table Setup
    // ------------------------------------
    let tableTop = startY + boxHeight + 15;

    // Table Header Bar
    doc.roundedRect(35, tableTop, 525, 22, 4).fillAndStroke(PRIMARY, PRIMARY);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(9);

    doc.text("Item Details", 45, tableTop + 6);
    doc.text("Size", 295, tableTop + 6);
    doc.text("Qty", 350, tableTop + 6);
    doc.text("Price", 400, tableTop + 6);
    doc.text("Amount", 480, tableTop + 6);

    let rowY = tableTop + 26;
    const rowHeight = 54; // Spaced out for double-thumbnails and labels

    for (let index = 0; index < order.items.length; index++) {
      const item = order.items[index];

      // Zebra striping
      if (index % 2 === 0) {
        doc.rect(35, rowY - 2, 525, rowHeight).fill("#F8FAFC");
      }

      // --- Thumbnail Image ---
      const imgBuffer = await fetchImageBuffer(item.image);
      const approvedDesignBuffer = await fetchImageBuffer(
        customPrintOrder?.previewImage?.url ||
          customPrintOrder?.uploadedDesigns?.[0]?.url,
      );

      const imgX = 42;
      const imgY = rowY + 4;
      const imgSize = 34;

      // Default X position for text
      let textX = imgX + imgSize + 10;

      if (imgBuffer) {
        try {
          doc.save();
          doc.roundedRect(imgX, imgY, imgSize, imgSize, 4).clip();
          doc.image(imgBuffer, imgX, imgY, { width: imgSize, height: imgSize });
          doc.restore();
          doc
            .roundedRect(imgX, imgY, imgSize, imgSize, 4)
            .strokeColor("#CBD5E1")
            .lineWidth(0.5)
            .stroke();

          // Render approved design thumbnail next to product thumbnail if present
          if (item.isCustomPrint && approvedDesignBuffer) {
            const designX = imgX + imgSize + 6;

            try {
              doc.save();
              doc.roundedRect(designX, imgY, imgSize, imgSize, 4).clip();
              doc.image(approvedDesignBuffer, designX, imgY, {
                width: imgSize,
                height: imgSize,
              });
              doc.restore();

              doc
                .roundedRect(designX, imgY, imgSize, imgSize, 4)
                .strokeColor("#A855F7")
                .lineWidth(1)
                .stroke();

              doc
                .fillColor("#7E22CE")
                .fontSize(5.5)
                .font("Helvetica-Bold")
                .text("APPROVED", designX, imgY + imgSize + 2, {
                  width: imgSize,
                  align: "center",
                });

              // Offset text position dynamically to prevent overlap
              textX = designX + imgSize + 10;
            } catch (e) {}
          }
        } catch (e) {
          doc
            .roundedRect(imgX, imgY, imgSize, imgSize, 4)
            .fillAndStroke("#E2E8F0", "#CBD5E1");
        }
      } else {
        doc
          .roundedRect(imgX, imgY, imgSize, imgSize, 4)
          .fillAndStroke("#E2E8F0", "#CBD5E1");
      }

      // --- Item Details (Title, SKU, Color) ---
      let detailY = rowY + 4;

      doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9);
      doc.text(item.name, textX, detailY, {
        width: 285 - textX, // Constrain text inside details column
        height: 12,
        ellipsis: true,
      });

      detailY += 13;

      if (item.isCustomPrint) {
        doc
          .fillColor("#7E22CE")
          .font("Helvetica-Bold")
          .fontSize(7)
          .text("✓ Approved Custom Design", textX, detailY);

        detailY += 10;
      }

      // SKU Code
      doc.font("Helvetica").fontSize(7.5).fillColor(GREY);
      doc.text(`SKU: ${item.sku || "N/A"}`, textX, detailY);

      detailY += 10;

      // Color Swatch + Label
      if (item.color) {
        const colorHex = item.colorHex || "#64748B";

        doc
          .circle(textX + 4, detailY + 3, 3)
          .fillAndStroke(colorHex, "#94A3B8");

        doc
          .fillColor("#475569")
          .fontSize(7.5)
          .text(item.color, textX + 11, detailY);
      }

      // --- Size Badge ---
      const sizeText = String(item.size || "OS").toUpperCase();
      const badgeX = 290;
      const badgeY = rowY + 12;

      doc
        .roundedRect(badgeX, badgeY, 28, 16, 3)
        .fillAndStroke("#EFF6FF", "#BFDBFE");
      doc
        .fillColor(PRIMARY)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(sizeText, badgeX, badgeY + 4, { width: 28, align: "center" });

      // --- Quantity, Price, Amount ---
      doc.fillColor("#111827").font("Helvetica").fontSize(9);
      doc.text(item.quantity.toString(), 350, rowY + 14);
      doc.text(formatCurrency(item.price), 390, rowY + 14);
      doc
        .font("Helvetica-Bold")
        .text(formatCurrency(item.price * item.quantity), 465, rowY + 14, {
          width: 85,
          align: "right",
        });

      rowY += rowHeight;
    }

    doc
      .moveTo(35, rowY)
      .lineTo(560, rowY)
      .strokeColor("#CBD5E1")
      .lineWidth(1)
      .stroke();

    // ------------------------------------
    // 4. Payment Summary & Status
    // ------------------------------------
    let summaryY = rowY + 12;
    const summaryWidth = 210;
    const summaryX = 350;

    // Payment Box
    doc
      .roundedRect(summaryX, summaryY, summaryWidth, 115, 6)
      .fillAndStroke("#F8FAFC", "#E2E8F0");
    doc
      .fillColor(PRIMARY)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Payment Summary", summaryX + 12, summaryY + 10);

    let sy = summaryY + 28;
    const drawSummaryRow = (label, value, color = "#334155", bold = false) => {
      doc
        .fillColor(color)
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(8.5);
      doc.text(label, summaryX + 12, sy);
      doc.text(value, summaryX + summaryWidth - 90, sy, {
        width: 78,
        align: "right",
      });
      sy += 15;
    };

    drawSummaryRow("Subtotal", formatCurrency(order.pricing.subtotal));
    drawSummaryRow(
      "Shipping",
      order.pricing.shippingCost === 0
        ? "FREE"
        : formatCurrency(order.pricing.shippingCost),
      order.pricing.shippingCost === 0 ? "#16A34A" : "#334155",
    );

    if (order.pricing.couponDiscount > 0) {
      drawSummaryRow(
        "Discount",
        `- ${formatCurrency(order.pricing.couponDiscount)}`,
        "#16A34A",
      );
    }

    drawSummaryRow(
      `GST (${order.pricing.gstPercentage}%)`,
      formatCurrency(order.pricing.gst),
    );

    // Inner Summary Divider
    doc
      .moveTo(summaryX + 12, sy)
      .lineTo(summaryX + summaryWidth - 12, sy)
      .strokeColor("#CBD5E1")
      .stroke();
    sy += 6;

    // Total Line
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827");
    doc.text("Grand Total", summaryX + 12, sy);
    doc.text(
      formatCurrency(order.pricing.total),
      summaryX + summaryWidth - 100,
      sy,
      { width: 88, align: "right" },
    );

    // Payment Status Pill
    const statusY = summaryY + 122;
    doc
      .roundedRect(summaryX, statusY, summaryWidth, 26, 4)
      .fillAndStroke("#ECFDF5", "#BBF7D0");
    doc
      .fillColor("#15803D")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(
        `Payment Status : ${order.paymentInfo.status.toUpperCase()}`,
        summaryX,
        statusY + 8,
        {
          width: summaryWidth,
          align: "center",
        },
      );

    // ------------------------------------
    // 5. Single-Page Footer Section
    // ------------------------------------
    const footerY = 680;

    doc
      .moveTo(35, footerY - 10)
      .lineTo(560, footerY - 10)
      .strokeColor("#CBD5E1")
      .stroke();

    doc
      .fillColor(PRIMARY)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Thank you for shopping with ONE PIECE!", 35, footerY, {
        align: "center",
      });

    // Terms and Contact Side-By-Side (Saves Vertical Space)
    const colY = footerY + 22;

    // Terms Column (Left)
    doc
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text("Terms & Conditions", 35, colY);
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .fontSize(7.5)
      .text(
        "• Returns allowed within 7 days per policy, No returns for custom orders",
        35,
        colY + 12,
      )
      .text("• Computer-generated; signature not required.", 35, colY + 22);

    // Support Column (Right)
    doc
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text("Need Help?", 350, colY);
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .fontSize(7.5)
      .text("Email: onepiece.fashion99@gmail.com", 350, colY + 12)
      .text("Phone: +91 81212 18099", 350, colY + 22);

    // Page Number Footer
    doc
      .fillColor("#94A3B8")
      .fontSize(8)
      .text("Page 1 of 1", 35, 805, { width: 525, align: "center" });

    doc.end();
  } catch (err) {
    next(err);
  }
};
exports.downloadShippingLabel = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError("Order not found.", 404));
    }

    const doc = new PDFDocument({
      size: "A6",
      margin: 20,
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=ShippingLabel-${order.orderNumber}.pdf`,
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    const PRIMARY = "#0A5ACB";

    // Header
    doc
      .fillColor(PRIMARY)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("ONE PIECE");

    doc.fillColor("#666").fontSize(8).text("Shipping Label");

    doc.moveDown();

    // Order Number
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#000")
      .text(`Order : #${order.orderNumber}`);

    doc.moveDown(0.5);

    // Payment Badge
    const prepaid = String(order.paymentInfo?.method).toLowerCase() !== "cod";

    doc
      .roundedRect(20, 78, 80, 22, 5)
      .fillAndStroke(
        prepaid ? "#DCFCE7" : "#FEF3C7",
        prepaid ? "#22C55E" : "#F59E0B",
      );

    doc
      .fillColor(prepaid ? "#166534" : "#92400E")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(prepaid ? "PREPAID" : "COD", 20, 85, {
        width: 80,
        align: "center",
      });

    doc.moveDown(2);

    // Receiver
    doc
      .fillColor("#000")
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(order.shippingAddress.name);

    doc.font("Helvetica").fontSize(10).text(order.shippingAddress.phone);

    doc.moveDown(0.5);

    doc.text(order.shippingAddress.line1);

    if (order.shippingAddress.line2) {
      doc.text(order.shippingAddress.line2);
    }

    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`);

    doc.text(
      `${order.shippingAddress.pincode}, ${
        order.shippingAddress.country || "India"
      }`,
    );

    doc.moveDown();

    doc
      .font("Helvetica-Bold")
      .text(`Amount : ₹${order.pricing.total.toFixed(2)}`);

    doc.moveDown();

    doc.strokeColor("#ddd").moveTo(20, 240).lineTo(280, 240).stroke();

    doc.fontSize(8).fillColor("#666").text("Courier Use Only", 20, 250, {
      align: "center",
      width: 260,
    });

    doc.end();
  } catch (err) {
    next(err);
  }
};
