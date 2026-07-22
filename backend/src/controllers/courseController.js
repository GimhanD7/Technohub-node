const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { compressPdf } = require('../utils/pdfCompression');

function generateSlug(string) {
  return string.toString().toLowerCase().trim()
    .replace(/[^a-z0-9 -]/g, '') 
    .replace(/\s+/g, '-') 
    .replace(/-+/g, '-');
}

// --- TEACHERS ---
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await prisma.users.findMany({
      where: { role: 'teacher', status: 'active' },
      select: { id: true, index_number: true, full_name: true, email: true, phone_number: true, profile_picture: true },
      orderBy: { full_name: 'asc' }
    });
    res.json({ success: true, teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Database error: " + error.message });
  }
};

// --- CATEGORIES ---
exports.getCategories = async (req, res) => {
  try {
    const categories = await prisma.course_categories.findMany({
      include: { _count: { select: { courses: true } } },
      orderBy: { name: 'asc' }
    });
    res.json({
      success: true,
      categories: categories.map(category => ({
        ...category,
        course_count: category._count.courses,
        _count: undefined
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const { name, user_id } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Category name is required." });

    let slug = generateSlug(name);
    const existing = await prisma.course_categories.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const category = await prisma.course_categories.create({
      data: { name: name.trim(), slug }
    });

    res.json({ success: true, message: "Category added successfully.", category });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add category." });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id, name, user_id } = req.body;
    if (!id || !name) return res.status(400).json({ success: false, message: "Category ID and new name are required." });

    let slug = generateSlug(name);
    const existing = await prisma.course_categories.findFirst({ where: { slug, id: { not: parseInt(id) } } });
    if (existing) slug = `${slug}-${Date.now()}`;

    await prisma.course_categories.update({
      where: { id: parseInt(id) },
      data: { name: name.trim(), slug }
    });

    res.json({ success: true, message: "Category updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update category." });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Category ID is required." });

    // Check if courses are attached
    const courseCount = await prisma.courses.count({ where: { category_id: parseInt(id) } });
    if (courseCount > 0) {
      return res.status(400).json({ success: false, message: "Cannot delete this category because it is in use by one or more courses." });
    }

    await prisma.course_categories.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: "Category deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- COURSES ---
exports.getCourses = async (req, res) => {
  try {
    const { teacher_id } = req.query;
    if (!teacher_id) return res.status(400).json({ success: false, message: "Teacher ID is required." });

    const courses = await prisma.courses.findMany({
      where: { teacher_id: parseInt(teacher_id) },
      include: {
        course_categories: { select: { name: true } },
        _count: { select: { course_enrollments: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const formatted = courses.map(c => ({
      ...c,
      category_name: c.course_categories?.name || null,
      enrollment_count: c._count?.course_enrollments ?? 0,
      course_categories: undefined,
      _count: undefined
    }));

    res.json({ success: true, courses: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addCourse = async (req, res) => {
  try {
    const { teacher_id, category_id, title, description, duration, points, banner_url } = req.body;
    if (!teacher_id || !title) return res.status(400).json({ success: false, message: "Teacher ID and Title are required." });

    await prisma.courses.create({
      data: {
        teacher_id: parseInt(teacher_id),
        category_id: category_id ? parseInt(category_id) : null,
        title,
        description: description || '',
        duration: duration || '',
        points: points || 0,
        banner_url: banner_url || ''
      }
    });

    res.json({ success: true, message: "Course created successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create course." });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id, category_id, title, description, duration, points, banner_url, status } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Course ID is required." });

    const updateData = {};
    if (category_id !== undefined) updateData.category_id = category_id ? parseInt(category_id) : null;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (duration !== undefined) updateData.duration = duration;
    if (points !== undefined) updateData.points = parseInt(points);
    if (banner_url !== undefined) updateData.banner_url = banner_url;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) return res.json({ success: false, message: "No data to update." });

    await prisma.courses.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ success: true, message: "Course updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update course." });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Course ID is required." });

    await prisma.courses.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: "Course deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete course." });
  }
};

// --- MODULES ---
exports.getModules = async (req, res) => {
  try {
    const { course_id } = req.query;
    if (!course_id) return res.status(400).json({ success: false, message: "Course ID is required." });

    const modules = await prisma.course_modules.findMany({
      where: { course_id: parseInt(course_id) },
      orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }]
    });

    res.json({ success: true, modules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addModule = async (req, res) => {
  try {
    const { course_id, title, description, order_index, images } = req.body;
    if (!course_id || !title) return res.status(400).json({ success: false, message: "Course ID and Title are required." });

    await prisma.course_modules.create({
      data: {
        course_id: parseInt(course_id),
        title,
        description: description || '',
        order_index: order_index || 0,
        images: images || null
      }
    });

    res.json({ success: true, message: "Module created successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create module: " + error.message });
  }
};

exports.updateModule = async (req, res) => {
  try {
    const { id, title, description, images } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Module ID is required." });

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (images !== undefined) updateData.images = images;

    if (Object.keys(updateData).length === 0) return res.json({ success: true, message: "No changes." });

    await prisma.course_modules.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ success: true, message: "Module updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update module: " + error.message });
  }
};

exports.deleteModule = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Module ID is required." });

    await prisma.course_modules.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: "Module deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete module." });
  }
};

// --- MATERIALS ---
exports.getMaterials = async (req, res) => {
  try {
    const { module_id } = req.query;
    if (!module_id) return res.status(400).json({ success: false, message: "Module ID is required." });

    const materials = await prisma.course_materials.findMany({
      where: { module_id: parseInt(module_id) },
      orderBy: [{ order_index: 'asc' }, { created_at: 'asc' }]
    });

    res.json({ success: true, materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addMaterial = async (req, res) => {
  try {
    const { module_id, type, title, description, content_url, order_index } = req.body;
    if (!module_id || !title || !type || !content_url) {
      return res.status(400).json({ success: false, message: "Module ID, Title, Type, and URL are required." });
    }

    await prisma.course_materials.create({
      data: {
        module_id: parseInt(module_id),
        type,
        title,
        description: description || '',
        content_url,
        order_index: order_index || 0
      }
    });

    res.json({ success: true, message: "Material added successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add material." });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const { id, title, type, description, content_url } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Material ID is required." });

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (content_url !== undefined) {
      if (!content_url.trim()) return res.status(400).json({ success: false, message: "Upload a PDF or provide a valid link." });
      updateData.content_url = content_url;
    }

    if (Object.keys(updateData).length === 0) return res.json({ success: true, message: "No changes." });

    await prisma.course_materials.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ success: true, message: "Material updated successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update material." });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Material ID is required." });

    await prisma.course_materials.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: "Material deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete material." });
  }
};

// --- UPLOADS ---
exports.uploadBanner = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, message: "No image data provided." });

    const matches = image.match(/^data:image\/(\w+);base64,/);
    if (!matches) return res.status(400).json({ success: false, message: "Invalid base64 string format." });

    const type = matches[1].toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid image type." });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "").replace(/ /g, '+');
    const buffer = Buffer.from(base64Data, 'base64');

    const uploadDir = path.resolve(__dirname, '../../../../uploads/banners/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `banner_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${type}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);

    const protocol = req.protocol;
    const host = req.get('host');
    // For local dev where XAMPP hosted Techno-Hub: PHP returned absolute URL containing /Techno-Hub
    // But since backend is now Node.js standalone, the frontend expects a valid URL.
    // However, the PHP script determined the base path dynamically.
    // If the frontend is fetching from API_BASE_URL (http://localhost:5000/api),
    // and the uploads folder is served statically via Nginx/Apache, this might be tricky.
    // Let's assume the frontend accesses uploads via the same host (e.g. Next.js public folder) 
    // or we will just return a relative /uploads/... path. PHP returned an absolute URL.
    // Actually, PHP returned: `protocol://host/Techno-Hub/uploads/banners/...` 
    // We will just return `/Techno-Hub/uploads/banners/...` if needed, or better, just rely on frontend parsing.
    // Wait, the PHP code did: `/Techno-Hub/uploads/banners/file.jpg`.
    // Let's return `/uploads/banners/${filename}`.
    
    res.json({ success: true, url: `/uploads/banners/${filename}`, message: "Image uploaded successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Upload failed: " + error.message });
  }
};

exports.uploadMaterial = async (req, res) => {
  let uploadedPath;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Choose a PDF file to upload." });
    }

    const file = req.file;
    uploadedPath = file.path;
    const maxSize = 25 * 1024 * 1024; // 25MB

    if (file.size <= 0 || file.size > maxSize) {
      // Must delete the temp file Multer created
      fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: "PDF files must be smaller than 25MB." });
    }

    if (file.mimetype !== 'application/pdf' && path.extname(file.originalname).toLowerCase() !== '.pdf') {
      fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: "Only valid PDF files can be uploaded here." });
    }

    const compression = await compressPdf(file.path);

    res.json({
      success: true,
      message: compression.compressed ? "PDF compressed and uploaded successfully." : "PDF uploaded successfully (already optimized).",
      fileUrl: `/uploads/course-materials/${file.filename}`,
      fileName: file.originalname,
      fileSize: compression.fileSize,
      originalFileSize: compression.originalSize,
      compressed: compression.compressed
    });

  } catch (error) {
    if (uploadedPath) await fs.promises.unlink(uploadedPath).catch(() => {});
    const status = error.code === 'INVALID_PDF' ? 400 : error.code === 'GHOSTSCRIPT_NOT_FOUND' ? 503 : 500;
    res.status(status).json({ success: false, message: "Upload error: " + error.message });
  }
};

