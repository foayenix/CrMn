import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { addDays } from "@/lib/dates";
import { describeUnavailability } from "@/lib/availability";
import { firstSwappableDate, shiftLine } from "@/lib/swaps";
import { DecisionMessage, SwapDecisions, swapsAwaitingApproval } from "./swap-list";

export const dynamic = "force-dynamic";

// What the team has asked for: swaps waiting on the boss, shifts on offer, and
// the days people have said they can't work.
export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const today = firstSwappableDate();

  const [awaiting, offered, unavailable, decided] = await Promise.all([
    swapsAwaitingApproval(),
    prisma.shiftSwap.findMany({
      where: { status: "OFFERED", shift: { date: { gte: today } } },
      include: { shift: true, from: { select: { name: true } } },
      orderBy: { shift: { date: "asc" } },
    }),
    prisma.unavailability.findMany({
      where: {
        staffMember: { active: true },
        OR: [{ kind: "WEEKLY" }, { kind: "DATES", endDate: { gte: today } }],
      },
      include: { staffMember: { select: { name: true, sortOrder: true } } },
      orderBy: [{ kind: "desc" }, { startDate: "asc" }, { weekday: "asc" }],
    }),
    prisma.shiftSwap.findMany({
      where: { status: { in: ["APPROVED", "DECLINED"] }, decidedAt: { gte: addDays(new Date(), -14) } },
      include: { shift: true, returnShift: true, from: { select: { name: true } }, to: { select: { name: true } } },
      orderBy: { decidedAt: "desc" },
    }),
  ]);

  // Grouped by person, in rota order.
  const byPerson = new Map<string, { name: string; order: number; rows: typeof unavailable }>();
  for (const u of unavailable) {
    const g = byPerson.get(u.staffMemberId) ?? { name: u.staffMember.name, order: u.staffMember.sortOrder, rows: [] };
    g.rows.push(u);
    byPerson.set(u.staffMemberId, g);
  }
  const people = [...byPerson.values()].sort((a, b) => a.order - b.order);
  const recent = (d: Date) => d > addDays(new Date(), -7);

  return (
    <div>
      <h1 className="admin-h1">Requests</h1>
      <p className="admin-sub">
        Swaps the team has agreed wait here for you. Nothing on the rota moves until you approve. Days
        people can&apos;t work also show on the <Link href="/admin/rota">rota</Link> beside their row.
      </p>

      <DecisionMessage m={m} />

      <div className="card">
        <h2>Swaps to approve</h2>
        {awaiting.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>Nothing waiting.</p>
        ) : (
          <SwapDecisions swaps={awaiting} back="/admin/requests" />
        )}
      </div>

      <div className="card">
        <h2>Can&apos;t work</h2>
        {people.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>Nobody has said they can&apos;t work any upcoming days.</p>
        ) : (
          <ul className="plain-list">
            {people.map((p) => (
              <li key={p.name}>
                <strong>{p.name}</strong>
                <ul>
                  {p.rows.map((u) => (
                    <li key={u.id}>
                      {describeUnavailability(u)}
                      {u.note && <span className="muted"> · {u.note}</span>}
                      {recent(u.createdAt) && <span className="badge new">new</span>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      {offered.length > 0 && (
        <div className="card">
          <h2>On offer, not taken yet</h2>
          <ul className="plain-list">
            {offered.map((o) => (
              <li key={o.id}>
                {o.from.name}&apos;s {shiftLine(o.shift)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {decided.length > 0 && (
        <div className="card">
          <h2>Decided in the last two weeks</h2>
          <ul className="plain-list">
            {decided.map((s) => (
              <li key={s.id}>
                <span className={s.status === "APPROVED" ? "badge ok" : "badge off"}>
                  {s.status === "APPROVED" ? "approved" : "declined"}
                </span>{" "}
                {s.to?.name ?? "—"} for {s.from.name}&apos;s {shiftLine(s.shift)}
                {s.returnShift && <> · swapped for {shiftLine(s.returnShift)}</>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
