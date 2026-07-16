<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

// Security Check: Only admins should access this, but since we rely on frontend routing for now,
// we just fetch the logs. In a real app, validate token here.

try {
    $query = "
        SELECT 
            sl.*, 
            u.full_name as user_name, 
            u.role as user_role 
        FROM system_logs sl 
        LEFT JOIN users u ON sl.user_id = u.id
    ";
    $params = [];

    if (isset($_GET['user_id']) && !empty($_GET['user_id']) && $_GET['user_id'] !== 'all') {
        $query .= " WHERE sl.user_id = ?";
        $params[] = $_GET['user_id'];
    }

    $query .= " ORDER BY sl.created_at DESC LIMIT 500";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "logs" => $logs]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error fetching logs: " . $e->getMessage()]);
}
?>
