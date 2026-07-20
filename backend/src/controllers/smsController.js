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

exports.sendSingleSms = async (req, res) => {
  try {
    const { userId, message } = req.body;
    const parsedUserId = parseInt(userId, 10);

    if (!parsedUserId || !message?.trim()) {
      return res.status(400).json({ success: false, message: "User and message are required." });
    }

    const user = await prisma.users.findFirst({
      where: {
        id: parsedUserId,
        status: { not: 'deleted' }
      },
      select: {
        id: true,
        full_name: true,
        phone_number: true,
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Selected user was not found." });
    }

    if (!user.phone_number) {
      return res.status(400).json({ success: false, message: "Selected user does not have a phone number." });
    }

    const { sendSMS } = require('../utils/smsService');
    const sent = await sendSMS(user, message.trim());

    if (!sent) {
      return res.status(500).json({ success: false, message: "SMS failed. Please check the delivery log for details." });
    }

    res.json({ success: true, message: `SMS sent to ${user.full_name}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSmsLog = async (req, res) => {
  try {
    const { id } = req.body;
    const logId = parseInt(id, 10);

    if (!logId) {
      return res.status(400).json({ success: false, message: "SMS log ID is required." });
    }

    await prisma.sms_logs.delete({ where: { id: logId } });

    res.json({ success: true, message: "SMS log deleted successfully." });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: "SMS log was not found." });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSmsLogs = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const logIds = [...new Set(ids.map((id) => parseInt(id, 10)).filter(Boolean))];

    if (logIds.length === 0) {
      return res.status(400).json({ success: false, message: "Select at least one SMS log to delete." });
    }

    const result = await prisma.sms_logs.deleteMany({
      where: { id: { in: logIds } }
    });

    res.json({
      success: true,
      message: `${result.count} SMS log${result.count === 1 ? "" : "s"} deleted successfully.`,
      deletedCount: result.count
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
