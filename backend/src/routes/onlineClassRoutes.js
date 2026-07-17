const express = require('express');
const router = express.Router();
const onlineClassController = require('../controllers/onlineClassController');

router.get('/teachers', onlineClassController.getTeachers);
router.get('/manage', onlineClassController.getClasses);
router.post('/manage', onlineClassController.createClass);
router.put('/manage', onlineClassController.updateClass);
router.delete('/manage', onlineClassController.deleteClass);

module.exports = router;
