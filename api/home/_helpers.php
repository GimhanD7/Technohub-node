<?php
function cleanText($value) {
    return htmlspecialchars(strip_tags(trim($value ?? "")));
}

function cleanNullableText($value) {
    $cleaned = cleanText($value);
    return $cleaned === "" ? null : $cleaned;
}

function displayText($value) {
    return $value === null ? null : html_entity_decode($value, ENT_QUOTES, 'UTF-8');
}

function getProjectPublicBaseUrl() {
    $scheme = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
    $host = $_SERVER["HTTP_HOST"] ?? "localhost";
    $scriptName = $_SERVER["SCRIPT_NAME"] ?? "";
    $apiPosition = strpos($scriptName, "/api/");
    $basePath = $apiPosition !== false ? substr($scriptName, 0, $apiPosition) : "";

    return rtrim($scheme . "://" . $host . $basePath, "/");
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
        return getProjectPublicBaseUrl() . $cleanUrl;
    }

    return $cleanUrl;
}

function ensureHomeTables($pdo) {
    $settingsTable = "CREATE TABLE IF NOT EXISTS home_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hero_badge VARCHAR(160) NOT NULL DEFAULT 'Sri Lanka''s digital learning hub',
        hero_title VARCHAR(255) NOT NULL DEFAULT 'Learn smarter with one connected education platform.',
        hero_subtitle TEXT NULL,
        primary_cta_label VARCHAR(120) NULL,
        primary_cta_url VARCHAR(500) NULL,
        secondary_cta_label VARCHAR(120) NULL,
        secondary_cta_url VARCHAR(500) NULL,
        courses_heading VARCHAR(255) NULL,
        courses_subtitle TEXT NULL,
        lecturers_heading VARCHAR(255) NULL,
        lecturers_subtitle TEXT NULL,
        why_heading VARCHAR(255) NULL,
        why_subtitle TEXT NULL,
        timetable_heading VARCHAR(255) NULL,
        timetable_subtitle TEXT NULL,
        faq_heading VARCHAR(255) NULL,
        updated_by INT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    )";
    $pdo->exec($settingsTable);

    $slidesTable = "CREATE TABLE IF NOT EXISTS home_slides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_url VARCHAR(500) NOT NULL,
        title VARCHAR(255) NOT NULL,
        label VARCHAR(160) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($slidesTable);

    $lecturersTable = "CREATE TABLE IF NOT EXISTS home_lecturers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        focus TEXT NULL,
        image_url VARCHAR(500) NULL,
        initials VARCHAR(20) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($lecturersTable);

    $timetableTable = "CREATE TABLE IF NOT EXISTS home_timetable (
        id INT AUTO_INCREMENT PRIMARY KEY,
        day_label VARCHAR(80) NOT NULL,
        time_label VARCHAR(120) NOT NULL,
        title VARCHAR(255) NOT NULL,
        mode_label VARCHAR(120) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($timetableTable);

    $settingsCount = $pdo->query("SELECT COUNT(*) AS total FROM home_settings")->fetch();
    if (intval($settingsCount["total"]) === 0) {
        $stmt = $pdo->prepare("INSERT INTO home_settings
            (hero_badge, hero_title, hero_subtitle, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url, courses_heading, courses_subtitle, lecturers_heading, lecturers_subtitle, why_heading, why_subtitle, timetable_heading, timetable_subtitle, faq_heading)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            "Sri Lanka's digital learning hub",
            "Learn smarter with one connected education platform.",
            "Techno-Hub brings video lessons, online classes, quizzes, e-books, events, and student progress tools together for school, university, vocational, and professional learners.",
            "Start Learning",
            "/register",
            "Explore Courses",
            "/home/online-class",
            "Choose the learning path that fits your goal.",
            "Browse guided lessons, live classes, exam practice, and digital resources.",
            "Learn from mentors who connect lessons with real outcomes.",
            "The lecturer team supports theory, practical skills, exam preparation, and professional growth across each learning category.",
            "A professional learning space built around student progress.",
            "The platform is designed for repeated learning, guided resources, measurable exam practice, and easy communication between learners and administrators.",
            "Plan your week with live classes and practice sessions.",
            "Timetables help learners balance revision, live teaching, practical work, and assessments throughout the week.",
            "Questions students usually ask."
        ]);
    }

    $slidesCount = $pdo->query("SELECT COUNT(*) AS total FROM home_slides")->fetch();
    if (intval($slidesCount["total"]) === 0) {
        $stmt = $pdo->prepare("INSERT INTO home_slides (image_url, title, label, sort_order) VALUES (?, ?, ?, ?)");
        $slides = [
            ["/uploads/gallery/gallery_1781980894_6a36dede54489.jpg", "Industry Learning Events", "CodeFest 2025", 1],
            ["/uploads/gallery/gallery_1781980894_6a36dede55846.jpg", "Expert Mentor Sessions", "Professional Guidance", 2],
            ["/uploads/gallery/gallery_1781981634_6a36e1c236580.jpg", "Project-Based Learning", "Student Showcase", 3],
            ["/uploads/gallery/gallery_1781981634_6a36e1c2374e2.jpg", "Practical Classrooms", "Hands-on Training", 4]
        ];
        foreach ($slides as $slide) {
            $stmt->execute($slide);
        }
    }

    $lecturersCount = $pdo->query("SELECT COUNT(*) AS total FROM home_lecturers")->fetch();
    if (intval($lecturersCount["total"]) === 0) {
        $stmt = $pdo->prepare("INSERT INTO home_lecturers (name, subject, focus, initials, sort_order) VALUES (?, ?, ?, ?, ?)");
        $lecturers = [
            ["Dr. Nuwan Jayasinghe", "ICT and Software Engineering", "Guides learners through programming, systems thinking, and project-based development.", "NJ", 1],
            ["Ms. Amaya Perera", "Mathematics and Analytics", "Builds strong foundations for exams, logical reasoning, and data-driven problem solving.", "AP", 2],
            ["Mr. Kavindu Silva", "Web Development", "Teaches practical frontend skills with real assignments, reviews, and portfolio outcomes.", "KS", 3],
            ["Ms. Tharushi Fernando", "Exam Strategy", "Supports students with revision plans, timed practice, and confident exam preparation.", "TF", 4],
            ["Mr. Lahiru Wijesinghe", "Professional Skills", "Mentors learners in communication, presentations, interviews, and career-ready habits.", "LW", 5]
        ];
        foreach ($lecturers as $lecturer) {
            $stmt->execute($lecturer);
        }
    }

    $timetableCount = $pdo->query("SELECT COUNT(*) AS total FROM home_timetable")->fetch();
    if (intval($timetableCount["total"]) === 0) {
        $stmt = $pdo->prepare("INSERT INTO home_timetable (day_label, time_label, title, mode_label, sort_order) VALUES (?, ?, ?, ?, ?)");
        $rows = [
            ["Monday", "6.00 PM - 8.00 PM", "ICT Theory and Revision", "Online", 1],
            ["Wednesday", "7.00 PM - 9.00 PM", "Practical Web Development", "Live Lab", 2],
            ["Friday", "6.30 PM - 8.30 PM", "Exam Hall Practice", "Assessment", 3],
            ["Saturday", "9.00 AM - 12.00 PM", "Professional Skills Workshop", "Hybrid", 4]
        ];
        foreach ($rows as $row) {
            $stmt->execute($row);
        }
    }
}

