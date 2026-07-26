# Crescent Moon — Staff App build brief

Paste this to Claude Code with the repo open. **First: copy the design file into the
repo** (e.g. `design/staff-app.html`) so Claude Code can read it, and update the path
below if you put it somewhere else.

---

## Context

This repo is one Next.js 15 App Router app (React 19, TypeScript, Prisma +
PostgreSQL, `jose` signed-JWT cookie auth, Zod, bcrypt) serving both the public
Crescent Moon website and a single-boss admin backend. It deploys on Coolify
alongside self-hosted cal.diy (bookings, read over its API) and Plausible
(analytics, embedded). This app must never touch those services' schemas.

There is already a staff view at `/staff/[slug]` gated by an unguessable slug plus a
**shared** numeric PIN in a `cm_staff` cookie. We are replacing that shared PIN with
**per-staff PINs** and growing the view into a real app.

## Read before writing anything

1. `design/staff-app.html` — the full visual spec. Seven screens, each with their
   empty / error / already-done states, plus three iPad layouts and a build-spec
   section covering type scale, tap targets, spacing and colour roles. **This is the
   source of truth for layout, copy and interaction.** The copy in it is deliberate —
   use it rather than inventing your own.
2. `prisma/schema.prisma`, the existing `/staff/[slug]` route, the admin rota tool,
   and the cal.diy booking client.

## Verify, don't assume

Report back on these before building; several change the schema:

- Are existing model IDs `Int @default(autoincrement())` or `String @default(cuid())`?
  Match whatever `StaffMember` uses — the schema below assumes cuid, change it if wrong.
- Does `src/lib/menu-template.ts` hold structured data or raw markup? This decides
  whether seeding `StockItem` is a script or a manual list.
- How does the rota store times? The brief I was given says minutes-from-midnight with
  dates in UTC. Confirm, because the clock-in feature does arithmetic against shift ends.
- Is the shared-PIN value in `Setting`? It needs a clean removal path.

**Do not lose existing rota data.** Deactivated staff already preserve shift history —
keep that guarantee through any migration.

---

## 1 · Data model

```prisma
model StaffMember {
  // ...existing: name, active, order, shifts
  pinLookup   String?  @unique   // HMAC-SHA256(pin, STAFF_PIN_SECRET)
  pinHash     String?            // bcrypt
  pinSetAt    DateTime?
  timeEntries TimeEntry[]
}

model TimeEntry {
  id          String    @id @default(cuid())
  staffId     String
  clockInAt   DateTime
  clockOutAt  DateTime?
  autoClosed  Boolean   @default(false)
  adminEdited Boolean   @default(false)
  note        String?
  @@index([staffId, clockInAt])
}

model ChecklistItem {
  id      String  @id @default(cuid())
  label   String
  section String            // "Bar" | "Floor" | "Security" — free text, boss-editable
  order   Int
  active  Boolean @default(true)
}

model ChecklistRun {
  id            String    @id @default(cuid())
  businessDate  DateTime  @unique   // UTC midnight of the trading night
  submittedAt   DateTime?
  submittedById String?
  reopenedAt    DateTime?
  checks        ChecklistCheck[]
}

model ChecklistCheck {
  id          String   @id @default(cuid())
  runId       String
  itemId      String
  checkedById String
  checkedAt   DateTime @default(now())
  note        String?
  @@unique([runId, itemId])
}

model StockItem {
  id       String  @id @default(cuid())
  name     String
  category String            // "Sparkling · by the glass", "Food", "Bar sundries"
  active   Boolean @default(true)
  order    Int
}

model StockReport {
  id           String     @id @default(cuid())
  itemId       String?    // null for free-text / off-menu
  freeText     String?
  level        StockLevel
  note         String?
  reportedById String
  createdAt    DateTime   @default(now())
  resolvedAt   DateTime?
  resolvedById String?
  @@index([resolvedAt, createdAt])
}

enum StockLevel { LOW OUT }

model PushSubscription {   // boss's device(s) only — see §7
  id        String   @id @default(cuid())
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
}
```

**`businessDate` is the trading night, not the calendar day.** A checklist submitted at
00:12 belongs to the previous date. Write one helper for this and use it everywhere —
`businessDateFor(instant)` rolling over at, say, 05:00 UTC. Get this wrong and the
checklist splits across two rows at midnight.

---

