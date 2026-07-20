const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.generateNextIndexNumber = async () => {
  try {
    const lastUser = await prisma.users.findFirst({
      where: {
        index_number: {
          startsWith: 'TH-'
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    if (!lastUser || !lastUser.index_number) {
      return 'TH-1001';
    }

    const parts = lastUser.index_number.split('-');
    if (parts.length === 2 && !isNaN(parts[1])) {
      const nextNum = parseInt(parts[1], 10) + 1;
      return `TH-${nextNum}`;
    }

    return 'TH-1001';
  } catch (error) {
    console.error("Error generating index number:", error);
    return null;
  }
};
