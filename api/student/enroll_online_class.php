<?php
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../lib/logger.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    echo json_encode(["success" => false, "message" => "Only POST requests are allowed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['student_id']) || !isset($data['online_class_id'])) {
    echo json_encode(["success" => false, "message" => "Student ID and Online Class ID are required."]);
    exit();
}

try {
    // Check if already enrolled
    $checkStmt = $pdo->prepare("SELECT id FROM online_class_enrollments WHERE student_id = ? AND online_class_id = ?");
    $checkStmt->execute([$data['student_id'], $data['online_class_id']]);
    
    if ($checkStmt->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "You are already enrolled in this online class."]);
        exit();
    }

    // Fetch class info
    $fetchStmt = $pdo->prepare("SELECT title, fee FROM online_classes WHERE id = ?");
    $fetchStmt->execute([$data['online_class_id']]);
    $classInfo = $fetchStmt->fetch(PDO::FETCH_ASSOC);

    if (!$classInfo) {
        echo json_encode(["success" => false, "message" => "Online class not found."]);
        exit();
    }

    $fee = floatval($classInfo['fee']);

    if ($fee > 0) {
        // Check balance
        $stmtUser = $pdo->prepare("SELECT wallet_balance FROM users WHERE id = ?");
        $stmtUser->execute([$data['student_id']]);
        $userRow = $stmtUser->fetch();

        if (!$userRow || floatval($userRow['wallet_balance']) < $fee) {
            echo json_encode(["success" => false, "message" => "Insufficient wallet balance to enroll."]);
            exit();
        }

        $pdo->beginTransaction();

        $stmtUpdateUser = $pdo->prepare("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?");
        $stmtUpdateUser->execute([$fee, $data['student_id']]);

        $stmtTx = $pdo->prepare("INSERT INTO wallet_transactions (user_id, amount, type, status, description) VALUES (?, ?, 'debit', 'approved', ?)");
        $stmtTx->execute([$data['student_id'], $fee, "Enrolled in online class: " . $classInfo['title']]);

        $stmt = $pdo->prepare("INSERT INTO online_class_enrollments (student_id, online_class_id) VALUES (?, ?)");
        $stmt->execute([$data['student_id'], $data['online_class_id']]);

        $pdo->commit();
    } else {
        $stmt = $pdo->prepare("INSERT INTO online_class_enrollments (student_id, online_class_id) VALUES (?, ?)");
        $stmt->execute([$data['student_id'], $data['online_class_id']]);
    }

    // Log Activity
    log_activity($pdo, $data['student_id'], 'Enrolled in Online Class', 'Enrolled in: ' . $classInfo['title'] . ($fee > 0 ? ' (LKR ' . number_format($fee, 2) . ')' : ' (Free)'));

    echo json_encode(["success" => true, "message" => "Successfully enrolled in the online class."]);

} catch (Exception $e) {
    if ($e->getCode() == 23000) { // Integrity constraint violation (UNIQUE)
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        echo json_encode(["success" => false, "message" => "You are already enrolled."]);
    } else {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
    }
}
?>
