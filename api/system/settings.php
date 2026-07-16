<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Fetch only public/safe settings to be used on the frontend
        $stmt = $pdo->query("SELECT site_name, primary_color, secondary_color, contact_email, contact_phone, address, facebook_url, youtube_url, instagram_url, linkedin_url, twitter_url FROM system_settings WHERE id = 1");
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($settings) {
            echo json_encode(["success" => true, "settings" => $settings]);
        } else {
            // Provide defaults if missing
            $defaults = [
                'site_name' => 'Techno-Hub',
                'primary_color' => '#1a3cb6',
                'secondary_color' => '#efc300',
                'facebook_url' => '',
                'youtube_url' => '',
                'instagram_url' => '',
                'linkedin_url' => '',
                'twitter_url' => '',
            ];
            echo json_encode(["success" => true, "settings" => $defaults]);
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
    exit();
}

echo json_encode(["success" => false, "message" => "Invalid request method."]);
?>
