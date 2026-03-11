const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { askFAQ, recommendBuddy } = require('../controllers/aiController');

router.post('/faq', protect, askFAQ);
router.post('/recommend-buddy', protect, recommendBuddy);
module.exports = router;
