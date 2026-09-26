import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPush, isPushConfigured } from "@/lib/web-push";

// Push is the boss's, and only ever the boss's.
//
// Everything here is called from the staff app, and nothing here may affect
// it: a push service being slow or down at midnight must not delay or fail
// what someone just did on the floor. `bossPush` runs after the response has
// gone back and swallows every failure; the admin badges are the guarantee.

type Push = {
  title: string;
  body: string;
  // Where tapping the notification opens.
  url: string;
  // One tag per kind, so a second alert replaces the first rather than
  // stacking a pile of them on a phone.
  tag: string;
};

async function sendToBoss(push: Push | (() => Promise<Push | null>)) {
  if (!isPushConfigured()) return;
  const devices = await prisma.pushSubscription.findMany();
  if (devices.length === 0) return;

  const payload = typeof push === "function" ? await push() : push;
  if (!payload) return;

  await Promise.all(
    devices.map(async (device) => {
      const result = await sendPush(device, JSON.stringify(payload));
      if (result.ok) {
        await prisma.pushSubscription.update({
          where: { id: device.id },
          data: { lastSentAt: new Date() },
        });
      } else if (result.gone) {
        // The boss uninstalled or revoked it; stop trying.
        await prisma.pushSubscription.delete({ where: { id: device.id } }).catch(() => {});
      }
      // Any other failure is deliberately swallowed — see the note above.
    }),
  );
}

// Fire and forget, after the staff member already has their screen back.
function bossPush(push: Push | (() => Promise<Push | null>)) {
  after(async () => {
    try {
      await sendToBoss(push);
    } catch {
      // Deliberately swallowed.
    }
  });
}

export function notifyStockFlagged(summary: {
  name: string;
  level: "LOW" | "OUT";
  by: string;
  note: string | null;
}) {
  bossPush(async () => {
    const open = await prisma.stockReport.count({ where: { resolvedAt: null } });
    return {
      title: "Flagged low",
      body: [
        `${summary.name} — ${summary.level === "OUT" ? "out" : "low"}`,
        summary.note,
        open > 1 ? `${open} open in total.` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      url: "/admin/stock",
      tag: "cm-stock",
    };
  });
}

export function notifyUnavailable(summary: { by: string; when: string; note: string | null }) {
  bossPush({
    title: "Can't work",
    body: [`${summary.by} — ${summary.when}`, summary.note].filter(Boolean).join(" · "),
    url: "/admin/requests",
    tag: "cm-unavailable",
  });
}

export function notifySwapNeedsApproval(summary: { from: string; to: string; shift: string; returnShift: string | null }) {
  bossPush(async () => {
    const waiting = await prisma.shiftSwap.count({ where: { status: "ACCEPTED" } });
    return {
      title: "Swap to approve",
      body: [
        summary.returnShift
          ? `${summary.from} and ${summary.to} want to swap ${summary.shift} for ${summary.returnShift}`
          : `${summary.to} will cover ${summary.from}'s ${summary.shift}`,
        waiting > 1 ? `${waiting} waiting.` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      url: "/admin/requests",
      tag: "cm-swap",
    };
  });
}
