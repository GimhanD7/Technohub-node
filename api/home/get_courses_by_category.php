<?php
require_once __DIR__ . '/../db/config.php';
header("Content-Type: application/json");

try {
    // Fetch all active categories
    $catStmt = $pdo->query("SELECT * FROM course_categories WHERE status = 'active' ORDER BY name ASC");
    $categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch all active courses along with teacher info
    $courseQuery = "
        SELECT 
            c.*, 
            u.full_name as teacher_name, 
            u.profile_picture as teacher_profile 
        FROM courses c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.status = 'active'
        ORDER BY c.created_at DESC
    ";
    $courseStmt = $pdo->query($courseQuery);
    $courses = $courseStmt->fetchAll(PDO::FETCH_ASSOC);

    // Group courses by category ID
    $groupedCourses = [];
    $uncategorizedCourses = [];

    foreach ($courses as $course) {
        if ($course['category_id']) {
            if (!isset($groupedCourses[$course['category_id']])) {
                $groupedCourses[$course['category_id']] = [];
            }
            $groupedCourses[$course['category_id']][] = $course;
        } else {
            $uncategorizedCourses[] = $course;
        }
    }

    // Attach courses to categories
    $resultData = [];
    foreach ($categories as $category) {
        $catId = $category['id'];
        if (isset($groupedCourses[$catId]) && count($groupedCourses[$catId]) > 0) {
            $category['courses'] = $groupedCourses[$catId];
            $resultData[] = $category;
        }
    }

    // Add uncategorized if they exist
    if (count($uncategorizedCourses) > 0) {
        $resultData[] = [
            "id" => null,
            "name" => "Other Courses",
            "slug" => "other",
            "courses" => $uncategorizedCourses
        ];
    }

    echo json_encode(["success" => true, "data" => $resultData]);

} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Backend Error: " . $e->getMessage()]);
}
?>
