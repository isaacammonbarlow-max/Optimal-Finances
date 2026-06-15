# Optimal Finances

Personal finance with **TKOGON** — simple sign-in, household sharing, Plaid bank sync, budget goals, and AI spending alerts.

## Quick start

```bash
cd ~/Projects/optimal-finances
nvm use 20
npm install
npm run db:up          # starts PostgreSQL in Docker
npm run db:migrate     # creates database tables
npm run dev
```

Open **http://localhost:3000** → **Create account** with email + password.

## Sign-in

- **Register** at `/register` — email, password (8+ chars, letter + number), optional name
- **Sign in** at `/login` — email + password only
- Passwords are bcrypt-hashed; never stored in plain text

> If you signed in before this update (email-only), create a **new account** — old accounts have no password.

## Environment

Copy `.env.example` to `.env` if needed. Only these are required:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection (default works with Docker) |
| `AUTH_SECRET` | Session signing — `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | 32+ chars — encrypts bank tokens |

Optional: `OPENAI_API_KEY` (real receipt OCR), `PLAID_CLIENT_ID` / `PLAID_SECRET` (bank sync)

## Features

- **Simple sign-in** — email only; new accounts auto-provisioned
- **Household sharing** — invite family via link
- **Plaid bank sync** — encrypted tokens, transaction import
- **TKOGON AI** — receipt scanning, chat, spending alerts
- **Budget goals** — alerts when limits are exceeded
- **PostgreSQL** — via Docker Compose

## Sign-in flow

1. Go to `/login`
2. Enter email (and optional name)
3. Click **Continue** — creates account + household on first visit
4. Redirected to dashboard

## Docker commands

```bash
npm run db:up      # start Postgres
npm run db:down    # stop Postgres
npm run db:migrate # apply schema changes
```

## Tech stack

Next.js 16 · Auth.js · PostgreSQL · Prisma · Plaid · OpenAI · Tailwind
