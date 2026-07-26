"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// The shared iPad locks itself after two minutes of nothing happening.
//
// This is the visible half only. The session cookie is minted with the same
// two-minute life and re-minted by middleware on every request, so an iPad left
// on a page overnight is already locked by the time anyone touches it — even if
// this timer never ran.
export function IdleLock({ seconds }: { seconds: number }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), seconds * 1000);
    };

    // Passive listeners only: no gesture in this app means anything, we're just
    // noticing that someone is still there.
    const events = ["pointerdown", "keydown", "visibilitychange"] as const;
    for (const e of events) document.addEventListener(e, reset, { passive: true });
    reset();

    return () => {
      for (const e of events) document.removeEventListener(e, reset);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [router, seconds]);

  return null;
}
