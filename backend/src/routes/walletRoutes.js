const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.resolve(__dirname, '../../../../uploads/slips/');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `slip_${Date.now()}_${crypto.randomBytes(3).toString('hex')}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage: storage });

router.get('/balance', walletController.getBalance);
router.get('/history', walletController.getHistory);
router.get('/stats', walletController.getStats);

router.post('/recharge', upload.single('slip'), walletController.recharge);
router.post('/approve', walletController.approveOrReject);
router.post('/delete', walletController.deleteTransaction);
router.post('/bulk_add_credits', walletController.bulkAddCredits);
router.post('/update_balance', walletController.updateBalance);

module.exports = router;
