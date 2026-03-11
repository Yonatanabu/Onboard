const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createAnnouncement, getAnnouncementsFeed, listAnnouncements, markAnnouncementRead, markAnnouncementUnread, deleteAnnouncement } = require('../controllers/announcementController');
const { admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/feed', protect, getAnnouncementsFeed);
router.post('/', protect, admin, createAnnouncement);
router.get('/', protect, admin, listAnnouncements);
router.put('/:id/read', protect, markAnnouncementRead);
router.put('/:id/unread', protect, markAnnouncementUnread);
router.delete('/:id', protect, admin, deleteAnnouncement);

module.exports = router;
