<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../db/config.php';

try {
    $stmt = $pdo->query("
        SELECT n.*, u.full_name AS target_user_name, creator.full_name AS creator_name
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        LEFT JOIN users creator ON n.created_by = creator.id
        ORDER BY n.created_at DESC
    ");
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'notifications' => $notifications
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
