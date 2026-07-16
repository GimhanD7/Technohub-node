<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));
if (!$data || !isset($data->role)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

if (cleanText($data->role) !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized."]);
    exit();
}

$userId = isset($data->userId) ? intval($data->userId) : null;

try {
    ensureHomeTables($pdo);

    $stmt = $pdo->prepare("UPDATE home_settings SET
        hero_badge = ?, hero_title = ?, hero_subtitle = ?, primary_cta_label = ?, primary_cta_url = ?, secondary_cta_label = ?, secondary_cta_url = ?,
        courses_heading = ?, courses_subtitle = ?, lecturers_heading = ?, lecturers_subtitle = ?, why_heading = ?, why_subtitle = ?, timetable_heading = ?, timetable_subtitle = ?, faq_heading = ?, updated_by = ?
        WHERE id = (SELECT id FROM (SELECT id FROM home_settings ORDER BY id ASC LIMIT 1) AS home_id)");
    $stmt->execute([
        cleanText($data->heroBadge ?? ""),
        cleanText($data->heroTitle ?? ""),
        cleanNullableText($data->heroSubtitle ?? ""),
        cleanNullableText($data->primaryCtaLabel ?? ""),
        cleanNullableText($data->primaryCtaUrl ?? ""),
        cleanNullableText($data->secondaryCtaLabel ?? ""),
        cleanNullableText($data->secondaryCtaUrl ?? ""),
        cleanNullableText($data->coursesHeading ?? ""),
        cleanNullableText($data->coursesSubtitle ?? ""),
        cleanNullableText($data->lecturersHeading ?? ""),
        cleanNullableText($data->lecturersSubtitle ?? ""),
        cleanNullableText($data->whyHeading ?? ""),
        cleanNullableText($data->whySubtitle ?? ""),
        cleanNullableText($data->timetableHeading ?? ""),
        cleanNullableText($data->timetableSubtitle ?? ""),
        cleanNullableText($data->faqHeading ?? ""),
        $userId
    ]);

    echo json_encode(["success" => true, "message" => "Home page content updated."]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to update home content: " . $e->getMessage()]);
}
?>
