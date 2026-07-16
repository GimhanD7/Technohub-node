<?php
require_once '../db/config.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->userId) || !isset($data->role) || !isset($data->title) || !isset($data->startTime) || !isset($data->endTime) || !isset($data->questions)) {
    echo json_encode(["success" => false, "message" => "Invalid input data."]);
    exit();
}

$userId = intval($data->userId);
$role = htmlspecialchars(strip_tags($data->role));
$title = htmlspecialchars(strip_tags($data->title));
$startTime = htmlspecialchars(strip_tags($data->startTime));
$endTime = htmlspecialchars(strip_tags($data->endTime));
$questions = $data->questions;
$fee = isset($data->fee) ? floatval($data->fee) : 0.00;

// Convert T to space if date comes from datetime-local input
$startTime = str_replace('T', ' ', $startTime);
$endTime = str_replace('T', ' ', $endTime);

if ($role !== 'admin' && $role !== 'teacher') {
    echo json_encode(["success" => false, "message" => "Unauthorized. Only admins and teachers can create quizzes."]);
    exit();
}

if (empty($title)) {
    echo json_encode(["success" => false, "message" => "Quiz title cannot be empty."]);
    exit();
}

if (strtotime($endTime) <= strtotime($startTime)) {
    echo json_encode(["success" => false, "message" => "Quiz end time must be after start time."]);
    exit();
}

try {
    $pdo->beginTransaction();

    // 1. Insert quiz metadata
    $stmtQuiz = $pdo->prepare("INSERT INTO quizzes (title, start_time, end_time, created_by, fee) VALUES (?, ?, ?, ?, ?)");
    $stmtQuiz->execute([$title, $startTime, $endTime, $userId, $fee]);
    $quizId = $pdo->lastInsertId();

    // 2. Insert questions and their options
    foreach ($questions as $q) {
        $qText = htmlspecialchars(strip_tags($q->text));
        $qMarks = isset($q->marks) ? intval($q->marks) : 1;
        $qImageUrl = isset($q->imageUrl) && !empty($q->imageUrl) ? htmlspecialchars(strip_tags($q->imageUrl)) : null;
        
        if (empty($qText)) {
            throw new Exception("Question text cannot be empty.");
        }

        $stmtQ = $pdo->prepare("INSERT INTO questions (quiz_id, question_text, image_url, marks) VALUES (?, ?, ?, ?)");
        $stmtQ->execute([$quizId, $qText, $qImageUrl, $qMarks]);
        $questionId = $pdo->lastInsertId();

        if (!isset($q->options) || count($q->options) < 2) {
            throw new Exception("Each question must have at least 2 options.");
        }

        // Insert options
        foreach ($q->options as $opt) {
            $optText = htmlspecialchars(strip_tags($opt->text));
            $isCorrect = isset($opt->is_correct) && $opt->is_correct ? 1 : 0;

            if (empty($optText)) {
                throw new Exception("Option text cannot be empty.");
            }

            $stmtOpt = $pdo->prepare("INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)");
            $stmtOpt->execute([$questionId, $optText, $isCorrect]);
        }
    }

    $pdo->commit();
    echo json_encode(["success" => true, "message" => "Quiz '$title' created successfully!", "quiz_id" => $quizId]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(["success" => false, "message" => "Failed to create quiz: " . $e->getMessage()]);
}
?>
