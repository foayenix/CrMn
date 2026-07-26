import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { openReportCount } from "@/lib/stock";
import { logoutAction } from "../auth-actions";

export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const openStock = await openReportCount();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <h1 className="admin-brand">
            Crescent Moon
            <small>Admin</small>
          </h1>
        </div>
        <AdminNav badges={{ "/admin/stock": openStock }} />
        <div className="admin-sidebar-footer">
          <div
            style={{
              fontSize: 10.5,
              color: "rgba(247,244,236,.5)",
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
              style={{ color: "rgba(247,244,236,.85)", borderColor: "rgba(247,244,236,.3)" }}
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
