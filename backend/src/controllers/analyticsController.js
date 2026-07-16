const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardStats = async (req, res) => {
  const { role } = req.query;
  if (role !== 'admin') {
    return res.status(403).json({ success: false, message: "Unauthorized access." });
  }

  try {
    const data = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // --- 1. WALLET / REVENUE STATS ---
    // This month approved
    const thisMonthApproved = await prisma.$queryRaw`
      SELECT SUM(amount) as total FROM wallet_transactions 
      WHERE status = 'approved' AND type = 'credit' AND MONTH(created_at) = ${currentMonth} AND YEAR(created_at) = ${currentYear}
    `;
    data.thisMonthApproved = Number(thisMonthApproved[0]?.total || 0);

    // This month pending
    const thisMonthPending = await prisma.$queryRaw`
      SELECT SUM(amount) as total FROM wallet_transactions 
      WHERE status = 'pending' AND type = 'credit' AND MONTH(created_at) = ${currentMonth} AND YEAR(created_at) = ${currentYear}
    `;
    data.thisMonthPending = Number(thisMonthPending[0]?.total || 0);

    // Monthly trend
    const monthlyTrend = await prisma.$queryRaw`
        SELECT 
            DATE_FORMAT(created_at, '%b %Y') as month_name,
            SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total,
            COUNT(*) as total_payments,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
        FROM wallet_transactions 
        WHERE type = 'credit'
        GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b %Y')
        ORDER BY YEAR(created_at) DESC, MONTH(created_at) DESC
        LIMIT 12
    `;
    data.monthlyTrend = monthlyTrend.map(row => {
      let obj = {};
      for(let k in row) obj[k] = typeof row[k] === 'bigint' ? Number(row[k]) : row[k];
      return obj;
    }).reverse();

    // Grade trend
    const gradeTrend = await prisma.$queryRaw`
        SELECT 
            COALESCE(u.education_category, 'Other') as grade_name,
            SUM(CASE WHEN t.status = 'approved' THEN t.amount ELSE 0 END) as total,
            COUNT(*) as total_payments,
            SUM(CASE WHEN t.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
            SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN t.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
        FROM wallet_transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.type = 'credit'
        GROUP BY u.education_category
        ORDER BY grade_name ASC
    `;
    data.gradeTrend = gradeTrend.map(row => {
      let obj = {};
      for(let k in row) obj[k] = typeof row[k] === 'bigint' ? Number(row[k]) : row[k];
      return obj;
    });

    // --- 2. USER STATS ---
    data.totalUsers = await prisma.users.count();

    const roleDist = await prisma.users.groupBy({
      by: ['role'],
      _count: true
    });
    data.userRoleDistribution = roleDist.map(r => ({ name: r.role, value: r._count }));

    const statusDist = await prisma.$queryRaw`SELECT COALESCE(status, 'active') as name, COUNT(*) as value FROM users GROUP BY status`;
    data.userStatusDistribution = statusDist.map(r => ({ name: r.name, value: Number(r.value) }));

    // --- 3. COURSE STATS ---
    try {
      data.totalCourses = await prisma.courses.count();
      data.totalModules = await prisma.course_modules.count();
      
      const courseCats = await prisma.$queryRaw`SELECT subject as name, COUNT(*) as value FROM courses GROUP BY subject LIMIT 5`;
      data.courseCategories = courseCats.map(r => ({ name: r.name, value: Number(r.value) }));
    } catch (e) {
      data.totalCourses = 0; data.totalModules = 0; data.courseCategories = [];
    }

    // --- 4. QUIZ STATS ---
    try {
      data.totalQuizzes = await prisma.quizzes.count();
      data.totalQuizAttempts = await prisma.quiz_attempts.count();
      
      const topQuizzes = await prisma.$queryRaw`
          SELECT q.title as name, COUNT(a.id) as value 
          FROM quizzes q
          LEFT JOIN quiz_attempts a ON q.id = a.quiz_id
          GROUP BY q.id
          ORDER BY value DESC
          LIMIT 5
      `;
      data.topQuizzes = topQuizzes.map(r => ({ name: r.name, value: Number(r.value) }));
    } catch (e) {
      data.totalQuizzes = 0; data.totalQuizAttempts = 0; data.topQuizzes = [];
    }

    // --- 5. E-BOOK STATS ---
    try {
      data.totalEbooks = await prisma.ebook_resources.count();
      
      const ebookSubjs = await prisma.$queryRaw`SELECT subject as name, COUNT(*) as value FROM ebook_resources GROUP BY subject LIMIT 7`;
      data.ebookSubjects = ebookSubjs.map(r => ({ name: r.name, value: Number(r.value) }));
    } catch (e) {
      data.totalEbooks = 0; data.ebookSubjects = [];
    }

    // --- 6. SYSTEM HISTORY STATS ---
    try {
      data.totalLogs = await prisma.system_logs.count();
      
      const systemActions = await prisma.$queryRaw`SELECT action as name, COUNT(*) as value FROM system_logs GROUP BY action ORDER BY value DESC LIMIT 7`;
      data.systemActions = systemActions.map(r => ({ name: r.name, value: Number(r.value) }));
    } catch (e) {
      data.totalLogs = 0; data.systemActions = [];
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
