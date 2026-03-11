const dotenv = require('dotenv');
dotenv.config();
const { sendMail } = require('./services/mailService');

(async () => {
  try {
    console.log('Sending test email...');
    const info = await sendMail({
      to: process.env.TEST_RECIPIENT || 'test.mentor@example.com',
      subject: 'Test: Mentor assignment email',
      text: `Hi Mentor,\n\nYou have been assigned a new mentee: Test Employee (test.employee@example.com).\n\nThanks,\nOnboard Test`
    });
    console.log('SendMail returned:', info && info.messageId ? info.messageId : info);
  } catch (err) {
    console.error('Error sending test email:', err);
    process.exit(1);
  }
})();