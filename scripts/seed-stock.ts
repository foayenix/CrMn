/**
 * Seed StockItem from the live menu.
 *
 *   npm run seed-stock
 *
 * The menu (src/lib/menu.ts) is the only authoritative list of what the room
 * sells, and the names on the pad have to be the names on the list. So stock is
 * read from it rather than retyped: a hand-copied list goes stale the first
 * time the boss changes a wine.
 *
 * Only groups the menu marks `stocked` become stock lines: the wines and the
 * food. Cocktails and spritz are made to order (there's no "we're out of
 * Everything Spritz", only out of what goes in it), and spirits, beer and soft
 * drinks were never on the pad; add `stocked: true` to a group to put them there.
 *
 * Off-menu things — tonic, till roll, blue roll, straws — are deliberately not
 * here. They go through the free-text row on the report screen, which is what
 * that row is for.
 *
 * Idempotent: existing items are matched by name and left alone, new ones are
 * added, and anything no longer on the menu is deactivated rather than deleted
 * so old reports keep pointing at something real.
 */
import { PrismaClient } from "@prisma/client";
import { MENU } from "../src/lib/menu";

const prisma = new PrismaClient();

export function stockFromMenu(): { name: string; category: string }[] {
  const out: { name: string; category: string }[] = [];
  const seen = new Set<string>();
  for (const section of MENU) {
    for (const group of section.groups) {
      if (!group.stocked) continue;
      const category = group.title ?? section.title;
      for (const { name } of group.items) {
        if (seen.has(`${category}|${name}`)) continue;
        seen.add(`${category}|${name}`);
        out.push({ name, category });
      }
    }
  }
  return out;
}

async function main() {
  const parsed = stockFromMenu();
  if (parsed.length === 0) {
    console.error("No stocked items in src/lib/menu.ts — is `stocked: true` missing from every group?");
    process.exit(1);
  }

  const existing = await prisma.stockItem.findMany();
  const byName = new Map(existing.map((i) => [i.name, i]));
  let added = 0;
  let revived = 0;
  let moved = 0;

  for (let i = 0; i < parsed.length; i++) {
    const { name, category } = parsed[i];
    const found = byName.get(name);
    if (!found) {
      await prisma.stockItem.create({ data: { name, category, sortOrder: i } });
      added++;
    } else if (!found.active) {
      await prisma.stockItem.update({ where: { id: found.id }, data: { active: true, category } });
      revived++;
    } else if (found.category !== category) {
      // The menu moved it (a section renamed): follow, or the staff app shows
      // the same kind of thing under two headings.
      await prisma.stockItem.update({ where: { id: found.id }, data: { category } });
      moved++;
    }
  }

  // Gone from the menu: hide it, never delete it — reports point at these.
  const liveNames = new Set(parsed.map((p) => p.name));
  const stale = existing.filter((i) => i.active && !liveNames.has(i.name));
  for (const item of stale) {
    await prisma.stockItem.update({ where: { id: item.id }, data: { active: false } });
  }

  const byCategory = new Map<string, number>();
  for (const p of parsed) byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1);

  console.log(`${parsed.length} stock items on the menu:`);
  for (const [cat, n] of byCategory) console.log(`  ${cat} — ${n}`);
  console.log(`Added ${added}, reactivated ${revived}, recategorised ${moved}, deactivated ${stale.length}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
