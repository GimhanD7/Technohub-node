<?php
require_once 'config.php';

try {
    $pdo->exec("ALTER TABLE notifications ADD COLUMN target_role VARCHAR(20) DEFAULT 'all' AFTER user_id");
    echo "Column added successfully";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column already exists";
    } else {
        echo "Error: " . $e->getMessage();
    }
}
?>
