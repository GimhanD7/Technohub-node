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
