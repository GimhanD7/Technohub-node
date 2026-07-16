<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

$role = isset($_GET['role']) ? cleanText($_GET['role']) : '';

if ($role !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized."]);
    exit();
}

try {
    ensureContactTables($pdo);

    $stmt = $pdo->query("SELECT * FROM contact_messages ORDER BY created_at DESC, id DESC");
    $messages = array_map('formatContactMessage', $stmt->fetchAll());

    echo json_encode(["success" => true, "messages" => $messages]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to load contact messages: " . $e->getMessage()]);
}
?>
