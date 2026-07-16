<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['id']) || !isset($data['status'])) {
    echo json_encode(["success" => false, "message" => "User ID and new status are required."]);
    exit();
}

$id = $data['id'];
$status = $data['status']; // 'active' or 'suspended'

if (!in_array($status, ['active', 'suspended'])) {
    echo json_encode(["success" => false, "message" => "Invalid status value."]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "User status updated to " . $status . "."]);
    } else {
        echo json_encode(["success" => false, "message" => "User not found or status is already " . $status . "."]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Backend Error: " . $e->getMessage()]);
}
?>
