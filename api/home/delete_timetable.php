<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));
if (!$data || !isset($data->role) || !isset($data->rowId)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

if (cleanText($data->role) !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized."]);
    exit();
}

try {
    ensureHomeTables($pdo);
    $stmt = $pdo->prepare("DELETE FROM home_timetable WHERE id = ?");
    $stmt->execute([intval($data->rowId)]);
    echo json_encode(["success" => true, "message" => "Timetable row deleted."]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to delete timetable row: " . $e->getMessage()]);
}
?>
