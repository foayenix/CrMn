import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// The boss's admin session (cookie: cm_admin) — a signed JWT, so a leaked or
// edited cookie can't forge access.
//
// The staff app has its own, per-person session; it lives in
// `src/lib/staff-session.ts` because middleware needs it and its rules differ
// (the PIN is the identity, and a shared iPad locks itself after two minutes).

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "insecure-dev-secret-change-me",
);

const ADMIN_COOKIE = "cm_admin";

const ADMIN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

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

// Exposed so middleware (edge runtime) can validate the admin cookie too.
export async function verifyToken(token: string) {
  return verify(token);
}

export const cookieNames = { admin: ADMIN_COOKIE };
