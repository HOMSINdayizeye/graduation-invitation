# graduation-invitation

Digital graduation invitations: pick a template, add your details and guests, share a personal link or QR code with each guest.

## Project layout

Two independent apps in one repository:

- `backend/` standalone Node service (Express + tRPC + MongoDB) with its own `package.json` and `package-lock.json`. Install and run it with npm from inside the folder. Shared constants and template defaults live in `backend/shared/`.
- `frontend/` Vite + React app. The root `pnpm-workspace.yaml` covers only the frontend; `pnpm dev` at the root starts it on 5173 and proxies `/api` to the backend on 3000.

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

## Deploying

- **Backend on Render**: Web Service with Root Directory `backend`, build `npm install && npm run build`, start `npm start`. Node 22 comes from `backend/.node-version`. Set the backend env keys plus `CORS_ORIGIN=https://<frontend-domain>`.
- **Frontend on Vercel**: Root Directory `frontend`, Vite preset (output `dist`), env `VITE_API_URL=https://<backend>.onrender.com`. `frontend/vercel.json` rewrites every path to `index.html`.
- **Single server instead**: build the frontend, then start the backend with `CORS_ORIGIN` and `VITE_API_URL` empty; it serves `frontend/dist` itself.

Open MongoDB Atlas network access to `0.0.0.0/0`, since these hosts have no fixed outbound IP.

## Commands

```bash
# backend (run inside backend/)
npm install
npm run dev      # API on 3000 with reload
npm run build    # bundle to backend/dist
npm start        # run the bundle

# frontend (from the repo root)
pnpm install
pnpm dev         # Vite on 5173
pnpm build       # build to frontend/dist
pnpm check       # TypeScript check
```
