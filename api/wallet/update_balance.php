<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

$admin_id = $input['admin_id'] ?? null;
$target_user_id = $input['target_user_id'] ?? null;
$new_balance = $input['new_balance'] ?? null;

if (!$admin_id || !$target_user_id || !isset($new_balance)) {
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
    exit();
}

if (!is_numeric($new_balance) || $new_balance < 0) {
    echo json_encode(["success" => false, "message" => "Invalid balance amount."]);
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

    // Get current balance
    $stmt = $pdo->prepare("SELECT wallet_balance FROM users WHERE id = ?");
    $stmt->execute([$target_user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception("Target user not found.");
    }

    $old_balance = (float)$user['wallet_balance'];
    $new_balance_float = (float)$new_balance;
    $difference = $new_balance_float - $old_balance;

    if (abs($difference) > 0.001) {
        // Update balance
        $stmt = $pdo->prepare("UPDATE users SET wallet_balance = ? WHERE id = ?");
        $stmt->execute([$new_balance_float, $target_user_id]);

        // Record a transaction
        $type = $difference > 0 ? 'credit' : 'debit';
        $amount = abs($difference);
        $description = "Admin manual adjustment. Old: $old_balance, New: $new_balance_float";

        $stmt = $pdo->prepare("INSERT INTO wallet_transactions (user_id, amount, type, status, description) VALUES (?, ?, ?, 'approved', ?)");
        $stmt->execute([$target_user_id, $amount, $type, $description]);
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Wallet balance updated successfully.",
        "new_balance" => $new_balance_float
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>
