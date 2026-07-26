"use client";

import { useActionState, useEffect, useState } from "react";
import { updateEntry, deleteEntry, type EntryState } from "./actions";

export type EntryRow = {
  id: string;
  inValue: string; // YYYY-MM-DDTHH:MM for the input
  outValue: string;
  label: string; // human-readable "Fri 24 Jul · 18:02 → 01:07"
  hours: string | null;
  autoClosed: boolean;
  adminEdited: boolean;
  note: string | null;
  open: boolean;
};

export function EntryList({ entries }: { entries: EntryRow[] }) {
  const [editing, setEditing] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <span className="muted" style={{ fontSize: 11.5 }}>
        nothing clocked
      </span>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {entries.map((e) =>
        editing === e.id ? (
          <EditEntry key={e.id} entry={e} onDone={() => setEditing(null)} />
        ) : (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
            <span>{e.label}</span>
            {e.hours && <span className="muted">({e.hours}h)</span>}
            {e.open && (
              <span className="badge" style={{ borderColor: "var(--gold)", color: "var(--gold)" }}>
                still open
              </span>
            )}
            {/* Marked, never hidden: the boss can see which times nobody typed. */}
            {e.autoClosed && (
              <span className="badge" title={e.note ?? "Closed at the rostered end."}>
                auto-closed
              </span>
            )}
            {e.adminEdited && <span className="badge off">edited</span>}
            <button
              className="btn ghost sm"
              style={{ padding: "2px 6px", fontSize: 10 }}
              onClick={() => setEditing(e.id)}
            >
              edit
            </button>
          </div>
        ),
      )}
    </div>
  );
}

function EditEntry({ entry, onDone }: { entry: EntryRow; onDone: () => void }) {
  const [state, action, pending] = useActionState<EntryState, FormData>(updateEntry, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action} style={{ borderLeft: "2px solid var(--gold)", paddingLeft: 10 }}>
      <input type="hidden" name="id" value={entry.id} />
      {state.error && <div className="alert error">{state.error}</div>}
      <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
        <label className="field" style={{ margin: 0 }}>
          <span>In (UTC)</span>
          <input type="datetime-local" name="clockInAt" defaultValue={entry.inValue} required />
        </label>
        <label className="field" style={{ margin: 0 }}>
          <span>Out (UTC)</span>
          <input type="datetime-local" name="clockOutAt" defaultValue={entry.outValue} />
        </label>
        <button className="btn sm" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button className="btn ghost sm" type="button" onClick={onDone}>
          Cancel
        </button>
        <button
          className="btn ghost sm danger"
          type="submit"
          formAction={deleteEntry}
          formNoValidate
          onClick={(ev) => {
            if (!confirm("Delete this entry? The rota is unaffected.")) ev.preventDefault();
          }}
        >
          delete
        </button>
      </div>
    </form>
  );
}
