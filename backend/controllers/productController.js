"use strict";
const Product = require("../models/Product");
const Category = require("../models/Category");
const { AppError } = require("../middleware/errorMiddleware");
const { getIO } = require("../socket");
// GET /api/products
exports.getProducts = async (req, res) => {
  const {
    page = 1,
    limit = 16,
    category,
    subcategory,
    search,
    sort,
    minPrice,
    maxPrice,
    sizes,
    colors,
    brand,
    isFeatured,
    isNewArrival,
    isBestSeller,
    isTrending,
    isPremium,
    inStock,
    supportsCustomPrint,
    rating,
  } = req.query;

  const query = { isActive: true };

  if (category) {
    const cat = await Category.findOne({
      slug: category,
      isActive: true,
    });

    // If the requested category doesn't exist,
    // return no products instead of all products.
    if (!cat) {
      return res.json({
        success: true,
        products: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    query.category = cat._id;
  }
  if (subcategory) {
    const sub = await Category.findOne({ slug: subcategory });
    if (sub) query.subcategory = sub._id;
  }
  if (search) query.$text = { $search: search };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (sizes) query.sizes = { $in: sizes.split(",") };
  if (colors) query["colors.name"] = { $in: colors.split(",") };
  if (brand) query.brand = { $regex: brand, $options: "i" };

  if (isFeatured === "true") query.isFeatured = true;
  if (isNewArrival === "true") query.isNewArrival = true;
  if (isBestSeller === "true") query.isBestSeller = true;
  if (isTrending === "true") query.isTrending = true;
  if (isPremium === "true") query.isPremium = true;
  if (inStock === "true") query.isInStock = true;
  if (supportsCustomPrint === "true") query.supportsCustomPrint = true;
  if (rating) query["reviewSummary.average"] = { $gte: Number(rating) };

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    popular: { soldCount: -1 },
    rating: { "reviewSummary.average": -1 },
    trending: { viewCount: -1 },
  };
  const sortObj = sortMap[sort] || { sortOrder: 1, createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .select("-variants -washCare -metaTitle -metaDescription"),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
      hasNextPage: Number(page) < Math.ceil(total / Number(limit)),
      hasPrevPage: Number(page) > 1,
    },
  });
};

// GET /api/products/:slug
exports.getProduct = async (req, res, next) => {
  const product = await Product.findOne({
    $or: [
      { slug: req.params.slug },
      ...(req.params.slug.match(/^[0-9a-fA-F]{24}$/)
        ? [{ _id: req.params.slug }]
        : []),
    ],
    isActive: true,
  })
    .populate("category", "name slug")
    .populate("subcategory", "name slug");

  if (!product) return next(new AppError("Product not found.", 404));

  // Increment view count (non-blocking)
  Product.findByIdAndUpdate(product._id, { $inc: { viewCount: 1 } }).exec();

  res.json({ success: true, product });
};

// GET /api/products/featured
exports.getFeaturedProducts = async (req, res) => {
  const { limit = 8 } = req.query;
  const products = await Product.find({ isFeatured: true, isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(Number(limit))
    .select(
      "name slug images price comparePrice isOnSale reviewSummary isInStock brand tags",
    );
  res.json({ success: true, products });
};

// GET /api/products/new-arrivals
exports.getNewArrivals = async (req, res) => {
  const { limit = 8 } = req.query;
  const products = await Product.find({ isNewArrival: true, isActive: true })
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .select(
      "name slug images price comparePrice isOnSale reviewSummary isInStock brand tags",
    );
  res.json({ success: true, products });
};

// GET /api/products/best-sellers
exports.getBestSellers = async (req, res) => {
  const { limit = 8 } = req.query;
  const products = await Product.find({ isBestSeller: true, isActive: true })
    .sort({ soldCount: -1 })
    .limit(Number(limit))
    .select(
      "name slug images price comparePrice isOnSale reviewSummary isInStock brand soldCount tags",
    );
  res.json({ success: true, products });
};

// GET /api/products/trending
exports.getTrendingProducts = async (req, res) => {
  const { limit = 8 } = req.query;
  const products = await Product.find({ isTrending: true, isActive: true })
    .sort({ viewCount: -1 })
    .limit(Number(limit))
    .select(
      "name slug images price comparePrice isOnSale reviewSummary isInStock brand tags",
    );
  res.json({ success: true, products });
};

// GET /api/products/search/suggestions
exports.getSearchSuggestions = async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ success: true, suggestions: [] });

  const products = await Product.find({
    isActive: true,
    $or: [
      { name: { $regex: q, $options: "i" } },
      { brand: { $regex: q, $options: "i" } },
      { tags: { $in: [new RegExp(q, "i")] } },
    ],
  })
    .limit(8)
    .select("name slug images price brand");

  const categories = await Category.find({
    isActive: true,
    name: { $regex: q, $options: "i" },
  })
    .limit(4)
    .select("name slug image");

  res.json({ success: true, products, categories });
};

