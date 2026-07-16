<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(["success" => false, "message" => "User ID is required."]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT wallet_balance FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode(["success" => true, "balance" => $user['wallet_balance']]);
    } else {
        echo json_encode(["success" => false, "message" => "User not found."]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error fetching balance: " . $e->getMessage()]);
}
?>
