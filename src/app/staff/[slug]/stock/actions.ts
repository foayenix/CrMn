"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "../access";

// A report is a line on the manager's list, signed with the PIN that made it.
// It is not an order, and the screen says so before you send one.

export async function reportStockAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const { me } = await requireStaff(slug);

  const itemId = String(formData.get("itemId") ?? "");
  const freeText = String(formData.get("freeText") ?? "").trim().slice(0, 120);
  const level = String(formData.get("level") ?? "") === "OUT" ? "OUT" : "LOW";
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || null;

  if (itemId && itemId !== "other") {
    const item = await prisma.stockItem.findFirst({ where: { id: itemId, active: true } });
    if (!item) redirect(`/staff/${slug}/stock`);

    // Two people can reach for the same bottle at once. The list dims what's
    // already flagged, but the check that matters is this one.
    const already = await prisma.stockReport.findFirst({
      where: { itemId, resolvedAt: null },
    });
    if (!already) {
      await prisma.stockReport.create({
        data: { itemId, level, note, reportedById: me.id },
      });
    }
  } else {
    if (!freeText) redirect(`/staff/${slug}/stock/other`);
    await prisma.stockReport.create({
      data: { freeText, level, note, reportedById: me.id },
    });
  }

  revalidatePath(`/staff/${slug}/stock`);
  revalidatePath(`/staff/${slug}`);
  redirect(`/staff/${slug}/stock`);
}
