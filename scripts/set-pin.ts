/**
 * Set one staff member's staff-app PIN from the command line.
 * (The boss can also do this in Admin → Staff app & PINs — this is a backup.)
 *
 *   npm run set-pin -- "Dan" 4821
 *
 * The PIN is the identity in the staff app, so two people can never share one:
 * a clash is refused here the same way it is in the admin UI.
 */
import { PrismaClient } from "@prisma/client";
import { createHmac } from "crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function pinLookupFor(pin: string): string {
  const secret =
    process.env.STAFF_PIN_SECRET ??
    process.env.SESSION_SECRET ??
    "insecure-dev-secret-change-me";
  return createHmac("sha256", secret).update(pin).digest("hex");
}

async function main() {
  const [name, pin] = process.argv.slice(2);
  if (!name || !pin || !/^\d{4}$/.test(pin)) {
    console.error('Usage: npm run set-pin -- "<staff name>" <4-digit PIN>');
    process.exit(1);
  }

  const staff = await prisma.staffMember.findFirst({ where: { name } });
  if (!staff) {
    const all = await prisma.staffMember.findMany({ select: { name: true } });
    console.error(`No staff member called "${name}". Known: ${all.map((s) => s.name).join(", ")}`);
    process.exit(1);
  }

  const lookup = pinLookupFor(pin);
  const holder = await prisma.staffMember.findUnique({ where: { pinLookup: lookup } });
  if (holder && holder.id !== staff.id) {
    console.error(`That PIN's taken (${holder.name}). Pick another.`);
    process.exit(1);
  }

  await prisma.staffMember.update({
    where: { id: staff.id },
    data: { pinLookup: lookup, pinHash: await bcrypt.hash(pin, 10), pinSetAt: new Date() },
  });

  // The changeover from the shared PIN: once anyone has their own, the old
  // shared hash has no reason to still be in the database.
  await prisma.setting.deleteMany({ where: { key: "staff_pin_hash" } });

  console.log(`PIN set for ${staff.name}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
