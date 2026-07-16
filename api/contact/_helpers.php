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

function ensureContactTables($pdo) {
    $settingsTable = "CREATE TABLE IF NOT EXISTS contact_settings (
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
    $pdo->exec($settingsTable);

    $messagesTable = "CREATE TABLE IF NOT EXISTS contact_messages (
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
    $pdo->exec($messagesTable);

    $stmt = $pdo->query("SELECT COUNT(*) AS total FROM contact_settings");
    $count = intval($stmt->fetch()["total"]);

    if ($count === 0) {
        $insert = $pdo->prepare("INSERT INTO contact_settings
            (hero_badge, title, subtitle, phone, whatsapp, email, address, office_hours, primary_cta_label, primary_cta_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $insert->execute([
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
    }
}

function formatContactSettings($settings) {
    return [
        "heroBadge" => displayText($settings["hero_badge"]),
        "title" => displayText($settings["title"]),
        "subtitle" => displayText($settings["subtitle"]),
        "phone" => displayText($settings["phone"]),
        "whatsapp" => displayText($settings["whatsapp"]),
        "email" => displayText($settings["email"]),
        "address" => displayText($settings["address"]),
        "officeHours" => displayText($settings["office_hours"]),
        "mapUrl" => $settings["map_url"],
        "facebookUrl" => $settings["facebook_url"],
        "instagramUrl" => $settings["instagram_url"],
        "linkedinUrl" => $settings["linkedin_url"],
        "youtubeUrl" => $settings["youtube_url"],
        "primaryCtaLabel" => displayText($settings["primary_cta_label"]),
        "primaryCtaUrl" => $settings["primary_cta_url"],
        "updatedBy" => isset($settings["updated_by"]) ? intval($settings["updated_by"]) : null,
        "updatedAt" => $settings["updated_at"]
    ];
}

function formatContactMessage($message) {
    return [
        "id" => intval($message["id"]),
        "fullName" => displayText($message["full_name"]),
        "email" => displayText($message["email"]),
        "phone" => displayText($message["phone"]),
        "learnerType" => displayText($message["learner_type"]),
        "subject" => displayText($message["subject"]),
        "message" => displayText($message["message"]),
        "status" => $message["status"],
        "createdAt" => $message["created_at"]
    ];
}
?>
