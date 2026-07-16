<?php
require_once '../db/config.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->quizId) || !isset($data->role)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

$quizId = intval($data->quizId);
$role = htmlspecialchars(strip_tags($data->role));

if ($role !== 'admin' && $role !== 'teacher') {
    echo json_encode(["success" => false, "message" => "Unauthorized. Only administrators and teachers can delete quizzes."]);
    exit();
}

try {
    $stmt = $pdo->prepare("DELETE FROM quizzes WHERE id = ?");
    $stmt->execute([$quizId]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "Quiz deleted successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "Quiz not found."]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to delete quiz: " . $e->getMessage()]);
}
?>
