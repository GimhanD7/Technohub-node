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

if (!isset($data['created_by']) || !isset($data['title']) || !isset($data['message'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

$created_by = intval($data['created_by']);
$title = $data['title'];
$message = $data['message'];
$type = isset($data['type']) ? $data['type'] : 'system';
$link = isset($data['link']) ? $data['link'] : null;
$user_id_raw = isset($data['user_id']) ? $data['user_id'] : null;

try {
    if ($user_id_raw === 'all_students' || $user_id_raw === 'all_teachers') {
        $role = $user_id_raw === 'all_students' ? 'student' : 'teacher';
        $stmtUsers = $pdo->prepare("SELECT id FROM users WHERE role = ?");
        $stmtUsers->execute([$role]);
        $users = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type, link, created_by) VALUES (?, ?, ?, ?, ?, ?)");
        
        $pdo->beginTransaction();
        foreach ($users as $u) {
            $stmt->execute([$u['id'], $title, $message, $type, $link, $created_by]);
        }
        $pdo->commit();

        echo json_encode(['success' => true, 'message' => 'Bulk notifications created successfully']);
    } else {
        $user_id = $user_id_raw !== null ? intval($user_id_raw) : null;
        $stmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type, link, created_by) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, $title, $message, $type, $link, $created_by]);

        echo json_encode([
            'success' => true,
            'message' => 'Notification created successfully',
            'notification_id' => $pdo->lastInsertId()
        ]);
    }

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
