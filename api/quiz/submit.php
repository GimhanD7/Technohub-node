<?php
require_once '../db/config.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->attemptId)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

$attemptId = intval($data->attemptId);

try {
    // 1. Fetch attempt and quiz details
    $stmtAttempt = $pdo->prepare("SELECT a.*, q.end_time FROM quiz_attempts a JOIN quizzes q ON a.quiz_id = q.id WHERE a.id = ?");
    $stmtAttempt->execute([$attemptId]);
    $attempt = $stmtAttempt->fetch();

    if (!$attempt) {
        echo json_encode(["success" => false, "message" => "Attempt not found."]);
        exit();
    }

    if (intval($attempt['is_submitted']) === 1) {
        echo json_encode([
            "success" => true,
            "message" => "Quiz was already submitted.",
            "score" => intval($attempt['score'])
        ]);
        exit();
    }

    $quizId = intval($attempt['quiz_id']);
    $endTime = $attempt['end_time'];
    $now = date('Y-m-d H:i:s');

    // Cap the submission time to the end time of the quiz in case of network latency or automatic submits
    $submitTime = ($now > $endTime) ? $endTime : $now;

    // 2. Fetch all questions and their marks
    $stmtQ = $pdo->prepare("SELECT id, marks FROM questions WHERE quiz_id = ?");
    $stmtQ->execute([$quizId]);
    $questions = $stmtQ->fetchAll();

    $totalScore = 0;
    $maxPossibleScore = 0;

    // 3. Score calculation
    foreach ($questions as $q) {
        $qId = intval($q['id']);
        $marks = intval($q['marks']);
        $maxPossibleScore += $marks;

        // Correct options
        $stmtCorrect = $pdo->prepare("SELECT id FROM options WHERE question_id = ? AND is_correct = 1");
        $stmtCorrect->execute([$qId]);
        $correctIds = $stmtCorrect->fetchAll(PDO::FETCH_COLUMN);
        $correctIds = array_map('intval', $correctIds);
        sort($correctIds);

        // Student responses
        $stmtStudent = $pdo->prepare("SELECT option_id FROM student_responses WHERE attempt_id = ? AND question_id = ?");
        $stmtStudent->execute([$attemptId, $qId]);
        $studentIds = $stmtStudent->fetchAll(PDO::FETCH_COLUMN);
        $studentIds = array_map('intval', $studentIds);
        sort($studentIds);

        // Exact match comparison
        if ($correctIds === $studentIds) {
            $totalScore += $marks;
        }
    }

    // 4. Update quiz_attempts row
    $stmtUpdate = $pdo->prepare("UPDATE quiz_attempts SET score = ?, submitted_at = ?, is_submitted = 1 WHERE id = ?");
    $stmtUpdate->execute([$totalScore, $submitTime, $attemptId]);

    echo json_encode([
        "success" => true,
        "message" => "Quiz submitted successfully!",
        "score" => $totalScore,
        "maxScore" => $maxPossibleScore,
        "submitTime" => $submitTime
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Submission failed: " . $e->getMessage()]);
}
?>
