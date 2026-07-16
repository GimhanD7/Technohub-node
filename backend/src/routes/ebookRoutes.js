const express = require('express');
const router = express.Router();
const ebookController = require('../controllers/ebookController');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../../../../uploads/ebooks/');
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `ebook_${Date.now()}_${crypto.randomBytes(5).toString('hex')}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage: storage });

router.get('/list', ebookController.listEbooks);
router.get('/get_resources', ebookController.listEbooks);
router.post('/create', ebookController.createEbook);
router.put('/update', ebookController.updateEbook);
router.delete('/delete', ebookController.deleteEbook);

router.post('/upload', upload.single('resource'), ebookController.uploadEbook);

module.exports = router;
