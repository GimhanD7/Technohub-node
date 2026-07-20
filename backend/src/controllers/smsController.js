const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getSmsLogs = async (req, res) => {
  try {
    const logs = await prisma.sms_logs.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: {
            full_name: true,
            email: true,
            index_number: true
          }
        }
      }
    });
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendBulkSms = async (req, res) => {
  try {
    const { targetAudience, message } = req.body;
    
    if (!targetAudience || !message) {
      return res.status(400).json({ success: false, message: "Target audience and message are required." });
    }

    let whereClause = {};
    if (targetAudience === 'students') {
      whereClause.role = 'student';
    } else if (targetAudience === 'teachers') {
      whereClause.role = 'teacher';
    } else if (targetAudience === 'admins') {
      whereClause.role = 'admin';
    }

    const users = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        full_name: true,
        phone_number: true,
      }
    });

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found for the selected audience." });
    }

    const { sendSMS } = require('../utils/smsService');
    
    // Send asynchronously in the background
    (async () => {
      for (const user of users) {
        if (user.phone_number) {
          await sendSMS(user, message);
        }
      }
    })();

    res.json({ success: true, message: `Bulk SMS initiated for ${users.length} user(s).` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
