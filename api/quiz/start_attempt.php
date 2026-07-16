<?php
require_once '../db/config.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->quizId) || !isset($data->userId)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

$quizId = intval($data->quizId);
$userId = intval($data->userId);

try {
    // 1. Verify quiz exists and is active
    $stmtQuiz = $pdo->prepare("SELECT start_time, end_time, fee FROM quizzes WHERE id = ?");
    $stmtQuiz->execute([$quizId]);
    $quiz = $stmtQuiz->fetch();

    if (!$quiz) {
        echo json_encode(["success" => false, "message" => "Quiz not found."]);
        exit();
    }

    // Verify payment for paid quizzes
    $fee = floatval($quiz['fee']);
    if ($fee > 0) {
        $stmtPay = $pdo->prepare("SELECT id FROM quiz_payments WHERE quiz_id = ? AND user_id = ?");
        $stmtPay->execute([$quizId, $userId]);
        if (!$stmtPay->fetch()) {
            echo json_encode(["success" => false, "message" => "This quiz requires payment to unlock."]);
            exit();
        }
    }

    // 1.5 Verify user exists and is a student
    $stmtUser = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmtUser->execute([$userId]);
    $userRow = $stmtUser->fetch();
    
    if (!$userRow) {
        echo json_encode(["success" => false, "message" => "User not found."]);
        exit();
    }
    
    if ($userRow['role'] !== 'student') {
        echo json_encode(["success" => false, "message" => "Only students are allowed to participate in quizzes."]);
        exit();
    }
    $now = date('Y-m-d H:i:s');
    if ($now < $quiz['start_time']) {
        echo json_encode(["success" => false, "message" => "This quiz hasn't started yet."]);
        exit();
    }
    if ($now > $quiz['end_time']) {
        echo json_encode(["success" => false, "message" => "This quiz has already ended."]);
        exit();
    }

    // 2. Check if attempt already exists
    $stmtCheck = $pdo->prepare("SELECT id, is_submitted FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?");
    $stmtCheck->execute([$quizId, $userId]);
    $existing = $stmtCheck->fetch();

    if ($existing) {
        echo json_encode([
            "success" => true,
            "message" => "Resuming attempt.",
            "attemptId" => intval($existing['id']),
            "isSubmitted" => intval($existing['is_submitted']) === 1
        ]);
        exit();
    }

    // 3. Create new attempt
    $stmtInsert = $pdo->prepare("INSERT INTO quiz_attempts (quiz_id, user_id, started_at) VALUES (?, ?, ?)");
    $stmtInsert->execute([$quizId, $userId, $now]);
    $attemptId = $pdo->lastInsertId();

    echo json_encode([
        "success" => true,
        "message" => "Attempt started successfully.",
        "attemptId" => intval($attemptId),
        "isSubmitted" => false
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to start attempt: " . $e->getMessage()]);
}
?>
