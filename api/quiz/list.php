<?php
require_once '../db/config.php';
header("Content-Type: application/json");

$userId = isset($_GET['userId']) ? intval($_GET['userId']) : 0;

try {
    // Fetch all quizzes with their question counts and creators' names
    $query = "SELECT q.*, u.full_name AS creator_name, COUNT(qs.id) AS question_count 
              FROM quizzes q 
              LEFT JOIN users u ON q.created_by = u.id
              LEFT JOIN questions qs ON q.id = qs.quiz_id
              GROUP BY q.id 
              ORDER BY q.start_time DESC";
    $stmt = $pdo->query($query);
    $quizzes = $stmt->fetchAll();

    $active = [];
    $upcoming = [];
    $past = [];

    $now = date('Y-m-d H:i:s');

    foreach ($quizzes as $quiz) {
        $quizId = intval($quiz['id']);
        
        // Check if this user has an attempt for this quiz
        $attempt = null;
        if ($userId > 0) {
            $stmtAttempt = $pdo->prepare("SELECT id, score, started_at, submitted_at, is_submitted FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?");
            $stmtAttempt->execute([$quizId, $userId]);
            $attempt = $stmtAttempt->fetch();
        }

        // Older databases may not have the fee column until migrations run.
        // Keep this public listing response valid JSON during that upgrade window.
        $fee = floatval($quiz['fee'] ?? 0);
        $isPaid = true;

        if ($fee > 0) {
            if ($userId > 0) {
                $stmtRole = $pdo->prepare("SELECT role FROM users WHERE id = ?");
                $stmtRole->execute([$userId]);
                $userRoleRow = $stmtRole->fetch();
                
                if ($userRoleRow && $userRoleRow['role'] === 'student') {
                    $stmtPay = $pdo->prepare("SELECT id FROM quiz_payments WHERE quiz_id = ? AND user_id = ?");
                    $stmtPay->execute([$quizId, $userId]);
                    if (!$stmtPay->fetch()) {
                        $isPaid = false;
                    }
                }
            } else {
                $isPaid = false;
            }
        }

        $formattedQuiz = [
            "id" => $quizId,
            "title" => $quiz['title'],
            "startTime" => $quiz['start_time'],
            "endTime" => $quiz['end_time'],
            "createdBy" => intval($quiz['created_by']),
            "creatorName" => $quiz['creator_name'],
            "questionCount" => intval($quiz['question_count']),
            "createdAt" => $quiz['created_at'],
            "fee" => $fee,
            "isPaid" => $isPaid,
            "attempt" => $attempt ? [
                "id" => intval($attempt['id']),
                "score" => intval($attempt['score']),
                "startedAt" => $attempt['started_at'],
                "submittedAt" => $attempt['submitted_at'],
                "isSubmitted" => intval($attempt['is_submitted']) === 1
            ] : null
        ];

        if ($now >= $quiz['start_time'] && $now <= $quiz['end_time']) {
            $active[] = $formattedQuiz;
        } elseif ($now < $quiz['start_time']) {
            $upcoming[] = $formattedQuiz;
        } else {
            $past[] = $formattedQuiz;
        }
    }

    echo json_encode([
        "success" => true,
        "quizzes" => [
            "active" => $active,
            "upcoming" => $upcoming,
            "past" => $past
        ]
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to load quizzes: " . $e->getMessage()]);
}
?>
