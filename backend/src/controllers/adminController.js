const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const {
  getEmailError,
  getPhoneError,
  normalizeEmail,
  normalizePhoneNumber,
} = require('../utils/validation');

// --- SECURITY SETTINGS ---
exports.getSecuritySettings = async (req, res) => {
  const defaultSettings = {
    developer_options_restriction: false,
    right_click_restriction: false,
    anti_recording_watermark: false,
    developer_master_mode: false
  };
  try {
    const settings = await prisma.security_settings.findUnique({ where: { id: 1 } });
    res.json({ success: true, settings: settings || defaultSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database error." });
  }
};

exports.updateSecuritySettings = async (req, res) => {
  try {
    const { pin, settings } = req.body;
    if (pin !== '7845') return res.status(403).json({ success: false, message: "Invalid security PIN." });
    if (!settings) return res.status(400).json({ success: false, message: "No settings provided." });

    const updatedSettings = await prisma.security_settings.upsert({
      where: { id: 1 },
      update: settings,
      create: { id: 1, ...settings }
    });
    res.json({ success: true, message: "Security settings updated successfully.", settings: updatedSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database error." });
  }
};

// --- SYSTEM SETTINGS ---
exports.getSystemSettings = async (req, res) => {
  try {
    let settings = await prisma.system_settings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = {
        site_name: 'Techno-Hub', primary_color: '#1a3cb6', secondary_color: '#efc300',
        contact_email: '', contact_phone: '', facebook_url: '', youtube_url: '',
        instagram_url: '', linkedin_url: '', twitter_url: '', address: '',
        birthday_sms_enabled: true, birthday_sms_time: '08:00',
        birthday_sms_message: 'Happy Birthday {name}! Wishing you a fantastic day from TechnoHub!'
      };
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const data = req.body;
    const allowedFields = ['site_name', 'primary_color', 'secondary_color', 'contact_email', 'contact_phone', 'address', 'facebook_url', 'youtube_url', 'instagram_url', 'linkedin_url', 'twitter_url', 'birthday_sms_enabled', 'birthday_sms_time', 'birthday_sms_message'];
    
    let updateData = {};
    for (let field of allowedFields) {
      if (data[field] !== undefined) updateData[field] = data[field];
    }

    if (updateData.contact_email !== undefined) {
      const normalizedEmail = normalizeEmail(updateData.contact_email);
      const emailError = getEmailError(normalizedEmail);
      if (emailError) return res.status(400).json({ success: false, message: emailError });
      updateData.contact_email = normalizedEmail;
    }

    if (updateData.contact_phone !== undefined) {
      const normalizedPhone = normalizePhoneNumber(updateData.contact_phone);
      if (normalizedPhone) {
        const phoneError = getPhoneError(normalizedPhone);
        if (phoneError) return res.status(400).json({ success: false, message: phoneError });
      }
      updateData.contact_phone = normalizedPhone;
    }

    if (updateData.birthday_sms_enabled !== undefined && typeof updateData.birthday_sms_enabled !== 'boolean') {
      return res.status(400).json({ success: false, message: "Birthday SMS setting must be enabled or disabled." });
    }

    if (updateData.birthday_sms_time !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(updateData.birthday_sms_time)) {
      return res.status(400).json({ success: false, message: "Please enter a valid birthday SMS time." });
    }

    if (updateData.birthday_sms_message !== undefined) {
      updateData.birthday_sms_message = String(updateData.birthday_sms_message).trim();
      if (!updateData.birthday_sms_message) {
        return res.status(400).json({ success: false, message: "Birthday SMS message cannot be empty." });
      }
      if (updateData.birthday_sms_message.length > 500) {
        return res.status(400).json({ success: false, message: "Birthday SMS message cannot exceed 500 characters." });
      }
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "No valid data provided." });
    }

    const updatedSettings = await prisma.system_settings.upsert({
      where: { id: 1 },
      update: updateData,
      create: { id: 1, ...updateData }
    });
    res.json({ success: true, message: "Settings updated.", settings: updatedSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- USERS LIST ---
exports.getUsersList = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      select: { id: true, full_name: true, role: true },
      orderBy: { full_name: 'asc' }
    });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- LOGS ---
exports.getLogs = async (req, res) => {
  try {
    const { user_id } = req.query;
    let whereClause = {};
    if (user_id && user_id !== 'all') whereClause.user_id = parseInt(user_id);

    const logs = await prisma.system_logs.findMany({
      where: whereClause,
      include: {
        users: { select: { full_name: true, role: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 500
    });
    
    // Map to match PHP output structure
    const formattedLogs = logs.map(l => ({
      ...l,
      user_name: l.users?.full_name || null,
      user_role: l.users?.role || null,
      users: undefined
    }));

    res.json({ success: true, logs: formattedLogs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- NOTIFICATIONS ---
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notifications.findMany({
      include: {
        users_notifications_user_idTousers: { select: { full_name: true } },
        users_notifications_created_byTousers: { select: { full_name: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const formatted = notifications.map(n => ({
      ...n,
      target_user_name: n.users_notifications_user_idTousers?.full_name || null,
      creator_name: n.users_notifications_created_byTousers?.full_name || null,
      users_notifications_user_idTousers: undefined,
      users_notifications_created_byTousers: undefined
    }));

    res.json({ success: true, notifications: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- TEACHER EARNINGS ---
exports.getTeacherEarnings = async (req, res) => {
  try {
    // We can use a raw query or Prisma fluent API. Since it involves aggregations across multiple tables, we'll use a raw query for simplicity and parity.
    const teachers = await prisma.$queryRaw`
      SELECT 
          u.id, 
          u.full_name, 
          u.subject,
          u.profile_picture,
          IFNULL(tc.commission_type, 'percentage') as commission_type,
          IFNULL(tc.commission_value, 80.00) as commission_value,
          (SELECT IFNULL(SUM(net_earning), 0) FROM teacher_earnings_history WHERE teacher_id = u.id) as total_earnings
      FROM users u
      LEFT JOIN teacher_commissions tc ON u.id = tc.teacher_id
      WHERE u.role = 'teacher' AND (u.status != 'deleted' OR u.status IS NULL)
      ORDER BY u.full_name ASC
    `;
    
    // $queryRaw returns BigInt for SUMs which causes JSON serialization errors. Convert BigInt to Number.
    const serializedTeachers = teachers.map(t => {
      let obj = {};
      for (let key in t) {
        obj[key] = typeof t[key] === 'bigint' ? Number(t[key]) : t[key];
      }
      return obj;
    });

    res.json({ success: true, teachers: serializedTeachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTeacherEarningsHistory = async (req, res) => {
  try {
    const { teacher_id } = req.query;
    if (!teacher_id) return res.status(400).json({ success: false, message: "Missing teacher_id" });

    const history = await prisma.teacher_earnings_history.findMany({
      where: { teacher_id: parseInt(teacher_id) },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTeacherCommission = async (req, res) => {
  try {
    const { teacher_id, commission_type, commission_value } = req.body;
    if (!teacher_id || !commission_type || commission_value === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    await prisma.teacher_commissions.upsert({
      where: { teacher_id: parseInt(teacher_id) },
      update: { commission_type, commission_value: parseFloat(commission_value) },
      create: { teacher_id: parseInt(teacher_id), commission_type, commission_value: parseFloat(commission_value) }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- USER HISTORY SUMMARY ---
exports.getUserHistorySummary = async (req, res) => {
  try {
    const users = await prisma.$queryRaw`
      SELECT 
          u.id, 
          u.full_name, 
          u.role,
          u.index_number,
          (SELECT COUNT(*) FROM system_logs WHERE user_id = u.id AND action = 'Logged In') as login_count,
          (SELECT ip_address FROM system_logs WHERE user_id = u.id AND action = 'Logged In' ORDER BY created_at DESC LIMIT 1) as last_ip,
          (SELECT created_at FROM system_logs WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_active
      FROM users u
      ORDER BY last_active DESC, u.full_name ASC
    `;

    const serializedUsers = users.map(u => {
      let obj = {};
      for (let key in u) {
        obj[key] = typeof u[key] === 'bigint' ? Number(u[key]) : u[key];
      }
      return obj;
    });

    res.json({ success: true, users: serializedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- UPLOADS ---
exports.getUploads = async (req, res) => {
  try {
    const uploadsDir = path.resolve(__dirname, '../../../../uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ success: true, files: [], totalSize: 0, totalFiles: 0 });
    }

    const getAllFiles = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          getAllFiles(filePath, fileList);
        } else {
          fileList.push(filePath);
        }
      }
      return fileList;
    };

    const allFiles = getAllFiles(uploadsDir);
    let totalSize = 0;
    const filesData = allFiles.map(filePath => {
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      const relativePath = filePath.replace(uploadsDir + path.sep, '').replace(/\\/g, '/');
      const urlPath = '/uploads/' + relativePath;
      const category = relativePath.split('/')[0] || 'root';

      return {
        name: path.basename(filePath),
        path: relativePath,
        url: urlPath,
        category,
        size: stats.size,
        modifiedAt: Math.floor(stats.mtimeMs / 1000)
      };
    });

    filesData.sort((a, b) => b.modifiedAt - a.modifiedAt);

    res.json({ success: true, files: filesData, totalSize, totalFiles: filesData.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUpload = async (req, res) => {
  try {
    const { path: relativeFilePath } = req.body;
    if (!relativeFilePath) return res.status(400).json({ success: false, message: "File path not provided." });

    const uploadsDir = path.resolve(__dirname, '../../../../uploads');
    const targetFile = path.resolve(uploadsDir, relativeFilePath);

    if (targetFile.startsWith(uploadsDir) && fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
      fs.unlinkSync(targetFile);
      res.json({ success: true, message: "File deleted successfully." });
    } else {
      res.status(404).json({ success: false, message: "File not found or invalid path." });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDeletedUsers = async (req, res) => {
  try {
    const deletedList = await prisma.deleted_users.findMany({
      orderBy: { deleted_at: 'desc' }
    });
    
    // Resolve deleting admin names
    const admins = await prisma.users.findMany({
      where: { role: 'admin' },
      select: { id: true, full_name: true }
    });
    const adminMap = new Map(admins.map(a => [a.id, a.full_name]));

    const formattedList = deletedList.map(item => ({
      ...item,
      deleted_by_name: adminMap.get(item.deleted_by) || "Admin"
    }));

    res.json({ success: true, deletedUsers: formattedList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTeacherMonthlyReport = async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month) return res.status(400).json({ success: false, message: "Month query parameter YYYY-MM is required." });

    const regex = /^\d{4}-\d{2}$/;
    if (!regex.test(month)) {
      return res.status(400).json({ success: false, message: "Invalid month format. Use YYYY-MM." });
    }

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr);
    const monthIndex = parseInt(monthStr) - 1;

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    const teachers = await prisma.users.findMany({
      where: { role: 'teacher', status: { not: 'deleted' } },
      select: { id: true, full_name: true, subject: true }
    });

    const report = [];
    let grandGross = 0;
    let grandNet = 0;
    let grandPaid = 0;
    let grandUnpaid = 0;

    for (const teacher of teachers) {
      // Month Positive Earnings
      const monthEarnings = await prisma.teacher_earnings_history.aggregate({
        where: {
          teacher_id: teacher.id,
          created_at: { gte: startDate, lte: endDate },
          net_earning: { gt: 0 }
        },
        _sum: {
          amount: true,
          net_earning: true
        }
      });

      // Month Payouts
      const monthPayouts = await prisma.teacher_earnings_history.aggregate({
        where: {
          teacher_id: teacher.id,
          description: { startsWith: `Payout: ${month}` },
          net_earning: { lt: 0 }
        },
        _sum: {
          net_earning: true
        }
      });

      // Accumulative Unpaid Balance (all time sum of net_earnings)
      const accumulative = await prisma.teacher_earnings_history.aggregate({
        where: {
          teacher_id: teacher.id
        },
        _sum: {
          net_earning: true
        }
      });

      const gross = parseFloat(monthEarnings._sum.amount || 0);
      const net = parseFloat(monthEarnings._sum.net_earning || 0);
      const paid = Math.abs(parseFloat(monthPayouts._sum.net_earning || 0));
      const unpaid = net - paid;
      const allTimeBalance = parseFloat(accumulative._sum.net_earning || 0);

      grandGross += gross;
      grandNet += net;
      grandPaid += paid;
      grandUnpaid += allTimeBalance;

      report.push({
        id: teacher.id,
        full_name: teacher.full_name,
        subject: teacher.subject,
        gross_earnings: gross,
        net_earnings: net,
        paid_amount: paid,
        month_balance: unpaid,
        all_time_balance: allTimeBalance
      });
    }

    res.json({
      success: true,
      month,
      report,
      totals: {
        totalGross: grandGross,
        totalNet: grandNet,
        totalPaid: grandPaid,
        totalBalance: grandUnpaid
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.recordTeacherPayout = async (req, res) => {
  try {
    const { teacher_id, month, amount, remarks } = req.body;
    if (!teacher_id || !month || !amount) {
      return res.status(400).json({ success: false, message: "Teacher ID, Month, and Payout Amount are required." });
    }

    const tId = parseInt(teacher_id);
    const payoutAmount = parseFloat(amount);

    if (payoutAmount <= 0) {
      return res.status(400).json({ success: false, message: "Payout amount must be greater than zero." });
    }

    const teacher = await prisma.users.findUnique({
      where: { id: tId }
    });
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: "Teacher not found." });
    }

    // Record payout inside teacher_earnings_history
    await prisma.teacher_earnings_history.create({
      data: {
        teacher_id: tId,
        amount: 0,
        commission_type: 'fixed',
        commission_value: 0,
        net_earning: -payoutAmount, // Negative represents a payout
        description: `Payout: ${month}${remarks ? ' - ' + remarks : ' - Salary Allocation'}`
      }
    });

    res.json({ success: true, message: "Teacher payout recorded successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTeacherEarningsTrends = async (req, res) => {
  try {
    const { teacher_id } = req.query;
    
    let whereClause = {
      net_earning: { gt: 0 } // Filter out payouts
    };
    if (teacher_id) {
      whereClause.teacher_id = parseInt(teacher_id);
    } else {
      // Exclude deleted teachers
      whereClause.users = { status: { not: 'deleted' } };
    }

    // Get earnings over the last 6 months grouped by month
    const history = await prisma.teacher_earnings_history.findMany({
      where: whereClause,
      select: {
        amount: true,
        net_earning: true,
        created_at: true
      },
      orderBy: { created_at: 'asc' }
    });

    const monthlyMap = {};
    // Seed the map with last 6 months to ensure we don't have empty months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      monthlyMap[key] = { month: label, gross: 0, net: 0 };
    }

    // Populate actuals
    for (const record of history) {
      const d = new Date(record.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].gross += parseFloat(record.amount || 0);
        monthlyMap[key].net += parseFloat(record.net_earning || 0);
      }
    }

    const trends = Object.keys(monthlyMap).map(key => ({
      monthKey: key,
      month: monthlyMap[key].month,
      gross: parseFloat(monthlyMap[key].gross.toFixed(2)),
      net: parseFloat(monthlyMap[key].net.toFixed(2))
    }));

    res.json({ success: true, trends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
