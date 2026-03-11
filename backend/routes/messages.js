const express = require('express');
const { sendMessage, getConversation, getUserConversations, markMessageRead, markMessageUnread } = require('../controllers/messagesController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect);
router.post('/', sendMessage);
router.get('/conversations', getUserConversations);
router.get('/:otherId', getConversation);

router.put('/:id/read', markMessageRead);
router.put('/:id/unread', markMessageUnread);

module.exports = router;
