<?php
require_once '../db/config.php';
header("Content-Type: application/json");

if (!isset($_FILES['image'])) {
    echo json_encode(["success" => false, "message" => "No image file provided."]);
    exit();
}

$file = $_FILES['image'];
$maxSize = 5 * 1024 * 1024; // 5MB
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Validate file size
if ($file['size'] > $maxSize) {
    echo json_encode(["success" => false, "message" => "File size exceeds 5MB limit."]);
    exit();
}

// Validate file type
if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(["success" => false, "message" => "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."]);
    exit();
}

// Check for upload errors
if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "Upload error: " . $file['error']]);
    exit();
}

try {
    // Create upload directory if it doesn't exist
    $uploadDir = __DIR__ . '/../../uploads/profiles/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename
    $fileExt = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'profile_' . time() . '_' . uniqid() . '.' . $fileExt;
    $filepath = $uploadDir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        echo json_encode(["success" => false, "message" => "Failed to save uploaded file."]);
        exit();
    }

    // Return the relative path for storage in database
    $relativePath = '/uploads/profiles/' . $filename;

    echo json_encode([
        "success" => true,
        "message" => "Image uploaded successfully.",
        "imageUrl" => $relativePath
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Upload error: " . $e->getMessage()]);
}
?>
