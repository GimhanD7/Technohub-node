<?php
require_once '../db/config.php';
header("Content-Type: application/json");

if (!isset($_FILES['image']) && !isset($_FILES['images'])) {
    echo json_encode(["success" => false, "message" => "No gallery image provided."]);
    exit();
}

$maxSize = 8 * 1024 * 1024;
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

try {
    $uploadDir = __DIR__ . '/../../uploads/gallery/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $files = [];

    if (isset($_FILES['images']) && is_array($_FILES['images']['name'])) {
        foreach ($_FILES['images']['name'] as $index => $name) {
            $files[] = [
                'name' => $name,
                'type' => $_FILES['images']['type'][$index],
                'tmp_name' => $_FILES['images']['tmp_name'][$index],
                'error' => $_FILES['images']['error'][$index],
                'size' => $_FILES['images']['size'][$index]
            ];
        }
    } elseif (isset($_FILES['image'])) {
        $files[] = $_FILES['image'];
    }

    if (count($files) > 20) {
        echo json_encode(["success" => false, "message" => "Upload up to 20 images at once."]);
        exit();
    }

    $uploadedImages = [];

    foreach ($files as $file) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(["success" => false, "message" => "Upload error: " . $file['error']]);
            exit();
        }

        if ($file['size'] > $maxSize) {
            echo json_encode(["success" => false, "message" => "Each image must be 8MB or smaller."]);
            exit();
        }

        if (!in_array($file['type'], $allowedTypes)) {
            echo json_encode(["success" => false, "message" => "Invalid image type. Upload JPG, PNG, WebP, or GIF images."]);
            exit();
        }

        $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $filename = 'gallery_' . time() . '_' . uniqid() . '.' . $fileExt;
        $filepath = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            echo json_encode(["success" => false, "message" => "Failed to save uploaded image."]);
            exit();
        }

        $uploadedImages[] = [
            "imageUrl" => '/uploads/gallery/' . $filename,
            "fileName" => $file['name'],
            "fileType" => $file['type'],
            "fileSize" => filesize($filepath)
        ];
    }

    echo json_encode([
        "success" => true,
        "message" => "Gallery image uploaded successfully.",
        "imageUrl" => $uploadedImages[0]["imageUrl"] ?? "",
        "images" => $uploadedImages
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Upload error: " . $e->getMessage()]);
}
?>
