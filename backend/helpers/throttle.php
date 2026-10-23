<?php
/**
 * Database-backed attempt throttling for the auth endpoints.
 * Each attempt is a row in auth_attempts keyed by (action, identifier), where the
 * identifier is an email address or a client IP.
 */
require_once __DIR__ . '/response.php';

const THROTTLE_WINDOW_SECONDS = 15 * 60;

function client_ip(): string {
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/** Aborts with 429 once $max attempts were recorded inside the window. */
function throttle_check(PDO $pdo, string $action, string $identifier, int $max): void {
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM auth_attempts
         WHERE action = ? AND identifier = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)'
    );
    $stmt->execute([$action, $identifier, THROTTLE_WINDOW_SECONDS]);
    if ((int)$stmt->fetchColumn() >= $max) {
        header('Retry-After: ' . THROTTLE_WINDOW_SECONDS);
        json_error('Too many attempts. Please wait 15 minutes and try again.', 429);
    }
}

function throttle_hit(PDO $pdo, string $action, string $identifier): void {
    $pdo->prepare('INSERT INTO auth_attempts (action, identifier) VALUES (?, ?)')->execute([$action, $identifier]);
}

function throttle_clear(PDO $pdo, string $action, string $identifier): void {
    $pdo->prepare('DELETE FROM auth_attempts WHERE action = ? AND identifier = ?')->execute([$action, $identifier]);
}
