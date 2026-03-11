const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'Not authorized, token missing' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      return next();
    } catch (error) {
      // Handle token expiration separately to avoid noisy stack traces
      if (error && error.name === 'TokenExpiredError') {
        // attempt silent refresh if client provided a refresh token in header
        const refreshToken = req.headers['x-refresh-token'] || (req.body && req.body.refreshToken);
        if (refreshToken) {
          try {
            const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
            const user = await User.findById(decodedRefresh.id).select('-password -refreshTokens');
            if (user) {
              // issue a new access token and attach it to response header for client to pick up
              const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
              res.setHeader('x-access-token', newToken);
              req.user = user;
              return next();
            }
          } catch (refreshErr) {
            console.warn('Refresh token invalid or expired');
            return res.status(401).json({ message: 'Not authorized, token expired' });
          }
        }

        console.warn('JWT token expired for request');
        return res.status(401).json({ message: 'Not authorized, token expired' });
      }

      console.error('JWT verification error:', error && error.message ? error.message : error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token' });
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  } else {
    return res.status(403).json({ message: 'Admin only' });
  }
};

module.exports = { protect, admin };