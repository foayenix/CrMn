import "./admin.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crescent Moon — Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-root">{children}</div>;
}
