<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

$role = isset($_GET['role']) ? cleanText($_GET['role']) : '';
$includeUnpublished = $role === 'admin';

try {
    ensureEbookResourcesTable($pdo);

    $where = $includeUnpublished ? "" : "WHERE er.is_published = 1";
    $query = "SELECT er.*, u.full_name AS creator_name
              FROM ebook_resources er
              LEFT JOIN users u ON er.created_by = u.id
              $where
              ORDER BY er.is_featured DESC, er.created_at DESC";

    $stmt = $pdo->query($query);
    $resources = array_map('formatEbookResource', $stmt->fetchAll());

    echo json_encode([
        "success" => true,
        "resources" => $resources
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to load e-book resources: " . $e->getMessage()]);
}
?>
