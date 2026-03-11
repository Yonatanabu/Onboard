const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');

const sendMessage = asyncHandler(async (req, res) => {
  const { to, text } = req.body;
  const from = req.user._id;

  if (!to || !text) {
    res.status(400);
    throw new Error('Missing recipient or text');
  }

  const message = await Message.create({ from, to, text });

  // emit real-time event to recipient room and sender
  try {
    const io = global.io;
    if (io) {
      const payload = {
        id: message._id,
        from: message.from,
        to: message.to,
        text: message.text,
        createdAt: message.createdAt,
        read: message.read,
      };
      io.to(String(to)).emit('message', payload);
      io.to(String(from)).emit('message', payload);
    }
  } catch (e) {
    // ignore
  }

  res.status(201).json(message);
});

const getConversation = asyncHandler(async (req, res) => {
  const otherId = req.params.otherId;
  const userId = req.user._id;

  // populate sender/recipient basic info so the client can show usernames
  const messages = await Message.find({
    $or: [
      { from: userId, to: otherId },
      { from: otherId, to: userId }
    ]
  })
    .sort('createdAt')
    .populate('from', 'name email')
    .populate('to', 'name email');

  res.json(messages);
});

const getUserConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Return recent messages involving user (simple implementation)
  const messages = await Message.find({ $or: [{ from: userId }, { to: userId }] })
    .sort('-createdAt')
    .limit(200)
    .populate('from', 'name email')
    .populate('to', 'name email');

  // compress into conversation summaries by partner id and include partner name/email
  const seen = new Map();
  messages.forEach((m) => {
    const isFromUser = String(m.from._id) === String(userId);
    const partnerObj = isFromUser ? m.to : m.from;
    const partner = String(partnerObj._id || partnerObj);
    if (!seen.has(partner)) {
      seen.set(partner, {
        partnerId: partner,
        partnerName: partnerObj.name || partnerObj.email || partner,
        partnerEmail: partnerObj.email || null,
        lastMessage: m.text,
        lastAt: m.createdAt,
        unread: m.to && String(m.to._id) === String(userId) && !m.read,
      });
    }
  });

  const list = Array.from(seen.values());
  res.json(list);
});

const markMessageRead = asyncHandler(async (req, res) => {
  const messageId = req.params.id;
  const userId = req.user._id;
  const msg = await Message.findById(messageId);
  if (!msg) {
    res.status(404);
    throw new Error('Message not found');
  }
  // only recipient can mark read
  if (String(msg.to) !== String(userId)) {
    res.status(403);
    throw new Error('Not authorized');
  }
  msg.read = true;
  await msg.save();
  res.json({ success: true });
});

const markMessageUnread = asyncHandler(async (req, res) => {
  const messageId = req.params.id;
  const userId = req.user._id;
  const msg = await Message.findById(messageId);
  if (!msg) {
    res.status(404);
    throw new Error('Message not found');
  }
  if (String(msg.to) !== String(userId) && String(msg.from) !== String(userId)) {
    res.status(403);
    throw new Error('Not authorized');
  }
  msg.read = false;
  await msg.save();
  res.json({ success: true });
});

module.exports = { sendMessage, getConversation, getUserConversations, markMessageRead, markMessageUnread };