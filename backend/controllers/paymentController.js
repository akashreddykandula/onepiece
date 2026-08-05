"use strict";
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Order = require("../models/Order");
const CustomPrintOrder = require("../models/CustomPrintOrder");
const { finalizeOrder } = require("./orderController");
const { AppError } = require("../middleware/errorMiddleware");
const { getIO } = require("../socket"); // <-- ADD THIS LINE
const emailService = require("../services/emailService");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createCustomPrintPayment = async (req, res, next) => {
  const { customPrintOrderId } = req.body;

  if (!customPrintOrderId) {
    return next(new AppError("Custom print order ID is required.", 400));
  }

  const customOrder = await CustomPrintOrder.findById(customPrintOrderId);

  if (!customOrder) {
    return next(new AppError("Custom print order not found.", 404));
  }

  if (customOrder.paymentStatus === "Paid") {
    return next(new AppError("This custom print order is already paid.", 400));
  }

  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(customOrder.quotedPrice * 100),
    currency: "INR",
    receipt: `cp_${customOrder._id}`,
    notes: {
      customPrintOrderId: customOrder._id.toString(),
    },
  });

  customOrder.razorpayOrderId = rzpOrder.id;
  await customOrder.save();

  res.json({
    success: true,
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
};
// POST /api/payments/create-order
exports.createRazorpayOrder = async (req, res, next) => {
  const { orderId } = req.body;
  if (!orderId) return next(new AppError("Order ID is required.", 400));

  const order = await Order.findById(orderId);
  if (!order) return next(new AppError("Order not found.", 404));
  if (order.paymentInfo.status === "paid") {
    return next(new AppError("Order already paid.", 400));
  }

  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(order.pricing.total * 100),
    currency: "INR",
    receipt: `op_${order.orderNumber}`,
    notes: { orderId: order._id.toString(), orderNumber: order.orderNumber },
  });

  res.json({
    success: true,
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    orderNumber: order.orderNumber,
  });
};

// POST /api/payments/verify
exports.verifyPayment = async (req, res, next) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
    customPrintOrderId,
  } = req.body;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    (!orderId && !customPrintOrderId)
  ) {
    return next(new AppError("Missing payment verification fields.", 400));
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  // ❌ Signature invalid
  if (expectedSignature !== razorpay_signature) {
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        "paymentInfo.status": "failed",
        $push: {
          timeline: {
            status: "pending",
            message: "Payment verification failed.",
          },
        },
      });
    }

    return next(new AppError("Payment verification failed.", 400));
  }

  // ==========================
  // CUSTOM PRINT ORDER
  // ==========================
  if (customPrintOrderId) {
    const customOrder = await CustomPrintOrder.findById(customPrintOrderId)
      .populate("product")
      .populate("customer");

    if (!customOrder) {
      return next(new AppError("Custom print order not found.", 404));
    }

    let finalizedOrder;

    if (customOrder.order) {
      finalizedOrder = await Order.findById(customOrder.order);
    } else {
      const order = await Order.create({
        user: customOrder.customer || undefined,

        guestInfo: !customOrder.customer
          ? {
              name: customOrder.customerName,
              email: customOrder.customerEmail,
              phone: customOrder.customerPhone,
            }
          : undefined,

        items: [
          {
            product: customOrder.product._id,
            name: customOrder.product.name,
            slug: customOrder.product.slug,

            image:
              customOrder.product.images?.find((i) => i.isPrimary)?.url ||
              customOrder.product.images?.[0]?.url,

            size: customOrder.selectedSize,
            color: customOrder.selectedColor.name,
            colorHex: customOrder.selectedColor.hex,

            quantity: customOrder.quantity,
            price: customOrder.quotedPrice,
            comparePrice: customOrder.product.comparePrice || 0,

            isCustomPrint: true,

            customPrint: {
              files: customOrder.uploadedDesigns.map((f) => ({
                url: f.url,
                publicId: f.publicId,
                name: f.fileName,
              })),
              printArea: customOrder.selectedPrintArea,
              text: customOrder.printText,
              notes: customOrder.customerNotes,
            },
          },
        ],

        shippingAddress: customOrder.shippingAddress,

        pricing: {
          subtotal: customOrder.quotedPrice,
          shippingCost: 0,
          discount: 0,
          couponDiscount: 0,
          gst: 0,
          gstPercentage: 18,
          total: customOrder.quotedPrice,
        },

        paymentInfo: {
          method: "razorpay",
          status: "pending",
        },

        timeline: [
          {
            status: "pending",
            message: "Custom print order created.",
          },
        ],
      });

      finalizedOrder = await finalizeOrder(order._id, {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
      });

      customOrder.order = finalizedOrder._id;
    }

    customOrder.paymentStatus = "Paid";
    customOrder.paymentId = razorpay_payment_id;
    customOrder.razorpayOrderId = razorpay_order_id;
    customOrder.paidAt = new Date();
    customOrder.status = "Printing";

    await customOrder.save();
    // Customer payment success
    emailService
      .sendCustomPrintStatusUpdate(customOrder, "Printing")
      .catch(console.error);

    emailService.sendAdminCustomPrintPaid(customOrder).catch(console.error);

    getIO().emit("customPrintUpdated", {
      orderId: customOrder._id,
      status: customOrder.status,
      quotedPrice: customOrder.quotedPrice,
      customerDecision: customOrder.customerDecision,
    });

    return res.json({
      success: true,
      message: "Payment verified successfully.",
      orderId: finalizedOrder._id,
    });
  }

  // ==========================
  // NORMAL ORDER
  // ==========================
  const order = await finalizeOrder(orderId, {
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    paidAt: new Date(),
  });
  emailService.sendAdminOrderPaid(order).catch(console.error);

  return res.json({
    success: true,
    message: "Payment verified successfully.",
    orderId: order._id,
  });
};

// POST /api/payments/failed
exports.paymentFailed = async (req, res) => {
  const { orderId } = req.body;
  if (orderId) {
    await Order.findByIdAndUpdate(orderId, {
      "paymentInfo.status": "failed",
      $push: {
        timeline: {
          status: "pending",
          message: "Payment failed. Please retry.",
        },
      },
    });
  }
  res.json({ success: true, message: "Failure recorded." });
};

// POST /api/payments/refund
exports.initiateRefund = async (req, res, next) => {
  const { orderId, amount, notes } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return next(new AppError("Order not found.", 404));
  if (order.paymentInfo.status !== "paid") {
    return next(new AppError("Order has not been paid.", 400));
  }

  const refund = await razorpay.payments.refund(
    order.paymentInfo.razorpayPaymentId,
    {
      amount: Math.round((amount || order.pricing.total) * 100),
      notes: notes || { reason: "Customer return/cancellation" },
    },
  );

  order.paymentInfo.status = "refunded";
  order.paymentInfo.refundId = refund.id;
  order.paymentInfo.refundAmount = refund.amount / 100;
  order.paymentInfo.refundedAt = new Date();
  await order.save();

  res.json({ success: true, refund });
};
// GET /api/payments/transactions
exports.getTransactions = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const orders = await Order.find({
    "paymentInfo.status": { $ne: "pending" },
  })
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .select("orderNumber pricing paymentInfo createdAt user guestInfo");

  const total = await Order.countDocuments({
    "paymentInfo.status": { $ne: "pending" },
  });

  res.json({
    success: true,
    transactions: orders,
    total,
  });
};
