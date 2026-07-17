const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/send-otp', authController.sendOtp);
router.post('/send_otp', authController.sendOtp);

module.exports = router;
