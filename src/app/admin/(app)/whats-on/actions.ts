"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const EntrySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  schedule: z.string().trim().min(1, "Schedule label is required").max(60),
  description: z.string().trim().max(400),
  date: z.string().trim().optional(),
  active: z.boolean(),
});

export type EntryFormState = { error?: string; ok?: boolean };

function parseForm(formData: FormData) {
  return EntrySchema.safeParse({
    title: formData.get("title"),
    schedule: formData.get("schedule"),
    description: formData.get("description") ?? "",
    date: formData.get("date") || undefined,
    active: formData.get("active") === "on",
  });
}

// Editing the What's On section is what makes the public homepage change, so
// revalidate the home route too.
function revalidateAll() {
  revalidatePath("/admin/whats-on");
  revalidatePath("/");
}

export async function createEntry(
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const max = await prisma.whatsOnEntry.aggregate({ _max: { sortOrder: true } });
  await prisma.whatsOnEntry.create({
    data: {
      title: parsed.data.title,
      schedule: parsed.data.schedule,
      description: parsed.data.description,
      date: parsed.data.date ? new Date(parsed.data.date) : null,
      active: parsed.data.active,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  revalidateAll();
  return { ok: true };
}

export async function updateEntry(
  _prev: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing entry id." };
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.whatsOnEntry.update({
    where: { id },
    data: {
      title: parsed.data.title,
      schedule: parsed.data.schedule,
      description: parsed.data.description,
      date: parsed.data.date ? new Date(parsed.data.date) : null,
      active: parsed.data.active,
    },
  });
  revalidateAll();
  return { ok: true };
}

export async function deleteEntry(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.whatsOnEntry.delete({ where: { id } });
    revalidateAll();
  }
}

export async function toggleActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const entry = await prisma.whatsOnEntry.findUnique({ where: { id } });
  if (entry) {
    await prisma.whatsOnEntry.update({
      where: { id },
      data: { active: !entry.active },
    });
    revalidateAll();
  }
}

// Reorder by swapping sortOrder with the neighbour in the given direction.
export async function moveEntry(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "");
  const all = await prisma.whatsOnEntry.findMany({ orderBy: { sortOrder: "asc" } });
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return;
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) return;

  const a = all[idx];
  const b = all[swapIdx];
  await prisma.$transaction([
    prisma.whatsOnEntry.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.whatsOnEntry.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidateAll();
}
