<?php
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../lib/logger.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$admin_id = $data['admin_id'] ?? null;
$transaction_id = $data['transaction_id'] ?? null;
$action = $data['action'] ?? null; // 'approve' or 'reject'
$description = $data['description'] ?? null;
$amount = isset($data['amount']) ? (float)$data['amount'] : null;

if (!$admin_id || !$transaction_id || !in_array($action, ['approve', 'reject'])) {
    echo json_encode(["success" => false, "message" => "Valid admin ID, transaction ID, and action (approve/reject) are required."]);
    exit();
}

try {
    // Start transaction
    $pdo->beginTransaction();

    // Get the transaction details
    $stmt = $pdo->prepare("SELECT * FROM wallet_transactions WHERE id = ? FOR UPDATE");
    $stmt->execute([$transaction_id]);
    $transaction = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$transaction) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "message" => "Transaction not found."]);
        exit();
    }

    if ($transaction['status'] !== 'pending') {
        $pdo->rollBack();
        echo json_encode(["success" => false, "message" => "Transaction is already " . $transaction['status'] . "."]);
        exit();
    }

    $new_status = ($action === 'approve') ? 'approved' : 'rejected';
    $final_amount = (float)$transaction['amount'];

    if ($action === 'approve' && $amount !== null && $amount >= 0) {
        $final_amount = $amount;
    }

    if ($action === 'approve' && $final_amount <= 0) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "message" => "Approval amount must be greater than zero."]);
        exit();
    }

    $final_description = $action === 'reject' && $description
        ? $description
        : $transaction['description'];

    $updateStmt = $pdo->prepare("
        UPDATE wallet_transactions
        SET status = ?, amount = ?, description = ?
        WHERE id = ?
    ");
    $updateStmt->execute([
        $new_status,
        $final_amount,
        $final_description,
        $transaction_id
    ]);

    // Credit the approved amount exactly once.
    if ($action === 'approve' && $transaction['type'] === 'credit') {
        $updateUserStmt = $pdo->prepare("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?");
        $updateUserStmt->execute([$final_amount, $transaction['user_id']]);

        // Add Notification
        $notifStmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type, created_by) VALUES (?, ?, ?, ?, ?)");
        $notifStmt->execute([
            $transaction['user_id'], 
            "Payment Approved", 
            "Your wallet recharge request for LKR " . number_format($final_amount, 2) . " has been approved.", 
            "payment", 
            $admin_id
        ]);
    } else if ($action === 'reject') {
        // Add Notification
        $notifStmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type, created_by) VALUES (?, ?, ?, ?, ?)");
        $notifStmt->execute([
            $transaction['user_id'], 
            "Payment Rejected", 
            "Your wallet recharge request was rejected. Reason: " . $final_description, 
            "payment", 
            $admin_id
        ]);
    }

    $pdo->commit();

    log_activity(
        $pdo,
        $admin_id,
        'Wallet Recharge ' . ucfirst($action),
        "Admin $action recharge of {$final_amount} for user ID {$transaction['user_id']}."
    );

    echo json_encode(["success" => true, "message" => "Transaction $new_status successfully."]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Error processing transaction: " . $e->getMessage()]);
}
?>
