<?php
require_once '../db/config.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->attemptId) || !isset($data->questionId)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

$attemptId = intval($data->attemptId);
$questionId = intval($data->questionId);
$selectedOptions = isset($data->selectedOptions) ? $data->selectedOptions : [];

try {
    // 1. Verify attempt is active (not submitted)
    $stmtAttempt = $pdo->prepare("SELECT is_submitted, quiz_id FROM quiz_attempts WHERE id = ?");
    $stmtAttempt->execute([$attemptId]);
    $attempt = $stmtAttempt->fetch();

    if (!$attempt) {
        echo json_encode(["success" => false, "message" => "Attempt not found."]);
        exit();
    }

    if (intval($attempt['is_submitted']) === 1) {
        echo json_encode(["success" => false, "message" => "Quiz has already been submitted. Cannot modify answers."]);
        exit();
    }

    // 1.5 Verify quiz is not over
    $stmtQuiz = $pdo->prepare("SELECT end_time FROM quizzes WHERE id = ?");
    $stmtQuiz->execute([intval($attempt['quiz_id'])]);
    $quiz = $stmtQuiz->fetch();
    $now = date('Y-m-d H:i:s');
    if ($quiz && $now > $quiz['end_time']) {
        echo json_encode(["success" => false, "message" => "Time's up. The quiz has ended."]);
        exit();
    }

    $pdo->beginTransaction();

    // 2. Clear old responses for this question in this attempt
    $stmtClear = $pdo->prepare("DELETE FROM student_responses WHERE attempt_id = ? AND question_id = ?");
    $stmtClear->execute([$attemptId, $questionId]);

    // 3. Save new selected options
    if (!empty($selectedOptions)) {
        $stmtInsert = $pdo->prepare("INSERT INTO student_responses (attempt_id, question_id, option_id) VALUES (?, ?, ?)");
        foreach ($selectedOptions as $optId) {
            $stmtInsert->execute([$attemptId, $questionId, intval($optId)]);
        }
    }

    // 4. Save flag status if present
    if (isset($data->isFlagged)) {
        $isFlagged = $data->isFlagged ? 1 : 0;
        $stmtFlag = $pdo->prepare("INSERT INTO student_flags (attempt_id, question_id, is_flagged) 
                                   VALUES (?, ?, ?) 
                                   ON DUPLICATE KEY UPDATE is_flagged = ?");
        $stmtFlag->execute([$attemptId, $questionId, $isFlagged, $isFlagged]);
    }

    $pdo->commit();
    echo json_encode(["success" => true, "message" => "Progress saved successfully."]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Failed to save progress: " . $e->getMessage()]);
}
?>
