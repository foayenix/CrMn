"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { businessDateFor } from "@/lib/business-date";
import { ensureRun } from "@/lib/checklist";
import { requireStaff } from "../access";

// Every tick is signed by whoever's PIN is currently in — never by the device,
// never by whoever started the run. On the shared iPad that's the whole point.

async function openRun(slug: string) {
  const { me } = await requireStaff(slug);
  const businessDate = businessDateFor(new Date());
  const run = await prisma.checklistRun.findUnique({ where: { businessDate } });
  // A submitted night is read-only until a manager reopens it.
  if (run?.submittedAt) return null;
  return { me, businessDate };
}

export async function toggleCheckAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const ctx = await openRun(slug);
  if (!ctx || !itemId) return;

  const existing = await prisma.checklistCheck.findUnique({
    where: { runDate_itemId: { runDate: ctx.businessDate, itemId } },
  });

  if (existing) {
    // Untick. There's no long-press or swipe in this app, so tapping the row
    // again is the only way back from a mis-tap — and it takes the note with
    // it, because a note describes work that was done.
    await prisma.checklistCheck.delete({ where: { id: existing.id } });
  } else {
    await ensureRun(ctx.businessDate);
    await prisma.checklistCheck.create({
      data: { runDate: ctx.businessDate, itemId, checkedById: ctx.me.id },
    });
  }
  revalidatePath(`/staff/${slug}/lockdown`);
}

// Saving a note ticks the item: a note is what happened while you did it, and
// the screen says so before you write one.
export async function saveNoteAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  const ctx = await openRun(slug);
  if (!ctx || !itemId) return;

  await ensureRun(ctx.businessDate);
  await prisma.checklistCheck.upsert({
    where: { runDate_itemId: { runDate: ctx.businessDate, itemId } },
    update: { note: note || null },
    create: { runDate: ctx.businessDate, itemId, checkedById: ctx.me.id, note: note || null },
  });
  revalidatePath(`/staff/${slug}/lockdown`);
}

export async function submitRunAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const ctx = await openRun(slug);
  if (!ctx) return;

  // Re-count server-side: the button being live in someone's browser isn't
  // proof the list is finished.
  const [items, checks] = await Promise.all([
    prisma.checklistItem.count({ where: { active: true } }),
    prisma.checklistCheck.count({
      where: { runDate: ctx.businessDate, item: { active: true } },
    }),
  ]);
  if (items === 0 || checks < items) return;

  await prisma.checklistRun.update({
    where: { businessDate: ctx.businessDate },
    data: { submittedAt: new Date(), submittedById: ctx.me.id },
  });
  revalidatePath(`/staff/${slug}/lockdown`);
  revalidatePath(`/staff/${slug}`);
}
