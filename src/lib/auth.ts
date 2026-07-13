import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Use in admin server components/actions that need the DB-backed user.
// Middleware already blocked unauthenticated requests; this is defence in depth
// and gives us the actual user record.
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const user = await prisma.adminUser.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/admin/login");
  return user;
}
