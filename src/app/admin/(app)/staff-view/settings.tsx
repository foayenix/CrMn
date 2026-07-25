"use client";

import { useActionState, useState } from "react";
import {
  setStaffPinAction,
  clearStaffPinAction,
  setVenuePhoneAction,
  regenerateSlugAction,
  type PinState,
} from "./actions";

export type StaffPinRow = {
  id: string;
  name: string;
  active: boolean;
  pinSet: boolean;
  pinSetAt: string | null;
};

export function StaffAppSettings({
  fullUrl,
  staff,
  venuePhone,
  legacySharedPin,
}: {
  fullUrl: string;
  staff: StaffPinRow[];
  venuePhone: string;
  legacySharedPin: boolean;
}) {
  const [state, action, pending] = useActionState<PinState, FormData>(setStaffPinAction, {});
  const [showInactive, setShowInactive] = useState(false);
  const visible = staff.filter((s) => s.active || showInactive);
  const activeStaff = staff.filter((s) => s.active);
  const withPin = activeStaff.filter((s) => s.pinSet).length;

  return (
    <div>
      <div className="card">
        <h2>Staff app URL</h2>
        {fullUrl ? (
          <>
            <p style={{ fontSize: 13 }}>Give staff this exact link (don&apos;t post it publicly):</p>
            <code
              style={{
                display: "block",
                padding: 12,
                background: "var(--sand)",
                wordBreak: "break-all",
                fontSize: 13,
              }}
            >
              {fullUrl}
            </code>
          </>
        ) : (
          <p className="muted">No slug generated yet.</p>
        )}
        <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
          The link is the <em>device</em> gate; each person&apos;s PIN is the{" "}
          <em>person</em> gate. Regenerating the link stops the old one working.
        </p>
        <form
          action={regenerateSlugAction}
          style={{ marginTop: 12 }}
          onSubmit={(e) => {
            if (!confirm("Generate a new URL? The old link will stop working.")) e.preventDefault();
          }}
        >
          <button className="btn ghost sm" type="submit">
            Generate new URL
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Staff PINs</h2>
        <p style={{ fontSize: 13, margin: "0 0 14px" }}>
          Four digits each, and the PIN <em>is</em> the identity — whoever&apos;s
          PIN is in signs everything done on that device. {withPin} of{" "}
          {activeStaff.length} active staff have one.
        </p>

        {legacySharedPin && (
          <div className="alert error">
            The old shared PIN is still in the database. Set anyone&apos;s
            personal PIN below and it&apos;s removed automatically.
          </div>
        )}
        {state.error && !state.staffId && <div className="alert error">{state.error}</div>}

        <table className="grid">
          <thead>
            <tr>
              <th>Staff</th>
              <th style={{ width: 150 }}>PIN</th>
              <th style={{ width: 320 }}>Set / reset</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => (
              <tr key={s.id} style={{ opacity: s.active ? 1 : 0.55 }}>
                <td>
                  {s.name}
                  {!s.active && (
                    <span className="badge off" style={{ marginLeft: 6 }}>
                      off
                    </span>
                  )}
                </td>
                <td>
                  {s.pinSet ? (
                    <>
                      <span className="badge">set ✓</span>
                      {s.pinSetAt && (
                        <div className="muted" style={{ fontSize: 10.5, marginTop: 4 }}>
                          {s.pinSetAt}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="muted" style={{ fontSize: 11.5 }}>
                      none — can&apos;t sign in
                    </span>
                  )}
                </td>
                <td>
                  <form action={action} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="hidden" name="staffId" value={s.id} />
                    <input
                      type="text"
                      name="pin"
                      inputMode="numeric"
                      pattern="\d{4}"
                      maxLength={4}
                      placeholder="4 digits"
                      required
                      style={{ width: 100 }}
                    />
                    <button className="btn sm" type="submit" disabled={pending}>
                      {s.pinSet ? "Reset" : "Set"}
                    </button>
                    {s.pinSet && (
                      <button
                        className="btn ghost sm"
                        type="submit"
                        formAction={clearStaffPinAction}
                        formNoValidate
                        onClick={(e) => {
                          if (!confirm(`Remove ${s.name}'s PIN? They won't be able to sign in.`))
                            e.preventDefault();
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </form>
                  {state.staffId === s.id && state.error && (
                    <div className="alert error" style={{ margin: "8px 0 0" }}>
                      {state.error}
                    </div>
                  )}
                  {state.staffId === s.id && state.ok && (
                    <div className="alert ok" style={{ margin: "8px 0 0" }}>
                      {state.ok}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, marginTop: 12 }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            style={{ width: "auto" }}
          />
          Show deactivated staff
        </label>
        <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
          Add, rename and deactivate staff on the Rota page. Deactivating keeps
          their shift history and stops their PIN working.
        </p>
      </div>

      <div className="card">
        <h2>The room&apos;s phone number</h2>
        <p style={{ fontSize: 13 }}>
          Shown on the staff app lock screen, including while the pad is parked —
          someone locked out at midnight needs a way to reach you.
        </p>
        <form action={setVenuePhoneAction} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <label className="field" style={{ margin: 0 }}>
            <span>Phone number</span>
            <input type="text" name="phone" defaultValue={venuePhone} placeholder="01206 000000" />
          </label>
          <button className="btn" type="submit">
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
