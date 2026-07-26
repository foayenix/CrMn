import "./admin.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crescent Moon — Admin",
  robots: { index: false, follow: false },
  // Scoped to /admin, so only the boss's app is installable — the public site
  // and the staff app are untouched by any of this.
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "CM Admin", statusBarStyle: "black-translucent" },
  icons: { apple: "/icon-192.png", icon: "/icon-192.png" },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-root">{children}</div>;
}
