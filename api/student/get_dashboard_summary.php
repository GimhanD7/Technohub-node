<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(["success" => false, "message" => "Only GET requests are allowed."]);
    exit();
}

$studentId = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;

if ($studentId <= 0) {
    echo json_encode(["success" => false, "message" => "Student ID is required."]);
    exit();
}

function formatDateLabel($dateTime) {
    if (!$dateTime) return "N/A";

    $timestamp = strtotime($dateTime);
    if (!$timestamp) return "N/A";

    return date("M d, Y h:i A", $timestamp);
}

try {
    $materialCompletionsTable = "CREATE TABLE IF NOT EXISTS material_completions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        material_id INT NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY student_material_unique (student_id, material_id),
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES course_materials(id) ON DELETE CASCADE
    )";
    $pdo->exec($materialCompletionsTable);

    $stmtStudent = $pdo->prepare("SELECT id, full_name, wallet_balance FROM users WHERE id = ? AND role = 'student'");
    $stmtStudent->execute([$studentId]);
    $student = $stmtStudent->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(["success" => false, "message" => "Student account not found."]);
        exit();
    }

    $stmtCourseStats = $pdo->prepare("
        SELECT
            COUNT(DISTINCT ce.course_id) AS enrolled_courses,
            COUNT(DISTINCT CASE WHEN course_totals.total_materials > 0 AND course_totals.total_materials = course_totals.completed_materials THEN ce.course_id END) AS completed_courses,
            COALESCE(SUM(course_totals.total_materials), 0) AS total_materials,
            COALESCE(SUM(course_totals.completed_materials), 0) AS completed_materials
        FROM course_enrollments ce
        LEFT JOIN (
            SELECT
                c.id AS course_id,
                COUNT(cm.id) AS total_materials,
                COUNT(mc.id) AS completed_materials
            FROM courses c
            LEFT JOIN course_modules cmod ON cmod.course_id = c.id
            LEFT JOIN course_materials cm ON cm.module_id = cmod.id
            LEFT JOIN material_completions mc ON mc.material_id = cm.id AND mc.student_id = ?
            GROUP BY c.id
        ) course_totals ON course_totals.course_id = ce.course_id
        WHERE ce.student_id = ?
    ");
    $stmtCourseStats->execute([$studentId, $studentId]);
    $courseStats = $stmtCourseStats->fetch(PDO::FETCH_ASSOC) ?: [];

    $stmtQuizStats = $pdo->prepare("
        SELECT
            COUNT(CASE WHEN qa.is_submitted = 1 THEN 1 END) AS submitted_exams,
            COALESCE(SUM(CASE WHEN qa.is_submitted = 1 THEN qa.score ELSE 0 END), 0) AS earned_score,
            COALESCE(SUM(CASE WHEN qa.is_submitted = 1 THEN quiz_totals.max_score ELSE 0 END), 0) AS possible_score
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        LEFT JOIN (
            SELECT quiz_id, COALESCE(SUM(marks), 0) AS max_score
            FROM questions
            GROUP BY quiz_id
        ) quiz_totals ON quiz_totals.quiz_id = q.id
        WHERE qa.user_id = ?
    ");
    $stmtQuizStats->execute([$studentId]);
    $quizStats = $stmtQuizStats->fetch(PDO::FETCH_ASSOC) ?: [];

    $stmtQuizCounts = $pdo->prepare("
        SELECT
            COUNT(CASE WHEN NOW() BETWEEN q.start_time AND q.end_time THEN 1 END) AS active_quizzes,
            COUNT(CASE WHEN q.start_time > NOW() THEN 1 END) AS upcoming_quizzes,
            COUNT(CASE WHEN q.start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 1 END) AS quizzes_this_week,
            MIN(CASE WHEN q.start_time > NOW() THEN q.start_time END) AS next_quiz_time
        FROM quizzes q
        WHERE NOT EXISTS (
            SELECT 1
            FROM quiz_attempts qa
            WHERE qa.quiz_id = q.id AND qa.user_id = ? AND qa.is_submitted = 1
        )
    ");
    $stmtQuizCounts->execute([$studentId]);
    $quizCounts = $stmtQuizCounts->fetch(PDO::FETCH_ASSOC) ?: [];

    $stmtClassStats = $pdo->query("
        SELECT
            COUNT(CASE WHEN NOW() BETWEEN date_time AND DATE_ADD(date_time, INTERVAL duration MINUTE) THEN 1 END) AS ongoing_classes,
            COUNT(CASE WHEN date_time > NOW() THEN 1 END) AS upcoming_classes,
            COUNT(CASE WHEN date_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 1 END) AS classes_this_week,
            MIN(CASE WHEN date_time > NOW() THEN date_time END) AS next_class_time
        FROM online_classes
    ");
    $classStats = $stmtClassStats->fetch(PDO::FETCH_ASSOC) ?: [];

    $stmtCourseUpdates = $pdo->prepare("
        SELECT c.title AS course_title, cm.title AS item_title, cm.type, cm.created_at
        FROM course_materials cm
        JOIN course_modules cmod ON cm.module_id = cmod.id
        JOIN courses c ON cmod.course_id = c.id
        JOIN course_enrollments ce ON ce.course_id = c.id AND ce.student_id = ?
        ORDER BY cm.created_at DESC
        LIMIT 4
    ");
    $stmtCourseUpdates->execute([$studentId]);
    $courseUpdates = $stmtCourseUpdates->fetchAll(PDO::FETCH_ASSOC);

    $stmtUpcomingQuizzes = $pdo->query("
        SELECT title, start_time
        FROM quizzes
        WHERE start_time >= NOW()
        ORDER BY start_time ASC
        LIMIT 3
    ");
    $upcomingQuizzes = $stmtUpcomingQuizzes->fetchAll(PDO::FETCH_ASSOC);

    $stmtUpcomingClasses = $pdo->query("
        SELECT title, date_time
        FROM online_classes
        WHERE date_time >= NOW()
        ORDER BY date_time ASC
        LIMIT 3
    ");
    $upcomingClasses = $stmtUpcomingClasses->fetchAll(PDO::FETCH_ASSOC);

    $updates = [];
    foreach ($courseUpdates as $update) {
        $updates[] = [
            "area" => $update["course_title"],
            "message" => ucfirst($update["type"]) . " material added: " . $update["item_title"],
            "date" => formatDateLabel($update["created_at"]),
            "status" => "New Material",
            "timestamp" => strtotime($update["created_at"]) ?: 0
        ];
    }
    foreach ($upcomingQuizzes as $quiz) {
        $updates[] = [
            "area" => "Exam Hall",
            "message" => "Upcoming quiz: " . $quiz["title"],
            "date" => formatDateLabel($quiz["start_time"]),
            "status" => "Scheduled",
            "timestamp" => strtotime($quiz["start_time"]) ?: 0
        ];
    }
    foreach ($upcomingClasses as $class) {
        $updates[] = [
            "area" => "Online Class",
            "message" => "Live class scheduled: " . $class["title"],
            "date" => formatDateLabel($class["date_time"]),
            "status" => "Scheduled",
            "timestamp" => strtotime($class["date_time"]) ?: 0
        ];
    }

    usort($updates, function ($a, $b) {
        return $b["timestamp"] <=> $a["timestamp"];
    });
    $updates = array_slice(array_map(function ($item) {
        unset($item["timestamp"]);
        return $item;
    }, $updates), 0, 6);

    $totalMaterials = intval($courseStats["total_materials"] ?? 0);
    $completedMaterials = intval($courseStats["completed_materials"] ?? 0);
    $overallProgress = $totalMaterials > 0 ? round(($completedMaterials / $totalMaterials) * 100) : 0;

    $possibleScore = intval($quizStats["possible_score"] ?? 0);
    $earnedScore = intval($quizStats["earned_score"] ?? 0);
    $averageScore = $possibleScore > 0 ? round(($earnedScore / $possibleScore) * 100) : 0;

    $nextQuizTime = $quizCounts["next_quiz_time"] ?? null;
    $nextClassTime = $classStats["next_class_time"] ?? null;
    $nextEvent = null;
    if ($nextQuizTime && $nextClassTime) {
        $nextEvent = strtotime($nextQuizTime) <= strtotime($nextClassTime) ? $nextQuizTime : $nextClassTime;
    } else {
        $nextEvent = $nextQuizTime ?: $nextClassTime;
    }

    echo json_encode([
        "success" => true,
        "summary" => [
            "wallet_balance" => floatval($student["wallet_balance"]),
            "enrolled_courses" => intval($courseStats["enrolled_courses"] ?? 0),
            "completed_courses" => intval($courseStats["completed_courses"] ?? 0),
            "total_materials" => $totalMaterials,
            "completed_materials" => $completedMaterials,
            "overall_progress" => $overallProgress,
            "submitted_exams" => intval($quizStats["submitted_exams"] ?? 0),
            "average_score" => $averageScore,
            "active_quizzes" => intval($quizCounts["active_quizzes"] ?? 0),
            "upcoming_quizzes" => intval($quizCounts["upcoming_quizzes"] ?? 0),
            "ongoing_classes" => intval($classStats["ongoing_classes"] ?? 0),
            "upcoming_classes" => intval($classStats["upcoming_classes"] ?? 0),
            "due_this_week" => intval($quizCounts["quizzes_this_week"] ?? 0) + intval($classStats["classes_this_week"] ?? 0),
            "next_event" => $nextEvent ? formatDateLabel($nextEvent) : "No upcoming schedule"
        ],
        "updates" => $updates,
        "generatedAt" => date("Y-m-d H:i:s")
    ]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>
