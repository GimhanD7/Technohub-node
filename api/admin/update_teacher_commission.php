<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['teacher_id']) || !isset($data['commission_type']) || !isset($data['commission_value'])) {
    echo json_encode(["success" => false, "message" => "Missing required fields"]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO teacher_commissions (teacher_id, commission_type, commission_value) 
        VALUES (:teacher_id, :commission_type, :commission_value)
        ON DUPLICATE KEY UPDATE 
        commission_type = :commission_type,
        commission_value = :commission_value
    ");
    $stmt->execute([
        ':teacher_id' => $data['teacher_id'],
        ':commission_type' => $data['commission_type'],
        ':commission_value' => $data['commission_value']
    ]);

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
