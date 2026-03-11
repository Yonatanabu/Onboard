# Onboard

Onboard is a full-stack onboarding platform with a Node.js/Express/MongoDB backend and a React/Vite frontend. It includes mentor assignment, messaging, lessons, announcements, notifications, and AI-assisted onboarding flows.

## Repository Structure

```text
backend/   Express API, MongoDB models, auth, messaging, mail integration
frontend/  React + Vite client application
```

## Tech Stack

- Backend: Node.js, Express, Mongoose, JWT, Socket.IO, Nodemailer
- Frontend: React, TypeScript, Vite
- Database: MongoDB

## Local Development

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment

Copy `backend/.env.example` to `backend/.env` and fill in your real values.

Important defaults:

- `MAIL_ENABLED=false` means the app will not send real emails.
- Set `MAIL_ENABLED=true` only when valid SMTP or Gmail app-password credentials are configured.

### 3. Run the app

Backend:

```bash
cd backend
npm start
```

Frontend:

```bash
cd frontend
npm run dev
```

## Deployment Checklist

### Backend

- Set a strong `JWT_SECRET`
- Set a production `MONGO_URI`
- Set `FRONTEND_URL` to the deployed frontend origin
- Keep `MAIL_ENABLED=false` unless you intentionally want outbound email
- If enabling email, configure one of:
  - `GMAIL_USER` and `GMAIL_APP_PASSWORD`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`

### Frontend

- Build with:

```bash
cd frontend
npm run build
```

- Deploy the generated `frontend/dist` output to your static host
- Ensure API requests point to the deployed backend using your Vite env setup if needed

## Email Behavior

- By default, real email sending is disabled with `MAIL_ENABLED=false`
- When disabled, assignment and other mail operations are skipped safely
- In local development, if mail is enabled but no real credentials are configured, the backend may use Ethereal for test previews
- In production, do not enable mail until valid credentials are configured

## GitHub Safety

This repository now includes a root `.gitignore` that excludes:

- `node_modules`
- build artifacts
- local `.env` files
- logs and editor cache files

Do not commit real secrets. If any secrets were previously stored in tracked files, rotate them before publishing the repository.
