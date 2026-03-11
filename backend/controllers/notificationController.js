const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(50);
  res.json(notifications);
});

const markAsRead = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const n = await Notification.findOneAndUpdate({ _id: id, user: req.user._id }, { read: true }, { new: true });
  if (!n) {
    res.status(404);
    throw new Error('Notification not found');
  }
  res.json(n);
});

module.exports = { getNotifications, markAsRead };