<?php
function ensureGalleryItemsTable($pdo) {
    $tableQuery = "CREATE TABLE IF NOT EXISTS gallery_items (
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
    $pdo->exec($tableQuery);

    $imagesTableQuery = "CREATE TABLE IF NOT EXISTS gallery_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gallery_item_id INT NOT NULL,
        image_url VARCHAR(500) NOT NULL,
        caption VARCHAR(255) NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (gallery_item_id) REFERENCES gallery_items(id) ON DELETE CASCADE
    )";
    $pdo->exec($imagesTableQuery);
}

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

function formatGalleryItem($item) {
    return [
        "id" => intval($item["id"]),
        "title" => displayText($item["title"]),
        "entryType" => $item["entry_type"],
        "category" => displayText($item["category"]),
        "eventDate" => $item["event_date"],
        "location" => displayText($item["location"]),
        "summary" => displayText($item["summary"]),
        "details" => displayText($item["details"]),
        "imageUrl" => $item["image_url"],
        "ctaLabel" => displayText($item["cta_label"]),
        "ctaUrl" => $item["cta_url"],
        "isFeatured" => intval($item["is_featured"]) === 1,
        "isPublished" => intval($item["is_published"]) === 1,
        "createdBy" => isset($item["created_by"]) ? intval($item["created_by"]) : null,
        "creatorName" => $item["creator_name"] ?? null,
        "createdAt" => $item["created_at"],
        "images" => []
    ];
}

function normalizeGalleryImageUrls($imageUrl, $imageUrls = []) {
    $urls = [];

    if (is_array($imageUrls)) {
        foreach ($imageUrls as $url) {
            $cleaned = cleanText($url);
            if ($cleaned !== "" && !in_array($cleaned, $urls)) {
                $urls[] = $cleaned;
            }
        }
    }

    $primaryImage = cleanText($imageUrl);
    if ($primaryImage !== "" && !in_array($primaryImage, $urls)) {
        array_unshift($urls, $primaryImage);
    }

    return $urls;
}

function attachGalleryImages($pdo, $items) {
    if (count($items) === 0) {
        return $items;
    }

    $ids = array_map(function ($item) {
        return intval($item["id"]);
    }, $items);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $pdo->prepare("SELECT * FROM gallery_images WHERE gallery_item_id IN ($placeholders) ORDER BY sort_order ASC, id ASC");
    $stmt->execute($ids);

    $imagesByItem = [];
    foreach ($stmt->fetchAll() as $image) {
        $itemId = intval($image["gallery_item_id"]);
        if (!isset($imagesByItem[$itemId])) {
            $imagesByItem[$itemId] = [];
        }

        $imagesByItem[$itemId][] = [
            "id" => intval($image["id"]),
            "imageUrl" => $image["image_url"],
            "caption" => $image["caption"],
            "sortOrder" => intval($image["sort_order"])
        ];
    }

    foreach ($items as &$item) {
        $itemId = intval($item["id"]);
        $item["images"] = $imagesByItem[$itemId] ?? [];

        if (count($item["images"]) === 0 && $item["imageUrl"]) {
            $item["images"][] = [
                "id" => null,
                "imageUrl" => $item["imageUrl"],
                "caption" => null,
                "sortOrder" => 0
            ];
        }
    }

    return $items;
}

function replaceGalleryImages($pdo, $itemId, $urls) {
    $deleteStmt = $pdo->prepare("DELETE FROM gallery_images WHERE gallery_item_id = ?");
    $deleteStmt->execute([$itemId]);

    if (count($urls) === 0) {
        return;
    }

    $insertStmt = $pdo->prepare("INSERT INTO gallery_images (gallery_item_id, image_url, sort_order) VALUES (?, ?, ?)");
    foreach ($urls as $index => $url) {
        $insertStmt->execute([$itemId, $url, $index]);
    }
}
?>
