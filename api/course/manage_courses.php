<?php
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../lib/logger.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        if (!isset($_GET['teacher_id'])) {
            echo json_encode(["success" => false, "message" => "Teacher ID is required."]);
            exit();
        }
        $teacherId = $_GET['teacher_id'];
        $stmt = $pdo->prepare("
            SELECT c.*, cc.name as category_name 
            FROM courses c 
            LEFT JOIN course_categories cc ON c.category_id = cc.id 
            WHERE c.teacher_id = ? 
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([$teacherId]);
        echo json_encode(["success" => true, "courses" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } 
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['teacher_id']) || !isset($data['title'])) {
            echo json_encode(["success" => false, "message" => "Teacher ID and Title are required."]);
            exit();
        }
        $stmt = $pdo->prepare("INSERT INTO courses (teacher_id, category_id, title, description, duration, points, banner_url) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $categoryId = isset($data['category_id']) && $data['category_id'] !== '' ? $data['category_id'] : null;
        if ($stmt->execute([$data['teacher_id'], $categoryId, $data['title'], $data['description'] ?? '', $data['duration'] ?? '', $data['points'] ?? 0, $data['banner_url'] ?? ''])) {
            log_activity($pdo, $data['teacher_id'], 'Created Course', 'Created a new course: ' . $data['title']);
            echo json_encode(["success" => true, "message" => "Course created successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to create course."]);
        }
    } 
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['id'])) {
            echo json_encode(["success" => false, "message" => "Course ID is required."]);
            exit();
        }
        
        $fields = [];
        $params = [];
        if (isset($data['category_id'])) { $fields[] = "category_id = ?"; $params[] = $data['category_id'] !== '' ? $data['category_id'] : null; }
        if (isset($data['title'])) { $fields[] = "title = ?"; $params[] = $data['title']; }
        if (isset($data['description'])) { $fields[] = "description = ?"; $params[] = $data['description']; }
        if (isset($data['duration'])) { $fields[] = "duration = ?"; $params[] = $data['duration']; }
        if (isset($data['points'])) { $fields[] = "points = ?"; $params[] = $data['points']; }
        if (isset($data['banner_url'])) { $fields[] = "banner_url = ?"; $params[] = $data['banner_url']; }
        if (isset($data['status'])) { $fields[] = "status = ?"; $params[] = $data['status']; }
        
        if (empty($fields)) {
            echo json_encode(["success" => false, "message" => "No data to update."]);
            exit();
        }
        
        $params[] = $data['id'];
        $sql = "UPDATE courses SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        if ($stmt->execute($params)) {
            // Log update
            $fetchStmt = $pdo->prepare("SELECT teacher_id, title FROM courses WHERE id = ?");
            $fetchStmt->execute([$data['id']]);
            $courseInfo = $fetchStmt->fetch(PDO::FETCH_ASSOC);
            if ($courseInfo) {
                log_activity($pdo, $courseInfo['teacher_id'], 'Updated Course', 'Updated details for course: ' . $courseInfo['title']);
            }
            echo json_encode(["success" => true, "message" => "Course updated successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update course."]);
        }
    }
    elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['id'])) {
            echo json_encode(["success" => false, "message" => "Course ID is required."]);
            exit();
        }
        // Fetch course info first to log
        $fetchStmt = $pdo->prepare("SELECT teacher_id, title FROM courses WHERE id = ?");
        $fetchStmt->execute([$data['id']]);
        $courseInfo = $fetchStmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("DELETE FROM courses WHERE id = ?");
        if ($stmt->execute([$data['id']])) {
            if ($courseInfo) {
                log_activity($pdo, $courseInfo['teacher_id'], 'Deleted Course', 'Deleted course: ' . $courseInfo['title']);
            }
            echo json_encode(["success" => true, "message" => "Course deleted successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete course."]);
        }
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Backend Error: " . $e->getMessage()]);
}
?>
