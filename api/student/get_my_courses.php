<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    echo json_encode(["success" => false, "message" => "Only GET requests are allowed."]);
    exit();
}

if (!isset($_GET['student_id'])) {
    echo json_encode(["success" => false, "message" => "Student ID is required."]);
    exit();
}

$studentId = $_GET['student_id'];

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

    $sql = "
        SELECT 
            c.*, 
            u.full_name as teacher_name,
            ce.enrolled_at,
            (SELECT COUNT(*) FROM course_modules WHERE course_id = c.id) as module_count,
            (
                SELECT COUNT(*)
                FROM course_materials cm
                JOIN course_modules cmod ON cm.module_id = cmod.id
                WHERE cmod.course_id = c.id
            ) as total_materials,
            (
                SELECT COUNT(*)
                FROM material_completions mc
                JOIN course_materials cm ON mc.material_id = cm.id
                JOIN course_modules cmod ON cm.module_id = cmod.id
                WHERE cmod.course_id = c.id AND mc.student_id = ?
            ) as completed_materials
        FROM course_enrollments ce
        JOIN courses c ON ce.course_id = c.id
        JOIN users u ON c.teacher_id = u.id
        WHERE ce.student_id = ?
        ORDER BY ce.enrolled_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$studentId, $studentId]);
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($courses as &$course) {
        $totalMaterials = intval($course['total_materials']);
        $completedMaterials = intval($course['completed_materials']);

        $course['module_count'] = intval($course['module_count']);
        $course['total_materials'] = $totalMaterials;
        $course['completed_materials'] = $completedMaterials;
        $course['progress_percentage'] = $totalMaterials > 0 ? round(($completedMaterials / $totalMaterials) * 100) : 0;
        $course['is_completed'] = $totalMaterials > 0 && $completedMaterials >= $totalMaterials;
    }
    
    echo json_encode([
        "success" => true,
        "courses" => $courses
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>
