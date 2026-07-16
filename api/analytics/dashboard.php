<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$role = $_GET['role'] ?? null;

if ($role !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized access."]);
    exit();
}

try {
    $data = [];

    // --- 1. WALLET / REVENUE STATS ---
    // This month approved
    $stmt1 = $pdo->query("SELECT SUM(amount) as total FROM wallet_transactions WHERE status = 'approved' AND type = 'credit' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())");
    $data['thisMonthApproved'] = (float)($stmt1->fetchColumn() ?: 0);

    // This month pending
    $stmt2 = $pdo->query("SELECT SUM(amount) as total FROM wallet_transactions WHERE status = 'pending' AND type = 'credit' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())");
    $data['thisMonthPending'] = (float)($stmt2->fetchColumn() ?: 0);

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
    $data['monthlyTrend'] = array_reverse($stmt3->fetchAll(PDO::FETCH_ASSOC));

    // Grade-wise trend
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
    $data['gradeTrend'] = $stmt4->fetchAll(PDO::FETCH_ASSOC);

    // --- 2. USER STATS ---
    $data['totalUsers'] = (int)($pdo->query("SELECT COUNT(*) FROM users")->fetchColumn() ?: 0);

    $stmtRole = $pdo->query("SELECT role as name, COUNT(*) as value FROM users GROUP BY role");
    $data['userRoleDistribution'] = $stmtRole->fetchAll(PDO::FETCH_ASSOC);

    $stmtStatus = $pdo->query("SELECT COALESCE(status, 'active') as name, COUNT(*) as value FROM users GROUP BY status");
    $data['userStatusDistribution'] = $stmtStatus->fetchAll(PDO::FETCH_ASSOC);

    // --- 3. COURSE STATS ---
    // Handle case where course tables might not exist (to prevent failure if db schema is slightly different)
    try {
        $data['totalCourses'] = (int)($pdo->query("SELECT COUNT(*) FROM courses")->fetchColumn() ?: 0);
        $data['totalModules'] = (int)($pdo->query("SELECT COUNT(*) FROM course_modules")->fetchColumn() ?: 0);
        
        $stmtCategory = $pdo->query("SELECT subject as name, COUNT(*) as value FROM courses GROUP BY subject LIMIT 5");
        $data['courseCategories'] = $stmtCategory->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $data['totalCourses'] = 0;
        $data['totalModules'] = 0;
        $data['courseCategories'] = [];
    }

    // --- 4. QUIZ STATS ---
    try {
        $data['totalQuizzes'] = (int)($pdo->query("SELECT COUNT(*) FROM quizzes")->fetchColumn() ?: 0);
        $data['totalQuizAttempts'] = (int)($pdo->query("SELECT COUNT(*) FROM quiz_attempts")->fetchColumn() ?: 0);
        
        // Top Quizzes by Attempts
        $stmtTopQuizzes = $pdo->query("
            SELECT q.title as name, COUNT(a.id) as value 
            FROM quizzes q
            LEFT JOIN quiz_attempts a ON q.id = a.quiz_id
            GROUP BY q.id
            ORDER BY value DESC
            LIMIT 5
        ");
        $data['topQuizzes'] = $stmtTopQuizzes->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $data['totalQuizzes'] = 0;
        $data['totalQuizAttempts'] = 0;
        $data['topQuizzes'] = [];
    }

    // --- 5. E-BOOK STATS ---
    try {
        $data['totalEbooks'] = (int)($pdo->query("SELECT COUNT(*) FROM ebook_resources")->fetchColumn() ?: 0);
        
        // E-books by subject
        $stmtEbookSubj = $pdo->query("SELECT subject as name, COUNT(*) as value FROM ebook_resources GROUP BY subject LIMIT 7");
        $data['ebookSubjects'] = $stmtEbookSubj->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $data['totalEbooks'] = 0;
        $data['ebookSubjects'] = [];
    }

    // --- 6. SYSTEM HISTORY STATS ---
    try {
        $data['totalLogs'] = (int)($pdo->query("SELECT COUNT(*) FROM system_logs")->fetchColumn() ?: 0);
        
        $stmtLogs = $pdo->query("SELECT action as name, COUNT(*) as value FROM system_logs GROUP BY action ORDER BY value DESC LIMIT 7");
        $data['systemActions'] = $stmtLogs->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $data['totalLogs'] = 0;
        $data['systemActions'] = [];
    }

    echo json_encode([
        "success" => true,
        "data" => $data
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error fetching analytics: " . $e->getMessage()]);
}
?>
