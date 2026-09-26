import { requireAdmin } from "@/lib/auth";
import { AdminNav, AdminTabBar } from "@/components/admin-nav";
import { prisma } from "@/lib/prisma";
import { openReportCount } from "@/lib/stock";
import { logoutAction } from "../auth-actions";
import { LogoMark } from "@/components/logo";

export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const [openStock, swapsWaiting] = await Promise.all([
    openReportCount(),
    prisma.shiftSwap.count({ where: { status: "ACCEPTED" } }),
  ]);
  const badges = { "/admin/stock": openStock, "/admin/requests": swapsWaiting };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <h1 className="admin-brand">
            <LogoMark className="admin-brand-mark" />
            Crescent Moon
            <small>Admin</small>
          </h1>
        </div>
        <AdminNav badges={badges} />
        <div className="admin-sidebar-footer">
          <div
            style={{
              fontSize: 10.5,
              color: "rgba(252,240,224,.62)",
              marginBottom: 10,
              wordBreak: "break-all",
            }}
          >
            {user.email}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="btn ghost sm"
              style={{ color: "rgba(252,240,224,.85)", borderColor: "rgba(252,240,224,.3)" }}
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      {/* Phones get a top bar and a bottom tab bar instead of the sidebar. */}
      <header className="admin-topbar">
        <LogoMark className="admin-topbar-mark" />
        <span>Crescent Moon</span>
      </header>
      <main className="admin-main">{children}</main>
      <AdminTabBar badges={badges} email={user.email} signOut={logoutAction} />
    </div>
  );
}
