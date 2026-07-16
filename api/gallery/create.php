<?php
require_once '../db/config.php';
require_once './_helpers.php';
require_once '../lib/logger.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->role) || !isset($data->title) || !isset($data->entryType) || !isset($data->category) || !isset($data->summary)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

$role = cleanText($data->role);
$userId = isset($data->userId) ? intval($data->userId) : null;
$title = cleanText($data->title);
$entryType = cleanText($data->entryType);
$category = cleanText($data->category);
$eventDate = isset($data->eventDate) ? cleanNullableText($data->eventDate) : null;
$location = isset($data->location) ? cleanNullableText($data->location) : null;
$summary = cleanText($data->summary);
$details = isset($data->details) ? cleanNullableText($data->details) : null;
$imageUrls = normalizeGalleryImageUrls($data->imageUrl ?? "", $data->imageUrls ?? []);
$imageUrl = count($imageUrls) > 0 ? $imageUrls[0] : "";
$ctaLabel = isset($data->ctaLabel) ? cleanNullableText($data->ctaLabel) : null;
$ctaUrl = isset($data->ctaUrl) ? cleanNullableText($data->ctaUrl) : null;
$isFeatured = isset($data->isFeatured) && $data->isFeatured ? 1 : 0;
$isPublished = isset($data->isPublished) && !$data->isPublished ? 0 : 1;
$allowedTypes = ['event', 'news', 'achievement', 'workshop'];

if ($role !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized. Only administrators can add gallery items."]);
    exit();
}

if (!in_array($entryType, $allowedTypes)) {
    echo json_encode(["success" => false, "message" => "Choose a valid gallery type."]);
    exit();
}

if ($title === "" || $category === "" || $summary === "" || count($imageUrls) === 0) {
    echo json_encode(["success" => false, "message" => "Title, type, category, summary, and at least one image are required."]);
    exit();
}

try {
    ensureGalleryItemsTable($pdo);

    $stmt = $pdo->prepare("INSERT INTO gallery_items
        (title, entry_type, category, event_date, location, summary, details, image_url, cta_label, cta_url, is_featured, is_published, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $title,
        $entryType,
        $category,
        $eventDate,
        $location,
        $summary,
        $details,
        $imageUrl,
        $ctaLabel,
        $ctaUrl,
        $isFeatured,
        $isPublished,
        $userId
    ]);

    $itemId = intval($pdo->lastInsertId());
    replaceGalleryImages($pdo, $itemId, $imageUrls);

    log_activity($pdo, $userId, "Gallery Item Created", "Added $entryType: $title");

    echo json_encode([
        "success" => true,
        "message" => "Gallery item added successfully.",
        "itemId" => $itemId
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to add gallery item: " . $e->getMessage()]);
}
?>
