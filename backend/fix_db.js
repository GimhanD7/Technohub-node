const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe("ALTER TABLE notifications ADD COLUMN target_role VARCHAR(20) DEFAULT 'all'");
    console.log("Added column target_role to notifications");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
