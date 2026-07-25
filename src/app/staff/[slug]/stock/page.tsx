import Link from "next/link";
import { readStock } from "@/lib/stock";
import { requireStaff } from "../access";
import { StaffShell } from "../shell";

export const dynamic = "force-dynamic";

const time = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

// Screen 06 — Report low stock.
//
// What's already flagged sits at the top, before the list — so you see the
// Picpoul is handled before you tap it. Menu items already flagged are dimmed
// and unpickable. Anything off-menu goes through the one free-text row at the
// bottom.
export default async function StockScreen({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pick?: string }>;
}) {
  const { slug } = await params;
  const { pick } = await searchParams;
  const { device } = await requireStaff(slug);
  const isPad = device === "ipad";
  const { flagged, items } = await readStock();

  // Nothing flagged is the good state, so it gets the whole screen — unless
  // you came here to flag something, in which case get out of the way.
  if (flagged.length === 0 && !pick) {
    return (
      <StaffShell slug={slug} section="stock" isPad={isPad} title="Low stock">
        <div className="staff-empty">
          <span style={{ width: 14, height: 14, background: "var(--sage)" }} />
          <div className="staff-serif" style={{ fontSize: 36, lineHeight: 1.1 }}>
            Nothing flagged
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "rgba(232,224,207,.58)", maxWidth: "26ch" }}>
            The list is clear as of {time(new Date())}. If you pour the last of
            something, this is where it goes.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
          <Link href={`/staff/${slug}/stock?pick=1`} className="staff-button" style={{ height: 76, borderColor: "rgba(168,135,90,.55)", color: "var(--brass)" }}>
            Flag an item
          </Link>
          <Link href={`/staff/${slug}/stock/other`} className="staff-button" style={{ height: 76 }}>
            Something off-menu
          </Link>
        </div>
      </StaffShell>
    );
  }

  return (
    <StaffShell slug={slug} section="stock" isPad={isPad} title="Low stock">
      {flagged.length > 0 && (
        <>
          <div className="staff-mono" style={{ padding: "10px 0" }}>
            Flagged tonight&nbsp;
            <span style={{ color: "rgba(232,224,207,.35)" }}>{flagged.length}</span>
          </div>
          <div className="staff-flagged-box">
            {flagged.map((f) => (
              <div key={f.id} className="staff-flagged-row">
                <div style={{ flex: 1 }}>
                  <div className="staff-serif" style={{ fontSize: 22, lineHeight: 1.15 }}>
                    {f.name}
                  </div>
                  <div className="staff-flagged-sig">
                    {f.by}&nbsp;·&nbsp;{time(f.at)}
                    {f.offMenu && <>&nbsp;·&nbsp;off menu</>}
                  </div>
                  {f.note && <div className="staff-flagged-note">{f.note}</div>}
                </div>
                <span className={f.level === "OUT" ? "staff-level out" : "staff-level low"}>
                  {f.level === "OUT" ? "Out" : "Low"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <PickList slug={slug} items={items} />
    </StaffShell>
  );
}

function PickList({ slug, items }: { slug: string; items: Awaited<ReturnType<typeof readStock>>["items"] }) {
  // The menu runs to forty-odd lines, so the list carries the menu's own
  // headings rather than being one long scroll at midnight.
  const groups: { name: string; items: typeof items }[] = [];
  for (const item of items) {
    let g = groups.find((x) => x.name === item.category);
    if (!g) groups.push((g = { name: item.category, items: [] }));
    g.items.push(item);
  }

  return (
    <>
      <div className="staff-mono" style={{ padding: "22px 0 4px" }}>
        Report something
      </div>
      {groups.map((group) => (
        <div key={group.name}>
          <div className="staff-section-head">{group.name}</div>
          <div className="staff-pick-list">
            {group.items.map((item) =>
              item.flagged ? (
                // The point of putting the flagged list above this one is that
                // nobody re-flags the Picpoul.
                <div key={item.id} className="staff-pick-row flagged">
                  <span className="staff-serif" style={{ flex: 1, fontSize: 24 }}>
                    {item.name}
                  </span>
                  <span className="staff-pick-flag">Already flagged</span>
                </div>
              ) : (
                <Link
                  key={item.id}
                  href={`/staff/${slug}/stock/${item.id}`}
                  className="staff-pick-row"
                >
                  <span className="staff-serif" style={{ flex: 1, fontSize: 24 }}>
                    {item.name}
                  </span>
                  <span className="staff-chevron">›</span>
                </Link>
              ),
            )}
          </div>
        </div>
      ))}

      <Link href={`/staff/${slug}/stock/other`} className="staff-something-else">
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, color: "var(--brass)" }}>
          +
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18 }}>Something else</div>
          <div className="staff-mono" style={{ fontSize: 10.5, letterSpacing: ".12em", marginTop: 3 }}>
            Till roll, blue roll, straws…
          </div>
        </div>
      </Link>
    </>
  );
}
