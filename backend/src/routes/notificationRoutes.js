const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.post('/add', notificationController.addNotification);
router.get('/get', notificationController.getNotifications);
router.post('/mark_read', notificationController.markRead);

module.exports = router;
