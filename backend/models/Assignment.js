const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buddy: { type: mongoose.Schema.Types.ObjectId, ref: 'Buddy', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String, default: '' },
  active: { type: Boolean, default: true },
  metrics: { // previous performance / feedback metrics
    pastSuccessRate: { type: Number, default: 0 },
    workloadScore: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
