# Out-of-Office Tracker

A small internal tool: an employee picks their name, says when they're leaving
and roughly when they'll be back, and gives a one/two-sentence reason. Their
manager gets an email with **Approve** / **Decline** buttons — one click, no
login. There's also a `/requests` page showing the full history and current
status of every request.

It's a standard Next.js app. It needs two free accounts to run:

- **[Neon](https://neon.tech)** — free Postgres database, to store requests
- **[Resend](https://resend.com)** — free email sending (100 emails/day, 3,000/month on the free tier)

And a free hosting account:

- **[Vercel](https://vercel.com)** — free hosting for the app itself

Total cost to run this for a small team: **$0/month**, unless you outgrow the
free tiers.

## 1. Add your employees

Edit `config/employees.json` and replace the placeholder names with your real
team. `email` is optional — if you include it, that person also gets an email
when their request is approved or declined. If you leave it out, they just
won't get that extra notification (the manager approval flow still works
either way).

```json
[
  { "name": "Jane Perera", "email": "jane@yourcompany.com" },
  { "name": "Kasun Silva", "email": "kasun@yourcompany.com" }
]
```

## 2. Create a database (Neon)

1. Sign up at [neon.tech](https://neon.tech) (free, no credit card).
2. Create a new project. Copy the connection string it gives you (it looks
   like `postgres://user:password@host/dbname?sslmode=require`).
3. You don't need to create any tables yourself — the app creates the one
   table it needs automatically the first time it runs.

## 3. Set up email (Resend)

1. Sign up at [resend.com](https://resend.com) (free).
2. Create an API key (Settings → API Keys).
3. For a quick start, you can send from their shared test address:
   `onboarding@resend.dev` — this works immediately but can only send to the
   email address on your Resend account, which is fine for testing but not
   for real use with your team.
4. For real use: add your own domain under Domains, follow their DNS
   verification steps (a few DNS records, verified within minutes to a few
   hours), then send from `noreply@yourcompany.com` (or similar). This is the
   step most worth doing before rolling this out to your team.

## 4. Deploy (Vercel)

1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), sign up, click "Add New Project",
   and import that repository. Vercel auto-detects Next.js — no config needed.
3. Before the first deploy (or right after, then redeploy), add these
   environment variables in the Vercel project settings:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from step 2 |
   | `RESEND_API_KEY` | the Resend API key from step 3 |
   | `FROM_EMAIL` | e.g. `Office Tracker <onboarding@resend.dev>` (or your own verified domain) |
   | `MANAGER_EMAIL` | the manager's email address (comma-separate for more than one) |
   | `APP_BASE_URL` | your Vercel URL once deployed, e.g. `https://your-app.vercel.app` — **no trailing slash** |

4. Deploy. Once it's live, if you set `APP_BASE_URL` after the first deploy,
   redeploy once so the Approve/Decline links in emails point to the right
   place.

That's it — the link to send your team is your Vercel URL itself (e.g.
`https://your-app.vercel.app`). The manager (or anyone) can check
`https://your-app.vercel.app/requests` at any time to see the full list and
current status of every request.

## Running it locally first (recommended)

Before deploying, it's worth testing on your own machine:

```bash
npm install
cp .env.example .env.local   # then fill in the real values
npm run dev
```

Open `http://localhost:3000`, submit a test request, and check that the
approval email arrives with working Approve/Decline links (they'll point at
`http://localhost:3000` while APP_BASE_URL is set to that).

## How it works, briefly

- `app/page.js` — the request form employees use.
- `app/api/requests/route.js` — saves the request to the database and emails
  the manager.
- `app/api/decision/route.js` — what the Approve/Decline links in the email
  hit; updates the request's status and (if the employee has an email on
  file) notifies them of the outcome.
- `app/requests/page.js` — the status list.
- `config/employees.json` — the employee list.
- `lib/db.js`, `lib/email.js`, `lib/employees.js` — small helpers.

## Notes on scope

This is intentionally minimal, matching what was asked for: no login system,
no admin panel. The employee list is a JSON file you edit and redeploy when
someone joins or leaves. The Approve/Decline links are single-use in effect
(once a request is decided, clicking either link again just shows "already
decided"), but they aren't expiring tokens with an auth check beyond that —
fine for an internal tool, but worth knowing if you want to harden it later
(e.g. add a login for the `/requests` page, or make employee links expire).

Reasonable next steps if this grows: a simple shared password on `/requests`,
an admin page to edit the employee list without redeploying, or Slack
notifications alongside email.
