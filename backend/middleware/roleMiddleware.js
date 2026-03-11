// Simple role-based access middleware
const requireRole = (allowedRoles = []) => (req, res, next) => {
  try {
    const role = req.user?.role;
    if (!role) return res.status(403).json({ message: 'Role missing' });
    if (allowedRoles.includes(role) || (role === 'Owner')) return next();
    return res.status(403).json({ message: 'Insufficient role' });
  } catch (err) {
    return res.status(500).json({ message: 'Role middleware error' });
  }
};

module.exports = { requireRole };
