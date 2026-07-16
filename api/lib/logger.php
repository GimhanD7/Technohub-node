<?php
function log_activity($pdo, $user_id, $action, $details = "") {
    // Get IP Address
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip_address = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip_address = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }

    // Basic User-Agent Parsing for Device Info
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown Device';
    $device_info = "Unknown Device";
    
    // Operating System
    $os = "Unknown OS";
    if (preg_match('/windows|win32/i', $user_agent)) $os = "Windows";
    elseif (preg_match('/macintosh|mac os x/i', $user_agent)) $os = "Mac";
    elseif (preg_match('/linux/i', $user_agent)) $os = "Linux";
    elseif (preg_match('/android/i', $user_agent)) $os = "Android";
    elseif (preg_match('/iphone|ipad|ipod/i', $user_agent)) $os = "iOS";

    // Browser
    $browser = "Unknown Browser";
    if (preg_match('/edge|edg/i', $user_agent)) $browser = "Edge";
    elseif (preg_match('/chrome/i', $user_agent) && !preg_match('/edge|edg/i', $user_agent)) $browser = "Chrome";
    elseif (preg_match('/safari/i', $user_agent) && !preg_match('/chrome/i', $user_agent)) $browser = "Safari";
    elseif (preg_match('/firefox/i', $user_agent)) $browser = "Firefox";
    elseif (preg_match('/opera|opr/i', $user_agent)) $browser = "Opera";

    if ($os !== "Unknown OS" || $browser !== "Unknown Browser") {
        $device_info = "$os / $browser";
    } else {
        $device_info = substr($user_agent, 0, 50); // Fallback to raw string truncated
    }

    // Insert into DB
    try {
        $stmt = $pdo->prepare("INSERT INTO system_logs (user_id, action, details, ip_address, device_info) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $user_id, // Can be null
            $action,
            $details,
            $ip_address,
            $device_info
        ]);
        return true;
    } catch (PDOException $e) {
        // Silently fail logging rather than breaking the application
        error_log("Failed to log activity: " . $e->getMessage());
        return false;
    }
}
?>
