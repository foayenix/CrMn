"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type EntryState = { error?: string; ok?: boolean };

// "YYYY-MM-DDTHH:MM" from a datetime-local input, read as UTC to match how the
// rest of this app stores and prints times.
function parseLocal(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Correcting an entry marks it edited, so the record always says whether a time
// came from the person, from reconciliation, or from the boss.
export async function updateEntry(_prev: EntryState, formData: FormData): Promise<EntryState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing entry." };

  const inAt = parseLocal(String(formData.get("clockInAt") ?? ""));
  const outRaw = String(formData.get("clockOutAt") ?? "");
  const outAt = outRaw ? parseLocal(outRaw) : null;

  if (!inAt) return { error: "Clock-in time isn't a valid date." };
  if (outRaw && !outAt) return { error: "Clock-out time isn't a valid date." };
  if (outAt && outAt <= inAt) return { error: "Clock-out has to come after clock-in." };

  await prisma.timeEntry.update({
    where: { id },
    data: { clockInAt: inAt, clockOutAt: outAt, adminEdited: true, autoClosed: false },
  });
  revalidatePath("/admin/clock");
  return { ok: true };
}

export async function deleteEntry(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.timeEntry.delete({ where: { id } });
    revalidatePath("/admin/clock");
  }
}
