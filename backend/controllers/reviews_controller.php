<?php

function review_hydrate(PDO $pdo, array $row): array {
    $photos = $pdo->prepare('SELECT url FROM review_photos WHERE review_id = ?'); $photos->execute([$row['id']]);
    return [
        'id' => $row['id'], 'userId' => $row['user_id'], 'userName' => $row['user_name'], 'userAvatar' => $row['avatar'],
        'targetId' => $row['target_id'], 'targetType' => $row['target_type'], 'rating' => (int)$row['rating'],
        'title' => $row['title'], 'content' => $row['content'],
        'photos' => array_column($photos->fetchAll(), 'url'), 'createdAt' => $row['created_at'],
        'helpful' => (int)$row['helpful'],
    ];
}

function review_select_sql(): string {
    return 'SELECT r.*, u.name AS user_name, u.avatar FROM reviews r JOIN users u ON u.id = r.user_id';
}

function reviews_index(PDO $pdo): void {
    if (($_GET['mine'] ?? '') === '1') {
        $user = require_auth($pdo);
        $stmt = $pdo->prepare(review_select_sql() . ' WHERE r.user_id = ? ORDER BY r.created_at DESC');
        $stmt->execute([$user['id']]);
        json_ok(array_map(fn($r) => review_hydrate($pdo, $r), $stmt->fetchAll()));
    }
    require_fields($_GET, ['targetType', 'targetId']);
    $stmt = $pdo->prepare(review_select_sql() . ' WHERE r.target_type = ? AND r.target_id = ? ORDER BY r.created_at DESC');
    $stmt->execute([$_GET['targetType'], $_GET['targetId']]);
    json_ok(array_map(fn($r) => review_hydrate($pdo, $r), $stmt->fetchAll()));
}

function reviews_for_place(PDO $pdo, string $placeId): void {
    $stmt = $pdo->prepare(review_select_sql() . ' WHERE r.target_type = "place" AND r.target_id = ? ORDER BY r.created_at DESC');
    $stmt->execute([$placeId]);
    json_ok(array_map(fn($r) => review_hydrate($pdo, $r), $stmt->fetchAll()));
}

function reviews_create(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['tourist']);
    $d = body();
    require_fields($d, ['targetId', 'targetType', 'rating', 'content']);
    if (!is_string($d['targetId']) || !is_string($d['targetType']) || !is_string($d['content'])) json_error('Invalid review data.', 422);
    if (!in_array($d['targetType'], ['place', 'product', 'guide', 'vendor'], true)) json_error('Invalid targetType.', 422);
    $rating = (int)$d['rating'];
    if ($rating < 1 || $rating > 5) json_error('Rating must be between 1 and 5.', 422);
    if (trim((string)$d['content']) === '') json_error('Review text is required.', 422);
    if ($d['targetType'] === 'place') {
        json_error('Place reviews require a verified visit record, which is not supported yet.', 422);
    }

    // Target must exist, and users cannot review their own guide profile / product.
    $targetTable = ['place' => 'heritage_places', 'product' => 'products', 'guide' => 'guides', 'vendor' => 'vendors'][$d['targetType']];
    $targetIdCol = in_array($d['targetType'], ['guide', 'vendor'], true) ? 'user_id' : 'id';
    $exists = $pdo->prepare("SELECT " . ($d['targetType'] === 'product' ? 'vendor_id' : $targetIdCol) . " AS owner FROM $targetTable WHERE $targetIdCol = ?");
    $exists->execute([$d['targetId']]);
    $target = $exists->fetch();
    if (!$target) json_error('The item you are reviewing was not found.', 404);
    $ownerId = $d['targetType'] === 'place' ? null : $target['owner'];
    if ($ownerId !== null && $ownerId === $user['id']) json_error('You cannot review your own listing.', 403);

    if ($d['targetType'] === 'product') {
        $eligible = $pdo->prepare(
            "SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id
             WHERE o.user_id = ? AND o.status IN ('delivered','completed') AND oi.product_id = ? LIMIT 1"
        );
        $eligible->execute([$user['id'], $d['targetId']]);
    } elseif ($d['targetType'] === 'vendor') {
        $eligible = $pdo->prepare(
            "SELECT 1 FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             JOIN products p ON p.id = oi.product_id
             WHERE o.user_id = ? AND o.status IN ('delivered','completed') AND p.vendor_id = ? LIMIT 1"
        );
        $eligible->execute([$user['id'], $d['targetId']]);
    } elseif ($d['targetType'] === 'guide') {
        $eligible = $pdo->prepare(
            "SELECT 1 FROM guide_bookings
             WHERE tourist_id = ? AND guide_id = ? AND status = 'completed'
             UNION ALL
             SELECT 1 FROM trip_plans
             WHERE user_id = ? AND guide_id = ? AND guide_response = 'accepted' AND status = 'completed'
             LIMIT 1"
        );
        $eligible->execute([$user['id'], $d['targetId'], $user['id'], $d['targetId']]);
    } else {
        json_error('A verified visit record is required before reviewing this place.', 422);
    }
    if (!$eligible->fetchColumn()) {
        json_error('A completed purchase or booking is required before you can review this experience.', 403);
    }

    // One review per user per item.
    $dup = $pdo->prepare('SELECT 1 FROM reviews WHERE user_id = ? AND target_type = ? AND target_id = ? LIMIT 1');
    $dup->execute([$user['id'], $d['targetType'], $d['targetId']]);
    if ($dup->fetchColumn()) json_error('You have already reviewed this item.', 409);

    $id = id_with_prefix('rv');
    try {
        $pdo->prepare('INSERT INTO reviews (id, user_id, target_id, target_type, rating, title, content) VALUES (?,?,?,?,?,?,?)')
            ->execute([$id, $user['id'], $d['targetId'], $d['targetType'], $rating, $d['title'] ?? null, $d['content']]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') json_error('You have already reviewed this item.', 409);
        throw $e;
    }
    foreach ((array)($d['photos'] ?? []) as $url) {
        $pdo->prepare('INSERT INTO review_photos (review_id, url) VALUES (?, ?)')->execute([$id, $url]);
    }

    // Recalculate aggregate rating on the target
    $table = ['place' => 'heritage_places', 'product' => 'products', 'guide' => 'guides', 'vendor' => 'vendors'][$d['targetType']];
    $idCol = in_array($d['targetType'], ['guide', 'vendor'], true) ? 'user_id' : 'id';
    $agg = $pdo->prepare("SELECT AVG(rating) avg_r, COUNT(*) cnt FROM reviews WHERE target_type = ? AND target_id = ?");
    $agg->execute([$d['targetType'], $d['targetId']]);
    $a = $agg->fetch();
    $pdo->prepare("UPDATE $table SET rating = ?, review_count = ? WHERE $idCol = ?")
        ->execute([round((float)$a['avg_r'], 1), (int)$a['cnt'], $d['targetId']]);

    if ($ownerId !== null) {
        notify($pdo, $ownerId, 'New review', "{$user['name']} left a {$rating}-star review.", 'review', null);
    }

    $stmt = $pdo->prepare(review_select_sql() . ' WHERE r.id = ?');
    $stmt->execute([$id]);
    json_ok(review_hydrate($pdo, $stmt->fetch()), 201);
}
