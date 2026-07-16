const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

router.get('/settings', systemController.getSettings);
router.post('/settings', systemController.updateSettings);

module.exports = router;
