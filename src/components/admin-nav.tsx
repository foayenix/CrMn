"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/whats-on", label: "What's On" },
  { href: "/admin/rota", label: "Rota" },
  { href: "/admin/checklist", label: "Lockdown" },
  { href: "/admin/stock", label: "Low stock" },
  { href: "/admin/clock", label: "Clock" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/staff-view", label: "Staff app & PINs" },
];

// Counts to surface beside a link, keyed by href. Push notifications are the
// boss's, and optional — this badge has to be enough on its own.
export function AdminNav({ badges = {} }: { badges?: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav className="admin-nav">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        const count = badges[l.href] ?? 0;
        return (
          <Link key={l.href} href={l.href} className={active ? "active" : ""}>
            {l.label}
            {count > 0 && <span className="nav-badge">{count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
