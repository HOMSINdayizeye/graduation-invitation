# graduation-invitation

Digital graduation invitations: pick a template, add your details and guests, share a personal link or QR code with each guest.

## Project layout

- `frontend/` Vite + React app (port 5173 in development)
- `backend/` Express + tRPC API (port 3000); in production it also serves the built frontend from `dist/public`

## Environment

Each package reads its own `.env` file. Both are gitignored; the `.env.example` files are the committed templates.

| File | Who reads it | Notes |
| --- | --- | --- |
| `backend/.env` | the Node server (via dotenv) | `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `PORT` |
| `frontend/.env` | Vite at build time | only `VITE_`-prefixed keys; none required today |

Setup:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Then fill in the values. On a hosting platform set the same keys in the service's environment settings instead of uploading `.env` files.

## Sign-in

Accounts live in MongoDB (`backend/server/models/user.js`) with bcrypt-hashed passwords. Register or sign in at `/login`; the backend returns a 24-hour JWT that the frontend stores in localStorage and sends as `Authorization: Bearer <token>`. Five wrong passwords lock the account. At startup the server creates the administrator from `ADMIN_EMAIL` / `ADMIN_PASSWORD` if that account does not exist yet (or promotes an existing account with that email); the `/admin` panel requires the admin role. The database named in `MONGODB_DB` is created by MongoDB on this first write.

## Admin panel

Signed-in admins open `/admin` (`frontend/src/pages/Admin.tsx`, API in `backend/server/adminRouter.js`):

- **Templates**: rename a style, edit its subtitle, accent colour and sample name, or hide it from visitors. Templates live in the `templates` collection, seeded from `backend/shared/templates.js` at startup.
- **Users**: every sign-in account, with a button to unlock accounts locked by failed logins.
- **Code requests**: the emails that used the templates and received one-time codes, with status (sent, verified, bypassed, failed).
- **Settings**: require one-time codes or not, and "allow continuing without a code when email cannot be sent" for when Brevo credits are exhausted. Also shows remaining Brevo credits and sends a test email.

## One-time codes

`backend/server/otpRouter.js` emails a 6-digit code (valid 10 minutes, 5 attempts) through Brevo and logs every request in the `otprequests` collection. If sending fails and the admin setting allows it, the person continues without a code and the request is logged as bypassed.

## Email

Transactional email goes through Brevo's REST API (`backend/server/_core/mail.js`). Set `BREVO_API_KEY` and a verified `MAIL_FROM`; an admin can call the `system.sendTestEmail` API to confirm delivery.

## Commands

```bash
pnpm install:all   # install root, frontend and backend dependencies
pnpm dev           # frontend on 5173 + backend on 3000
pnpm build         # build frontend into dist/public and bundle the backend into backend/dist
pnpm start         # run the production server (serves API + built frontend)
pnpm check         # TypeScript check
```
