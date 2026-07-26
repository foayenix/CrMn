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

const steps = [
  ["Pushing Prisma schema", "prisma db push --skip-generate"],
  ["Seeding core data (What's On, staff, checklist, admin login)", "tsx scripts/seed.ts"],
  ["Seeding stock items from the menu", "tsx scripts/seed-stock.ts"],
];

if (!process.env.DATABASE_URL) {
  console.log(
    "[deploy-bootstrap] No DATABASE_URL — skipping schema push and seeding.\n" +
      "[deploy-bootstrap] Set DATABASE_URL in the deployment's environment to " +
      "bootstrap the database at build time.",
  );
  process.exit(0);
}

for (const [label, cmd] of steps) {
  console.log(`\n[deploy-bootstrap] ${label}…`);
  try {
    execSync(`npx --no-install ${cmd}`, { stdio: "inherit" });
  } catch {
    console.error(
      `\n[deploy-bootstrap] FAILED: ${label}\n` +
        "[deploy-bootstrap] The database is not reachable or not migratable. " +
        "Check DATABASE_URL and that the database accepts connections from the " +
        "build environment.",
    );
    process.exit(1);
  }
}

console.log("\n[deploy-bootstrap] Database ready.");
