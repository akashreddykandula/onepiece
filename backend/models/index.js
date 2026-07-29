"use strict";
const mongoose = require("mongoose");

// ─── Review ───────────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100 },
    comment: { type: String, required: true, maxlength: 1000 },
    images: [{ url: String, publicId: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    adminReply: {
      comment: String,
      repliedAt: Date,
      repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    helpful: { type: Number, default: 0 },
    helpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

reviewSchema.index({ product: 1, isApproved: 1 });
reviewSchema.index({ user: 1 });

// ─── Coupon ───────────────────────────────────────────────────────────────────
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, default: 0 },
    minOrderAmount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: null },
    usagePerUser: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    applicableProducts: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ],
    applicableCategories: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    ],
    isActive: { type: Boolean, default: true },
    usedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        usedAt: Date,
        orderId: mongoose.Schema.Types.ObjectId,
      },
    ],
  },
  { timestamps: true },
);

couponSchema.virtual("isValid").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (!this.usageLimit || this.usedCount < this.usageLimit)
  );
});
couponSchema.set("toJSON", { virtuals: true });

// ─── Banner ───────────────────────────────────────────────────────────────────
const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: String,
    description: String,
    ctaText: String,
    ctaLink: String,
    image: { url: String, publicId: String, alt: String },
    mobileImage: { url: String, publicId: String },
    videoUrl: String,
    type: {
      type: String,
      enum: [
        "hero",
        "category",
        "popup",
        "announcement",
        "collection",
        "festival",
      ],
      default: "hero",
    },
    position: { type: String, default: "homepage" },
    textColor: { type: String, default: "#FFFFFF" },
    overlayOpacity: { type: Number, default: 40, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    startDate: Date,
    endDate: Date,
    clickCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// ─── Return Request ───────────────────────────────────────────────────────────
const returnSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, unique: true },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        orderItem: { type: mongoose.Schema.Types.ObjectId },
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        quantity: Number,
        reason: String,
        subReason: String,
        images: [{ url: String, publicId: String }],
      },
    ],
    returnType: {
      type: String,
      enum: ["return", "exchange", "refund"],
      required: true,
    },
    reason: { type: String, required: true },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "pickup_scheduled",
        "picked_up",
        "processing",
        "completed",
        "rejected",
        "refund_initiated",
      ],
      default: "pending",
    },
    timeline: [
      {
        status: String,

        message: String,

        timestamp: {
          type: Date,

          default: Date.now,
        },
      },
    ],
    adminNotes: String,
    refundAmount: Number,
    refundMethod: {
      type: String,
      enum: ["original_payment", "upi", "wallet", "bank_transfer"],
    },
    upiId: {
      type: String,
      trim: true,
    },

    bankDetails: {
      accountHolder: {
        type: String,
        trim: true,
      },
      accountNumber: {
        type: String,
        trim: true,
      },
      ifscCode: {
        type: String,
        trim: true,
        uppercase: true,
      },
      bankName: {
        type: String,
        trim: true,
      },
    },
    refundStatus: {
      type: String,
      enum: ["pending", "processing", "completed"],
      default: "pending",
    },
    pickupDate: Date,
    pickupAddress: mongoose.Schema.Types.Mixed,
    exchangeProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  },
  { timestamps: true },
);

returnSchema.pre("save", function (next) {
  if (!this.returnNumber) {
    this.returnNumber = "RET-OP-" + Date.now().toString().slice(-8);
  }
  next();
});

// ─── CMS Page ─────────────────────────────────────────────────────────────────
const cmsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, required: true, lowercase: true },
    content: { type: String, required: true },
    metaTitle: String,
    metaDescription: String,
    isActive: { type: Boolean, default: true },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// ─── Notification ─────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["order", "return", "review", "coupon", "system", "promo"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String,
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// ─── Print Job ────────────────────────────────────────────────────────────────
const printJobSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    size: String,
    color: String,
    printArea: {
      type: String,
      enum: ["front", "back", "left_sleeve", "right_sleeve", "neck"],
    },
    files: [{ url: String, publicId: String, name: String, type: String }],
    text: String,
    notes: String,
    status: {
      type: String,
      enum: ["pending", "approved", "printing", "completed", "cancelled"],
      default: "pending",
    },
    adminNotes: String,
    previewUrl: String,
  },
  { timestamps: true },
);

module.exports = {
  Review: mongoose.model("Review", reviewSchema),
  Coupon: mongoose.model("Coupon", couponSchema),
  Banner: mongoose.model("Banner", bannerSchema),
  Return: mongoose.model("Return", returnSchema),
  CMS: mongoose.model("CMS", cmsSchema),
  Notification: mongoose.model("Notification", notificationSchema),
  PrintJob: mongoose.model("PrintJob", printJobSchema),
};
