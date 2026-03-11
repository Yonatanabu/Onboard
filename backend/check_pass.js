const dotenv = require('dotenv');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

dotenv.config();
connectDB();

const User = require('./models/User');

(async () => {
  try {
    const u = await User.findOne({ email: 'admin@example.com' });
    if (!u) { console.log('No user'); process.exit(1); }
    const ok = await u.matchPassword('admin123');
    console.log('matchPassword result:', ok);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
