'use strict';
const { Review } = require('../models/index');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { AppError } = require('../middleware/errorMiddleware');

const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
    {
      $group: {
        _id: '$product',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
        dist5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        dist4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        dist3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        dist2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        dist1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
      },
    },
  ]);

  const update = stats.length > 0
    ? {
        'reviewSummary.average': Math.round(stats[0].average * 10) / 10,
        'reviewSummary.count': stats[0].count,
        'reviewSummary.distribution.5': stats[0].dist5,
        'reviewSummary.distribution.4': stats[0].dist4,
        'reviewSummary.distribution.3': stats[0].dist3,
        'reviewSummary.distribution.2': stats[0].dist2,
        'reviewSummary.distribution.1': stats[0].dist1,
      }
    : { 'reviewSummary.average': 0, 'reviewSummary.count': 0 };

  await Product.findByIdAndUpdate(productId, update);
};

// POST /api/reviews
exports.createReview = async (req, res, next) => {
  const { product, rating, title, comment, images, orderId } = req.body;

  if (!product || !rating || !comment) {
    return next(new AppError('Product, rating, and comment are required.', 400));
  }

  const existingReview = await Review.findOne({ product, user: req.user._id });
  if (existingReview) {
    return next(new AppError('You have already reviewed this product.', 409));
  }

  let isVerifiedPurchase = false;
  if (orderId) {
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      'items.product': product,
      orderStatus: 'delivered',
    });
    isVerifiedPurchase = !!order;
  }

  const review = await Review.create({
    product,
    user: req.user._id,
    order: orderId,
    rating,
    title,
    comment,
    images,
    isVerifiedPurchase,
    isApproved: false, // admin approves
  });

  await updateProductRating(product);

  res.status(201).json({ success: true, review });
};

// GET /api/reviews/product/:productId
exports.getProductReviews = async (req, res) => {
  const { page = 1, limit = 10, sort = 'newest', rating: ratingFilter } = req.query;
  const query = { product: req.params.productId, isApproved: true };
  if (ratingFilter) query.rating = Number(ratingFilter);

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    helpful: { helpful: -1 },
    rating_high: { rating: -1 },
    rating_low: { rating: 1 },
  };

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate('user', 'name avatar')
      .sort(sortMap[sort] || { createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Review.countDocuments(query),
  ]);

  res.json({ success: true, reviews, total, pages: Math.ceil(total / Number(limit)) });
};

// POST /api/reviews/:id/helpful
exports.markHelpful = async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found.', 404));

  const alreadyMarked = review.helpfulBy.includes(req.user._id);
  if (alreadyMarked) {
    review.helpfulBy.pull(req.user._id);
    review.helpful = Math.max(0, review.helpful - 1);
  } else {
    review.helpfulBy.push(req.user._id);
    review.helpful += 1;
  }
  await review.save();
  res.json({ success: true, helpful: review.helpful, marked: !alreadyMarked });
};

// PUT /api/reviews/:id/reply (admin)
exports.replyToReview = async (req, res, next) => {
  const { comment } = req.body;
  const review = await Review.findByIdAndUpdate(req.params.id, {
    adminReply: { comment, repliedAt: new Date(), repliedBy: req.user._id },
  }, { new: true });
  if (!review) return next(new AppError('Review not found.', 404));
  res.json({ success: true, review });
};

// GET /api/reviews/admin/all (admin)
exports.getAllReviewsAdmin = async (req, res) => {
  const { page = 1, limit = 20, isApproved, productId } = req.query;
  const query = {};
  if (isApproved !== undefined) query.isApproved = isApproved === 'true';
  if (productId) query.product = productId;

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate('user', 'name email')
      .populate('product', 'name slug')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit)),
    Review.countDocuments(query),
  ]);
  res.json({ success: true, reviews, total });
};

// PATCH /api/reviews/:id/approve (admin)
exports.approveReview = async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { isApproved: req.body.isApproved }, { new: true });
  if (!review) return next(new AppError('Review not found.', 404));
  await updateProductRating(review.product);
  res.json({ success: true, review });
};

// DELETE /api/reviews/:id (admin)
exports.deleteReview = async (req, res, next) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) return next(new AppError('Review not found.', 404));
  await updateProductRating(review.product);
  res.json({ success: true, message: 'Review deleted.' });
};
