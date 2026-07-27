const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { optimizeImage } = require('../utils/imageOptimization');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Standardizing the old api/upload.php which saved to uploads/questions/
    const uploadDir = path.resolve(__dirname, '../../../../uploads/questions/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `question_${Date.now()}_${crypto.randomBytes(5).toString('hex')}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type."));
    }
    cb(null, true);
  }
});

router.post('/', (req, res) => {
  upload.single('image')(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: "File size exceeds 5MB limit." });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }

    try {
      const optimization = await optimizeImage(req.file.path, { maxWidth: 1920, maxHeight: 1920, quality: 82 });
      res.json({
        success: true,
        message: optimization.optimized ? "Image optimized and uploaded successfully." : "Image uploaded successfully (already optimized).",
        imageUrl: `/uploads/questions/${req.file.filename}`,
        optimized: optimization.optimized,
        fileSize: optimization.fileSize,
        originalFileSize: optimization.originalSize
      });
    } catch (error) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      res.status(error.code === 'INVALID_IMAGE' ? 400 : 500).json({ success: false, message: error.message });
    }
  });
});

module.exports = router;
