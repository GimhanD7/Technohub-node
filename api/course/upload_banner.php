<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['image'])) {
    echo json_encode(["success" => false, "message" => "No image data provided."]);
    exit();
}

$base64_string = $data['image'];

// Extract the file extension and the base64 data
if (preg_match('/^data:image\/(\w+);base64,/', $base64_string, $type)) {
    $base64_string = substr($base64_string, strpos($base64_string, ',') + 1);
    $type = strtolower($type[1]); // jpeg, png, webp, etc.

    if (!in_array($type, [ 'jpg', 'jpeg', 'png', 'webp' ])) {
        echo json_encode(["success" => false, "message" => "Invalid image type."]);
        exit();
    }

    $base64_string = str_replace(' ', '+', $base64_string);
    $decoded_image = base64_decode($base64_string, true);

    if ($decoded_image === false) {
        echo json_encode(["success" => false, "message" => "Base64 decode failed."]);
        exit();
    }

    // Determine safe filename
    $upload_dir = __DIR__ . '/../../uploads/banners/';

    if (!is_dir($upload_dir) && !mkdir($upload_dir, 0755, true)) {
        echo json_encode(["success" => false, "message" => "Could not create the banner upload folder."]);
        exit();
    }

    if (!is_writable($upload_dir)) {
        echo json_encode(["success" => false, "message" => "The banner upload folder is not writable."]);
        exit();
    }

    $filename = 'banner_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $type;
    $file_path = $upload_dir . $filename;

    if (file_put_contents($file_path, $decoded_image) !== false) {
        // Return the absolute URL pointing to the file
        // Assuming the site is hosted at http://localhost/Techno-Hub
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $host = $_SERVER['HTTP_HOST'];
        
        // Find the base path by parsing SCRIPT_NAME
        // e.g., /Techno-Hub/api/course/upload_banner.php -> /Techno-Hub
        $scriptPath = $_SERVER['SCRIPT_NAME'];
        $baseDir = substr($scriptPath, 0, strpos($scriptPath, '/api/'));
        
        $public_url = $protocol . "://" . $host . $baseDir . "/uploads/banners/" . $filename;
        
        echo json_encode(["success" => true, "url" => $public_url, "message" => "Image uploaded successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to write file to disk."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid base64 string format."]);
}
?>
