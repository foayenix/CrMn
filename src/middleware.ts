import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Edge-safe gate for /admin/*. We only check that a validly-signed admin cookie
// exists here; anything needing the database re-checks in the server component.

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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
  matcher: ["/admin/:path*"],
};
