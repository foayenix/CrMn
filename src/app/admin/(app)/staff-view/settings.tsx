"use client";

import { useActionState } from "react";
import { setPinAction, regenerateSlugAction, type PinState } from "./actions";

export function StaffViewSettings({ fullUrl, pinSet }: { fullUrl: string; pinSet: boolean }) {
  const [state, action, pending] = useActionState<PinState, FormData>(setPinAction, {});

  return (
    <div>
      <div className="card">
        <h2>Staff view URL</h2>
        {fullUrl ? (
          <>
            <p style={{ fontSize: 13 }}>Give staff this exact link (don&apos;t post it publicly):</p>
            <code style={{ display: "block", padding: 12, background: "var(--sand)", wordBreak: "break-all", fontSize: 13 }}>
              {fullUrl}
            </code>
          </>
        ) : (
          <p className="muted">No slug generated yet.</p>
        )}
        <form action={regenerateSlugAction} style={{ marginTop: 12 }}
          onSubmit={(e) => { if (!confirm("Generate a new URL? The old link will stop working.")) e.preventDefault(); }}>
          <button className="btn ghost sm" type="submit">Generate new URL</button>
        </form>
      </div>

      <div className="card">
        <h2>Shared PIN</h2>
        <p style={{ fontSize: 13 }}>
          Staff enter this once per device. Status:{" "}
          {pinSet ? <span className="badge">set ✓</span> : <strong>not set — set it before sharing the link.</strong>}
        </p>
        {state.ok && <div className="alert ok">PIN updated.</div>}
        {state.error && <div className="alert error">{state.error}</div>}
        <form action={action} style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 8 }}>
          <label className="field" style={{ margin: 0 }}>
            <span>New PIN (4–8 digits)</span>
            <input type="text" name="pin" inputMode="numeric" pattern="\d{4,8}" placeholder="e.g. 4821" required />
          </label>
          <button className="btn" type="submit" disabled={pending}>{pending ? "Saving…" : "Set PIN"}</button>
        </form>
      </div>
    </div>
  );
}
