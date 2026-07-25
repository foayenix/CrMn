import { reopenRun } from "./actions";

export type RunRow = {
  key: string;
  label: string;
  submittedAt: string | null;
  submittedBy: string | null;
  reopened: boolean;
  ticked: number;
  total: number;
  notes: { label: string; note: string; by: string }[];
};

// The last fortnight of nights. A night nobody closed simply isn't here — no
// row is created until someone ticks something, so absence is real information.
export function RunHistory({ runs }: { runs: RunRow[] }) {
  return (
    <div className="card">
      <h2>Recent nights</h2>
      {runs.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Nothing closed yet.
        </p>
      ) : (
        <table className="grid">
          <thead>
            <tr>
              <th style={{ width: 110 }}>Night</th>
              <th style={{ width: 90 }}>Ticked</th>
              <th style={{ width: 190 }}>Submitted</th>
              <th>Notes to you</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td>
                  {r.ticked} / {r.total}
                </td>
                <td>
                  {r.submittedAt ? (
                    <>
                      <span className="badge">{r.submittedAt}</span>
                      <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                        by {r.submittedBy}
                      </div>
                    </>
                  ) : (
                    <span className="muted" style={{ fontSize: 11.5 }}>
                      {r.reopened ? "reopened — not resubmitted" : "not submitted"}
                    </span>
                  )}
                </td>
                <td>
                  {r.notes.length === 0 ? (
                    <span className="muted" style={{ fontSize: 11.5 }}>
                      —
                    </span>
                  ) : (
                    r.notes.map((n, i) => (
                      <div key={i} style={{ fontSize: 12, marginBottom: 6, lineHeight: 1.5 }}>
                        <strong>{n.label}</strong> — {n.note}
                        <span className="muted"> ({n.by})</span>
                      </div>
                    ))
                  )}
                </td>
                <td>
                  {r.submittedAt && (
                    <form action={reopenRun}>
                      <input type="hidden" name="businessDate" value={r.key} />
                      <button className="btn ghost sm" type="submit">
                        reopen
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
