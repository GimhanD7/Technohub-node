<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

try {
    $stmt = $pdo->query("SELECT id, full_name, role FROM users ORDER BY full_name ASC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "users" => $users]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error fetching users: " . $e->getMessage()]);
}
?>
