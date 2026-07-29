"use strict";
const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, default: "" },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    banner: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    level: { type: Number, default: 0 }, // 0 = root, 1 = subcategory
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
    metaTitle: { type: String },
    metaDescription: { type: String },
  },
  { timestamps: true },
);

categorySchema.index({ parent: 1, name: 1 }, { unique: true });

categorySchema.index({ parent: 1, isActive: 1 });

categorySchema.pre("save", async function (next) {
  if (this.isModified("name") || !this.slug) {
    let slug = slugify(this.name, { lower: true, strict: true });
    let count = 0;
    while (
      await mongoose.model("Category").findOne({ slug, _id: { $ne: this._id } })
    ) {
      slug = `${slugify(this.name, { lower: true, strict: true })}-${++count}`;
    }
    this.slug = slug;
  }
  if (this.parent) this.level = 1;
  next();
});

module.exports = mongoose.model("Category", categorySchema);
