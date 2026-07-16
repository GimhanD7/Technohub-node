const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logActivity } = require('../utils/logger');

exports.getClasses = async (req, res) => {
  try {
    const { id, userId, role } = req.query;

    if (id) {
      const cls = await prisma.online_classes.findUnique({
        where: { id: parseInt(id) },
        include: { users: { select: { full_name: true } } }
      });
      if (!cls) return res.status(404).json({ success: false, message: "Class not found." });

      const formatted = {
        ...cls,
        teacher_name: cls.users?.full_name || null,
        users: undefined,
        scheduled_at: cls.date_time // frontend expects scheduled_at
      };
      return res.json({ success: true, class: formatted });
    }

    // List all
    let whereClause = {};
    if (role === 'teacher' && userId) {
      whereClause.created_by = parseInt(userId);
    } 
    // Removed student target_grade logic since target_grade doesn't exist in schema.prisma for online_classes

    const classes = await prisma.online_classes.findMany({
      where: whereClause,
      include: { users: { select: { full_name: true } } },
      orderBy: { date_time: 'desc' }
    });

    let enrolledIds = new Set();
    if (role === 'student' && userId) {
      const enrollments = await prisma.online_class_enrollments.findMany({
        where: { student_id: parseInt(userId) },
        select: { online_class_id: true }
      });
      enrollments.forEach(e => enrolledIds.add(e.online_class_id));
    }

    const ongoing = [];
    const upcoming = [];
    const past = [];
    const now = new Date();

    for (const c of classes) {
      const cls = {
        ...c,
        teacher_name: c.users?.full_name || null,
        creator_name: c.users?.full_name || null,
        scheduled_at: c.date_time,
        fee: c.fee ? parseFloat(c.fee) : 0,
        is_enrolled: enrolledIds.has(c.id),
        users: undefined
      };

      const cStart = new Date(c.date_time);
      const durationMs = (c.duration || 60) * 60000;
      const cEnd = new Date(cStart.getTime() + durationMs);

      if (now >= cStart && now <= cEnd) {
        ongoing.push(cls);
      } else if (now < cStart) {
        upcoming.push(cls);
      } else {
        past.push(cls);
      }
    }

    res.json({ success: true, classes: { ongoing, upcoming, past } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createClass = async (req, res) => {
  try {
    const { teacher_id, title, description, scheduled_at, duration, platform, meeting_link, fee } = req.body;
    
    if (!teacher_id || !title || !scheduled_at || !meeting_link) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    await prisma.online_classes.create({
      data: {
        created_by: parseInt(teacher_id),
        title,
        description: description || '',
        date_time: new Date(scheduled_at),
        duration: duration ? parseInt(duration) : 60,
        platform: platform || 'Zoom',
        meeting_link,
        fee: fee ? parseFloat(fee) : 0
      }
    });

    await logActivity(teacher_id, 'Created Online Class', `Title: ${title}`, req);
    res.json({ success: true, message: "Online class scheduled successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to schedule class: " + error.message });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { id, teacher_id, title, description, scheduled_at, duration, platform, meeting_link, fee } = req.body;
    
    if (!id) return res.status(400).json({ success: false, message: "Class ID required." });

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (scheduled_at !== undefined) updateData.date_time = new Date(scheduled_at);
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (platform !== undefined) updateData.platform = platform;
    if (meeting_link !== undefined) updateData.meeting_link = meeting_link;
    if (fee !== undefined) updateData.fee = parseFloat(fee);

    await prisma.online_classes.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    if (teacher_id) {
      await logActivity(teacher_id, 'Updated Online Class', `Class ID: ${id}`, req);
    }
    res.json({ success: true, message: "Online class updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update class: " + error.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const { id, teacher_id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Class ID required." });

    await prisma.online_classes.delete({ where: { id: parseInt(id) } });
    if (teacher_id) {
      await logActivity(teacher_id, 'Deleted Online Class', `Class ID: ${id}`, req);
    }
    res.json({ success: true, message: "Online class deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete class." });
  }
};
