const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logActivity } = require('../utils/logger');

exports.addNotification = async (req, res) => {
  try {
    const { user_id, target_role, title, message, type, link, created_by } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required." });
    }

    await prisma.notifications.create({
      data: {
        user_id: (!user_id || user_id === 'all' || user_id === 'all_students' || user_id === 'all_teachers') ? null : parseInt(user_id),
        target_role: target_role || (user_id === 'all_students' ? 'student' : (user_id === 'all_teachers' ? 'teacher' : 'all')),
        title,
        message,
        type: type || 'info',
        link: link || null,
        created_by: created_by ? parseInt(created_by) : null
      }
    });

    if (created_by) {
      await logActivity(created_by, 'Sent Notification', `Title: ${title}`, req);
    }

    res.json({ success: true, message: "Notification sent successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send notification: " + error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ success: false, message: "User ID required" });

    const userObj = await prisma.users.findUnique({
      where: { id: parseInt(user_id) },
      select: { role: true, last_notification_read_at: true }
    });

    if (!userObj) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const notifications = await prisma.notifications.findMany({
      where: {
        OR: [
          { user_id: parseInt(user_id) },
          { 
            user_id: null,
            OR: [
              { target_role: 'all' },
              { target_role: null },
              { target_role: userObj.role }
            ]
          }
        ]
      },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    const lastRead = userObj?.last_notification_read_at ? new Date(userObj.last_notification_read_at) : new Date(0);

    const formatted = notifications.map(n => {
      let isRead = false;
      if (n.user_id) {
        isRead = Boolean(n.is_read);
      } else {
        isRead = new Date(n.created_at) <= lastRead;
      }

      return {
        ...n,
        is_read: isRead ? 1 : 0,
        is_unread: !isRead
      };
    });

    const unreadCount = formatted.reduce((count, notification) => (
      count + (notification.is_unread ? 1 : 0)
    ), 0);

    res.json({ success: true, notifications: formatted, unread_count: unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { user_id, notification_id } = req.body;
    if (!user_id) return res.status(400).json({ success: false, message: "Missing user_id" });

    if (notification_id === 'all') {
      await prisma.notifications.updateMany({
        where: { user_id: parseInt(user_id), is_read: false },
        data: { is_read: true }
      });
      await prisma.users.update({
        where: { id: parseInt(user_id) },
        data: { last_notification_read_at: new Date() }
      });
    } else if (notification_id) {
      const notif = await prisma.notifications.findUnique({ where: { id: parseInt(notification_id) } });
      if (notif && notif.user_id === parseInt(user_id)) {
        await prisma.notifications.update({
          where: { id: parseInt(notification_id) },
          data: { is_read: true }
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "Notification ID is required" });

    await prisma.notifications.delete({
      where: { id: parseInt(id) }
    });

    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete notification: " + error.message });
  }
};

exports.bulkDeleteNotifications = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Select at least one notification to delete." });
    }

    if (ids.length > 200) {
      return res.status(400).json({ success: false, message: "A maximum of 200 notifications can be deleted at once." });
    }

    const notificationIds = [...new Set(ids.map(Number))].filter(id => Number.isInteger(id) && id > 0);
    if (notificationIds.length === 0 || ids.some(id => !Number.isInteger(Number(id)) || Number(id) <= 0)) {
      return res.status(400).json({ success: false, message: "One or more notification IDs are invalid." });
    }

    const result = await prisma.notifications.deleteMany({
      where: { id: { in: notificationIds } }
    });

    res.json({
      success: true,
      deletedCount: result.count,
      message: `${result.count} notification${result.count === 1 ? '' : 's'} deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete notifications: " + error.message });
  }
};
