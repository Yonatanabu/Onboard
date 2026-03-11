const mongoose = require('mongoose');

const buddySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  department: {
    type: String,
    required: true,
    enum: ['Engineering', 'Design', 'QA', 'Marketing', 'Sales', 'HR', 'Management'],
    default: 'Engineering'
  },
  available: {
    type: Boolean,
    default: true
  },
  assignedEmployees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Buddy', buddySchema);