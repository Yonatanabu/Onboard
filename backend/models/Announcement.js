const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  department: { type: String, default: 'all' },
  targetRoles: [{ type: String }], // e.g. ['mentor','employee','admin'] or empty for all
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
