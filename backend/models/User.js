const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { 
    type: String, 
    required: true,
    enum: ['frontend', 'backend', 'mobile', 'design', 'qa', 'marketing', 'sales']
  },
  // Keep for backward compatibility; canonical role is `role`.
  isAdmin: { type: Boolean, default: false },
  role: {
    type: String,
    enum: ['Owner', 'HR/Admin', 'Manager', 'Employee', 'Buddy', 'Admin', 'Mentor'],
    default: 'Employee'
  },
  approved: { type: Boolean, default: false },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedAt: { type: Date, default: null },
  // Refresh tokens can be stored per-user for refresh flow support.
  refreshTokens: [{ type: String }],
  buddy: { type: mongoose.Schema.Types.ObjectId, ref: 'Buddy', default: null },
  buddyUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  // Track lessons the user has completed
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }]
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // Ensure isAdmin mirrors role for older checks.
  if (this.role === 'Owner' || this.role === 'HR/Admin') {
    this.isAdmin = true;
  }
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);