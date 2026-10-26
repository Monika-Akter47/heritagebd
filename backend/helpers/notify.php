<?php

function notify(PDO $pdo, string $userId, string $title, string $message, string $type = 'system', ?string $link = null): void {
    $id = id_with_prefix('n');
    $pdo->prepare('INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?,?,?,?,?,?)')
        ->execute([$id, $userId, $title, $message, $type, $link]);
}

/** Notifies every active admin, e.g. when a vendor or guide submits their verification details. */
function notify_admins(PDO $pdo, string $title, string $message, string $type = 'system', ?string $link = null): void {
    $admins = $pdo->query("SELECT id FROM users WHERE role = 'admin' AND status = 'active'");
    foreach ($admins->fetchAll(PDO::FETCH_COLUMN) as $adminId) {
        notify($pdo, $adminId, $title, $message, $type, $link);
    }
}
