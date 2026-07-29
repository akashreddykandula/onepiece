import Notification from "../models/notificationModel.js";

/**
 * GET /api/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json(notification);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

/**
 * PATCH /api/notifications/read-all
 */
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update notifications",
    });
  }
};
