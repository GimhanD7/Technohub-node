<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    echo json_encode(["success" => false, "message" => "Only GET requests are allowed."]);
    exit();
}

if (!isset($_GET['student_id'])) {
    echo json_encode(["success" => false, "message" => "Student ID is required."]);
    exit();
}

$studentId = $_GET['student_id'];

function getGrade($percentage) {
    if ($percentage >= 75) return 'A';
    if ($percentage >= 65) return 'B';
    if ($percentage >= 50) return 'C';
    if ($percentage >= 35) return 'S';
    return 'F';
}

function getResultStatus($percentage) {
    return $percentage >= 50 ? 'Passed' : 'Needs Improvement';
}

function publicAssetUrl($url) {
    $cleanUrl = trim($url ?? "");
    if ($cleanUrl === "") {
        return $cleanUrl;
    }

    if (preg_match('/^(https?:)?\/\//i', $cleanUrl) || strpos($cleanUrl, "data:") === 0) {
        return $cleanUrl;
    }

    if (strpos($cleanUrl, "uploads/") === 0) {
        $cleanUrl = "/" . $cleanUrl;
    }

    if (strpos($cleanUrl, "/uploads/") === 0) {
        $scheme = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
        $host = $_SERVER["HTTP_HOST"] ?? "localhost";
        $scriptName = $_SERVER["SCRIPT_NAME"] ?? "";
        $apiPosition = strpos($scriptName, "/api/");
        $basePath = $apiPosition !== false ? substr($scriptName, 0, $apiPosition) : "";

        return rtrim($scheme . "://" . $host . $basePath, "/") . $cleanUrl;
    }

    return $cleanUrl;
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

    $stmtStudent = $pdo->prepare("SELECT id, full_name, phone_number, education_category, created_at FROM users WHERE id = ? AND role = 'student'");
    $stmtStudent->execute([$studentId]);
    $student = $stmtStudent->fetch(PDO::FETCH_ASSOC);

    if (!$student) {
        echo json_encode(["success" => false, "message" => "Student account not found."]);
        exit();
    }

    // 1. Fetch Exam Results
    $sqlExams = "
        SELECT 
            qa.id as attempt_id,
            q.id as quiz_id,
            q.title as exam_title,
            qa.score,
            COALESCE((SELECT SUM(marks) FROM questions WHERE quiz_id = q.id), 0) as total_possible_score,
            COALESCE((SELECT COUNT(*) FROM questions WHERE quiz_id = q.id), 0) as question_count,
            creator.full_name as teacher_name,
            q.start_time,
            q.end_time,
            qa.started_at,
            qa.submitted_at
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        LEFT JOIN users creator ON q.created_by = creator.id
        WHERE qa.user_id = ? AND qa.is_submitted = 1
        ORDER BY qa.submitted_at DESC
    ";
    
    // Wait, let's check if quizzes table has points_per_question. Usually it's just questions count.
    $stmtExams = $pdo->prepare($sqlExams);
    $stmtExams->execute([$studentId]);
    $exams = $stmtExams->fetchAll(PDO::FETCH_ASSOC);

    // Calculate percentage and grade for exams
    $totalExamsScore = 0;
    $totalExamsMaxScore = 0;
    foreach ($exams as &$exam) {
        // Fallback for total_possible_score if 0
        $max = $exam['total_possible_score'] > 0 ? $exam['total_possible_score'] : 100; // default 100 if no questions
        $exam['total_possible_score'] = $max;
        
        $percentage = ($exam['score'] / $max) * 100;
        $exam['percentage'] = round($percentage, 2);
        $exam['grade'] = getGrade($percentage);
        $exam['status'] = getResultStatus($percentage);

        $totalExamsScore += $exam['score'];
        $totalExamsMaxScore += $max;
    }
    
    $averageScore = $totalExamsMaxScore > 0 ? round(($totalExamsScore / $totalExamsMaxScore) * 100, 1) : 0;

    // 2. Fetch Enrolled Courses and Completion Status
    $sqlCourses = "
        SELECT 
            c.id, c.title, c.description, c.duration, c.points, c.banner_url, u.full_name as teacher_name, ce.enrolled_at,
            (SELECT COUNT(*) FROM course_materials cm JOIN course_modules cmod ON cm.module_id = cmod.id WHERE cmod.course_id = c.id) as total_materials,
            (SELECT COUNT(*) FROM material_completions mc JOIN course_materials cm ON mc.material_id = cm.id JOIN course_modules cmod ON cm.module_id = cmod.id WHERE cmod.course_id = c.id AND mc.student_id = ?) as completed_materials
        FROM course_enrollments ce
        JOIN courses c ON ce.course_id = c.id
        JOIN users u ON c.teacher_id = u.id
        WHERE ce.student_id = ?
        ORDER BY ce.enrolled_at DESC
    ";
    $stmtCourses = $pdo->prepare($sqlCourses);
    $stmtCourses->execute([$studentId, $studentId]);
    $courses = $stmtCourses->fetchAll(PDO::FETCH_ASSOC);

    $completedCoursesCount = 0;
    $totalMaterials = 0;
    $completedMaterials = 0;
    $earnedPoints = 0;
    foreach ($courses as &$course) {
        $total = intval($course['total_materials']);
        $completed = intval($course['completed_materials']);
        $course['banner_url'] = publicAssetUrl($course['banner_url'] ?? "");
        $totalMaterials += $total;
        $completedMaterials += $completed;
        
        if ($total == 0) {
            $course['progress_percentage'] = 0;
            $course['is_completed'] = false;
        } else {
            $course['progress_percentage'] = round(($completed / $total) * 100);
            $course['is_completed'] = ($completed >= $total);
            if ($course['is_completed']) {
                $completedCoursesCount++;
                $earnedPoints += intval($course['points'] ?? 0);
            }
        }
    }

    $passedExams = 0;
    $bestScore = 0;
    foreach ($exams as $exam) {
        if (floatval($exam['percentage']) >= 50) $passedExams++;
        if (floatval($exam['percentage']) > $bestScore) $bestScore = floatval($exam['percentage']);
    }

    echo json_encode([
        "success" => true,
        "student" => [
            "id" => intval($student["id"]),
            "fullName" => $student["full_name"],
            "phoneNumber" => $student["phone_number"],
            "educationCategory" => $student["education_category"],
            "joinedAt" => $student["created_at"]
        ],
        "exams" => $exams,
        "courses" => $courses,
        "stats" => [
            "total_exams_taken" => count($exams),
            "average_score" => $averageScore,
            "best_score" => round($bestScore, 2),
            "passed_exams" => $passedExams,
            "completed_courses" => $completedCoursesCount,
            "total_enrolled" => count($courses),
            "completed_materials" => $completedMaterials,
            "total_materials" => $totalMaterials,
            "earned_points" => $earnedPoints,
            "overall_progress" => $totalMaterials > 0 ? round(($completedMaterials / $totalMaterials) * 100) : 0
        ],
        "generatedAt" => date("Y-m-d H:i:s")
    ]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>
