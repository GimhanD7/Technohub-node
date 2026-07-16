<?php
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../lib/logger.php';
header("Content-Type: application/json");

// Read JSON input
$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->phoneNumber)) {
    echo json_encode(["success" => false, "message" => "Phone number is required."]);
    exit();
}

$phoneNumber = htmlspecialchars(strip_tags($data->phoneNumber));

try {
    // Check if user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE phone_number = ?");
    $stmt->execute([$phoneNumber]);
    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Phone number is already registered."]);
        exit();
    }

    // Generate 6-digit OTP
    $otpCode = sprintf("%06d", mt_rand(100000, 999999));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+5 minutes'));

    // Insert or update OTP
    $stmt = $pdo->prepare("INSERT INTO otps (phone_number, otp_code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp_code = VALUES(otp_code), expires_at = VALUES(expires_at), created_at = CURRENT_TIMESTAMP");
    $stmt->execute([$phoneNumber, $otpCode, $expiresAt]);

    // Send SMS via Text.lk API
    $apiKey = "5699|p87wUERdDtxFnhjHSoIAtovVaGUPQtSfM5LzvZIDf59a80e3";
    
    // Format phone number (assuming text.lk needs 947...)
    // If it starts with 0, replace with 94
    $formattedPhone = $phoneNumber;
    if (strpos($formattedPhone, '0') === 0) {
        $formattedPhone = '94' . substr($formattedPhone, 1);
    }

    $smsUrl = 'https://app.text.lk/api/v3/sms/send';
    $payload = json_encode([
        'recipient' => $formattedPhone,
        'sender_id' => 'Text.lk',
        'type'      => 'plain',
        'message'   => "Your Techno-Hub registration OTP is: " . $otpCode . ". Valid for 5 minutes."
    ]);

    $ch = curl_init($smsUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
        'Accept: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $responseData = json_decode($response, true);

    if ($httpCode >= 200 && $httpCode < 300) {
        echo json_encode(["success" => true, "message" => "OTP sent successfully!"]);
    } else {
        // Log the error for debugging
        error_log("Text.lk API Error: " . $response);
        echo json_encode(["success" => false, "message" => "Failed to send OTP. Please try again. " . (isset($responseData['message']) ? $responseData['message'] : '')]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Backend Error: " . $e->getMessage()]);
}
?>