// GET /api/products/:id/related
exports.getRelatedProducts = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.json({ success: true, products: [] });

  const products = await Product.find({
    _id: { $ne: product._id },
    isActive: true,
    $or: [{ category: product.category }, { tags: { $in: product.tags } }],
  })
    .limit(8)
    .select(
      "name slug images price comparePrice isOnSale reviewSummary isInStock brand",
    );

  res.json({ success: true, products });
};

// ─── Admin CRUD ──────────────────────────────────────────────────────────────
// POST /api/products
exports.createProduct = async (req, res, next) => {
  const product = await Product.create(req.body);

  await Category.findByIdAndUpdate(product.category, {
    $inc: { productCount: 1 },
  });

  await product.populate("category", "name slug");
  await product.populate("subcategory", "name slug");
  getIO().emit("productCreated", {
    productId: product._id,
  });
  res.status(201).json({
    success: true,
    product,
  });
};

// PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  console.log("✏️ updateProduct called");

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) return next(new AppError("Product not found.", 404));

  await product.populate("category", "name slug");
  await product.populate("subcategory", "name slug");

  getIO().emit("productUpdated", {
    productId: product._id,
  });

  getIO().emit("productStockUpdated", {
    productId: product._id,
    stock: product.stock,
    isInStock: product.isInStock,
  });
  console.log("✅ productUpdated emitted");
  res.json({
    success: true,
    product,
  });
};
// DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError("Product not found.", 404));
  }

  await Category.findByIdAndUpdate(product.category, {
    $inc: { productCount: -1 },
  });
  getIO().emit("productDeleted", {
    productId: product._id,
  });

  res.json({
    success: true,
    message: "Product deleted permanently.",
  });
};

// GET /api/products/admin/all
exports.getAllProductsAdmin = async (req, res) => {
  const { page = 1, limit = 20, search, category, isActive } = req.query;
  const query = {};
  if (isActive === "true") {
    query.isActive = true;
  } else if (isActive === "false") {
    query.isActive = false;
  }
  if (category) query.category = category;
  if (search)
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { sku: { $regex: search, $options: "i" } },
    ];

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select(
        "name sku images price stock isActive isFeatured isNewArrival soldCount isInStock category subcategory createdAt",
      ),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    products,
    total,
    pages: Math.ceil(total / Number(limit)),
  });
};

// PATCH /api/products/:id/stock
exports.updateStock = async (req, res, next) => {
  const { stock, variantId } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError("Product not found.", 404));

  if (variantId) {
    const variant = product.variants.id(variantId);
    if (!variant) return next(new AppError("Variant not found.", 404));
    variant.stock = stock;
  } else {
    product.stock = stock;
    product.isInStock = stock > 0;
  }

  await product.save();

  getIO().emit("productStockUpdated", {
    productId: product._id,
    stock: product.stock,
    isInStock: product.isInStock,
  });
};
