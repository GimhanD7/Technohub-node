const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getEarnings = async (req, res) => {
  try {
    const { teacher_id } = req.query;
    if (!teacher_id) return res.status(400).json({ success: false, message: "Teacher ID is required." });

    const earnings = await prisma.teacher_earnings_history.findMany({
      where: { teacher_id: parseInt(teacher_id) },
      orderBy: { created_at: 'desc' }
    });

    const totalEarningAgg = await prisma.teacher_earnings_history.aggregate({
      where: { teacher_id: parseInt(teacher_id) },
      _sum: { net_earning: true }
    });
    
    const commission = await prisma.teacher_commissions.findUnique({
      where: { teacher_id: parseInt(teacher_id) }
    });

    res.json({
      success: true,
      earnings,
      total_earned: totalEarningAgg._sum.net_earning || 0,
      current_rate: commission ? commission.commission_value : 80 // Default to 80% if not set
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const { teacher_id } = req.query;
    if (!teacher_id) return res.status(400).json({ success: false, message: "Teacher ID is required." });
    const tid = parseInt(teacher_id);

    const activeCourses = await prisma.courses.count({
      where: { teacher_id: tid, status: 'active' }
    });
    const totalCourses = await prisma.courses.count({
      where: { teacher_id: tid }
    });

    const totalStudentsResult = await prisma.course_enrollments.findMany({
      where: { courses: { teacher_id: tid } },
      select: { student_id: true },
      distinct: ['student_id']
    });
    const totalStudents = totalStudentsResult.length;

    const totalQuizzes = await prisma.quizzes.count({
      where: { created_by: tid }
    });

    const earningsAgg = await prisma.teacher_earnings_history.aggregate({
      where: { teacher_id: tid },
      _sum: { net_earning: true }
    });
    const totalEarnings = earningsAgg._sum.net_earning || 0;

    const recentQuizAttempts = await prisma.quiz_attempts.findMany({
      where: { quizzes: { created_by: tid }, is_submitted: true },
      include: {
        users: { select: { full_name: true, profile_picture: true } },
        quizzes: { select: { title: true } }
      },
      orderBy: { submitted_at: 'desc' },
      take: 5
    });

    res.json({
      success: true,
      stats: {
        total_students: totalStudents,
        active_courses: activeCourses,
        total_courses: totalCourses,
        total_quizzes: totalQuizzes,
        total_earnings: totalEarnings,
        recent_attempts: recentQuizAttempts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
