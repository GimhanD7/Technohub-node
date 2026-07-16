<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

include_once '../db/config.php';

if (!isset($_GET['teacher_id'])) {
    echo json_encode(["success" => false, "message" => "Teacher ID is required."]);
    exit;
}

$teacher_id = intval($_GET['teacher_id']);

try {
    // 1. Course Earnings
    // Count enrollments and multiply by the course points.
    $courseQuery = "
        SELECT 
            c.id, 
            c.title, 
            c.points as price, 
            COUNT(ce.id) as enrollments, 
            (COUNT(ce.id) * c.points) as total_earned 
        FROM courses c 
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id 
        WHERE c.teacher_id = :teacher_id AND c.points > 0 
        GROUP BY c.id
    ";
    
    $stmt = $pdo->prepare($courseQuery);
    $stmt->execute([':teacher_id' => $teacher_id]);
    $course_breakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Exam Earnings
    // Sum the amount from quiz_payments.
    $examQuery = "
        SELECT 
            q.id, 
            q.title, 
            q.fee, 
            COUNT(qp.id) as unlocks, 
            IFNULL(SUM(qp.amount), 0) as total_earned 
        FROM quizzes q 
        LEFT JOIN quiz_payments qp ON q.id = qp.quiz_id 
        WHERE q.created_by = :teacher_id AND q.fee > 0 
        GROUP BY q.id
    ";
    
    $stmt2 = $pdo->prepare($examQuery);
    $stmt2->execute([':teacher_id' => $teacher_id]);
    $exam_breakdown = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    $total_course_earnings = 0;
    foreach($course_breakdown as $c) {
        $total_course_earnings += floatval($c['total_earned']);
    }

    $total_exam_earnings = 0;
    foreach($exam_breakdown as $e) {
        $total_exam_earnings += floatval($e['total_earned']);
    }

    echo json_encode([
        "success" => true,
        "summary" => [
            "total_earnings" => $total_course_earnings + $total_exam_earnings,
            "course_earnings" => $total_course_earnings,
            "exam_earnings" => $total_exam_earnings
        ],
        "course_breakdown" => $course_breakdown,
        "exam_breakdown" => $exam_breakdown
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>
