"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function revalidateAll() {
  revalidatePath("/admin/stock");
  revalidatePath("/admin");
}

// Resolving is the boss saying "dealt with" — it doesn't delete the report, so
// the history of what ran out and when stays readable.
export async function resolveReport(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.stockReport.update({
    where: { id },
    data: { resolvedAt: new Date(), resolvedById: admin.id },
  });
  revalidateAll();
}

export async function resolveAll() {
  const admin = await requireAdmin();
  await prisma.stockReport.updateMany({
    where: { resolvedAt: null },
    data: { resolvedAt: new Date(), resolvedById: admin.id },
  });
  revalidateAll();
}

// Undo, for the resolve tapped by mistake.
export async function reopenReport(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.stockReport.update({
    where: { id },
    data: { resolvedAt: null, resolvedById: null },
  });
  revalidateAll();
}
