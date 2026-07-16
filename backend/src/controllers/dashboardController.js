const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAdminStats = async (req, res) => {
  try {
    const totalStudents = await prisma.users.count({ where: { role: 'student' } });
    const activeTeachers = await prisma.users.count({ where: { role: 'teacher', status: 'active' } });
    const totalCourses = await prisma.courses.count();

    const revenueResult = await prisma.$queryRaw`SELECT SUM(amount) as total FROM wallet_transactions WHERE status = 'approved' AND type = 'credit'`;
    const totalRevenue = Number(revenueResult[0]?.total || 0);

    const recentUsers = await prisma.users.findMany({
      select: { id: true, index_number: true, full_name: true, email: true, role: true, status: true, created_at: true },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    const roleGroups = await prisma.users.groupBy({
      by: ['role'],
      _count: true
    });
    const roleSummary = roleGroups.map(g => ({ role: g.role, count: g._count }));

    res.json({
      success: true,
      stats: {
        total_students: totalStudents,
        active_teachers: activeTeachers,
        total_courses: totalCourses,
        total_revenue: totalRevenue,
        recent_users: recentUsers,
        role_summary: roleSummary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database error: " + error.message });
  }
};
