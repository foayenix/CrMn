# Crescent Moon — completion roadmap

Status of this document: written 19 September 2026 against `main` at `a8fea37`
and `claude/exciting-heisenberg-ddov9u` at `3060763`.

It has two jobs. First, record what is actually in the repository today, with
file references, so planning stops drifting from the code. Second, sequence the
remaining work so that each phase leaves the system shippable.

---

## Part 1 — Verified state of the repository

Everything in this section was checked against the tree, not recalled.

### What exists and works

| Area | Where | Notes |
|---|---|---|
| Public site | `src/app/page.tsx`, `src/lib/home-template.ts` | Static HTML fragments, auto-generated from `reference/legacy-site/`, injected via `dangerouslySetInnerHTML`. `home-template.ts` is ~38 KB of markup. |
| Menu page | `src/app/menu/page.tsx`, `src/lib/menu-template.ts` | Same pattern. |
| Admin app | `src/app/admin/(app)/` | 10 sections: dashboard, what's on, rota, lockdown checklist, stock, clock, bookings, analytics, staff view/PINs, notifications. |
| Staff app | `src/app/staff/[slug]/` | PIN entry, clock, rota, stock reporting, lockdown. |
| Auth | `src/lib/auth.ts`, `session.ts`, `staff-pin.ts` | bcrypt admin password, `jose`-signed session cookie, HMAC-keyed staff PIN lookup with a throttle model. |
| Bookings read | `src/lib/cal.ts` | Reads cal.diy v2 `/v2/bookings`. Defensive: returns a typed `configured: false` / `ok: false` result rather than throwing. |
| Push | `src/lib/web-push.ts`, `notify.ts`, `PushSubscription` model | VAPID, admin-only. |
| Admin PWA | `public/admin.webmanifest`, `public/admin-sw.js`, `src/app/admin/layout.tsx` | **Already installable.** Standalone display, scoped to `/admin`, maskable icons, Apple web-app meta. |

### Database

`prisma/schema.prisma` (282 lines) defines 14 models and 2 enums:

```
AdminUser        WhatsOnEntry     StaffMember      StaffPinThrottle
Shift            DayNote          ChecklistItem    ChecklistRun
ChecklistCheck   StockItem        StockReport      TimeEntry
PushSubscription Setting
enum ShiftKind   enum StockLevel
```

There is **no `Booking` model, no `Customer` model, no menu/wine models, no
audit log and no conversation storage.**

### Architecture facts that shape the next phases

**1. There are zero HTTP route handlers.** `find src/app -name route.ts` returns
nothing. The entire app is React Server Components plus 12 server-action files.
This is a clean design, but it means a WhatsApp webhook would be the first
public HTTP endpoint in the codebase — new surface, needing its own signature
verification, idempotency and rate-limiting conventions.

**2. Bookings are not in this database.** They live in cal.diy and are fetched
per page load. Nothing in `src/` writes a booking. This is the single largest
blocker to CRM and WhatsApp booking: there is no local record to attach a guest
to, no booking history to count, and no way to answer "how many covers last
Friday" without cal.diy being up.

**3. The public site is a generated HTML blob.** Structuring the menu as data
is not only a schema exercise — it means dismantling `menu-template.ts` and
rendering from the database, which changes how the site is built and deployed.

### Confirmed gaps

**Homepage date/time picker is inert.** `src/components/booking-widget.tsx`
declares `state = { size, day, time }`, but only party size is ever written or
read. `openBooking()` sends `metadata[partySize]` and `duration=90` and nothing
else. The file's own header comment claims "day tiles and time slots become
selectable" — no handler implements that. So the comment is stale as well as
the feature being absent. The flow really is: pick party size → open cal.diy →
pick the real date and time there.

**Newsletter form cannot submit.** In `home-template.ts` the footer contains
`<form onsubmit="return false">` wrapping an `<input type="email">`. Submission
is actively blocked, and the string "newsletter" appears nowhere in the
repository. There is no model, no action, no provider integration.

