const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Teacher Management
router.get('/list', quizController.listQuizzes);
router.get('/get', quizController.getQuiz);
router.post('/create', quizController.createQuiz);
router.put('/edit', quizController.editQuiz);
router.post('/edit', quizController.editQuiz);
router.post('/delete', quizController.deleteQuiz);

// Student Taking
router.get('/get_lobby', quizController.getLobby);
router.post('/start_attempt', quizController.startAttempt);
router.post('/save_progress', quizController.saveProgress);
router.post('/submit', quizController.submitQuiz);

// Post-Quiz Results
router.get('/submissions', quizController.getSubmissions);
router.get('/rankings', quizController.getRankings);
router.get('/review', quizController.getReview);

// Payment
router.post('/pay', quizController.payForQuiz);

module.exports = router;
