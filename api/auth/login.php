<?php
 require_once '../db/config.php';
 require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../lib/logger.php';
 header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->phoneNumber) || !isset($data->password)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

$phoneNumber = htmlspecialchars(strip_tags($data->phoneNumber));
$password = $data->password;

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE phone_number = ?");
    $stmt->execute([$phoneNumber]);
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user['status'] === 'suspended') {
            log_activity($pdo, $user['id'], 'Login Failed', 'Account is suspended.');
            echo json_encode(["success" => false, "message" => "Your account has been suspended. Please contact the administrator."]);
            exit();
        }

        if (password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']);
            log_activity($pdo, $user['id'], 'Logged In', 'User logged into the system.');
            echo json_encode([
                "success" => true, 
                "message" => "Welcome back, " . $user['full_name'] . "!",
                "user" => $user
            ]);
        } else {
            log_activity($pdo, $user['id'], 'Login Failed', 'Invalid password attempted.');
            echo json_encode(["success" => false, "message" => "Invalid phone number or password."]);
        }
    } else {
        log_activity($pdo, null, 'Login Failed', 'Invalid phone number attempted: ' . $phoneNumber);
        echo json_encode(["success" => false, "message" => "Invalid phone number or password."]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "An error occurred. Database might be missing."]);
}
?>
