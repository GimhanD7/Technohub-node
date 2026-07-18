const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getEarnings = async (req, res) => {
  try {
    const { teacher_id } = req.query;
    if (!teacher_id) return res.status(400).json({ success: false, message: "Teacher ID is required." });
    const tid = parseInt(teacher_id);

    // --- Exam (quiz) earnings breakdown ---
    // Get all quiz payments for quizzes created by this teacher
    const examPayments = await prisma.quiz_payments.findMany({
      where: { quizzes: { created_by: tid } },
      include: { quizzes: { select: { id: true, title: true, fee: true } } }
    });

    // Group by quiz
    const examMap = {};
    for (const p of examPayments) {
      const qid = p.quiz_id;
      if (!examMap[qid]) {
        examMap[qid] = {
          id: p.quizzes.id,
          title: p.quizzes.title,
          fee: parseFloat(p.quizzes.fee || 0),
          unlocks: 0,
          total_earned: 0
        };
      }
      examMap[qid].unlocks += 1;
      examMap[qid].total_earned += parseFloat(p.amount);
    }
    const exam_breakdown = Object.values(examMap);
    const exam_earnings = exam_breakdown.reduce((sum, e) => sum + e.total_earned, 0);

    // --- Course earnings breakdown ---
    // Get all courses created by this teacher with enrollment counts
    const courses = await prisma.courses.findMany({
      where: { teacher_id: tid },
      include: {
        course_enrollments: { select: { id: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const course_breakdown = courses
      .filter(c => c.course_enrollments.length > 0)
      .map(c => ({
        id: c.id,
        title: c.title,
        price: 0, // Courses do not have a price field in the current schema
        enrollments: c.course_enrollments.length,
        total_earned: 0 // Revenue tracked via teacher_earnings_history for non-quiz items
      }));

    // Course earnings = sum of teacher_earnings_history entries NOT related to quizzes
    const courseEarningsAgg = await prisma.teacher_earnings_history.aggregate({
      where: {
        teacher_id: tid,
        NOT: { description: { startsWith: 'Earning from quiz:' } }
      },
      _sum: { net_earning: true }
    });
    const course_earnings = parseFloat(courseEarningsAgg._sum.net_earning || 0);

    const total_earnings = exam_earnings + course_earnings;

    res.json({
      success: true,
      summary: {
        total_earnings,
        course_earnings,
        exam_earnings
      },
      course_breakdown,
      exam_breakdown
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
