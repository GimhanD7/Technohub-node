<?php
require_once '../db/config.php';
header("Content-Type: application/json");

if (!isset($_GET['quizId'])) {
    echo json_encode(["success" => false, "message" => "Quiz ID is required."]);
    exit();
}

$quizId = intval($_GET['quizId']);
$userId = isset($_GET['userId']) ? intval($_GET['userId']) : 0;
$role = isset($_GET['role']) ? htmlspecialchars(strip_tags($_GET['role'])) : 'student';

try {
    // 1. Fetch quiz info
    $stmtQuiz = $pdo->prepare("SELECT * FROM quizzes WHERE id = ?");
    $stmtQuiz->execute([$quizId]);
    $quiz = $stmtQuiz->fetch();

    if (!$quiz) {
        echo json_encode(["success" => false, "message" => "Quiz not found."]);
        exit();
    }

    // 2. Check student submission status
    $isSubmitted = false;
    $now = date('Y-m-d H:i:s');
    $quizEnded = ($now > $quiz['end_time']);

    if ($role === 'student' && $userId > 0) {
        $stmtAttempt = $pdo->prepare("SELECT is_submitted FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?");
        $stmtAttempt->execute([$quizId, $userId]);
        $attempt = $stmtAttempt->fetch();
        if ($attempt && intval($attempt['is_submitted']) === 1) {
            $isSubmitted = true;
        }
    }

    // Determine if correct answers should be hidden
    // Hide if role is student, and they haven't submitted, and the quiz hasn't ended yet
    $hideCorrect = ($role === 'student' && !$isSubmitted && !$quizEnded);

    $isPaid = true;
    $fee = floatval($quiz['fee']);
    if ($role === 'student' && $fee > 0) {
        if ($userId > 0) {
            $stmtPay = $pdo->prepare("SELECT id FROM quiz_payments WHERE quiz_id = ? AND user_id = ?");
            $stmtPay->execute([$quizId, $userId]);
            if (!$stmtPay->fetch()) {
                $isPaid = false;
            }
        } else {
            $isPaid = false;
        }
    }

    // 3. Fetch questions
    $questions = [];
    if ($isPaid || $role === 'admin' || $role === 'teacher') {
        $stmtQ = $pdo->prepare("SELECT * FROM questions WHERE quiz_id = ? ORDER BY id ASC");
        $stmtQ->execute([$quizId]);
        $questions = $stmtQ->fetchAll();
    }

    if ($role === 'student' && $userId > 0 && !empty($questions)) {
        srand($userId * 1000 + $quizId);
        shuffle($questions);
    }
    $questionsList = [];

    foreach ($questions as $q) {
        $qId = intval($q['id']);
        
        // Fetch options
        $stmtOpt = $pdo->prepare("SELECT * FROM options WHERE question_id = ? ORDER BY id ASC");
        $stmtOpt->execute([$qId]);
        $options = $stmtOpt->fetchAll();

        if ($role === 'student' && $userId > 0) {
            shuffle($options);
        }
        $optionsList = [];
        $correctAnswerCount = 0;
        
        foreach ($options as $opt) {
            $formattedOpt = [
                "id" => intval($opt['id']),
                "text" => $opt['option_text']
            ];
            
            // Count correct answers
            if (intval($opt['is_correct']) === 1) {
                $correctAnswerCount++;
            }
            
            // Only include correctness if not hidden
            if (!$hideCorrect) {
                $formattedOpt["is_correct"] = intval($opt['is_correct']) === 1;
            }
            
            $optionsList[] = $formattedOpt;
        }

        // Fetch student answer (if any) and flag (if any) to resume progress
        $selectedOptionIds = [];
        $isFlagged = false;

        if ($userId > 0) {
            // Get attempt
            $stmtAtt = $pdo->prepare("SELECT id FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?");
            $stmtAtt->execute([$quizId, $userId]);
            $attemptRow = $stmtAtt->fetch();
            
            if ($attemptRow) {
                $attemptId = intval($attemptRow['id']);
                
                // Get responses
                $stmtResp = $pdo->prepare("SELECT option_id FROM student_responses WHERE attempt_id = ? AND question_id = ?");
                $stmtResp->execute([$attemptId, $qId]);
                $selectedOptionIds = $stmtResp->fetchAll(PDO::FETCH_COLUMN);
                $selectedOptionIds = array_map('intval', $selectedOptionIds);
                
                // Get flag
                $stmtFlag = $pdo->prepare("SELECT is_flagged FROM student_flags WHERE attempt_id = ? AND question_id = ?");
                $stmtFlag->execute([$attemptId, $qId]);
                $flagRow = $stmtFlag->fetch();
                $isFlagged = $flagRow && intval($flagRow['is_flagged']) === 1;
            }
        }

        $questionsList[] = [
            "id" => $qId,
            "text" => $q['question_text'],
            "imageUrl" => $q['image_url'],
            "marks" => intval($q['marks']),
            "options" => $optionsList,
            "selectedOptions" => $selectedOptionIds,
            "isFlagged" => $isFlagged,
            "correctAnswerCount" => $correctAnswerCount
        ];
    }

    echo json_encode([
        "success" => true,
        "quiz" => [
            "id" => intval($quiz['id']),
            "title" => $quiz['title'],
            "startTime" => $quiz['start_time'],
            "endTime" => $quiz['end_time'],
            "created_by" => intval($quiz['created_by']),
            "fee" => $fee,
            "isPaid" => $isPaid,
            "questions" => $questionsList,
            "now" => $now
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to fetch quiz: " . $e->getMessage()]);
}
?>
