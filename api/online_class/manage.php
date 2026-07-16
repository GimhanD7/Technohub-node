<?php
require_once __DIR__ . '/../db/config.php';
require_once __DIR__ . '/../lib/logger.php';
header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $stmt = $pdo->prepare("SELECT * FROM online_classes WHERE id = ?");
            $stmt->execute([$id]);
            $class = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($class) {
                $class['fee'] = floatval($class['fee']);
                $class['duration'] = intval($class['duration']);
                echo json_encode(["success" => true, "class" => $class]);
            } else {
                echo json_encode(["success" => false, "message" => "Class not found."]);
            }
            exit();
        }

        // Fetch all online classes
        $stmt = $pdo->prepare("SELECT oc.*, u.full_name AS creator_name 
                               FROM online_classes oc 
                               LEFT JOIN users u ON oc.created_by = u.id 
                               ORDER BY oc.date_time ASC");
        $stmt->execute();
        $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch student enrollments if a studentId is provided
        $studentId = isset($_GET['studentId']) ? intval($_GET['studentId']) : null;
        $enrolledClassIds = [];
        if ($studentId) {
            $enrollStmt = $pdo->prepare("SELECT online_class_id FROM online_class_enrollments WHERE student_id = ?");
            $enrollStmt->execute([$studentId]);
            $enrolledClassIds = $enrollStmt->fetchAll(PDO::FETCH_COLUMN);
        }

        $ongoing = [];
        $upcoming = [];
        $past = [];

        $now = date('Y-m-d H:i:s');
        $nowTime = strtotime($now);

        foreach ($classes as $class) {
            $fee = floatval($class['fee']);
            $isEnrolled = in_array(intval($class['id']), $enrolledClassIds);
            
            // Mask meeting link if it is paid, a student ID was provided, and the student is not enrolled.
            $canViewLink = true;
            if ($studentId && $fee > 0 && !$isEnrolled) {
                $canViewLink = false;
            }

            $formattedClass = [
                "id" => intval($class['id']),
                "title" => $class['title'],
                "description" => $class['description'],
                "meeting_link" => $canViewLink ? $class['meeting_link'] : null,
                "platform" => $class['platform'],
                "date_time" => $class['date_time'],
                "duration" => intval($class['duration']),
                "fee" => $fee,
                "is_enrolled" => $isEnrolled,
                "created_by" => intval($class['created_by']),
                "creator_name" => $class['creator_name'] ?? 'Unknown Staff',
                "created_at" => $class['created_at']
            ];

            $startTime = strtotime($class['date_time']);
            $endTime = $startTime + (intval($class['duration']) * 60);

            if ($nowTime >= $startTime && $nowTime <= $endTime) {
                $ongoing[] = $formattedClass;
            } elseif ($nowTime < $startTime) {
                $upcoming[] = $formattedClass;
            } else {
                $past[] = $formattedClass;
            }
        }

        echo json_encode([
            "success" => true,
            "classes" => [
                "ongoing" => $ongoing,
                "upcoming" => $upcoming,
                "past" => $past
            ]
        ]);
        exit();
    } 
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['userId']) || !isset($data['role']) || !isset($data['title']) || !isset($data['meeting_link']) || !isset($data['date_time']) || !isset($data['duration'])) {
            echo json_encode(["success" => false, "message" => "Invalid or missing inputs."]);
            exit();
        }

        $userId = intval($data['userId']);
        $role = htmlspecialchars(strip_tags($data['role']));
        $title = htmlspecialchars(strip_tags($data['title']));
        $description = isset($data['description']) ? htmlspecialchars(strip_tags($data['description'])) : '';
        $meetingLink = htmlspecialchars(strip_tags($data['meeting_link']));
        $platform = isset($data['platform']) ? htmlspecialchars(strip_tags($data['platform'])) : 'Zoom';
        $dateTime = htmlspecialchars(strip_tags($data['date_time']));
        $duration = intval($data['duration']);
        $fee = isset($data['fee']) ? floatval($data['fee']) : 0.00;

        // Convert T to space if date comes from datetime-local input
        $dateTime = str_replace('T', ' ', $dateTime);

        if ($role !== 'admin' && $role !== 'teacher') {
            echo json_encode(["success" => false, "message" => "Unauthorized. Only admins and teachers can create classes."]);
            exit();
        }

        if (empty($title)) {
            echo json_encode(["success" => false, "message" => "Class title cannot be empty."]);
            exit();
        }

        if (empty($meetingLink)) {
            echo json_encode(["success" => false, "message" => "Meeting link cannot be empty."]);
            exit();
        }

        if ($duration <= 0) {
            echo json_encode(["success" => false, "message" => "Duration must be greater than 0 minutes."]);
            exit();
        }

        $stmt = $pdo->prepare("INSERT INTO online_classes (title, description, meeting_link, platform, date_time, duration, fee, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([$title, $description, $meetingLink, $platform, $dateTime, $duration, $fee, $userId])) {
            log_activity($pdo, $userId, 'Created Online Class', 'Scheduled live class: ' . $title);
            echo json_encode(["success" => true, "message" => "Online class '$title' scheduled successfully!"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to schedule online class."]);
        }
        exit();
    } 
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['id']) || !isset($data['userId']) || !isset($data['role']) || !isset($data['title']) || !isset($data['meeting_link']) || !isset($data['date_time']) || !isset($data['duration'])) {
            echo json_encode(["success" => false, "message" => "Invalid or missing inputs."]);
            exit();
        }

        $id = intval($data['id']);
        $userId = intval($data['userId']);
        $role = htmlspecialchars(strip_tags($data['role']));
        $title = htmlspecialchars(strip_tags($data['title']));
        $description = isset($data['description']) ? htmlspecialchars(strip_tags($data['description'])) : '';
        $meetingLink = htmlspecialchars(strip_tags($data['meeting_link']));
        $platform = isset($data['platform']) ? htmlspecialchars(strip_tags($data['platform'])) : 'Zoom';
        $dateTime = htmlspecialchars(strip_tags($data['date_time']));
        $duration = intval($data['duration']);
        $fee = isset($data['fee']) ? floatval($data['fee']) : 0.00;

        // Convert T to space
        $dateTime = str_replace('T', ' ', $dateTime);

        // Only admin is allowed to edit
        if ($role !== 'admin') {
            echo json_encode(["success" => false, "message" => "Unauthorized. Only administrators can edit online classes after creation."]);
            exit();
        }

        if (empty($title)) {
            echo json_encode(["success" => false, "message" => "Class title cannot be empty."]);
            exit();
        }

        if (empty($meetingLink)) {
            echo json_encode(["success" => false, "message" => "Meeting link cannot be empty."]);
            exit();
        }

        if ($duration <= 0) {
            echo json_encode(["success" => false, "message" => "Duration must be greater than 0 minutes."]);
            exit();
        }

        $stmt = $pdo->prepare("UPDATE online_classes SET title = ?, description = ?, meeting_link = ?, platform = ?, date_time = ?, duration = ?, fee = ? WHERE id = ?");
        if ($stmt->execute([$title, $description, $meetingLink, $platform, $dateTime, $duration, $fee, $id])) {
            log_activity($pdo, $userId, 'Updated Online Class', 'Updated live class: ' . $title);
            echo json_encode(["success" => true, "message" => "Online class '$title' updated successfully!"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to update online class."]);
        }
        exit();
    }
    elseif ($method === 'DELETE') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['id']) || !isset($data['userId']) || !isset($data['role'])) {
            echo json_encode(["success" => false, "message" => "Invalid or missing inputs."]);
            exit();
        }

        $id = intval($data['id']);
        $userId = intval($data['userId']);
        $role = htmlspecialchars(strip_tags($data['role']));

        // Allowed for admin and teacher
        if ($role !== 'admin' && $role !== 'teacher') {
            echo json_encode(["success" => false, "message" => "Unauthorized. Only administrators and teachers can delete classes."]);
            exit();
        }

        // Fetch class info to log details before deleting
        $fetchStmt = $pdo->prepare("SELECT title FROM online_classes WHERE id = ?");
        $fetchStmt->execute([$id]);
        $classInfo = $fetchStmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("DELETE FROM online_classes WHERE id = ?");
        if ($stmt->execute([$id])) {
            if ($classInfo) {
                log_activity($pdo, $userId, 'Deleted Online Class', 'Deleted live class: ' . $classInfo['title']);
            }
            echo json_encode(["success" => true, "message" => "Online class deleted successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to delete online class."]);
        }
        exit();
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Backend Error: " . $e->getMessage()]);
}
?>
