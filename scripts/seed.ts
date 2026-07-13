/**
 * Idempotent seed:
 *   - the four current "What's On" entries (so the live section matches today)
 *   - the staff currently on the Excel rota
 *   - a random staff-view slug (if not already set)
 *   - a default admin login IF none exists yet (change it immediately!)
 *
 *   npm run seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

const WHATS_ON = [
  { schedule: "Sundays", title: "Soul Night", description: "Records, low light, no rush." },
  { schedule: "Monthly", title: "Guided wine tasting", description: "Six pours, one theme, led by the sommelier." },
  { schedule: "Dates vary", title: "Live music & themed nights", description: "Announced on Instagram first." },
  { schedule: "Occasional", title: "Slow-dating socials", description: "With Everywhere We Meet — under the skylight." },
];

// From the current Excel rota. "New team member" is the placeholder row.
const STAFF = [
  "Harry",
  "Alex Newland",
  "Dan",
  "Felix",
  "Skye",
  "Dilan",
  "Lily",
  "Liam",
  "Ali Edwards",
  "New team member",
];

async function main() {
  // What's On
  const existingWhatsOn = await prisma.whatsOnEntry.count();
  if (existingWhatsOn === 0) {
    await prisma.whatsOnEntry.createMany({
      data: WHATS_ON.map((e, i) => ({ ...e, sortOrder: i, active: true })),
    });
    console.log(`Seeded ${WHATS_ON.length} What's On entries.`);
  } else {
    console.log(`What's On already has ${existingWhatsOn} entries — skipping.`);
  }

  // Staff
  for (let i = 0; i < STAFF.length; i++) {
    const name = STAFF[i];
    const found = await prisma.staffMember.findFirst({ where: { name } });
    if (!found) {
      await prisma.staffMember.create({ data: { name, sortOrder: i, active: true } });
    }
  }
  console.log(`Ensured ${STAFF.length} staff members.`);

  // Staff-view slug
  const slug = await prisma.setting.findUnique({ where: { key: "staff_slug" } });
  if (!slug) {
    const value = randomBytes(12).toString("hex"); // 24 hex chars
    await prisma.setting.create({ data: { key: "staff_slug", value } });
    console.log(`Generated staff-view slug: /staff/${value}`);
  } else {
    console.log(`Staff-view slug already set: /staff/${slug.value}`);
  }

  // Default admin (only if none exists)
  const admin = await prisma.adminUser.findFirst();
  if (!admin) {
    const email = "boss@crescentmoonbar.co.uk";
    const password = "changeme123";
    await prisma.adminUser.create({
      data: { email, passwordHash: await bcrypt.hash(password, 12) },
    });
    console.log(
      `\n⚠  Created DEFAULT admin login:\n   email:    ${email}\n   password: ${password}\n   Change it now:  npm run set-password -- <email> <new-password>\n`,
    );
  } else {
    console.log(`Admin login already exists (${admin.email}).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
