const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  key: { type: String, required: true },
  title: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  completed: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

const onboardingSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  steps: { type: [stepSchema], default: [] },
  progress: { type: Number, default: 0 },
  currentStep: { type: String, default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Onboarding', onboardingSchema);
