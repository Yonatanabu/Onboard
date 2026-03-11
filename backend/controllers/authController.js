const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Primary access token: valid for 7 days
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

const toAuthPayload = (user, token, refreshToken) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  department: user.department,
  buddyUser: user.buddyUser || null,
  role: user.role,
  isAdmin: user.isAdmin,
  approved: user.approved,
  approvalStatus: user.approvalStatus,
  approvedAt: user.approvedAt,
  token,
  refreshToken,
});

const mapRole = (role) => {
  const normalized = String(role || 'Employee').toLowerCase();
  if (normalized === 'admin') return 'Admin';
  if (normalized === 'mentor') return 'Mentor';
  return 'Employee';
};

const mapDepartment = (department, role) => {
  if (department) return department;
  const normalized = String(role || '').toLowerCase();
  if (normalized === 'mentor') return 'design';
  if (normalized === 'admin') return 'marketing';
  return 'frontend';
};

const validDepartments = ['frontend', 'backend', 'mobile', 'design', 'qa', 'marketing', 'sales'];

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (user.approvalStatus === 'rejected') {
    return res.status(403).json({ message: 'Account was rejected by admin' });
  }

  if (!user.approved) {
    return res.status(403).json({ message: 'Account pending admin approval' });
  }

  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(refreshToken);
  await user.save();

  res.json(toAuthPayload(user, token, refreshToken));
});

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, department, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const mappedRole = mapRole(role);
  const selectedDepartment = mapDepartment(department, role);
  if (!validDepartments.includes(selectedDepartment)) {
    res.status(400);
    throw new Error('Invalid department');
  }

  const user = await User.create({
    name,
    email,
    password,
    department: selectedDepartment,
    role: mappedRole,
    isAdmin: mappedRole === 'Admin',
    approved: mappedRole === 'Admin',
    approvalStatus: mappedRole === 'Admin' ? 'approved' : 'pending',
    approvedAt: mappedRole === 'Admin' ? new Date() : null,
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid user data');
  }

  if (!user.approved) {
    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      isAdmin: user.isAdmin,
      approved: false,
      approvalStatus: user.approvalStatus,
      approvedAt: user.approvedAt,
      message: 'Signup request submitted. Waiting for admin approval.',
    });
  }

  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(refreshToken);
  await user.save();

  res.status(201).json(toAuthPayload(user, token, refreshToken));
});

const createAdminUser = asyncHandler(async (req, res) => {
  const { name, email, password, department } = req.body;

  const providedKey = req.headers['x-admin-key'] || req.body.setupKey;
  if (process.env.ADMIN_SETUP_KEY) {
    if (!providedKey || providedKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({ message: 'Admin setup key required' });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Admin creation disabled in production' });
  }

  if (!name || !email || !password || !department) {
    res.status(400);
    throw new Error('Please provide name, email, password, and department');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    name,
    email,
    password,
    department,
    role: 'Admin',
    isAdmin: true,
    approved: true,
    approvalStatus: 'approved',
    approvedAt: new Date(),
  });

  if (!user) {
    res.status(400);
    throw new Error('Failed to create admin user');
  }

  res.status(201).json({ _id: user._id, email: user.email, name: user.name });
});

const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Refresh token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Invalid refresh token' });
    if (!user.refreshTokens || !user.refreshTokens.includes(token)) {
      return res.status(401).json({ message: 'Refresh token not recognized' });
    }

    const newToken = generateToken(user._id);
    const newRefresh = generateRefreshToken(user._id);
    user.refreshTokens = (user.refreshTokens || []).filter((item) => item !== token);
    user.refreshTokens.push(newRefresh);
    await user.save();

    res.json({ token: newToken, refreshToken: newRefresh });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

const logout = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Refresh token required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.refreshTokens) {
      user.refreshTokens = user.refreshTokens.filter((item) => item !== token);
      await user.save();
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
});

module.exports = { authUser, signup, refreshToken, logout, createAdminUser };
