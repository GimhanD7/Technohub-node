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

if (!$data || !isset($data['student_id']) || !isset($data['course_id'])) {
    echo json_encode(["success" => false, "message" => "Student ID and Course ID are required."]);
    exit();
}

try {
    // Check if already enrolled
    $checkStmt = $pdo->prepare("SELECT id FROM course_enrollments WHERE student_id = ? AND course_id = ?");
    $checkStmt->execute([$data['student_id'], $data['course_id']]);
    
    if ($checkStmt->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "You are already enrolled in this course."]);
        exit();
    }

    // Fetch course info
    $fetchStmt = $pdo->prepare("SELECT title, points FROM courses WHERE id = ?");
    $fetchStmt->execute([$data['course_id']]);
    $courseInfo = $fetchStmt->fetch(PDO::FETCH_ASSOC);

    if (!$courseInfo) {
        echo json_encode(["success" => false, "message" => "Course not found."]);
        exit();
    }

    $fee = floatval($courseInfo['points']);

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
        $stmtTx->execute([$data['student_id'], $fee, "Enrolled in course: " . $courseInfo['title']]);

        $stmt = $pdo->prepare("INSERT INTO course_enrollments (student_id, course_id) VALUES (?, ?)");
        $stmt->execute([$data['student_id'], $data['course_id']]);

        $pdo->commit();
    } else {
        $stmt = $pdo->prepare("INSERT INTO course_enrollments (student_id, course_id) VALUES (?, ?)");
        $stmt->execute([$data['student_id'], $data['course_id']]);
    }

    // Log Activity
    log_activity($pdo, $data['student_id'], 'Enrolled in Course', 'Enrolled in: ' . $courseInfo['title'] . ($fee > 0 ? ' (LKR ' . number_format($fee, 2) . ')' : ' (Free)'));

    echo json_encode(["success" => true, "message" => "Successfully enrolled in the course."]);

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
