<?php

function conversation_hydrate(PDO $pdo, array $row, string $currentUserId): array {
    $partStmt = $pdo->prepare(
        'SELECT u.id, u.name, u.avatar, cp.unread_count FROM conversation_participants cp
         JOIN users u ON u.id = cp.user_id WHERE cp.conversation_id = ?'
    );
    $partStmt->execute([$row['id']]);
    $participants = $partStmt->fetchAll();

    $myUnread = 0;
    foreach ($participants as $p) if ($p['id'] === $currentUserId) $myUnread = (int)$p['unread_count'];

    return [
        'id' => $row['id'],
        'participants' => array_column($participants, 'id'),
        'participantNames' => array_column($participants, 'name'),
        'participantAvatars' => array_column($participants, 'avatar'),
        'lastMessage' => $row['last_message'], 'lastMessageAt' => $row['last_message_at'],
        'unreadCount' => $myUnread,
    ];
}

function conversations_index(PDO $pdo): void {
    $user = require_auth($pdo);
    $stmt = $pdo->prepare(
        'SELECT c.* FROM conversations c
         JOIN conversation_participants cp ON cp.conversation_id = c.id
         WHERE cp.user_id = ? ORDER BY c.last_message_at DESC'
    );
    $stmt->execute([$user['id']]);
    json_ok(array_map(fn($r) => conversation_hydrate($pdo, $r, $user['id']), $stmt->fetchAll()));
}

function conversation_for_users(PDO $pdo, string $userId, string $participantId): string {
    $existing = $pdo->prepare(
        'SELECT cp1.conversation_id FROM conversation_participants cp1
         JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
         WHERE cp1.user_id = ? AND cp2.user_id = ? LIMIT 1'
    );
    $existing->execute([$userId, $participantId]);
    $conversationId = $existing->fetchColumn();
    if ($conversationId) return (string)$conversationId;

    $conversationId = id_with_prefix('conv');
    $pdo->prepare('INSERT INTO conversations (id) VALUES (?)')->execute([$conversationId]);
    $pdo->prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)')
        ->execute([$conversationId, $userId]);
    $pdo->prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)')
        ->execute([$conversationId, $participantId]);
    return $conversationId;
}

function conversations_create(PDO $pdo): void {
    $user = require_auth($pdo);
    $d = body();
    require_fields($d, ['participantId']);
    if (!is_string($d['participantId'])) json_error('Invalid participant.', 422);
    if ($d['participantId'] === $user['id']) json_error('You cannot start a conversation with yourself.', 422);
    $exists = $pdo->prepare("SELECT 1 FROM users WHERE id = ? AND status = 'active'");
    $exists->execute([$d['participantId']]);
    if (!$exists->fetchColumn()) json_error('That user could not be found.', 404);

    $id = conversation_for_users($pdo, $user['id'], $d['participantId']);

    $stmt = $pdo->prepare('SELECT * FROM conversations WHERE id = ?');
    $stmt->execute([$id]);
    json_ok(conversation_hydrate($pdo, $stmt->fetch(), $user['id']));
}

function messages_index(PDO $pdo, string $conversationId): void {
    $user = require_auth($pdo);
    $check = $pdo->prepare('SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?');
    $check->execute([$conversationId, $user['id']]);
    if (!$check->fetch()) json_error('Forbidden.', 403);

    $stmt = $pdo->prepare(
        'SELECT m.*, u.name AS sender_name, u.avatar AS sender_avatar FROM messages m
         JOIN users u ON u.id = m.sender_id WHERE m.conversation_id = ? ORDER BY m.created_at ASC'
    );
    $stmt->execute([$conversationId]);
    $rows = $stmt->fetchAll();

    $pdo->prepare('UPDATE conversation_participants SET unread_count = 0 WHERE conversation_id = ? AND user_id = ?')
        ->execute([$conversationId, $user['id']]);
    $pdo->prepare('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id <> ? AND is_read = 0')
        ->execute([$conversationId, $user['id']]);

    $result = [];
    foreach ($rows as $r) {
        $att = $pdo->prepare('SELECT url FROM message_attachments WHERE message_id = ?');
        $att->execute([$r['id']]);
        $result[] = [
            'id' => $r['id'], 'conversationId' => $r['conversation_id'], 'senderId' => $r['sender_id'],
            'senderName' => $r['sender_name'], 'senderAvatar' => $r['sender_avatar'], 'content' => $r['content'],
            'createdAt' => $r['created_at'], 'read' => (bool)$r['is_read'],
            'attachments' => array_column($att->fetchAll(), 'url'),
        ];
    }
    json_ok($result);
}

function messages_create(PDO $pdo, string $conversationId): void {
    $user = require_auth($pdo);
    $check = $pdo->prepare('SELECT user_id FROM conversation_participants WHERE conversation_id = ?');
    $check->execute([$conversationId]);
    $participants = array_column($check->fetchAll(), 'user_id');
    if (!in_array($user['id'], $participants, true)) json_error('Forbidden.', 403);

    $d = body();
    require_fields($d, ['content']);
    if (!is_string($d['content'])) json_error('Invalid message.', 422);
    $d['content'] = trim($d['content']);
    if ($d['content'] === '') json_error('Message cannot be empty.', 422);
    if (mb_strlen($d['content']) > 2000) json_error('Message is too long (2000 characters max).', 422);
    // Attachments must be plain http(s) URLs (no javascript:/data: links).
    $d['attachments'] = array_values(array_filter((array)($d['attachments'] ?? []),
        fn($u) => is_string($u) && preg_match('#^https?://#i', $u) && strlen($u) <= 500));

    $id = id_with_prefix('msg');
    $pdo->prepare('INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?,?,?,?)')
        ->execute([$id, $conversationId, $user['id'], $d['content']]);
    foreach ((array)($d['attachments'] ?? []) as $url) {
        $pdo->prepare('INSERT INTO message_attachments (message_id, url) VALUES (?, ?)')->execute([$id, $url]);
    }

    $pdo->prepare('UPDATE conversations SET last_message = ?, last_message_at = NOW() WHERE id = ?')
        ->execute([mb_substr($d['content'], 0, 200), $conversationId]);

    foreach ($participants as $pid) {
        if ($pid === $user['id']) continue;
        $pdo->prepare('UPDATE conversation_participants SET unread_count = unread_count + 1 WHERE conversation_id = ? AND user_id = ?')
            ->execute([$conversationId, $pid]);
        notify($pdo, $pid, 'New message', $user['name'] . ' sent you a message.', 'message', '/chat');
    }

    $stmt = $pdo->prepare(
        'SELECT m.*, u.name AS sender_name, u.avatar AS sender_avatar FROM messages m
         JOIN users u ON u.id = m.sender_id WHERE m.id = ?'
    );
    $stmt->execute([$id]);
    $r = $stmt->fetch();
    json_ok([
        'id' => $r['id'], 'conversationId' => $r['conversation_id'], 'senderId' => $r['sender_id'],
        'senderName' => $r['sender_name'], 'senderAvatar' => $r['sender_avatar'], 'content' => $r['content'],
        'createdAt' => $r['created_at'], 'read' => (bool)$r['is_read'], 'attachments' => $d['attachments'] ?? [],
    ], 201);
}
