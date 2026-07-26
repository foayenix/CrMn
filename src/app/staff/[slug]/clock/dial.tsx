"use client";

import { useEffect, useState } from "react";
import { elapsedLabel } from "@/lib/clock";

// The elapsed number inside the circle, ticking once a minute. It appears only
// once someone has actually clocked in — there is nothing to count before that.
export function Elapsed({ since }: { since: number }) {
  const [label, setLabel] = useState(() => elapsedLabel(Date.now() - since));

  useEffect(() => {
    const tick = () => setLabel(elapsedLabel(Date.now() - since));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [since]);

  return (
    <span className="staff-serif" style={{ fontSize: 72, fontWeight: 300, lineHeight: 1, letterSpacing: "-.01em" }}>
      {label}
    </span>
  );
}
