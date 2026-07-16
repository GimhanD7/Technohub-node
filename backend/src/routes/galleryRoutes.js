const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../../../../uploads/gallery/');
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `gallery_${Date.now()}_${crypto.randomBytes(5).toString('hex')}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage: storage });

router.get('/list', galleryController.listGallery);
router.post('/create', galleryController.createGallery);
router.put('/update', galleryController.updateGallery);
router.delete('/delete', galleryController.deleteGallery);

// Allow array of images (up to 20) under 'images' field, or a single under 'images' (frontend uses 'images[]' or 'image')
// Express/multer usually handles field names specifically. The PHP script checked for `$_FILES['images']` or `$_FILES['image']`.
// We will use `.array('images', 20)` and assume frontend sends 'images'.
router.post('/upload', upload.array('images', 20), galleryController.uploadGallery);

module.exports = router;