function formatHomeSettings($settings) {
    return [
        "heroBadge" => displayText($settings["hero_badge"]),
        "heroTitle" => displayText($settings["hero_title"]),
        "heroSubtitle" => displayText($settings["hero_subtitle"]),
        "primaryCtaLabel" => displayText($settings["primary_cta_label"]),
        "primaryCtaUrl" => $settings["primary_cta_url"],
        "secondaryCtaLabel" => displayText($settings["secondary_cta_label"]),
        "secondaryCtaUrl" => $settings["secondary_cta_url"],
        "coursesHeading" => displayText($settings["courses_heading"]),
        "coursesSubtitle" => displayText($settings["courses_subtitle"]),
        "lecturersHeading" => displayText($settings["lecturers_heading"]),
        "lecturersSubtitle" => displayText($settings["lecturers_subtitle"]),
        "whyHeading" => displayText($settings["why_heading"]),
        "whySubtitle" => displayText($settings["why_subtitle"]),
        "timetableHeading" => displayText($settings["timetable_heading"]),
        "timetableSubtitle" => displayText($settings["timetable_subtitle"]),
        "faqHeading" => displayText($settings["faq_heading"]),
        "updatedAt" => $settings["updated_at"]
    ];
}

function formatHomeSlide($slide) {
    return [
        "id" => intval($slide["id"]),
        "imageUrl" => publicAssetUrl($slide["image_url"]),
        "title" => displayText($slide["title"]),
        "label" => displayText($slide["label"]),
        "sortOrder" => intval($slide["sort_order"]),
        "isActive" => intval($slide["is_active"]) === 1
    ];
}

function formatHomeLecturer($lecturer) {
    return [
        "id" => intval($lecturer["id"]),
        "name" => displayText($lecturer["name"]),
        "subject" => displayText($lecturer["subject"]),
        "focus" => displayText($lecturer["focus"]),
        "imageUrl" => publicAssetUrl($lecturer["image_url"]),
        "initials" => displayText($lecturer["initials"]),
        "sortOrder" => intval($lecturer["sort_order"]),
        "isActive" => intval($lecturer["is_active"]) === 1
    ];
}

function formatHomeTimetableRow($row) {
    return [
        "id" => intval($row["id"]),
        "day" => displayText($row["day_label"]),
        "time" => displayText($row["time_label"]),
        "title" => displayText($row["title"]),
        "mode" => displayText($row["mode_label"]),
        "sortOrder" => intval($row["sort_order"]),
        "isActive" => intval($row["is_active"]) === 1
    ];
}
?>
