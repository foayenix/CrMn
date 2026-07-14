"use client";

import { useActionState } from "react";
import { verifyPinAction, type StaffPinState } from "./actions";

export function StaffPinForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<StaffPinState, FormData>(verifyPinAction, {});
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1 className="admin-serif" style={{ fontSize: 30, margin: "0 0 4px" }}>Crescent Moon</h1>
        <p style={{ fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--green)", margin: "0 0 22px" }}>
          Staff
        </p>
        {state.error && <div className="alert error">{state.error}</div>}
        <form action={action}>
          <input type="hidden" name="slug" value={slug} />
          <label className="field">
            <span>Enter staff PIN</span>
            <input type="password" name="pin" inputMode="numeric" autoComplete="off" autoFocus required />
          </label>
          <button className="btn" type="submit" disabled={pending} style={{ width: "100%", justifyContent: "center" }}>
            {pending ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
