<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['id'])) {
    echo json_encode(["success" => false, "message" => "User ID is required."]);
    exit();
}

$id = $data['id'];
$fullName = isset($data['fullName']) ? htmlspecialchars(strip_tags($data['fullName'])) : null;
$phoneNumber = isset($data['phoneNumber']) ? htmlspecialchars(strip_tags($data['phoneNumber'])) : null;
$email = isset($data['email']) ? (trim($data['email']) !== '' ? htmlspecialchars(strip_tags($data['email'])) : null) : false;
$birthdate = isset($data['birthdate']) ? (trim($data['birthdate']) !== '' ? htmlspecialchars(strip_tags($data['birthdate'])) : null) : false;
$role = isset($data['role']) ? htmlspecialchars(strip_tags($data['role'])) : null;
$educationCategory = isset($data['educationCategory']) && trim($data['educationCategory']) !== '' ? htmlspecialchars(strip_tags($data['educationCategory'])) : null;
$subject = isset($data['subject']) && trim($data['subject']) !== '' ? htmlspecialchars(strip_tags($data['subject'])) : null;
$experience = isset($data['experience']) && trim($data['experience']) !== '' ? htmlspecialchars(strip_tags($data['experience'])) : null;
$certifications = isset($data['certifications']) && trim($data['certifications']) !== '' ? htmlspecialchars(strip_tags($data['certifications'])) : null;
$profilePicture = isset($data['profilePicture']) && trim($data['profilePicture']) !== '' ? htmlspecialchars(strip_tags($data['profilePicture'])) : null;
$password = isset($data['password']) && !empty(trim($data['password'])) ? trim($data['password']) : null;

try {
    // Check if another user has the same phone or email
    if ($phoneNumber || $email) {
        $checkStmt = $pdo->prepare("SELECT id FROM users WHERE id != ? AND (phone_number = ? OR (email IS NOT NULL AND email != '' AND email = ?))");
        $checkStmt->execute([$id, $phoneNumber, $email]);
        if ($checkStmt->rowCount() > 0) {
            echo json_encode(["success" => false, "message" => "Phone number or email is already taken by another user."]);
            exit();
        }
    }

    $updateFields = [];
    $params = [];

    if ($fullName) { $updateFields[] = "full_name = ?"; $params[] = $fullName; }
    if ($phoneNumber) { $updateFields[] = "phone_number = ?"; $params[] = $phoneNumber; }
    if ($email !== false) { $updateFields[] = "email = ?"; $params[] = $email; }
    if ($birthdate !== false) { $updateFields[] = "birthdate = ?"; $params[] = $birthdate; }
    if ($role) { $updateFields[] = "role = ?"; $params[] = $role; }
    if ($educationCategory) { $updateFields[] = "education_category = ?"; $params[] = $educationCategory; }
    if ($subject !== null) { $updateFields[] = "subject = ?"; $params[] = $subject; }
    if ($experience !== null) { $updateFields[] = "experience = ?"; $params[] = $experience; }
    if ($certifications !== null) { $updateFields[] = "certifications = ?"; $params[] = $certifications; }
    if ($profilePicture !== null) { $updateFields[] = "profile_picture = ?"; $params[] = $profilePicture; }
    if ($password) { $updateFields[] = "password_hash = ?"; $params[] = password_hash($password, PASSWORD_DEFAULT); }

    if (empty($updateFields)) {
        echo json_encode(["success" => true, "message" => "No changes provided."]);
        exit();
    }

    $params[] = $id; // For the WHERE clause
    
    $query = "UPDATE users SET " . implode(", ", $updateFields) . " WHERE id = ?";
    $stmt = $pdo->prepare($query);
    
    if ($stmt->execute($params)) {
        echo json_encode(["success" => true, "message" => "User details updated successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update user."]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Backend Error: " . $e->getMessage()]);
}
?>
