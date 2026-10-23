<?php

function notification_hydrate(array $row): array {
    return [
        'id' => $row['id'], 'userId' => $row['user_id'], 'title' => $row['title'], 'message' => $row['message'],
        'type' => $row['type'], 'read' => (bool)$row['is_read'], 'createdAt' => $row['created_at'], 'link' => $row['link'],
    ];
}

function notifications_index(PDO $pdo): void {
    $user = require_auth($pdo);
    $stmt = $pdo->prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100');
    $stmt->execute([$user['id']]);
    json_ok(array_map('notification_hydrate', $stmt->fetchAll()));
}

function notifications_read_one(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')->execute([$id, $user['id']]);
    json_ok(null, 200, ['message' => 'Marked as read.']);
}

function notifications_read_all(PDO $pdo): void {
    $user = require_auth($pdo);
    $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')->execute([$user['id']]);
    json_ok(null, 200, ['message' => 'All notifications marked as read.']);
}
