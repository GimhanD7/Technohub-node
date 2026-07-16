<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['id'])) {
    echo json_encode(["success" => false, "message" => "User ID is required."]);
    exit();
}

$id = $data['id'];

try {
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "User successfully deleted."]);
    } else {
        echo json_encode(["success" => false, "message" => "No user found with that ID."]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error deleting user: " . $e->getMessage()]);
}
?>
