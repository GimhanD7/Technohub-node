<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

if (!isset($_GET['teacher_id'])) {
    echo json_encode(["success" => false, "message" => "Missing teacher_id"]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM teacher_earnings_history WHERE teacher_id = ? ORDER BY created_at DESC");
    $stmt->execute([$_GET['teacher_id']]);
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "history" => $history]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
