<?php
require_once '../db/config.php';
header("Content-Type: application/json");

if (!isset($_GET['quizId'])) {
    echo json_encode(["success" => false, "message" => "Quiz ID is required."]);
    exit();
}

$quizId = intval($_GET['quizId']);

try {
    // 1. Fetch rankings sorted by score desc, then by time taken asc
    $query = "SELECT a.id, a.score, a.started_at, a.submitted_at, 
                     TIMESTAMPDIFF(SECOND, a.started_at, a.submitted_at) AS time_taken,
                     u.full_name, u.index_number, u.role
              FROM quiz_attempts a
              JOIN users u ON a.user_id = u.id
              WHERE a.quiz_id = ? AND a.is_submitted = 1
              ORDER BY a.score DESC, time_taken ASC, a.submitted_at ASC";
              
    $stmt = $pdo->prepare($query);
    $stmt->execute([$quizId]);
    $rankings = $stmt->fetchAll();

    // 2. Fetch quiz total marks possible
    $stmtMax = $pdo->prepare("SELECT SUM(marks) as max_marks FROM questions WHERE quiz_id = ?");
    $stmtMax->execute([$quizId]);
    $maxRow = $stmtMax->fetch();
    $maxMarks = $maxRow ? intval($maxRow['max_marks']) : 0;

    $list = [];
    $rank = 1;
    foreach ($rankings as $row) {
        $list[] = [
            "rank" => $rank++,
            "fullName" => $row['full_name'],
            "indexNumber" => $row['index_number'],
            "score" => intval($row['score']),
            "timeTaken" => intval($row['time_taken']),
            "submittedAt" => $row['submitted_at']
        ];
    }

    echo json_encode([
        "success" => true,
        "maxMarks" => $maxMarks,
        "rankings" => $list
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to load rankings: " . $e->getMessage()]);
}
?>
