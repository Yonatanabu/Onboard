const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createMentorTip,
  getMentorTipsForMentor,
  getMentorTipsFeed,
} = require('../controllers/mentorTipController');

const router = express.Router();

router.get('/mine', protect, getMentorTipsForMentor);
router.get('/feed', protect, getMentorTipsFeed);
router.post('/', protect, createMentorTip);

module.exports = router;
