<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$admin_id = $input['admin_id'] ?? null;
$transaction_id = $input['transaction_id'] ?? null;
$pin = $input['pin'] ?? null;

if (!$admin_id || !$transaction_id || !$pin) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit();
}

if ($pin !== '7845') {
    echo json_encode(["success" => false, "message" => "Incorrect PIN number."]);
    exit();
}

try {
    // Optional: check if the user is an admin
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$admin_id]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin || $admin['role'] !== 'admin') {
        echo json_encode(["success" => false, "message" => "Unauthorized access."]);
        exit();
    }

    // Check if transaction exists
    $stmt = $pdo->prepare("SELECT * FROM wallet_transactions WHERE id = ?");
    $stmt->execute([$transaction_id]);
    $transaction = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$transaction) {
        echo json_encode(["success" => false, "message" => "Transaction not found."]);
        exit();
    }

    // Delete the transaction
    $stmt = $pdo->prepare("DELETE FROM wallet_transactions WHERE id = ?");
    $stmt->execute([$transaction_id]);

    echo json_encode([
        "success" => true,
        "message" => "Transaction successfully deleted."
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error deleting transaction: " . $e->getMessage()]);
}
?>
