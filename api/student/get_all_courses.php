<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    echo json_encode(["success" => false, "message" => "Only GET requests are allowed."]);
    exit();
}

$studentId = $_GET['student_id'] ?? null;

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
            cc.name as category,
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
            ) as completed_materials,
            CASE 
                WHEN ? IS NOT NULL AND EXISTS (SELECT 1 FROM course_enrollments ce WHERE ce.course_id = c.id AND ce.student_id = ?) THEN 1 
                ELSE 0 
            END as is_enrolled
        FROM courses c
        JOIN users u ON c.teacher_id = u.id
        LEFT JOIN course_categories cc ON c.category_id = cc.id
        WHERE c.status = 'active'
        ORDER BY c.created_at DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$studentId, $studentId, $studentId]);
    $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($courses as &$course) {
        $totalMaterials = intval($course['total_materials']);
        $completedMaterials = intval($course['completed_materials']);

        $course['is_enrolled'] = (bool)$course['is_enrolled'];
        $course['module_count'] = intval($course['module_count']);
        $course['total_materials'] = $totalMaterials;
        $course['completed_materials'] = $course['is_enrolled'] ? $completedMaterials : 0;
        $course['progress_percentage'] = ($course['is_enrolled'] && $totalMaterials > 0)
            ? round(($completedMaterials / $totalMaterials) * 100)
            : 0;
        $course['is_completed'] = $course['is_enrolled'] && $totalMaterials > 0 && $completedMaterials >= $totalMaterials;
    }

    echo json_encode([
        "success" => true,
        "courses" => $courses
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>