## 2 · Auth

The PIN **is** the identity — there is no name picker, no username. Enter four digits,
the app knows who you are.

bcrypt salts per row, so you cannot look someone up by hash without looping every
staff member. Use two columns:

- `pinLookup` — HMAC-SHA256 of the PIN with `STAFF_PIN_SECRET`, `@unique`. One indexed
  query finds the person; the unique constraint stops two staff sharing a PIN (admin
  must surface "that PIN's taken" rather than failing silently).
- `pinHash` — bcrypt, verified after lookup. Constant-time compare, and take the same
  code path on unknown-PIN as on wrong-PIN so timing reveals nothing.

Gates stay layered: the unguessable slug is the **device** gate, the PIN is the
**person** gate. A wrong slug still 404s and reveals nothing.

**Rate limiting:** three tries, then the pad parks for 60 seconds — the design shows
both states (1.2, 1.3). Track failures per slug in the database, not in memory; Coolify
restarts would otherwise reset the counter. Four digits is only 10,000 combinations,
but three-tries-then-60s plus the slug makes brute force impractical.

**Session length differs by device, deliberately:**

- **Phone** — personal device, long-lived cookie, follows the OS lock.
- **iPad** — shared, **auto-locks after 2 minutes idle**. Design note 1a: "Nothing on
  the iPad assumes the person holding it is the person who unlocked it." Every checklist
  tick and stock report is signed with whoever's PIN is currently in.

Mark the device at first unlock ("this is the bar iPad" vs "this is my phone") and store
that choice; don't sniff the user agent.

Removing the shared PIN means retiring it from admin settings too, replaced by per-staff
PIN set/reset in the existing staff management screen.

---

## 3 · Routes

```
/staff/[slug]                  → PIN lock, or Home if unlocked
/staff/[slug]/rota             → mine | team toggle
/staff/[slug]/bookings         → tonight, read-only
/staff/[slug]/lockdown         → checklist run
/staff/[slug]/stock            → flagged list + report
/staff/[slug]/clock            → clock in / out
```

Keep `noindex, nofollow` and the existing `robots.ts` disallow. Server components where
possible; the keypad, checklist ticking and clock button need client interactivity.

---

## 4 · Screens

Follow `design/staff-app.html` for layout and copy. The behaviours it implies:

**01 PIN lock** — 92px keys (108 on iPad), four dots, DEL. Wrong PIN clears the dots and
counts down remaining tries; three misses show the locked-out state. The room's phone
number stays visible throughout.

**02 Home** — greets by first name. Shows tonight's shift if rostered, or the next shift
if not. Two nudges ("lockdown not started", "N items flagged low") sit in a quiet band,
stated once. When there's nothing, the band says so in one sage line. Then 104px tiles to
each section, each with a one-line status. A Lock button, always reachable.

**03 My rota** — own week in serif, 60px Mine/Team toggle. Handle split shifts as two
stacked slots, per-shift notes beneath the slot, per-day notes spanning the row in sage.
**Shifts ending after midnight print the day they end** ("Ends Sat") — never a bare
"01:00" the reader has to decode. Weekly hours total in the header.

**04 Bookings** — time, name, party size. Nothing else. Passed times dim to ~45–62%
rather than disappearing. The footnote about no guest contact details is not decoration —
it stops people hunting. Read-only: no tappable rows.

