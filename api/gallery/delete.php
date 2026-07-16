<?php
require_once '../db/config.php';
require_once './_helpers.php';
require_once '../lib/logger.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->itemId) || !isset($data->role)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

$itemId = intval($data->itemId);
$role = cleanText($data->role);
$userId = isset($data->userId) ? intval($data->userId) : null;

if ($role !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized. Only administrators can delete gallery items."]);
    exit();
}

try {
    ensureGalleryItemsTable($pdo);

    $stmt = $pdo->prepare("DELETE FROM gallery_items WHERE id = ?");
    $stmt->execute([$itemId]);

    if ($stmt->rowCount() > 0) {
        log_activity($pdo, $userId, "Gallery Item Deleted", "Deleted gallery item ID: $itemId");
        echo json_encode(["success" => true, "message" => "Gallery item deleted successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "Gallery item not found."]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to delete gallery item: " . $e->getMessage()]);
}
?>
