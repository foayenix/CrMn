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

## Layout
- `src/app` — public site (`/`, `/menu`) + admin (`/admin/*`) + staff view (`/staff/*`)
- `src/lib` — prisma client, session/auth, settings, ported homepage/menu templates
- `scripts` — seed, set-password, set-pin
- `reference/legacy-site` — the original static site, kept for reference

The public homepage's "What's On" renders live from the database, so the boss's
edits appear with no redeploy.
