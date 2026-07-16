const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Multer setup for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../../../../uploads/course-materials/');
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `material_${Date.now()}_${crypto.randomBytes(5).toString('hex')}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage: storage });

router.get('/get_teachers', courseController.getTeachers);

router.get('/manage_categories', courseController.getCategories);
router.post('/manage_categories', courseController.addCategory);
router.put('/manage_categories', courseController.updateCategory);
router.delete('/manage_categories', courseController.deleteCategory);

router.get('/manage_courses', courseController.getCourses);
router.post('/manage_courses', courseController.addCourse);
router.put('/manage_courses', courseController.updateCourse);
router.delete('/manage_courses', courseController.deleteCourse);

router.get('/manage_modules', courseController.getModules);
router.post('/manage_modules', courseController.addModule);
router.put('/manage_modules', courseController.updateModule);
router.delete('/manage_modules', courseController.deleteModule);

router.get('/manage_materials', courseController.getMaterials);
router.post('/manage_materials', courseController.addMaterial);
router.put('/manage_materials', courseController.updateMaterial);
router.delete('/manage_materials', courseController.deleteMaterial);

router.post('/upload_banner', courseController.uploadBanner);
router.post('/upload_material', upload.single('resource'), courseController.uploadMaterial);

module.exports = router;
