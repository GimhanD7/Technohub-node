const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/admin_stats', dashboardController.getAdminStats);

module.exports = router;
