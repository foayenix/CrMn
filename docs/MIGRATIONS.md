# Database migrations

The app's schema is applied by reviewed migration files in `prisma/migrations`.
It used to be applied by `prisma db push`, which the deploy script would retry
with `--accept-data-loss` when the safe push was refused. That is gone.

Everything below was verified against PostgreSQL 16 before it was written down.

## Why this changed

`db push` compares the schema to the database and does whatever it takes to make
them match. It has no record of what it has done, no review step, and — with
`--accept-data-loss` — permission to drop columns and tables. It runs from
`npm run build`, so that permission belonged to every deploy.

`prisma migrate deploy` applies the files in `prisma/migrations` and nothing
else. There is no `--accept-data-loss` equivalent. What will happen to the
database is whatever is in those files, reviewable in the diff before it is
merged.

## One-time baseline of an existing database

**This has not been done yet on production or staging.** Until it is, the next
deploy will fail — deliberately and safely — with `P3005`.

A database built by the old `db push` path has all the right tables but an empty
migration history, so Prisma does not know that `0_init` has effectively already
been applied. Left alone it would try to `CREATE TABLE` over live tables.
Prisma refuses rather than risk it, which is the right behaviour and is why the
deploy fails loudly instead of doing damage.

Baselining records `0_init` as already applied, without running it.

Run this **once per database** — production, staging, and any other long-lived
copy — from a shell with that database's `DATABASE_URL`:

```bash
# 1. Back up first. This is the step you cannot undo by editing a file.
pg_dump "$DATABASE_URL" > crmn-backup-$(date +%Y%m%d-%H%M).sql

# 2. Prove the database actually matches the schema. The baseline ASSERTS
#    this — it does not check it. If the database has drifted, baselining
#    records a lie and the drift becomes permanent and invisible.
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --exit-code
# "No difference detected" → safe to continue.
# Any SQL in the output → STOP. The database has drifted. Work out why before
# going further; baselining will not fix it and will hide it.

# 3. Record 0_init as applied, without running it.
npx prisma migrate resolve --applied 0_init

# 4. Confirm.
npx prisma migrate status      # → "Database schema is up to date!"
npm run db:migrate             # → "No pending migrations to apply."
```

Verified end to end on a database created by `db push` and holding rows: the
baseline left every row in place, and the drift check afterwards reported no
difference.

There is deliberately no `npm run` shortcut for step 3. It is a one-time
operation that asserts something about a specific database, and it should not
feel like a routine command.

## Day-to-day

**Changing the schema.** Edit `prisma/schema.prisma`, then, against a local
database:

```bash
npm run db:migrate:dev -- --name add_booking_table
```

This writes a new folder under `prisma/migrations`, applies it locally, and
regenerates the client. Commit the generated SQL — read it first. It is the
part of the change that touches live data, and it is the part code review
should look at hardest.

**Deploying.** `npm run build` runs `scripts/deploy-bootstrap.mjs`, which runs
`prisma migrate deploy` and then the idempotent seeds. Nothing else applies
schema changes.

**Checking a deployed database.** `npm run db:migrate:status`.

## Things that will bite

**A migration that fails part-way** is recorded as failed and blocks every later
deploy until it is resolved. Fix the cause, then either
`prisma migrate resolve --rolled-back <name>` if the database is untouched, or
`--applied <name>` if you have finished the work by hand. Prisma will not guess
which.

**`db push` is no longer available as an npm script.** Running it by hand
against a database that has a migration history will silently reintroduce the
drift this whole change exists to prevent.

**Migrations still run from the build step.** That is a platform constraint,
not a preference: Vercel is serverless and never runs `npm start`, so a deploy
hook is the only point where a schema change can be applied. It is much safer
than it was — only reviewed files, no data-loss flag — but it does mean any
build pointed at a database will migrate it. Check which `DATABASE_URL` each
deployment target holds, preview environments included.

**A shadow database is needed for `migrate dev`, not for `migrate deploy`.**
Local development needs a database it can create and drop; deploys do not.
