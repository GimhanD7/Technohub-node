<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$user_id = $_GET['user_id'] ?? null;
$role = $_GET['role'] ?? null; // e.g., 'admin' to view all

try {
    if ($role === 'admin') {
        $status = $_GET['status'] ?? null;
        if ($status) {
            $stmt = $pdo->prepare("
                SELECT t.*, u.full_name as user_name, u.phone_number 
                FROM wallet_transactions t 
                JOIN users u ON t.user_id = u.id 
                WHERE t.status = ? 
                ORDER BY t.created_at DESC
            ");
            $stmt->execute([$status]);
        } else {
            $stmt = $pdo->query("
                SELECT t.*, u.full_name as user_name, u.phone_number 
                FROM wallet_transactions t 
                JOIN users u ON t.user_id = u.id 
                ORDER BY t.created_at DESC
            ");
        }
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        if (!$user_id) {
            echo json_encode(["success" => false, "message" => "User ID is required."]);
            exit();
        }
        $stmt = $pdo->prepare("SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user_id]);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode(["success" => true, "transactions" => $transactions]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error fetching history: " . $e->getMessage()]);
}
?>
