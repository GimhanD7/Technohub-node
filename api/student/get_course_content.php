<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    echo json_encode(["success" => false, "message" => "Only GET requests are allowed."]);
    exit();
}

$courseId = $_GET['course_id'] ?? null;
$studentId = $_GET['student_id'] ?? null; // For security validation

if (!$courseId || !$studentId) {
    echo json_encode(["success" => false, "message" => "Course ID and Student ID are required."]);
    exit();
}

try {
    $materialCompletionsTable = "CREATE TABLE IF NOT EXISTS material_completions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        material_id INT NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY student_material_unique (student_id, material_id),
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES course_materials(id) ON DELETE CASCADE
    )";
    $pdo->exec($materialCompletionsTable);

    // 1. Validate if the student is actually enrolled in this course
    $checkStmt = $pdo->prepare("SELECT id FROM course_enrollments WHERE student_id = ? AND course_id = ?");
    $checkStmt->execute([$studentId, $courseId]);
    if ($checkStmt->rowCount() === 0) {
        echo json_encode(["success" => false, "message" => "Unauthorized. You are not enrolled in this course."]);
        exit();
    }

    // 2. Fetch Course Details
    $courseStmt = $pdo->prepare("
        SELECT c.*, u.full_name as teacher_name 
        FROM courses c 
        JOIN users u ON c.teacher_id = u.id 
        WHERE c.id = ?
    ");
    $courseStmt->execute([$courseId]);
    $course = $courseStmt->fetch(PDO::FETCH_ASSOC);

    if (!$course) {
        echo json_encode(["success" => false, "message" => "Course not found."]);
        exit();
    }

    // 3. Fetch Modules
    $modulesStmt = $pdo->prepare("SELECT * FROM course_modules WHERE course_id = ? ORDER BY id ASC");
    $modulesStmt->execute([$courseId]);
    $modules = $modulesStmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Fetch Materials for each module with student completion status
    foreach ($modules as &$module) {
        $materialsStmt = $pdo->prepare("
            SELECT 
                cm.*,
                CASE WHEN mc.id IS NULL THEN 0 ELSE 1 END AS is_completed,
                mc.completed_at
            FROM course_materials cm
            LEFT JOIN material_completions mc 
                ON mc.material_id = cm.id AND mc.student_id = ?
            WHERE cm.module_id = ?
            ORDER BY cm.id ASC
        ");
        $materialsStmt->execute([$studentId, $module['id']]);
        $module['materials'] = array_map(function ($material) {
            $material['is_completed'] = intval($material['is_completed']) === 1;
            return $material;
        }, $materialsStmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // Construct the final payload
    echo json_encode([
        "success" => true,
        "course" => $course,
        "modules" => $modules
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>
