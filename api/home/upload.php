<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

if (!isset($_FILES['image'])) {
    echo json_encode(["success" => false, "message" => "No image provided."]);
    exit();
}

$file = $_FILES['image'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$maxSize = 8 * 1024 * 1024;

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "Upload error: " . $file['error']]);
    exit();
}

if ($file['size'] > $maxSize || !in_array($file['type'], $allowedTypes)) {
    echo json_encode(["success" => false, "message" => "Upload JPG, PNG, WebP, or GIF images up to 8MB."]);
    exit();
}

try {
    $uploadDir = __DIR__ . '/../../uploads/home/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $filename = 'home_' . time() . '_' . uniqid() . '.' . $fileExt;
    $filepath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        echo json_encode(["success" => false, "message" => "Failed to save uploaded image."]);
        exit();
    }

    echo json_encode([
        "success" => true,
        "message" => "Image uploaded successfully.",
        "imageUrl" => publicAssetUrl('/uploads/home/' . $filename),
        "fileName" => $file['name']
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Upload error: " . $e->getMessage()]);
}
?>
