<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

if (!isset($_GET['phone']) || !isset($_GET['role'])) {
    echo json_encode(["success" => false, "message" => "Please provide phone and role parameters."]);
    exit();
}

$phone = $_GET['phone'];
$role = $_GET['role'];

// Only allow these 3 roles
if (!in_array($role, ['student', 'teacher', 'admin'])) {
    echo json_encode(["success" => false, "message" => "Invalid role. Must be student, teacher, or admin."]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE phone_number = ?");
    $stmt->execute([$role, $phone]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "Successfully updated role of $phone to $role"]);
    } else {
        echo json_encode(["success" => false, "message" => "No user found with that phone number."]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>
