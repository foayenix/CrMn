"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Chrome's install prompt, which it hands over once and only when it decides
// the app is installable.
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISSED = "cm-install-dismissed";

// "Put this on your Home Screen", shown on a phone that hasn't yet: the admin
// is an installable web app (public/admin.webmanifest), and on iPhone that is
// also the only way notifications can ever reach it.
export function InstallCard() {
  const [state, setState] = useState<"hidden" | "ios" | "android" | "prompt">("hidden");
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    const phone = window.matchMedia("(max-width: 720px)").matches;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED) === "1";
    } catch {
      // Private mode or blocked storage: just show it.
    }
    if (standalone || !phone || dismissed) return;

    setState(/iPhone|iPad|iPod/.test(navigator.userAgent) ? "ios" : "android");
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
      setState("prompt");
    };
    const onInstalled = () => setState("hidden");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (state === "hidden") return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {
      // Fine: it'll show again next time.
    }
    setState("hidden");
  };

  return (
    <div className="card install-card">
      <h2>Put Crescent Moon on your Home Screen</h2>
      {state === "prompt" && (
        <p>It opens full screen like any other app, and you can turn on notifications for low stock and swaps.</p>
      )}
      {state === "ios" && (
        <p>
          In Safari, tap <strong>Share</strong> (the square with the arrow), then <strong>Add to Home Screen</strong>.
          Open it from there, then <Link href="/admin/notifications">turn on notifications</Link>: iPhone only allows
          them for apps on the Home Screen.
        </p>
      )}
      {state === "android" && (
        <p>
          Open the browser menu (<strong>⋮</strong>) and tap <strong>Install app</strong> or{" "}
          <strong>Add to Home screen</strong>. Then <Link href="/admin/notifications">turn on notifications</Link>.
        </p>
      )}
      <div className="row-actions">
        {state === "prompt" && prompt && (
          <button
            className="btn"
            type="button"
            onClick={async () => {
              await prompt.prompt();
              await prompt.userChoice;
              setState("hidden");
            }}
          >
            Install
          </button>
        )}
        <button className="btn ghost sm" type="button" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
