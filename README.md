# Crescent Moon — site + admin backend

Single Next.js app that serves the public wine-bar site **and** the boss's admin
area, replacing the old static Vercel site. Built to run on Coolify alongside
self-hosted cal.diy (bookings) and Plausible (analytics).

## Stack
- Next.js 15 (App Router) + React 19 + TypeScript
- Prisma + PostgreSQL (this app's own DB — separate from cal.diy / Plausible)
- Custom bcrypt + signed-cookie session (single boss login)

## Local dev
```bash
npm install
cp .env.example .env          # then edit DATABASE_URL / SESSION_SECRET
npx prisma db push            # create tables
npm run seed                  # seed What's On + staff + default admin login
npm run dev                   # http://localhost:3000
```
Default seeded login: `boss@crescentmoonbar.co.uk` / `changeme123` — change it:
```bash
npm run set-password -- boss@crescentmoonbar.co.uk 'a-strong-password'
```

## Staff app (`/staff/<slug>`)

Back-of-house app for phones and the shared bar iPad, built to
`design/staff-app.html`. Two gates, layered:

- the **unguessable slug** is the device gate — a wrong one 404s and says nothing;
- a **personal four-digit PIN** is the person gate. The PIN *is* the identity:
  there's no name picker, and whoever's PIN is in signs whatever gets done.

PINs are stored twice — `pinLookup` (HMAC-SHA256 keyed by `STAFF_PIN_SECRET`,
unique so two staff can't share one) for the lookup, and bcrypt `pinHash` for
the verify. Three wrong tries park the pad for 60 seconds, counted per slug in
the database so a restart doesn't hand back the tries.

Session length is a question, not a guess: the app asks once whether a device is
someone's phone (long-lived, follows the OS lock) or the bar iPad (locks itself
after two minutes idle, because nothing on it may assume the person holding it
is the person who unlocked it).

Set PINs in Admin → Staff app & PINs, or from the command line:
```bash
npm run set-pin -- "Dan" 4821
```
Deactivating a staff member on the Rota page stops their PIN working and keeps
every shift they ever worked.

Screens so far:

| route | what it shows |
| --- | --- |
| `/staff/<slug>` | Home — tonight's shift, one quiet nudge band, tiles |
| `/staff/<slug>/rota` | your week in serif; `?view=team` for everyone's |
| `/staff/<slug>/bookings` | tonight's tables: time, name, party size, nothing else |

On the iPad a permanent 116px rail replaces the back arrow and Lock stays one
reach away; Home gains a column so tonight's tables aren't behind a tap.

"Tonight" means the **trading night**, not the calendar day — 00:12 on Sunday
still belongs to Saturday. `src/lib/business-date.ts` is the one helper that
decides this (rollover at 05:00 UTC); everything that says "tonight" uses it.

## Layout
- `src/app` — public site (`/`, `/menu`) + admin (`/admin/*`) + staff view (`/staff/*`)
- `src/lib` — prisma client, session/auth, settings, ported homepage/menu templates
- `scripts` — seed, set-password, set-pin
- `design` — the staff app design spec + build brief
- `reference/legacy-site` — the original static site, kept for reference

The public homepage's "What's On" renders live from the database, so the boss's
edits appear with no redeploy.
