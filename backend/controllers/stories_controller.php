<?php

function story_hydrate(PDO $pdo, array $row, bool $full = false): array {
    $tags = $pdo->prepare('SELECT tag FROM story_tags WHERE story_id = ?'); $tags->execute([$row['id']]);
    $data = [
        'id' => $row['id'], 'title' => $row['title'], 'excerpt' => $row['excerpt'],
        'author' => ['name' => $row['author_name'], 'avatar' => $row['author_avatar'], 'bio' => $row['author_bio']],
        'category' => $row['category'], 'image' => $row['image'], 'publishedAt' => $row['published_at'],
        'readTime' => $row['read_time'], 'tags' => array_column($tags->fetchAll(), 'tag'),
        'featured' => (bool)$row['featured'],
    ];
    $data['content'] = $full ? $row['content'] : substr($row['content'], 0, 300);
    return $data;
}

function stories_index(PDO $pdo): void {
    $where = ['1=1']; $params = [];
    if (!empty($_GET['category'])) { $where[] = 'category = ?'; $params[] = $_GET['category']; }
    if (!empty($_GET['featured'])) { $where[] = 'featured = 1'; }
    if (!empty($_GET['search'])) { $where[] = '(title LIKE ? OR excerpt LIKE ?)'; $like='%'.$_GET['search'].'%'; array_push($params,$like,$like); }

    $stmt = $pdo->prepare('SELECT * FROM stories WHERE ' . implode(' AND ', $where) . ' ORDER BY published_at DESC');
    $stmt->execute($params);
    json_ok(array_map(fn($r) => story_hydrate($pdo, $r, false), $stmt->fetchAll()));
}

function stories_show(PDO $pdo, string $id): void {
    $stmt = $pdo->prepare('SELECT * FROM stories WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) json_error('Story not found.', 404);
    json_ok(story_hydrate($pdo, $row, true));
}
