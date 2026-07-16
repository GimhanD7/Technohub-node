<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

$role = isset($_GET['role']) ? cleanText($_GET['role']) : '';
$includeUnpublished = $role === 'admin';

try {
    ensureGalleryItemsTable($pdo);

    $where = $includeUnpublished ? "" : "WHERE gi.is_published = 1";
    $query = "SELECT gi.*, u.full_name AS creator_name
              FROM gallery_items gi
              LEFT JOIN users u ON gi.created_by = u.id
              $where
              ORDER BY gi.is_featured DESC, COALESCE(gi.event_date, DATE(gi.created_at)) DESC, gi.created_at DESC";

    $stmt = $pdo->query($query);
    $items = attachGalleryImages($pdo, array_map('formatGalleryItem', $stmt->fetchAll()));

    echo json_encode([
        "success" => true,
        "items" => $items
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to load gallery items: " . $e->getMessage()]);
}
?>
