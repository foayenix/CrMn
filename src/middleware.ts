import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  STAFF_COOKIE,
  IPAD_IDLE_SECONDS,
  readStaffToken,
  signStaffToken,
  staffCookieOptions,
} from "@/lib/staff-session";

// Edge-safe gates.
//
//   /admin/*  — we only check that a validly-signed admin cookie exists here;
//               anything needing the database re-checks in the server component.
//   /staff/*  — nothing is blocked (the slug 404s in the page, the PIN gates the
//               person). This is where the shared iPad's idle window slides: a
//               live session is re-minted with a fresh two minutes on each
//               request, so the cookie dies on its own once someone walks away.

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "insecure-dev-secret-change-me",
);

async function isValidAdmin(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

async function slideStaffSession(req: NextRequest): Promise<NextResponse> {
  const res = NextResponse.next();
  const session = await readStaffToken(req.cookies.get(STAFF_COOKIE)?.value);
  // Phones keep their long-lived cookie as issued; only the iPad slides.
  if (!session || session.device !== "ipad") return res;
  res.cookies.set(
    STAFF_COOKIE,
    await signStaffToken(session),
    staffCookieOptions(IPAD_IDLE_SECONDS),
  );
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/staff")) return slideStaffSession(req);

  // The login page itself must stay reachable.
  if (pathname === "/admin/login") return NextResponse.next();

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("cm_admin")?.value;
    if (!(await isValidAdmin(token))) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*"],
};
