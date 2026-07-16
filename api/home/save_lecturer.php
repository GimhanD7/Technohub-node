<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));
if (!$data || !isset($data->role) || !isset($data->name) || !isset($data->subject)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

if (cleanText($data->role) !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized."]);
    exit();
}

$lecturerId = isset($data->lecturerId) ? intval($data->lecturerId) : 0;
$name = cleanText($data->name);
$subject = cleanText($data->subject);
$focus = cleanNullableText($data->focus ?? "");
$imageUrl = cleanNullableText($data->imageUrl ?? "");
$initials = cleanNullableText($data->initials ?? "");
$sortOrder = isset($data->sortOrder) ? intval($data->sortOrder) : 0;
$isActive = isset($data->isActive) && !$data->isActive ? 0 : 1;

if ($name === "" || $subject === "") {
    echo json_encode(["success" => false, "message" => "Lecturer name and subject are required."]);
    exit();
}

try {
    ensureHomeTables($pdo);

    if ($lecturerId > 0) {
        $stmt = $pdo->prepare("UPDATE home_lecturers SET name = ?, subject = ?, focus = ?, image_url = ?, initials = ?, sort_order = ?, is_active = ? WHERE id = ?");
        $stmt->execute([$name, $subject, $focus, $imageUrl, $initials, $sortOrder, $isActive, $lecturerId]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO home_lecturers (name, subject, focus, image_url, initials, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $subject, $focus, $imageUrl, $initials, $sortOrder, $isActive]);
        $lecturerId = intval($pdo->lastInsertId());
    }

    echo json_encode(["success" => true, "message" => "Lecturer card saved.", "lecturerId" => $lecturerId]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to save lecturer: " . $e->getMessage()]);
}
?>
