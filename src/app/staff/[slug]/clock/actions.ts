"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { reconcileOpenEntries } from "@/lib/clock";
import { requireStaff } from "../access";

// One button, two states. Signed with whoever's PIN is in — on the shared iPad
// that matters as much here as it does on the checklist.

export async function clockInAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const { me } = await requireStaff(slug);

  // Close anything stale first, so a forgotten entry from last night can't
  // block tonight's.
  await reconcileOpenEntries(me.id);

  const alreadyOpen = await prisma.timeEntry.findFirst({
    where: { staffId: me.id, clockOutAt: null },
  });
  if (!alreadyOpen) {
    await prisma.timeEntry.create({ data: { staffId: me.id, clockInAt: new Date() } });
  }
  revalidatePath(`/staff/${slug}/clock`);
  revalidatePath(`/staff/${slug}`);
}

export async function clockOutAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const { me } = await requireStaff(slug);

  const open = await prisma.timeEntry.findFirst({
    where: { staffId: me.id, clockOutAt: null },
    orderBy: { clockInAt: "desc" },
  });
  if (open) {
    await prisma.timeEntry.update({
      where: { id: open.id },
      data: { clockOutAt: new Date() },
    });
  }
  revalidatePath(`/staff/${slug}/clock`);
  revalidatePath(`/staff/${slug}`);
}
