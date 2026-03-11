const asyncHandler = require('express-async-handler');
const Onboarding = require('../models/Onboarding');

// Create or fetch onboarding for an employee
const getOrCreateOnboarding = asyncHandler(async (req, res) => {
  const employeeId = req.params.employeeId || req.user._id;
  let ob = await Onboarding.findOne({ employee: employeeId });
  if (!ob) {
    // seed basic steps
    ob = await Onboarding.create({
      employee: employeeId,
      steps: [
        { key: 'personal', title: 'Personal Info' },
        { key: 'documents', title: 'Document Upload' },
        { key: 'workspace', title: 'Workspace Setup' },
        { key: 'team', title: 'Team Introduction' }
      ],
      currentStep: 'personal'
    });
  }
  res.json(ob);
});

// Autosave step data
const saveStep = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const data = req.body || {};
  const ob = await Onboarding.findOne({ employee: req.user._id });
  if (!ob) return res.status(404).json({ message: 'Onboarding not found' });

  const step = ob.steps.find(s => s.key === key);
  if (!step) return res.status(400).json({ message: 'Invalid step' });

  step.data = { ...step.data, ...data };
  step.updatedAt = Date.now();
  if (req.body.completed) step.completed = true;

  // recompute progress
  const completed = ob.steps.filter(s => s.completed).length;
  ob.progress = Math.round((completed / ob.steps.length) * 100);
  ob.currentStep = ob.steps.find(s => !s.completed)?.key ?? null;

  await ob.save();
  res.json(ob);
});

module.exports = { getOrCreateOnboarding, saveStep };
