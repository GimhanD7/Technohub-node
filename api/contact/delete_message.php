<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->role) || !isset($data->messageId)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

$role = cleanText($data->role);
$messageId = intval($data->messageId);

if ($role !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized."]);
    exit();
}

try {
    ensureContactTables($pdo);

    $stmt = $pdo->prepare("DELETE FROM contact_messages WHERE id = ?");
    $stmt->execute([$messageId]);

    echo json_encode(["success" => true, "message" => "Contact message deleted."]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to delete message: " . $e->getMessage()]);
}
?>
