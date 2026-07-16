const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

exports.listEbooks = async (req, res) => {
  try {
    const { search, subject, page = 1, limit = 20 } = req.query;
    
    let whereClause = {};
    if (search) {
      whereClause.title = { contains: search };
    }
    if (subject) {
      whereClause.subject = subject;
    }

    const total = await prisma.ebook_resources.count({ where: whereClause });
    const ebooks = await prisma.ebook_resources.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({ success: true, resources: ebooks, total, totalPages, currentPage: parseInt(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createEbook = async (req, res) => {
  try {
    const { title, author, subject, category, level, description, fileUrl, coverUrl, fileType, fileSize, isFeatured, isPublished, userId } = req.body;
    if (!title || !subject || !fileUrl) {
      return res.status(400).json({ success: false, message: "Title, subject, and resource file are required." });
    }

    await prisma.ebook_resources.create({
      data: {
        title,
        author: author || null,
        subject,
        category: category || "E-Book",
        level: level || "Advanced Level",
        description: description || '',
        file_url: fileUrl,
        cover_url: coverUrl || null,
        file_type: fileType || 'application/pdf',
        file_size: fileSize ? parseInt(fileSize) : 0,
        is_featured: isFeatured === true,
        is_published: isPublished !== false,
        created_by: userId ? parseInt(userId) : null
      }
    });

    res.json({ success: true, message: "E-book resource added successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add resource: " + error.message });
  }
};

exports.updateEbook = async (req, res) => {
  try {
    const { resourceId, id, title, author, subject, category, level, description, fileUrl, coverUrl, fileType, fileSize, isFeatured, isPublished } = req.body;
    const targetId = resourceId || id;
    
    if (!targetId || !title || !subject) {
      return res.status(400).json({ success: false, message: "ID, Title, and Subject are required." });
    }

    const updateData = { 
      title, 
      author: author || null,
      subject, 
      category: category || "E-Book",
      level: level || "Advanced Level",
      description: description || '',
      is_featured: isFeatured === true,
      is_published: isPublished !== false,
    };
    
    if (fileUrl) {
      updateData.file_url = fileUrl;
      updateData.file_type = fileType;
      updateData.file_size = fileSize ? parseInt(fileSize) : 0;
    }
    
    if (coverUrl !== undefined) {
      updateData.cover_url = coverUrl;
    }

    await prisma.ebook_resources.update({
      where: { id: parseInt(targetId) },
      data: updateData
    });

    res.json({ success: true, message: "E-book resource updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update resource: " + error.message });
  }
};

exports.deleteEbook = async (req, res) => {
  try {
    const { id, resourceId } = req.body;
    const targetId = id || resourceId;
    if (!targetId) return res.status(400).json({ success: false, message: "Resource ID is required." });

    await prisma.ebook_resources.delete({ where: { id: parseInt(targetId) } });
    res.json({ success: true, message: "Resource deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete resource." });
  }
};

exports.uploadEbook = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No resource file provided." });
    }

    const file = req.file;
    const maxSize = 25 * 1024 * 1024; // 25MB

    if (file.size > maxSize) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: "File size exceeds the 25MB limit." });
    }

    const allowedTypes = [
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg', 'image/png', 'image/webp'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: "Invalid file type." });
    }

    res.json({
      success: true,
      message: "Resource uploaded successfully.",
      fileUrl: `/uploads/ebooks/${file.filename}`,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Upload error: " + error.message });
  }
};
