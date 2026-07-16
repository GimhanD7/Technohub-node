<?php
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../lib/logger.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['phoneNumber'])) {
    echo json_encode(["success" => false, "message" => "Phone number is required."]);
    exit();
}

$phoneNumber = $data['phoneNumber'];
$password = $data['password'] ?? null;

$fullName = htmlspecialchars(strip_tags($data['fullName']));
$address = htmlspecialchars(strip_tags($data['address']));
$educationInfo = isset($data['educationInfo']) ? htmlspecialchars(strip_tags($data['educationInfo'])) : null;
$educationCategory = isset($data['educationCategory']) && trim($data['educationCategory']) !== '' ? htmlspecialchars(strip_tags($data['educationCategory'])) : null;
$email = isset($data['email']) ? (trim($data['email']) !== '' ? htmlspecialchars(strip_tags($data['email'])) : null) : null;
$birthdate = isset($data['birthdate']) ? (trim($data['birthdate']) !== '' ? htmlspecialchars(strip_tags($data['birthdate'])) : null) : null;
$subject = isset($data['subject']) ? htmlspecialchars(strip_tags($data['subject'])) : null;
$experience = isset($data['experience']) ? htmlspecialchars(strip_tags($data['experience'])) : null;
$certifications = isset($data['certifications']) ? htmlspecialchars(strip_tags($data['certifications'])) : null;
$profilePicture = isset($data['profilePicture']) ? htmlspecialchars(strip_tags($data['profilePicture'])) : null;

if (!$fullName || !$address) {
    echo json_encode(["success" => false, "message" => "Full name and address are required."]);
    exit();
}

try {
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE phone_number = ?");
    $stmt->execute([$phoneNumber]);
    
    if ($stmt->rowCount() == 0) {
        echo json_encode(["success" => false, "message" => "User not found."]);
        exit();
    }

    // Check if email is already taken by someone else
    if ($email) {
        $checkEmail = $pdo->prepare("SELECT id FROM users WHERE email = ? AND phone_number != ?");
        $checkEmail->execute([$email, $phoneNumber]);
        if ($checkEmail->rowCount() > 0) {
            echo json_encode(["success" => false, "message" => "Email address is already in use by another account."]);
            exit();
        }
    }

    // Update user profile
    if ($password && strlen($password) > 0) {
        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $updateStmt = $pdo->prepare("UPDATE users SET full_name = ?, address = ?, education_info = ?, education_category = ?, email = ?, birthdate = ?, password_hash = ?, subject = ?, experience = ?, certifications = ?, profile_picture = ? WHERE phone_number = ?");
        $updateStmt->execute([$fullName, $address, $educationInfo, $educationCategory, $email, $birthdate, $hashed, $subject, $experience, $certifications, $profilePicture, $phoneNumber]);
    } else {
        $updateStmt = $pdo->prepare("UPDATE users SET full_name = ?, address = ?, education_info = ?, education_category = ?, email = ?, birthdate = ?, subject = ?, experience = ?, certifications = ?, profile_picture = ? WHERE phone_number = ?");
        $updateStmt->execute([$fullName, $address, $educationInfo, $educationCategory, $email, $birthdate, $subject, $experience, $certifications, $profilePicture, $phoneNumber]);
    }
    
    // Fetch the updated user data to return
    $stmt = $pdo->prepare("SELECT id, index_number, full_name, phone_number, email, birthdate, address, education_info, education_category, role, subject, experience, certifications, profile_picture FROM users WHERE phone_number = ?");
    $stmt->execute([$phoneNumber]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    log_activity($pdo, $user['id'], 'Updated Profile', 'User updated their profile information.');
    echo json_encode(["success" => true, "message" => "Profile updated successfully!", "user" => $user]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error updating profile: " . $e->getMessage()]);
}
?>
