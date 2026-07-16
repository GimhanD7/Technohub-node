<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM system_settings WHERE id = 1");
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($settings) {
            echo json_encode(["success" => true, "settings" => $settings]);
        } else {
            // Provide defaults if missing
            $defaults = [
                'site_name' => 'Techno-Hub',
                'primary_color' => '#1a3cb6',
                'secondary_color' => '#efc300',
                'contact_email' => '',
                'contact_phone' => '',
                'facebook_url' => '',
                'youtube_url' => '',
                'instagram_url' => '',
                'linkedin_url' => '',
                'twitter_url' => '',
                'address' => ''
            ];
            echo json_encode(["success" => true, "settings" => $defaults]);
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Allowed fields to update
    $allowedFields = [
        'site_name', 'primary_color', 'secondary_color', 
        'contact_email', 'contact_phone', 'address',
        'facebook_url', 'youtube_url', 'instagram_url', 'linkedin_url', 'twitter_url'
    ];
    
    $updates = [];
    $params = [];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = :$field";
            $params[":$field"] = $data[$field];
        }
    }
    
    if (empty($updates)) {
        echo json_encode(["success" => false, "message" => "No valid data provided for update."]);
        exit();
    }
    
    $params[':id'] = 1;
    $query = "UPDATE system_settings SET " . implode(", ", $updates) . " WHERE id = :id";
    
    try {
        $stmt = $pdo->prepare($query);
        if ($stmt->execute($params)) {
            // Also fetch the updated row to return it
            $fetchStmt = $pdo->query("SELECT * FROM system_settings WHERE id = 1");
            $updatedSettings = $fetchStmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode(["success" => true, "message" => "Settings updated successfully.", "settings" => $updatedSettings]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update settings."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
    exit();
}

echo json_encode(["success" => false, "message" => "Invalid request method."]);
?>
