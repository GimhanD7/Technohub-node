<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->role) || !isset($data->messageId) || !isset($data->status)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

$role = cleanText($data->role);
$messageId = intval($data->messageId);
$status = cleanText($data->status);
$allowedStatuses = ['new', 'read', 'closed'];

if ($role !== 'admin' || !in_array($status, $allowedStatuses)) {
    echo json_encode(["success" => false, "message" => "Unauthorized or invalid status."]);
    exit();
}

try {
    ensureContactTables($pdo);

    $stmt = $pdo->prepare("UPDATE contact_messages SET status = ? WHERE id = ?");
    $stmt->execute([$status, $messageId]);

    echo json_encode(["success" => true, "message" => "Message status updated."]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to update message: " . $e->getMessage()]);
}
?>
