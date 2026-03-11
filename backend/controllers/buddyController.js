const asyncHandler = require('express-async-handler');
const Buddy = require('../models/Buddy');

const getBuddies = asyncHandler(async (req, res) => {
  const buddies = await Buddy.find({});
  res.json(buddies);
});

const createBuddy = asyncHandler(async (req, res) => {
  const { name, email, department, available = true } = req.body;

  const buddyExists = await Buddy.findOne({ email });
  if (buddyExists) {
    res.status(400);
    throw new Error('Buddy already exists');
  }

  const buddy = await Buddy.create({
    name,
    email,
    department,
    available
  });

  res.status(201).json(buddy);
});

module.exports = { getBuddies, createBuddy };