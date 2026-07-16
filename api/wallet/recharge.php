<?php
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../lib/logger.php';
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit();
}

$user_id = $_POST['user_id'] ?? null;
$amount = $_POST['amount'] ?? null;
$reference = $_POST['reference'] ?? null;

if (!$user_id || !$amount || !is_numeric($amount) || $amount <= 0) {
    echo json_encode(["success" => false, "message" => "Valid user ID and positive amount are required."]);
    exit();
}

if (!isset($_FILES['slip'])) {
    echo json_encode(["success" => false, "message" => "Payment slip image is required."]);
    exit();
}

$file = $_FILES['slip'];
$maxSize = 5 * 1024 * 1024; // 5MB
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

// Validate file size
if ($file['size'] > $maxSize) {
    echo json_encode(["success" => false, "message" => "File size exceeds 5MB limit."]);
    exit();
}

// Validate file type
if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(["success" => false, "message" => "Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF are allowed."]);
    exit();
}

// Check for upload errors
if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "Upload error: " . $file['error']]);
    exit();
}

try {
    // Create upload directory if it doesn't exist
    $uploadDir = __DIR__ . '/../../uploads/slips/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generate unique filename
    $fileExt = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'slip_' . $user_id . '_' . time() . '_' . uniqid() . '.' . $fileExt;
    $filepath = $uploadDir . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        echo json_encode(["success" => false, "message" => "Failed to save uploaded slip."]);
        exit();
    }

    // Return the relative path for storage in database
    $relativePath = '/uploads/slips/' . $filename;

    // Insert into wallet_transactions
    $stmt = $pdo->prepare("INSERT INTO wallet_transactions (user_id, amount, type, status, payment_slip_url, reference_number, description) VALUES (?, ?, 'credit', 'pending', ?, ?, 'Wallet Recharge Request')");
    $stmt->execute([$user_id, $amount, $relativePath, $reference]);

    log_activity($pdo, $user_id, 'Wallet Recharge Request', "User requested recharge of $amount points. Ref: $reference");

    echo json_encode([
        "success" => true,
        "message" => "Recharge request submitted successfully and is pending approval."
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error submitting recharge request: " . $e->getMessage()]);
}
?>
