// models/CustomPrintOrder.js
"use strict";

const mongoose = require("mongoose");

const customPrintOrderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    customerName: {
      type: String,
      trim: true,
      required: [true, "Customer name is required"],
    },
    customerPhone: {
      type: String,
      trim: true,
      required: [true, "Customer phone is required"],
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "Customer email is required"],
    },
    printText: {
      type: String,
      trim: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    selectedColor: {
      name: { type: String, required: true },
      hex: { type: String, required: true },
    },
    selectedSize: {
      type: String,
      required: true,
      trim: true,
    },
    selectedPrintArea: {
      type: String,
      required: true,
      trim: true,
    },
    selectedSide: {
      type: String,
      enum: ["Front", "Back"],
      default: "Front",
    },
    // Visual Transform Attributes from Mockup Editor
    designTransform: {
      position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
      },
      scale: { type: Number, default: 1 },
      rotation: { type: Number, default: 0 },
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "Quantity must be at least 1"],
    },
    uploadedDesigns: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        fileName: { type: String },
      },
    ],
    previewImage: {
      url: String,
      publicId: String,
    },
    proofImage: {
      url: String,
      publicId: String,
    },
    designerNotes: {
      type: String,
      default: "",
    },
    customerNotes: {
      type: String,
      default: "",
    },
    quotedPrice: {
      type: Number,
      default: 0,
    },
    customerApproved: {
      type: Boolean,
      default: false,
    },
    customerDecision: {
      type: String,
      enum: ["Pending", "Approved", "Modification Requested", "Rejected"],
      default: "Pending",
    },

    customerFeedback: {
      type: String,
      default: "",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    paymentId: {
      type: String,
      default: "",
    },

    razorpayOrderId: {
      type: String,
      default: "",
    },

    paidAt: Date,
    // 👇 ADD THIS

    order: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Order",
    },

    // 👇 ADD THIS

    shippingAddress: {
      name: {
        type: String,

        required: true,
      },

      phone: {
        type: String,

        required: true,
      },

      email: String,

      line1: {
        type: String,

        required: true,
      },

      line2: String,

      city: {
        type: String,

        required: true,
      },

      state: {
        type: String,

        required: true,
      },

      pincode: {
        type: String,

        required: true,
      },

      country: {
        type: String,

        default: "India",
      },
    },

    estimatedDelivery: Date,

    statusHistory: [
      {
        status: String,
        note: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: [
        "Pending",
        "Reviewing",
        "Proof Uploaded",
        "Waiting Approval",
        "Approved",
        "Payment Pending",
        "Printing",
        "Packed",
        "Shipped",
        "Delivered",
        "Rejected",
      ],
      default: "Pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CustomPrintOrder", customPrintOrderSchema);
