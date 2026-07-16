const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logActivity } = require('../utils/logger');
const fs = require('fs');

exports.getBalance = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ success: false, message: "User ID required." });

    const user = await prisma.users.findUnique({ where: { id: parseInt(user_id) }, select: { wallet_balance: true } });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    res.json({ success: true, balance: parseFloat(user.wallet_balance) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { user_id, type, status } = req.query;
    let whereClause = {};
    if (user_id) whereClause.user_id = parseInt(user_id);
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const history = await prisma.wallet_transactions.findMany({
      where: whereClause,
      include: { users: { select: { full_name: true, index_number: true, phone_number: true, wallet_balance: true } } },
      orderBy: { created_at: 'desc' }
    });

    const formatted = history.map(h => ({
      ...h,
      user_name: h.users?.full_name,
      user_index: h.users?.index_number,
      phone_number: h.users?.phone_number,
      wallet_balance: h.users?.wallet_balance ? parseFloat(h.users.wallet_balance.toString()) : 0,
      users: undefined
    }));

    res.json({ success: true, transactions: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const approvedAgg = await prisma.wallet_transactions.aggregate({
      where: { 
        type: 'credit', 
        status: 'approved',
        created_at: { gte: firstDay, lte: lastDay }
      },
      _sum: { amount: true }
    });

    const pendingAgg = await prisma.wallet_transactions.aggregate({
      where: { 
        type: 'credit', 
        status: 'pending',
        created_at: { gte: firstDay, lte: lastDay }
      },
      _sum: { amount: true }
    });

    const monthlyTrendRaw = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(created_at, '%M %Y') as month_name, 
        SUM(amount) as total 
      FROM wallet_transactions 
      WHERE type = 'credit' AND status = 'approved' 
      GROUP BY DATE_FORMAT(created_at, '%M %Y'), YEAR(created_at), MONTH(created_at)
      ORDER BY YEAR(created_at) DESC, MONTH(created_at) DESC 
      LIMIT 6
    `;

    // Prisma $queryRaw returns Decimal objects or BigInts sometimes, ensure they are numbers/strings
    const monthlyTrend = monthlyTrendRaw.map(m => ({
      month_name: m.month_name,
      total: m.total ? parseFloat(m.total.toString()) : 0
    }));

    res.json({
      success: true,
      stats: {
        thisMonthApproved: approvedAgg._sum.amount ? parseFloat(approvedAgg._sum.amount.toString()) : 0,
        thisMonthPending: pendingAgg._sum.amount ? parseFloat(pendingAgg._sum.amount.toString()) : 0,
        monthlyTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.recharge = async (req, res) => {
  try {
    const { user_id, amount, reference_number } = req.body;
    if (!user_id || !amount) return res.status(400).json({ success: false, message: "User ID and Amount required." });

    let slipUrl = null;
    if (req.file) {
      slipUrl = `/uploads/slips/${req.file.filename}`;
    }

    await prisma.wallet_transactions.create({
      data: {
        user_id: parseInt(user_id),
        amount: parseFloat(amount),
        type: 'credit',
        status: 'pending',
        description: `Bank Deposit - Ref: ${reference_number || 'N/A'}`,
        slip_url: slipUrl
      }
    });

    res.json({ success: true, message: "Recharge request submitted successfully. Pending admin approval." });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveOrReject = async (req, res) => {
  try {
    const { admin_id, transaction_id, action, description, amount } = req.body;
    if (!admin_id || !transaction_id || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: "Valid admin ID, transaction ID, and action required." });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Lock the transaction row FOR UPDATE (Note: Prisma currently simulates this or requires raw SQL for explicit locking. We will use a raw query to guarantee no race condition on the read/write).
      const rows = await tx.$queryRaw`SELECT * FROM wallet_transactions WHERE id = ${parseInt(transaction_id)} FOR UPDATE`;
      const transaction = rows[0];

      if (!transaction) throw new Error("Transaction not found.");
      if (transaction.status !== 'pending') throw new Error(`Transaction is already ${transaction.status}.`);

      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      const finalAmount = (action === 'approve' && amount !== undefined && parseFloat(amount) >= 0) ? parseFloat(amount) : parseFloat(transaction.amount);

      if (action === 'approve' && finalAmount <= 0) {
        throw new Error("Approval amount must be greater than zero.");
      }

      const finalDescription = (action === 'reject' && description) ? description : transaction.description;

      // 2. Update Transaction
      await tx.wallet_transactions.update({
        where: { id: parseInt(transaction_id) },
        data: { status: newStatus, amount: finalAmount, description: finalDescription }
      });

      // 3. Update Balance and Notify
      if (action === 'approve' && transaction.type === 'credit') {
        await tx.users.update({
          where: { id: transaction.user_id },
          data: { wallet_balance: { increment: finalAmount } }
        });

        await tx.notifications.create({
          data: {
            user_id: transaction.user_id,
            title: "Payment Approved",
            message: `Your wallet recharge request for LKR ${finalAmount.toFixed(2)} has been approved.`,
            type: "payment",
            created_by: parseInt(admin_id)
          }
        });
      } else if (action === 'reject') {
        await tx.notifications.create({
          data: {
            user_id: transaction.user_id,
            title: "Payment Rejected",
            message: `Your wallet recharge request was rejected. Reason: ${finalDescription}`,
            type: "payment",
            created_by: parseInt(admin_id)
          }
        });
      }
    });

    await logActivity(admin_id, `Wallet Recharge ${action.charAt(0).toUpperCase() + action.slice(1)}`, `Admin ${action} recharge for transaction ${transaction_id}.`, req);
    res.json({ success: true, message: `Transaction ${action === 'approve' ? 'approved' : 'rejected'} successfully.` });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.body;
    await prisma.wallet_transactions.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: "Transaction deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bulkAddCredits = async (req, res) => {
  try {
    const { admin_id, users, amount, description } = req.body; // users = array of user IDs
    if (!admin_id || !users || !amount) return res.status(400).json({ success: false, message: "Missing data." });

    const val = parseFloat(amount);
    
    await prisma.$transaction(async (tx) => {
      for (const uid of users) {
        await tx.wallet_transactions.create({
          data: {
            user_id: parseInt(uid),
            amount: val,
            type: 'credit',
            status: 'approved',
            description: description || 'Admin bulk credit'
          }
        });

        await tx.users.update({
          where: { id: parseInt(uid) },
          data: { wallet_balance: { increment: val } }
        });

        await tx.notifications.create({
          data: {
            user_id: parseInt(uid),
            title: "Wallet Credited",
            message: `Your wallet was credited with LKR ${val.toFixed(2)} by an administrator.`,
            type: "payment",
            created_by: parseInt(admin_id)
          }
        });
      }
    });

    await logActivity(admin_id, 'Bulk Added Credits', `Credited ${val} to ${users.length} users.`, req);
    res.json({ success: true, message: `Successfully credited ${users.length} users.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBalance = async (req, res) => {
  try {
    const { admin_id, target_user_id, new_balance } = req.body;
    if (!admin_id || !target_user_id || new_balance === undefined) {
      return res.status(400).json({ success: false, message: "Missing data." });
    }

    const val = parseFloat(new_balance);
    if (isNaN(val) || val < 0) {
       return res.status(400).json({ success: false, message: "Invalid balance." });
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({ where: { id: parseInt(target_user_id) } });
      if (!user) throw new Error("User not found.");
      
      const oldBalance = parseFloat(user.wallet_balance);
      const diff = val - oldBalance;
      
      if (diff !== 0) {
        await tx.wallet_transactions.create({
          data: {
            user_id: parseInt(target_user_id),
            amount: Math.abs(diff),
            type: diff > 0 ? 'credit' : 'debit',
            status: 'approved',
            description: `Admin balance adjustment (Old: ${oldBalance}, New: ${val})`
          }
        });
        
        await tx.users.update({
          where: { id: parseInt(target_user_id) },
          data: { wallet_balance: val }
        });
        
        await tx.notifications.create({
          data: {
            user_id: parseInt(target_user_id),
            title: "Wallet Balance Updated",
            message: `Your wallet balance was updated to LKR ${val.toFixed(2)} by an administrator.`,
            type: "payment",
            created_by: parseInt(admin_id)
          }
        });
      }
    });

    await logActivity(admin_id, 'Updated Wallet Balance', `Set balance to ${val} for user ${target_user_id}.`, req);
    res.json({ success: true, message: "Wallet balance updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
