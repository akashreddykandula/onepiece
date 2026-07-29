"use strict";
const mongoose = require("mongoose");
const slugify = require("slugify");

const variantSchema = new mongoose.Schema({
  size: { type: String, required: true },
  color: { type: String, required: true },
  colorHex: { type: String, default: "#000000" },
  sku: {
    type: String,
    required: true,
  },
  stock: { type: Number, required: true, default: 0, min: 0 },
  price: { type: Number },
  comparePrice: { type: Number },
  images: [{ url: String, publicId: String }],
});

const reviewSummarySchema = new mongoose.Schema(
  {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    distribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 },
    },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    slug: { type: String, unique: true, lowercase: true },
    sku: { type: String, unique: true, sparse: true, uppercase: true },
    description: { type: String, required: [true, "Description is required"] },
    shortDescription: {
      type: String,
      maxlength: [300, "Short description cannot exceed 300 characters"],
    },
    brand: { type: String, trim: true, default: "ONE PIECE" },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    tags: [{ type: String, trim: true, lowercase: true }],

    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String },
        alt: { type: String, default: "" },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    price: { type: Number, required: [true, "Price is required"], min: 0 },
    comparePrice: { type: Number, default: 0, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    isOnSale: { type: Boolean, default: false },

    // Physical attributes
    weight: { type: Number, default: 0 }, // grams
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },

    // Fashion specific
    fabric: { type: String, default: "" },
    fit: {
      type: String,
      enum: ["Slim Fit", "Regular Fit", "Oversized", "Relaxed", ""],
      default: "",
    },
    occasion: [{ type: String }],
    season: [
      {
        type: String,
        enum: ["Spring", "Summer", "Fall", "Winter", "All Season"],
      },
    ],
    washCare: { type: String, default: "" },
    countryOfOrigin: { type: String, default: "India" },

    // Sizes available (flat, for simple products)
    sizes: [{ type: String }],
    colors: [
      {
        name: String,
        hex: String,
        images: [{ url: String, publicId: String }],
      },
    ],

    // Variants (complex products)
    variants: [variantSchema],
    hasVariants: { type: Boolean, default: false },

    // Stock (for simple products)
    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    isInStock: { type: Boolean, default: true },
    trackInventory: { type: Boolean, default: true },

    // Custom printing support
    supportsCustomPrint: { type: Boolean, default: false },
    printAreas: [
      {
        type: String,
        enum: ["front", "back", "left_sleeve", "right_sleeve", "neck"],
      },
    ],

    // Status
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },

    // Stats
    reviewSummary: reviewSummarySchema,
    viewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
    searchScore: { type: Number, default: 0 },

    // SEO
    metaTitle: { type: String, maxlength: 70 },
    metaDescription: { type: String, maxlength: 160 },
    metaKeywords: [String],

    // Shipping
    freeShipping: { type: Boolean, default: false },
    shippingDays: { type: String, default: "3-7 days" },
    isReturnable: { type: Boolean, default: true },
    returnDays: { type: Number, default: 7 },

    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Indexes
productSchema.index({
  name: "text",
  description: "text",
  tags: "text",
  brand: "text",
});
productSchema.index({ category: 1, isActive: 1, isInStock: 1 });
productSchema.index({ price: 1, isFeatured: 1, isNewArrival: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ "reviewSummary.average": -1 });
productSchema.index(
  { "variants.sku": 1 },
  {
    unique: true,
    sparse: true,
  },
);
// Auto-generate slug and SKU
productSchema.pre("save", async function (next) {
  if (this.isModified("name") && !this.slug) {
    let slug = slugify(this.name, { lower: true, strict: true });
    let count = 0;
    while (
      await mongoose.model("Product").findOne({ slug, _id: { $ne: this._id } })
    ) {
      slug = `${slugify(this.name, { lower: true, strict: true })}-${++count}`;
    }
    this.slug = slug;
  }

  if (!this.sku) {
    this.sku = "OP-" + Date.now().toString(36).toUpperCase();
  }

  this.isInStock = this.hasVariants
    ? this.variants.some((v) => v.stock > 0)
    : this.stock > 0;

  next();
});

// Virtual for discount percentage
productSchema.virtual("discountPercentage").get(function () {
  if (!this.comparePrice || this.comparePrice <= this.price) return 0;
  return Math.round(
    ((this.comparePrice - this.price) / this.comparePrice) * 100,
  );
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
