<?php

function place_hydrate(PDO $pdo, array $row): array {
    $id = $row['id'];

    $images = $pdo->prepare('SELECT url FROM place_images WHERE place_id = ? ORDER BY sort_order');
    $images->execute([$id]);
    $tags = $pdo->prepare('SELECT tag FROM place_tags WHERE place_id = ?');
    $tags->execute([$id]);
    $nearby = $pdo->prepare('SELECT nearby_name FROM place_nearby WHERE place_id = ?');
    $nearby->execute([$id]);

    return [
        'id' => $id,
        'name' => $row['name'],
        'nameLocal' => $row['name_local'],
        'description' => $row['description'],
        'historicalBackground' => $row['historical_background'],
        'significance' => $row['significance'],
        'location' => $row['location'],
        'district' => $row['district'],
        'division' => $row['division'],
        'coordinates' => ['lat' => (float)$row['lat'], 'lng' => (float)$row['lng']],
        'category' => $row['category'],
        'images' => array_column($images->fetchAll(), 'url'),
        'rating' => (float)$row['rating'],
        'reviewCount' => (int)$row['review_count'],
        'visitInfo' => [
            'openTime' => $row['open_time'], 'closeTime' => $row['close_time'],
            'entryFee' => $row['entry_fee'], 'bestTime' => $row['best_time'],
        ],
        'nearbyAttractions' => array_column($nearby->fetchAll(), 'nearby_name'),
        'tags' => array_column($tags->fetchAll(), 'tag'),
        'featured' => (bool)$row['featured'],
        'established' => $row['established'],
    ];
}

function places_index(PDO $pdo): void {
    $where = ['1=1'];
    $params = [];

    if (!empty($_GET['category'])) { $where[] = 'category = ?'; $params[] = $_GET['category']; }
    if (!empty($_GET['district'])) { $where[] = 'district = ?'; $params[] = $_GET['district']; }
    if (!empty($_GET['division']))  { $where[] = 'division = ?'; $params[] = $_GET['division']; }
    if (!empty($_GET['featured']))  { $where[] = 'featured = 1'; }
    if (!empty($_GET['search'])) {
        $where[] = '(name LIKE ? OR description LIKE ? OR location LIKE ? OR district LIKE ?)';
        $like = '%' . $_GET['search'] . '%';
        array_push($params, $like, $like, $like, $like);
    }

    $limit  = min((int)($_GET['limit'] ?? 50), 200);
    $offset = max((int)($_GET['offset'] ?? 0), 0);

    $sql = 'SELECT * FROM heritage_places WHERE ' . implode(' AND ', $where) . " ORDER BY featured DESC, rating DESC LIMIT $limit OFFSET $offset";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $countStmt = $pdo->prepare('SELECT COUNT(*) c FROM heritage_places WHERE ' . implode(' AND ', $where));
    $countStmt->execute($params);
    $total = (int)$countStmt->fetch()['c'];

    json_ok(array_map(fn($r) => place_hydrate($pdo, $r), $rows), 200, ['total' => $total]);
}

