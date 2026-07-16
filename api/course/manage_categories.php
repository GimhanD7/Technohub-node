<?php
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../lib/logger.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

function generateSlug($string) {
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $string)));
    return $slug;
}

try {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM course_categories ORDER BY name ASC");
        echo json_encode(["success" => true, "categories" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } 
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['name'])) {
            echo json_encode(["success" => false, "message" => "Category name is required."]);
            exit();
        }
        
        $name = trim($data['name']);
        $slug = generateSlug($name);
        
        // Ensure slug uniqueness
        $checkStmt = $pdo->prepare("SELECT id FROM course_categories WHERE slug = ?");
        $checkStmt->execute([$slug]);
        if ($checkStmt->rowCount() > 0) {
            $slug = $slug . '-' . time();
        }

        $stmt = $pdo->prepare("INSERT INTO course_categories (name, slug) VALUES (?, ?)");
        if ($stmt->execute([$name, $slug])) {
            $categoryId = $pdo->lastInsertId();
            
            // If user_id is provided, log it
            if (isset($data['user_id'])) {
                log_activity($pdo, $data['user_id'], 'Added Category', 'Added a new course category: ' . $name);
            }
            
            // Return the created category
            $fetchStmt = $pdo->prepare("SELECT * FROM course_categories WHERE id = ?");
            $fetchStmt->execute([$categoryId]);
            echo json_encode(["success" => true, "message" => "Category added successfully.", "category" => $fetchStmt->fetch(PDO::FETCH_ASSOC)]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to add category."]);
        }
    } 
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['id']) || !isset($data['name'])) {
            echo json_encode(["success" => false, "message" => "Category ID and new name are required."]);
            exit();
        }

        $id = $data['id'];
        $name = trim($data['name']);
        $slug = generateSlug($name);

        // Ensure slug uniqueness, excluding current category
        $checkStmt = $pdo->prepare("SELECT id FROM course_categories WHERE slug = ? AND id != ?");
        $checkStmt->execute([$slug, $id]);
        if ($checkStmt->rowCount() > 0) {
            $slug = $slug . '-' . time();
        }

        $stmt = $pdo->prepare("UPDATE course_categories SET name = ?, slug = ? WHERE id = ?");
        if ($stmt->execute([$name, $slug, $id])) {
            if (isset($data['user_id'])) {
                log_activity($pdo, $data['user_id'], 'Updated Category', 'Updated course category to: ' . $name);
            }
            echo json_encode(["success" => true, "message" => "Category updated successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update category."]);
        }
    }
    elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['id'])) {
            echo json_encode(["success" => false, "message" => "Category ID is required."]);
            exit();
        }

        $fetchStmt = $pdo->prepare("SELECT name FROM course_categories WHERE id = ?");
        $fetchStmt->execute([$data['id']]);
        $categoryInfo = $fetchStmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("DELETE FROM course_categories WHERE id = ?");
        if ($stmt->execute([$data['id']])) {
            if ($categoryInfo && isset($data['user_id'])) {
                log_activity($pdo, $data['user_id'], 'Deleted Category', 'Deleted course category: ' . $categoryInfo['name']);
            }
            echo json_encode(["success" => true, "message" => "Category deleted successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete category."]);
        }
    }
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Integrity constraint violation') !== false) {
        echo json_encode(["success" => false, "message" => "Cannot delete this category because it is in use by one or more courses."]);
    } else {
        echo json_encode(["success" => false, "message" => "Backend Error: " . $e->getMessage()]);
    }
}
?>
