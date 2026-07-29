"use strict";
const express = require("express");
const multer = require("multer");
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  sendCouponToUser,
  getBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
  uploadImages,
  uploadSingle,
  deleteImage,
  getDashboard,
  getSalesAnalytics,
  createReturn,
  getMyReturns,
  getAllReturns,
  updateReturnStatus,
  getCMSPage,
  getAllCMSPages,
  upsertCMSPage,
  getNotifications,
  markNotificationsRead,
  submitPrintJob,
  getAllPrintJobs,
  updatePrintJobStatus,
  getAllUsers,
  getUserDetails,
  toggleUserStatus,
  getReturnById,
} = require("../controllers/miscControllers");
const orderCtrl = require("../controllers/orderController");
const paymentCtrl = require("../controllers/paymentController");
const reviewCtrl = require("../controllers/reviewController");
const {
  protect,
  admin,
  optionalAuth,
} = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else
      cb(new Error("Invalid file type. Only images and PDFs allowed."), false);
  },
});

// ─── Category Routes ──────────────────────────────────────────────────────────
const categoryRouter = express.Router();
categoryRouter.get("/", getCategories);
categoryRouter.get("/:slug", getCategory);
categoryRouter.post("/", ...admin, createCategory);
categoryRouter.put("/:id", ...admin, updateCategory);
categoryRouter.delete("/:id", ...admin, deleteCategory);

// ─── Order Routes ─────────────────────────────────────────────────────────────
const orderRouter = express.Router();
orderRouter.post("/", optionalAuth, orderCtrl.createOrder);
orderRouter.post("/track", orderCtrl.trackOrder);
orderRouter.get("/my", protect, orderCtrl.getMyOrders);
orderRouter.get("/admin/all", ...admin, orderCtrl.getAllOrders);
orderRouter.get("/:id", optionalAuth, orderCtrl.getOrder);
orderRouter.put("/:id/cancel", optionalAuth, orderCtrl.cancelOrder);
orderRouter.put("/:id/status", ...admin, orderCtrl.updateOrderStatus);

// ─── Payment Routes ───────────────────────────────────────────────────────────
const paymentRouter = express.Router();
paymentRouter.post(
  "/create-order",
  optionalAuth,
  paymentCtrl.createRazorpayOrder,
);
paymentRouter.post(
  "/custom-print",
  protect,
  paymentCtrl.createCustomPrintPayment,
);
paymentRouter.post("/verify", optionalAuth, paymentCtrl.verifyPayment);
paymentRouter.post("/failed", optionalAuth, paymentCtrl.paymentFailed);
paymentRouter.post("/refund", ...admin, paymentCtrl.initiateRefund);
paymentRouter.get("/transactions", ...admin, paymentCtrl.getTransactions);

// ─── Review Routes ────────────────────────────────────────────────────────────
const reviewRouter = express.Router();
reviewRouter.get("/product/:productId", reviewCtrl.getProductReviews);
reviewRouter.get("/admin/all", ...admin, reviewCtrl.getAllReviewsAdmin);
reviewRouter.post("/", protect, reviewCtrl.createReview);
reviewRouter.post("/:id/helpful", protect, reviewCtrl.markHelpful);
reviewRouter.put("/:id/reply", ...admin, reviewCtrl.replyToReview);
reviewRouter.patch("/:id/approve", ...admin, reviewCtrl.approveReview);
reviewRouter.delete("/:id", ...admin, reviewCtrl.deleteReview);

// ─── Coupon Routes ────────────────────────────────────────────────────────────
const couponRouter = express.Router();
couponRouter.post("/validate", optionalAuth, validateCoupon);
couponRouter.get("/", ...admin, getCoupons);
couponRouter.post("/", ...admin, createCoupon);
couponRouter.post("/send", ...admin, sendCouponToUser);
couponRouter.put("/:id", ...admin, updateCoupon);
couponRouter.delete("/:id", ...admin, deleteCoupon);

// ─── Banner Routes ────────────────────────────────────────────────────────────
const bannerRouter = express.Router();
bannerRouter.get("/", getBanners);
bannerRouter.get("/admin/all", ...admin, getAllBannersAdmin);
bannerRouter.post("/", ...admin, createBanner);
bannerRouter.put("/:id", ...admin, updateBanner);
bannerRouter.delete("/:id", ...admin, deleteBanner);

// ─── Upload Routes ────────────────────────────────────────────────────────────
const uploadRouter = express.Router();
uploadRouter.post("/images", protect, upload.array("images", 10), uploadImages);
uploadRouter.post("/single", ...admin, upload.single("image"), uploadSingle);
uploadRouter.delete("/image", ...admin, deleteImage);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
const adminRouter = express.Router();
adminRouter.get("/dashboard", ...admin, getDashboard);
adminRouter.get("/users", ...admin, getAllUsers);
adminRouter.get("/users/:id", ...admin, getUserDetails);
adminRouter.patch("/users/:id/toggle", ...admin, toggleUserStatus);

// ─── Analytics Routes ─────────────────────────────────────────────────────────
const analyticsRouter = express.Router();
analyticsRouter.get("/dashboard", ...admin, getDashboard);
analyticsRouter.get("/sales", ...admin, getSalesAnalytics);

// ─── CMS Routes ───────────────────────────────────────────────────────────────
const cmsRouter = express.Router();
cmsRouter.get("/", getAllCMSPages);
cmsRouter.get("/:slug", getCMSPage);
cmsRouter.put("/:slug", ...admin, upsertCMSPage);

// ─── Return Routes ────────────────────────────────────────────────────────────
const returnRouter = express.Router();

returnRouter.post("/", protect, createReturn);

returnRouter.get("/my", protect, getMyReturns);

returnRouter.get("/admin/all", ...admin, getAllReturns);

returnRouter.get("/admin/:id", ...admin, getReturnById);

returnRouter.put("/:id/status", ...admin, updateReturnStatus);
// ─── Notification Routes ──────────────────────────────────────────────────────
const notificationRouter = express.Router();
notificationRouter.get("/", protect, getNotifications);
notificationRouter.put("/mark-read", protect, markNotificationsRead);

// ─── Print Routes ─────────────────────────────────────────────────────────────
const printRouter = express.Router();
printRouter.post("/", protect, upload.array("files", 5), submitPrintJob);
printRouter.get("/admin/all", ...admin, getAllPrintJobs);
printRouter.put("/admin/:id", ...admin, updatePrintJobStatus);

// ─── User Routes ──────────────────────────────────────────────────────────────
const userRouter = express.Router();
userRouter.get("/", ...admin, getAllUsers);
userRouter.get("/:id", ...admin, getUserDetails);
userRouter.patch("/:id/toggle", ...admin, toggleUserStatus);

module.exports = {
  categoryRouter,
  orderRouter,
  paymentRouter,
  reviewRouter,
  couponRouter,
  bannerRouter,
  uploadRouter,
  adminRouter,
  analyticsRouter,
  cmsRouter,
  returnRouter,
  notificationRouter,
  printRouter,
  userRouter,
};
