<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));
if (!$data || !isset($data->role) || !isset($data->imageUrl) || !isset($data->title)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

if (cleanText($data->role) !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized."]);
    exit();
}

$slideId = isset($data->slideId) ? intval($data->slideId) : 0;
$imageUrl = cleanText($data->imageUrl);
$title = cleanText($data->title);
$label = cleanNullableText($data->label ?? "");
$sortOrder = isset($data->sortOrder) ? intval($data->sortOrder) : 0;
$isActive = isset($data->isActive) && !$data->isActive ? 0 : 1;

if ($imageUrl === "" || $title === "") {
    echo json_encode(["success" => false, "message" => "Slide image and title are required."]);
    exit();
}

try {
    ensureHomeTables($pdo);

    if ($slideId > 0) {
        $stmt = $pdo->prepare("UPDATE home_slides SET image_url = ?, title = ?, label = ?, sort_order = ?, is_active = ? WHERE id = ?");
        $stmt->execute([$imageUrl, $title, $label, $sortOrder, $isActive, $slideId]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO home_slides (image_url, title, label, sort_order, is_active) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$imageUrl, $title, $label, $sortOrder, $isActive]);
        $slideId = intval($pdo->lastInsertId());
    }

    echo json_encode(["success" => true, "message" => "Home slide saved.", "slideId" => $slideId]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to save slide: " . $e->getMessage()]);
}
?>
