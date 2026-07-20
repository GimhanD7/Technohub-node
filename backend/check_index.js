const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.users.findMany({
    select: { index_number: true, role: true },
    where: { index_number: { not: null, not: "" } },
    take: 10
  });
  console.log(users);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
