'use strict';
const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: { type: String },
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String, required: true },
  slug: { type: String },
  image: { type: String, required: true },
  size: { type: String },
  color: { type: String },
  colorHex: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  comparePrice: { type: Number, default: 0 },
  sku: { type: String },
  // Custom print
  isCustomPrint: { type: Boolean, default: false },
  customPrint: {
    files: [{ url: String, publicId: String, name: String }],
    printArea: String,
    text: String,
    notes: String,
  },
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestInfo: {
    name: String,
    email: String,
    phone: String,
  },

  items: [orderItemSchema],

  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },

  pricing: {
    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 18 },
    total: { type: Number, required: true },
  },

  coupon: {
    code: String,
    discountAmount: Number,
    discountType: String,
  },

  paymentInfo: {
    method: { type: String, enum: ['razorpay', 'cod', 'upi', 'wallet'], default: 'razorpay' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded', 'partial_refund'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paidAt: Date,
    refundId: String,
    refundAmount: Number,
    refundedAt: Date,
  },

  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned'],
    default: 'pending',
  },

  timeline: [timelineEventSchema],

  tracking: {
    courier: String,
    trackingNumber: String,
    trackingUrl: String,
    estimatedDelivery: Date,
    deliveredAt: Date,
  },

  notes: String,
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: { type: String, enum: ['customer', 'admin', null], default: null },

  invoiceNumber: { type: String, unique: true, sparse: true },

  loyaltyPointsEarned: { type: Number, default: 0 },
  loyaltyPointsUsed: { type: Number, default: 0 },
}, { timestamps: true });

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ 'paymentInfo.status': 1 });

// Auto-generate order number and invoice
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'OP' + Date.now().toString().slice(-10).toUpperCase();
  }
  if (this.orderStatus === 'delivered' && !this.invoiceNumber) {
    this.invoiceNumber = 'INV-OP-' + Date.now().toString().slice(-8);
  }
  // Auto-set estimated delivery if not set
  if (!this.tracking.estimatedDelivery && this.isNew) {
    this.tracking.estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
