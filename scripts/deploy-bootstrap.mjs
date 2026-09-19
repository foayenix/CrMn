/**
 * Bring a deployed database up to date, from the build step.
 *
 * Runs as part of `npm run build`, because the platforms this app is deployed to
 * don't all give us a shell:
 *
 *   - Vercel is serverless. `npm start` never runs there, so anything hung off
 *     the start script (migrations, seeding) would silently never happen and the
 *     app would boot against an empty or missing database.
 *   - Coolify/Docker do run a start command, but doing it here keeps one code
 *     path for both.
 *
 * Skips quietly when DATABASE_URL is unset so local builds and CI don't need a
 * database. When it does run, a failure fails the build — a deploy that can't
 * reach or migrate its database should not go live looking healthy.
 *
 * Only idempotent steps belong here. `scripts/seed-july-rota.ts` is excluded on
 * purpose: it rewrites a date range and would discard the boss's rota edits on
 * every deploy.
 */
import { execSync } from "node:child_process";

const run = (cmd, opts = {}) =>
  execSync(`npx --no-install ${cmd}`, { encoding: "utf8", ...opts });

if (!process.env.DATABASE_URL) {
  console.log(
    "[deploy-bootstrap] No DATABASE_URL — skipping migrations and seeding.\n" +
      "[deploy-bootstrap] Set DATABASE_URL in the deployment's environment to " +
      "bootstrap the database at build time.",
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Schema
//
// `prisma migrate deploy` applies the reviewed migration files in
// prisma/migrations and nothing else. It never invents a change, never drops a
// column to make the schema fit, and has no --accept-data-loss equivalent.
//
// This replaced `prisma db push`, which this script used to run with an
// --accept-data-loss retry when the safe push was refused. That was fine while
// the database was empty and is not fine now: it hands a build step permission
// to drop production data, and it left no record of what had been applied.
//
// A database created by the old `db push` path has the right tables but no
// migration history, so `migrate deploy` refuses it with P3005 rather than
// replaying 0_init over live tables. Baselining it once is what clears that —
// see docs/MIGRATIONS.md. The error handler below says so in as many words,
// because P3005 at deploy time is otherwise a puzzle.
// ---------------------------------------------------------------------------
console.log("\n[deploy-bootstrap] Applying Prisma migrations…");
try {
  process.stdout.write(run("prisma migrate deploy"));
} catch (err) {
  const output = `${err.stdout ?? ""}${err.stderr ?? ""}`;
  process.stdout.write(output);

  if (output.includes("P3005")) {
    console.error(
      "\n[deploy-bootstrap] FAILED: this database has tables but no migration " +
        "history, so Prisma will not apply migrations to it.\n" +
        "[deploy-bootstrap] That is what a database created by the old " +
        "`prisma db push` path looks like. Baseline it ONCE, against this " +
        "database, from a shell with the same DATABASE_URL:\n\n" +
        "    npx prisma migrate resolve --applied 0_init\n\n" +
        "[deploy-bootstrap] Before you do, confirm the database really does " +
        "match the schema — the baseline asserts that it does:\n\n" +
        "    npx prisma migrate diff --from-url \"$DATABASE_URL\" \\\n" +
        "      --to-schema-datamodel prisma/schema.prisma --exit-code\n\n" +
        "[deploy-bootstrap] \"No difference detected\" means it is safe. Any " +
        "other output means the database has drifted and needs looking at by " +
        "hand first. Full procedure: docs/MIGRATIONS.md",
    );
    process.exit(1);
  }

  if (output.includes("P1001") || output.includes("P1000") || output.includes("P1017")) {
    console.error(
      "\n[deploy-bootstrap] FAILED: could not reach the database.\n" +
        "[deploy-bootstrap] Check DATABASE_URL, and that the database accepts " +
        "connections from the build environment (Prisma needs the direct, " +
        "non-pooled URL, usually with ?sslmode=require).",
    );
    process.exit(1);
  }

  console.error(
    "\n[deploy-bootstrap] FAILED: migrations did not apply cleanly.\n" +
      "[deploy-bootstrap] Read the Prisma output above. A migration that " +
      "failed part-way is recorded as failed and blocks later deploys until it " +
      "is resolved — see docs/MIGRATIONS.md.",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Seeds — idempotent, so they run on every deploy.
// ---------------------------------------------------------------------------
const seeds = [
  ["Seeding core data (What's On, staff, checklist, admin login)", "tsx scripts/seed.ts"],
  ["Seeding stock items from the menu", "tsx scripts/seed-stock.ts"],
];

for (const [label, cmd] of seeds) {
  console.log(`\n[deploy-bootstrap] ${label}…`);
  try {
    run(cmd, { stdio: "inherit" });
  } catch {
    console.error(`\n[deploy-bootstrap] FAILED: ${label}`);
    process.exit(1);
  }
}

console.log("\n[deploy-bootstrap] Database ready.");
