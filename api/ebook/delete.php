<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->resourceId) || !isset($data->role)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

$resourceId = intval($data->resourceId);
$role = cleanText($data->role);

if ($role !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized. Only administrators can delete e-book resources."]);
    exit();
}

try {
    ensureEbookResourcesTable($pdo);

    $stmt = $pdo->prepare("DELETE FROM ebook_resources WHERE id = ?");
    $stmt->execute([$resourceId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "E-book resource deleted successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "E-book resource not found."]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to delete e-book resource: " . $e->getMessage()]);
}
?>
