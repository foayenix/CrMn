/**
 * Bring a deployed database up to date, from the build step.
 *
 * Runs as part of `npm run build`, because the platforms this app is deployed to
 * don't all give us a shell:
 *
 *   - Vercel is serverless. `npm start` never runs there, so anything hung off
 *     the start script (schema push, seeding) would silently never happen and
 *     the app would boot against an empty or missing database.
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
    "[deploy-bootstrap] No DATABASE_URL — skipping schema push and seeding.\n" +
      "[deploy-bootstrap] Set DATABASE_URL in the deployment's environment to " +
      "bootstrap the database at build time.",
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Schema
//
// Try the safe push first. `prisma db push` refuses, without --accept-data-loss,
// any change it *might* not be able to apply — including purely additive ones.
// Adding the unique index on StaffMember.pinLookup trips this: Prisma warns that
// existing duplicates would fail, even though the column is new and therefore
// NULL everywhere, and Postgres allows unlimited NULLs in a unique index.
//
// So: attempt it safely, show exactly what Prisma objected to, then retry with
// the flag. Set SAFE_DB_PUSH=1 to keep the guard and fail instead — worth doing
// once the database holds clock-in/out history and checklist signatures, where a
// genuinely destructive change should stop a deploy rather than be applied.
// The durable fix is `prisma migrate` with reviewed migration files.
// ---------------------------------------------------------------------------
console.log("\n[deploy-bootstrap] Pushing Prisma schema…");
try {
  process.stdout.write(run("prisma db push --skip-generate"));
} catch (err) {
  const output = `${err.stdout ?? ""}${err.stderr ?? ""}`;
  process.stdout.write(output);

  const dataLossOnly = output.includes("--accept-data-loss");
  if (!dataLossOnly) {
    console.error(
      "\n[deploy-bootstrap] FAILED: could not push the schema.\n" +
        "[deploy-bootstrap] This is not a data-loss warning — the database is " +
        "unreachable or rejected the connection. Check DATABASE_URL, and that " +
        "the database accepts connections from the build environment (Prisma " +
        "needs the direct, non-pooled URL, usually with ?sslmode=require).",
    );
    process.exit(1);
  }

  if (process.env.SAFE_DB_PUSH) {
    console.error(
      "\n[deploy-bootstrap] FAILED: the schema change above needs " +
        "--accept-data-loss and SAFE_DB_PUSH is set.\n" +
        "[deploy-bootstrap] Review the warning, then either unset SAFE_DB_PUSH " +
        "or apply the change deliberately with a migration.",
    );
    process.exit(1);
  }

  console.warn(
    "\n[deploy-bootstrap] ⚠  The change above was flagged as possibly lossy. " +
      "Retrying with --accept-data-loss.\n" +
      "[deploy-bootstrap] ⚠  Set SAFE_DB_PUSH=1 to fail here instead once this " +
      "database holds data worth protecting.",
  );
  try {
    process.stdout.write(run("prisma db push --skip-generate --accept-data-loss"));
  } catch (retryErr) {
    process.stdout.write(`${retryErr.stdout ?? ""}${retryErr.stderr ?? ""}`);
    console.error("\n[deploy-bootstrap] FAILED: schema push failed even with --accept-data-loss.");
    process.exit(1);
  }
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
