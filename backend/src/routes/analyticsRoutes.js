const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/dashboard', analyticsController.getDashboardStats);

module.exports = router;
