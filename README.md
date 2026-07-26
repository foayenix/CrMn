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
npm run seed                  # seed What's On + staff + checklist + admin login
npm run seed-stock            # parse the menu into pickable low-stock items
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
| `/staff/<slug>/lockdown` | the closing checklist for tonight, then read-only once submitted |
| `/staff/<slug>/stock` | what's already flagged, then the menu; free text for off-menu things |
| `/staff/<slug>/clock` | one circle that flips state; reached from Home, not the rail |

On the iPad a permanent 116px rail replaces the back arrow and Lock stays one
reach away; Home gains a column so tonight's tables aren't behind a tap.

"Tonight" means the **trading night**, not the calendar day — 00:12 on Sunday
still belongs to Saturday. `src/lib/business-date.ts` is the one helper that
decides this (rollover at 05:00 UTC); everything that says "tonight" uses it,
including which `ChecklistRun` a tick lands on.

The closing list is boss-editable in Admin → Lockdown, grouped however you like
(a group sits where its first item sits). Every tick stores the staff member who
made it, so a shared iPad passed between two people produces two names. Notes
left on items escalate to the admin dashboard when the night is submitted, and
a manager can reopen a submitted night without disturbing its signatures.

Low stock is a list, not an order. The pickable items are **parsed from the live
menu** (`npm run seed-stock` reads `src/lib/menu-template.ts`), so the names on
the pad are the names on the list and a hand-typed copy can't drift; items that
leave the menu are deactivated rather than deleted, so old reports keep pointing
at something real. Off-menu things — tonic, till roll, blue roll — never become
rows: they go through the free-text row, which is what it's for. What's already
flagged sits above the list and is unpickable, so nobody re-flags the Picpoul.
The boss works through open reports in Admin → Low stock, which carries the
count as a badge.

Clocking in is optional and nobody is chased for it. Forgetting to clock *out*
costs nothing: `src/lib/clock.ts` closes a stale entry at that person's rostered
end — the late slot of a split shift, never the lunchtime one — or caps it at 12
hours with a note when there was no shift to close against. It reconciles lazily
whenever the clock screen or Admin → Clock is read, so there's no cron to keep
alive, and a two-hour grace window means a manual clock-out always wins. Admin
shows clocked hours **beside** rostered ones, never instead of them: the rota is
what gets paid, and the staff app says so on screen.

## Layout
- `src/app` — public site (`/`, `/menu`) + admin (`/admin/*`) + staff view (`/staff/*`)
- `src/lib` — prisma client, session/auth, settings, ported homepage/menu templates
- `scripts` — seed, seed-stock, set-password, set-pin
- `design` — the staff app design spec + build brief
- `reference/legacy-site` — the original static site, kept for reference

The public homepage's "What's On" renders live from the database, so the boss's
edits appear with no redeploy.
