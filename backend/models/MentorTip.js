const mongoose = require('mongoose');

const mentorTipSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: String, required: true },
    message: { type: String, required: true, trim: true },
    mentees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('MentorTip', mentorTipSchema);
