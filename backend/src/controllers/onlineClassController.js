const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { logActivity } = require('../utils/logger');

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await prisma.users.findMany({
      where: { role: 'teacher' },
      select: { id: true, full_name: true, subject: true },
      orderBy: { full_name: 'asc' }
    });
    res.json({ success: true, teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
        scheduled_at: cls.date_time
      };
      return res.json({ success: true, class: formatted });
    }

    // List all
    let whereClause = {};
    if (role === 'teacher' && userId) {
      whereClause.created_by = parseInt(userId);
    }

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
    // Accept both naming conventions from frontend
    const {
      teacher_id,
      userId,
      role,
      title,
      description,
      scheduled_at,
      date_time,
      duration,
      platform,
      meeting_link,
      fee
    } = req.body;

    // Resolve teacher ID: explicit teacher_id, or userId when role is teacher, or userId as fallback
    const resolvedTeacherId = teacher_id || (role === 'teacher' ? userId : teacher_id) || userId;
    // Resolve date: accept either field name
    const resolvedDateTime = date_time || scheduled_at;

    if (!resolvedTeacherId || !title || !resolvedDateTime || !meeting_link) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    await prisma.online_classes.create({
      data: {
        created_by: parseInt(resolvedTeacherId),
        title,
        description: description || '',
        date_time: new Date(resolvedDateTime),
        duration: duration ? parseInt(duration) : 60,
        platform: platform || 'Zoom',
        meeting_link,
        fee: fee ? parseFloat(fee) : 0
      }
    });

    await logActivity(resolvedTeacherId, 'Created Online Class', `Title: ${title}`, req);
    res.json({ success: true, message: "Online class scheduled successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to schedule class: " + error.message });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const {
      id,
      teacher_id,
      userId,
      title,
      description,
      scheduled_at,
      date_time,
      duration,
      platform,
      meeting_link,
      fee
    } = req.body;

    if (!id) return res.status(400).json({ success: false, message: "Class ID required." });

    const existingClass = await prisma.online_classes.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingClass) {
      return res.status(404).json({ success: false, message: "Class not found." });
    }

    const now = new Date();
    const cStart = new Date(existingClass.date_time);
    if (now >= cStart) {
      return res.status(400).json({ success: false, message: "Live or ended classes cannot be edited." });
    }

    // Resolve date: accept either field name
    const resolvedDateTime = date_time || scheduled_at;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (resolvedDateTime !== undefined) updateData.date_time = new Date(resolvedDateTime);
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (platform !== undefined) updateData.platform = platform;
    if (meeting_link !== undefined) updateData.meeting_link = meeting_link;
    if (fee !== undefined) updateData.fee = parseFloat(fee);

    await prisma.online_classes.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    const actorId = teacher_id || userId;
    if (actorId) {
      await logActivity(actorId, 'Updated Online Class', `Class ID: ${id}`, req);
    }
    res.json({ success: true, message: "Online class updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update class: " + error.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const { id, teacher_id, userId } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Class ID required." });

    const existingClass = await prisma.online_classes.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingClass) {
      return res.status(404).json({ success: false, message: "Class not found." });
    }

    const now = new Date();
    const cStart = new Date(existingClass.date_time);
    const durationMs = (existingClass.duration || 60) * 60000;
    const cEnd = new Date(cStart.getTime() + durationMs);

    if (now >= cStart && now <= cEnd) {
      return res.status(400).json({ success: false, message: "Live classes cannot be deleted while in progress." });
    }
    if (now > cEnd) {
      return res.status(400).json({ success: false, message: "Ended classes cannot be deleted." });
    }

    await prisma.online_classes.delete({ where: { id: parseInt(id) } });

    const actorId = teacher_id || userId;
    if (actorId) {
      await logActivity(actorId, 'Deleted Online Class', `Class ID: ${id}`, req);
    }
    res.json({ success: true, message: "Online class deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete class." });
  }
};
