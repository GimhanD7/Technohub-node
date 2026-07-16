<?php
require_once '../db/config.php';
require_once './_helpers.php';
require_once '../lib/logger.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->role)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

$role = cleanText($data->role);
$userId = isset($data->userId) ? intval($data->userId) : null;

if ($role !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized. Only administrators can update contact details."]);
    exit();
}

$heroBadge = cleanText($data->heroBadge ?? "Student Support Desk");
$title = cleanText($data->title ?? "Contact Techno-Hub");
$subtitle = cleanNullableText($data->subtitle ?? "");
$phone = cleanNullableText($data->phone ?? "");
$whatsapp = cleanNullableText($data->whatsapp ?? "");
$email = cleanNullableText($data->email ?? "");
$address = cleanNullableText($data->address ?? "");
$officeHours = cleanNullableText($data->officeHours ?? "");
$mapUrl = cleanNullableText($data->mapUrl ?? "");
$facebookUrl = cleanNullableText($data->facebookUrl ?? "");
$instagramUrl = cleanNullableText($data->instagramUrl ?? "");
$linkedinUrl = cleanNullableText($data->linkedinUrl ?? "");
$youtubeUrl = cleanNullableText($data->youtubeUrl ?? "");
$primaryCtaLabel = cleanNullableText($data->primaryCtaLabel ?? "");
$primaryCtaUrl = cleanNullableText($data->primaryCtaUrl ?? "");

if ($heroBadge === "" || $title === "") {
    echo json_encode(["success" => false, "message" => "Badge and title are required."]);
    exit();
}

try {
    ensureContactTables($pdo);

    $stmt = $pdo->prepare("UPDATE contact_settings
        SET hero_badge = ?, title = ?, subtitle = ?, phone = ?, whatsapp = ?, email = ?, address = ?, office_hours = ?,
            map_url = ?, facebook_url = ?, instagram_url = ?, linkedin_url = ?, youtube_url = ?, primary_cta_label = ?, primary_cta_url = ?, updated_by = ?
        WHERE id = (SELECT id FROM (SELECT id FROM contact_settings ORDER BY id ASC LIMIT 1) AS setting_id)");
    $stmt->execute([
        $heroBadge,
        $title,
        $subtitle,
        $phone,
        $whatsapp,
        $email,
        $address,
        $officeHours,
        $mapUrl,
        $facebookUrl,
        $instagramUrl,
        $linkedinUrl,
        $youtubeUrl,
        $primaryCtaLabel,
        $primaryCtaUrl,
        $userId
    ]);

    log_activity($pdo, $userId, "Contact Page Updated", "Updated public contact details.");

    echo json_encode(["success" => true, "message" => "Contact page details updated successfully."]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to update contact details: " . $e->getMessage()]);
}
?>
