"use server";

import { requireAdmin } from "@/lib/auth";
import { setSetting, SETTINGS, retireSharedStaffPin } from "@/lib/settings";
import { setStaffPin, clearStaffPin, PIN_LENGTH } from "@/lib/staff-pin";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

export type PinState = { error?: string; ok?: string; staffId?: string };

// Set or reset one person's PIN. A clash has to say so out loud — two staff
// sharing a PIN would make every signature on a checklist or stock report a
// guess.
export async function setStaffPinAction(_prev: PinState, formData: FormData): Promise<PinState> {
  await requireAdmin();
  const staffId = String(formData.get("staffId") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  if (!staffId) return { error: "Pick a staff member." };

  const result = await setStaffPin(staffId, pin);
  if (!result.ok) {
    return {
      staffId,
      error:
        result.reason === "taken"
          ? "That PIN's taken — pick another."
          : `PIN must be ${PIN_LENGTH} digits.`,
    };
  }

  // Once anyone has their own PIN, the old shared one has no reason to exist.
  await retireSharedStaffPin();
  revalidatePath("/admin/staff-view");
  return { staffId, ok: "PIN set." };
}

export async function clearStaffPinAction(formData: FormData) {
  await requireAdmin();
  const staffId = String(formData.get("staffId") ?? "");
  if (!staffId) return;
  await clearStaffPin(staffId);
  revalidatePath("/admin/staff-view");
}

export async function setVenuePhoneAction(formData: FormData) {
  await requireAdmin();
  const phone = String(formData.get("phone") ?? "").trim();
  await setSetting(SETTINGS.VENUE_PHONE, phone);
  revalidatePath("/admin/staff-view");
}

export async function regenerateSlugAction() {
  await requireAdmin();
  const value = randomBytes(12).toString("hex");
  await setSetting(SETTINGS.STAFF_SLUG, value);
  revalidatePath("/admin/staff-view");
}
