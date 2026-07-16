<?php
require_once '../db/config.php';
header("Content-Type: application/json");

if (!isset($_GET['quizId']) || !isset($_GET['userId'])) {
    echo json_encode(["success" => false, "message" => "Quiz ID and User ID are required."]);
    exit();
}

$quizId = intval($_GET['quizId']);
$userId = intval($_GET['userId']);

try {
    // 1. Fetch quiz details
    $stmtQuiz = $pdo->prepare("SELECT * FROM quizzes WHERE id = ?");
    $stmtQuiz->execute([$quizId]);
    $quiz = $stmtQuiz->fetch();

    if (!$quiz) {
        echo json_encode(["success" => false, "message" => "Quiz not found."]);
        exit();
    }

    // 2. Fetch the student's attempt
    $stmtAttempt = $pdo->prepare("SELECT * FROM quiz_attempts WHERE quiz_id = ? AND user_id = ? AND is_submitted = 1");
    $stmtAttempt->execute([$quizId, $userId]);
    $attempt = $stmtAttempt->fetch();

    if (!$attempt) {
        echo json_encode(["success" => false, "message" => "No submitted attempt found for this quiz."]);
        exit();
    }

    $attemptId = intval($attempt['id']);

    // Fetch user role to determine if shuffling is needed
    $stmtRole = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmtRole->execute([$userId]);
    $userRow = $stmtRole->fetch();
    $isStudent = ($userRow && $userRow['role'] === 'student');
    // 3. Fetch questions
    $stmtQ = $pdo->prepare("SELECT * FROM questions WHERE quiz_id = ? ORDER BY id ASC");
    $stmtQ->execute([$quizId]);
    $questions = $stmtQ->fetchAll();

    if ($isStudent) {
        srand($userId * 1000 + $quizId);
        shuffle($questions);
    }
    $questionsReview = [];
    $totalScore = 0;

    foreach ($questions as $q) {
        $qId = intval($q['id']);
        $marks = intval($q['marks']);

        // Fetch options
        $stmtOpt = $pdo->prepare("SELECT * FROM options WHERE question_id = ? ORDER BY id ASC");
        $stmtOpt->execute([$qId]);
        $options = $stmtOpt->fetchAll();

        if ($isStudent) {
            shuffle($options);
        }
        // Fetch correct option IDs
        $correctIds = [];
        $optionsList = [];
        foreach ($options as $opt) {
            $optId = intval($opt['id']);
            $isCorrect = intval($opt['is_correct']) === 1;
            
            if ($isCorrect) {
                $correctIds[] = $optId;
            }

            $optionsList[] = [
                "id" => $optId,
                "text" => $opt['option_text'],
                "isCorrect" => $isCorrect
            ];
        }
        sort($correctIds);

        // Fetch selected option IDs
        $stmtSelected = $pdo->prepare("SELECT option_id FROM student_responses WHERE attempt_id = ? AND question_id = ?");
        $stmtSelected->execute([$attemptId, $qId]);
        $selectedIds = $stmtSelected->fetchAll(PDO::FETCH_COLUMN);
        $selectedIds = array_map('intval', $selectedIds);
        sort($selectedIds);

        // Check if student got it fully correct
        $isCorrectQuestion = ($correctIds === $selectedIds);
        $earnedMarks = $isCorrectQuestion ? $marks : 0;
        $totalScore += $earnedMarks;

        $questionsReview[] = [
            "id" => $qId,
            "text" => $q['question_text'],
            "imageUrl" => $q['image_url'],
            "marks" => $marks,
            "earnedMarks" => $earnedMarks,
            "isCorrect" => $isCorrectQuestion,
            "options" => $optionsList,
            "selectedOptions" => $selectedIds
        ];
    }

    echo json_encode([
        "success" => true,
        "quiz" => [
            "id" => $quizId,
            "title" => $quiz['title'],
            "startTime" => $quiz['start_time'],
            "endTime" => $quiz['end_time']
        ],
        "attempt" => [
            "id" => $attemptId,
            "score" => intval($attempt['score']),
            "startedAt" => $attempt['started_at'],
            "submittedAt" => $attempt['submitted_at']
        ],
        "questions" => $questionsReview
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to fetch results: " . $e->getMessage()]);
}
?>
