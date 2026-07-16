<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../db/config.php';

// Read JSON input
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit;
}

$user_id = intval($data['user_id']);

try {
    // 1. Update last_notification_read_at in users table
    $stmtUser = $pdo->prepare("UPDATE users SET last_notification_read_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmtUser->execute([$user_id]);

    // 2. Mark targeted notifications as read
    $stmtNotifs = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0");
    $stmtNotifs->execute([$user_id]);

    echo json_encode(['success' => true, 'message' => 'Notifications marked as read']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
