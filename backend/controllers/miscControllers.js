"use strict";
const Category = require("../models/Category");
const {
  Coupon,
  Banner,
  Return,
  CMS,
  Notification,
  PrintJob,
} = require("../models/index");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../config/cloudinary");
const { AppError } = require("../middleware/errorMiddleware");
const emailService = require("../services/emailService");
const { getIO, getOnlineUsersCount } = require("../socket");

// ─── Category ─────────────────────────────────────────────────────────────────
exports.getCategories = async (req, res) => {
  const { includeSubcategories = true, featured } = req.query;

  const query = { isActive: true, parent: null };
  if (featured === "true") query.isFeatured = true;

  const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 });

  if (includeSubcategories === "true") {
    const withSubs = await Promise.all(
      categories.map(async (cat) => {
        const subcategories = await Category.find({
          parent: cat._id,
          isActive: true,
        }).sort({ sortOrder: 1 });

        return {
          ...cat.toObject(),
          subcategories,
        };
      }),
    );

    return res.json({
      success: true,
      categories: withSubs,
    });
  }

  return res.json({
    success: true,
    categories,
  });
};

exports.getCategory = async (req, res, next) => {
  const category = await Category.findOne({
    slug: req.params.slug,
    isActive: true,
  });
  if (!category) return next(new AppError("Category not found.", 404));
  const subcategories = await Category.find({
    parent: category._id,
    isActive: true,
  });
  res.json({
    success: true,
    category: { ...category.toObject(), subcategories },
  });
};

exports.createCategory = async (req, res) => {
  const data = { ...req.body };

  // Determine level based on parent
  if (data.parent) {
    data.level = 1;
  } else {
    data.parent = null;
    data.level = 0;
  }

  const category = await Category.create(data);

  getIO().emit("categoryCreated", {
    categoryId: category._id,
  });

  res.status(201).json({
    success: true,
    category,
  });
};
exports.updateCategory = async (req, res, next) => {
  const data = { ...req.body };

  const category = await Category.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  });

  if (!category) return next(new AppError("Category not found.", 404));
  getIO().emit("categoryUpdated", {
    categoryId: category._id,
  });
  res.json({
    success: true,
    category,
  });
};

exports.deleteCategory = async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError("Category not found.", 404));
  }

  // Check subcategories
  const subcategories = await Category.countDocuments({
    parent: category._id,
  });

  if (subcategories > 0) {
    return next(
      new AppError(
        "Delete all subcategories before deleting this category.",
        400,
      ),
    );
  }

  // Check products
  const products = await Product.countDocuments({
    category: category._id,
  });

  if (products > 0) {
    return next(
      new AppError("Cannot delete category because products exist.", 400),
    );
  }

  await Category.findByIdAndDelete(category._id);
  getIO().emit("categoryDeleted", {
    categoryId: category._id,
  });
  res.json({
    success: true,
    message: "Category deleted successfully.",
  });
};
// ─── Coupon ───────────────────────────────────────────────────────────────────
exports.getCoupons = async (req, res) => {
  const coupons = await Coupon.find({ isActive: true }).sort({ createdAt: -1 });
  res.json({ success: true, coupons });
};

exports.validateCoupon = async (req, res, next) => {
  const { code, subtotal } = req.body;
  if (!code) return next(new AppError("Coupon code is required.", 400));

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });
  if (!coupon || !coupon.isValid)
    return next(new AppError("Invalid or expired coupon.", 400));
  if (subtotal && subtotal < coupon.minOrderAmount) {
    return next(
      new AppError(`Minimum order amount is ₹${coupon.minOrderAmount}.`, 400),
    );
  }

  const discount =
    coupon.discountType === "percentage"
      ? Math.min(
          (subtotal * coupon.discountValue) / 100,
          coupon.maxDiscountAmount || Infinity,
        )
      : coupon.discountValue;

  res.json({
    success: true,
    coupon,
    discount: Math.min(discount, subtotal || discount),
  });
};

