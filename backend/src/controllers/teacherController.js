const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getEarnings = async (req, res) => {
  try {
    const { teacher_id } = req.query;
    if (!teacher_id) return res.status(400).json({ success: false, message: "Teacher ID is required." });
    const tid = parseInt(teacher_id);

    // Get all earnings from teacher_earnings_history (includes both quizzes and courses)
    const allEarningsHistory = await prisma.teacher_earnings_history.findMany({
      where: { teacher_id: tid },
      orderBy: { created_at: 'desc' }
    });

    // Calculate gross and net totals
    let total_gross_earnings = 0;
    let total_net_earnings = 0;
    let exam_gross_earnings = 0;
    let exam_net_earnings = 0;
    let course_gross_earnings = 0;
    let course_net_earnings = 0;

    for (const earning of allEarningsHistory) {
      const amount = parseFloat(earning.amount || 0);
      const netAmount = parseFloat(earning.net_earning || 0);
      
      total_gross_earnings += amount;
      total_net_earnings += netAmount;

      if (earning.description && earning.description.startsWith('Earning from quiz:')) {
        exam_gross_earnings += amount;
        exam_net_earnings += netAmount;
      } else {
        course_gross_earnings += amount;
        course_net_earnings += netAmount;
      }
    }

    // --- Exam (quiz) earnings breakdown ---
    // Get all quizzes with payment info for breakdown
    const quizzes = await prisma.quizzes.findMany({
      where: { created_by: tid },
      include: {
        quiz_payments: { select: { id: true } }
      }
    });

    const exam_breakdown = quizzes
      .filter(q => q.quiz_payments.length > 0)
      .map(q => {
        // Get net earnings for this quiz from history
        const quizHistory = allEarningsHistory.filter(e => 
          e.description && e.description.includes(`Earning from quiz: ${q.title}`)
        );
        const total_net = quizHistory.reduce((sum, h) => sum + parseFloat(h.net_earning || 0), 0);
        const total_gross = quizHistory.reduce((sum, h) => sum + parseFloat(h.amount || 0), 0);
        
        return {
          id: q.id,
          title: q.title,
          fee: parseFloat(q.fee || 0),
          unlocks: q.quiz_payments.length,
          total_gross: total_gross,
          total_net: total_net
        };
      });

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
      .map(c => {
        // Get net earnings for this course from history
        const courseHistory = allEarningsHistory.filter(e => 
          e.description && e.description.includes(c.title)
        );
        const total_net = courseHistory.reduce((sum, h) => sum + parseFloat(h.net_earning || 0), 0);
        const total_gross = courseHistory.reduce((sum, h) => sum + parseFloat(h.amount || 0), 0);
        
        return {
          id: c.id,
          title: c.title,
          enrollments: c.course_enrollments.length,
          total_gross: total_gross,
          total_net: total_net
        };
      });

    res.json({
      success: true,
      summary: {
        total_gross_earnings: parseFloat(total_gross_earnings.toFixed(2)),
        total_net_earnings: parseFloat(total_net_earnings.toFixed(2)),
        course_gross_earnings: parseFloat(course_gross_earnings.toFixed(2)),
        course_net_earnings: parseFloat(course_net_earnings.toFixed(2)),
        exam_gross_earnings: parseFloat(exam_gross_earnings.toFixed(2)),
        exam_net_earnings: parseFloat(exam_net_earnings.toFixed(2))
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
