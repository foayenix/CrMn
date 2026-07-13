import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Two independent gates live here:
//   1. The boss's admin session  (cookie: cm_admin)
//   2. The shared staff-view PIN  (cookie: cm_staff)
// Both are signed JWTs so a leaked/edited cookie can't forge access.

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "insecure-dev-secret-change-me",
);

const ADMIN_COOKIE = "cm_admin";
const STAFF_COOKIE = "cm_staff";

const ADMIN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const STAFF_MAX_AGE = 60 * 60 * 24 * 14; // 14 days (shared iPad convenience)

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

// ---- Admin (boss) session --------------------------------------------------

export async function createAdminSession(userId: string) {
  const token = await sign({ sub: userId, role: "admin" }, ADMIN_MAX_AGE);
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
}

export async function destroyAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function getAdminSession() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const payload = await verify(token);
  if (!payload || payload.role !== "admin") return null;
  return { userId: payload.sub as string };
}

// ---- Staff PIN session -----------------------------------------------------

export async function createStaffSession() {
  const token = await sign({ role: "staff" }, STAFF_MAX_AGE);
  (await cookies()).set(STAFF_COOKIE, token, {
    httpOnly: true,
    secure: secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: STAFF_MAX_AGE,
  });
}

export async function hasStaffSession() {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token) return false;
  const payload = await verify(token);
  return !!payload && payload.role === "staff";
}

// Exposed so middleware (edge runtime) can validate the admin cookie too.
export async function verifyToken(token: string) {
  return verify(token);
}

export const cookieNames = { admin: ADMIN_COOKIE, staff: STAFF_COOKIE };
