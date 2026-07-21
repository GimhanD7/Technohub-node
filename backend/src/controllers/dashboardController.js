const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      activeTeachers,
      totalCourses,
      pendingWalletApprovals,
      upcomingClasses,
      activeQuizzes,
      unresolvedTeacherMessages,
      failedSmsToday,
      recentUsers,
      roleGroups,
      recentActivity
    ] = await Promise.all([
      prisma.users.count({ where: { role: 'student', status: { not: 'deleted' } } }),
      prisma.users.count({ where: { role: 'teacher', status: 'active' } }),
      prisma.courses.count({ where: { status: 'active' } }),
      prisma.wallet_transactions.count({ where: { status: 'pending' } }),
      prisma.online_classes.count({ where: { date_time: { gt: now } } }),
      prisma.quizzes.count({ where: { start_time: { lte: now }, end_time: { gte: now } } }),
      prisma.teacher_messages.count({ where: { status: { not: 'resolved' } } }),
      prisma.sms_logs.count({ where: { status: 'failed', created_at: { gte: startOfToday } } }),
      prisma.users.findMany({
        where: { status: { not: 'deleted' } },
        select: { id: true, index_number: true, full_name: true, email: true, role: true, status: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 6
      }),
      prisma.users.groupBy({
        by: ['role'],
        where: { status: { not: 'deleted' } },
        _count: true
      }),
      prisma.system_logs.findMany({
        include: { users: { select: { full_name: true, role: true } } },
        orderBy: { created_at: 'desc' },
        take: 6
      })
    ]);

    const revenueResult = await prisma.$queryRaw`SELECT SUM(amount) as total FROM wallet_transactions WHERE status = 'approved' AND type = 'credit'`;
    const totalRevenue = Number(revenueResult[0]?.total || 0);

    const roleSummary = roleGroups.map(g => ({ role: g.role, count: g._count }));

    res.json({
      success: true,
      stats: {
        total_students: totalStudents,
        active_teachers: activeTeachers,
        total_courses: totalCourses,
        total_revenue: totalRevenue,
        pending_wallet_approvals: pendingWalletApprovals,
        upcoming_classes: upcomingClasses,
        active_quizzes: activeQuizzes,
        unresolved_teacher_messages: unresolvedTeacherMessages,
        failed_sms_today: failedSmsToday,
        recent_users: recentUsers,
        role_summary: roleSummary,
        recent_activity: recentActivity.map(log => ({
          id: log.id,
          action: log.action,
          details: log.details,
          created_at: log.created_at,
          user_name: log.users?.full_name || 'System',
          user_role: log.users?.role || null
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database error: " + error.message });
  }
};
