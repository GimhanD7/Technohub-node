const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const { compressPdf } = require('../utils/pdfCompression');

// Helper to format ebook row
function formatEbook(ebook) {
  return {
    id: ebook.id,
    title: ebook.title,
    author: ebook.author,
    subject: ebook.subject,
    category: ebook.category,
    level: ebook.level,
    description: ebook.description,
    fileUrl: ebook.file_url,
    coverUrl: ebook.cover_url,
    fileType: ebook.file_type,
    fileSize: ebook.file_size,
    isFeatured: ebook.is_featured,
    isPublished: ebook.is_published,
    approvalStatus: ebook.approval_status,
    rejectionReason: ebook.rejection_reason,
    teacherEditable: ebook.teacher_editable,
    createdBy: ebook.created_by,
    createdAt: ebook.created_at,
    // only present when joined
    creatorName: ebook.users?.full_name || null,
    creatorRole: ebook.users?.role || null,
  };
}

exports.listEbooks = async (req, res) => {
  try {
    const { search, subject, page = 1, limit = 20, role, teacher_id } = req.query;

    let whereClause = {};

    // Public view: approved + published only
    if (!role || (role !== 'admin' && role !== 'teacher')) {
      whereClause.approval_status = 'approved';
      whereClause.is_published = true;
    }
    // Teacher: own resources only
    if (role === 'teacher' && teacher_id) {
      whereClause.created_by = parseInt(teacher_id);
    }
    // Admin: all resources (no extra where)

    if (search) whereClause.title = { contains: search };
    if (subject) whereClause.subject = subject;

    const total = await prisma.ebook_resources.count({ where: whereClause });
    const ebooks = await prisma.ebook_resources.findMany({
      where: whereClause,
      include: { users: { select: { full_name: true, role: true } } },
      orderBy: { created_at: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const totalPages = Math.ceil(total / parseInt(limit));
    const formattedEbooks = ebooks.map(formatEbook);

    res.json({ success: true, resources: formattedEbooks, total, totalPages, currentPage: parseInt(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createEbook = async (req, res) => {
  try {
    const {
      title, author, subject, category, level, description,
      fileUrl, file_url,
      coverUrl, cover_url,
      fileType, file_type,
      fileSize, file_size,
      isFeatured, is_featured,
      isPublished, is_published,
      userId, user_id,
      role
    } = req.body;

    const finalFileUrl = fileUrl || file_url;
    const finalCoverUrl = coverUrl !== undefined ? coverUrl : cover_url;
    const finalFileType = fileType || file_type;
    const finalFileSize = fileSize !== undefined ? fileSize : file_size;
    const finalIsFeatured = isFeatured !== undefined ? isFeatured : is_featured;
    const finalUserId = userId !== undefined ? userId : user_id;

    if (!title || !subject || !finalFileUrl) {
      return res.status(400).json({ success: false, message: 'Title, subject, and resource file are required.' });
    }

    // Teachers submit as pending, not published
    const isTeacher = role === 'teacher';
    const approvalStatus = isTeacher ? 'pending' : 'approved';
    const publishedState = isTeacher ? false : (isPublished !== undefined ? isPublished : is_published) !== false;

    await prisma.ebook_resources.create({
      data: {
        title,
        author: author || null,
        subject,
        category: category || 'E-Book',
        level: level || 'Advanced Level',
        description: description || '',
        file_url: finalFileUrl,
        cover_url: finalCoverUrl || null,
        file_type: finalFileType || 'application/pdf',
        file_size: finalFileSize ? parseInt(finalFileSize) : 0,
        is_featured: finalIsFeatured === true,
        is_published: publishedState,
        approval_status: approvalStatus,
        rejection_reason: null,
        teacher_editable: false,
        created_by: finalUserId ? parseInt(finalUserId) : null
      }
    });

    const msg = isTeacher
      ? 'E-book submitted for admin approval.'
      : 'E-book resource added successfully.';
    res.json({ success: true, message: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add resource: ' + error.message });
  }
};

exports.updateEbook = async (req, res) => {
  try {
    const {
      resourceId, id, title, author, subject, category, level, description,
      fileUrl, file_url,
      coverUrl, cover_url,
      fileType, file_type,
      fileSize, file_size,
      isFeatured, is_featured,
      isPublished, is_published,
      role, userId, user_id
    } = req.body;

    const targetId = resourceId || id;
    if (!targetId || !title || !subject) {
      return res.status(400).json({ success: false, message: 'ID, Title, and Subject are required.' });
    }

    const existing = await prisma.ebook_resources.findUnique({ where: { id: parseInt(targetId) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Resource not found.' });

    const callerId = parseInt(userId || user_id);

    // Teacher guard: must own resource and have teacher_editable=true
    if (role === 'teacher') {
      if (existing.created_by !== callerId) {
        return res.status(403).json({ success: false, message: 'You do not own this resource.' });
      }
      if (!existing.teacher_editable) {
        return res.status(403).json({ success: false, message: 'Edit permission has not been granted by admin.' });
      }
    }

    const finalIsFeatured = isFeatured !== undefined ? isFeatured : is_featured;
    const finalIsPublished = isPublished !== undefined ? isPublished : is_published;

    const updateData = {
      title,
      author: author || null,
      subject,
      category: category || 'E-Book',
      level: level || 'Advanced Level',
      description: description || '',
      is_featured: finalIsFeatured === true,
    };

    // Teacher edit resets approval back to pending
    if (role === 'teacher') {
      updateData.approval_status = 'pending';
      updateData.is_published = false;
      updateData.rejection_reason = null;
    } else {
      updateData.is_published = finalIsPublished !== false;
    }

    const finalFileUrl = fileUrl || file_url;
    if (finalFileUrl) {
      updateData.file_url = finalFileUrl;
      updateData.file_type = fileType || file_type;
      const finalFileSize = fileSize !== undefined ? fileSize : file_size;
      updateData.file_size = finalFileSize ? parseInt(finalFileSize) : 0;
    }

    const finalCoverUrl = coverUrl !== undefined ? coverUrl : cover_url;
    if (finalCoverUrl !== undefined) updateData.cover_url = finalCoverUrl;

    await prisma.ebook_resources.update({
      where: { id: parseInt(targetId) },
      data: updateData
    });

    res.json({ success: true, message: 'E-book resource updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update resource: ' + error.message });
  }
};

exports.deleteEbook = async (req, res) => {
  try {
    const { id, resourceId, role, userId, user_id } = req.body;
    const targetId = id || resourceId;
    if (!targetId) return res.status(400).json({ success: false, message: 'Resource ID is required.' });

    const existing = await prisma.ebook_resources.findUnique({ where: { id: parseInt(targetId) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Resource not found.' });

    // Teacher can only delete their own resources
    if (role === 'teacher') {
      const callerId = parseInt(userId || user_id);
      if (existing.created_by !== callerId) {
        return res.status(403).json({ success: false, message: 'You can only delete your own resources.' });
      }
    }

    await prisma.ebook_resources.delete({ where: { id: parseInt(targetId) } });
    res.json({ success: true, message: 'Resource deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete resource.' });
  }
};

// Admin: approve an ebook
exports.approveEbook = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Resource ID is required.' });

    await prisma.ebook_resources.update({
      where: { id: parseInt(id) },
      data: { approval_status: 'approved', is_published: true, rejection_reason: null }
    });

    res.json({ success: true, message: 'Resource approved and published.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: reject an ebook with a reason
exports.rejectEbook = async (req, res) => {
  try {
    const { id, reason } = req.body;
    if (!id || !reason) return res.status(400).json({ success: false, message: 'Resource ID and rejection reason are required.' });

    await prisma.ebook_resources.update({
      where: { id: parseInt(id) },
      data: { approval_status: 'rejected', is_published: false, rejection_reason: reason.trim() }
    });

    res.json({ success: true, message: 'Resource rejected.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: toggle whether the teacher who uploaded can edit
exports.toggleEditable = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: 'Resource ID is required.' });

    const existing = await prisma.ebook_resources.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Resource not found.' });

    await prisma.ebook_resources.update({
      where: { id: parseInt(id) },
      data: { teacher_editable: !existing.teacher_editable }
    });

    const state = !existing.teacher_editable ? 'enabled' : 'disabled';
    res.json({ success: true, message: `Teacher edit ${state}.`, teacherEditable: !existing.teacher_editable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadEbook = async (req, res) => {
  let uploadedPath;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No resource file provided.' });
    }

    const file = req.file;
    uploadedPath = file.path;
    const maxSize = 25 * 1024 * 1024; // 25MB

    if (file.size > maxSize) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: 'File size exceeds the 25MB limit.' });
    }

    const allowedTypes = [
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg', 'image/png', 'image/webp'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: 'Invalid file type.' });
    }

    const compression = file.mimetype === 'application/pdf'
      ? await compressPdf(file.path)
      : { compressed: false, originalSize: file.size, fileSize: file.size };

    res.json({
      success: true,
      message: compression.compressed ? 'PDF compressed and uploaded successfully.' : 'Resource uploaded successfully.',
      fileUrl: `/uploads/ebooks/${file.filename}`,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: compression.fileSize,
      originalFileSize: compression.originalSize,
      compressed: compression.compressed
    });
  } catch (error) {
    if (uploadedPath) await fs.promises.unlink(uploadedPath).catch(() => {});
    const status = error.code === 'INVALID_PDF' ? 400 : error.code === 'GHOSTSCRIPT_NOT_FOUND' ? 503 : 500;
    res.status(status).json({ success: false, message: 'Upload error: ' + error.message });
  }
};
