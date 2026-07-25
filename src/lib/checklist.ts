import { prisma } from "@/lib/prisma";
import { businessDateFor } from "@/lib/business-date";

// The lockdown checklist, read the way the closing person reads it: grouped by
// section, each tick carrying the name and time that made it.

// The design's "18 items · about 12 min" works out at forty seconds an item.
// It's a rough honest number, not a target — nothing counts down against it.
const SECONDS_PER_ITEM = 40;

export function estimatedMinutes(itemCount: number): number {
  return Math.max(1, Math.round((itemCount * SECONDS_PER_ITEM) / 60));
}

export type CheckedBy = { id: string; name: string; at: Date; note: string | null };

export type ChecklistEntry = {
  id: string;
  label: string;
  checked: CheckedBy | null;
};

export type ChecklistSection = {
  name: string;
  entries: ChecklistEntry[];
  done: number;
  total: number;
};

export type ChecklistState = {
  businessDate: Date;
  sections: ChecklistSection[];
  done: number;
  total: number;
  remaining: number;
  submittedAt: Date | null;
  submittedBy: string | null;
  reopenedAt: Date | null;
  // Notes left on items — these are what escalate to the manager on submit.
  notes: { label: string; note: string; by: string }[];
  // Distinct people who ticked something tonight.
  closers: string[];
};

// Read tonight's run without creating anything. A night nobody closed leaves no
// row behind, which keeps the admin history honest.
export async function readChecklist(instant: Date): Promise<ChecklistState> {
  const businessDate = businessDateFor(instant);

  const [items, run] = await Promise.all([
    prisma.checklistItem.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.checklistRun.findUnique({
      where: { businessDate },
      include: {
        submittedBy: { select: { name: true } },
        checks: { include: { checkedBy: { select: { id: true, name: true } } } },
      },
    }),
  ]);

  const byItem = new Map(
    (run?.checks ?? []).map((c) => [
      c.itemId,
      { id: c.checkedBy.id, name: c.checkedBy.name, at: c.checkedAt, note: c.note },
    ]),
  );

  // Sections appear in the order of their first item, so the boss orders the
  // groups by ordering the items — no second thing to keep in sync.
  const sections: ChecklistSection[] = [];
  for (const item of items) {
    let section = sections.find((s) => s.name === item.section);
    if (!section) {
      section = { name: item.section, entries: [], done: 0, total: 0 };
      sections.push(section);
    }
    const checked = byItem.get(item.id) ?? null;
    section.entries.push({ id: item.id, label: item.label, checked });
    section.total += 1;
    if (checked) section.done += 1;
  }

  const total = items.length;
  const done = sections.reduce((sum, s) => sum + s.done, 0);
  const liveItemIds = new Set(items.map((i) => i.id));

  const notes = (run?.checks ?? [])
    .filter((c) => c.note && liveItemIds.has(c.itemId))
    .map((c) => ({
      label: items.find((i) => i.id === c.itemId)?.label ?? "",
      note: c.note!,
      by: c.checkedBy.name,
    }));

  const closers = [...new Set((run?.checks ?? []).map((c) => c.checkedBy.name))];

  return {
    businessDate,
    sections,
    done,
    total,
    remaining: total - done,
    submittedAt: run?.submittedAt ?? null,
    submittedBy: run?.submittedBy?.name ?? null,
    reopenedAt: run?.reopenedAt ?? null,
    notes,
    closers,
  };
}

// Called only when someone actually ticks something.
export async function ensureRun(businessDate: Date) {
  return prisma.checklistRun.upsert({
    where: { businessDate },
    update: {},
    create: { businessDate },
  });
}

// The most recent submitted night before this one — Home's quiet "last night
// was locked at 00:12" line.
export async function lastSubmittedRun(before: Date) {
  return prisma.checklistRun.findFirst({
    where: { businessDate: { lt: businessDateFor(before) }, submittedAt: { not: null } },
    orderBy: { businessDate: "desc" },
    include: { submittedBy: { select: { name: true } } },
  });
}
