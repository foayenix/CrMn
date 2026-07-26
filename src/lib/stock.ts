import { prisma } from "@/lib/prisma";

// Low stock, read the way the person holding the pad reads it: what's already
// flagged first, so nobody re-flags the Picpoul, then everything else.

export type FlaggedReport = {
  id: string;
  name: string;
  level: "LOW" | "OUT";
  by: string;
  at: Date;
  note: string | null;
  offMenu: boolean;
};

export type PickableItem = {
  id: string;
  name: string;
  category: string;
  flagged: boolean;
};

export type StockState = {
  flagged: FlaggedReport[];
  items: PickableItem[];
};

export async function readStock(): Promise<StockState> {
  const [open, items] = await Promise.all([
    prisma.stockReport.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        item: { select: { name: true } },
        reportedBy: { select: { name: true } },
      },
    }),
    prisma.stockItem.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const flaggedItemIds = new Set(open.map((r) => r.itemId).filter(Boolean) as string[]);

  return {
    flagged: open.map((r) => ({
      id: r.id,
      name: r.item?.name ?? r.freeText ?? "Something",
      level: r.level,
      by: r.reportedBy.name,
      at: r.createdAt,
      note: r.note,
      offMenu: r.itemId === null,
    })),
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      flagged: flaggedItemIds.has(i.id),
    })),
  };
}

// Just the count, for Home's tile and nudge and the admin badge.
export async function openReportCount(): Promise<number> {
  return prisma.stockReport.count({ where: { resolvedAt: null } });
}

// The oldest open report, for Home's "since 21:02" line.
export async function oldestOpenReport() {
  return prisma.stockReport.findFirst({
    where: { resolvedAt: null },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
}
