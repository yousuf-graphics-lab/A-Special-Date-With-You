# For Samee, My Love

A private, six-screen date proposal made by **Yousuf** for **Samiya**.

The journey is deliberately linear — a birthday lock, a personal letter, a
proposal, a planner where she chooses everything, a bouquet that blooms, and a
final message:

1. **The birthday lock** — `Hey, My Samee`, one answer only she knows.
2. **The letter** — the real letter, revealed like handwriting on warm paper.
3. **The proposal** — `Samee, Can I Steal A Day With You?`
4. **The planner** — date (Asia/Dhaka), time, place, activities, a message for Yousuf.
5. **The bouquet** — a hand-drawn bouquet that blooms, rose by rose.
6. **The last page** — the thank-you letter and a card with the saved plan.

At `/admin` there is a private dashboard for Yousuf: real statistics, her full
response, planning status, private notes, PDF/CSV export and response history.

---

## Stack

| Part | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 with a custom ivory/blush/burgundy/gold theme |
| Motion | Framer Motion (respects `prefers-reduced-motion`) |
| Icons | Lucide React |
| Fonts | Playfair Display, Cormorant Garamond, Inter, Great Vibes (self-hosted) |
| Database | Postgres — Supabase in production, embedded PGlite locally |
| Auth | Server-side sessions: bcrypt hash + signed HttpOnly cookie + DB session row |
| Deploy | Vercel |

No animation library is used for the petals or the music; both are plain CSS
and the Web Audio API so they stay cheap on low-end phones.

---

## 1. Run it locally

```bash
npm install
cp .env.example .env.local     # already fine for development
npm run dev                    # http://localhost:3000
```

With no `DATABASE_URL`, the app starts an embedded PostgreSQL (PGlite) inside
the Next.js server, applies the same SQL migrations, and stores data in
`.data/pglite`. Same queries, same schema — no mocks, no fake rows.

Development defaults (from `.env.local`):

* birthday lock — `14112007`
* dashboard — `/admin`, `samee_mine` / `samee_my_love`

---

## 2. Deploy for real (Vercel + Supabase)

### a. Database

1. Create a Supabase project (Singapore / `ap-southeast-1` is closest to Dhaka).
2. **Settings → Database → Connection string → URI**. Copy the **pooled**
   connection string (port `6543`) — serverless functions need the pooler.
3. Apply the schema and create the admin account **once** from your machine:

```bash
export DATABASE_URL='postgresql://postgres.xxxx:PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres'
export ADMIN_USERNAME='samee_mine'
export ADMIN_PASSWORD='choose-a-long-private-password'
npm run db:setup
```

`db:setup` runs every file in `supabase/migrations`, then stores a bcrypt hash
(rounds 12) of the admin password. The plaintext password is never stored or
logged. Re-running it rotates the hash and signs out existing sessions.

### b. Environment variables (Vercel → Project → Settings → Environment Variables)

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Supabase pooled connection string |
| `DATABASE_SSL` | `true` |
| `BIRTHDAY_LOCK_PASSWORD` | `14112007` |
| `SESSION_SECRET` | 32+ random characters — `openssl rand -base64 48` |
| `ADMIN_USERNAME` | `samee_mine` |
| `ADMIN_PASSWORD` | the same long password you passed to `db:setup` |

Notes:

* The birthday answer lives **only** on the server. It is compared with a
  timing-safe comparison and never appears in HTML, JS, or an API response.
* If `BIRTHDAY_LOCK_PASSWORD` is missing in production the lock is disabled
  (never replaced by a guessable default) and a warning is logged.
* Changing `ADMIN_PASSWORD` in Vercel rotates the stored hash on the next
  request and invalidates every open admin session.
* If `SESSION_SECRET` is missing in production, admin login refuses to run
  instead of shipping a known key.

### c. Deploy

Import the repository into Vercel and deploy `main`. No build-time database
access is needed — every page that touches data is dynamic.

---

## 3. Security model

* **Nothing is public.** All eight tables have Row Level Security enabled with
  **no policies**, so the anon/publishable key can read nothing. All access
  happens server-side over the privileged connection string.
* **Admin credentials** live in environment variables, are hashed with bcrypt,
  and are compared server-side only.
