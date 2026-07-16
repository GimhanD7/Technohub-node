<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->role) || !isset($data->resourceId) || !isset($data->title) || !isset($data->subject) || !isset($data->category) || !isset($data->level) || !isset($data->fileUrl)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

$role = cleanText($data->role);
$resourceId = intval($data->resourceId);
$title = cleanText($data->title);
$author = isset($data->author) ? cleanNullableText($data->author) : null;
$subject = cleanText($data->subject);
$category = cleanText($data->category);
$level = cleanText($data->level);
$description = isset($data->description) ? cleanNullableText($data->description) : null;
$fileUrl = cleanText($data->fileUrl);
$coverUrl = isset($data->coverUrl) ? cleanNullableText($data->coverUrl) : null;
$fileType = isset($data->fileType) ? cleanNullableText($data->fileType) : null;
$fileSize = isset($data->fileSize) && $data->fileSize !== "" ? intval($data->fileSize) : null;
$isFeatured = isset($data->isFeatured) && $data->isFeatured ? 1 : 0;
$isPublished = isset($data->isPublished) && !$data->isPublished ? 0 : 1;

if ($role !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized. Only administrators can edit e-book resources."]);
    exit();
}

if ($resourceId <= 0 || $title === "" || $subject === "" || $category === "" || $level === "" || $fileUrl === "") {
    echo json_encode(["success" => false, "message" => "Title, subject, category, level, and resource file are required."]);
    exit();
}

try {
    ensureEbookResourcesTable($pdo);

    $stmt = $pdo->prepare("UPDATE ebook_resources
        SET title = ?, author = ?, subject = ?, category = ?, level = ?, description = ?, file_url = ?, cover_url = ?, file_type = ?, file_size = ?, is_featured = ?, is_published = ?
        WHERE id = ?");
    $stmt->execute([
        $title,
        $author,
        $subject,
        $category,
        $level,
        $description,
        $fileUrl,
        $coverUrl,
        $fileType,
        $fileSize,
        $isFeatured,
        $isPublished,
        $resourceId
    ]);

    echo json_encode([
        "success" => true,
        "message" => "E-book resource updated successfully.",
        "resourceId" => $resourceId
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to update e-book resource: " . $e->getMessage()]);
}
?>
