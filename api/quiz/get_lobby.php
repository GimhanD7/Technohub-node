<?php
require_once '../db/config.php';
header("Content-Type: application/json");

$quizId = isset($_GET['quizId']) ? intval($_GET['quizId']) : 0;

if ($quizId <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid quiz ID"]);
    exit;
}

try {
    // Fetch students who have joined this quiz (have an attempt created)
    $query = "SELECT DISTINCT u.id, u.full_name, a.started_at 
              FROM quiz_attempts a
              JOIN users u ON a.user_id = u.id
              WHERE a.quiz_id = ? AND a.is_submitted = 0
              ORDER BY a.started_at DESC";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([$quizId]);
    $students = $stmt->fetchAll();

    // Format response
    $formattedStudents = array_map(function($student) {
        return [
            "id" => intval($student['id']),
            "fullName" => $student['full_name'],
            "joinedAt" => $student['started_at']
        ];
    }, $students);

    echo json_encode([
        "success" => true,
        "students" => $formattedStudents,
        "totalInLobby" => count($formattedStudents)
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Failed to fetch lobby students: " . $e->getMessage()]);
}
?>
