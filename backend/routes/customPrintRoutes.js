// routes/customPrintRoutes.js
"use strict";

const express = require("express");
const multer = require("multer");
const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateStatus,
  uploadProof,
  uploadPreview,
  removePreview,
  customerApproval,
} = require("../controllers/customPrintController");

const { protect, admin } = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// User routes
router.post("/", protect, upload.array("designs", 5), createOrder);
router.get("/my", protect, getMyOrders);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/decision", protect, customerApproval);

// Admin routes
router.get("/admin/all", ...admin, getAllOrders);
router.put("/admin/:id/status", ...admin, updateStatus);
router.put(
  "/admin/:id/preview",
  ...admin,
  upload.single("preview"),
  uploadPreview,
);
router.put("/admin/:id/proof", ...admin, upload.single("proof"), uploadProof);
router.delete("/admin/:id/preview", ...admin, removePreview);

module.exports = router;