**05 Lockdown** — grouped Bar / Floor / Security. **The whole 76px row is the hit area**,
not the 34px box. Each tick stores who and when and renders it. Optional note per item.
Submit is visibly unavailable while items remain, labelled with the count left
("Submit — 11 left"). After submit the run is read-only, shows who locked it and the
per-item signatures, and **item notes escalate to the manager** (state 5.3 says "One note
went to the manager"). A manager can reopen a submitted run from admin.

**06 Low stock** — already-flagged items sit **above** the pickable list, so nobody
re-flags the Picpoul. Flagged menu items render dimmed and unpickable. One free-text row
at the bottom for off-menu things (tonic, till roll, blue roll). Detail screen: Low or
Out, optional note, and the confirmation line that it goes to the manager's list, signed
with the PIN and time.

**07 Clock** — one 240px outlined circle that flips state. Outlined, not filled: present,
not pushy. Elapsed time appears only once clocked in. No streaks, no missed-day warnings,
no badge on Home.

**Auto-close** — screen 7.2 promises "Forgot to clock out last time? It closed itself at
your rota end. No one was told." Implement it: any `TimeEntry` still open past its
matching rostered shift end gets closed at that end time with `autoClosed = true`.
Reconcile lazily on read (cheap, no infrastructure) rather than adding a cron. If there
was no rostered shift, close at a sane cap and flag it for the boss instead of guessing.

**iPad** — permanent 116px left rail (Home / Books / Rota / Close / Stock / Lock), Lock
always one reach away. Home runs three columns. The checklist opens **all three groups
side by side**, because that's how closing actually happens.

---

## 5 · Design tokens

From the build-spec section — read it directly rather than trusting this summary.

```
Fonts    Cormorant (300/400) · Hanken Grotesk (300) · IBM Plex Mono (400)
Colour   #14100F screen · #1B1518 raised · #E8E0CF type (never #FFF)
         #A8875A brass = action · #6E7F68 sage = done · #B4596B = out / wrong PIN
         #241019 wine — lock screen only
Grid     8px base · phone gutter 22–24 · iPad gutter 40–44 · hairline 1px @ 8–12% cream
Targets  floor 60 · list row 76 · booking row 84 · button 72 · keypad 92 (108 iPad)
         quick tile 88 · rail item 84 · clock 240 circle · gaps ≥10
Type     nothing tappable below 19px · no sans/serif below 15px
         mono 10.5–13px, caps only, 55–60% cream, tracking .26em
```

Rules for a dim room, all of which are testable:

- Largest lit area on any screen stays **under 20%**. No white sheets, no filled cards.
- Brass is the only fill. **One filled button per screen, maximum.**
- Dim past states to 45–62%; don't hide them.
- Elevation by hairline and a half-step darker surface. **Never shadow or gradient.**
- **No hover, no long-press, no swipe, no drag, no double-tap.** Anywhere.

---

## 6 · Admin additions

- Set / reset each staff member's PIN, with "that PIN's taken" on collision.
- Checklist item CRUD — same pattern as the existing What's On CMS (add, edit, reorder,
  hide/show).
- Last night's checklist on the dashboard: submitted time, who, any escalated notes.
- Reopen a submitted checklist run.
- Open stock reports as a queue, with resolve.
- Clock: actual vs rostered hours alongside the existing weekly totals, with auto-closed
  entries marked. **Rota hours are what get paid** — the design says so on screen 7.1, so
  never present clocked hours as authoritative.

---

## 7 · Push — read this carefully

The design states "**no push**" as a rule. That rule is about the **staff** app: staff are
never nagged, never badged, never counted at. Honour it completely.

Push is for the **boss only**, on the admin side, when stock is flagged. Separate surface,
separate audience, no contradiction.

Web Push on Android/Chrome works directly. **On iPhone it only works if the admin app is
added to the Home Screen first** — Apple has required that since introducing Web Push in
iOS 16.4. Implement it, but build the fallback too: if no push subscription exists, the
admin dashboard badge alone must be sufficient. Ask before adding an email or Telegram
fallback — that's a decision, not an implementation detail.

---

## 8 · Build order

One phase per branch, each independently shippable, matching how this repo has been
delivered so far. Stop after each and report.

1. **Per-staff PIN auth** — schema, HMAC+bcrypt lookup, rate limiting, device modes,
   lock screen (all three states), retire the shared PIN. Admin PIN management.
2. **Hub shell + My rota** — Home with tiles and nudge band, rota with Mine/Team,
   bookings screen. Reuses existing queries.
3. **Lockdown checklist** — admin CRUD, staff run, submit/lock/reopen, dashboard tile.
4. **Low stock** — seed `StockItem`, flagged list, report flow, admin queue and badge.
5. **Clock** — clock in/out, auto-close reconciliation, admin actual-vs-rostered.
6. **Push** — VAPID keys, service worker, subscription management, admin-side only.

## Non-negotiables

- Guest email and phone never appear in the staff app. Not once, not anywhere.
- Every checklist tick and stock report is attributed to a real staff member.
- Existing rota data and shift history survive intact.
- No new third-party auth, CMS or UI dependency. The repo's independence is the point.
- Every integration failure degrades gracefully, as the cal.diy and Plausible ones
  already do — a service being down must never produce a crash on a screen someone is
  using at 00:12 with the shutter half down.
