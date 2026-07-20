const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');

router.get('/get_all', bankController.getAllBankDetails);
router.get('/get_active', bankController.getActiveBankDetails);
router.post('/add', bankController.addBankDetails);
router.post('/update', bankController.updateBankDetails);
router.post('/toggle_status', bankController.toggleStatus);
router.post('/delete', bankController.deleteBankDetails);

module.exports = router;
