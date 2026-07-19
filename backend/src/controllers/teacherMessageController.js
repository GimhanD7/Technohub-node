const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Teacher: send a new message to admin
exports.sendMessage = async (req, res) => {
  try {
    const { teacher_id, subject, message, category } = req.body;
    if (!teacher_id || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Teacher ID, Subject, and Message are required.' });
    }

    const msg = await prisma.teacher_messages.create({
      data: {
        teacher_id: parseInt(teacher_id),
        subject: subject.trim(),
        message: message.trim(),
        category: category || 'general',
        status: 'unread'
      }
    });

    res.json({ success: true, message: 'Message sent successfully.', id: msg.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Teacher: list their own messages
exports.getMyMessages = async (req, res) => {
  try {
    const { teacher_id } = req.query;
    if (!teacher_id) return res.status(400).json({ success: false, message: 'Teacher ID is required.' });

    const messages = await prisma.teacher_messages.findMany({
      where: { teacher_id: parseInt(teacher_id) },
      orderBy: { created_at: 'desc' }
    });

    const formatted = messages.map(m => ({
      id: m.id,
      subject: m.subject,
      message: m.message,
      category: m.category,
      status: m.status,
      adminReply: m.admin_reply,
      repliedAt: m.replied_at,
      createdAt: m.created_at
    }));

    res.json({ success: true, messages: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: list all messages from all teachers (unread first, then newest)
exports.listAllMessages = async (req, res) => {
  try {
    const messages = await prisma.teacher_messages.findMany({
      include: {
        users: {
          select: { id: true, full_name: true, email: true, phone_number: true, profile_picture: true }
        }
      },
      orderBy: [
        { status: 'asc' }, // unread < replied < resolved alphabetically
        { created_at: 'desc' }
      ]
    });

    const formatted = messages.map(m => ({
      id: m.id,
      teacherId: m.teacher_id,
      teacherName: m.users?.full_name || 'Unknown',
      teacherEmail: m.users?.email || '',
      teacherPhone: m.users?.phone_number || '',
      teacherAvatar: m.users?.profile_picture || null,
      subject: m.subject,
      message: m.message,
      category: m.category,
      status: m.status,
      adminReply: m.admin_reply,
      repliedAt: m.replied_at,
      createdAt: m.created_at
    }));

    res.json({ success: true, messages: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: reply to a message
exports.replyToMessage = async (req, res) => {
  try {
    const { id, reply } = req.body;
    if (!id || !reply) return res.status(400).json({ success: false, message: 'Message ID and reply text are required.' });

    await prisma.teacher_messages.update({
      where: { id: parseInt(id) },
      data: {
        admin_reply: reply.trim(),
        status: 'replied',
        replied_at: new Date()
      }
    });

    res.json({ success: true, message: 'Reply sent.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: mark a message as resolved
exports.markResolved = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Message ID is required.' });

    await prisma.teacher_messages.update({
      where: { id: parseInt(id) },
      data: { status: 'resolved' }
    });

    res.json({ success: true, message: 'Message marked as resolved.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Teacher or Admin: delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { id, teacher_id, role } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Message ID is required.' });

    const msg = await prisma.teacher_messages.findUnique({ where: { id: parseInt(id) } });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });

    // Teachers can only delete their own messages
    if (role !== 'admin' && msg.teacher_id !== parseInt(teacher_id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message.' });
    }

    await prisma.teacher_messages.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Message deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
