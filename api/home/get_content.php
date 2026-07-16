<?php
require_once '../db/config.php';
require_once './_helpers.php';
header("Content-Type: application/json");

$role = isset($_GET['role']) ? cleanText($_GET['role']) : '';
$admin = $role === 'admin';

try {
    ensureHomeTables($pdo);

    $settings = $pdo->query("SELECT * FROM home_settings ORDER BY id ASC LIMIT 1")->fetch();
    $slideWhere = $admin ? "" : "WHERE is_active = 1";
    $lecturerWhere = $admin ? "" : "WHERE is_active = 1";
    $timetableWhere = $admin ? "" : "WHERE is_active = 1";

    $slides = array_map('formatHomeSlide', $pdo->query("SELECT * FROM home_slides $slideWhere ORDER BY sort_order ASC, id ASC")->fetchAll());
    $lecturers = array_map('formatHomeLecturer', $pdo->query("SELECT * FROM home_lecturers $lecturerWhere ORDER BY sort_order ASC, id ASC")->fetchAll());
    $timetable = array_map('formatHomeTimetableRow', $pdo->query("SELECT * FROM home_timetable $timetableWhere ORDER BY sort_order ASC, id ASC")->fetchAll());

    echo json_encode([
        "success" => true,
        "settings" => formatHomeSettings($settings),
        "slides" => $slides,
        "lecturers" => $lecturers,
        "timetable" => $timetable
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to load home content: " . $e->getMessage()]);
}
?>
