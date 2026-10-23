<?php

function categories_index(PDO $pdo): void {
    $rows = $pdo->query(
        "SELECT c.id, c.name, c.icon, c.image,
                (SELECT COUNT(*) FROM heritage_places hp WHERE hp.category = c.id) AS count
         FROM categories c"
    )->fetchAll();
    json_ok(array_map(fn($r) => [
        'id' => $r['id'], 'name' => $r['name'], 'icon' => $r['icon'],
        'image' => $r['image'], 'count' => (int)$r['count'],
    ], $rows));
}