* **Sessions** are a signed JWT (HS256) in an `HttpOnly`, `Secure`,
  `SameSite=Lax` cookie. The JWT carries only a session id; the server also
  validates a hashed session row in `admin_sessions` with an expiry, and
  sign-out revokes it.
* **Rate limits**: 10 failed logins per 15 minutes per username or IP, then a
  15 minute lock after 5 consecutive failures for the account. The birthday
  lock allows 6 wrong tries per 10 minutes per visitor and 25 per IP.
* **No indexing**: `robots.txt` disallows everything, every response carries
  `X-Robots-Tag: noindex, nofollow, noarchive`, and there is no public link to
  `/admin`.
* **State-changing requests** additionally check the `Origin` header.
* **Validation**: every date plan is re-validated on the server with Zod,
  including "not in the past" against **Asia/Dhaka** rather than the server's
  own timezone.
* **Privacy**: the visitor cookie is an opaque random token, never a name or
  email. Her message and selections are only rendered behind the dashboard.

---

## 4. Data model

| Table | Purpose |
| --- | --- |
| `visitors` | One row per browser: visits, `unlocked_at`, `letter_opened_at`, `accepted_at`, `thinking_at`, `submitted_at` |
| `proposal_events` | Timeline: visit, unlock attempts (success/failure), acceptance, submission, updates |
| `proposal_responses` | The date plan: date, time (+ custom flag), place, activities, her message, status, private notes |
| `proposal_response_history` | A snapshot of every superseded version, so edits never create duplicates |
| `admin_users`, `admin_sessions`, `login_attempts` | Dashboard authentication |
| `admin_notes_log` | Audit trail of the owner's status/notes changes |

Dates are stored as `date` and returned as `YYYY-MM-DD` strings; timestamps are
returned as ISO strings and formatted in **Asia/Dhaka** everywhere they are
shown. Every response row records `time_zone = 'Asia/Dhaka'`.

A visitor has **at most one current response** (partial unique index).
Saving identical choices again is a no-op, so double-clicks and refreshes are
harmless.

---

## 5. The dashboard (`/admin`)

* **Overview** — visits, unlock status, acceptance status, submission status,
  latest response time, current status. Real counts only, no sample data.
* **Her response** — date, time, place, activities, her message, acceptance
  and submission timestamps, response version.
* **Decision management** — status (New → Reviewed → Planning → Confirmed →
  Completed), private notes, "mark reviewed", and PDF or CSV export.
* **History** — earlier responses and the earlier versions of the current one.

When there is nothing yet, the dashboard shows an honest empty state.

---

## 6. Content

Every word Samiya reads is in `src/lib/content.ts` — the letter, the proposal,
the planner labels, the bouquet note and the final message. Edit that one file
to change the wording; nothing else needs to change.

---

## 7. Project layout

```
src/
  app/
    page.tsx                     the experience (server → client handoff)
    admin/                       login + protected dashboard
    api/                         session, unlock, progress, plan, admin/*
    layout.tsx globals.css       fonts, theme tokens, paper textures
  components/
    experience.tsx               stage machine + transitions
    screens/                     lock, letter, proposal, planner, bouquet, finale
    calendar.tsx                 Asia/Dhaka date picker
    flowers.tsx lock-illustration.tsx ambience.tsx ornaments.tsx music.tsx
    admin/                       dashboard widgets
  lib/                           db, auth, validation, content, formatting
supabase/migrations/0001_init.sql
scripts/                         migrate.mjs, seed-admin.mjs
```

---

## 8. Accessibility & performance

* Visible focus rings, labelled inputs, `aria-live` for errors and confirmations,
  `aria-pressed` on every choice, a skip link, and a `role="dialog"` review step.
* `prefers-reduced-motion` removes petals, transitions and the bloom sequence
  instead of merely speeding them up.
* Petals animate with transform/opacity only; the bouquet is pure SVG; the
  music is generated locally so there are no audio downloads.
* Music never autoplays — it starts from a visible toggle and is remembered.

---

## 9. Scripts

```bash
npm run dev         # local development (embedded Postgres)
npm run build       # production build
npm run start       # run the production build
npm run typecheck   # tsc --noEmit
npm run db:migrate  # apply supabase/migrations to DATABASE_URL
npm run db:setup    # migrate + create/rotate the admin account
```

---

Made with an entire heart by Yousuf, only for Samiya.
