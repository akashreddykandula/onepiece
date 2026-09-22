"use strict";

const { NewsletterSubscriber } = require("../models");
const emailService = require("../services/emailService");

exports.subscribe = async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const existingSubscriber = await NewsletterSubscriber.findOne({
      email,
    });

    if (existingSubscriber?.isActive) {
      return res.status(409).json({
        success: false,
        message: "This email is already subscribed.",
      });
    }

    let subscriber;

    if (existingSubscriber) {
      existingSubscriber.isActive = true;
      existingSubscriber.subscribedAt = new Date();
      existingSubscriber.unsubscribedAt = null;

      subscriber = await existingSubscriber.save();
    } else {
      subscriber = await NewsletterSubscriber.create({
        email,
      });
    }

    await emailService.sendNewsletterSubscription(email);

    return res.status(201).json({
      success: true,
      message: "Successfully subscribed to the ONE PIECE newsletter.",
      subscriber: {
        id: subscriber._id,
        email: subscriber.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
