const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

router.get('/earnings', teacherController.getEarnings);
router.get('/dashboard', teacherController.getDashboardStats);

module.exports = router;
