import { readChecklist, type ChecklistState } from "@/lib/checklist";
import { businessNightLabel } from "@/lib/business-date";
import { requireStaff } from "../access";
import { StaffShell } from "../shell";
import { toggleCheckAction, submitRunAction } from "./actions";
import { NoteEditor } from "./note-row";

export const dynamic = "force-dynamic";

const time = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

// Screen 05 — Lockdown checklist.
//
// Bar, Floor, Security. The whole 76px row is the checkbox: a 34px square with
// a wet thumb is a miss waiting to happen. Ticked items keep the name and time
// that ticked them. Submit stays visibly unavailable, counting what's left,
// until it isn't; after submit the night is read-only and says who locked it.
export default async function LockdownScreen({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { device } = await requireStaff(slug);
  const isPad = device === "ipad";

  const now = new Date();
  const state = await readChecklist(now);
  const submitted = state.submittedAt !== null;

  if (state.total === 0) {
    return (
      <StaffShell slug={slug} section="lockdown" isPad={isPad} title="Lockdown" stat="—" statBrass={false}>
        <div className="staff-empty">
          <div className="staff-serif" style={{ fontSize: 36, lineHeight: 1.1 }}>
            No list yet
          </div>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "rgba(232,224,207,.58)", maxWidth: "28ch" }}>
            A manager writes the closing list in the admin area. Until then,
            close the way you always have.
          </p>
        </div>
      </StaffShell>
    );
  }

  return (
    <StaffShell
      slug={slug}
      section="lockdown"
      isPad={isPad}
      title="Lockdown"
      stat={submitted ? "Locked" : `${state.done} / ${state.total}`}
      statBrass={!submitted && state.remaining > 0}
    >
      {!submitted && (
        <div className="staff-progress">
          <div
            className="staff-progress-fill"
            style={{
              width: `${Math.round((state.done / state.total) * 100)}%`,
              background: state.remaining === 0 ? "var(--sage)" : "var(--brass)",
            }}
          />
        </div>
      )}

      {submitted ? <LockedPanel state={state} night={businessNightLabel(now)} /> : null}

      {submitted ? (
        <WhoDidWhat state={state} />
      ) : (
        <>
          <div className={isPad ? "staff-groups pad" : "staff-groups"}>
            {state.sections.map((section) => (
              <div key={section.name}>
                <div className="staff-section-head">
                  {section.name}&nbsp;
                  <span
                    style={{
                      color:
                        section.done === section.total
                          ? "var(--sage)"
                          : "rgba(232,224,207,.35)",
                    }}
                  >
                    {section.done} / {section.total}
                  </span>
                </div>
                <div className="staff-section-list">
                  {section.entries.map((entry) => (
                    <div key={entry.id} className="staff-check-row">
                      {/* The whole row is the hit area — the box is only drawn. */}
                      <form action={toggleCheckAction} className="staff-check-hit">
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="itemId" value={entry.id} />
                        <button type="submit" className="staff-check-button">
                          <span className={entry.checked ? "staff-box done" : "staff-box"}>
                            {entry.checked ? "✓" : ""}
                          </span>
                          <span className="staff-check-body">
                            <span className={entry.checked ? "staff-check-label done" : "staff-check-label"}>
                              {entry.label}
                            </span>
                            {entry.checked && (
                              <span className="staff-check-sig">
                                {entry.checked.name}&nbsp;·&nbsp;{time(entry.checked.at)}
                              </span>
                            )}
                          </span>
                        </button>
                      </form>

                      <NoteEditor
                        slug={slug}
                        itemId={entry.id}
                        note={entry.checked?.note ?? null}
                        checked={!!entry.checked}
                      />

                      {entry.checked?.note && (
                        <div className="staff-check-note">{entry.checked.note}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="staff-submit-bar">
            {state.remaining === 0 && state.closers.length > 0 && (
              <div className="staff-footnote" style={{ marginTop: 0, marginBottom: 12 }}>
                {state.closers.length === 1
                  ? "You closed tonight."
                  : `${count(state.closers.length)} of you closed tonight.`}
                <br />
                Submitting locks the list until tomorrow.
              </div>
            )}
            <form action={submitRunAction}>
              <input type="hidden" name="slug" value={slug} />
              <button
                type="submit"
                className={state.remaining === 0 ? "staff-button filled" : "staff-button waiting"}
                disabled={state.remaining > 0}
              >
                {state.remaining === 0 ? "Submit the night" : `Submit — ${state.remaining} left`}
              </button>
            </form>
          </div>
        </>
      )}
    </StaffShell>
  );
}

function LockedPanel({ state, night }: { state: ChecklistState; night: string }) {
  const notes = state.notes;
  return (
    <div className="staff-locked-panel">
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <span className="staff-box done big">✓</span>
        <span className="staff-serif" style={{ fontSize: 34, lineHeight: 1 }}>
          Night locked
        </span>
      </div>
      <div className="staff-locked-meta">
        {night}&nbsp;·&nbsp;{state.done} of {state.total}
        <br />
        Submitted by {state.submittedBy} at {state.submittedAt ? time(state.submittedAt) : ""}
      </div>
      <div style={{ fontSize: 16, lineHeight: 1.55, color: "rgba(232,224,207,.7)", marginTop: 14 }}>
        Go home.
        {notes.length === 1 && ` One note went to the manager: ${lower(notes[0].label)}.`}
        {notes.length > 1 && ` ${count(notes.length)} notes went to the manager.`}
      </div>
    </div>
  );
}

function WhoDidWhat({ state }: { state: ChecklistState }) {
  const entries = state.sections.flatMap((s) => s.entries).filter((e) => e.checked);
  return (
    <div style={{ marginTop: 22 }}>
      <div className="staff-mono" style={{ marginBottom: 10 }}>
        Who did what
      </div>
      <div className="staff-signature-list">
        {entries.map((e) => (
          <div key={e.id} className="staff-signature">
            <span className="staff-box done small">✓</span>
            <span style={{ flex: 1, fontSize: 17 }}>{e.label}</span>
            <span className="staff-signature-by">
              {e.checked!.name.split(" ")[0].toUpperCase()} {time(e.checked!.at)}
            </span>
          </div>
        ))}
      </div>
      {state.notes.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="staff-mono" style={{ marginBottom: 8 }}>
            Notes to the manager
          </div>
          {state.notes.map((n, i) => (
            <div key={i} className="staff-check-note" style={{ marginBottom: 8 }}>
              <span className="staff-mono" style={{ display: "block", fontSize: 10, marginBottom: 4 }}>
                {n.label}&nbsp;·&nbsp;{n.by}
              </span>
              {n.note}
            </div>
          ))}
        </div>
      )}
      <div className="staff-footnote">Read-only now. A manager can reopen it.</div>
    </div>
  );
}

const WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
function count(n: number): string {
  return WORDS[n] ?? String(n);
}
function lower(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
