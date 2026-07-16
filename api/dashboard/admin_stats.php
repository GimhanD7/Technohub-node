<?php
require_once '../db/config.php';
header("Content-Type: application/json");

try {
    // 1. Total Students
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    $totalStudents = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 2. Active Teachers
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE role = 'teacher' AND status = 'active'");
    $activeTeachers = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 3. Total Courses
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM courses");
    $totalCourses = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 4. Total Revenue (Mocked for now as sum of all payments, or just a fixed value if no payments table exists yet)
    $totalRevenue = 0;
    try {
        $stmt = $pdo->query("SELECT SUM(amount) as total FROM wallet_transactions WHERE status = 'approved' AND type = 'credit'");
        $totalRevenue = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
    } catch (Exception $e) {
        // Table might not exist or be named differently, default to 0
    }

    // 5. Recent Registrations
    $stmt = $pdo->query("SELECT id, index_number, full_name, email, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 5");
    $recentUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 6. User Roles Summary
    $stmt = $pdo->query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
    $roleSummary = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "stats" => [
            "total_students" => $totalStudents,
            "active_teachers" => $activeTeachers,
            "total_courses" => $totalCourses,
            "total_revenue" => $totalRevenue,
            "recent_users" => $recentUsers,
            "role_summary" => $roleSummary
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
