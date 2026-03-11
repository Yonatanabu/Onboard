const nodemailer = require('nodemailer');

let transporterPromise = null;

const PLACEHOLDER_VALUES = new Set([
  'youraddress@gmail.com',
  'your_app_password',
  'your_16_character_app_password',
  'your-frontend-domain.com',
  'https://your-frontend-domain.com',
]);

function isMailEnabled() {
  return String(process.env.MAIL_ENABLED || 'false').trim().toLowerCase() === 'true';
}

function isPlaceholder(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || PLACEHOLDER_VALUES.has(normalized);
}

function getMailConfig() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!isPlaceholder(gmailUser) && !isPlaceholder(gmailAppPassword)) {
    return {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
      source: 'gmail',
    };
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!isPlaceholder(smtpHost) && !isPlaceholder(smtpUser) && !isPlaceholder(smtpPass)) {
    return {
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      source: 'smtp',
    };
  }

  return null;
}

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    const mailConfig = getMailConfig();
    if (mailConfig) {
      console.log(`Mail transport: using ${mailConfig.source} configuration.`);
      return nodemailer.createTransport({
        host: mailConfig.host,
        port: mailConfig.port,
        secure: mailConfig.secure,
        auth: mailConfig.auth,
      });
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Mail transport is not configured. Set GMAIL_USER/GMAIL_APP_PASSWORD or SMTP_HOST/SMTP_USER/SMTP_PASS in production.');
    }

    console.warn('Mail transport: no real SMTP credentials configured, using Ethereal test account for local development.');
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  })();

  return transporterPromise;
}

async function sendMail({ to, subject, text, html }) {
  if (!isMailEnabled()) {
    console.log(`Mail disabled: skipped email to ${to} with subject "${subject}".`);
    return { skipped: true, reason: 'MAIL_ENABLED=false' };
  }

  const transporter = await getTransporter();
  const from = process.env.EMAIL_FROM || `Onboard <no-reply@onboard.local>`;

  const info = await transporter.sendMail({ from, to, subject, text, html });

  // If using Ethereal, log preview URL so developer can see the message
  if (nodemailer.getTestMessageUrl && info) {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log('Preview URL:', preview);
  }

  return info;
}

module.exports = { sendMail };
