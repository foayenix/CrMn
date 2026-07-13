import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Keys used in the Setting table.
export const SETTINGS = {
  STAFF_PIN_HASH: "staff_pin_hash",
  STAFF_SLUG: "staff_slug",
} as const;

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

// ---- Staff PIN -------------------------------------------------------------

export async function isStaffPinSet(): Promise<boolean> {
  return (await getSetting(SETTINGS.STAFF_PIN_HASH)) !== null;
}

export async function setStaffPin(pin: string) {
  const hash = await bcrypt.hash(pin, 10);
  await setSetting(SETTINGS.STAFF_PIN_HASH, hash);
}

export async function verifyStaffPin(pin: string): Promise<boolean> {
  const hash = await getSetting(SETTINGS.STAFF_PIN_HASH);
  if (!hash) return false;
  return bcrypt.compare(pin, hash);
}

// ---- Staff view slug -------------------------------------------------------
// The unguessable URL. Generated once and stored; the boss can regenerate it.

export async function getStaffSlug(): Promise<string | null> {
  return getSetting(SETTINGS.STAFF_SLUG);
}
