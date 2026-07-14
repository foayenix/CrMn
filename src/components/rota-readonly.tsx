import { describeShift, slotHours } from "@/lib/rota";
import { formatHours } from "@/lib/dates";

type Shift = {
  staffMemberId: string;
  dateKey: string;
  slot: number;
  kind: "WORKING" | "CLOSED" | "UNAVAILABLE" | "HOLIDAY";
  startMinutes: number | null;
  endMinutes: number | null;
  holidayEnd: Date | null;
  notes: string | null;
};

// Read-only rota grid, shared by the staff view (and usable anywhere a
// non-editable week grid is wanted).
export function RotaReadOnly({
  days,
  staff,
  shifts,
}: {
  days: { key: string; dow: string; date: string; note: string }[];
  staff: { id: string; name: string }[];
  shifts: Shift[];
}) {
  const byCell = new Map<string, Shift[]>();
  const totals = new Map<string, number>();
  for (const s of shifts) {
    const k = `${s.staffMemberId}|${s.dateKey}`;
    (byCell.get(k) ?? byCell.set(k, []).get(k)!).push(s);
    totals.set(s.staffMemberId, (totals.get(s.staffMemberId) ?? 0) + slotHours(s));
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="grid" style={{ minWidth: 820 }}>
        <thead>
          <tr>
            <th style={{ position: "sticky", left: 0, background: "var(--sand)" }}>Staff</th>
            {days.map((d) => (
              <th key={d.key}>
                <div>{d.dow}</div>
                <div style={{ fontWeight: 400, color: "rgba(28,21,18,.55)" }}>{d.date}</div>
                {d.note && <div style={{ fontSize: 10, color: "var(--gold)" }}>{d.note}</div>}
              </th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id}>
              <td style={{ position: "sticky", left: 0, background: "#fff", fontWeight: 500 }}>{s.name}</td>
              {days.map((d) => {
                const cell = byCell.get(`${s.id}|${d.key}`) ?? [];
                return (
                  <td key={d.key}>
                    {cell.length === 0 ? (
                      <span className="muted">·</span>
                    ) : (
                      cell.map((cs, i) => (
                        <div key={i} style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                          {describeShift(cs)}
                          {cs.notes && (
                            <span className="muted" style={{ display: "block", fontSize: 10 }}>
                              {cs.notes}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </td>
                );
              })}
              <td style={{ textAlign: "center", fontWeight: 500 }}>{formatHours(totals.get(s.id) ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
