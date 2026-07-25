import { SignJWT, jwtVerify } from "jose";

// Staff app session — one cookie per *person*, plus a long-lived cookie
// recording what kind of *device* this is. Both are signed JWTs, so an edited
// cookie can't forge either.
//
// Session length differs by device on purpose:
//
//   phone — a personal device. Long-lived; the OS lock is the real gate.
//   ipad  — shared behind the bar. Two minutes of idle and it locks, because
//           nothing on the iPad may assume the person holding it is the person
//           who unlocked it. Every tick and report is signed with whoever's PIN
//           is currently in.
//
// The iPad's idle window is a sliding expiry: the token is minted with a
// two-minute life and middleware re-mints it on each request. Stop touching it
// and it dies on its own, restart or no restart.
//
// This module is imported by middleware, so it must stay edge-safe: jose only,
// no Prisma, no Node crypto, no `next/headers`. The cookie-store side lives in
// `staff-cookies.ts`.

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "insecure-dev-secret-change-me",
);

export const STAFF_COOKIE = "cm_staff";
export const STAFF_DEVICE_COOKIE = "cm_staff_device";

export type DeviceMode = "phone" | "ipad";

export const PHONE_MAX_AGE = 60 * 60 * 24 * 60; // 60 days — follows the OS lock
export const IPAD_IDLE_SECONDS = 120; // 2 minutes idle, then back to the pad
export const DEVICE_MAX_AGE = 60 * 60 * 24 * 365; // the device answer, kept a year

export function isDeviceMode(v: unknown): v is DeviceMode {
  return v === "phone" || v === "ipad";
}

export function sessionMaxAge(device: DeviceMode): number {
  return device === "ipad" ? IPAD_IDLE_SECONDS : PHONE_MAX_AGE;
}

async function sign(payload: Record<string, unknown>, maxAgeSeconds: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(SECRET);
}

async function verify(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

const secureCookies = process.env.NODE_ENV === "production";

export type StaffSession = { staffId: string; name: string; device: DeviceMode };

// ---- token helpers (edge-safe, no cookie store) -----------------------------

export async function signStaffToken(session: StaffSession) {
  return sign(
    { sub: session.staffId, name: session.name, dev: session.device, role: "staff" },
    sessionMaxAge(session.device),
  );
}

export async function readStaffToken(token: string | undefined): Promise<StaffSession | null> {
  if (!token) return null;
  const payload = await verify(token);
  if (!payload || payload.role !== "staff") return null;
  if (!isDeviceMode(payload.dev) || typeof payload.sub !== "string") return null;
  return {
    staffId: payload.sub,
    name: typeof payload.name === "string" ? payload.name : "",
    device: payload.dev,
  };
}

export async function readDeviceToken(token: string | undefined): Promise<DeviceMode | null> {
  if (!token) return null;
  const payload = await verify(token);
  if (!payload || payload.role !== "staff-device") return null;
  return isDeviceMode(payload.dev) ? payload.dev : null;
}

export function staffCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

// The device answer is asked once, at first unlock, and remembered across
// locks. We never sniff the user agent — a phone in a stand behind the bar is
// a bar device, and only the person setting it up knows that.
export async function signDeviceToken(device: DeviceMode) {
  return sign({ dev: device, role: "staff-device" }, DEVICE_MAX_AGE);
}
