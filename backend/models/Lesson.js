const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  role: { type: String, default: 'All' },
  position: { type: String, default: 'All' },
  targetMentees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  description: { type: String, default: '' },
  content: { type: String, default: '' },
  url: { type: String, default: '' },
  status: { type: String, enum: ['Published', 'Draft', 'Archived'], default: 'Published' },
  deadline: { type: String, default: null },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
