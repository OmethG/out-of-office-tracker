# MethG Staff

The MethG team's app for out-of-office requests. Staff sign in on their phone and either **step out** (away from the office for over an hour) or **request leave** (full days, or a half day: morning 9 AM–1 PM or afternoon 1–5 PM; Saturday counts as half a day and has no afternoon). The manager approves or declines from the app or with one click from an email, and can see the full history and export it to an Excel file.

It installs on any iPhone or Android home screen from the website (no app store). Light mode is the default; dark mode is a toggle in the header and on the Account page.

## Signing in

- **Staff:** username is their name in lowercase with spaces removed, plus `@methg` (e.g. `kavee@methg`). The shared staff password is set in `lib/employees.js`.
- **Manager:** the `MANAGER_USERNAME` / `MANAGER_PASSWORD` environment variables.

Add or remove staff in `config/employees.json`, then commit and push. `email` is where that person's approval/decline emails go.

## Environment variables

| Variable | What it's for |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `RESEND_API_KEY` | Resend, for sending email |
| `FROM_EMAIL` | Sender, e.g. `Office Tracker <noreply@methg.com>` |
| `MANAGER_EMAIL` | Where new requests are emailed (comma-separate for more than one) |
| `APP_BASE_URL` | The site's address, no trailing slash. `http://localhost:3000` locally |
| `MANAGER_USERNAME` / `MANAGER_PASSWORD` | The manager's sign-in |
| `SESSION_SECRET` | Optional. Signs the sign-in cookie; falls back to `DATABASE_URL` |

The database table is created and upgraded automatically on first run.

## Running it locally

```bash
npm install
cp .env.example .env.local   # then fill in the real values
npm run dev
```

Open `http://localhost:3000`.

## Where things are

- `app/page.js`, `app/step-out`, `app/leave`, `app/requests`: staff screens
- `app/manager`, `app/manager/history`: manager approvals, history, Excel export
- `app/account`: appearance (light/dark) and sign out
- `app/api/*`: sign in, sending requests, decisions, export, delete
- `app/api/decision`: the Approve/Decline links in manager emails
- `proxy.js`: who can open which page
- `lib/time.js`: dates in Sri Lanka time, half-day hours, the working week (Mon–Fri full days, Saturday until 1 PM, Sunday off)
- `app/globals.css`: the look, with the MethG blue (`#023ABE`) and purple (`#470073`)