**No tests, no CI.** No `.github/` directory exists. `playwright` is in
`devDependencies` with no config file and no spec files anywhere in the tree.
`package.json` has no `test` script.

**Deployment could drop data — now fixed in code, pending one
operator step.** `build` runs `scripts/deploy-bootstrap.mjs`, which used to
attempt `prisma db push` and retry with `--accept-data-loss` unless
`SAFE_DB_PUSH` was set. It now runs `prisma migrate deploy` against reviewed
migration files in `prisma/migrations`, and there is no data-loss flag left in
the script. What remains is a one-time baseline of each existing database, which
needs shell access to that database and so cannot be done from here — see
[MIGRATIONS.md](MIGRATIONS.md). Until it is done, deploys fail safely with
`P3005` rather than touching live tables. Migrations still run from `build`,
which is a platform constraint rather than a preference; the note in
MIGRATIONS.md explains why and what to watch.

**Configuration-dependent screens.** Bookings, analytics and push all render
"not connected" states until `CAL_API_URL`/`CAL_API_KEY`, `PLAUSIBLE_*` and
`VAPID_*` are set. `.env.example` documents all of them. Note that
`NEXT_PUBLIC_*` values are inlined at build time, so changing them requires a
rebuild, not a restart.

### The pending branch

`claude/exciting-heisenberg-ddov9u` is exactly **2 commits ahead of `origin/main`**,
no divergence:

```
152feca  Say on the dashboard when the website's book button is only emailing
3060763  Write down how bookings get connected
```

17 files, +531 / −107. It adds `src/lib/cal-public.ts` and makes the admin
dashboard state plainly whether the public booking button opens cal.diy or
falls back to a mailto. Worth merging: it closes a real observability gap where
the backend could be configured while the public button silently emailed.

---

## Part 2 — Three decisions to make before building

These are blocking. Each one changes the shape of several later phases, and
guessing wrong means rework.

### Decision A — Where do bookings live?

Options:

1. **cal.diy stays the source of truth; mirror into a local `Booking` table.**
   A sync job plus webhook keeps a local copy. Lower risk, keeps cal.diy's
   availability engine. Cost: two systems, reconciliation logic, and the mirror
   can drift.
2. **CrMn owns bookings natively.** Own the availability model (tables, covers,
   sittings, turn time). Full control, one source of truth, WhatsApp and website
   trivially share it. Cost: rebuilding availability logic that cal.diy already
   provides, and migrating existing bookings.

Recommendation: **option 1 now, with the local `Booking` table designed so it
could become authoritative later.** CRM and WhatsApp both need a local booking
record; neither needs CrMn to own availability yet.

### Decision B — WhatsApp provider

Meta Cloud API directly, or a provider layer (Twilio, 360dialog and similar).
This determines webhook format, signature verification, template approval
workflow and per-message cost. Do not start Phase 5 before this is chosen.

Note: the template/consent rules cited in our discussion (promotional vs
transactional messages, the 24-hour service window, and UK direct-marketing
consent under PECR) need re-verifying against the provider's current
documentation and ICO guidance **at the time you build Phase 8**, not
carried forward from this document. The rules and the provider's
implementation of them both change.

### Decision C — Newsletter

Either wire the footer form to something (a provider, or a local
`MailingListSignup` model with export) or remove it. It should not ship as
markup that silently discards input. This is a small task in either direction
and it should not wait for Phase 8.

---

## Part 3 — Phases

Each phase states entry criteria, the work, and how you know it is finished.
No phase should be started before the previous one's exit criteria are met.

### Phase 0 — Freeze V1

*Entry: none. This is the starting point.*

- Merge `claude/exciting-heisenberg-ddov9u` into `main` after verification.
- Tag `v1.0.0`.
- Create `develop`; adopt `feature/*` branches from it.
- Take a verified database backup — and test restoring it, not just taking it.
- Stand up a staging environment with its own database and its own cal.diy
  target. Nothing from here on gets developed against the live venue.
- Record the production environment variable set (names only, not values) so a
  rebuild is reproducible.

