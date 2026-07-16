<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));
if (!$data || !isset($data->role) || !isset($data->day) || !isset($data->time) || !isset($data->title)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

if (cleanText($data->role) !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized."]);
    exit();
}

$rowId = isset($data->rowId) ? intval($data->rowId) : 0;
$day = cleanText($data->day);
$time = cleanText($data->time);
$title = cleanText($data->title);
$mode = cleanNullableText($data->mode ?? "");
$sortOrder = isset($data->sortOrder) ? intval($data->sortOrder) : 0;
$isActive = isset($data->isActive) && !$data->isActive ? 0 : 1;

if ($day === "" || $time === "" || $title === "") {
    echo json_encode(["success" => false, "message" => "Day, time, and title are required."]);
    exit();
}

try {
    ensureHomeTables($pdo);

    if ($rowId > 0) {
        $stmt = $pdo->prepare("UPDATE home_timetable SET day_label = ?, time_label = ?, title = ?, mode_label = ?, sort_order = ?, is_active = ? WHERE id = ?");
        $stmt->execute([$day, $time, $title, $mode, $sortOrder, $isActive, $rowId]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO home_timetable (day_label, time_label, title, mode_label, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$day, $time, $title, $mode, $sortOrder, $isActive]);
        $rowId = intval($pdo->lastInsertId());
    }

    echo json_encode(["success" => true, "message" => "Timetable row saved.", "rowId" => $rowId]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to save timetable row: " . $e->getMessage()]);
}
?>
