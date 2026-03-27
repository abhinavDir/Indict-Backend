import Notification from "../models/notification.js";


/* ========== GET USER NOTIFICATIONS ========== */

export const getNotifications = async (req, res) => {

  try {

    const notifications = await Notification.find({
      user: req.userId
    })
      .populate("sender", "username profileImage")
      .populate("post", "media")
      .sort({ createdAt: -1 });

    res.status(200).json(notifications);

  } catch (err) {

    res.status(500).json({ message: err.message });

  }
};



/* ========== MARK AS READ ========== */

export const markAsRead = async (req, res) => {

  try {

    await Notification.updateMany(
      { user: req.userId },
      { isRead: true }
    );

    res.status(200).json({ success: true });

  } catch (err) {

    res.status(500).json({ message: err.message });

  }
};
