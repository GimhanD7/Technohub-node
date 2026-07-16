<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../db/config.php';

if (!isset($_GET['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit;
}

$user_id = intval($_GET['user_id']);

try {
    // Get user's last read timestamp
    $stmtUser = $pdo->prepare("SELECT last_notification_read_at FROM users WHERE id = ?");
    $stmtUser->execute([$user_id]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }

    $last_read_at = $user['last_notification_read_at'];

    // Fetch notifications (global and targeted)
    $stmtNotifs = $pdo->prepare("
        SELECT * FROM notifications 
        WHERE user_id = ? OR user_id IS NULL 
        ORDER BY created_at DESC 
        LIMIT 50
    ");
    $stmtNotifs->execute([$user_id]);
    $notifications = $stmtNotifs->fetchAll(PDO::FETCH_ASSOC);

    $unread_count = 0;
    
    // Determine read status for each notification
    foreach ($notifications as &$notif) {
        if ($notif['user_id'] === null) {
            // Global notification
            if ($last_read_at === null) {
                $notif['is_unread'] = true;
                $unread_count++;
            } else {
                $is_unread = strtotime($notif['created_at']) > strtotime($last_read_at);
                $notif['is_unread'] = $is_unread;
                if ($is_unread) $unread_count++;
            }
        } else {
            // Targeted notification
            $notif['is_unread'] = $notif['is_read'] == 0;
            if ($notif['is_unread']) $unread_count++;
        }
    }

    echo json_encode([
        'success' => true,
        'unread_count' => $unread_count,
        'notifications' => $notifications
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
