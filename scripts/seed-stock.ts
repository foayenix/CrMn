/**
 * Seed StockItem from the live menu.
 *
 *   npm run seed-stock
 *
 * The menu template is raw markup ported from the old static site, not
 * structured data — but it *is* the only authoritative list of what the room
 * sells, and the names on the pad have to be the names on the list. So we parse
 * it rather than retype it: a hand-copied list goes stale the first time the
 * boss changes a wine.
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
import { MENU_BODY } from "../src/lib/menu-template";

const prisma = new PrismaClient();

// The wine sections render each bottle as a 24px serif span inside a priced
// grid; the food sections render each dish as a 21px serif div.
const SECTION_TITLE = /<h2[^>]*font-size:clamp\(34px[^>]*>([^<]+)<\/h2>/;
const BOTTLE = /font-size:clamp\(20px,2vw,24px\);?">([^<]{2,80})</g;
const DISH = /font-size:21px;">([^<]{2,80})</g;

// Sections whose contents are made to order rather than stocked as a line —
// there's no "we're out of Everything Spritz", only out of what goes in it.
const SKIP_SECTIONS = ["Cocktails", "Everything Spritz", "Private hire"];

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function parseMenu(body: string): { name: string; category: string }[] {
  const out: { name: string; category: string }[] = [];
  const seen = new Set<string>();

  for (const section of body.split("<section").slice(1)) {
    const title = decode(SECTION_TITLE.exec(section)?.[1] ?? "");
    if (!title || SKIP_SECTIONS.includes(title)) continue;

    const names = [
      ...[...section.matchAll(BOTTLE)].map((m) => m[1]),
      ...[...section.matchAll(DISH)].map((m) => m[1]),
    ].map(decode);

    for (const name of names) {
      if (!name || seen.has(`${title}|${name}`)) continue;
      seen.add(`${title}|${name}`);
      out.push({ name, category: title });
    }
  }
  return out;
}

async function main() {
  const parsed = parseMenu(MENU_BODY);
  if (parsed.length === 0) {
    console.error("Parsed no items from the menu — has the template's markup changed?");
    process.exit(1);
  }

  const existing = await prisma.stockItem.findMany();
  const byName = new Map(existing.map((i) => [i.name, i]));
  let added = 0;
  let revived = 0;

  for (let i = 0; i < parsed.length; i++) {
    const { name, category } = parsed[i];
    const found = byName.get(name);
    if (!found) {
      await prisma.stockItem.create({ data: { name, category, sortOrder: i } });
      added++;
    } else if (!found.active) {
      await prisma.stockItem.update({ where: { id: found.id }, data: { active: true, category } });
      revived++;
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

  console.log(`Parsed ${parsed.length} menu items:`);
  for (const [cat, n] of byCategory) console.log(`  ${cat} — ${n}`);
  console.log(`Added ${added}, reactivated ${revived}, deactivated ${stale.length}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
