import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getStaffSlug } from "@/lib/settings";
import { startOfWeekMonday, endOfWeekSunday } from "@/lib/dates";
import { isPublicBookingConfigured } from "@/lib/cal-public";
import { businessDateFor } from "@/lib/business-date";
import { describeShift } from "@/lib/rota";
import { describeUnavailability } from "@/lib/availability";
import { addDays } from "@/lib/dates";
import { resolveAll, resolveReport } from "./stock/actions";
import { DecisionMessage, SwapDecisions, swapsAwaitingApproval } from "./requests/swap-list";
import { InstallCard } from "./install-card";

export const dynamic = "force-dynamic";

// Tonight first: what needs the boss, then who's on, then the rest. Built to be
// read on his phone between other things, so everything he acts on can be done
// from this page without going anywhere else.
export default async function Dashboard({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const now = new Date();
  const tonight = businessDateFor(now);
  const weekStart = startOfWeekMonday(now);
  const weekEnd = endOfWeekSunday(now);

  const [
    whatsOnCount,
    activeStaff,
    staffWithPin,
    shiftsThisWeek,
    slug,
    checklistItems,
    openStock,
    lastNight,
    swaps,
    newUnavailable,
    onTonight,
  ] = await Promise.all([
      prisma.whatsOnEntry.count({ where: { active: true } }),
      prisma.staffMember.count({ where: { active: true } }),
      prisma.staffMember.count({ where: { active: true, pinHash: { not: null } } }),
      prisma.shift.count({ where: { date: { gte: weekStart, lte: weekEnd } } }),
      getStaffSlug(),
      prisma.checklistItem.count({ where: { active: true } }),
      prisma.stockReport.findMany({
        where: { resolvedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          item: { select: { name: true } },
          reportedBy: { select: { name: true } },
        },
      }),
      // The most recent night anyone actually closed.
      prisma.checklistRun.findFirst({
        orderBy: { businessDate: "desc" },
        include: {
          submittedBy: { select: { name: true } },
          checks: {
            include: { item: { select: { label: true } }, checkedBy: { select: { name: true } } },
          },
        },
      }),
      swapsAwaitingApproval(),
      prisma.unavailability.findMany({
        where: {
          createdAt: { gte: addDays(now, -7) },
          OR: [{ kind: "WEEKLY" }, { kind: "DATES", endDate: { gte: tonight } }],
        },
        include: { staffMember: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.shift.findMany({
        where: { date: tonight, kind: "WORKING", staffMember: { active: true } },
        include: { staffMember: { select: { name: true } } },
        orderBy: [{ startMinutes: "asc" }],
      }),
    ]);
  const needsYou = openStock.length + swaps.length + newUnavailable.length;

  const escalated = (lastNight?.checks ?? []).filter((c) => c.note);

  const calConfigured = !!process.env.CAL_API_URL && !!process.env.CAL_API_KEY;
  // Same helper the button itself calls, so this line cannot claim the website
  // is booking while the shipped bundle is quietly emailing.
  const publicBookingConfigured = isPublicBookingConfigured();
  const plausibleConfigured = !!process.env.PLAUSIBLE_SHARED_LINK;

  const tiles = [
    { label: "What's On (live)", value: whatsOnCount, href: "/admin/whats-on" },
    { label: "Active staff", value: activeStaff, href: "/admin/rota" },
    { label: "Shifts this week", value: shiftsThisWeek, href: "/admin/rota" },
  ];

  return (
    <div>
      <h1 className="admin-h1">Good day.</h1>
      <DecisionMessage m={m} />
      <InstallCard />

      <div className="card needs-you">
        <h2>
          Needs you{" "}
          {needsYou > 0 && <span className="badge count">{needsYou}</span>}
        </h2>
        {needsYou === 0 && <p className="muted" style={{ margin: 0 }}>Nothing. Enjoy it.</p>}

        {openStock.length > 0 && (
          <section className="needs-block">
            <h3>Flagged low</h3>
            <ul className="decision-list">
              {openStock.map((r) => (
                <li key={r.id} className="decision">
                  <div className="decision-text">
                    <strong>
                      {r.item?.name ?? r.freeText} — {r.level === "OUT" ? "out" : "low"}
                    </strong>
                    <span className="muted">
                      {r.note ? `"${r.note}" · ` : ""}
                      {r.reportedBy.name},{" "}
                      {r.createdAt.toLocaleString("en-GB", {
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "UTC",
                      })}
                    </span>
                  </div>
                  <div className="decision-actions">
                    <form action={resolveReport}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="btn" type="submit">
                        Done
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
            {openStock.length > 1 && (
              <form action={resolveAll} className="needs-foot">
                <button className="btn ghost sm" type="submit">
                  Tick all {openStock.length} done
                </button>
              </form>
            )}
          </section>
        )}

        {swaps.length > 0 && (
          <section className="needs-block">
            <h3>Swaps to approve</h3>
            <SwapDecisions swaps={swaps} back="/admin" />
          </section>
        )}

        {newUnavailable.length > 0 && (
          <section className="needs-block">
            <h3>Can&apos;t work, added this week</h3>
            <ul className="plain-list">
              {newUnavailable.map((u) => (
                <li key={u.id}>
                  <strong>{u.staffMember.name}</strong> · {describeUnavailability(u)}
                  {u.note && <span className="muted"> · {u.note}</span>}
                </li>
              ))}
            </ul>
            <p className="needs-foot">
              <Link href="/admin/requests">All requests →</Link>
            </p>
          </section>
        )}
      </div>

      <div className="card">
        <h2>On tonight</h2>
        {onTonight.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>Nobody&apos;s on the rota tonight.</p>
        ) : (
          <ul className="plain-list">
            {onTonight.map((s) => (
              <li key={s.id}>
                <strong>{s.staffMember.name}</strong> · {describeShift(s)}
                {s.notes && <span className="muted"> · {s.notes}</span>}
              </li>
            ))}
          </ul>
        )}
        <p className="needs-foot">
          <Link href="/admin/rota">The rota →</Link>
        </p>
      </div>

      <div className="dash-tiles">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card" style={{ display: "block", marginBottom: 0 }}>
            <div style={{ fontSize: 40, fontFamily: "'Cormorant', serif" }}>{t.value}</div>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green)" }}>
              {t.label}
            </div>
          </Link>
        ))}
      </div>

      <div className="card">
        <h2>Last night&apos;s lockdown</h2>
        {!lastNight ? (
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {checklistItems === 0
              ? "No checklist yet — write one and the closing team can start ticking."
              : "Nothing closed yet."}
          </p>
        ) : (
          <>
            <p style={{ margin: "0 0 10px", fontSize: 13 }}>
              <strong>
                {lastNight.businessDate.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  timeZone: "UTC",
                })}
              </strong>{" "}
              — {lastNight.checks.length} of {checklistItems} ticked
              {lastNight.submittedAt ? (
                <>
                  , submitted at{" "}
                  <strong>
                    {lastNight.submittedAt.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "UTC",
                    })}
                  </strong>{" "}
                  by {lastNight.submittedBy?.name}.
                </>
              ) : (
                <> — not submitted.</>
              )}
            </p>
            {escalated.length > 0 && (
              <div className="alert error" style={{ marginBottom: 0 }}>
                <strong>
                  {escalated.length} note{escalated.length === 1 ? "" : "s"} for you:
                </strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
                  {escalated.map((c) => (
                    <li key={c.id}>
                      <strong>{c.item.label}</strong> — {c.note}{" "}
                      <span className="muted">({c.checkedBy.name})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p style={{ margin: "10px 0 0", fontSize: 12 }}>
              <Link href="/admin/checklist">Recent nights and the list itself →</Link>
            </p>
          </>
        )}
      </div>

      <div className="card">
        <h2>Setup status</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 2, fontSize: 13 }}>
          <li>Staff app URL: {slug ? <code>/staff/{slug}</code> : "not generated yet"}</li>
          <li>
            Staff PINs:{" "}
            {staffWithPin === 0 ? (
              <strong>none set — nobody can sign in yet</strong>
            ) : (
              `${staffWithPin} of ${activeStaff} active staff`
            )}
          </li>
          {/* The boss reads the status; whoever deploys reads the setting name.
              Both need it, so the name sits under the line rather than inside
              it, where it was competing with the sentence it explains. */}
          {/* The button a customer actually presses. It never dies — with no
              booking link in the build it opens an email instead — so the only
              way to notice it isn't booking is to press it. Hence this line. */}
          <li>
            Website booking button:{" "}
            {publicBookingConfigured ? (
              "opens cal.diy"
            ) : (
              <strong>emailing, not booking</strong>
            )}
            {!publicBookingConfigured && (
              <span className="muted admin-setup-hint">
                Needs NEXT_PUBLIC_CAL_URL_BASE and NEXT_PUBLIC_CAL_BOOKING_LINK set
                on the deployment — then a REBUILD, because these two are baked
                into the page at build time and a redeploy is what picks them up.
              </span>
            )}
          </li>
          <li>
            Table bookings: {calConfigured ? "connected" : "not connected yet"}
            {!calConfigured && (
              <span className="muted admin-setup-hint">
                Needs CAL_API_URL and CAL_API_KEY set on the deployment.
              </span>
            )}
          </li>
          <li>
            Visitor stats: {plausibleConfigured ? "connected" : "not connected yet"}
            {!plausibleConfigured && (
              <span className="muted admin-setup-hint">
                Needs PLAUSIBLE_SHARED_LINK set on the deployment.
              </span>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}
