<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

try {
    ensureContactTables($pdo);

    $stmt = $pdo->query("SELECT * FROM contact_settings ORDER BY id ASC LIMIT 1");
    $settings = $stmt->fetch();

    echo json_encode([
        "success" => true,
        "settings" => formatContactSettings($settings)
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to load contact details: " . $e->getMessage()]);
}
?>