*Exit: `main` is tagged, deployable, backed up, and a staging environment
exists that mirrors it.*

### Phase 1 — Production hardening

*Entry: Phase 0 complete.*

This is the most important phase in the document. Everything after it adds
data that is expensive to lose.

- **Migrations.** *(Code side done.)* `prisma/migrations/0_init` is generated
  and committed, `deploy-bootstrap.mjs` runs `prisma migrate deploy`, and the
  `--accept-data-loss` path is deleted. Still outstanding: baseline each
  existing database (`prisma migrate resolve --applied 0_init`), which needs a
  shell against that database — procedure and the drift check that must precede
  it are in [MIGRATIONS.md](MIGRATIONS.md). Moving schema mutation out of the
  `build` step remains open, and is blocked on how Vercel deploys are run.
- **Tests.** Add a `test` script. Unit-test the pure logic first, where the
  value-per-hour is highest: `src/lib/business-date.ts`, `dates.ts`, `rota.ts`,
  `checklist.ts`, `stock.ts`, `clock.ts`, and the `cal.ts` response parsing
  (including the documented case where a missing `cal-api-version` header
  returns HTTP 200 with an object instead of an array).
- **E2E.** Add `playwright.config.ts` and cover: admin login → create event →
  event visible on the public site; staff PIN → clock in → report stock →
  admin sees the report; lockdown run → completion recorded.
- **CI.** Add `.github/workflows/ci.yml` running lint, typecheck, unit tests
  and Playwright on every push and pull request.
- **Audit log.** Add an `AuditEvent` model (`actorType`, `actorId`, `action`,
  `entityType`, `entityId`, `before`, `after`, `source`, `createdAt`) and write
  to it from the existing server actions. This must exist before anything
  automated is allowed to mutate data.
- **Error reporting and backups.** Server-side error capture, and scheduled
  database backups with a documented, tested restore procedure.

*Exit: a deploy cannot silently drop a column; CI is green on `main`; every
mutating action writes an audit row; a restore has been performed successfully
at least once.*

### Phase 2 — Mobile owner experience

*Entry: Phase 1 complete.*

The PWA shell already exists — this phase is information architecture, not
installability.

- Replace the flat 10-link `AdminNav` with a mobile bottom bar (Home, Bookings,
  Team, Customers, More) and a More sheet for the rest.
- Rebuild the dashboard as a tonight-first summary: covers, bookings, staff on,
  stock flags, unresolved closing notes, then large tap targets.
- Audit every admin form for one-handed phone use. `admin.css` currently has a
  single `@media (max-width: 720px)` block; that is responsive, not designed.
- Offline behaviour: decide deliberately what `admin-sw.js` caches.

*Exit: every admin operation can be completed on a phone without pinch-zoom or
horizontal scroll, verified on a real iOS and a real Android device.*

### Phase 3 — Business data layer

*Entry: Phase 2 complete. Decision A made.*

- Add `MenuCategory`, `MenuItem`, `Wine`, `Allergen` and availability models.
  Wine needs the structured attributes the agent will query on: colour,
  sweetness, body, acidity, grape, region, glass and bottle price, availability.
- Admin CRUD for all of it.
- Migrate the current menu content out of `menu-template.ts` into the database.
- Render `/menu` from the database.
- Link `StockItem` to `MenuItem`/`Wine` so stock and menu stop being separate
  name-matched worlds.

Principle: **the database holds facts, the AI explains them.** Allergen data in
particular must never be inferred — an uncertain allergen question escalates to
a human.

*Exit: the menu can be changed by the owner from his phone and the public site
reflects it, with no code deploy.*

### Phase 4 — Bookings and CRM

*Entry: Phase 3 complete.*

- Add the local `Booking` model and the cal.diy sync per Decision A.
- Add `Customer`, `CustomerIdentity` (phone/email), `CustomerPreference`,
  `MarketingConsent` and `Suppression`.
- Link bookings to customers; backfill from historical cal.diy data where
  identity is unambiguous.
- Preferences carry provenance (`source: CUSTOMER_STATED` vs inferred) so the
  system never asserts something the guest did not say.
