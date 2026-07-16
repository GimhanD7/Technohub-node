<?php
function ensureEbookResourcesTable($pdo) {
    $tableQuery = "CREATE TABLE IF NOT EXISTS ebook_resources (
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
    $pdo->exec($tableQuery);
}

function cleanText($value) {
    return htmlspecialchars(strip_tags(trim($value ?? "")));
}

function cleanNullableText($value) {
    $cleaned = cleanText($value);
    return $cleaned === "" ? null : $cleaned;
}

function formatEbookResource($resource) {
    return [
        "id" => intval($resource["id"]),
        "title" => $resource["title"],
        "author" => $resource["author"],
        "subject" => $resource["subject"],
        "category" => $resource["category"],
        "level" => $resource["level"],
        "description" => $resource["description"],
        "fileUrl" => $resource["file_url"],
        "coverUrl" => $resource["cover_url"],
        "fileType" => $resource["file_type"],
        "fileSize" => isset($resource["file_size"]) ? intval($resource["file_size"]) : null,
        "isFeatured" => intval($resource["is_featured"]) === 1,
        "isPublished" => intval($resource["is_published"]) === 1,
        "createdBy" => isset($resource["created_by"]) ? intval($resource["created_by"]) : null,
        "creatorName" => $resource["creator_name"] ?? null,
        "createdAt" => $resource["created_at"]
    ];
}
?>
