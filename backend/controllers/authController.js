"use strict";
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require("../middleware/errorMiddleware");
const emailService = require("../services/emailService");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  return res.status(statusCode).json({
    success: true,
    token,
    user: user.toPublicJSON ? user.toPublicJSON() : user,
  });
};

// POST /api/auth/register
exports.register = async (req, res, next) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return next(new AppError("Name, email, and password are required.", 400));
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing)
    return next(
      new AppError("An account with this email already exists.", 409),
    );

  const user = await User.create({ name, email, password, phone });

  emailService
    .sendWelcome(user)
    .catch((e) => console.error("Welcome email:", e.message));
  emailService

    .sendAdminNewUser(user)

    .catch((e) => console.error("Admin new user email:", e.message));

  user.lastLogin = new Date();
  user.loginCount = 1;
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 201, res);
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError("Email and password are required.", 400));

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );
  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError("Invalid email or password.", 401));
  }
  if (!user.isActive) {
    return next(
      new AppError(
        "Account deactivated. Contact onepiece.fashion99@gmail.com.",
        401,
      ),
    );
  }

  user.lastLogin = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user._id).populate(
    "wishlist",
    "name images price comparePrice slug isInStock",
  );
  if (!user) return next(new AppError("User not found.", 404));
  res.json({ success: true, user: user.toPublicJSON() });
};

// PUT /api/auth/update-profile
exports.updateProfile = async (req, res, next) => {
  const { name, phone, gender, dateOfBirth, notifications } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (gender !== undefined) updates.gender = gender;
  if (dateOfBirth) updates.dateOfBirth = dateOfBirth;
  if (notifications) updates.notifications = notifications;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, user: user.toPublicJSON() });
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(new AppError("Current and new passwords are required.", 400));
  }
  if (newPassword.length < 8) {
    return next(
      new AppError("New password must be at least 8 characters.", 400),
    );
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.matchPassword(currentPassword))) {
    return next(new AppError("Current password is incorrect.", 400));
  }
  if (currentPassword === newPassword) {
    return next(
      new AppError(
        "New password must be different from current password.",
        400,
      ),
    );
  }

  user.password = newPassword;
  await user.save();
  createSendToken(user, 200, res);
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError("Email is required.", 400));

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal if email exists
    return res.json({
      success: true,
      message: "If this email is registered, a reset link has been sent.",
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  emailService
    .sendPasswordReset(user, resetUrl)
    .catch((e) => console.error("Reset email error:", e.message));

  res.json({
    success: true,
    message: "If this email is registered, a reset link has been sent.",
  });
};

// PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    return next(new AppError("Password must be at least 8 characters.", 400));
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user)
    return next(new AppError("Reset link is invalid or has expired.", 400));

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  createSendToken(user, 200, res);
};

// GET /api/auth/verify-reset-token/:token
exports.verifyResetToken = async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  res.json({ success: true, valid: !!user });
};

// Wishlist
exports.toggleWishlist = async (req, res, next) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);
  const idx = user.wishlist.findIndex((id) => id.toString() === productId);
  let added;
  if (idx > -1) {
    user.wishlist.splice(idx, 1);
    added = false;
    await User.findByIdAndUpdate(req.user._id, { $inc: { wishlistCount: -1 } });
  } else {
    user.wishlist.unshift(productId);
    added = true;
  }
  await user.save();
  res.json({ success: true, added, wishlist: user.wishlist });
};

// Address Management
exports.addAddress = async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses });
};

exports.updateAddress = async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addressId);
  if (!addr) return next(new AppError("Address not found.", 404));
  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  Object.assign(addr, req.body);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
};

exports.deleteAddress = async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { addresses: { _id: req.params.addressId } },
  });
  res.json({ success: true, message: "Address deleted." });
};

// Recently viewed
exports.addRecentlyViewed = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { recentlyViewed: req.params.productId },
  });
  await User.findByIdAndUpdate(req.user._id, {
    $push: {
      recentlyViewed: {
        $each: [req.params.productId],
        $position: 0,
        $slice: 20,
      },
    },
  });
  res.json({ success: true });
};
