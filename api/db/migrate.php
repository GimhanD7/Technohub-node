<?php
header("Content-Type: application/json");

$host = '127.0.0.1';
$db_name = 'technohub_db';
$username = 'root';
$password = '';

try {
    // 1. Connect without database to create it if it doesn't exist
    $pdo = new PDO("mysql:host=$host;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create DB
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8 COLLATE utf8_general_ci");
    echo "Database created or already exists.\n";

    // Select DB
    $pdo->exec("USE `$db_name`");

    // 2. Create users table IF NOT EXISTS
    $tableQuery = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50) NOT NULL UNIQUE,
        address VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($tableQuery);
    echo "Users table ensured.\n";

    // 2.2 Create otps table for phone verification
    $otpsTable = "CREATE TABLE IF NOT EXISTS otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_number VARCHAR(50) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY phone_unique (phone_number)
    )";
    $pdo->exec($otpsTable);
    echo "OTPs table ensured.\n";

    // 2.5 Create quiz-related tables
    $quizzesTable = "CREATE TABLE IF NOT EXISTS quizzes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        created_by INT NOT NULL,
        fee DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )";
    $pdo->exec($quizzesTable);
    echo "Quizzes table ensured.\n";

    $questionsTable = "CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quiz_id INT NOT NULL,
        question_text TEXT NOT NULL,
        image_url VARCHAR(255) NULL,
        marks INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    )";
    $pdo->exec($questionsTable);
    echo "Questions table ensured.\n";

    $optionsTable = "CREATE TABLE IF NOT EXISTS options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        option_text TEXT NOT NULL,
        is_correct TINYINT(1) NOT NULL DEFAULT 0,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )";
    $pdo->exec($optionsTable);
    echo "Options table ensured.\n";

    $attemptsTable = "CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quiz_id INT NOT NULL,
        user_id INT NOT NULL,
        score INT NOT NULL DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP NULL DEFAULT NULL,
        is_submitted TINYINT(1) NOT NULL DEFAULT 0,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )";
    $pdo->exec($attemptsTable);
    echo "Quiz attempts table ensured.\n";

    $responsesTable = "CREATE TABLE IF NOT EXISTS student_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attempt_id INT NOT NULL,
        question_id INT NOT NULL,
        option_id INT NOT NULL,
        FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
        FOREIGN KEY (option_id) REFERENCES options(id) ON DELETE CASCADE
    )";
    $pdo->exec($responsesTable);
    echo "Student responses table ensured.\n";

    $flagsTable = "CREATE TABLE IF NOT EXISTS student_flags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        attempt_id INT NOT NULL,
        question_id INT NOT NULL,
        is_flagged TINYINT(1) NOT NULL DEFAULT 0,
        UNIQUE KEY uniq_attempt_question (attempt_id, question_id),
        FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )";
    $pdo->exec($flagsTable);
    echo "Student flags table ensured.\n";

    $ebookResourcesTable = "CREATE TABLE IF NOT EXISTS ebook_resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NULL,
        subject VARCHAR(120) NOT NULL,
        category VARCHAR(80) NOT NULL,
        level VARCHAR(80) NOT NULL,
        description TEXT NULL,
        file_url VARCHAR(500) NOT NULL,
        cover_url VARCHAR(500) NULL,
        file_type VARCHAR(80) NULL,
        file_size INT NULL,
        is_featured TINYINT(1) NOT NULL DEFAULT 0,
        is_published TINYINT(1) NOT NULL DEFAULT 1,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )";
    $pdo->exec($ebookResourcesTable);
    echo "E-book resources table ensured.\n";

    $galleryItemsTable = "CREATE TABLE IF NOT EXISTS gallery_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        entry_type ENUM('event', 'news', 'achievement', 'workshop') NOT NULL DEFAULT 'event',
        category VARCHAR(120) NOT NULL,
        event_date DATE NULL,
        location VARCHAR(255) NULL,
        summary VARCHAR(500) NOT NULL,
        details TEXT NULL,
        image_url VARCHAR(500) NOT NULL,
        cta_label VARCHAR(120) NULL,
        cta_url VARCHAR(500) NULL,
        is_featured TINYINT(1) NOT NULL DEFAULT 0,
        is_published TINYINT(1) NOT NULL DEFAULT 1,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )";
    $pdo->exec($galleryItemsTable);
    echo "Gallery items table ensured.\n";

    $galleryImagesTable = "CREATE TABLE IF NOT EXISTS gallery_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gallery_item_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        caption VARCHAR(255) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (gallery_item_id) REFERENCES gallery_items(id) ON DELETE CASCADE
    )";
    $pdo->exec($galleryImagesTable);
    echo "Gallery images table ensured.\n";

    $contactSettingsTable = "CREATE TABLE IF NOT EXISTS contact_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hero_badge VARCHAR(120) NOT NULL DEFAULT 'Student Support Desk',
        title VARCHAR(255) NOT NULL DEFAULT 'Contact Techno-Hub',
        subtitle TEXT NULL,
        phone VARCHAR(80) NULL,
        whatsapp VARCHAR(80) NULL,
        email VARCHAR(160) NULL,
        address TEXT NULL,
        office_hours VARCHAR(255) NULL,
        map_url VARCHAR(500) NULL,
        facebook_url VARCHAR(500) NULL,
        instagram_url VARCHAR(500) NULL,
        linkedin_url VARCHAR(500) NULL,
        youtube_url VARCHAR(500) NULL,
        primary_cta_label VARCHAR(120) NULL,
        primary_cta_url VARCHAR(500) NULL,
        updated_by INT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    )";
    $pdo->exec($contactSettingsTable);
    echo "Contact settings table ensured.\n";

    $contactMessagesTable = "CREATE TABLE IF NOT EXISTS contact_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(160) NULL,
        phone VARCHAR(80) NULL,
        learner_type VARCHAR(80) NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status ENUM('new', 'read', 'closed') NOT NULL DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($contactMessagesTable);
    echo "Contact messages table ensured.\n";

    $notificationsTable = "CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'system',
        link VARCHAR(255) NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )";
    $pdo->exec($notificationsTable);
    echo "Notifications table ensured.\n";

    $contactSettingsCount = $pdo->query("SELECT COUNT(*) AS total FROM contact_settings")->fetch();
    if (intval($contactSettingsCount['total']) === 0) {
        $insertContactSettings = $pdo->prepare("INSERT INTO contact_settings
            (hero_badge, title, subtitle, phone, whatsapp, email, address, office_hours, primary_cta_label, primary_cta_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $insertContactSettings->execute([
            "Student Support Desk",
            "Contact Techno-Hub",
            "Speak with our education support team about classes, e-books, exam preparation, online lessons, and professional learning pathways.",
            "+94 77 123 4567",
            "+94 77 123 4567",
            "support@technohub.lk",
            "Techno-Hub Learning Center, Colombo, Sri Lanka",
            "Monday - Saturday, 8.30 AM - 6.00 PM",
            "Start a Conversation",
            "mailto:support@technohub.lk"
        ]);
        echo "Default contact settings inserted.\n";
    } else {
        echo "Contact settings exist.\n";
    }

    $homeSettingsTable = "CREATE TABLE IF NOT EXISTS home_settings (
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
    $pdo->exec($homeSettingsTable);
    echo "Home settings table ensured.\n";

    $homeSlidesTable = "CREATE TABLE IF NOT EXISTS home_slides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image_url VARCHAR(500) NOT NULL,
        title VARCHAR(255) NOT NULL,
        label VARCHAR(160) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($homeSlidesTable);
    echo "Home slides table ensured.\n";

    $homeLecturersTable = "CREATE TABLE IF NOT EXISTS home_lecturers (
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
    $pdo->exec($homeLecturersTable);
    echo "Home lecturers table ensured.\n";

    $homeTimetableTable = "CREATE TABLE IF NOT EXISTS home_timetable (
        id INT AUTO_INCREMENT PRIMARY KEY,
        day_label VARCHAR(80) NOT NULL,
        time_label VARCHAR(120) NOT NULL,
        title VARCHAR(255) NOT NULL,
        mode_label VARCHAR(120) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($homeTimetableTable);
    echo "Home timetable table ensured.\n";

    $homeSettingsCount = $pdo->query("SELECT COUNT(*) AS total FROM home_settings")->fetch();
    if (intval($homeSettingsCount['total']) === 0) {
        $insertHomeSettings = $pdo->prepare("INSERT INTO home_settings
            (hero_badge, hero_title, hero_subtitle, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url, courses_heading, courses_subtitle, lecturers_heading, lecturers_subtitle, why_heading, why_subtitle, timetable_heading, timetable_subtitle, faq_heading)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $insertHomeSettings->execute([
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
        echo "Default home settings inserted.\n";
    } else {
        echo "Home settings exist.\n";
    }

    $homeTimetableCount = $pdo->query("SELECT COUNT(*) AS total FROM home_timetable")->fetch();
    if (intval($homeTimetableCount['total']) === 0) {
        $insertHomeTimetable = $pdo->prepare("INSERT INTO home_timetable (day_label, time_label, title, mode_label, sort_order) VALUES (?, ?, ?, ?, ?)");
        $homeTimetableRows = [
            ["Monday", "6.00 PM - 8.00 PM", "ICT Theory and Revision", "Online", 1],
            ["Wednesday", "7.00 PM - 9.00 PM", "Practical Web Development", "Live Lab", 2],
            ["Friday", "6.30 PM - 8.30 PM", "Exam Hall Practice", "Assessment", 3],
            ["Saturday", "9.00 AM - 12.00 PM", "Professional Skills Workshop", "Hybrid", 4]
        ];
        foreach ($homeTimetableRows as $row) {
            $insertHomeTimetable->execute($row);
        }
        echo "Default home timetable rows inserted.\n";
    } else {
        echo "Home timetable rows exist.\n";
    }

    // 3. Intelligently add missing columns
    // Older versions used student_category, while the application uses
    // education_category. Rename it in place so existing student data survives.
    $checkEducationCategory = $pdo->query("SHOW COLUMNS FROM users LIKE 'education_category'");
    $checkStudentCategory = $pdo->query("SHOW COLUMNS FROM users LIKE 'student_category'");

    if ($checkEducationCategory->rowCount() === 0 && $checkStudentCategory->rowCount() > 0) {
        $pdo->exec("ALTER TABLE users CHANGE COLUMN student_category education_category VARCHAR(50) NULL DEFAULT NULL AFTER role");
        echo "Renamed users.student_category to education_category.\n";
    }

    // Users table columns
    $userColumnsToAdd = [
        [
            'name' => 'index_number',
            'definition' => 'VARCHAR(20) UNIQUE AFTER id'
        ],
        [
            'name' => 'email',
            'definition' => 'VARCHAR(160) NULL UNIQUE AFTER phone_number'
        ],
        [
            'name' => 'education_category',
            'definition' => "VARCHAR(50) NULL DEFAULT NULL AFTER role"
        ],
        [
            'name' => 'education_info',
            'definition' => 'TEXT AFTER address'
        ],
        [
            'name' => 'wallet_balance',
            'definition' => 'DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER education_info'
        ],
        [
            'name' => 'birthdate',
            'definition' => 'DATE NULL AFTER wallet_balance'
        ],
        [
            'name' => 'subject',
            'definition' => 'VARCHAR(255) NULL AFTER education_category'
        ],
        [
            'name' => 'profile_picture',
            'definition' => 'VARCHAR(500) NULL AFTER subject'
        ],
        [
            'name' => 'status',
            'definition' => "ENUM('active','inactive') NOT NULL DEFAULT 'active' AFTER profile_picture"
        ],
        [
            'name' => 'experience',
            'definition' => 'TEXT NULL AFTER status'
        ],
        [
            'name' => 'certifications',
            'definition' => 'TEXT NULL AFTER experience'
        ],
        [
            'name' => 'last_notification_read_at',
            'definition' => 'TIMESTAMP NULL DEFAULT NULL AFTER certifications'
        ]
    ];

    foreach ($userColumnsToAdd as $col) {
        $colName = $col['name'];
        $checkCol = $pdo->query("SHOW COLUMNS FROM users LIKE '$colName'");
        if ($checkCol->rowCount() === 0) {
            $def = $col['definition'];
            $pdo->exec("ALTER TABLE users ADD COLUMN $colName $def");
            echo "Added missing column to users: $colName\n";
        } else {
            echo "Column exists in users: $colName\n";
        }
    }

    // Education categories apply only to student accounts.
    $pdo->exec("UPDATE users SET education_category = NULL WHERE role <> 'student'");

    // Questions table columns
    $questionColumnsToAdd = [
        [
            'name' => 'image_url',
            'definition' => 'VARCHAR(255) NULL'
        ]
    ];

    foreach ($questionColumnsToAdd as $col) {
        $colName = $col['name'];
        $checkCol = $pdo->query("SHOW COLUMNS FROM questions LIKE '$colName'");
        if ($checkCol->rowCount() === 0) {
            $def = $col['definition'];
            $pdo->exec("ALTER TABLE questions ADD COLUMN $colName $def");
            echo "Added missing column to questions: $colName\n";
        } else {
            echo "Column exists in questions: $colName\n";
        }
    }

    // 3.5 Create course_categories table
    $courseCategoriesTable = "CREATE TABLE IF NOT EXISTS course_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        status ENUM('active', 'disabled') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($courseCategoriesTable);
    echo "Course categories table ensured.\n";

    // 4. Create courses table
    $coursesTable = "CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        category_id INT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        duration VARCHAR(100),
        points INT DEFAULT 0,
        banner_url VARCHAR(500),
        status ENUM('active', 'disabled') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL
    )";
    $pdo->exec($coursesTable);
    echo "Courses table ensured.\n";
    
    // Ensure category_id exists in courses table for existing deployments
    $checkCategory = $pdo->query("SHOW COLUMNS FROM courses LIKE 'category_id'");
    if ($checkCategory->rowCount() === 0) {
        $pdo->exec("ALTER TABLE courses ADD COLUMN category_id INT NULL AFTER teacher_id");
        $pdo->exec("ALTER TABLE courses ADD CONSTRAINT fk_course_category FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL");
        echo "Added missing column: category_id to courses\n";
    }

    // 5. Create course_modules table
    $modulesTable = "CREATE TABLE IF NOT EXISTS course_modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    )";
    $pdo->exec($modulesTable);
    echo "Course modules table ensured.\n";

    // 6. Create course_materials table
    $materialsTable = "CREATE TABLE IF NOT EXISTS course_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_id INT NOT NULL,
        type ENUM('video', 'pdf', 'live_session') NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content_url VARCHAR(500) NOT NULL,
        order_index INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
    )";
    $pdo->exec($materialsTable);
    echo "Course materials table ensured.\n";

    // 6.5 Create material_completions table
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
    echo "Material completions table ensured.\n";

    // 7. Ensure points column in courses table
    $checkPoints = $pdo->query("SHOW COLUMNS FROM courses LIKE 'points'");
    if ($checkPoints->rowCount() === 0) {
        $pdo->exec("ALTER TABLE courses ADD COLUMN points INT DEFAULT 0 AFTER duration");
        echo "Added missing column: points to courses\n";
    }

    // 7.5 Create online_classes table
    $onlineClassesTable = "CREATE TABLE IF NOT EXISTS online_classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        meeting_link VARCHAR(500) NOT NULL,
        platform VARCHAR(100) DEFAULT 'Zoom',
        date_time DATETIME NOT NULL,
        duration INT NOT NULL DEFAULT 60,
        fee DECIMAL(10,2) DEFAULT 0.00,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )";
    $pdo->exec($onlineClassesTable);
    echo "Online classes table ensured.\n";

    // Ensure 'fee' column exists in 'online_classes' for existing installations
    $checkFeeColumnOC = $pdo->query("SHOW COLUMNS FROM online_classes LIKE 'fee'");
    if ($checkFeeColumnOC->rowCount() === 0) {
        $pdo->exec("ALTER TABLE online_classes ADD COLUMN fee DECIMAL(10,2) DEFAULT 0.00 AFTER duration");
        echo "Added 'fee' column to online_classes table.\n";
    }

    // Create online_class_enrollments table
    $onlineClassEnrollmentsTable = "CREATE TABLE IF NOT EXISTS online_class_enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        online_class_id INT NOT NULL,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (online_class_id) REFERENCES online_classes(id) ON DELETE CASCADE,
        UNIQUE(student_id, online_class_id)
    )";
    $pdo->exec($onlineClassEnrollmentsTable);
    echo "Online class enrollments table ensured.\n";

    // 8. Create system_logs table
    $logsTable = "CREATE TABLE IF NOT EXISTS system_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        device_info VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )";
    $pdo->exec($logsTable);
    echo "System logs table ensured.\n";

    // 9. Create course_enrollments table
    $enrollmentsTable = "CREATE TABLE IF NOT EXISTS course_enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE KEY student_course_unique (student_id, course_id)
    )";
    $pdo->exec($enrollmentsTable);
    echo "Course enrollments table ensured.\n";

    // 10. Create wallet_transactions table
    $walletTransactionsTable = "CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        type ENUM('credit', 'debit') NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        payment_slip_url VARCHAR(500) NULL,
        reference_number VARCHAR(100) NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )";
    $pdo->exec($walletTransactionsTable);
    echo "Wallet transactions table ensured.\n";

    // Ensure reference_number exists in wallet_transactions
    $checkRef = $pdo->query("SHOW COLUMNS FROM wallet_transactions LIKE 'reference_number'");
    if ($checkRef->rowCount() === 0) {
        $pdo->exec("ALTER TABLE wallet_transactions ADD COLUMN reference_number VARCHAR(100) NULL AFTER payment_slip_url");
        echo "Added missing column: reference_number to wallet_transactions\n";
    }

    // 11. Create global security_settings table
    $securitySettingsTable = "CREATE TABLE IF NOT EXISTS security_settings (
        id INT PRIMARY KEY,
        developer_options_restriction TINYINT(1) DEFAULT 0,
        right_click_restriction TINYINT(1) DEFAULT 0,
        anti_recording_watermark TINYINT(1) DEFAULT 0,
        developer_master_mode TINYINT(1) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    $pdo->exec($securitySettingsTable);
    echo "Security settings table ensured.\n";

    // Initialize row if not exists
    $checkSec = $pdo->query("SELECT id FROM security_settings WHERE id = 1");
    if ($checkSec->rowCount() === 0) {
        $pdo->exec("INSERT INTO security_settings (id, developer_options_restriction, right_click_restriction, anti_recording_watermark, developer_master_mode) VALUES (1, 0, 0, 0, 0)");
        echo "Default security settings inserted.\n";
    }

    // 12. Create global system_settings table
    $systemSettingsTable = "CREATE TABLE IF NOT EXISTS system_settings (
        id INT PRIMARY KEY,
        site_name VARCHAR(255) DEFAULT 'Techno-Hub',
        primary_color VARCHAR(50) DEFAULT '#1a3cb6',
        secondary_color VARCHAR(50) DEFAULT '#efc300',
        contact_email VARCHAR(255) NULL,
        contact_phone VARCHAR(50) NULL,
        facebook_url VARCHAR(255) NULL,
        youtube_url VARCHAR(255) NULL,
        instagram_url VARCHAR(255) NULL,
        linkedin_url VARCHAR(255) NULL,
        twitter_url VARCHAR(255) NULL,
        address TEXT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    $pdo->exec($systemSettingsTable);
    echo "System settings table ensured.\n";

    // Initialize row if not exists
    $checkSys = $pdo->query("SELECT id FROM system_settings WHERE id = 1");
    if ($checkSys->rowCount() === 0) {
        $pdo->exec("INSERT INTO system_settings (id, site_name, primary_color, secondary_color) VALUES (1, 'Techno-Hub', '#1a3cb6', '#efc300')");
        echo "Default system settings inserted.\n";
    }

    // 13. Ensure 'fee' column exists in 'quizzes'
    $checkFeeColumn = $pdo->query("SHOW COLUMNS FROM quizzes LIKE 'fee'");
    if ($checkFeeColumn->rowCount() === 0) {
        $pdo->exec("ALTER TABLE quizzes ADD COLUMN fee DECIMAL(10,2) DEFAULT 0.00 AFTER created_by");
        echo "Added 'fee' column to quizzes table.\n";
    }

    // 14. Create quiz_payments table
    $quizPaymentsTable = "CREATE TABLE IF NOT EXISTS quiz_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quiz_id INT NOT NULL,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY quiz_user_unique (quiz_id, user_id),
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )";
    $pdo->exec($quizPaymentsTable);
    echo "Quiz payments table ensured.\n";

    $teacherCommissionsTable = "CREATE TABLE IF NOT EXISTS teacher_commissions (
        teacher_id INT PRIMARY KEY,
        commission_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
        commission_value DECIMAL(10,2) DEFAULT 80.00,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    )";
    $pdo->exec($teacherCommissionsTable);
    echo "Teacher commissions table ensured.\n";

    $teacherEarningsHistoryTable = "CREATE TABLE IF NOT EXISTS teacher_earnings_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        commission_type ENUM('percentage', 'fixed') NOT NULL,
        commission_value DECIMAL(10,2) NOT NULL,
        net_earning DECIMAL(10,2) NOT NULL,
        description VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    )";
    $pdo->exec($teacherEarningsHistoryTable);
    echo "Teacher earnings history table ensured.\n";

    // Done
    echo "Migration completed successfully!\n";

} catch (PDOException $e) {
    die("Migration failed: " . $e->getMessage() . "\n");
}
?>
