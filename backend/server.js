const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const buddyRoutes = require('./routes/buddyRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const aiRoutes = require('./routes/ai');
const messagesRoutes = require('./routes/messages');
const notificationsRoutes = require('./routes/notifications');
const lessonsRoutes = require('./routes/lessons');
const mentorTipsRoutes = require('./routes/mentorTips');
const announcementsRoutes = require('./routes/announcements');

dotenv.config();
connectDB();

const app = express();
const http = require('http');
const { Server } = require('socket.io');
// Allow requests from the frontend during development. If FRONTEND_URL is set, use it;
// otherwise allow any origin (reflect) to support ports like 3000, 3001, etc.
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
  exposedHeaders: ['x-access-token']
}));
// Content Security Policy: only set a restrictive CSP in production.
// Do NOT enable 'unsafe-eval' here. During local development we avoid
// setting a CSP header so dev tooling (HMR, source-maps) can operate.
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const frontend = process.env.FRONTEND_URL || '';
    const scriptSrc = ["'self'", frontend].filter(Boolean).join(' ');
    const connectSrc = ["'self'", frontend, 'wss:'].filter(Boolean).join(' ');
    // strict production policy — no 'unsafe-eval'
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'self'; script-src ${scriptSrc}; connect-src ${connectSrc}; img-src 'self' data:; style-src 'self' 'unsafe-inline';`
    );
  }
  next();
});
// custom JSON parsing middleware – we avoid express.json entirely so
// we can intercept syntax errors before any HTML response is ever written.
// this is intentionally simple: it only handles requests whose Content-Type
// is application/json and buffers the body into memory. in a real app you
// might want a proper library, but this covers our needs and guarantees a
// JSON error response (no HTML stack traces).
app.use((req, res, next) => {
  if (req.is('application/json')) {
    let rawData = '';
    req.on('data', (chunk) => {
      rawData += chunk;
    });
    req.on('end', () => {
      if (rawData) {
        try {
          req.body = JSON.parse(rawData);
        } catch (err) {
          return res.status(400).json({ message: 'Malformed JSON in request body' });
        }
      } else {
        req.body = {};
      }
      next();
    });
    req.on('error', (err) => {
      // forward any stream errors to generic handler
      next(err);
    });
  } else {
    // not JSON, move along (static, urlencoded etc. can be added later)
    next();
  }
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/buddies', buddyRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/mentor-tips', mentorTipsRoutes);
app.use('/api/announcements', announcementsRoutes);

// generic error handler - always return JSON
app.use((err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Server error',
    // include stack only in development for easier debugging
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// attach socket.io for real-time chat
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

// simple room-per-user pattern: clients join a room with their user id
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    try {
      if (userId) socket.join(String(userId));
    } catch (e) {}
  });

  // allow clients to join arbitrary conversation rooms (e.g. chat:<idA>:<idB>)
  socket.on('joinRoom', (room) => {
    try {
      if (room) socket.join(String(room));
    } catch (e) {}
  });

  socket.on('disconnect', () => {});
});

// expose io globally so controllers can emit events when messages are created
global.io = io;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});