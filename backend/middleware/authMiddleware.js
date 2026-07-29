'use strict';
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorMiddleware');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -refreshToken');

    if (!user) {
      return next(new AppError('User no longer exists.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Contact support.', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (e) {
    // ignore — user stays unauthenticated
  }
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required.', 401));
  if (!roles.includes(req.user.role)) {
    return next(new AppError(`Access denied. Requires role: ${roles.join(' or ')}.`, 403));
  }
  next();
};

const admin = [protect, authorize('admin', 'superadmin')];

module.exports = { protect, optionalAuth, authorize, admin };
