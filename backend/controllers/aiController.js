const asyncHandler = require('express-async-handler');
const aiService = require('../services/aiService');

const askFAQ = asyncHandler(async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ message: 'Question required' });
  const result = await aiService.askFAQ(question);
  res.json(result);
});

const recommendBuddy = asyncHandler(async (req, res) => {
  const { role, department, metrics } = req.body;
  const result = await aiService.recommendBuddy({ role, department, metrics });
  res.json(result);
});

module.exports = { askFAQ, recommendBuddy };
