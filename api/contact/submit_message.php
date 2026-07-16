<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->fullName) || !isset($data->subject) || !isset($data->message)) {
    echo json_encode(["success" => false, "message" => "Please complete the required contact fields."]);
    exit();
}

$fullName = cleanText($data->fullName);
$email = cleanNullableText($data->email ?? "");
$phone = cleanNullableText($data->phone ?? "");
$learnerType = cleanNullableText($data->learnerType ?? "");
$subject = cleanText($data->subject);
$message = cleanText($data->message);

if ($fullName === "" || $subject === "" || $message === "") {
    echo json_encode(["success" => false, "message" => "Name, subject, and message are required."]);
    exit();
}

try {
    ensureContactTables($pdo);

    $stmt = $pdo->prepare("INSERT INTO contact_messages (full_name, email, phone, learner_type, subject, message) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$fullName, $email, $phone, $learnerType, $subject, $message]);

    echo json_encode(["success" => true, "message" => "Your message has been sent. Our team will contact you soon."]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to send message: " . $e->getMessage()]);
}
?>
