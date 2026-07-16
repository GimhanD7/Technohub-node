<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

try {
    $stmt = $pdo->query("SELECT id, index_number, full_name, phone_number, email, birthdate, address, education_info, education_category, role, status, wallet_balance, profile_picture, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "users" => $users
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error fetching users: " . $e->getMessage()
    ]);
}
?>
