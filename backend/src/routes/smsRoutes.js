const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

router.get('/logs', smsController.getSmsLogs);
router.post('/send_bulk', smsController.sendBulkSms);
router.post('/send_single', smsController.sendSingleSms);
router.post('/delete', smsController.deleteSmsLog);
router.post('/delete_bulk', smsController.deleteSmsLogs);

module.exports = router;
