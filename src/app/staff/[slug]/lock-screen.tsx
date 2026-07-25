"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unlockAction } from "./actions";

// Screen 01 — PIN lock. Three states, all in here:
//   1.1 resting     · logo, four dots, 92px keys (108 on iPad)
//   1.2 wrong PIN   · dots clear to rose, tries counted down
//   1.3 locked out  · pad parks for 60s behind a counting circle
// The room's phone number stays visible throughout.

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "DEL"];
const PIN_LENGTH = 4;

export function LockScreen({
  slug,
  venuePhone,
  initialLockedForSeconds,
  initialTriesLeft,
}: {
  slug: string;
  venuePhone: string | null;
  initialLockedForSeconds: number;
  initialTriesLeft: number;
}) {
  const router = useRouter();
  const [digits, setDigits] = useState("");
  const [triesLeft, setTriesLeft] = useState(initialTriesLeft);
  const [wrong, setWrong] = useState(false);
  const [remaining, setRemaining] = useState(initialLockedForSeconds);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const locked = remaining > 0;

  // The countdown is only the visible half of the lock; the server refuses
  // early attempts regardless of what this timer says.
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setTriesLeft(3);
          setWrong(false);
          setMessage(null);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [remaining]);

  function submit(pin: string) {
    startTransition(async () => {
      const result = await unlockAction(slug, pin);
      switch (result.status) {
        case "ok":
          setDigits("");
          router.refresh();
          break;
        case "wrong":
          setDigits("");
          setWrong(true);
          setTriesLeft(result.triesLeft);
          break;
        case "locked":
          setDigits("");
          setWrong(false);
          setRemaining(result.lockedForSeconds);
          break;
        case "needs-device":
          // The device answer went missing (cleared cookies). Re-ask it.
          router.refresh();
          break;
        case "invalid":
          setDigits("");
          setMessage("This link is no longer live. Ask a manager for the new one.");
          break;
      }
    });
  }

  function press(key: string) {
    if (locked || pending) return;
    if (key === "DEL") {
      setWrong(false);
      setDigits((d) => d.slice(0, -1));
      return;
    }
    if (!key || digits.length >= PIN_LENGTH) return;
    const next = digits + key;
    setWrong(false);
    setDigits(next);
    if (next.length === PIN_LENGTH) submit(next);
  }

  return (
    <div className="staff-lock">
      <div className="staff-lock-top">
        {locked ? (
          <>
            <div className="staff-countdown">{remaining}</div>
            <div className="staff-mono" style={{ color: "var(--rose)", letterSpacing: ".3em" }}>
              Locked&nbsp;·&nbsp;60 seconds
            </div>
            <div className="staff-serif" style={{ fontSize: 32, lineHeight: 1.15 }}>
              Three misses. Take a breath.
            </div>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "rgba(232,224,207,.58)", maxWidth: "28ch" }}>
              The pad comes back on its own. If your PIN has gone, a manager can
              reset it in seconds.
            </p>
          </>
        ) : (
          <>
            <Moon dim={wrong} />
            <div>
              <div className="staff-lock-title">Crescent Moon</div>
              <div
                className="staff-mono"
                style={{ marginTop: 10, letterSpacing: ".3em", color: wrong ? "var(--rose)" : undefined }}
              >
                {wrong
                  ? `Wrong PIN · ${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left`
                  : "Staff · Enter PIN"}
              </div>
            </div>
            <div className={`staff-dots${wrong ? " wrong" : ""}`} aria-hidden="true">
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <span
                  key={i}
                  className={`staff-dot${!wrong && i < digits.length ? " filled" : ""}`}
                />
              ))}
            </div>
            {wrong && <div className="staff-note">Cleared for you — start again.</div>}
            {message && <div className="staff-note wrong">{message}</div>}
          </>
        )}
      </div>

      <div className={`staff-keypad${locked ? " parked" : ""}`}>
        {KEYS.map((k, i) =>
          k === "" ? (
            <span key={i} className="staff-key blank" />
          ) : (
            <button
              key={i}
              type="button"
              className={`staff-key${k === "DEL" ? " del" : ""}`}
              onClick={() => press(k)}
              disabled={locked}
              aria-label={k === "DEL" ? "Delete" : k}
            >
              {k}
            </button>
          ),
        )}
      </div>

      {venuePhone && (
        <div className="staff-lock-foot">
          <a
            href={`tel:${venuePhone.replace(/\s+/g, "")}`}
            className="staff-mono"
            style={{ fontSize: 12, letterSpacing: ".22em", color: "rgba(232,224,207,.55)" }}
          >
            The room&nbsp;·&nbsp;{venuePhone}
          </a>
        </div>
      )}
    </div>
  );
}

function Moon({ dim }: { dim: boolean }) {
  return (
    <svg width="46" height="46" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path
        d="M 52 8 A 42 42 0 1 0 52 92 A 31 42 0 1 1 52 8 Z"
        fill="none"
        stroke={dim ? "rgba(168,135,90,.45)" : "#A8875A"}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
