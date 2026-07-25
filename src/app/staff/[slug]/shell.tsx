import Link from "next/link";
import { lockAction } from "./actions";
import { IdleLock } from "./idle-lock";
import { IPAD_IDLE_SECONDS } from "@/lib/staff-session";

export type Section = "home" | "bookings" | "rota";

// The rail carries one item per built section. Lockdown, Stock and Clock join
// it as their phases land — a rail item that goes nowhere is worse than a rail
// with three items on it.
const RAIL: { key: Section; label: string; href: (slug: string) => string }[] = [
  { key: "home", label: "Home", href: (s) => `/staff/${s}` },
  { key: "bookings", label: "Books", href: (s) => `/staff/${s}/bookings` },
  { key: "rota", label: "Rota", href: (s) => `/staff/${s}/rota` },
];

// One shell for every screen past the lock.
//
// Phone — a 60px back arrow and a mono title; Lock lives at the foot of Home.
// iPad — a permanent 116px left rail, so Lock is always one reach away and no
// screen is more than one tap from another.
export function StaffShell({
  slug,
  section,
  isPad,
  title,
  stat,
  statBrass = true,
  children,
}: {
  slug: string;
  section: Section;
  isPad: boolean;
  // Phone header. Home passes none — it opens with the greeting instead.
  title?: string;
  stat?: string;
  statBrass?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={isPad ? "staff-shell pad" : "staff-shell"}>
      {isPad && <IdleLock seconds={IPAD_IDLE_SECONDS} />}
      {isPad && <Rail slug={slug} section={section} />}

      <div className="staff-page">
        {/* The rail already says where you are, so the iPad header carries the
            screen's one number instead of a back arrow. */}
        {isPad && title && (
          <div className="staff-pad-head">
            <span className="staff-serif" style={{ fontSize: 44, lineHeight: 1 }}>
              {title}
            </span>
            {stat && (
              <span
                className="staff-topbar-stat"
                style={statBrass ? { color: "var(--brass)" } : undefined}
              >
                {stat}
              </span>
            )}
          </div>
        )}
        {!isPad && title && (
          <div className="staff-topbar">
            <Link href={`/staff/${slug}`} className="staff-back" aria-label="Back to home">
              ←
            </Link>
            <span className="staff-topbar-title">{title}</span>
            {stat && (
              <span
                className="staff-topbar-stat"
                style={statBrass ? { color: "var(--brass)" } : undefined}
              >
                {stat}
              </span>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function Rail({ slug, section }: { slug: string; section: Section }) {
  return (
    <nav className="staff-rail">
      <svg width="30" height="30" viewBox="0 0 100 100" fill="none" aria-hidden="true">
        <path
          d="M 52 8 A 42 42 0 1 0 52 92 A 31 42 0 1 1 52 8 Z"
          fill="none"
          stroke="#A8875A"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="staff-rail-items">
        {RAIL.map((item) => {
          const active = item.key === section;
          return (
            <Link
              key={item.key}
              href={item.href(slug)}
              className={active ? "staff-rail-item active" : "staff-rail-item"}
            >
              <span className="staff-rail-mark" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <form action={lockAction}>
        <input type="hidden" name="slug" value={slug} />
        <button type="submit" className="staff-rail-lock">
          <span className="staff-lock-mark" />
          <span>Lock</span>
        </button>
      </form>
    </nav>
  );
}

// The phone's Lock, at the foot of Home. Always reachable, never shouting.
export function LockButton({ slug }: { slug: string }) {
  return (
    <form action={lockAction} style={{ marginTop: 22 }}>
      <input type="hidden" name="slug" value={slug} />
      <button type="submit" className="staff-button">
        <span className="staff-lock-mark" />
        Lock
      </button>
    </form>
  );
}
