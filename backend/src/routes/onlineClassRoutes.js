const express = require('express');
const router = express.Router();
const onlineClassController = require('../controllers/onlineClassController');

// In PHP, it was a monolithic manage.php file handling GET/POST/PUT/DELETE.
// Now mapped to standard Express REST semantics.
router.get('/manage', onlineClassController.getClasses);
router.post('/manage', onlineClassController.createClass);
router.put('/manage', onlineClassController.updateClass);
router.delete('/manage', onlineClassController.deleteClass);

module.exports = router;
