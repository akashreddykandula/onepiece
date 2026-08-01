"use strict";

const PDFDocument = require("pdfkit");
const Order = require("../models/Order");
const { AppError } = require("../middleware/errorMiddleware");

exports.downloadInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product", "name");

    if (!order) {
      return next(new AppError("Order not found.", 404));
    }

    // Customer can download only their own invoice
    if (
      req.user.role !== "admin" &&
      order.user &&
      order.user._id.toString() !== req.user._id.toString()
    ) {
      return next(new AppError("Access denied.", 403));
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${order.invoiceNumber || order.orderNumber}.pdf`,
    );

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    doc.pipe(res);

    // -------------------------
    // Header
    // -------------------------

    doc.fontSize(24).text("ONE PIECE", {
      align: "center",
    });

    doc.fontSize(11).fillColor("gray").text("Premium Fashion Store", {
      align: "center",
    });

    doc.moveDown(2);

    doc.fillColor("black");

    doc.fontSize(18).text("TAX INVOICE");

    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Invoice No : ${order.invoiceNumber || "-"}`);
    doc.text(`Order No   : ${order.orderNumber}`);
    doc.text(`Date       : ${order.createdAt.toDateString()}`);

    doc.moveDown();

    doc.text("Customer");
    doc.text(order.shippingAddress.name);
    doc.text(order.shippingAddress.phone);
    doc.text(order.shippingAddress.line1);

    if (order.shippingAddress.line2) doc.text(order.shippingAddress.line2);

    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`);

    doc.text(order.shippingAddress.pincode);

    doc.moveDown(2);

    // -------------------------
    // Items
    // -------------------------

    doc.fontSize(13).text("Items");

    doc.moveDown();

    order.items.forEach((item) => {
      doc.fontSize(11);

      doc.text(item.name);

      doc.text(
        `Qty: ${item.quantity}   Price: ₹${item.price}   Total: ₹${item.price * item.quantity}`,
      );

      doc.moveDown();
    });

    doc.moveDown();

    // -------------------------
    // Summary
    // -------------------------

    doc.fontSize(12);

    doc.text(`Subtotal : ₹${order.pricing.subtotal}`);
    doc.text(`Shipping : ₹${order.pricing.shippingCost}`);
    doc.text(`GST      : ₹${order.pricing.gst}`);

    if (order.pricing.couponDiscount > 0) {
      doc.text(`Discount : -₹${order.pricing.couponDiscount}`);
    }

    doc.moveDown();

    doc.fontSize(15);

    doc.text(`Grand Total : ₹${order.pricing.total}`, {
      align: "right",
    });

    doc.moveDown(2);

    doc
      .fontSize(10)
      .fillColor("gray")
      .text("Thank you for shopping with ONE PIECE.", {
        align: "center",
      });

    doc.end();
  } catch (err) {
    next(err);
  }
};
