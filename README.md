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
The July 2026 rota from the Excel sheet can be imported with `npm run seed-rota`.
It rewrites every shift between 2026-06-29 and 2026-08-02, so it's a one-off
import, not something to re-run once the boss has edited the rota.

## Deploying

`npm run build` runs `scripts/deploy-bootstrap.mjs`, which pushes the Prisma
schema and runs the idempotent seeds before Next builds. That's there because a
serverless host never runs `npm start`, so a database bootstrap hung off the
start script would silently never happen. With no `DATABASE_URL` it skips, so
local builds and CI don't need a database.

Required environment variables on any deployment:

| variable | why |
| --- | --- |
| `DATABASE_URL` | Postgres for this app. Without it the site 500s — the homepage reads What's On at request time. |
| `SESSION_SECRET` | Signs the admin and staff cookies. Falls back to a known dev string if unset, so set it. |
| `ADMIN_INITIAL_PASSWORD` | The first admin login's password. **In production the seed will not create a login without it** rather than publish the one in this repo — set it or nobody can sign in. |
| `STAFF_PIN_SECRET` | Keys the staff PIN lookup. Changing it invalidates every stored PIN. |

Then, in the admin area: **Staff app & PINs** to set each person's PIN (they're
never seeded — until one is set the staff app shows "Not ready yet"), and copy
the staff link from that page. The link is built from the request's host, so it's
correct on whatever domain you deploy to with nothing to configure.

Note `next.config.ts` only asks for Next's `standalone` output when not building
on Vercel, which builds its own serverless output.

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

## Push notifications (the boss only)

The staff app has **no** push, no badges and no counts — that rule is absolute.
Push is a separate surface for a separate audience: one buzz on the boss's phone
when the floor flags something low.

Web Push is implemented directly against RFC 8291 (message encryption), RFC 8188
(aes128gcm) and RFC 8292 (VAPID) in `src/lib/web-push.ts`, using Node's crypto
and the `jose` already here — **no new dependency**. Generate a keypair once:
```bash
npm run vapid                 # then paste the three lines into .env
```
On Android/Chrome it works straight away. On iPhone and iPad it only works once
the admin app has been added to the Home Screen (Apple has required that since
iOS 16.4), and the Notifications page says so when it detects that case.

If push never works — no keys, no permission, unsupported browser — nothing is
lost: the count beside **Low stock** in the sidebar and the dashboard block are
the same information, on every device, with no set-up. Push is the convenience;
the badge is the guarantee. Sending happens in `after()` with a 10-second
timeout, so a push service having a bad night can never make someone on the
floor wait for a screen.

## Layout
- `src/app` — public site (`/`, `/menu`) + admin (`/admin/*`) + staff view (`/staff/*`)
- `src/lib` — prisma client, session/auth, settings, ported homepage/menu templates
- `scripts` — seed, seed-stock, seed-july-rota, set-password, set-pin,
  generate-vapid, deploy-bootstrap
- `design` — the staff app design spec + build brief
- `reference/legacy-site` — the original static site, kept for reference

The public homepage's "What's On" renders live from the database, so the boss's
edits appear with no redeploy.
