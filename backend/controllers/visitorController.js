"use strict";

const Visitor = require("../models/Visitor");

exports.registerVisitor = async (req, res, next) => {
  try {
    const { visitorId } = req.body;

    if (!visitorId) {
      return res.status(400).json({
        success: false,
        message: "visitorId is required",
      });
    }

    // Create visitor only if this visitorId has never been seen before
    const visitor = await Visitor.findOneAndUpdate(
      { visitorId },
      { $setOnInsert: { visitorId } },
      {
        new: true,
        upsert: true,
      },
    );

    const totalVisitors = await Visitor.countDocuments();

    res.status(200).json({
      success: true,
      isNewVisitor: visitor.createdAt.getTime() === visitor.updatedAt.getTime(),
      totalVisitors,
    });
  } catch (error) {
    next(error);
  }
};
exports.getVisitorCount = async (req, res, next) => {
  try {
    const totalVisitors = await Visitor.countDocuments();

    res.status(200).json({
      success: true,
      totalVisitors,
    });
  } catch (error) {
    next(error);
  }
};
