"use client";

import { useActionState } from "react";
import { removeSubscription, sendTestPush, type TestState } from "./actions";

export type Device = {
  id: string;
  label: string;
  added: string;
  lastSent: string | null;
  host: string;
};

export function DeviceList({ devices }: { devices: Device[] }) {
  const [state, action, pending] = useActionState<TestState, FormData>(sendTestPush, {});

  return (
    <div className="card">
      <h2>Devices getting notifications</h2>
      {state.message && <div className="alert ok">{state.message}</div>}
      {state.error && <div className="alert error">{state.error}</div>}

      {devices.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          None yet. Turn them on above, on whichever device you actually carry.
        </p>
      ) : (
        <table className="grid">
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td>
                  <strong>{d.label}</strong>
                  <div className="muted" style={{ fontSize: 10.5, marginTop: 3 }}>
                    added {d.added} · via {d.host}
                    {d.lastSent && <> · last sent {d.lastSent}</>}
                  </div>
                </td>
                <td style={{ width: 170 }}>
                  <div className="row-actions">
                    <form action={action}>
                      <input type="hidden" name="id" value={d.id} />
                      <button className="btn ghost sm" type="submit" disabled={pending}>
                        {pending ? "…" : "send a test"}
                      </button>
                    </form>
                    <form action={removeSubscription}>
                      <input type="hidden" name="id" value={d.id} />
                      <button className="btn ghost sm danger" type="submit">
                        remove
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
