<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];
$uploadsDir = realpath(__DIR__ . '/../../uploads');

if (!$uploadsDir || !is_dir($uploadsDir)) {
    // If the directory doesn't exist yet, we just return empty
    if ($method === 'GET') {
        echo json_encode(["success" => true, "files" => [], "totalSize" => 0, "totalFiles" => 0]);
        exit();
    }
}

// Function to get all files recursively
function getDirContents($dir, &$results = array()) {
    $files = scandir($dir);
    foreach ($files as $key => $value) {
        $path = realpath($dir . DIRECTORY_SEPARATOR . $value);
        if (!is_dir($path)) {
            $results[] = $path;
        } else if ($value != "." && $value != "..") {
            getDirContents($path, $results);
            // Optionally add directory itself if needed, but we only want files
        }
    }
    return $results;
}

if ($method === 'GET') {
    try {
        $allFiles = [];
        if ($uploadsDir && is_dir($uploadsDir)) {
            $allFiles = getDirContents($uploadsDir);
        }

        $filesData = [];
        $totalSize = 0;

        foreach ($allFiles as $filePath) {
            $size = filesize($filePath);
            $totalSize += $size;
            
            // Get relative path from uploads dir
            $relativePath = str_replace($uploadsDir . DIRECTORY_SEPARATOR, '', $filePath);
            $relativePath = str_replace('\\', '/', $relativePath);
            
            $urlPath = '/uploads/' . $relativePath;
            
            // Extract the directory name as 'category'
            $parts = explode('/', $relativePath);
            $category = count($parts) > 1 ? $parts[0] : 'root';
            
            $filesData[] = [
                'name' => basename($filePath),
                'path' => $relativePath,
                'url' => $urlPath,
                'category' => $category,
                'size' => $size,
                'modifiedAt' => filemtime($filePath)
            ];
        }

        echo json_encode([
            "success" => true,
            "files" => $filesData,
            "totalSize" => $totalSize,
            "totalFiles" => count($filesData)
        ]);

    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Failed to read directory: " . $e->getMessage()]);
    }
    exit();
}

if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!isset($data['path'])) {
        echo json_encode(["success" => false, "message" => "File path not provided."]);
        exit();
    }

    $targetFile = realpath($uploadsDir . '/' . $data['path']);

    // Security check: ensure the file is inside the uploads directory to prevent traversal attacks
    if ($targetFile && strpos($targetFile, $uploadsDir) === 0 && is_file($targetFile)) {
        if (unlink($targetFile)) {
            echo json_encode(["success" => true, "message" => "File deleted successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete the file."]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "File not found or invalid path."]);
    }
    exit();
}

echo json_encode(["success" => false, "message" => "Invalid request method."]);
?>
