"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavLink = { href: string; label: string; exact?: boolean };

const LINKS: NavLink[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/whats-on", label: "What's On" },
  { href: "/admin/rota", label: "Rota" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/checklist", label: "Lockdown" },
  { href: "/admin/stock", label: "Low stock" },
  { href: "/admin/clock", label: "Clock" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/staff-view", label: "Staff app & PINs" },
  { href: "/admin/notifications", label: "Notifications" },
];

function isActive(pathname: string, l: NavLink) {
  return l.exact ? pathname === l.href : pathname.startsWith(l.href);
}

// Counts to surface beside a link, keyed by href. Push notifications are the
// boss's, and optional — these badges have to be enough on their own.
export function AdminNav({ badges = {} }: { badges?: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav className="admin-nav">
      {LINKS.map((l) => {
        const count = badges[l.href] ?? 0;
        return (
          <Link key={l.href} href={l.href} className={isActive(pathname, l) ? "active" : ""}>
            {l.label}
            {count > 0 && <span className="nav-badge">{count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

// ---- phone -----------------------------------------------------------------

// The four things the boss does most, a thumb away; everything else under More.
const TABS: (NavLink & { icon: React.ReactNode })[] = [
  { href: "/admin", label: "Home", exact: true, icon: <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" /> },
  {
    href: "/admin/whats-on",
    label: "What's On",
    icon: <path d="M12 3l2.4 5.6L20 9.3l-4.3 3.9 1.3 5.8L12 16l-5 3 1.3-5.8L4 9.3l5.6-.7z" />,
  },
  {
    href: "/admin/rota",
    label: "Rota",
    icon: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="1.5" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </>
    ),
  },
  {
    href: "/admin/stock",
    label: "Stock",
    icon: (
      <>
        <path d="M4 8l8-4 8 4-8 4z" />
        <path d="M4 8v8l8 4 8-4V8M12 12v8" />
      </>
    ),
  },
];

const MORE = LINKS.filter((l) => !TABS.some((t) => t.href === l.href) && l.href !== "/admin");

export function AdminTabBar({
  badges = {},
  email,
  signOut,
}: {
  badges?: Record<string, number>;
  email: string;
  signOut: (formData: FormData) => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Navigating closes the sheet.
  useEffect(() => setOpen(false), [pathname]);

  const moreCount = MORE.reduce((n, l) => n + (badges[l.href] ?? 0), 0);
  const moreActive = MORE.some((l) => isActive(pathname, l));

  return (
    <>
      <nav className="admin-tabbar" aria-label="Main">
        {TABS.map((t) => {
          const count = badges[t.href] ?? 0;
          const active = isActive(pathname, t);
          return (
            <Link key={t.href} href={t.href} className={active ? "tab active" : "tab"} aria-current={active ? "page" : undefined}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {t.icon}
              </svg>
              <span>{t.label}</span>
              {count > 0 && <b className="tab-badge">{count}</b>}
            </Link>
          );
        })}
        <button
          type="button"
          className={moreActive || open ? "tab active" : "tab"}
          aria-expanded={open}
          aria-controls="admin-more"
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="5" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="19" cy="12" r="1.6" />
          </svg>
          <span>More</span>
          {moreCount > 0 && <b className="tab-badge">{moreCount}</b>}
        </button>
      </nav>

      {open && (
        <div className="sheet-backdrop more" onClick={() => setOpen(false)}>
          <div id="admin-more" className="more-sheet" onClick={(e) => e.stopPropagation()}>
            <ul>
              {MORE.map((l) => {
                const count = badges[l.href] ?? 0;
                return (
                  <li key={l.href}>
                    <Link href={l.href} className={isActive(pathname, l) ? "active" : undefined}>
                      {l.label}
                      {count > 0 && <b className="tab-badge inline">{count}</b>}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <form action={signOut} className="more-foot">
              <span className="muted">{email}</span>
              <button type="submit" className="btn ghost sm">
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
