const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');

// Using basic authentication for now. In production, use requireAdmin for all.
router.get('/security', adminController.getSecuritySettings);
router.post('/security', adminController.updateSecuritySettings);

router.get('/system_settings', adminController.getSystemSettings);
router.post('/system_settings', adminController.updateSystemSettings);

router.get('/get_users_list', adminController.getUsersList);
router.get('/get_logs', adminController.getLogs);
router.get('/get_notifications', adminController.getNotifications);

router.get('/get_teacher_earnings', adminController.getTeacherEarnings);
router.get('/get_teacher_earnings_history', adminController.getTeacherEarningsHistory);
router.post('/update_teacher_commission', adminController.updateTeacherCommission);
router.get('/get_teacher_monthly_report', adminController.getTeacherMonthlyReport);
router.post('/record_teacher_payout', adminController.recordTeacherPayout);
router.get('/get_teacher_earnings_trends', adminController.getTeacherEarningsTrends);

router.get('/get_deleted_users', adminController.getDeletedUsers);
router.get('/get_user_history_summary', adminController.getUserHistorySummary);

router.get('/uploads', adminController.getUploads);
router.delete('/uploads', adminController.deleteUpload);

module.exports = router;
