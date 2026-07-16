<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

// Default settings if something goes wrong
$defaultSettings = [
    "developer_options_restriction" => false,
    "right_click_restriction" => false,
    "anti_recording_watermark" => false,
    "developer_master_mode" => false
];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM security_settings WHERE id = 1");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $settings = [
                "developer_options_restriction" => (bool)$row['developer_options_restriction'],
                "right_click_restriction" => (bool)$row['right_click_restriction'],
                "anti_recording_watermark" => (bool)$row['anti_recording_watermark'],
                "developer_master_mode" => (bool)$row['developer_master_mode']
            ];
            echo json_encode(["success" => true, "settings" => $settings]);
        } else {
            echo json_encode(["success" => true, "settings" => $defaultSettings]);
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Check PIN
    if (!isset($data['pin']) || $data['pin'] !== '7845') {
        echo json_encode(["success" => false, "message" => "Invalid security PIN."]);
        exit();
    }
    
    // Check settings payload
    if (!isset($data['settings'])) {
        echo json_encode(["success" => false, "message" => "No settings provided."]);
        exit();
    }
    
    $newSettings = $data['settings'];
    
    $devOptions = isset($newSettings['developer_options_restriction']) ? (int)(bool)$newSettings['developer_options_restriction'] : 0;
    $rightClick = isset($newSettings['right_click_restriction']) ? (int)(bool)$newSettings['right_click_restriction'] : 0;
    $watermark = isset($newSettings['anti_recording_watermark']) ? (int)(bool)$newSettings['anti_recording_watermark'] : 0;
    $masterMode = isset($newSettings['developer_master_mode']) ? (int)(bool)$newSettings['developer_master_mode'] : 0;

    try {
        $stmt = $pdo->prepare("UPDATE security_settings SET 
            developer_options_restriction = ?, 
            right_click_restriction = ?, 
            anti_recording_watermark = ?, 
            developer_master_mode = ? 
            WHERE id = 1");
        $stmt->execute([$devOptions, $rightClick, $watermark, $masterMode]);
        
        $finalSettings = [
            "developer_options_restriction" => (bool)$devOptions,
            "right_click_restriction" => (bool)$rightClick,
            "anti_recording_watermark" => (bool)$watermark,
            "developer_master_mode" => (bool)$masterMode
        ];
        
        echo json_encode(["success" => true, "message" => "Security settings updated successfully.", "settings" => $finalSettings]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
    exit();
}

echo json_encode(["success" => false, "message" => "Invalid request method."]);
?>
