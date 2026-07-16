<?php
// Set timezone to Asia/Colombo (Sri Lankan Standard Time)
date_default_timezone_set('Asia/Colombo');

// CORS Headers to allow React frontend to connect to PHP API
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$is_localhost = ($_SERVER['HTTP_HOST'] == 'localhost' || $_SERVER['HTTP_HOST'] == '127.0.0.1');

if ($is_localhost) {
    // Localhost XAMPP credentials
    $host = '127.0.0.1';
    $db_name = 'technohub_db';
    $username = 'root';
    $password = ''; // Default XAMPP password is empty
} else {
    // Namecheap Production credentials
    $host = 'localhost'; 
    $db_name = 'kasuormb_technohub';
    $username = 'kasuormb_Gimhana';
    $password = '{#bGa.305u]w';
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    if(strpos($e->getMessage(), 'Unknown database') !== false) {
        die(json_encode(["success" => false, "message" => "Database 'technohub_db' does not exist. Please run 'php api/db/migrate.php'."]));
    } else {
        die(json_encode(["success" => false, "message" => "Database Connection failed: " . $e->getMessage()]));
    }
}
?>
