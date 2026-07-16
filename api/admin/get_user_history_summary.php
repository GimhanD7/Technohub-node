<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

try {
    $query = "
        SELECT 
            u.id, 
            u.full_name, 
            u.role,
            u.index_number,
            (SELECT COUNT(*) FROM system_logs WHERE user_id = u.id AND action = 'Logged In') as login_count,
            (SELECT ip_address FROM system_logs WHERE user_id = u.id AND action = 'Logged In' ORDER BY created_at DESC LIMIT 1) as last_ip,
            (SELECT created_at FROM system_logs WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_active
        FROM users u
        ORDER BY last_active DESC, u.full_name ASC
    ";
    
    $stmt = $pdo->query($query);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "users" => $users]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error fetching summary: " . $e->getMessage()]);
}
?>
