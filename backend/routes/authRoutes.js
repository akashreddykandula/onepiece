'use strict';
// authRoutes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.put('/reset-password/:token', ctrl.resetPassword);
router.get('/verify-reset-token/:token', ctrl.verifyResetToken);

router.get('/me', protect, ctrl.getMe);
router.put('/update-profile', protect, ctrl.updateProfile);
router.put('/change-password', protect, ctrl.changePassword);
router.post('/wishlist/:productId', protect, ctrl.toggleWishlist);
router.post('/recently-viewed/:productId', protect, ctrl.addRecentlyViewed);
router.post('/addresses', protect, ctrl.addAddress);
router.put('/addresses/:addressId', protect, ctrl.updateAddress);
router.delete('/addresses/:addressId', protect, ctrl.deleteAddress);

module.exports = router;
