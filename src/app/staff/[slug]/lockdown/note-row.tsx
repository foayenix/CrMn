"use client";

import { useState } from "react";
import { saveNoteAction } from "./actions";

// The note editor for one item. Closed it's a "+ Note" chip; open it's a
// textarea and one button. No long-press, no swipe — a tap opens it, a tap
// closes it.
export function NoteEditor({
  slug,
  itemId,
  note,
  checked,
}: {
  slug: string;
  itemId: string;
  note: string | null;
  checked: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className="staff-note-chip" onClick={() => setOpen(true)}>
        {note ? "Note" : "+ Note"}
      </button>
    );
  }

  return (
    <form action={saveNoteAction} className="staff-note-form" onSubmit={() => setOpen(false)}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="itemId" value={itemId} />
      <textarea
        name="note"
        defaultValue={note ?? ""}
        rows={3}
        autoFocus
        placeholder="What happened?"
        className="staff-textarea"
      />
      <div className="staff-note-actions">
        <button type="submit" className="staff-note-save">
          {checked ? "Save note" : "Tick with note"}
        </button>
        <button type="button" className="staff-note-cancel" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
      {!checked && (
        <div className="staff-note-hint">Saving marks this done, signed with your PIN.</div>
      )}
    </form>
  );
}