exports.createCoupon = async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
};

exports.updateCoupon = async (req, res, next) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!coupon) return next(new AppError("Coupon not found.", 404));
  res.json({ success: true, coupon });
};

exports.deleteCoupon = async (req, res, next) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Coupon deleted." });
};

exports.sendCouponToUser = async (req, res, next) => {
  const { userId, couponId } = req.body;
  const [user, coupon] = await Promise.all([
    User.findById(userId),
    Coupon.findById(couponId),
  ]);
  if (!user || !coupon)
    return next(new AppError("User or coupon not found.", 404));
  await emailService.sendCouponToUser(user, coupon);
  res.json({ success: true, message: "Coupon sent." });
};

// ─── Banner ───────────────────────────────────────────────────────────────────
exports.getBanners = async (req, res) => {
  const { type, position } = req.query;
  const query = { isActive: true };
  if (type) query.type = type;
  if (position) query.position = position;
  const now = new Date();
  query.$and = [
    { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
    { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
  ];
  const banners = await Banner.find(query).sort({ sortOrder: 1 });
  res.json({ success: true, banners });
};

exports.getAllBannersAdmin = async (req, res) => {
  const banners = await Banner.find().sort({ sortOrder: 1, createdAt: -1 });
  res.json({ success: true, banners });
};

exports.createBanner = async (req, res) => {
  const banner = await Banner.create(req.body);
  res.status(201).json({ success: true, banner });
};

exports.updateBanner = async (req, res, next) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!banner) return next(new AppError("Banner not found.", 404));
  res.json({ success: true, banner });
};

exports.deleteBanner = async (req, res, next) => {
  await Banner.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Banner deleted." });
};

// ─── Upload ───────────────────────────────────────────────────────────────────
exports.uploadImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError("No files uploaded.", 400));
  }
  const folder = req.query.folder || "products";
  const results = await Promise.all(
    req.files.map((file) =>
      uploadToCloudinary(file.buffer, {
        folder: `onepiece/${folder}`,
        transformation: [{ quality: "auto:good", fetch_format: "auto" }],
      }),
    ),
  );
  const images = results.map((r) => ({
    url: r.secure_url,
    publicId: r.public_id,
  }));
  res.json({ success: true, images });
};

exports.uploadSingle = async (req, res, next) => {
  if (!req.file) return next(new AppError("No file uploaded.", 400));
  const folder = req.query.folder || "general";
  const result = await uploadToCloudinary(req.file.buffer, {
    folder: `onepiece/${folder}`,
    transformation: [{ quality: "auto:good", fetch_format: "auto" }],
  });
  res.json({
    success: true,
    url: result.secure_url,
    publicId: result.public_id,
  });
};

exports.deleteImage = async (req, res, next) => {
  const { publicId } = req.body;
  if (!publicId) return next(new AppError("Public ID required.", 400));
  await deleteFromCloudinary(publicId);
  res.json({ success: true, message: "Image deleted." });
};

