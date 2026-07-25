"use client";

import { useState } from "react";
import Link from "next/link";
import { reportStockAction } from "../actions";

// Screen 06.2 — how bad, an optional note, and one filled button.
//
// Low or Out is the only choice on the screen, so it gets two 96px targets
// rather than a control someone has to aim at.
export function ReportForm({
  slug,
  itemId,
  itemName,
  category,
  clock,
}: {
  slug: string;
  itemId: string;
  itemName: string | null;
  category: string | null;
  clock: string;
}) {
  const [level, setLevel] = useState<"LOW" | "OUT">("LOW");
  const [freeText, setFreeText] = useState("");
  const offMenu = itemId === "other";
  const ready = !offMenu || freeText.trim().length > 0;

  return (
    <form action={reportStockAction} className="staff-report">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="level" value={level} />

      <div style={{ flex: 1 }}>
        <div className="staff-mono">Item</div>
        {offMenu ? (
          <>
            <input
              type="text"
              name="freeText"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Tonic, till roll, blue roll…"
              className="staff-freetext"
              autoFocus
              maxLength={120}
            />
            <div className="staff-mono" style={{ fontSize: 11, letterSpacing: ".14em" }}>
              Off menu
            </div>
          </>
        ) : (
          <>
            <div className="staff-serif staff-report-name">{itemName}</div>
            <div className="staff-mono" style={{ fontSize: 11, letterSpacing: ".14em" }}>
              {category}
            </div>
          </>
        )}

        <div className="staff-mono" style={{ margin: "32px 0 10px" }}>
          How bad?
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className={level === "LOW" ? "staff-level-choice on" : "staff-level-choice"}
            onClick={() => setLevel("LOW")}
            aria-pressed={level === "LOW"}
          >
            <span className="staff-serif" style={{ fontSize: 30, lineHeight: 1 }}>
              Low
            </span>
            <span className="staff-level-hint">Order soon</span>
          </button>
          <button
            type="button"
            className={level === "OUT" ? "staff-level-choice on out" : "staff-level-choice"}
            onClick={() => setLevel("OUT")}
            aria-pressed={level === "OUT"}
          >
            <span className="staff-serif" style={{ fontSize: 30, lineHeight: 1 }}>
              Out
            </span>
            <span className="staff-level-hint">Off the list</span>
          </button>
        </div>

        <div className="staff-mono" style={{ margin: "30px 0 10px" }}>
          Note&nbsp;<span style={{ color: "rgba(232,224,207,.28)" }}>optional</span>
        </div>
        <textarea
          name="note"
          rows={3}
          className="staff-textarea note"
          placeholder="Two bottles left in the back fridge, none in the cellar."
          maxLength={500}
        />

        {/* It's a list, not an order — saying so stops anyone expecting a van. */}
        <div className="staff-footnote">
          Goes to the manager&apos;s list — not an order.
          <br />
          Signed with your PIN, {clock}.
        </div>
      </div>

      <div className="staff-report-actions">
        <Link href={`/staff/${slug}/stock`} className="staff-button" style={{ flex: "0 0 96px" }}>
          Cancel
        </Link>
        <button type="submit" className="staff-button filled" style={{ flex: 1 }} disabled={!ready}>
          Flag as {level === "OUT" ? "out" : "low"}
        </button>
      </div>
    </form>
  );
}
