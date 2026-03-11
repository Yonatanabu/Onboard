const asyncHandler = require('express-async-handler');
const MentorTip = require('../models/MentorTip');
const User = require('../models/User');

const isMentorRole = (role) => {
  const normalized = String(role || '').toLowerCase();
  return normalized === 'mentor' || normalized === 'buddy';
};

const createMentorTip = asyncHandler(async (req, res) => {
  if (!isMentorRole(req.user.role)) {
    return res.status(403).json({ message: 'Mentor access only' });
  }

  const { message, menteeIds } = req.body;
  if (!message || !String(message).trim()) {
    return res.status(400).json({ message: 'Tip message is required' });
  }

  const assigned = await User.find({
    role: { $regex: /^employee$/i },
    approved: true,
    buddyUser: req.user._id,
    department: req.user.department,
  }).select('_id');

  if (!assigned.length) {
    return res.status(400).json({ message: 'No assigned mentees available' });
  }

  const allowedIds = new Set(assigned.map((item) => String(item._id)));
  const requested = Array.isArray(menteeIds) ? menteeIds.map((item) => String(item)) : [];
  const finalMenteeIds = requested.length ? requested : Array.from(allowedIds);

  const invalid = finalMenteeIds.find((id) => !allowedIds.has(id));
  if (invalid) {
    return res.status(403).json({ message: 'Tips can only be shared with your assigned mentees' });
  }

  const tip = await MentorTip.create({
    mentor: req.user._id,
    department: req.user.department,
    message: String(message).trim(),
    mentees: finalMenteeIds,
  });

  res.status(201).json(tip);
});

const getMentorTipsForMentor = asyncHandler(async (req, res) => {
  if (!isMentorRole(req.user.role)) {
    return res.status(403).json({ message: 'Mentor access only' });
  }

  const tips = await MentorTip.find({ mentor: req.user._id }).sort('-createdAt');
  res.json(tips);
});

const getMentorTipsFeed = asyncHandler(async (req, res) => {
  const userRole = String(req.user.role || '').toLowerCase();
  if (userRole !== 'employee') {
    return res.status(403).json({ message: 'Employee access only' });
  }

  const tips = await MentorTip.find({ mentees: req.user._id })
    .populate('mentor', 'name email department')
    .sort('-createdAt');

  res.json(tips);
});

module.exports = {
  createMentorTip,
  getMentorTipsForMentor,
  getMentorTipsFeed,
};
