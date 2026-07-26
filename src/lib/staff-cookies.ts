import { cookies } from "next/headers";
import {
  STAFF_COOKIE,
  STAFF_DEVICE_COOKIE,
  DEVICE_MAX_AGE,
  sessionMaxAge,
  signStaffToken,
  readStaffToken,
  signDeviceToken,
  readDeviceToken,
  staffCookieOptions,
  type DeviceMode,
  type StaffSession,
} from "@/lib/staff-session";

// The cookie-store half of the staff session, for server components and
// actions. The token half lives in `staff-session.ts`, which middleware imports
// and which therefore can't touch `next/headers`.

export async function createStaffSession(session: StaffSession) {
  const token = await signStaffToken(session);
  (await cookies()).set(STAFF_COOKIE, token, staffCookieOptions(sessionMaxAge(session.device)));
}

export async function destroyStaffSession() {
  (await cookies()).delete(STAFF_COOKIE);
}

export async function getStaffSession(): Promise<StaffSession | null> {
  return readStaffToken((await cookies()).get(STAFF_COOKIE)?.value);
}

export async function setDeviceMode(device: DeviceMode) {
  const token = await signDeviceToken(device);
  (await cookies()).set(STAFF_DEVICE_COOKIE, token, staffCookieOptions(DEVICE_MAX_AGE));
}

export async function getDeviceMode(): Promise<DeviceMode | null> {
  return readDeviceToken((await cookies()).get(STAFF_DEVICE_COOKIE)?.value);
}

export async function forgetDeviceMode() {
  (await cookies()).delete(STAFF_DEVICE_COOKIE);
}
