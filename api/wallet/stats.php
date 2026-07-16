<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$role = $_GET['role'] ?? null;

if ($role !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized access."]);
    exit();
}

try {
    // This month approved
    $stmt1 = $pdo->query("SELECT SUM(amount) as total FROM wallet_transactions WHERE status = 'approved' AND type = 'credit' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())");
    $thisMonthApproved = $stmt1->fetchColumn() ?: 0;

    // This month pending
    $stmt2 = $pdo->query("SELECT SUM(amount) as total FROM wallet_transactions WHERE status = 'pending' AND type = 'credit' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())");
    $thisMonthPending = $stmt2->fetchColumn() ?: 0;

    // Monthly trend (last 12 months)
    $stmt3 = $pdo->query("
        SELECT 
            DATE_FORMAT(created_at, '%b %Y') as month_name,
            SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as total,
            COUNT(*) as total_payments,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
        FROM wallet_transactions 
        WHERE type = 'credit'
        GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b %Y')
        ORDER BY YEAR(created_at) DESC, MONTH(created_at) DESC
        LIMIT 12
    ");
    $monthlyTrend = $stmt3->fetchAll(PDO::FETCH_ASSOC);

    $stmt4 = $pdo->query("
        SELECT 
            COALESCE(u.education_category, 'Other') as grade_name,
            SUM(CASE WHEN t.status = 'approved' THEN t.amount ELSE 0 END) as total,
            COUNT(*) as total_payments,
            SUM(CASE WHEN t.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
            SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN t.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
        FROM wallet_transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.type = 'credit'
        GROUP BY u.education_category
        ORDER BY grade_name ASC
    ");
    $gradeTrend = $stmt4->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "thisMonthApproved" => (float)$thisMonthApproved,
        "thisMonthPending" => (float)$thisMonthPending,
        "monthlyTrend" => array_reverse($monthlyTrend),
        "gradeTrend" => $gradeTrend
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error fetching stats: " . $e->getMessage()]);
}
?>
