<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$admin_id = $input['admin_id'] ?? null;
$user_ids = $input['user_ids'] ?? [];
$amount_to_add = $input['amount'] ?? null;

if (!$admin_id || empty($user_ids) || !isset($amount_to_add)) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit();
}

if (!is_numeric($amount_to_add) || $amount_to_add <= 0) {
    echo json_encode(["success" => false, "message" => "Amount must be greater than zero."]);
    exit();
}

try {
    $pdo->beginTransaction();

    // Verify admin
    $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$admin_id]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin || $admin['role'] !== 'admin') {
        throw new Exception("Unauthorized access.");
    }

    $amount_float = (float)$amount_to_add;
    $description = "Admin bulk credit addition.";

    foreach ($user_ids as $user_id) {
        // Update balance
        $stmt = $pdo->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?");
        $stmt->execute([$amount_float, $user_id]);

        // Record a transaction
        $stmt = $pdo->prepare("INSERT INTO wallet_transactions (user_id, amount, type, status, description) VALUES (?, ?, 'credit', 'approved', ?)");
        $stmt->execute([$user_id, $amount_float, $description]);
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Successfully added LKR $amount_float to " . count($user_ids) . " user(s)."
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
