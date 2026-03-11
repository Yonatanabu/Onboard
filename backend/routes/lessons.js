const express = require('express');
const { createLesson, getLessons, updateLesson, deleteLesson, toggleLessonCompletion } = require('../controllers/lessonController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// Protect all lesson endpoints - admins can manage everything, mentors may create (restricted in controller)
router.get('/', protect, getLessons);
router.post('/', protect, createLesson); // createLesson checks req.user.role and mentees
router.put('/:id', protect, admin, updateLesson);
router.delete('/:id', protect, admin, deleteLesson);
router.post('/:id/complete', protect, toggleLessonCompletion);

module.exports = router;
