<?php

function cart_index(PDO $pdo): void {
    $user = require_auth($pdo);
    $stmt = $pdo->prepare('SELECT product_id, quantity FROM cart_items WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $items = $stmt->fetchAll();

    $result = [];
    foreach ($items as $item) {
        $p = $pdo->prepare('SELECT * FROM products WHERE id = ?');
        $p->execute([$item['product_id']]);
        $productRow = $p->fetch();
        if (!$productRow) continue;
        $result[] = ['product' => product_hydrate($pdo, $productRow), 'quantity' => (int)$item['quantity']];
    }
    json_ok($result);
}

function cart_add(PDO $pdo): void {
    $user = require_auth($pdo);
    $d = body();
    require_fields($d, ['productId']);
    $qty = max(1, (int)($d['quantity'] ?? 1));

    // Without this an unknown id hits the foreign key and surfaces as a generic 500.
    $p = $pdo->prepare('SELECT stock FROM products WHERE id = ?');
    $p->execute([(string)$d['productId']]);
    $product = $p->fetch();
    if (!$product) json_error('Product not found.', 404);
    if ((int)$product['stock'] < 1) json_error('This product is out of stock.', 409);

    $pdo->prepare(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?) ' . (db_is_pgsql()
            ? 'ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity'
            : 'ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)')
    )->execute([$user['id'], $d['productId'], $qty]);

    cart_index($pdo);
}

function cart_update(PDO $pdo, string $productId): void {
    $user = require_auth($pdo);
    $d = body();
    require_fields($d, ['quantity']);
    $qty = (int)$d['quantity'];

    if ($qty <= 0) {
        $pdo->prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?')->execute([$user['id'], $productId]);
    } else {
        $pdo->prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?')->execute([$qty, $user['id'], $productId]);
    }
    cart_index($pdo);
}

function cart_remove(PDO $pdo, string $productId): void {
    $user = require_auth($pdo);
    $pdo->prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?')->execute([$user['id'], $productId]);
    cart_index($pdo);
}

function cart_clear(PDO $pdo): void {
    $user = require_auth($pdo);
    $pdo->prepare('DELETE FROM cart_items WHERE user_id = ?')->execute([$user['id']]);
    json_ok([]);
}
