"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendPush } from "@/lib/web-push";
import { z } from "zod";

// Subscriptions belong to the boss's devices. Every one of these goes through
// requireAdmin, so a leaked endpoint can't be registered by anyone else.

const SubscriptionSchema = z.object({
  endpoint: z.string().url().max(2000),
  p256dh: z.string().min(1).max(200),
  auth: z.string().min(1).max(200),
  label: z.string().max(80).optional(),
});

export type SubscribeState = { error?: string; ok?: boolean };

export async function saveSubscription(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  await requireAdmin();
  const parsed = SubscriptionSchema.safeParse({
    endpoint: formData.get("endpoint"),
    p256dh: formData.get("p256dh"),
    auth: formData.get("auth"),
    label: formData.get("label") || undefined,
  });
  if (!parsed.success) return { error: "That subscription didn't look right." };

  const { endpoint, p256dh, auth, label } = parsed.data;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh, auth, label },
    create: { endpoint, p256dh, auth, label },
  });
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function removeSubscription(formData: FormData) {
  await requireAdmin();
  const endpoint = String(formData.get("endpoint") ?? "");
  const id = String(formData.get("id") ?? "");
  if (endpoint) await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  else if (id) await prisma.pushSubscription.deleteMany({ where: { id } });
  revalidatePath("/admin/notifications");
}

export type TestState = { message?: string; error?: string };

// Proves the whole chain end to end, which is the only way to know a phone will
// actually buzz before something actually runs out.
export async function sendTestPush(_prev: TestState, formData: FormData): Promise<TestState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const sub = await prisma.pushSubscription.findUnique({ where: { id } });
  if (!sub) return { error: "That device isn't subscribed any more." };

  const result = await sendPush(
    sub,
    JSON.stringify({
      title: "Crescent Moon",
      body: "Test alert — notifications are working.",
      url: "/admin/stock",
      tag: "cm-test",
    }),
  );

  if (result.ok) {
    await prisma.pushSubscription.update({
      where: { id: sub.id },
      data: { lastSentAt: new Date() },
    });
    revalidatePath("/admin/notifications");
    return { message: "Sent. It should arrive in a second or two." };
  }
  if (result.gone) {
    await prisma.pushSubscription.delete({ where: { id: sub.id } });
    revalidatePath("/admin/notifications");
    return { error: "That device had unsubscribed, so it's been removed." };
  }
  return { error: result.error };
}
