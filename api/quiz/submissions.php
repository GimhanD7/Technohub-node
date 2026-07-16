<?php
require_once '../db/config.php';
header("Content-Type: application/json");

if (!isset($_GET['quizId'])) {
    echo json_encode(["success" => false, "message" => "Quiz ID is required."]);
    exit();
}

$quizId = intval($_GET['quizId']);
$userId = isset($_GET['userId']) ? intval($_GET['userId']) : null;
$role = isset($_GET['role']) ? htmlspecialchars(strip_tags($_GET['role'])) : null;

// Authorization check - only teachers/admins can view
if (!$role || !in_array($role, ['teacher', 'admin'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized access."]);
    exit();
}

try {
    // 1. Get quiz info
    $quizStmt = $pdo->prepare("SELECT * FROM quizzes WHERE id = ?");
    $quizStmt->execute([$quizId]);
    $quiz = $quizStmt->fetch(PDO::FETCH_ASSOC);

    if (!$quiz) {
        echo json_encode(["success" => false, "message" => "Quiz not found."]);
        exit();
    }

    // For teachers: verify they created this quiz (Disabled so teachers can view submissions for any quiz)
    /*
    if ($role === 'teacher' && intval($quiz['created_by']) !== $userId) {
        echo json_encode(["success" => false, "message" => "You do not have access to this quiz."]);
        exit();
    }
    */

    // 2. Get all submissions
    $submissionsStmt = $pdo->prepare("
        SELECT a.id, a.score, a.started_at, a.submitted_at,
               TIMESTAMPDIFF(SECOND, a.started_at, a.submitted_at) AS time_taken,
               u.id as user_id, u.full_name, u.index_number, u.phone_number, u.role
        FROM quiz_attempts a
        JOIN users u ON a.user_id = u.id
        WHERE a.quiz_id = ? AND a.is_submitted = 1
        ORDER BY a.score DESC, time_taken ASC
    ");
    $submissionsStmt->execute([$quizId]);
    $submissionsRows = $submissionsStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Get max marks
    $maxMarksStmt = $pdo->prepare("SELECT SUM(marks) as max_marks FROM questions WHERE quiz_id = ?");
    $maxMarksStmt->execute([$quizId]);
    $maxMarksRow = $maxMarksStmt->fetch();
    $maxMarks = intval($maxMarksRow['max_marks']) ?: 0;

    // 4. Get all questions
    $questionsStmt = $pdo->prepare("
        SELECT id, question_text, image_url, marks FROM questions WHERE quiz_id = ? ORDER BY id
    ");
    $questionsStmt->execute([$quizId]);
    $questionsRows = $questionsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $questions = [];
    foreach ($questionsRows as $q) {
        $questions[] = [
            'id' => intval($q['id']),
            'text' => $q['question_text'],
            'imageUrl' => $q['image_url'],
            'marks' => intval($q['marks'])
        ];
    }

    $submissions = [];
    $rank = 1;
    foreach ($submissionsRows as $row) {
        // Get student answers for this submission
        $answersStmt = $pdo->prepare("
            SELECT sr.question_id, GROUP_CONCAT(sr.option_id) as option_ids
            FROM student_responses sr
            WHERE sr.attempt_id = ?
            GROUP BY sr.question_id
        ");
        $answersStmt->execute([intval($row['id'])]);
        $answers = [];
        while ($ansRow = $answersStmt->fetch(PDO::FETCH_ASSOC)) {
            $answers[intval($ansRow['question_id'])] = explode(',', $ansRow['option_ids']);
        }

        $submissions[] = [
            'rank' => $rank++,
            'attemptId' => intval($row['id']),
            'userId' => intval($row['user_id']),
            'fullName' => $row['full_name'],
            'indexNumber' => $row['index_number'],
            'phone' => $row['phone_number'],
            'role' => $row['role'],
            'score' => intval($row['score']),
            'percentage' => $maxMarks > 0 ? round((intval($row['score']) / $maxMarks) * 100) : 0,
            'timeTaken' => intval($row['time_taken']),
            'startedAt' => $row['started_at'],
            'submittedAt' => $row['submitted_at'],
            'answers' => $answers
        ];
    }

    // 5. Calculate statistics
    $totalAttempts = count($submissions);
    $avgScore = 0;
    $avgPercentage = 0;
    
    if ($totalAttempts > 0) {
        $totalScore = array_reduce($submissions, function($carry, $item) {
            return $carry + $item['score'];
        }, 0);
        $avgScore = round($totalScore / $totalAttempts, 2);
        $avgPercentage = $maxMarks > 0 ? round(($avgScore / $maxMarks) * 100, 2) : 0;
    }

    echo json_encode([
        "success" => true,
        "quiz" => [
            'id' => intval($quiz['id']),
            'title' => $quiz['title'],
            'startTime' => $quiz['start_time'],
            'endTime' => $quiz['end_time'],
            'createdBy' => intval($quiz['created_by'])
        ],
        "maxMarks" => $maxMarks,
        "questions" => $questions,
        "statistics" => [
            'totalSubmissions' => $totalAttempts,
            'averageScore' => $avgScore,
            'averagePercentage' => $avgPercentage
        ],
        "submissions" => $submissions
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>
