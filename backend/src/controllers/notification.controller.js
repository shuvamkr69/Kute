import { Notification } from "../models/notification.model.js";

export const sendNotification = async (req, res) => {
  const { userId, title, message } = req.body;

  try {
    const notification = new Notification({ userId, title, message });
    await notification.save();
    res.status(201).json({ message: "Notification saved successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
