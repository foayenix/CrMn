import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Per-staff PIN auth for the staff app.
//
// The PIN is the identity — four digits and the app knows who you are, with no
// name picker in between. Two columns make that possible (see schema.prisma):
//
//   pinLookup — HMAC-SHA256 of the PIN with STAFF_PIN_SECRET, unique + indexed.
//               One query finds the person; the unique constraint means two
//               staff can't end up sharing a PIN.
//   pinHash   — bcrypt, verified after the lookup.
//
// The HMAC key never leaves the server, so the lookup column is useless to
// anyone who only has the database.

export const PIN_LENGTH = 4;
export const MAX_TRIES = 3;
export const LOCKOUT_SECONDS = 60;

// STAFF_PIN_SECRET keys the lookup column. Changing it invalidates every stored
// pinLookup (PINs would all need re-setting), so it falls back to the session
// secret rather than to a random value that would change on every boot.
function pinSecret(): string {
  return (
    process.env.STAFF_PIN_SECRET ??
    process.env.SESSION_SECRET ??
    "insecure-dev-secret-change-me"
  );
}

export function isValidPinFormat(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin);
}

export function pinLookupFor(pin: string): string {
  return createHmac("sha256", pinSecret()).update(pin).digest("hex");
}

// A bcrypt hash of a value nobody knows. Unknown-PIN takes the same code path
// as wrong-PIN — including the ~100ms bcrypt compare — so response timing tells
// an attacker nothing about whether a PIN exists.
let decoyHash: Promise<string> | null = null;
function decoy(): Promise<string> {
  decoyHash ??= bcrypt.hash(`decoy:${pinSecret()}`, 10);
  return decoyHash;
}

export type PinIdentity = { id: string; name: string; active: boolean };

// Resolve a PIN to a staff member, or null. Deactivated staff can't unlock, but
// their row (and their shift history) stays exactly where it is.
export async function findStaffByPin(pin: string): Promise<PinIdentity | null> {
  if (!isValidPinFormat(pin)) {
    await bcrypt.compare(pin, await decoy());
    return null;
  }

  const lookup = pinLookupFor(pin);
  const staff = await prisma.staffMember.findUnique({
    where: { pinLookup: lookup },
    select: { id: true, name: true, active: true, pinHash: true },
  });

  if (!staff?.pinHash) {
    await bcrypt.compare(pin, await decoy());
    return null;
  }

  const ok = await bcrypt.compare(pin, staff.pinHash);
  if (!ok || !staff.active) return null;

  return { id: staff.id, name: staff.name, active: staff.active };
}

export type SetPinResult =
  | { ok: true }
  | { ok: false; reason: "format" | "taken" };

// Set (or replace) one staff member's PIN. A collision has to surface as "that
// PIN's taken" rather than failing silently — the boss needs to pick another.
export async function setStaffPin(staffId: string, pin: string): Promise<SetPinResult> {
  if (!isValidPinFormat(pin)) return { ok: false, reason: "format" };

  const lookup = pinLookupFor(pin);
  const holder = await prisma.staffMember.findUnique({
    where: { pinLookup: lookup },
    select: { id: true },
  });
  if (holder && holder.id !== staffId) return { ok: false, reason: "taken" };

  await prisma.staffMember.update({
    where: { id: staffId },
    data: { pinLookup: lookup, pinHash: await bcrypt.hash(pin, 10), pinSetAt: new Date() },
  });
  return { ok: true };
}

// Clearing a PIN locks someone out of the app without touching their rota.
export async function clearStaffPin(staffId: string) {
  await prisma.staffMember.update({
    where: { id: staffId },
    data: { pinLookup: null, pinHash: null, pinSetAt: null },
  });
}

// Constant-time compare of two same-length hex digests, for callers that hold a
// lookup value rather than a raw PIN.
export function lookupsMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// ---- throttle --------------------------------------------------------------
// Four digits is only 10,000 combinations. Three tries then a 60-second park,
// on top of the unguessable slug, makes working through them impractical.

export type ThrottleState = {
  // Seconds still to wait, 0 when the pad is live.
  lockedForSeconds: number;
  triesLeft: number;
};

function stateFrom(row: { failures: number; lockedUntil: Date | null } | null): ThrottleState {
  if (!row) return { lockedForSeconds: 0, triesLeft: MAX_TRIES };
  const remaining = row.lockedUntil ? row.lockedUntil.getTime() - Date.now() : 0;
  if (remaining > 0) {
    return { lockedForSeconds: Math.ceil(remaining / 1000), triesLeft: 0 };
  }
  // The lock has expired: the counter is spent and the pad is live again.
  if (row.lockedUntil) return { lockedForSeconds: 0, triesLeft: MAX_TRIES };
  return { lockedForSeconds: 0, triesLeft: Math.max(0, MAX_TRIES - row.failures) };
}

export async function getThrottle(slug: string): Promise<ThrottleState> {
  const row = await prisma.staffPinThrottle.findUnique({ where: { slug } });
  return stateFrom(row);
}

// Record a miss and return the state the pad should now show.
export async function recordPinFailure(slug: string): Promise<ThrottleState> {
  const existing = await prisma.staffPinThrottle.findUnique({ where: { slug } });
  const expired = existing?.lockedUntil ? existing.lockedUntil.getTime() <= Date.now() : false;
  const failures = (expired ? 0 : existing?.failures ?? 0) + 1;
  const lockedUntil =
    failures >= MAX_TRIES ? new Date(Date.now() + LOCKOUT_SECONDS * 1000) : null;

  const row = await prisma.staffPinThrottle.upsert({
    where: { slug },
    update: { failures, lastFailAt: new Date(), lockedUntil },
    create: { slug, failures, lastFailAt: new Date(), lockedUntil },
  });
  return stateFrom(row);
}

export async function clearPinFailures(slug: string) {
  await prisma.staffPinThrottle.deleteMany({ where: { slug } });
}
