const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../../../../uploads/home/');
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `home_${Date.now()}_${crypto.randomBytes(5).toString('hex')}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage: storage });

router.get('/get_content', homeController.getContent);
router.post('/update_settings', homeController.updateSettings);

router.post('/save_slide', homeController.saveSlide);
router.post('/delete_slide', homeController.deleteSlide);

router.post('/save_lecturer', homeController.saveLecturer);
router.post('/delete_lecturer', homeController.deleteLecturer);

router.post('/save_timetable', homeController.saveTimetable);
router.post('/delete_timetable', homeController.deleteTimetable);

router.post('/upload', upload.single('image'), homeController.uploadFile);

module.exports = router;
