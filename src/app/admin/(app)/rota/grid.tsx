"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import {
  saveShift,
  deleteShift,
  addStaff,
  renameStaff,
  setStaffActive,
  saveDayNote,
  type SaveShiftState,
} from "./actions";
import { describeShift, slotHours } from "@/lib/rota";
import { minutesToTimeString, formatHours } from "@/lib/dates";

type Day = { key: string; dow: string; date: string; note: string };
type Staff = { id: string; name: string; active: boolean };
type Shift = {
  id: string;
  staffMemberId: string;
  dateKey: string;
  slot: number;
  kind: "WORKING" | "CLOSED" | "UNAVAILABLE" | "HOLIDAY";
  startMinutes: number | null;
  endMinutes: number | null;
  holidayEnd: string | null;
  notes: string | null;
};

const KIND_LABELS: Record<Shift["kind"], string> = {
  WORKING: "Working",
  CLOSED: "Closed",
  UNAVAILABLE: "Unavailable",
  HOLIDAY: "Holiday",
};

export function RotaGrid({
  weekAnchor,
  prevWeek,
  nextWeek,
  thisWeek,
  days,
  staff,
  shifts,
}: {
  weekAnchor: string;
  prevWeek: string;
  nextWeek: string;
  thisWeek: string;
  days: Day[];
  staff: Staff[];
  shifts: Shift[];
}) {
  const [cell, setCell] = useState<{ staff: Staff; day: Day } | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Index shifts by staff+day for fast cell lookup, and totals per staff.
  const byCell = useMemo(() => {
    const m = new Map<string, Shift[]>();
    for (const s of shifts) {
      const k = `${s.staffMemberId}|${s.dateKey}`;
      const arr = m.get(k) ?? [];
      arr.push(s);
      m.set(k, arr);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.slot - b.slot);
    return m;
  }, [shifts]);

  const totals = useMemo(() => {
    const t = new Map<string, number>();
    for (const s of shifts) {
      t.set(s.staffMemberId, (t.get(s.staffMemberId) ?? 0) + slotHours(s));
    }
    return t;
  }, [shifts]);

  const visibleStaff = staff.filter((s) => s.active || showInactive);

  return (
    <div>
      {/* Week navigation */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <Link className="btn ghost sm" href={`/admin/rota?week=${prevWeek}`}>
          ← Prev
        </Link>
        <Link className="btn ghost sm" href={`/admin/rota?week=${nextWeek}`}>
          Next →
        </Link>
        <Link className="btn ghost sm" href={`/admin/rota?week=${thisWeek}`}>
          This week
        </Link>
        <span className="muted" style={{ fontSize: 12 }}>
          Week of {days[0]?.date} — {days[6]?.date}
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="grid" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 120, position: "sticky", left: 0, background: "var(--sand)" }}>Staff</th>
              {days.map((d) => (
                <th key={d.key} style={{ minWidth: 104 }}>
                  <div>{d.dow}</div>
                  <div style={{ fontWeight: 400, color: "rgba(28,21,18,.55)" }}>{d.date}</div>
                  <DayNoteEditor day={d} weekAnchor={weekAnchor} />
                </th>
              ))}
              <th style={{ minWidth: 80 }}>Total hours</th>
            </tr>
          </thead>
          <tbody>
            {visibleStaff.map((s) => (
              <tr key={s.id} style={{ opacity: s.active ? 1 : 0.5 }}>
                <td style={{ position: "sticky", left: 0, background: "#fff" }}>
                  <StaffCell staff={s} />
                </td>
                {days.map((d) => {
                  const cellShifts = byCell.get(`${s.id}|${d.key}`) ?? [];
                  return (
                    <td
                      key={d.key}
                      onClick={() => setCell({ staff: s, day: d })}
                      style={{ cursor: "pointer" }}
                      title="Click to edit"
                    >
                      {cellShifts.length === 0 ? (
                        <span className="muted" style={{ fontSize: 11 }}>
                          +
                        </span>
                      ) : (
                        cellShifts.map((cs) => (
                          <div key={cs.id} style={{ fontSize: 11.5, lineHeight: 1.5 }}>
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
                <td style={{ fontWeight: 500, textAlign: "center" }}>
                  {formatHours(totals.get(s.id) ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Staff management */}
      <div style={{ display: "flex", gap: 16, marginTop: 20, flexWrap: "wrap", alignItems: "center" }}>
        <form action={addStaff} style={{ display: "flex", gap: 8 }}>
          <input type="text" name="name" placeholder="Add staff member" required style={{ width: 200 }} />
          <button className="btn sm" type="submit">
            + Add
          </button>
        </form>
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            style={{ width: "auto" }}
          />
          Show deactivated staff
        </label>
      </div>

      {cell && (
        <CellEditor
          staff={cell.staff}
          day={cell.day}
          shifts={byCell.get(`${cell.staff.id}|${cell.day.key}`) ?? []}
          onClose={() => setCell(null)}
        />
      )}
    </div>
  );
}

function StaffCell({ staff }: { staff: Staff }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <form
        action={renameStaff}
        style={{ display: "flex", gap: 4, flexDirection: "column" }}
        onSubmit={() => setEditing(false)}
      >
        <input type="hidden" name="id" value={staff.id} />
        <input type="text" name="name" defaultValue={staff.name} style={{ fontSize: 12, padding: 4 }} />
        <div style={{ display: "flex", gap: 4 }}>
          <button className="btn sm" type="submit">
            Save
          </button>
          <button className="btn ghost sm" type="button" onClick={() => setEditing(false)}>
            ✕
          </button>
        </div>
      </form>
    );
  }
  return (
    <div>
      <div style={{ fontWeight: 500 }}>
        {staff.name}
        {!staff.active && <span className="badge off" style={{ marginLeft: 6 }}>off</span>}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        <button className="btn ghost sm" style={{ padding: "2px 6px", fontSize: 10 }} onClick={() => setEditing(true)}>
          rename
        </button>
        <form action={setStaffActive}>
          <input type="hidden" name="id" value={staff.id} />
          <input type="hidden" name="active" value={staff.active ? "false" : "true"} />
          <button className="btn ghost sm" style={{ padding: "2px 6px", fontSize: 10 }} type="submit">
            {staff.active ? "deactivate" : "reactivate"}
          </button>
        </form>
      </div>
    </div>
  );
}

function DayNoteEditor({ day, weekAnchor }: { day: Day; weekAnchor: string }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <form action={saveDayNote} onSubmit={() => setEditing(false)} style={{ marginTop: 4 }}>
        <input type="hidden" name="date" value={day.key} />
        <input type="text" name="note" defaultValue={day.note} placeholder="event note" style={{ fontSize: 10, padding: 3 }} />
      </form>
    );
  }
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      style={{ fontSize: 10, color: "var(--gold)", fontWeight: 400, cursor: "text", minHeight: 12 }}
      title="Click to add a day note"
    >
      {day.note || <span style={{ opacity: 0.4 }}>+ note</span>}
    </div>
  );
}

// ---- cell editor modal -----------------------------------------------------

function CellEditor({
  staff,
  day,
  shifts,
  onClose,
}: {
  staff: Staff;
  day: Day;
  shifts: Shift[];
  onClose: () => void;
}) {
  const nextSlot = (shifts.reduce((m, s) => Math.max(m, s.slot), 0) || 0) + 1;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28,21,18,.5)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ maxWidth: 460, width: "100%", maxHeight: "90vh", overflowY: "auto", marginBottom: 0 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0 }}>
            {staff.name} — {day.dow} {day.date}
          </h2>
          <button className="btn ghost sm" onClick={onClose}>
            ✕
          </button>
        </div>

        {shifts.map((s) => (
          <SlotForm key={s.id} staffId={staff.id} dateKey={day.key} shift={s} onDone={onClose} />
        ))}

        <div style={{ borderTop: "1px dashed var(--line-strong)", marginTop: 14, paddingTop: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--green)", marginBottom: 8 }}>
            {shifts.length ? "Add another (split shift)" : "Add shift"}
          </div>
          <SlotForm staffId={staff.id} dateKey={day.key} slot={nextSlot} onDone={onClose} />
        </div>
      </div>
    </div>
  );
}

function SlotForm({
  staffId,
  dateKey,
  shift,
  slot,
  onDone,
}: {
  staffId: string;
  dateKey: string;
  shift?: Shift;
  slot?: number;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<SaveShiftState, FormData>(saveShift, {});
  const [kind, setKind] = useState<Shift["kind"]>(shift?.kind ?? "WORKING");

  return (
    <form
      action={async (fd) => {
        const res = await action(fd);
        if (res?.ok) onDone();
      }}
      style={{ borderTop: shift ? "1px solid var(--line)" : "none", paddingTop: shift ? 12 : 0, marginTop: shift ? 12 : 0 }}
    >
      {shift && <input type="hidden" name="id" value={shift.id} />}
      <input type="hidden" name="staffMemberId" value={staffId} />
      <input type="hidden" name="date" value={dateKey} />
      <input type="hidden" name="slot" value={shift?.slot ?? slot ?? 1} />

      {state.error && <div className="alert error">{state.error}</div>}

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as Shift["kind"])} style={{ flex: 1 }}>
          {Object.entries(KIND_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        {shift && (
          <button className="btn ghost sm" formAction={deleteShift} type="submit" title="Delete this slot">
            🗑
          </button>
        )}
      </div>

      {kind === "WORKING" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <label className="field" style={{ margin: 0, flex: 1 }}>
            <span>Start</span>
            <input
              type="time"
              name="start"
              defaultValue={shift?.startMinutes != null ? minutesToTimeString(shift.startMinutes) : "19:00"}
            />
          </label>
          <label className="field" style={{ margin: 0, flex: 1 }}>
            <span>End</span>
            <input
              type="time"
              name="end"
              defaultValue={shift?.endMinutes != null ? minutesToTimeString(shift.endMinutes) : "23:00"}
            />
          </label>
        </div>
      )}

      {kind === "HOLIDAY" && (
        <label className="field" style={{ margin: "0 0 8px" }}>
          <span>Holiday end (optional, for a range)</span>
          <input type="date" name="holidayEnd" defaultValue={shift?.holidayEnd ?? ""} />
        </label>
      )}

      <label className="field" style={{ margin: "0 0 8px" }}>
        <span>Notes (e.g. CCC, TBC)</span>
        <input type="text" name="notes" defaultValue={shift?.notes ?? ""} />
      </label>

      <button className="btn sm" type="submit" disabled={pending}>
        {pending ? "Saving…" : shift ? "Save slot" : "Add slot"}
      </button>
    </form>
  );
}