function places_show(PDO $pdo, string $id): void {
    $stmt = $pdo->prepare('SELECT * FROM heritage_places WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) json_error('Place not found.', 404);
    json_ok(place_hydrate($pdo, $row));
}

function places_create(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $d = body();
    require_fields($d, ['name', 'description', 'location', 'district', 'division', 'category']);

    $id = id_with_prefix('p');
    $stmt = $pdo->prepare(
        'INSERT INTO heritage_places
         (id, name, name_local, description, historical_background, significance, location, district, division,
          lat, lng, category, open_time, close_time, entry_fee, best_time, featured, established)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    $coords = $d['coordinates'] ?? ['lat' => 0, 'lng' => 0];
    $visit  = $d['visitInfo'] ?? [];
    $stmt->execute([
        $id, $d['name'], $d['nameLocal'] ?? null, $d['description'], $d['historicalBackground'] ?? null,
        $d['significance'] ?? null, $d['location'], $d['district'], $d['division'],
        $coords['lat'] ?? 0, $coords['lng'] ?? 0, $d['category'],
        $visit['openTime'] ?? null, $visit['closeTime'] ?? null, $visit['entryFee'] ?? null, $visit['bestTime'] ?? null,
        !empty($d['featured']) ? 1 : 0, $d['established'] ?? null,
    ]);

    foreach ((array)($d['images'] ?? []) as $i => $url) {
        $pdo->prepare('INSERT INTO place_images (place_id, url, sort_order) VALUES (?, ?, ?)')->execute([$id, $url, $i]);
    }
    foreach ((array)($d['tags'] ?? []) as $tag) {
        $pdo->prepare('INSERT INTO place_tags (place_id, tag) VALUES (?, ?)')->execute([$id, $tag]);
    }
    foreach ((array)($d['nearbyAttractions'] ?? []) as $n) {
        $pdo->prepare('INSERT INTO place_nearby (place_id, nearby_name) VALUES (?, ?)')->execute([$id, $n]);
    }

    places_show($pdo, $id);
}

function places_update(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $d = body();

    $map = [
        'name' => 'name', 'nameLocal' => 'name_local', 'description' => 'description',
        'historicalBackground' => 'historical_background', 'significance' => 'significance',
        'location' => 'location', 'district' => 'district', 'division' => 'division',
        'category' => 'category', 'featured' => 'featured', 'established' => 'established',
    ];
    $fields = []; $params = [];
    foreach ($map as $k => $col) {
        if (array_key_exists($k, $d)) { $fields[] = "$col = ?"; $params[] = $d[$k]; }
    }
    if (isset($d['coordinates'])) {
        $fields[] = 'lat = ?'; $params[] = $d['coordinates']['lat'];
        $fields[] = 'lng = ?'; $params[] = $d['coordinates']['lng'];
    }
    if (isset($d['visitInfo'])) {
        $v = $d['visitInfo'];
        foreach (['openTime' => 'open_time', 'closeTime' => 'close_time', 'entryFee' => 'entry_fee', 'bestTime' => 'best_time'] as $k => $col) {
            if (isset($v[$k])) { $fields[] = "$col = ?"; $params[] = $v[$k]; }
        }
    }
    $replaceImages = array_key_exists('images', $d);
    if ($replaceImages && (!is_array($d['images']) || count($d['images']) > 20)) {
        json_error('Place images must be a list of up to 20 URLs.', 422);
    }
    if ($replaceImages) {
        foreach ($d['images'] as $url) {
            if (!is_image_ref($url)) {
                json_error('Each place image must be a valid URL.', 422);
            }
        }
    }
    if ($fields || $replaceImages) {
        $pdo->beginTransaction();
        try {
            if ($fields) {
                $params[] = $id;
                $pdo->prepare('UPDATE heritage_places SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
            }
            if ($replaceImages) {
                $pdo->prepare('DELETE FROM place_images WHERE place_id = ?')->execute([$id]);
                $insert = $pdo->prepare('INSERT INTO place_images (place_id, url, sort_order) VALUES (?, ?, ?)');
                foreach (array_values($d['images']) as $order => $url) $insert->execute([$id, trim($url), $order]);
            }
            $pdo->commit();
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $error;
        }
    }
    places_show($pdo, $id);
}

function places_delete(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $pdo->prepare('DELETE FROM heritage_places WHERE id = ?')->execute([$id]);
    json_ok(null, 200, ['message' => 'Place deleted.']);
}

function places_toggle_save(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    $stmt = $pdo->prepare('SELECT 1 FROM tourist_saved_places WHERE user_id = ? AND place_id = ?');
    $stmt->execute([$user['id'], $id]);
    if ($stmt->fetch()) {
        $pdo->prepare('DELETE FROM tourist_saved_places WHERE user_id = ? AND place_id = ?')->execute([$user['id'], $id]);
        json_ok(['saved' => false]);
    } else {
        $pdo->prepare('INSERT INTO tourist_saved_places (user_id, place_id) VALUES (?, ?)')->execute([$user['id'], $id]);
        json_ok(['saved' => true]);
    }
}

function places_saved(PDO $pdo): void {
    $user = require_auth($pdo);
    $stmt = $pdo->prepare(
        'SELECT hp.* FROM heritage_places hp
         JOIN tourist_saved_places sp ON sp.place_id = hp.id
         WHERE sp.user_id = ? ORDER BY sp.created_at DESC'
    );
    $stmt->execute([$user['id']]);
    json_ok(array_map(fn($r) => place_hydrate($pdo, $r), $stmt->fetchAll()));
}