exports.uploadModuleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Choose an image file to upload." });
    }
    res.json({
      success: true,
      message: "Image uploaded successfully.",
      imageUrl: `/uploads/modules/${req.file.filename}`,
      fileName: req.file.originalname
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Upload error: " + error.message });
  }
};

// --- ENROLLED STUDENTS ---
exports.getEnrolledStudents = async (req, res) => {
  try {
    const { course_id, teacher_id } = req.query;
    if (!course_id) return res.status(400).json({ success: false, message: "Course ID is required." });

    // Verify this course belongs to the requesting teacher (when teacher_id is provided)
    if (teacher_id) {
      const course = await prisma.courses.findFirst({
        where: { id: parseInt(course_id), teacher_id: parseInt(teacher_id) }
      });
      if (!course) return res.status(403).json({ success: false, message: "Access denied." });
    }

    const enrollments = await prisma.course_enrollments.findMany({
      where: { course_id: parseInt(course_id) },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            index_number: true,
            email: true,
            phone_number: true,
            education_category: true,
            student_category: true,
            profile_picture: true
          }
        }
      },
      orderBy: { enrolled_at: 'desc' }
    });

    const students = enrollments.map(e => ({
      enrollmentId: e.id,
      enrolledAt: e.enrolled_at,
      studentId: e.users?.id,
      fullName: e.users?.full_name || 'Unknown',
      indexNumber: e.users?.index_number || '-',
      email: e.users?.email || '-',
      phone: e.users?.phone_number || '-',
      educationCategory: e.users?.education_category || '-',
      studentCategory: e.users?.student_category || '-',
      profilePicture: e.users?.profile_picture || null
    }));

    res.json({ success: true, students, total: students.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
