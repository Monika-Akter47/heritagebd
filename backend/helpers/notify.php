<?php

function notify(PDO $pdo, string $userId, string $title, string $message, string $type = 'system', ?string $link = null): void {
    $id = id_with_prefix('n');
    $pdo->prepare('INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?,?,?,?,?,?)')
        ->execute([$id, $userId, $title, $message, $type, $link]);
}
