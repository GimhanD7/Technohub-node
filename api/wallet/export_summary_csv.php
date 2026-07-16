<?php
require_once __DIR__ . '/../db/config.php';

// Allow from any origin (similar to other endpoints, though better to secure it)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$role = $_GET['role'] ?? null;

if ($role !== 'admin') {
    header("HTTP/1.1 403 Forbidden");
    echo "Unauthorized access.";
    exit();
}

try {
    $stmt = $pdo->query("
        SELECT 
            u.full_name as `User Name`, 
            u.email as `Email`,
            u.phone_number as `Phone Number`,
            DATE_FORMAT(t.created_at, '%Y-%m') as `Month`,
            SUM(CASE WHEN t.status = 'approved' AND t.type = 'credit' THEN t.amount ELSE 0 END) as `Total Approved (LKR)`,
            SUM(CASE WHEN t.status = 'pending' AND t.type = 'credit' THEN t.amount ELSE 0 END) as `Total Pending (LKR)`,
            SUM(CASE WHEN t.status = 'rejected' AND t.type = 'credit' THEN t.amount ELSE 0 END) as `Total Rejected (LKR)`
        FROM wallet_transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.type = 'credit'
        GROUP BY u.id, DATE_FORMAT(t.created_at, '%Y-%m')
        ORDER BY `Month` DESC, `User Name` ASC
    ");

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="wallet_summary_' . date('Y-m-d') . '.csv"');

    $output = fopen('php://output', 'w');
    
    if (count($results) > 0) {
        // Output column headers
        fputcsv($output, array_keys($results[0]));
        
        // Output rows
        foreach ($results as $row) {
            fputcsv($output, $row);
        }
    } else {
        fputcsv($output, ['No data available']);
    }
    
    fclose($output);
    exit();
    
} catch (Exception $e) {
    header("HTTP/1.1 500 Internal Server Error");
    echo "Error generating CSV: " . $e->getMessage();
}
?>
