"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createItem,
  updateItem,
  deleteItem,
  toggleItemActive,
  moveItem,
  type ItemFormState,
} from "./actions";

export type Item = {
  id: string;
  label: string;
  section: string;
  active: boolean;
  // How many nights this item has been ticked on — deleting it would take
  // those signatures with it.
  checkCount: number;
};

function ItemFields({ item, sections }: { item: Item; sections: string[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 12, alignItems: "end" }}>
      <label className="field" style={{ margin: 0 }}>
        <span>Group</span>
        <input
          type="text"
          name="section"
          defaultValue={item.section}
          list="checklist-sections"
          placeholder="Bar"
          required
        />
        <datalist id="checklist-sections">
          {sections.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </label>
      <label className="field" style={{ margin: 0 }}>
        <span>Item</span>
        <input
          type="text"
          name="label"
          defaultValue={item.label}
          placeholder="Candles out — all of them"
          required
        />
      </label>
      <label className="field" style={{ display: "flex", gap: 8, alignItems: "center", margin: 0 }}>
        <input type="checkbox" name="active" defaultChecked={item.active} style={{ width: "auto" }} />
        <span style={{ margin: 0 }}>On the list</span>
      </label>
    </div>
  );
}

const empty: Item = { id: "", label: "", section: "", active: true, checkCount: 0 };

function AddForm({ sections }: { sections: string[] }) {
  const [state, action, pending] = useActionState<ItemFormState, FormData>(createItem, {});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)} style={{ marginBottom: 20 }}>
        + Add item
      </button>
    );
  }
  return (
    <div className="card">
      <h2>New item</h2>
      {state.error && <div className="alert error">{state.error}</div>}
      <form action={action}>
        <ItemFields item={empty} sections={sections} />
        <div className="row-actions" style={{ marginTop: 14 }}>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Add item"}
          </button>
          <button className="btn ghost" type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function EditRow({ item, sections, onDone }: { item: Item; sections: string[]; onDone: () => void }) {
  const [state, action, pending] = useActionState<ItemFormState, FormData>(updateItem, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={item.id} />
      {state.error && <div className="alert error">{state.error}</div>}
      <ItemFields item={item} sections={sections} />
      <div className="row-actions" style={{ marginTop: 12 }}>
        <button className="btn sm" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        <button className="btn ghost sm" type="button" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function ChecklistManager({ items }: { items: Item[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const sections = [...new Set(items.map((i) => i.section))];

  // Grouped for reading, but ordering is one flat list — a section sits where
  // its first item sits.
  const groups: { name: string; items: Item[] }[] = [];
  for (const item of items) {
    let g = groups.find((x) => x.name === item.section);
    if (!g) groups.push((g = { name: item.section, items: [] }));
    g.items.push(item);
  }

  return (
    <div>
      <AddForm sections={sections} />

      {items.length === 0 ? (
        <div className="card">
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            No items yet. Until there are, the staff app&apos;s Lockdown screen
            says so rather than showing an empty list.
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <div className="card" key={group.name}>
            <h2>
              {group.name}{" "}
              <span className="muted" style={{ fontSize: 12 }}>
                {group.items.filter((i) => i.active).length} on the list
              </span>
            </h2>
            <table className="grid">
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.id} style={{ opacity: item.active ? 1 : 0.5 }}>
                    <td>
                      {editing === item.id ? (
                        <EditRow item={item} sections={sections} onDone={() => setEditing(null)} />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          <span style={{ flex: 1, fontSize: 13 }}>
                            {item.label}
                            {!item.active && (
                              <span className="badge off" style={{ marginLeft: 8 }}>
                                hidden
                              </span>
                            )}
                          </span>
                          <div className="row-actions">
                            <form action={moveItem}>
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="dir" value="up" />
                              <button className="btn ghost sm" type="submit" title="Move up">
                                ↑
                              </button>
                            </form>
                            <form action={moveItem}>
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name="dir" value="down" />
                              <button className="btn ghost sm" type="submit" title="Move down">
                                ↓
                              </button>
                            </form>
                            <button className="btn ghost sm" onClick={() => setEditing(item.id)}>
                              edit
                            </button>
                            <form action={toggleItemActive}>
                              <input type="hidden" name="id" value={item.id} />
                              <button className="btn ghost sm" type="submit">
                                {item.active ? "hide" : "show"}
                              </button>
                            </form>
                            <form
                              action={deleteItem}
                              onSubmit={(e) => {
                                const msg = item.checkCount
                                  ? `Delete "${item.label}"? It's been ticked on ${item.checkCount} night${item.checkCount === 1 ? "" : "s"} — those signatures go with it. Hiding it keeps the history.`
                                  : `Delete "${item.label}"?`;
                                if (!confirm(msg)) e.preventDefault();
                              }}
                            >
                              <input type="hidden" name="id" value={item.id} />
                              <button className="btn ghost sm danger" type="submit">
                                delete
                              </button>
                            </form>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
