"use server";

import { requireAdmin } from "@/lib/auth";
import { setStaffPin, setSetting, SETTINGS } from "@/lib/settings";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

export type PinState = { error?: string; ok?: boolean };

export async function setPinAction(_prev: PinState, formData: FormData): Promise<PinState> {
  await requireAdmin();
  const pin = String(formData.get("pin") ?? "").trim();
  if (!/^\d{4,8}$/.test(pin)) {
    return { error: "PIN must be 4–8 digits." };
  }
  await setStaffPin(pin);
  revalidatePath("/admin/staff-view");
  return { ok: true };
}

export async function regenerateSlugAction() {
  await requireAdmin();
  const value = randomBytes(12).toString("hex");
  await setSetting(SETTINGS.STAFF_SLUG, value);
  revalidatePath("/admin/staff-view");
}
