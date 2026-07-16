<?php
require_once '../db/config.php';
header("Content-Type: application/json");

if (!isset($_FILES['resource'])) {
    echo json_encode(["success" => false, "message" => "No resource file provided."]);
    exit();
}

$file = $_FILES['resource'];
$maxSize = 25 * 1024 * 1024;
$allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp'
];

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "Upload error: " . $file['error']]);
    exit();
}

if ($file['size'] > $maxSize) {
    echo json_encode(["success" => false, "message" => "File size exceeds the 25MB limit."]);
    exit();
}

if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(["success" => false, "message" => "Invalid file type. Upload PDF, Word, PowerPoint, Excel, or image resources."]);
    exit();
}

try {
    $uploadDir = __DIR__ . '/../../uploads/ebooks/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $filename = 'ebook_' . time() . '_' . uniqid() . '.' . $fileExt;
    $filepath = $uploadDir . $filename;

    // Check if it is an image that can be compressed
    $isImage = in_array($file['type'], ['image/jpeg', 'image/png', 'image/webp']);

    if ($isImage) {
        // Compress the image
        $sourceImage = null;
        if ($file['type'] == 'image/jpeg') {
            $sourceImage = imagecreatefromjpeg($file['tmp_name']);
        } elseif ($file['type'] == 'image/png') {
            $sourceImage = imagecreatefrompng($file['tmp_name']);
        } elseif ($file['type'] == 'image/webp') {
            $sourceImage = imagecreatefromwebp($file['tmp_name']);
        }

        if ($sourceImage) {
            // Get original dimensions
            $width = imagesx($sourceImage);
            $height = imagesy($sourceImage);

            // Calculate new dimensions (max width/height 800px to ensure small size)
            $maxWidth = 800;
            $maxHeight = 800;
            if ($width > $maxWidth || $height > $maxHeight) {
                $ratio = min($maxWidth / $width, $maxHeight / $height);
                $newWidth = (int)($width * $ratio);
                $newHeight = (int)($height * $ratio);
            } else {
                $newWidth = $width;
                $newHeight = $height;
            }

            // Create new image
            $compressedImage = imagecreatetruecolor($newWidth, $newHeight);
            
            // Handle transparency for PNG and WebP
            if ($file['type'] == 'image/png' || $file['type'] == 'image/webp') {
                imagealphablending($compressedImage, false);
                imagesavealpha($compressedImage, true);
                $transparent = imagecolorallocatealpha($compressedImage, 255, 255, 255, 127);
                imagefilledrectangle($compressedImage, 0, 0, $newWidth, $newHeight, $transparent);
            }

            imagecopyresampled($compressedImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

            // Save compressed image. We overwrite the original tmp file before moving
            if ($file['type'] == 'image/jpeg') {
                imagejpeg($compressedImage, $file['tmp_name'], 30); // 30% quality for very small size
            } elseif ($file['type'] == 'image/png') {
                imagepng($compressedImage, $file['tmp_name'], 9); // Max compression level 9
            } elseif ($file['type'] == 'image/webp') {
                imagewebp($compressedImage, $file['tmp_name'], 30); // 30% quality
            }

            imagedestroy($sourceImage);
            imagedestroy($compressedImage);
        }
    }

    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        echo json_encode(["success" => false, "message" => "Failed to save uploaded file."]);
        exit();
    }

    // Update the final file size after compression
    $finalSize = filesize($filepath);

    echo json_encode([
        "success" => true,
        "message" => "Resource uploaded successfully.",
        "fileUrl" => '/uploads/ebooks/' . $filename,
        "fileName" => $file['name'],
        "fileType" => $file['type'],
        "fileSize" => $finalSize
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Upload error: " . $e->getMessage()]);
}
?>
