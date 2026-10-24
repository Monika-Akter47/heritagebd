<?php
require_once __DIR__ . '/response.php';

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Only a SHA-256 of each bearer token is stored, so a database leak does not expose live sessions. */
function token_hash(string $token): string {
    return hash('sha256', $token);
}

function issue_token(PDO $pdo, string $userId): string {
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', time() + TOKEN_TTL_SECONDS);
    $stmt = $pdo->prepare('INSERT INTO auth_tokens (token, user_id, user_agent, expires_at) VALUES (?, ?, ?, ?)');
    $stmt->execute([token_hash($token), $userId, mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255) ?: null, $expires]);
    return $token;
}

/** Deletes expired sessions and reset codes. Cheap enough to run occasionally on login. */
function purge_expired_auth_rows(PDO $pdo): void {
    $pdo->exec('DELETE FROM auth_tokens WHERE expires_at <= NOW()');
    $pdo->exec('DELETE FROM password_resets WHERE expires_at <= NOW() OR used = 1');
    $pdo->prepare('DELETE FROM auth_attempts WHERE created_at < ?')->execute([date('Y-m-d H:i:s', time() - 86400)]);
}

function bearer_token(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null);
    if (!$header && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $header = $headers['Authorization'] ?? null;
    }
    if (!$header) return null;
    if (preg_match('/Bearer\s+(\S+)/i', $header, $m)) return $m[1];
    return null;
}

/** Returns the authenticated user row, or null if no/invalid token. */
function current_user(PDO $pdo): ?array {
    $token = bearer_token();
    if (!$token) return null;
    $stmt = $pdo->prepare(
        "SELECT u.* FROM auth_tokens t JOIN users u ON u.id = t.user_id
         WHERE t.token = ? AND t.expires_at > NOW() AND u.status <> 'suspended'"
    );
    $stmt->execute([token_hash($token)]);
    $user = $stmt->fetch();
    return $user ?: null;
}

/** Aborts with 401 if not authenticated. */
function require_auth(PDO $pdo): array {
    $user = current_user($pdo);
    if (!$user) json_error('Unauthorized. Please log in.', 401);
    return $user;
}

/** Aborts with 403 if authenticated user's role isn't in $roles. */
function require_role(array $user, array $roles): void {
    if (!in_array($user['role'], $roles, true)) {
        json_error('Forbidden. You do not have permission to perform this action.', 403);
    }
}

function public_user(array $user): array {
    return [
        'id'        => $user['id'],
        'name'      => $user['name'],
        'email'     => $user['email'],
        'phone'     => $user['phone'],
        'avatar'    => $user['avatar'],
        'role'      => $user['role'],
        'verified'  => (bool) $user['verified'],
        'status'    => $user['status'],
        'createdAt' => $user['created_at'],
    ];
}
