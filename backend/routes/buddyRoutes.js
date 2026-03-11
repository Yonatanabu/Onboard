const express = require('express');
const { getBuddies, createBuddy } = require('../controllers/buddyController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, admin, getBuddies).post(protect, admin, createBuddy);

module.exports = router;