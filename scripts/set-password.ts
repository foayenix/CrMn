/**
 * Set or reset the boss's admin password.
 *
 *   npm run set-password -- boss@crescentmoonbar.co.uk 'the-new-password'
 *
 * If the email already exists the password is updated; otherwise the single
 * admin user is created. There is intentionally only ever one admin.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error(
      "Usage: npm run set-password -- <email> <password>",
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Enforce single-admin: if an admin already exists, update it (and its email).
  const existing = await prisma.adminUser.findFirst();
  if (existing) {
    await prisma.adminUser.update({
      where: { id: existing.id },
      data: { email, passwordHash },
    });
    console.log(`Updated admin login for ${email}.`);
  } else {
    await prisma.adminUser.create({ data: { email, passwordHash } });
    console.log(`Created admin login for ${email}.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
