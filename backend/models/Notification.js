const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  link: { type: String, default: null },
  read: { type: Boolean, default: false },
  type: { type: String, default: 'info' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
