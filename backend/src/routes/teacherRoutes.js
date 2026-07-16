const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

router.get('/earnings', teacherController.getEarnings);

module.exports = router;
