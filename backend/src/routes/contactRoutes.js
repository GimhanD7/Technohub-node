const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.post('/submit_message', contactController.submitMessage);
router.get('/list_messages', contactController.listMessages);
router.post('/update_message_status', contactController.updateMessageStatus);
router.post('/delete_message', contactController.deleteMessage);

router.get('/get_settings', contactController.getSettings);
router.post('/update_settings', contactController.updateSettings);

module.exports = router;
