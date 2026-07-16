<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Only POST requests are allowed."]);
    exit();
}

if (!isset($_FILES['resource'])) {
    echo json_encode(["success" => false, "message" => "Choose a PDF file to upload."]);
    exit();
}

$file = $_FILES['resource'];
$maxSize = 25 * 1024 * 1024;

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "Upload failed with error code " . $file['error'] . "."]);
    exit();
}

if ($file['size'] <= 0 || $file['size'] > $maxSize) {
    echo json_encode(["success" => false, "message" => "PDF files must be smaller than 25MB."]);
    exit();
}

$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$mimeType = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);

if ($extension !== 'pdf' || $mimeType !== 'application/pdf') {
    echo json_encode(["success" => false, "message" => "Only valid PDF files can be uploaded here."]);
    exit();
}

try {
    $uploadDir = __DIR__ . '/../../uploads/course-materials/';

    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        echo json_encode(["success" => false, "message" => "Could not create the course material folder."]);
        exit();
    }

    if (!is_writable($uploadDir)) {
        echo json_encode(["success" => false, "message" => "The course material folder is not writable."]);
        exit();
    }

    $filename = 'material_' . time() . '_' . bin2hex(random_bytes(5)) . '.pdf';
    $filepath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        echo json_encode(["success" => false, "message" => "Failed to save the uploaded PDF."]);
        exit();
    }

    echo json_encode([
        "success" => true,
        "message" => "PDF uploaded successfully.",
        "fileUrl" => "/uploads/course-materials/" . $filename,
        "fileName" => $file['name'],
        "fileSize" => filesize($filepath)
    ]);
} catch (Throwable $e) {
    echo json_encode(["success" => false, "message" => "Upload error: " . $e->getMessage()]);
}
?>