// ─── Analytics ────────────────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalOrders,
    totalUsers,
    totalProducts,
    revenueData,
    monthlyRevenueData,
    lastMonthRevenue,
    ordersByStatus,
    recentOrders,
    topProducts,
    pendingOrders,
    returnsCount,
  ] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments({ role: "customer" }),
    Product.countDocuments({ isActive: true }),
    Order.aggregate([
      { $match: { "paymentInfo.status": "paid" } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]),
    Order.aggregate([
      {
        $match: {
          "paymentInfo.status": "paid",
          createdAt: { $gte: startOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$pricing.total" },
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          "paymentInfo.status": "paid",
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } },
    ]),
    Order.aggregate([{ $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
    Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "orderNumber pricing paymentInfo orderStatus createdAt user guestInfo",
      ),
    Product.find({ isActive: true })
      .sort({ soldCount: -1 })
      .limit(5)
      .select("name images price soldCount"),
    Order.countDocuments({ orderStatus: "pending" }),
    Order.countDocuments({
      orderStatus: { $in: ["return_requested", "returned"] },
    }),
  ]);

  // Daily revenue for chart (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dailyRevenue = await Order.aggregate([
    {
      $match: {
        "paymentInfo.status": "paid",
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$pricing.total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthRevenue = monthlyRevenueData[0]?.total || 0;
  const prevMonthRevenue = lastMonthRevenue[0]?.total || 0;
  const revenueGrowth =
    prevMonthRevenue > 0
      ? Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
      : 100;

  res.json({
    success: true,
    stats: {
      totalRevenue: revenueData[0]?.total || 0,
      monthRevenue,
      revenueGrowth,
      totalOrders,
      monthOrders: monthlyRevenueData[0]?.count || 0,
      totalUsers,
      onlineUsers: getOnlineUsersCount(),
      totalProducts,
      pendingOrders,
      returnsCount,
    },
    ordersByStatus,
    recentOrders,
    topProducts,
    dailyRevenue,
  });
};

exports.getSalesAnalytics = async (req, res) => {
  const { period = "30d" } = req.query;
  const days =
    period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [salesData, categoryRevenue, topProducts] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          "paymentInfo.status": "paid",
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$pricing.total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      {
        $match: {
          "paymentInfo.status": "paid",
          createdAt: { $gte: startDate },
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$category.name",
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]),
    Product.find({ isActive: true })
      .sort({ soldCount: -1 })
      .limit(10)
      .select("name images price soldCount viewCount category")
      .populate("category", "name"),
  ]);

  res.json({ success: true, salesData, categoryRevenue, topProducts });
};

// ─── Return ───────────────────────────────────────────────────────────────────
exports.createReturn = async (req, res, next) => {
  const {
    orderId,
    items,
    returnType,
    reason,
    comment,
    pickupAddress,
    refundDetails,
  } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return next(new AppError("Order not found.", 404));
  if (order.user.toString() !== req.user._id.toString()) {
    return next(new AppError("Access denied.", 403));
  }
  if (order.orderStatus !== "delivered") {
    return next(new AppError("Only delivered orders can be returned.", 400));
  }
  const returnRequest = await Return.create({
    order: orderId,
    user: req.user._id,
    items,
    returnType,
    reason,
    comment,
    pickupAddress: order.shippingAddress,

    refundMethod: refundDetails?.method,

    upiId: refundDetails?.upiId,

    bankDetails: refundDetails?.bankAccount,

    timeline: [
      {
        status: "pending",
        message: "Return request submitted by customer.",
      },
    ],
  });
  order.orderStatus = "return_requested";
  order.timeline.push({
    status: "return_requested",
    message: "Return requested by customer.",
  });
  await order.save();
  console.log("📦 Emitting returnRequestCreated", returnRequest._id);

  getIO().emit("returnRequestCreated", {
    returnRequestId: returnRequest._id,
  });
  res.status(201).json({ success: true, return: returnRequest });
};

exports.getMyReturns = async (req, res) => {
  const returns = await Return.find({ user: req.user._id })
    .populate("order", "orderNumber")
    .sort({ createdAt: -1 });
  res.json({ success: true, returns });
};

exports.getAllReturns = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};
  const [returns, total] = await Promise.all([
    Return.find(query)
      .populate("user", "name email")
      .populate("order", "orderNumber")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Return.countDocuments(query),
  ]);
  res.json({ success: true, returns, total });
};
exports.getReturnById = async (req, res, next) => {
  const returnRequest = await Return.findById(req.params.id)
    .populate("user", "name email phone")
    .populate("order")
    .populate("items.product", "name slug images");

  if (!returnRequest) {
    return next(new AppError("Return request not found.", 404));
  }

  res.json({
    success: true,
    return: returnRequest,
  });
};
exports.updateReturnStatus = async (req, res, next) => {
  const { status, adminNotes, refundAmount, refundMethod } = req.body;
  const returnReq = await Return.findById(req.params.id);

  if (!returnReq) return next(new AppError("Return request not found.", 404));

  returnReq.status = status;

  if (adminNotes !== undefined) returnReq.adminNotes = adminNotes;

  if (refundAmount !== undefined) returnReq.refundAmount = refundAmount;

  if (refundMethod !== undefined) returnReq.refundMethod = refundMethod;

  const timelineMessages = {
    pending: "Return request submitted by customer.",
    approved: "Return request approved by our team.",
    pickup_scheduled: "Pickup has been scheduled.",
    picked_up: "Package has been collected.",
    processing: "Returned product is under quality inspection.",
    refund_initiated: "Refund has been initiated.",
    completed: "Refund completed successfully.",
    rejected: "Return request was rejected.",
  };

  returnReq.timeline.push({
    status,
    message:
      timelineMessages[status] ||
      `Return status updated to ${status.replace(/_/g, " ")}.`,
    timestamp: new Date(),
  });
  await returnReq.save();
  console.log("📦 Emitting returnStatusUpdated", returnReq._id);

  getIO().emit("returnStatusUpdated", {
    returnId: returnReq._id,
    orderId: returnReq.order,
  });
  if (!returnReq) return next(new AppError("Return request not found.", 404));
  if (status === "completed") {
    await Order.findByIdAndUpdate(returnReq.order, {
      orderStatus: "returned",
      $push: {
        timeline: {
          status: "returned",
          message: "Return completed and refund initiated.",
        },
      },
    });

    getIO().emit("orderUpdated", {
      orderId: returnReq.order,
    });
  }
  res.json({ success: true, return: returnReq });
};

