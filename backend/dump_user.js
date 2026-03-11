const dotenv = require('dotenv');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

dotenv.config();
connectDB();

const User = require('./models/User');

(async () => {
  try {
    const u = await User.findOne({ email: 'admin@example.com' }).lean();
    console.log('FOUND:', u ? JSON.stringify(u, null, 2) : 'NOT FOUND');
    process.exit(0);
  } catch (err) {
    console.error('ERR', err);
    process.exit(1);
  }
})();
