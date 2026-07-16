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
    // 1. Verify user exists
    $stmtUser = $pdo->prepare("SELECT id, role, wallet_balance FROM users WHERE id = ?");
    $stmtUser->execute([$userId]);
    $userRow = $stmtUser->fetch();
    if (!$userRow) {
        echo json_encode(["success" => false, "message" => "User not found."]);
        exit();
    }

    // 2. Verify quiz exists and get its fee
    $stmtQuiz = $pdo->prepare("SELECT id, title, fee FROM quizzes WHERE id = ?");
    $stmtQuiz->execute([$quizId]);
    $quiz = $stmtQuiz->fetch();
    if (!$quiz) {
        echo json_encode(["success" => false, "message" => "Quiz not found."]);
        exit();
    }

    $fee = floatval($quiz['fee']);

    if ($fee > 0) {
        if (floatval($userRow['wallet_balance']) < $fee) {
            echo json_encode(["success" => false, "message" => "Insufficient wallet balance."]);
            exit();
        }

        $pdo->beginTransaction();

        $stmtUpdateUser = $pdo->prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?");
        $stmtUpdateUser->execute([$fee, $userId]);

        $stmtTx = $pdo->prepare("INSERT INTO wallet_transactions (user_id, amount, type, status, description) VALUES (?, ?, 'debit', 'approved', ?)");
        $stmtTx->execute([$userId, $fee, "Paid for exam: " . $quiz['title']]);

        $stmtInsert = $pdo->prepare("INSERT INTO quiz_payments (quiz_id, user_id, amount) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE amount = VALUES(amount)");
        $stmtInsert->execute([$quizId, $userId, $fee]);

        $pdo->commit();
    } else {
        $stmtInsert = $pdo->prepare("INSERT INTO quiz_payments (quiz_id, user_id, amount) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE amount = VALUES(amount)");
        $stmtInsert->execute([$quizId, $userId, $fee]);
    }

    // Log activity
    require_once '../lib/logger.php';
    log_activity($pdo, $userId, 'Paid Quiz Fee', 'Unlocked quiz: ' . $quiz['title'] . ' (LKR ' . number_format($fee, 2) . ')');

    echo json_encode(["success" => true, "message" => "Quiz '" . $quiz['title'] . "' unlocked successfully!"]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Failed to process payment: " . $e->getMessage()]);
}
?>