- Customers section in the owner app: history, visit count, preferences, notes,
  consent state.
- Fix or remove the homepage date/time picker (see Part 1) so the site stops
  implying functionality it lacks.
- Resolve the newsletter per Decision C.

*Exit: a returning guest is recognised across bookings, and the owner can see
guest history on his phone.*

### Phase 5 — WhatsApp infrastructure

*Entry: Phase 4 complete. Decision B made.*

Messaging plumbing only. No AI in this phase.

- First `route.ts` in the codebase: the inbound webhook, with signature
  verification, replay and duplicate-delivery protection.
- `Conversation` and `ConversationMessage` models; store every inbound and
  outbound message with provider message id and delivery status.
- Customer resolution from phone number.
- Outbound send with retry and idempotency.
- Human handoff: a staff-visible inbox, and a clear rule for when the system
  stops auto-replying.

*Exit: a message to the venue is reliably received, stored, attributed to a
customer, and can be answered by a human from the owner app.*

### Phase 6 — Customer concierge

*Entry: Phase 5 complete.*

Give the model **tools, never database access**: `search_menu`, `search_wines`,
`get_opening_hours`, `get_upcoming_events`, `get_private_hire_info`,
`handoff_to_staff`. Every factual answer comes from a tool result.

Includes the budget planner — real prices, real arithmetic, model-written
explanation.

*Exit: the agent answers venue questions correctly from verified data, and
escalates rather than guessing. Measured against a written evaluation set,
including deliberate allergen and price traps.*

### Phase 7 — WhatsApp bookings

*Entry: Phase 6 complete.*

`check_availability`, `create_booking`, `modify_booking`, `cancel_booking`,
writing through the same path as the website.

*Exit: a WhatsApp booking and a website booking are indistinguishable in the
diary and in the owner app.*

### Phase 8 — Marketing

*Entry: Phase 7 complete. Consent and template rules re-verified per Decision B.*

`Campaign`, `CampaignAudience`, `CampaignMessage`, `CampaignDelivery`, plus the
consent and suppression models from Phase 4. Segments, AI-drafted copy,
owner preview, **explicit owner approval before any send**, unsubscribe
handling, campaign history.

*Exit: the owner can compose, approve and send a segmented campaign from his
phone, and every recipient's consent basis is recorded and auditable.*

### Phase 9 — Owner assistant, read-only

*Entry: Phase 8 complete.*

Query-only: tonight's numbers, who is working, stock flags, closing notes.
Read-only is a deliberate stopping point, not a stepping stone to be rushed
through.

*Exit: the owner can get an accurate operational picture without opening the app.*

### Phase 10 — Controlled owner actions

*Entry: Phase 9 has been in real use for a meaningful period without incident.*

Mutations via WhatsApp, always as a proposal requiring explicit confirmation,
always audit-logged with `actorType: AI_AGENT`, always reversible.

*Exit: rota, event, booking and stock changes work through WhatsApp; no
mutation has ever occurred without a confirmation step.*

### Phase 11 — Launch QA and venue trial

Full journeys for customer, staff and owner. Device matrix. Failure testing:
cal.diy down, WhatsApp provider down, database restore. Accessibility pass.
Security review. Then run it inside the venue and let real friction — not
feature ideas — set the V3 backlog.

---

## Part 4 — Explicitly not in this programme

POS integration · online ordering · payments · loyalty points · predictive
stock ordering · autonomous marketing · a staff AI agent · table-side ordering ·
multi-venue support · generic SaaS onboarding.

Each is defensible later. None is defensible before Crescent Moon itself is
hardened and proven.

---

## Part 5 — Definition of done

V2 is complete when the owner can leave his laptop at home and, from his phone,
manage bookings, customers, rota, staff, events, stock, closing issues,
analytics and campaigns; ask CrMn operational questions over WhatsApp and get
accurate answers; while customers can discover the venue, understand the menu,
get recommendations and make a real reservation from either the website or
WhatsApp — all through one backend, with one source of truth per fact.
