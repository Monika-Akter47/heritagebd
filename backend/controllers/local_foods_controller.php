<?php

const LOCAL_FOOD_TYPES = ['dish', 'sweet', 'snack', 'drink', 'fruit', 'ingredient'];

function local_food_hydrate(array $row): array {
    $food = [
        'id' => $row['id'], 'name' => $row['name'], 'nameLocal' => $row['name_local'],
        'district' => $row['district'], 'division' => $row['division'], 'type' => $row['food_type'],
        'description' => $row['description'], 'whereToTry' => $row['where_to_try'],
        'image' => $row['image'], 'featured' => (bool)$row['featured'],
    ];
    if (array_key_exists('area_focus', $row)) $food['areaMatch'] = $row['area_focus'] ? 'local' : 'nearby';
    return $food;
}

/**
 * GET /local-foods?area=&scope=district&exact=1&type=&featured=1&limit=
 * Same area rules as products: a district is widened to its division (unless exact=1)
 * and the district's own foods come first, tagged areaMatch = local | nearby.
 */
function local_foods_index(PDO $pdo): void {
    $where = ['1=1']; $params = [];
    $select = 'local_foods.*'; $selectParams = []; $order = 'featured DESC, name ASC';

    $area = null;
    if (!empty($_GET['area']) && is_string($_GET['area'])) {
        $area = resolve_area($_GET['area'], ($_GET['scope'] ?? '') === 'district');
        if (!$area) json_ok([], 200, ['area' => null]);
        // Foods store canonical district/division names, so exact column matches suffice.
        if ($area['type'] === 'district' && !empty($_GET['exact'])) {
            $where[] = 'district = ?'; $params[] = $area['name'];
        } else {
            $where[] = 'division = ?'; $params[] = $area['division'];
        }
        if ($area['type'] === 'district') {
            $select .= ', (district = ?) AS area_focus';
            $selectParams[] = $area['name'];
            $order = 'area_focus DESC, ' . $order;
        }
    }
    if (!empty($_GET['type'])) {
        if (!in_array($_GET['type'], LOCAL_FOOD_TYPES, true)) json_error('Unknown food type.', 422);
        $where[] = 'food_type = ?'; $params[] = $_GET['type'];
    }
    if (!empty($_GET['featured'])) $where[] = 'featured = 1';
    $limit = max(1, min((int)($_GET['limit'] ?? 50), 200));

    $stmt = $pdo->prepare("SELECT $select FROM local_foods WHERE " . implode(' AND ', $where) . " ORDER BY $order LIMIT $limit");
    $stmt->execute(array_merge($selectParams, $params));
    json_ok(array_map('local_food_hydrate', $stmt->fetchAll()), 200, ['area' => $area]);
}

/** Validates admin input and returns column => value pairs. */
function local_food_input(array $d, bool $partial): array {
    $cols = [];
    foreach (['name' => 150, 'description' => 2000] as $f => $max) {
        if (!$partial || array_key_exists($f, $d)) {
            $v = trim((string)($d[$f] ?? ''));
            if ($v === '') json_error(ucfirst($f) . ' is required.', 422);
            if (mb_strlen($v) > $max) json_error(ucfirst($f) . " must be at most $max characters.", 422);
            $cols[$f] = $v;
        }
    }
    if (!$partial || array_key_exists('district', $d)) {
        $district = trim((string)($d['district'] ?? ''));
        $division = area_division_of($district);
        if (!$division) json_error('Choose a valid Bangladesh district.', 422);
        $cols['district'] = $district;
        $cols['division'] = $division;
    }
    if (!$partial || array_key_exists('type', $d)) {
        $type = $d['type'] ?? 'dish';
        if (!in_array($type, LOCAL_FOOD_TYPES, true)) json_error('Unknown food type.', 422);
        $cols['food_type'] = $type;
    }
    foreach (['nameLocal' => ['name_local', 150], 'whereToTry' => ['where_to_try', 300], 'image' => ['image', 500]] as $k => [$col, $max]) {
        if (array_key_exists($k, $d)) {
            $v = trim((string)($d[$k] ?? ''));
            if (mb_strlen($v) > $max) json_error("$k must be at most $max characters.", 422);
            $cols[$col] = $v === '' ? null : $v;
        }
    }
    if (array_key_exists('featured', $d)) $cols['featured'] = $d['featured'] ? 1 : 0;
    return $cols;
}

function local_food_fetch(PDO $pdo, string $id): array {
    $stmt = $pdo->prepare('SELECT * FROM local_foods WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) json_error('Food not found.', 404);
    return $row;
}

function admin_local_food_create(PDO $pdo): void {
    require_role(require_auth($pdo), ['admin']);
    $cols = local_food_input(body(), false);
    $cols['id'] = id_with_prefix('lf');
    $pdo->prepare('INSERT INTO local_foods (' . implode(', ', array_keys($cols)) . ') VALUES ('
        . implode(', ', array_fill(0, count($cols), '?')) . ')')->execute(array_values($cols));
    json_ok(local_food_hydrate(local_food_fetch($pdo, $cols['id'])), 201);
}

function admin_local_food_update(PDO $pdo, string $id): void {
    require_role(require_auth($pdo), ['admin']);
    local_food_fetch($pdo, $id);
    $cols = local_food_input(body(), true);
    if ($cols) {
        $set = implode(', ', array_map(fn($c) => "$c = ?", array_keys($cols)));
        $pdo->prepare("UPDATE local_foods SET $set WHERE id = ?")->execute([...array_values($cols), $id]);
    }
    json_ok(local_food_hydrate(local_food_fetch($pdo, $id)));
}

function admin_local_food_delete(PDO $pdo, string $id): void {
    require_role(require_auth($pdo), ['admin']);
    local_food_fetch($pdo, $id);
    $pdo->prepare('DELETE FROM local_foods WHERE id = ?')->execute([$id]);
    json_ok(null, 200, ['message' => 'Food removed.']);
}
