const express = require('express');
const router = express.Router();
const teacherMessageController = require('../controllers/teacherMessageController');

// Teacher routes
router.post('/send', teacherMessageController.sendMessage);
router.get('/my_messages', teacherMessageController.getMyMessages);

// Admin routes
router.get('/all', teacherMessageController.listAllMessages);
router.post('/reply', teacherMessageController.replyToMessage);
router.post('/resolve', teacherMessageController.markResolved);

// Shared (teacher own / admin any)
router.post('/delete', teacherMessageController.deleteMessage);

module.exports = router;
