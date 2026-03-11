const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Task = require('../models/Task');
const Buddy = require('../models/Buddy');
const Notification = require('../models/Notification');
const Lesson = require('../models/Lesson');
const { sendMail } = require('../services/mailService');

const normalizeRole = (role) => {
  const normalized = String(role || 'employee').toLowerCase();
  if (normalized === 'admin') return 'Admin';
  if (normalized === 'mentor') return 'Mentor';
  return 'Employee';
};

const isMentorRole = (role) => {
  const normalized = String(role || '').toLowerCase();
  return normalized === 'mentor' || normalized === 'buddy';
};

const getEmployees = asyncHandler(async (req, res) => {
  const employees = await User.find({}).select('-password -refreshTokens');
  res.json(employees);
});

const createEmployeeUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email) {
    res.status(400);
    throw new Error('name and email are required');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('User already exists');
  }

  const mappedRole = normalizeRole(role);
  const selectedDepartment = department || (mappedRole === 'Mentor' ? 'design' : mappedRole === 'Admin' ? 'marketing' : 'frontend');

  const user = await User.create({
    name,
    email,
    password: password || 'password123',
    role: mappedRole,
    department: selectedDepartment,
    isAdmin: mappedRole === 'Admin',
    approved: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    approved: user.approved,
    approvalStatus: user.approvalStatus,
    approvedAt: user.approvedAt,
  });
});

const getPendingApprovals = asyncHandler(async (req, res) => {
  const pending = await User.find({ approvalStatus: 'pending' }).select('-password -refreshTokens');
  res.json(pending);
});

const approveUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.approved = true;
  user.approvalStatus = 'approved';
  user.approvedAt = new Date();
  await user.save();

  res.json({ message: 'User approved', userId: user._id });
});

const rejectUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.approved = false;
  user.approvalStatus = 'rejected';
  user.approvedAt = null;
  await user.save();

  res.json({ message: 'User rejected', userId: user._id });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.name = name ?? user.name;
  user.email = email ?? user.email;
  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    approved: user.approved,
    isAdmin: user.isAdmin,
  });
});

const deleteEmployee = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await user.deleteOne();
  res.json({ message: 'User deleted' });
});

const assignMentor = asyncHandler(async (req, res) => {
  const { userId, mentorId } = req.body;

  if (!userId || !mentorId) {
    res.status(400);
    throw new Error('userId and mentorId are required');
  }

  const employee = await User.findById(userId);
  const mentor = await User.findById(mentorId);

  if (!employee) {
    res.status(404);
    throw new Error('Employee not found');
  }

  if (!mentor) {
    res.status(404);
    throw new Error('Mentor not found');
  }

  // department check: both users must share same department value
  if (employee.department && mentor.department && String(employee.department).toLowerCase() !== String(mentor.department).toLowerCase()) {
    res.status(400);
    throw new Error('Mentor and employee must be from the same department');
  }

  employee.buddyUser = mentor._id;
  await employee.save();
  // Send an email to the mentor informing them about the new mentee.
  try {
    if (mentor.email) {
      await sendMail({
        to: mentor.email,
        subject: 'You have a new mentee assigned',
        text: `Hi ${mentor.name || 'Mentor'},\n\nYou have been assigned a new mentee: ${employee.name} (${employee.email}).\n\nVisit the Messages page to reach out: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentor/messages\n\nThanks,\nOnboard Team`,
      });
    }
  } catch (err) {
    console.error('Failed to send mentor assignment email:', err && err.message ? err.message : err);
  }

  // keep emitting a realtime event so the mentor's UI can refresh mentees immediately
  try {
    if (global && global.io) {
      global.io.to(String(mentor._id)).emit('menteeAssigned', { menteeId: employee._id, menteeName: employee.name });
    }
  } catch (emitErr) {
    // ignore socket errors
  }

  res.json({
    message: 'Mentor assigned successfully',
    employeeId: employee._id,
    mentorId: mentor._id,
  });
});

const addTask = asyncHandler(async (req, res) => {
  const { userId, title, type, url } = req.body;

  if (!userId) {
    res.status(400);
    throw new Error('User ID is required');
  }

  const employee = await User.findById(userId);
  if (!employee) {
    res.status(404);
    throw new Error('User not found');
  }

  const taskData = {
    title,
    type,
    employee: userId,
  };

  if (type === 'video') {
    taskData.url = url;
  }

  const task = await Task.create(taskData);
  employee.tasks.push(task._id);
  await employee.save();

  res.status(201).json(task);
});

const toggleTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.completed = !task.completed;
  await task.save();

  res.json(task);
});

