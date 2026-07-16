const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../../../../uploads/profiles/');
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `avatar_${Date.now()}_${crypto.randomBytes(3).toString('hex')}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage: storage });

// Admin Management
router.get('/get_users', userController.getUsers);
router.post('/add_user', userController.addUser);
router.post('/admin_update_user', userController.updateUser);
router.post('/delete_user', userController.deleteUser);
router.post('/toggle_status', userController.toggleStatus);
router.post('/set_role', userController.setRole);

// Self Profile
router.post('/update_profile', userController.updateProfile);
router.post('/upload_profile', upload.any(), userController.uploadProfile);

module.exports = router;
