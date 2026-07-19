const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.get('/get_all_courses', studentController.getAllCourses);
router.post('/enroll_course', studentController.enrollCourse);
router.post('/enroll_online_class', studentController.enrollOnlineClass);
router.get('/get_my_courses', studentController.getMyCourses);
router.post('/mark_material_complete', studentController.markMaterialComplete);
router.get('/get_dashboard_summary', studentController.getDashboardSummary);
router.get('/get_grades_reports', studentController.getGradesReports);
router.get('/get_course_content', studentController.getCourseContent);

module.exports = router;