// Legacy endpoint: assign from Buddy collection
const assignBuddy = asyncHandler(async (req, res) => {
  const { userId, buddyId } = req.body;

  if (!userId || !buddyId) {
    res.status(400);
    throw new Error('User ID and Buddy ID are required');
  }

  const employee = await User.findById(userId);
  const buddy = await Buddy.findById(buddyId);

  if (!employee) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!buddy) {
    res.status(404);
    throw new Error('Buddy not found');
  }

  employee.buddy = buddy._id;
  await employee.save();

  if (!buddy.assignedEmployees.includes(userId)) {
    buddy.assignedEmployees.push(userId);
    await buddy.save();
  }

  try {
    await Notification.create({
      user: buddy._id,
      title: 'You were assigned as a buddy',
      body: `You were assigned to help ${employee.name} (${employee.email}).`,
      link: `/admin/employees/${employee._id}`,
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }

  try {
    if (buddy.email) {
      await sendMail({
        to: buddy.email,
        subject: 'You have a new mentee — Buddy assignment',
        text: `Hi ${buddy.name},\n\nYou have been assigned as a buddy for ${employee.name} (${employee.email}). Please reach out to them to welcome and guide them through onboarding.\n\nThanks,\nOnboard Team`,
      });
    }
  } catch (err) {
    console.error('Failed to send buddy assignment email:', err.message);
  }

  res.json({
    message: 'Buddy assigned successfully',
    employee: employee.name,
    buddy: buddy.name,
  });
});

const getMyMentees = asyncHandler(async (req, res) => {
  // Return users assigned to the currently authenticated account.
  // If explicit buddyUser links are not present (legacy seeder), fall back to department membership.
  const direct = await User.find({
    buddyUser: req.user._id,
    _id: { $ne: req.user._id },
  }).select('-password -refreshTokens');

  if (direct && direct.length) {
    return res.json(direct);
  }

  // Fallback: return employees in the same department (exclude self)
  if (req.user.department) {
    const dept = String(req.user.department).toLowerCase();
    const fallback = await User.find({
      department: { $regex: new RegExp(`^${dept}$`, 'i') },
      _id: { $ne: req.user._id },
    }).select('-password -refreshTokens');
    return res.json(fallback);
  }

  // Final fallback: empty list
  res.json([]);
});

const getMyBuddy = asyncHandler(async (req, res) => {
  const userRole = String(req.user.role || '').toLowerCase();
  if (userRole !== 'employee') {
    return res.status(403).json({ message: 'Employee access only' });
  }

  if (!req.user.buddyUser) {
    return res.json(null);
  }

  const buddy = await User.findById(req.user.buddyUser).select('-password -refreshTokens');
  res.json(buddy || null);
});

const getEmployeeProgress = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const employee = await User.findById(employeeId).select('-password -refreshTokens');
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const isAdmin = req.user.isAdmin || req.user.role === 'Admin';
  const isSelf = String(req.user._id) === String(employee._id);
  const isAssignedMentor = isMentorRole(req.user.role) && String(employee.buddyUser || '') === String(req.user._id);

  if (!isAdmin && !isSelf && !isAssignedMentor) {
    return res.status(403).json({ message: 'Not authorized to view this employee progress' });
  }

  const lessons = await Lesson.find({
    $or: [
      { position: employee.department },
      { role: employee.department },
      { position: 'All' },
      { role: 'All' },
    ],
  });

  const visibleLessons = lessons.filter((lesson) => {
    const targets = lesson.targetMentees || [];
    if (!targets.length) return true;
    return targets.some((id) => String(id) === String(employee._id));
  });

  const completedSet = new Set((employee.completedLessons || []).map((id) => String(id)));
  const completedCount = visibleLessons.filter((lesson) => completedSet.has(String(lesson._id))).length;
  const total = visibleLessons.length;
  const percentage = total ? Math.round((completedCount / total) * 100) : 0;

  res.json({
    employee,
    completed: completedCount,
    total,
    percentage,
    items: visibleLessons.map((lesson) => ({
      lessonId: lesson._id,
      id: lesson._id,
      title: lesson.title,
      description: lesson.description,
      position: lesson.position,
      role: lesson.role,
      targetMentees: lesson.targetMentees || [],
      createdAt: lesson.createdAt,
      completed: completedSet.has(String(lesson._id)),
    })),
  });
});

module.exports = {
  getEmployees,
  createEmployeeUser,
  getPendingApprovals,
  approveUser,
  rejectUser,
  updateProfile,
  deleteEmployee,
  assignMentor,
  addTask,
  toggleTask,
  assignBuddy,
  getMyMentees,
  getMyBuddy,
  getEmployeeProgress,
};
