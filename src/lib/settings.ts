import { prisma } from "@/lib/prisma";

// Keys used in the Setting table.
export const SETTINGS = {
  STAFF_SLUG: "staff_slug",
  VENUE_PHONE: "venue_phone",
  // Retired: the staff app used to share one PIN across the whole team. It's
  // per-staff now (StaffMember.pinLookup / pinHash). The key stays named here
  // only so the row can be cleaned out — nothing reads it.
  LEGACY_STAFF_PIN_HASH: "staff_pin_hash",
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

// ---- Retired shared staff PIN ----------------------------------------------
// Called on seed and whenever the boss saves a per-staff PIN, so the old shared
// hash doesn't sit in the database after the changeover.

export async function retireSharedStaffPin() {
  await prisma.setting.deleteMany({ where: { key: SETTINGS.LEGACY_STAFF_PIN_HASH } });
}

export async function hasLegacySharedPin(): Promise<boolean> {
  return (await getSetting(SETTINGS.LEGACY_STAFF_PIN_HASH)) !== null;
}

// ---- Venue phone -----------------------------------------------------------
// The room's phone number. It stays visible on the lock screen — someone locked
// out at 00:12 needs a way to reach the person who can let them in.

export async function getVenuePhone(): Promise<string | null> {
  return getSetting(SETTINGS.VENUE_PHONE);
}

// ---- Staff view slug -------------------------------------------------------
// The unguessable URL. Generated once and stored; the boss can regenerate it.

export async function getStaffSlug(): Promise<string | null> {
  return getSetting(SETTINGS.STAFF_SLUG);
}
