const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // In development allow the server to keep running even if the DB is unavailable.
    // This prevents the whole app from exiting when env vars (MONGO_URI) are not set.
    return;
  }
};

module.exports = connectDB;