// Simple stubbed AI service to avoid runtime dependency on external API during local development.
// Replace with real OpenAI integration by implementing client calls here when ready.

const askFAQ = async (question) => {
  return { answer: `AI stub: received question: ${String(question).slice(0, 200)}` };
};

const recommendBuddy = async ({ role, department, metrics }) => {
  // Basic heuristic recommendation placeholder
  return {
    recommendation: null,
    reason: `Heuristic: prefer buddy from ${department} for role ${role}. Metrics: ${JSON.stringify(metrics || {})}`
  };
};

module.exports = { askFAQ, recommendBuddy };
