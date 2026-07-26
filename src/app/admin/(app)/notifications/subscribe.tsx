"use client";

import { useEffect, useState } from "react";
import { saveSubscription, removeSubscription } from "./actions";

type Support =
  | "checking"
  | "unsupported"
  | "needs-home-screen"
  | "ready"
  | "denied"
  | "subscribed";

function b64ToBytes(b64url: string): ArrayBuffer {
  const b64 = (b64url + "=".repeat((4 - (b64url.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

function bytesToB64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// A rough name for the device, so two subscriptions are tellable apart.
function deviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "iPhone / iPad";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows";
  return "This device";
}

export function SubscribeButton({
  vapidPublicKey,
  subscribedEndpoints,
}: {
  vapidPublicKey: string;
  subscribedEndpoints: string[];
}) {
  const [support, setSupport] = useState<Support>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        // On iPhone the APIs simply aren't there until the app is on the Home
        // Screen — Apple has required that since Web Push arrived in 16.4.
        const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        const standalone =
          window.matchMedia("(display-mode: standalone)").matches ||
          // Safari's own flag, which TypeScript doesn't know about.
          (navigator as unknown as { standalone?: boolean }).standalone === true;
        if (!cancelled) setSupport(iOS && !standalone ? "needs-home-screen" : "unsupported");
        return;
      }

      if (Notification.permission === "denied") {
        if (!cancelled) setSupport("denied");
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration("/admin-sw.js");
      const existing = await registration?.pushManager.getSubscription();
      if (cancelled) return;
      setSupport(
        existing && subscribedEndpoints.includes(existing.endpoint) ? "subscribed" : "ready",
      );
    })().catch(() => {
      if (!cancelled) setSupport("unsupported");
    });

    return () => {
      cancelled = true;
    };
  }, [subscribedEndpoints]);

  async function subscribe() {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.register("/admin-sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setSupport(permission === "denied" ? "denied" : "ready");
        return;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToBytes(vapidPublicKey),
      });

      const form = new FormData();
      form.set("endpoint", sub.endpoint);
      form.set("p256dh", bytesToB64(sub.getKey("p256dh")));
      form.set("auth", bytesToB64(sub.getKey("auth")));
      form.set("label", deviceLabel());
      const result = await saveSubscription({}, form);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSupport("subscribed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't turn notifications on.");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/admin-sw.js");
      const sub = await registration?.pushManager.getSubscription();
      if (sub) {
        const form = new FormData();
        form.set("endpoint", sub.endpoint);
        await removeSubscription(form);
        await sub.unsubscribe();
      }
      setSupport("ready");
    } finally {
      setBusy(false);
    }
  }

  if (support === "checking") {
    return <p className="muted" style={{ fontSize: 13, margin: 0 }}>Checking this device…</p>;
  }

  if (support === "needs-home-screen") {
    return (
      <div className="alert" style={{ background: "rgba(168,135,90,.12)", border: "1px solid var(--gold)" }}>
        <strong>Add this to your Home Screen first.</strong>
        <p style={{ margin: "8px 0 0", fontSize: 12.5, lineHeight: 1.6 }}>
          On iPhone and iPad, Apple only allows notifications once a site has
          been added to the Home Screen. In Safari: <em>Share</em> →{" "}
          <em>Add to Home Screen</em>, then open Crescent Moon Admin from there
          and come back to this page.
        </p>
      </div>
    );
  }

  if (support === "unsupported") {
    return (
      <p style={{ fontSize: 13, margin: 0 }}>
        This browser can&apos;t do notifications. The count beside{" "}
        <strong>Low stock</strong> in the sidebar tells you the same thing.
      </p>
    );
  }

  if (support === "denied") {
    return (
      <p style={{ fontSize: 13, margin: 0 }}>
        Notifications are blocked for this site in your browser settings. Allow
        them there and reload — or just watch the sidebar count, which never
        needs permission.
      </p>
    );
  }

  return (
    <div>
      {error && <div className="alert error">{error}</div>}
      {support === "subscribed" ? (
        <>
          <p style={{ fontSize: 13, margin: "0 0 12px" }}>
            <span className="badge">on ✓</span> This device will buzz when
            something is flagged low.
          </p>
          <button className="btn ghost sm" onClick={unsubscribe} disabled={busy}>
            {busy ? "…" : "Turn off on this device"}
          </button>
        </>
      ) : (
        <button className="btn" onClick={subscribe} disabled={busy}>
          {busy ? "…" : "Turn on for this device"}
        </button>
      )}
    </div>
  );
}
