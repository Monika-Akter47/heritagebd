<?php
/**
 * Database connection (PDO / MySQL)
 * Edit the constants below to match your hosting environment,
 * or set them as real environment variables on your server.
 */

function env_or(string $key, string $default): string {
    $val = getenv($key);
    return $val !== false ? $val : $default;
}

define('DB_HOST', env_or('DB_HOST', '127.0.0.1'));
define('DB_PORT', env_or('DB_PORT', '3306'));
define('DB_NAME', env_or('DB_NAME', 'heritagebd'));
define('DB_USER', env_or('DB_USER', 'root'));
define('DB_PASS', env_or('DB_PASS', ''));

// PHP's date() and MySQL's NOW() must agree, or "today" checks (booking dates, token
// expiry) drift by the offset between the two. XAMPP ships PHP set to Europe/Berlin.
date_default_timezone_set(env_or('APP_TIMEZONE', 'Asia/Dhaka'));

function get_db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
            // Numeric offset works without MySQL's named time-zone tables being loaded.
            $pdo->exec("SET time_zone = '" . (new DateTime())->format('P') . "'");
        } catch (PDOException $e) {
            http_response_code(500);
            header('Content-Type: application/json');
            error_log('[HeritageBD] Database connection failed: ' . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Database connection failed. Please try again later.']);
            exit;
        }
    }
    return $pdo;
}
