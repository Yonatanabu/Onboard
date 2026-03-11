const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getOrCreateOnboarding, saveStep } = require('../controllers/onboardingController');

// Employees access their onboarding
router.get('/me', protect, getOrCreateOnboarding);
// Admins can fetch onboarding for an employee
router.get('/:employeeId', protect, getOrCreateOnboarding);

// Autosave a step: POST /api/onboarding/step/:key
router.post('/step/:key', protect, saveStep);

module.exports = router;
