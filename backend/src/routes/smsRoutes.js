const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

router.get('/logs', smsController.getSmsLogs);
router.post('/send_bulk', smsController.sendBulkSms);

module.exports = router;
