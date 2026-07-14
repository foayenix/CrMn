"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createEntry,
  updateEntry,
  deleteEntry,
  toggleActive,
  moveEntry,
  type EntryFormState,
} from "./actions";

type Entry = {
  id: string;
  title: string;
  schedule: string;
  description: string;
  date: string;
  active: boolean;
};

const empty: Entry = { id: "", title: "", schedule: "", description: "", date: "", active: true };

function EntryFields({ entry }: { entry: Entry }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label className="field">
          <span>Schedule label (e.g. Sundays / Monthly)</span>
          <input type="text" name="schedule" defaultValue={entry.schedule} required />
        </label>
        <label className="field">
          <span>Title</span>
          <input type="text" name="title" defaultValue={entry.title} required />
        </label>
      </div>
      <label className="field">
        <span>Description</span>
        <textarea name="description" defaultValue={entry.description} />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "end" }}>
        <label className="field">
          <span>Optional date (for one-off events)</span>
          <input type="date" name="date" defaultValue={entry.date} />
        </label>
        <label className="field" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" name="active" defaultChecked={entry.active} style={{ width: "auto" }} />
          <span style={{ margin: 0 }}>Active (shown on site)</span>
        </label>
      </div>
    </>
  );
}

function AddForm() {
  const [state, action, pending] = useActionState<EntryFormState, FormData>(createEntry, {});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)} style={{ marginBottom: 20 }}>
        + Add entry
      </button>
    );
  }
  return (
    <div className="card">
      <h2>New entry</h2>
      {state.error && <div className="alert error">{state.error}</div>}
      <form action={action}>
        <EntryFields entry={empty} />
        <div className="row-actions">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save entry"}
          </button>
          <button className="btn ghost" type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function EditRow({ entry, isFirst, isLast }: { entry: Entry; isFirst: boolean; isLast: boolean }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState<EntryFormState, FormData>(updateEntry, {});

  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state.ok]);

  if (editing) {
    return (
      <div className="card" style={{ borderColor: "var(--gold)" }}>
        {state.error && <div className="alert error">{state.error}</div>}
        <form action={action}>
          <input type="hidden" name="id" value={entry.id} />
          <EntryFields entry={entry} />
          <div className="row-actions">
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </button>
            <button className="btn ghost" type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        opacity: entry.active ? 1 : 0.55,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <form action={moveEntry}>
          <input type="hidden" name="id" value={entry.id} />
          <input type="hidden" name="dir" value="up" />
          <button className="btn ghost sm" type="submit" disabled={isFirst} title="Move up">
            ↑
          </button>
        </form>
        <form action={moveEntry}>
          <input type="hidden" name="id" value={entry.id} />
          <input type="hidden" name="dir" value="down" />
          <button className="btn ghost sm" type="submit" disabled={isLast} title="Move down">
            ↓
          </button>
        </form>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)" }}>
            {entry.schedule}
          </span>
          <strong className="admin-serif" style={{ fontSize: 22 }}>
            {entry.title}
          </strong>
          {!entry.active && <span className="badge off">Hidden</span>}
        </div>
        {entry.description && (
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(28,21,18,.7)" }}>{entry.description}</p>
        )}
        {entry.date && <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>Date: {entry.date}</p>}
      </div>

      <div className="row-actions">
        <button className="btn ghost sm" type="button" onClick={() => setEditing(true)}>
          Edit
        </button>
        <form action={toggleActive}>
          <input type="hidden" name="id" value={entry.id} />
          <button className="btn ghost sm" type="submit">
            {entry.active ? "Hide" : "Show"}
          </button>
        </form>
        <form
          action={deleteEntry}
          onSubmit={(e) => {
            if (!confirm(`Delete "${entry.title}"?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={entry.id} />
          <button className="btn danger sm" type="submit">
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

export function WhatsOnManager({ entries }: { entries: Entry[] }) {
  return (
    <div>
      <AddForm />
      {entries.length === 0 && <p className="muted">No entries yet.</p>}
      {entries.map((e, i) => (
        <EditRow key={e.id} entry={e} isFirst={i === 0} isLast={i === entries.length - 1} />
      ))}
    </div>
  );
}
