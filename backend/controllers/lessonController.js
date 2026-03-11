const asyncHandler = require('express-async-handler');
const Lesson = require('../models/Lesson');
const User = require('../models/User');

const isMentorRole = (role) => {
  const normalized = String(role || '').toLowerCase();
  return normalized === 'mentor' || normalized === 'buddy';
};

const createLesson = asyncHandler(async (req, res) => {
  const { title, role, position, description, content, url, status, deadline, menteeIds } = req.body;
  if (!title) {
    res.status(400);
    throw new Error('title is required');
  }

  const mappedPosition = position || role || 'All';

  let targetMenteeIds = [];

  if (isMentorRole(req.user.role)) {
    const mentorDepartment = String(req.user.department || '').toLowerCase();
    const normalizedPosition = String(mappedPosition || '').toLowerCase();

    if (!mentorDepartment || normalizedPosition !== mentorDepartment) {
      res.status(403);
      throw new Error('Mentors can only create lessons for their own department');
    }

    const assignedMentees = await User.find({
      buddyUser: req.user._id,
      role: { $regex: /^employee$/i },
      approved: true,
      department: mentorDepartment,
    }).select('_id department');

    if (!assignedMentees.length) {
      res.status(400);
      throw new Error('No assigned mentees found for this mentor');
    }

    const allowedMenteeIds = new Set(assignedMentees.map((item) => String(item._id)));
    const requestedMenteeIds = Array.isArray(menteeIds) ? menteeIds.map((item) => String(item)) : [];
    const finalMenteeIds = requestedMenteeIds.length ? requestedMenteeIds : Array.from(allowedMenteeIds);

    const invalidMentee = finalMenteeIds.find((item) => !allowedMenteeIds.has(item));
    if (invalidMentee) {
      res.status(403);
      throw new Error('Mentors can only target their assigned mentees');
    }

    targetMenteeIds = finalMenteeIds;
  }

  const lesson = await Lesson.create({
    title,
    role: mappedPosition,
    position: mappedPosition,
    description: description || '',
    content: content || description || '',
    url: url || '',
    status: status || 'Published',
    deadline: deadline || null,
    author: req.user._id,
    targetMentees: targetMenteeIds,
  });
  res.status(201).json(lesson);
});

// Include per-user `completed` flag when user is authenticated
const getLessons = asyncHandler(async (req, res) => {
  const { role, position } = req.query;
  const filter = {};
  if (position || role) {
    const value = String(position || role);
    filter.$or = [{ position: value }, { role: value }, { position: 'All' }, { role: 'All' }];
  }
  const lessons = await Lesson.find(filter).sort('-createdAt');

  const filteredLessons = lessons.filter((lesson) => {
    if (!req.user) return true;
    const userRole = String(req.user.role || '').toLowerCase();
    if (req.user.isAdmin || userRole === 'admin') return true;

    if (userRole === 'employee') {
      const targets = lesson.targetMentees || [];
      if (!targets.length) return true;
      return targets.some((id) => String(id) === String(req.user._id));
    }

    if (isMentorRole(req.user.role)) {
      const lessonPosition = String(lesson.position || lesson.role || '').toLowerCase();
      return lessonPosition === String(req.user.department || '').toLowerCase() || String(lesson.author) === String(req.user._id);
    }

    return true;
  });

  // If protect middleware provided req.user, attach completion status
  if (req.user && req.user._id) {
    const user = await User.findById(req.user._id).select('completedLessons');
    const completedSet = new Set((user?.completedLessons || []).map(id => String(id)));
    const enriched = filteredLessons.map(l => ({ ...l.toObject(), completed: completedSet.has(String(l._id)) }));
    return res.json(enriched);
  }

  res.json(filteredLessons);
});

const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  const { title, role, position, description, content, url, status, deadline } = req.body;
  const mappedPosition = position || role || lesson.position || lesson.role || 'All';

  lesson.title = title ?? lesson.title;
  lesson.position = mappedPosition;
  lesson.role = mappedPosition;
  lesson.description = description ?? lesson.description;
  lesson.content = content ?? lesson.content;
  lesson.url = url ?? lesson.url;
  lesson.status = status ?? lesson.status;
  lesson.deadline = deadline ?? lesson.deadline;

  const updated = await lesson.save();
  res.json(updated);
});

const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) {
    res.status(404);
    throw new Error('Lesson not found');
  }

  await lesson.deleteOne();
  await User.updateMany({}, { $pull: { completedLessons: lesson._id } });
  res.json({ message: 'Lesson deleted' });
});

// Toggle completion for a lesson for the current user (POST toggles on/off)
const toggleLessonCompletion = asyncHandler(async (req, res) => {
  const lessonId = req.params.id;
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.completedLessons = user.completedLessons || [];
  const idx = user.completedLessons.findIndex(l => String(l) === String(lessonId));
  if (idx >= 0) {
    // unmark
    user.completedLessons.splice(idx, 1);
    await user.save();
    return res.json({ completed: false });
  }

  // mark complete
  user.completedLessons.push(lessonId);
  await user.save();
  res.json({ completed: true });
});

module.exports = { createLesson, getLessons, updateLesson, deleteLesson, toggleLessonCompletion };