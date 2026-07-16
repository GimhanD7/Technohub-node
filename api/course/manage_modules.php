<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        if (!isset($_GET['course_id'])) {
            echo json_encode(["success" => false, "message" => "Course ID is required."]);
            exit();
        }
        $courseId = $_GET['course_id'];
        $stmt = $pdo->prepare("SELECT * FROM course_modules WHERE course_id = ? ORDER BY order_index ASC, created_at ASC");
        $stmt->execute([$courseId]);
        echo json_encode(["success" => true, "modules" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } 
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['course_id']) || !isset($data['title'])) {
            echo json_encode(["success" => false, "message" => "Course ID and Title are required."]);
            exit();
        }
        $stmt = $pdo->prepare("INSERT INTO course_modules (course_id, title, description, order_index) VALUES (?, ?, ?, ?)");
        if ($stmt->execute([$data['course_id'], $data['title'], $data['description'] ?? '', $data['order_index'] ?? 0])) {
            echo json_encode(["success" => true, "message" => "Module created successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to create module."]);
        }
    }
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['id'])) {
            echo json_encode(["success" => false, "message" => "Module ID is required."]);
            exit();
        }
        $fields = [];
        $params = [];
        if (isset($data['title'])) { $fields[] = "title = ?"; $params[] = $data['title']; }
        if (isset($data['description'])) { $fields[] = "description = ?"; $params[] = $data['description']; }
        
        if (empty($fields)) {
            echo json_encode(["success" => true, "message" => "No changes."]);
            exit();
        }
        $params[] = $data['id'];
        $stmt = $pdo->prepare("UPDATE course_modules SET " . implode(', ', $fields) . " WHERE id = ?");
        if ($stmt->execute($params)) {
            echo json_encode(["success" => true, "message" => "Module updated successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update module."]);
        }
    }
    elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['id'])) {
            echo json_encode(["success" => false, "message" => "Module ID is required."]);
            exit();
        }
        $stmt = $pdo->prepare("DELETE FROM course_modules WHERE id = ?");
        if ($stmt->execute([$data['id']])) {
            echo json_encode(["success" => true, "message" => "Module deleted."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete module."]);
        }
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Backend Error: " . $e->getMessage()]);
}
?>