// ─── CMS ──────────────────────────────────────────────────────────────────────
exports.getCMSPage = async (req, res, next) => {
  const page = await CMS.findOne({ slug: req.params.slug, isActive: true });
  if (!page) return next(new AppError("Page not found.", 404));
  res.json({ success: true, page });
};

exports.getAllCMSPages = async (req, res) => {
  const pages = await CMS.find().sort({ updatedAt: -1 });
  res.json({ success: true, pages });
};

exports.upsertCMSPage = async (req, res) => {
  const { slug } = req.params;
  const page = await CMS.findOneAndUpdate(
    { slug },
    { ...req.body, lastEditedBy: req.user._id },
    { new: true, upsert: true, runValidators: true },
  );
  res.json({ success: true, page });
};

// ─── Notifications ────────────────────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(30);
  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });
  res.json({ success: true, notifications, unreadCount });
};

exports.markNotificationsRead = async (req, res) => {
  const { ids } = req.body;
  const query = ids
    ? { _id: { $in: ids }, user: req.user._id }
    : { user: req.user._id };
  await Notification.updateMany(query, { isRead: true, readAt: new Date() });
  res.json({ success: true });
};

// ─── Print Jobs ───────────────────────────────────────────────────────────────
exports.submitPrintJob = async (req, res) => {
  const printJob = await PrintJob.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, printJob });
};

exports.getAllPrintJobs = async (req, res) => {
  const { status } = req.query;
  const query = status ? { status } : {};
  const printJobs = await PrintJob.find(query)
    .populate("user", "name email")
    .populate("product", "name")
    .sort({ createdAt: -1 });
  res.json({ success: true, printJobs });
};

exports.updatePrintJobStatus = async (req, res, next) => {
  const job = await PrintJob.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!job) return next(new AppError("Print job not found.", 404));
  res.json({ success: true, printJob: job });
};

// ─── Admin Users ──────────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  const { page = 1, limit = 20, search, role } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search)
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select("-password"),
    User.countDocuments(query),
  ]);
  res.json({
    success: true,
    users,
    total,
    pages: Math.ceil(total / Number(limit)),
  });
};

exports.getUserDetails = async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return next(new AppError("User not found.", 404));
  const orders = await Order.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("orderNumber pricing orderStatus createdAt");
  res.json({ success: true, user, orders });
};

exports.toggleUserStatus = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError("User not found.", 404));
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, isActive: user.isActive });
};
