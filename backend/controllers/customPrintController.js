// controllers/customPrintController.js
"use strict";

const CustomPrintOrder = require("../models/CustomPrintOrder");
const Product = require("../models/Product");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../config/cloudinary");
const { getIO } = require("../socket");

exports.createOrder = async (req, res) => {
  try {
    const {
      product,
      selectedColor,
      selectedSize,
      selectedPrintArea,
      selectedSide,
      designTransform,

      quantity,
      customerNotes,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      printText,
    } = req.body;

    let color = selectedColor;
    if (typeof selectedColor === "string") {
      try {
        color = JSON.parse(selectedColor);
      } catch {
        color = { name: selectedColor, hex: "#FFFFFF" };
      }
    }

    let parsedTransform = { position: { x: 0, y: 0 }, scale: 1, rotation: 0 };
    if (typeof designTransform === "string") {
      try {
        parsedTransform = JSON.parse(designTransform);
      } catch {
        // Fallback to default transform
      }
    } else if (designTransform) {
      parsedTransform = designTransform;
    }
    let parsedShippingAddress = {};

    if (typeof shippingAddress === "string") {
      try {
        parsedShippingAddress = JSON.parse(shippingAddress);
      } catch {
        parsedShippingAddress = {};
      }
    } else if (shippingAddress) {
      parsedShippingAddress = shippingAddress;
    }
    if (product) {
      const existingProduct = await Product.findById(product);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
    }

    let uploadedDesigns = [];
    if (req.files?.length) {
      uploadedDesigns = await Promise.all(
        req.files.map(async (file) => {
          const uploaded = await uploadToCloudinary(file.buffer, {
            folder: "custom-print/designs",
          });
          return {
            url: uploaded.secure_url,
            publicId: uploaded.public_id,
            fileName: file.originalname,
          };
        }),
      );
    }

    const order = await CustomPrintOrder.create({
      customer: req.user?._id || null,

      customerName,
      customerPhone,
      customerEmail,

      shippingAddress: parsedShippingAddress,

      printText,

      product: product || null,

      selectedColor: color,
      selectedSize,
      selectedPrintArea,
      selectedSide: selectedSide || "Front",

      designTransform: parsedTransform,

      quantity,
      customerNotes,
      uploadedDesigns,
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (err) {
    console.error("========== CREATE ORDER ERROR ==========");
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await CustomPrintOrder.find({ customer: req.user._id })
      .populate("product")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await CustomPrintOrder.find()
      .populate("customer", "name email")
      .populate("product", "name images")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await CustomPrintOrder.findById(req.params.id)
      .populate("customer", "name email")
      .populate("product");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, quotedPrice, designerNotes } = req.body;
    const order = await CustomPrintOrder.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (status) order.status = status;
    if (quotedPrice !== undefined) order.quotedPrice = quotedPrice;
    if (designerNotes !== undefined) order.designerNotes = designerNotes;

    await order.save();

    getIO().emit("customPrintUpdated", {
      orderId: order._id,
      status: order.status,
      quotedPrice: order.quotedPrice,
      customerDecision: order.customerDecision,
    });

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadProof = async (req, res) => {
  try {
    const order = await CustomPrintOrder.findById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file.buffer, {
        folder: "custom-print/proofs",
      });

      order.proofImage = {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
      };
      order.status = "Waiting Approval";
      await order.save();
      getIO().emit("customPrintUpdated", {
        orderId: order._id,
        status: order.status,
        quotedPrice: order.quotedPrice,
        customerDecision: order.customerDecision,
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.uploadPreview = async (req, res) => {
  try {
    const order = await CustomPrintOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a preview image",
      });
    }

    const uploaded = await uploadToCloudinary(req.file.buffer, {
      folder: "custom-print/previews",
    });

    order.previewImage = {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    };

    order.status = "Waiting Approval";

    await order.save();
    getIO().emit("customPrintUpdated", {
      orderId: order._id,
      status: order.status,
      quotedPrice: order.quotedPrice,
      customerDecision: order.customerDecision,
    });
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.removePreview = async (req, res) => {
  try {
    const order = await CustomPrintOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.previewImage?.publicId) {
      await deleteFromCloudinary(order.previewImage.publicId);
    }

    order.previewImage = undefined;

    await order.save();

    getIO().emit("customPrintUpdated", {
      orderId: order._id,
      status: order.status,
      quotedPrice: order.quotedPrice,
      customerDecision: order.customerDecision,
    });

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.customerApproval = async (req, res) => {
  try {
    const { decision, feedback = "" } = req.body;

    const order = await CustomPrintOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.customerDecision = decision;
    order.customerFeedback = feedback;

    switch (decision) {
      case "Approved":
        order.customerApproved = true;
        order.status = "Payment Pending";
        break;

      case "Modification Requested":
        order.customerApproved = false;
        order.status = "Reviewing";
        break;

      case "Rejected":
        order.customerApproved = false;
        order.status = "Rejected";
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid decision",
        });
    }

    await order.save();
    getIO().emit("customPrintUpdated", {
      orderId: order._id,
      status: order.status,
      quotedPrice: order.quotedPrice,
      customerDecision: order.customerDecision,
    });

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
