const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.post('/add', notificationController.addNotification);
router.get('/get', notificationController.getNotifications);
router.post('/mark_read', notificationController.markRead);
router.delete('/bulk-delete', notificationController.bulkDeleteNotifications);
router.delete('/delete/:id', notificationController.deleteNotification);

module.exports = router;
