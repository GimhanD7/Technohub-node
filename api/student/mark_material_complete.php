<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    echo json_encode(["success" => false, "message" => "Only POST requests are allowed."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['student_id']) || !isset($data['material_id'])) {
    echo json_encode(["success" => false, "message" => "Student ID and Material ID are required."]);
    exit();
}

$studentId = $data['student_id'];
$materialId = $data['material_id'];

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

    $accessStmt = $pdo->prepare("
        SELECT cm.id
        FROM course_materials cm
        JOIN course_modules cmod ON cm.module_id = cmod.id
        JOIN course_enrollments ce ON ce.course_id = cmod.course_id AND ce.student_id = ?
        WHERE cm.id = ?
        LIMIT 1
    ");
    $accessStmt->execute([$studentId, $materialId]);

    if ($accessStmt->rowCount() === 0) {
        echo json_encode(["success" => false, "message" => "You are not enrolled for this material."]);
        exit();
    }

    // Check if already marked
    $stmt = $pdo->prepare("SELECT id FROM material_completions WHERE student_id = ? AND material_id = ?");
    $stmt->execute([$studentId, $materialId]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => true, "message" => "Material already marked as complete."]);
        exit();
    }
    
    // Insert new completion record
    $insertStmt = $pdo->prepare("INSERT INTO material_completions (student_id, material_id) VALUES (?, ?)");
    $insertStmt->execute([$studentId, $materialId]);
    
    echo json_encode(["success" => true, "message" => "Material marked as complete successfully."]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>
