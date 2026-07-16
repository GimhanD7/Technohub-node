<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['fullName']) || !isset($data['phoneNumber']) || !isset($data['role'])) {
    echo json_encode(["success" => false, "message" => "Full Name, Phone Number, and Role are required."]);
    exit();
}

$fullName = htmlspecialchars(strip_tags($data['fullName']));
$phoneNumber = htmlspecialchars(strip_tags($data['phoneNumber']));
$role = htmlspecialchars(strip_tags($data['role']));
$email = isset($data['email']) && trim($data['email']) !== '' ? htmlspecialchars(strip_tags($data['email'])) : null;
$birthdate = isset($data['birthdate']) && trim($data['birthdate']) !== '' ? htmlspecialchars(strip_tags($data['birthdate'])) : null;
$educationCategory = isset($data['educationCategory']) && trim($data['educationCategory']) !== '' ? htmlspecialchars(strip_tags($data['educationCategory'])) : null;
$subject = isset($data['subject']) && trim($data['subject']) !== '' ? htmlspecialchars(strip_tags($data['subject'])) : null;
$experience = isset($data['experience']) && trim($data['experience']) !== '' ? htmlspecialchars(strip_tags($data['experience'])) : null;
$certifications = isset($data['certifications']) && trim($data['certifications']) !== '' ? htmlspecialchars(strip_tags($data['certifications'])) : null;
$profilePicture = isset($data['profilePicture']) && trim($data['profilePicture']) !== '' ? htmlspecialchars(strip_tags($data['profilePicture'])) : null;
// Default password logic
$rawPassword = isset($data['password']) && !empty($data['password']) ? $data['password'] : 'password123';
$passwordHash = password_hash($rawPassword, PASSWORD_DEFAULT);

try {
    // Check if phone or email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE phone_number = ? OR (email IS NOT NULL AND email = ?)");
    $stmt->execute([$phoneNumber, $email]);
    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Phone number or email is already registered."]);
        exit();
    }

    // Generate new Index Number
    $stmtMax = $pdo->query("SELECT MAX(CAST(SUBSTRING_INDEX(index_number, '-', -1) AS UNSIGNED)) as max_num FROM users WHERE index_number IS NOT NULL");
    $maxData = $stmtMax->fetch(PDO::FETCH_ASSOC);
    $nextNum = ($maxData['max_num'] ? $maxData['max_num'] : 1000) + 1;
    $newIndex = "TH-" . str_pad($nextNum, 4, "0", STR_PAD_LEFT);

    // Insert into DB
    $query = "INSERT INTO users (index_number, full_name, phone_number, email, birthdate, password_hash, role, education_category, subject, experience, certifications, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($query);

    if ($stmt->execute([$newIndex, $fullName, $phoneNumber, $email, $birthdate, $passwordHash, $role, $educationCategory, $subject, $experience, $certifications, $profilePicture])) {
        echo json_encode(["success" => true, "message" => "User successfully added."]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to add user."]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Backend Error: " . $e->getMessage()]);
}
?>
