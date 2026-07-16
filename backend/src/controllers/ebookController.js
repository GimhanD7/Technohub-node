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
    const { title, subject, description, file_url, file_type, file_size } = req.body;
    if (!title || !subject || !file_url) {
      return res.status(400).json({ success: false, message: "Title, subject, and resource file are required." });
    }

    await prisma.ebook_resources.create({
      data: {
        title,
        subject,
        description: description || '',
        file_url,
        file_type: file_type || 'application/pdf',
        file_size: file_size ? parseInt(file_size) : 0
      }
    });

    res.json({ success: true, message: "E-book resource added successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add resource: " + error.message });
  }
};

exports.updateEbook = async (req, res) => {
  try {
    const { id, title, subject, description, file_url, file_type, file_size } = req.body;
    if (!id || !title || !subject) {
      return res.status(400).json({ success: false, message: "ID, Title, and Subject are required." });
    }

    const updateData = { title, subject, description: description || '' };
    
    if (file_url) {
      updateData.file_url = file_url;
      updateData.file_type = file_type;
      updateData.file_size = file_size ? parseInt(file_size) : 0;
    }

    await prisma.ebook_resources.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ success: true, message: "E-book resource updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update resource: " + error.message });
  }
};

exports.deleteEbook = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Resource ID is required." });

    await prisma.ebook_resources.delete({ where: { id: parseInt(id) } });
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
