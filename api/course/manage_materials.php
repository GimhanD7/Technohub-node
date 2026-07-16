<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        if (!isset($_GET['module_id'])) {
            echo json_encode(["success" => false, "message" => "Module ID is required."]);
            exit();
        }
        $moduleId = $_GET['module_id'];
        $stmt = $pdo->prepare("SELECT * FROM course_materials WHERE module_id = ? ORDER BY order_index ASC, created_at ASC");
        $stmt->execute([$moduleId]);
        echo json_encode(["success" => true, "materials" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } 
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (
            !$data ||
            empty($data['module_id']) ||
            trim($data['title'] ?? '') === '' ||
            trim($data['type'] ?? '') === '' ||
            trim($data['content_url'] ?? '') === ''
        ) {
            echo json_encode(["success" => false, "message" => "Module ID, Title, Type, and URL are required."]);
            exit();
        }
        $stmt = $pdo->prepare("INSERT INTO course_materials (module_id, type, title, description, content_url, order_index) VALUES (?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([$data['module_id'], $data['type'], $data['title'], $data['description'] ?? '', $data['content_url'], $data['order_index'] ?? 0])) {
            echo json_encode(["success" => true, "message" => "Material added successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to add material."]);
        }
    }
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['id'])) {
            echo json_encode(["success" => false, "message" => "Material ID is required."]);
            exit();
        }
        $fields = [];
        $params = [];
        if (isset($data['title'])) { $fields[] = "title = ?"; $params[] = $data['title']; }
        if (isset($data['type'])) { $fields[] = "type = ?"; $params[] = $data['type']; }
        if (isset($data['description'])) { $fields[] = "description = ?"; $params[] = $data['description']; }
        if (isset($data['content_url'])) {
            if (trim($data['content_url']) === '') {
                echo json_encode(["success" => false, "message" => "Upload a PDF or provide a valid resource link before saving."]);
                exit();
            }
            $fields[] = "content_url = ?";
            $params[] = $data['content_url'];
        }
        
        if (empty($fields)) {
            echo json_encode(["success" => true, "message" => "No changes."]);
            exit();
        }
        $params[] = $data['id'];
        $stmt = $pdo->prepare("UPDATE course_materials SET " . implode(', ', $fields) . " WHERE id = ?");
        if ($stmt->execute($params)) {
            echo json_encode(["success" => true, "message" => "Material updated successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update material."]);
        }
    }
    elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['id'])) {
            echo json_encode(["success" => false, "message" => "Material ID is required."]);
            exit();
        }
        $stmt = $pdo->prepare("DELETE FROM course_materials WHERE id = ?");
        if ($stmt->execute([$data['id']])) {
            echo json_encode(["success" => true, "message" => "Material deleted."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete material."]);
        }
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Backend Error: " . $e->getMessage()]);
}
?>
