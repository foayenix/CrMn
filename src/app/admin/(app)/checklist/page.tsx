import { prisma } from "@/lib/prisma";
import { ChecklistManager } from "./manager";
import { RunHistory } from "./history";

export const dynamic = "force-dynamic";

export default async function ChecklistPage() {
  const [items, runs] = await Promise.all([
    prisma.checklistItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { checks: true } } },
    }),
    prisma.checklistRun.findMany({
      orderBy: { businessDate: "desc" },
      take: 14,
      include: {
        submittedBy: { select: { name: true } },
        checks: {
          include: { item: { select: { label: true } }, checkedBy: { select: { name: true } } },
        },
      },
    }),
  ]);

  const activeCount = items.filter((i) => i.active).length;

  return (
    <div>
      <h1 className="admin-h1">Lockdown checklist</h1>
      <p className="admin-sub">
        What the closing team ticks off, grouped however you like — Bar, Floor,
        Security. Every tick is signed with the PIN that made it, and notes come
        back to you here. Ordering the items also orders the groups: a group
        sits where its first item sits.
      </p>

      <RunHistory
        runs={runs.map((r) => ({
          key: r.businessDate.toISOString().slice(0, 10),
          label: r.businessDate.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
            timeZone: "UTC",
          }),
          submittedAt: r.submittedAt
            ? r.submittedAt.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              })
            : null,
          submittedBy: r.submittedBy?.name ?? null,
          reopened: r.reopenedAt !== null,
          ticked: r.checks.length,
          total: activeCount,
          notes: r.checks
            .filter((c) => c.note)
            .map((c) => ({ label: c.item.label, note: c.note!, by: c.checkedBy.name })),
        }))}
      />

      <ChecklistManager
        items={items.map((i) => ({
          id: i.id,
          label: i.label,
          section: i.section,
          active: i.active,
          checkCount: i._count.checks,
        }))}
      />
    </div>
  );
}
