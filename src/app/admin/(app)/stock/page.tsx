import { prisma } from "@/lib/prisma";
import { resolveReport, resolveAll, reopenReport } from "./actions";

export const dynamic = "force-dynamic";

const when = (d: Date) =>
  d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

export default async function StockPage() {
  const [open, resolved, itemCount] = await Promise.all([
    prisma.stockReport.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        item: { select: { name: true, category: true } },
        reportedBy: { select: { name: true } },
      },
    }),
    prisma.stockReport.findMany({
      where: { resolvedAt: { not: null } },
      orderBy: { resolvedAt: "desc" },
      take: 20,
      include: {
        item: { select: { name: true } },
        reportedBy: { select: { name: true } },
      },
    }),
    prisma.stockItem.count({ where: { active: true } }),
  ]);

  return (
    <div>
      <h1 className="admin-h1">Low stock</h1>
      <p className="admin-sub">
        What the floor has flagged, oldest first. It&apos;s a list, not an order
        — resolving one just means you&apos;ve dealt with it. {itemCount} items
        from the menu are pickable in the staff app; anything off-menu comes
        through as free text.
      </p>

      <div className="card">
        <h2>
          Open{" "}
          {open.length > 0 && (
            <span className="badge" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
              {open.length}
            </span>
          )}
        </h2>

        {open.length === 0 ? (
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Nothing flagged. The staff app says the same.
          </p>
        ) : (
          <>
            <table className="grid">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ width: 70 }}>Level</th>
                  <th style={{ width: 190 }}>Flagged</th>
                  <th>Note</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {open.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.item?.name ?? r.freeText}</strong>
                      <div className="muted" style={{ fontSize: 10.5, marginTop: 3 }}>
                        {r.item?.category ?? "off menu"}
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={
                          r.level === "OUT"
                            ? { borderColor: "var(--danger)", color: "var(--danger)" }
                            : { borderColor: "var(--gold)", color: "var(--gold)" }
                        }
                      >
                        {r.level === "OUT" ? "out" : "low"}
                      </span>
                    </td>
                    <td style={{ fontSize: 11.5 }}>
                      {when(r.createdAt)}
                      <div className="muted" style={{ marginTop: 3 }}>
                        by {r.reportedBy.name}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, lineHeight: 1.5 }}>
                      {r.note ?? <span className="muted">—</span>}
                    </td>
                    <td>
                      <form action={resolveReport}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="btn sm" type="submit">
                          resolve
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {open.length > 1 && (
              <form
                action={resolveAll}
                style={{ marginTop: 14 }}
              >
                <button className="btn ghost sm" type="submit">
                  Resolve all {open.length}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h2>Recently resolved</h2>
        {resolved.length === 0 ? (
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Nothing resolved yet.
          </p>
        ) : (
          <table className="grid">
            <tbody>
              {resolved.map((r) => (
                <tr key={r.id} style={{ opacity: 0.7 }}>
                  <td>
                    {r.item?.name ?? r.freeText}{" "}
                    <span className="muted" style={{ fontSize: 11 }}>
                      {r.level === "OUT" ? "out" : "low"} · flagged by {r.reportedBy.name}{" "}
                      {when(r.createdAt)}
                    </span>
                  </td>
                  <td style={{ width: 90 }}>
                    <form action={reopenReport}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="btn ghost sm" type="submit">
                        reopen
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
