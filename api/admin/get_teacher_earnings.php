<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

try {
    $query = "
        SELECT 
            u.id, 
            u.full_name, 
            u.subject,
            u.profile_picture,
            IFNULL(tc.commission_type, 'percentage') as commission_type,
            IFNULL(tc.commission_value, 80.00) as commission_value,
            (SELECT IFNULL(SUM(net_earning), 0) FROM teacher_earnings_history WHERE teacher_id = u.id) as total_earnings
        FROM users u
        LEFT JOIN teacher_commissions tc ON u.id = tc.teacher_id
        WHERE u.role = 'teacher'
        ORDER BY u.full_name ASC
    ";
    $stmt = $pdo->query($query);
    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "teachers" => $teachers
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error fetching earnings: " . $e->getMessage()
    ]);
}
?>
