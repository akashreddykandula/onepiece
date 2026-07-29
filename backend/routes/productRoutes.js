'use strict';
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public
router.get('/', ctrl.getProducts);
router.get('/featured', ctrl.getFeaturedProducts);
router.get('/new-arrivals', ctrl.getNewArrivals);
router.get('/best-sellers', ctrl.getBestSellers);
router.get('/trending', ctrl.getTrendingProducts);
router.get('/search/suggestions', ctrl.getSearchSuggestions);
router.get('/admin/all', ...admin, ctrl.getAllProductsAdmin);
router.get('/:slug/related', ctrl.getRelatedProducts);
router.get('/:slug', ctrl.getProduct);

// Admin
router.post('/', ...admin, ctrl.createProduct);
router.put('/:id', ...admin, ctrl.updateProduct);
router.delete('/:id', ...admin, ctrl.deleteProduct);
router.patch('/:id/stock', ...admin, ctrl.updateStock);

module.exports = router;
