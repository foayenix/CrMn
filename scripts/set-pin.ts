/**
 * Set/change the shared staff-view PIN from the command line.
 * (The boss can also do this in the admin UI — this is a convenience/backup.)
 *
 *   npm run set-pin -- 4821
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [pin] = process.argv.slice(2);
  if (!pin || !/^\d{4,8}$/.test(pin)) {
    console.error("Usage: npm run set-pin -- <4-8 digit PIN>");
    process.exit(1);
  }
  const hash = await bcrypt.hash(pin, 10);
  await prisma.setting.upsert({
    where: { key: "staff_pin_hash" },
    update: { value: hash },
    create: { key: "staff_pin_hash", value: hash },
  });
  console.log("Staff PIN updated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
