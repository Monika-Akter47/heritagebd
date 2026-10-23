<?php

function event_hydrate(PDO $pdo, array $row): array {
    $images = $pdo->prepare('SELECT url FROM event_images WHERE event_id = ?'); $images->execute([$row['id']]);
    $tags   = $pdo->prepare('SELECT tag FROM event_tags WHERE event_id = ?'); $tags->execute([$row['id']]);
    return [
        'id' => $row['id'], 'name' => $row['name'], 'description' => $row['description'], 'category' => $row['category'],
        'location' => $row['location'], 'district' => $row['district'],
        'coordinates' => $row['lat'] !== null ? ['lat' => (float)$row['lat'], 'lng' => (float)$row['lng']] : null,
        'startDate' => $row['start_date'], 'endDate' => $row['end_date'], 'image' => $row['image'],
        'images' => array_column($images->fetchAll(), 'url'),
        'featured' => (bool)$row['featured'], 'isFree' => (bool)$row['is_free'],
        'ticketPrice' => $row['ticket_price'] !== null ? (float)$row['ticket_price'] : null,
        'organizer' => $row['organizer'], 'tags' => array_column($tags->fetchAll(), 'tag'),
    ];
}

function events_index(PDO $pdo): void {
    $where = ['1=1']; $params = [];
    if (!empty($_GET['category'])) { $where[] = 'category = ?'; $params[] = $_GET['category']; }
    if (!empty($_GET['district'])) { $where[] = 'district = ?'; $params[] = $_GET['district']; }
    if (!empty($_GET['featured'])) { $where[] = 'featured = 1'; }
    if (!empty($_GET['upcoming'])) { $where[] = 'end_date >= NOW()'; }
    if (!empty($_GET['search'])) { $where[] = '(name LIKE ? OR description LIKE ?)'; $like='%'.$_GET['search'].'%'; array_push($params,$like,$like); }

    $stmt = $pdo->prepare('SELECT * FROM events WHERE ' . implode(' AND ', $where) . ' ORDER BY start_date ASC');
    $stmt->execute($params);
    json_ok(array_map(fn($r) => event_hydrate($pdo, $r), $stmt->fetchAll()));
}

function events_show(PDO $pdo, string $id): void {
    $stmt = $pdo->prepare('SELECT * FROM events WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) json_error('Event not found.', 404);
    json_ok(event_hydrate($pdo, $row));
}
