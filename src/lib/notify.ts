import { prisma } from "@/lib/prisma";
import { sendPush, isPushConfigured } from "@/lib/web-push";

// The one thing this app ever pushes, and only ever to the boss.
//
// Called from the staff-side stock action, but nothing here may affect it:
// a push service being slow or down at midnight must not delay or fail the
// report someone just made on the floor.

export async function notifyStockFlagged(summary: {
  name: string;
  level: "LOW" | "OUT";
  by: string;
  note: string | null;
}) {
  if (!isPushConfigured()) return;

  const devices = await prisma.pushSubscription.findMany();
  if (devices.length === 0) return; // The dashboard badge is the guarantee.

  const open = await prisma.stockReport.count({ where: { resolvedAt: null } });
  const body = [
    `${summary.name} — ${summary.level === "OUT" ? "out" : "low"}`,
    summary.note,
    open > 1 ? `${open} open in total.` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  await Promise.all(
    devices.map(async (device) => {
      const result = await sendPush(
        device,
        JSON.stringify({
          title: "Flagged low",
          body,
          url: "/admin/stock",
          // One tag, so a second flag replaces the first rather than stacking
          // a pile of alerts on a phone.
          tag: "cm-stock",
        }),
      );

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
