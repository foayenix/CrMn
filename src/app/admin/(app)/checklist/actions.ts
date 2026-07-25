"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ItemSchema = z.object({
  label: z.string().trim().min(1, "Give the item a label").max(160),
  section: z.string().trim().min(1, "Which group does it belong to?").max(40),
  active: z.boolean(),
});

export type ItemFormState = { error?: string; ok?: boolean };

function revalidateAll() {
  revalidatePath("/admin/checklist");
  revalidatePath("/admin");
}

function parseForm(formData: FormData) {
  return ItemSchema.safeParse({
    label: formData.get("label"),
    section: formData.get("section"),
    active: formData.get("active") === "on",
  });
}

export async function createItem(_prev: ItemFormState, formData: FormData): Promise<ItemFormState> {
  await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const max = await prisma.checklistItem.aggregate({ _max: { sortOrder: true } });
  await prisma.checklistItem.create({
    data: { ...parsed.data, sortOrder: (max._max.sortOrder ?? -1) + 1 },
  });
  revalidateAll();
  return { ok: true };
}

export async function updateItem(_prev: ItemFormState, formData: FormData): Promise<ItemFormState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing item id." };
  const parsed = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.checklistItem.update({ where: { id }, data: parsed.data });
  revalidateAll();
  return { ok: true };
}

// Hiding is the safe default: deleting an item takes its ticks with it, and
// those ticks are the record of who closed the room on a given night.
export async function toggleItemActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const item = await prisma.checklistItem.findUnique({ where: { id } });
  if (!item) return;
  await prisma.checklistItem.update({ where: { id }, data: { active: !item.active } });
  revalidateAll();
}

export async function deleteItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.checklistItem.delete({ where: { id } });
    revalidateAll();
  }
}

// Reorder by swapping with the neighbour, the same way What's On does it.
// Ordering the items also orders the groups, since a section takes the position
// of its first item.
export async function moveItem(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "");
  const all = await prisma.checklistItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const idx = all.findIndex((i) => i.id === id);
  if (idx === -1) return;
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) return;

  const a = all[idx];
  const b = all[swapIdx];
  await prisma.$transaction([
    prisma.checklistItem.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.checklistItem.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidateAll();
}

// Reopening hands a submitted night back to the floor — the ticks and their
// signatures stay exactly as they were.
export async function reopenRun(formData: FormData) {
  await requireAdmin();
  const key = String(formData.get("businessDate") ?? "");
  if (!key) return;
  await prisma.checklistRun.update({
    where: { businessDate: new Date(`${key}T00:00:00.000Z`) },
    data: { submittedAt: null, submittedById: null, reopenedAt: new Date() },
  });
  revalidateAll();
}
