const asyncHandler = require('express-async-handler');
const Announcement = require('../models/Announcement');
const User = require('../models/User');

const normalizeRole = (role) => String(role || '').toLowerCase();

// Admin creates announcement
const createAnnouncement = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access only' });
  }

  const { title, body, department, targetRoles } = req.body;
  if (!title || !body) {
    return res.status(400).json({ message: 'title and body are required' });
  }

  const announcement = await Announcement.create({
    title: String(title).trim(),
    body: String(body).trim(),
    department: department ? String(department).toLowerCase() : 'all',
    targetRoles: Array.isArray(targetRoles) ? targetRoles.map((r) => String(r).toLowerCase()) : [],
    createdBy: req.user._id,
  });

  res.status(201).json(announcement);
});

// Feed for current user (mentors and employees)
const getAnnouncementsFeed = asyncHandler(async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });

  const userRole = normalizeRole(req.user.role);
  const userDept = String(req.user.department || '').toLowerCase();

  // Match announcements where department is 'all' or matches user's department
  // and where targetRoles is empty (meaning all) or includes user's role
  const announcements = await Announcement.find({
    $and: [
      { $or: [{ department: 'all' }, { department: userDept }] },
      { $or: [{ targetRoles: { $exists: true, $size: 0 } }, { targetRoles: { $in: [userRole] } }, { targetRoles: { $in: ['all'] } }] },
    ],
  })
    .populate('createdBy', 'name email')
    .sort('-createdAt')
    .limit(50);

  // annotate read flag per-user
  const enriched = announcements.map((a) => {
    const obj = a.toObject();
    obj.read = Array.isArray(obj.readBy) && obj.readBy.some((id) => String(id) === String(req.user._id));
    return obj;
  });

  res.json(enriched);
});

const markAnnouncementRead = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const announcement = await Announcement.findById(id);
  if (!announcement) {
    return res.status(404).json({ message: 'Announcement not found' });
  }

  const already = (announcement.readBy || []).some((u) => String(u) === String(req.user._id));
  if (!already) {
    announcement.readBy = announcement.readBy || [];
    announcement.readBy.push(req.user._id);
    await announcement.save();
  }

  res.json({ message: 'Marked read' });
});

const markAnnouncementUnread = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const announcement = await Announcement.findById(id);
  if (!announcement) {
    return res.status(404).json({ message: 'Announcement not found' });
  }

  announcement.readBy = (announcement.readBy || []).filter((u) => String(u) !== String(req.user._id));
  await announcement.save();
  res.json({ message: 'Marked unread' });
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ message: 'Admin only' });
  const id = req.params.id;
  const a = await Announcement.findById(id);
  if (!a) return res.status(404).json({ message: 'Announcement not found' });
  await a.deleteOne();
  res.json({ message: 'Deleted' });
});

// Admin list all announcements
const listAnnouncements = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access only' });
  }

  const items = await Announcement.find({}).populate('createdBy', 'name email').sort('-createdAt');
  res.json(items);
});

module.exports = {
  createAnnouncement,
  getAnnouncementsFeed,
  listAnnouncements,
  markAnnouncementRead,
  markAnnouncementUnread,
  deleteAnnouncement,
};
