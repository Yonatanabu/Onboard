# Backend Mail Setup

This backend can send mentor-assignment emails using either Gmail SMTP or a generic SMTP provider.

## Recommended: Gmail App Password

1. Enable 2-Step Verification on the Gmail account.
2. Create an App Password in the Google account security settings.
3. Set these variables in `.env`:

```env
GMAIL_USER=youraddress@gmail.com
GMAIL_APP_PASSWORD=your_16_character_app_password
EMAIL_FROM=Onboard <youraddress@gmail.com>
FRONTEND_URL=https://your-frontend-domain.com
```

## Generic SMTP Alternative

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM=Onboard <no-reply@example.com>
```

## Behavior

- In local development, if no valid mail credentials are configured, the app falls back to Ethereal test mail and logs a preview URL.
- In production, the app will not silently fall back to Ethereal. Real mail credentials are required.
