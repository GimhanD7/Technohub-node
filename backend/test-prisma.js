const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function main() {
  const users = await prisma.users.findMany({ take: 1 });
  console.log('Success:', users);
}
main().catch(console.error);
