"use server";

import { getStaffSlug } from "@/lib/settings";
import {
  findStaffByPin,
  getThrottle,
  recordPinFailure,
  clearPinFailures,
  isValidPinFormat,
} from "@/lib/staff-pin";
import { isDeviceMode } from "@/lib/staff-session";
import {
  createStaffSession,
  destroyStaffSession,
  getDeviceMode,
  setDeviceMode,
} from "@/lib/staff-cookies";
import { revalidatePath } from "next/cache";

// The slug is the *device* gate and the PIN is the *person* gate. A wrong slug
// gets the same nothing as a wrong URL anywhere else on the site.

export type UnlockResult =
  | { status: "ok" }
  | { status: "wrong"; triesLeft: number }
  | { status: "locked"; lockedForSeconds: number }
  | { status: "needs-device" }
  | { status: "invalid" };

export async function unlockAction(slug: string, pin: string): Promise<UnlockResult> {
  const realSlug = await getStaffSlug();
  if (!realSlug || slug !== realSlug) return { status: "invalid" };

  // The parked pad is enforced server-side, so reloading the page doesn't hand
  // back the three tries.
  const throttle = await getThrottle(slug);
  if (throttle.lockedForSeconds > 0) {
    return { status: "locked", lockedForSeconds: throttle.lockedForSeconds };
  }

  const device = await getDeviceMode();
  if (!device) return { status: "needs-device" };

  // Unknown PIN and wrong PIN take the same path, at the same cost.
  const staff = isValidPinFormat(pin) ? await findStaffByPin(pin) : null;
  if (!staff) {
    const next = await recordPinFailure(slug);
    return next.lockedForSeconds > 0
      ? { status: "locked", lockedForSeconds: next.lockedForSeconds }
      : { status: "wrong", triesLeft: next.triesLeft };
  }

  await clearPinFailures(slug);
  await createStaffSession({ staffId: staff.id, name: staff.name, device });
  revalidatePath(`/staff/${slug}`);
  return { status: "ok" };
}

// Asked once, at first unlock. We never sniff the user agent: only the person
// setting the device up knows whether it lives in a pocket or behind the bar.
export async function setDeviceAction(formData: FormData) {
  const device = String(formData.get("device") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const realSlug = await getStaffSlug();
  if (!realSlug || slug !== realSlug) return;
  if (!isDeviceMode(device)) return;
  await setDeviceMode(device);
  revalidatePath(`/staff/${slug}`);
}

// Lock clears the person, never the device answer.
export async function lockAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  await destroyStaffSession();
  revalidatePath(`/staff/${slug}`);
}
