"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LIVE_STATUSES } from "@/lib/swaps";

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/staff", "layout");
}

// Where to land afterwards: the page the button was on, never anywhere else.
function backTo(formData: FormData, msg: string): never {
  const from = String(formData.get("back") ?? "/admin/requests");
  const path = from.startsWith("/admin") ? from : "/admin/requests";
  refresh();
  redirect(`${path}${path.includes("?") ? "&" : "?"}m=${msg}`);
}

// The boss says yes: the shift moves to the person taking it (and, for a swap,
// their shift moves the other way), in one transaction.
//
// If the rota has changed since the swap was agreed — the boss moved or
// reassigned one of the shifts himself — the swap no longer describes the
// rota, so it is declined rather than applied to shifts it wasn't about.
export async function approveSwap(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  const outcome = await prisma.$transaction(async (tx) => {
    const swap = await tx.shiftSwap.findFirst({
      where: { id, status: "ACCEPTED" },
      include: { shift: true, returnShift: true },
    });
    if (!swap || !swap.toId) return "gone" as const;

    const stale =
      swap.shift.staffMemberId !== swap.fromId ||
      (swap.returnShiftId && (!swap.returnShift || swap.returnShift.staffMemberId !== swap.toId));
    if (stale) {
      await tx.shiftSwap.update({
        where: { id },
        data: { status: "DECLINED", decidedAt: new Date(), decidedById: admin.id },
      });
      return "stale" as const;
    }

    // Conditional, so a double tap or a second device can't approve twice.
    const { count } = await tx.shiftSwap.updateMany({
      where: { id, status: "ACCEPTED" },
      data: { status: "APPROVED", decidedAt: new Date(), decidedById: admin.id },
    });
    if (count === 0) return "gone" as const;

    // After any slot they already have that day, so a split keeps its order.
    const nextSlot = async (staffMemberId: string, date: Date) =>
      ((await tx.shift.aggregate({ where: { staffMemberId, date }, _max: { slot: true } }))._max.slot ?? 0) + 1;

    const toSlot = await nextSlot(swap.toId, swap.shift.date);
    await tx.shift.update({ where: { id: swap.shiftId }, data: { staffMemberId: swap.toId, slot: toSlot } });
    if (swap.returnShift) {
      const fromSlot = await nextSlot(swap.fromId, swap.returnShift.date);
      await tx.shift.update({
        where: { id: swap.returnShift.id },
        data: { staffMemberId: swap.fromId, slot: fromSlot },
      });
    }

    // Anything else still pending on these shifts described the old rota.
    const touched = [swap.shiftId, swap.returnShiftId].filter(Boolean) as string[];
    await tx.shiftSwap.updateMany({
      where: {
        id: { not: id },
        status: { in: [...LIVE_STATUSES] },
        OR: [{ shiftId: { in: touched } }, { returnShiftId: { in: touched } }],
      },
      data: { status: "CANCELLED" },
    });
    return "approved" as const;
  });

  backTo(formData, outcome);
}

export async function declineSwap(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { count } = await prisma.shiftSwap.updateMany({
    where: { id, status: "ACCEPTED" },
    data: { status: "DECLINED", decidedAt: new Date(), decidedById: admin.id },
  });
  backTo(formData, count ? "declined" : "gone");
}
