<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

try {
    $stmt = $pdo->query("SELECT id, index_number, full_name, email, phone_number, profile_picture FROM users WHERE role = 'teacher' AND status = 'active' ORDER BY full_name ASC");
    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "teachers" => $teachers]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
