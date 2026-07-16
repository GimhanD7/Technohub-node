<?php
require_once '../db/config.php';
header("Content-Type: application/json");

if (!isset($_GET['quizId']) || !isset($_GET['userId'])) {
    echo json_encode(["success" => false, "message" => "Quiz ID and User ID are required."]);
    exit();
}

$quizId = intval($_GET['quizId']);
$userId = intval($_GET['userId']);

try {
    // 1. Get quiz info
    $quizStmt = $pdo->prepare("SELECT * FROM quizzes WHERE id = ?");
    $quizStmt->execute([$quizId]);
    $quiz = $quizStmt->fetch(PDO::FETCH_ASSOC);

    if (!$quiz) {
        echo json_encode(["success" => false, "message" => "Quiz not found."]);
        exit();
    }

    // 2. Get current user's attempt
    $attemptStmt = $pdo->prepare("
        SELECT * FROM quiz_attempts 
        WHERE quiz_id = ? AND user_id = ? 
        ORDER BY submitted_at DESC LIMIT 1
    ");
    $attemptStmt->execute([$quizId, $userId]);
    $userAttempt = $attemptStmt->fetch(PDO::FETCH_ASSOC);

    if (!$userAttempt) {
        echo json_encode(["success" => false, "message" => "No attempt found for this user."]);
        exit();
    }

    // Fetch user role to determine if shuffling is needed
    $stmtRole = $pdo->prepare("SELECT role FROM users WHERE id = ?");
    $stmtRole->execute([$userId]);
    $userRow = $stmtRole->fetch();
    $isStudent = ($userRow && $userRow['role'] === 'student');
    // 3. Get all questions with options and user's answers
    $questionsStmt = $pdo->prepare("
        SELECT q.*, GROUP_CONCAT(
            JSON_OBJECT(
                'id', o.id,
                'text', o.option_text,
                'isCorrect', o.is_correct
            )
        ) as options
        FROM questions q
        LEFT JOIN options o ON q.id = o.question_id
        WHERE q.quiz_id = ?
        GROUP BY q.id
        ORDER BY q.id
    ");
    $questionsStmt->execute([$quizId]);
    $questionsData = $questionsStmt->fetchAll(PDO::FETCH_ASSOC);

    if ($isStudent) {
        srand($userId * 1000 + $quizId);
        shuffle($questionsData);
    }

    $questions = [];
    foreach ($questionsData as $q) {
        $options = json_decode('[' . $q['options'] . ']');
        if ($isStudent) {
            shuffle($options);
        }
        $questions[] = [
            'id' => intval($q['id']),
            'text' => $q['question_text'],
            'imageUrl' => $q['image_url'],
            'marks' => intval($q['marks']),
            'options' => $options
        ];
    }

    // 4. Get user's responses
    $responsesStmt = $pdo->prepare("
        SELECT sr.question_id, sr.option_id, o.is_correct
        FROM student_responses sr
        JOIN options o ON sr.option_id = o.id
        WHERE sr.attempt_id = ?
    ");
    $responsesStmt->execute([$userAttempt['id']]);
    $responses = [];
    while ($row = $responsesStmt->fetch(PDO::FETCH_ASSOC)) {
        if (!isset($responses[$row['question_id']])) {
            $responses[$row['question_id']] = [];
        }
        $responses[$row['question_id']][] = [
            'optionId' => intval($row['option_id']),
            'isCorrect' => boolval($row['is_correct'])
        ];
    }

    // 5. Get all rankings
    $rankingsStmt = $pdo->prepare("
        SELECT a.id, a.score, a.started_at, a.submitted_at,
               TIMESTAMPDIFF(SECOND, a.started_at, a.submitted_at) AS time_taken,
               u.full_name, u.index_number, u.id as user_id, u.role
        FROM quiz_attempts a
        JOIN users u ON a.user_id = u.id
        WHERE a.quiz_id = ? AND a.is_submitted = 1
        ORDER BY a.score DESC, time_taken ASC
    ");
    $rankingsStmt->execute([$quizId]);
    $rankingsRows = $rankingsStmt->fetchAll(PDO::FETCH_ASSOC);

    $maxMarksStmt = $pdo->prepare("SELECT SUM(marks) as max_marks FROM questions WHERE quiz_id = ?");
    $maxMarksStmt->execute([$quizId]);
    $maxMarksRow = $maxMarksStmt->fetch();
    $maxMarks = intval($maxMarksRow['max_marks']) ?: 0;

    $rankings = [];
    $userRank = 0;
    $rank = 1;
    foreach ($rankingsRows as $row) {
        $rankData = [
            'rank' => $rank,
            'fullName' => $row['full_name'],
            'indexNumber' => $row['index_number'],
            'userId' => intval($row['user_id']),
            'score' => intval($row['score']),
            'percentage' => $maxMarks > 0 ? round((intval($row['score']) / $maxMarks) * 100) : 0,
            'timeTaken' => intval($row['time_taken']),
            'submittedAt' => $row['submitted_at']
        ];
        
        if (intval($row['user_id']) === $userId) {
            $userRank = $rank;
        }
        
        $rankings[] = $rankData;
        $rank++;
    }

    echo json_encode([
        "success" => true,
        "quiz" => [
            'id' => intval($quiz['id']),
            'title' => $quiz['title'],
            'startTime' => $quiz['start_time'],
            'endTime' => $quiz['end_time']
        ],
        "maxMarks" => $maxMarks,
        "userAttempt" => [
            'id' => intval($userAttempt['id']),
            'score' => intval($userAttempt['score']),
            'submittedAt' => $userAttempt['submitted_at'],
            'timeTaken' => isset($userAttempt['submitted_at']) ? 
                intval((strtotime($userAttempt['submitted_at']) - strtotime($userAttempt['started_at']))) : 0
        ],
        "questions" => $questions,
        "userResponses" => $responses,
        "rankings" => $rankings,
        "userRank" => $userRank
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
}
?>
