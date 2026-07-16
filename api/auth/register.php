<?php
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../lib/logger.php';
header("Content-Type: application/json");

// Read JSON input
$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->fullName) || !isset($data->phoneNumber) || !isset($data->password) || !isset($data->otp)) {
    echo json_encode(["success" => false, "message" => "Invalid input data. OTP is required."]);
    exit();
}

$fullName = htmlspecialchars(strip_tags($data->fullName));
$phoneNumber = htmlspecialchars(strip_tags($data->phoneNumber));
$address = isset($data->address) ? htmlspecialchars(strip_tags($data->address)) : '';
$educationCategory = isset($data->educationCategory) ? htmlspecialchars(strip_tags($data->educationCategory)) : null;
$password = $data->password;

try {
    $otp = htmlspecialchars(strip_tags($data->otp));

    // Verify OTP
    $stmtOtp = $pdo->prepare("SELECT id, expires_at FROM otps WHERE phone_number = ? AND otp_code = ?");
    $stmtOtp->execute([$phoneNumber, $otp]);
    
    if ($stmtOtp->rowCount() === 0) {
        echo json_encode(["success" => false, "message" => "Invalid or expired OTP."]);
        exit();
    }
    
    $otpRow = $stmtOtp->fetch();
    if (strtotime($otpRow['expires_at']) < time()) {
        echo json_encode(["success" => false, "message" => "OTP has expired. Please request a new one."]);
        exit();
    }

    // Check if user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE phone_number = ?");
    $stmt->execute([$phoneNumber]);
    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Phone number is already registered."]);
        exit();
    }

    // Generate new Index Number
    $stmtMax = $pdo->query("SELECT MAX(CAST(SUBSTRING_INDEX(index_number, '-', -1) AS UNSIGNED)) as max_num FROM users WHERE index_number IS NOT NULL");
    $maxData = $stmtMax->fetch(PDO::FETCH_ASSOC);
    $nextNum = ($maxData['max_num'] ? $maxData['max_num'] : 1000) + 1;
    $newIndex = "TH-" . str_pad($nextNum, 4, "0", STR_PAD_LEFT);

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Insert into DB
    $query = "INSERT INTO users (index_number, full_name, phone_number, address, password_hash, education_category) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($query);

    if ($stmt->execute([$newIndex, $fullName, $phoneNumber, $address, $passwordHash, $educationCategory])) {
        $newUserId = $pdo->lastInsertId();
        
        // Remove OTP after successful registration
        $pdo->prepare("DELETE FROM otps WHERE phone_number = ?")->execute([$phoneNumber]);
        
        log_activity($pdo, $newUserId, 'Account Created', 'User registered a new student account.');
        echo json_encode(["success" => true, "message" => "Registration successful! You can now log in."]);
    } else {
        echo json_encode(["success" => false, "message" => "Registration failed. Please try again."]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Backend Error: " . $e->getMessage()]);
}
?>
