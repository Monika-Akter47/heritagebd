<?php

function product_hydrate(PDO $pdo, array $row): array {
    $id = $row['id'];
    $images = $pdo->prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order'); $images->execute([$id]);
    $tags   = $pdo->prepare('SELECT tag FROM product_tags WHERE product_id = ?'); $tags->execute([$id]);
    $specs  = $pdo->prepare('SELECT spec_key, spec_value FROM product_specifications WHERE product_id = ?'); $specs->execute([$id]);
    $slots  = $pdo->prepare('SELECT slot_label FROM product_time_slots WHERE product_id = ?'); $slots->execute([$id]);
    $near   = $pdo->prepare('SELECT place_id FROM product_near_destinations WHERE product_id = ?'); $near->execute([$id]);

    $vendorStmt = $pdo->prepare(
        'SELECT v.*, u.name, u.email, u.avatar, u.verified, u.created_at FROM vendors v
         JOIN users u ON u.id = v.user_id WHERE v.user_id = ?'
    );
    $vendorStmt->execute([$row['vendor_id']]);
    $vendorRow = $vendorStmt->fetch();

    $specifications = [];
    foreach ($specs->fetchAll() as $s) $specifications[$s['spec_key']] = $s['spec_value'];

    $product = [
        'id' => $id, 'name' => $row['name'], 'description' => $row['description'],
        'price' => (float)$row['price'], 'originalPrice' => $row['original_price'] !== null ? (float)$row['original_price'] : null,
        'images' => array_column($images->fetchAll(), 'url'),
        'category' => $row['category'], 'vendorId' => $row['vendor_id'],
        'rating' => (float)$row['rating'], 'reviewCount' => (int)$row['review_count'],
        'stock' => (int)$row['stock'], 'tags' => array_column($tags->fetchAll(), 'tag'),
        'specifications' => (object)$specifications, 'featured' => (bool)$row['featured'],
        'district' => $row['district'],
        'vendor' => $vendorRow ? [
            'id' => $vendorRow['user_id'], 'name' => $vendorRow['name'], 'email' => $vendorRow['email'],
            'avatar' => $vendorRow['avatar'], 'role' => 'vendor', 'verified' => (bool)$vendorRow['verified'],
            'createdAt' => $vendorRow['created_at'], 'shopName' => $vendorRow['shop_name'],
            'shopDescription' => $vendorRow['shop_description'], 'shopImage' => $vendorRow['shop_image'],
            'shopCoverImage' => $vendorRow['shop_cover_image'] ?? null,
            'location' => $vendorRow['location'], 'rating' => (float)$vendorRow['rating'],
            'reviewCount' => (int)$vendorRow['review_count'],
            'totalSales' => (int)$vendorRow['total_sales'],
        ] : null,
    ];

    if ($row['preorder_enabled']) {
        $product['preOrderEnabled'] = true;
        $product['preparationTime'] = $row['preparation_time'];
        $product['pickupLocation'] = $row['pickup_location'] ?: ($vendorRow['pickup_location'] ?? null);
        $product['pickupLocationCoords'] = ['lat' => (float)$row['pickup_lat'], 'lng' => (float)$row['pickup_lng']];
        $product['maxAdvanceDays'] = (int)$row['max_advance_days'];
        $product['availableTimeSlots'] = array_column($slots->fetchAll(), 'slot_label');
        $product['nearDestinations'] = array_column($near->fetchAll(), 'place_id');
    } else {
        $product['preOrderEnabled'] = false;
    }

    return $product;
}

/**
 * SQL condition matching products located in any of $terms: the product's district or
 * pickup point, a linked nearby heritage place, or the vendor's address.
 * Returns [sql, params].
 */
function product_location_match(array $terms): array {
    $matches = []; $placeMatches = []; $vendorMatches = [];
    $productParams = []; $placeParams = []; $vendorParams = [];
    foreach ($terms as $term) {
        $like = '%' . $term . '%';
        $matches[] = '(products.district LIKE ? OR products.pickup_location LIKE ?)';
        array_push($productParams, $like, $like);
        $placeMatches[] = '(hp.name LIKE ? OR hp.location LIKE ? OR hp.district LIKE ? OR hp.division LIKE ?)';
        array_push($placeParams, $like, $like, $like, $like);
        $vendorMatches[] = '(v.location LIKE ? OR v.business_address LIKE ? OR v.pickup_location LIKE ?)';
        array_push($vendorParams, $like, $like, $like);
    }
    $sql = '((' . implode(' OR ', $matches) . ')
            OR EXISTS (
                SELECT 1 FROM product_near_destinations pnd
                JOIN heritage_places hp ON hp.id = pnd.place_id
                WHERE pnd.product_id = products.id AND (' . implode(' OR ', $placeMatches) . ')
            )
            OR EXISTS (
                SELECT 1 FROM vendors v
                WHERE v.user_id = products.vendor_id AND (' . implode(' OR ', $vendorMatches) . ')
            ))';
    return [$sql, array_merge($productParams, $placeParams, $vendorParams)];
}

function products_index(PDO $pdo): void {
    $viewer = current_user($pdo);
    $where = ['1=1']; $params = [];
    if (!$viewer || !in_array($viewer['role'], ['admin', 'vendor'], true)) {
        $where[] = "EXISTS (SELECT 1 FROM vendors v JOIN users u ON u.id = v.user_id
                            WHERE v.user_id = products.vendor_id AND v.verification_status = 'verified'
                              AND u.verified = 1 AND u.status = 'active')";
    } elseif ($viewer['role'] === 'vendor') {
        $where[] = "(products.vendor_id = ? OR EXISTS (SELECT 1 FROM vendors v JOIN users u ON u.id = v.user_id
                            WHERE v.user_id = products.vendor_id AND v.verification_status = 'verified'
                              AND u.verified = 1 AND u.status = 'active'))";
        $params[] = $viewer['id'];
    }
    if (!empty($_GET['category'])) {
        if ($_GET['category'] === 'gi-product') {
            $where[] = "(category = 'gi-product' OR EXISTS (
                SELECT 1 FROM product_tags pt
                WHERE pt.product_id = products.id AND LOWER(TRIM(pt.tag)) = 'gi product'
            ))";
        } else {
            $where[] = 'category = ?'; $params[] = $_GET['category'];
        }
    }
    if (!empty($_GET['vendorId'])) { $where[] = 'vendor_id = ?'; $params[] = $_GET['vendorId']; }
    if (!empty($_GET['district'])) { $where[] = 'district = ?'; $params[] = $_GET['district']; }
    if (!empty($_GET['featured'])) { $where[] = 'featured = 1'; }
    if (!empty($_GET['preorder'])) { $where[] = 'preorder_enabled = 1 AND stock > 0'; }
    if (!empty($_GET['destination'])) {
        $terms = array_values(array_filter(array_map('trim', explode('|', (string)$_GET['destination']))));
        if ($terms) {
            [$sql, $locParams] = product_location_match($terms);
            $where[] = $sql;
            array_push($params, ...$locParams);
        }
    }
    // area=<division|district|landmark>: products from that area. A district is widened to
    // its division (unless exact=1) with the district's own products sorted first.
    $area = null;
    $selectExtra = ''; $selectParams = []; $areaOrder = '';
    if (!empty($_GET['area']) && is_string($_GET['area'])) {
        $area = resolve_area($_GET['area'], ($_GET['scope'] ?? '') === 'district');
        $terms = $area ? area_query_terms($area, !empty($_GET['exact'])) : null;
        [$broadSql, $broadParams] = product_location_match($terms ? $terms['broad'] : [trim($_GET['area'])]);
        $where[] = $broadSql;
        array_push($params, ...$broadParams);
        if ($terms) {
            [$focusSql, $selectParams] = product_location_match($terms['focus']);
            $selectExtra = ", ($focusSql) AS area_focus";
            $areaOrder = 'area_focus DESC, ';
        }
    }
    if (!empty($_GET['search'])) { $where[] = '(name LIKE ? OR description LIKE ?)'; $like = '%'.$_GET['search'].'%'; array_push($params, $like, $like); }
    if (isset($_GET['minPrice'])) { $where[] = 'price >= ?'; $params[] = $_GET['minPrice']; }
    if (isset($_GET['maxPrice'])) { $where[] = 'price <= ?'; $params[] = $_GET['maxPrice']; }

    $sortMap = ['price_asc' => 'price ASC', 'price_desc' => 'price DESC', 'rating' => 'rating DESC', 'newest' => 'created_at DESC'];
    $order = $areaOrder . ($sortMap[$_GET['sort'] ?? ''] ?? 'featured DESC, rating DESC');

    $limit = min((int)($_GET['limit'] ?? 50), 200);
    $offset = max((int)($_GET['offset'] ?? 0), 0);

    $stmt = $pdo->prepare("SELECT products.*$selectExtra FROM products WHERE " . implode(' AND ', $where) . " ORDER BY $order LIMIT $limit OFFSET $offset");
    $stmt->execute(array_merge($selectParams, $params));
    $rows = $stmt->fetchAll();

    $countStmt = $pdo->prepare('SELECT COUNT(*) c FROM products WHERE ' . implode(' AND ', $where));
    $countStmt->execute($params);

    $products = array_map(function ($r) use ($pdo, $selectExtra) {
        $product = product_hydrate($pdo, $r);
        // 'local' = in the requested area itself, 'nearby' = elsewhere in its division.
        if ($selectExtra !== '') $product['areaMatch'] = $r['area_focus'] ? 'local' : 'nearby';
        return $product;
    }, $rows);
    json_ok($products, 200, ['total' => (int)$countStmt->fetch()['c'], 'area' => $area]);
}

function products_show(PDO $pdo, string $id): void {
    $viewer = current_user($pdo);
    $sql = 'SELECT * FROM products WHERE id = ?';
    if (!$viewer || !in_array($viewer['role'], ['admin', 'vendor'], true)) {
        $sql .= " AND EXISTS (SELECT 1 FROM vendors v JOIN users u ON u.id = v.user_id
                              WHERE v.user_id = products.vendor_id AND v.verification_status = 'verified'
                                AND u.verified = 1 AND u.status = 'active')";
    } elseif ($viewer['role'] === 'vendor') {
        $sql .= " AND (products.vendor_id = ? OR EXISTS (SELECT 1 FROM vendors v JOIN users u ON u.id = v.user_id
                              WHERE v.user_id = products.vendor_id AND v.verification_status = 'verified'
                                AND u.verified = 1 AND u.status = 'active'))";
    }
    $stmt = $pdo->prepare($sql);
    $viewer && $viewer['role'] === 'vendor' ? $stmt->execute([$id, $viewer['id']]) : $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) json_error('Product not found.', 404);
    json_ok(product_hydrate($pdo, $row));
}

const PRODUCT_CATEGORIES = ['gi-product', 'handicraft', 'clothing', 'food', 'jewelry', 'pottery', 'other'];

// Server-side validation shared by create + update ($partial = only validate keys that are present).
function validate_product_input(array $d, bool $partial): void {
    if (!$partial || array_key_exists('price', $d)) {
        if (!is_numeric($d['price'] ?? null) || (float)$d['price'] <= 0) json_error('Price must be a number greater than 0.', 422);
    }
    if (!$partial || array_key_exists('stock', $d)) {
        if (!is_numeric($d['stock'] ?? null) || (int)$d['stock'] != $d['stock'] || (int)$d['stock'] < 0) json_error('Stock must be a whole number, 0 or more.', 422);
    }
    if (!$partial || array_key_exists('category', $d)) {
        if (!in_array($d['category'] ?? null, PRODUCT_CATEGORIES, true)) json_error('Invalid product category.', 422);
    }
    foreach (['name', 'description'] as $f) {
        if ((!$partial || array_key_exists($f, $d)) && trim((string)($d[$f] ?? '')) === '') json_error(ucfirst($f) . ' is required.', 422);
    }
    if (array_key_exists('originalPrice', $d) && $d['originalPrice'] !== null && $d['originalPrice'] !== '') {
        if (!is_numeric($d['originalPrice']) || (float)$d['originalPrice'] <= (float)($d['price'] ?? 0)) {
            json_error('Original price must be greater than the discounted price.', 422);
        }
        if (empty($d['preOrderEnabled'])) {
            json_error('Ready to Pick discounts can only be set on Ready to Pick products.', 422);
        }
        if ((float)$d['price'] < (float)$d['originalPrice'] * 0.1) {
            json_error('The maximum product discount is 90%.', 422);
        }
    }
}

function products_create(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['vendor', 'admin']);
    $d = body();
    require_fields($d, ['name', 'description', 'price', 'category', 'stock']);
    validate_product_input($d, false);
    if (!empty($d['preOrderEnabled']) && trim((string)($d['preparationTime'] ?? '')) === '') {
        json_error('Preparation time is required for Ready to Pick products.', 422);
    }

    $vendorId = $user['role'] === 'vendor' ? $user['id'] : ($d['vendorId'] ?? null);
    if (!$vendorId) json_error('vendorId is required.', 422);

    $id = id_with_prefix('pr');
    $vendorStmt = $pdo->prepare('SELECT location, pickup_location FROM vendors WHERE user_id = ?');
    $vendorStmt->execute([$vendorId]);
    $vendorProfile = $vendorStmt->fetch();
    if (!$vendorProfile) json_error('Vendor profile not found.', 404);
    $pickupLocation = trim((string)($d['pickupLocation'] ?? ''))
        ?: trim((string)($vendorProfile['pickup_location'] ?? ''));
    if (!empty($d['preOrderEnabled']) && $pickupLocation === '') {
        json_error('Add a pickup location to this product or your vendor profile before enabling Ready to Pick.', 422);
    }

    $pdo->prepare(
        'INSERT INTO products (id, vendor_id, name, description, price, original_price, category, stock, featured, district,
                                preorder_enabled, preparation_time, pickup_location, pickup_lat, pickup_lng, max_advance_days)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $id, $vendorId, $d['name'], $d['description'], $d['price'], $d['originalPrice'] ?? null,
        $d['category'], $d['stock'], !empty($d['featured']) ? 1 : 0, $d['district'] ?? $vendorProfile['location'],
        !empty($d['preOrderEnabled']) ? 1 : 0, $d['preparationTime'] ?? null, $pickupLocation ?: null,
        $d['pickupLocationCoords']['lat'] ?? null, $d['pickupLocationCoords']['lng'] ?? null, $d['maxAdvanceDays'] ?? null,
    ]);

    foreach ((array)($d['images'] ?? []) as $i => $url) {
        $pdo->prepare('INSERT INTO product_images (product_id, url, sort_order) VALUES (?, ?, ?)')->execute([$id, $url, $i]);
    }
    foreach ((array)($d['tags'] ?? []) as $t) {
        $pdo->prepare('INSERT INTO product_tags (product_id, tag) VALUES (?, ?)')->execute([$id, $t]);
    }
    foreach ((array)($d['specifications'] ?? []) as $k => $v) {
        $pdo->prepare('INSERT INTO product_specifications (product_id, spec_key, spec_value) VALUES (?, ?, ?)')->execute([$id, $k, $v]);
    }
    foreach ((array)($d['availableTimeSlots'] ?? []) as $s) {
        $pdo->prepare('INSERT INTO product_time_slots (product_id, slot_label) VALUES (?, ?)')->execute([$id, $s]);
    }
    foreach ((array)($d['nearDestinations'] ?? []) as $placeId) {
        $pdo->prepare('INSERT INTO product_near_destinations (product_id, place_id) VALUES (?, ?)')->execute([$id, $placeId]);
    }

    products_show($pdo, $id);
}

function products_update(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    $stmt = $pdo->prepare(
        'SELECT p.vendor_id, p.preparation_time, p.pickup_location, v.pickup_location vendor_pickup_location
         FROM products p LEFT JOIN vendors v ON v.user_id = p.vendor_id WHERE p.id = ?'
    );
    $stmt->execute([$id]);
    $existing = $stmt->fetch();
    if (!$existing) json_error('Product not found.', 404);
    if ($user['id'] !== $existing['vendor_id']) require_role($user, ['admin']);

    $d = body();
    validate_product_input($d, true);
    if (!empty($d['preOrderEnabled'])
        && trim((string)($d['preparationTime'] ?? $existing['preparation_time'] ?? '')) === '') {
        json_error('Preparation time is required for Ready to Pick products.', 422);
    }
    $pickupLocation = trim((string)($d['pickupLocation'] ?? ''))
        ?: trim((string)($existing['pickup_location'] ?? ''))
        ?: trim((string)($existing['vendor_pickup_location'] ?? ''));
    if (!empty($d['preOrderEnabled']) && $pickupLocation === '') {
        json_error('Add a pickup location to this product or your vendor profile before enabling Ready to Pick.', 422);
    }
    $map = [
        'name' => 'name', 'description' => 'description', 'price' => 'price', 'originalPrice' => 'original_price',
        'category' => 'category', 'stock' => 'stock', 'featured' => 'featured', 'district' => 'district',
        'preOrderEnabled' => 'preorder_enabled', 'preparationTime' => 'preparation_time', 'pickupLocation' => 'pickup_location',
    ];
    $fields = []; $params = [];
    foreach ($map as $k => $col) {
        if (array_key_exists($k, $d)) {
            $fields[] = "$col = ?";
            $params[] = $k === 'preOrderEnabled' ? (!empty($d[$k]) ? 1 : 0) : $d[$k];
        }
    }
    if ($fields) {
        $params[] = $id;
        $pdo->prepare('UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }
    if (isset($d['images'])) {
        $pdo->prepare('DELETE FROM product_images WHERE product_id = ?')->execute([$id]);
        foreach ((array)$d['images'] as $i => $url) {
            $pdo->prepare('INSERT INTO product_images (product_id, url, sort_order) VALUES (?, ?, ?)')->execute([$id, $url, $i]);
        }
    }
    products_show($pdo, $id);
}

function products_delete(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    $stmt = $pdo->prepare('SELECT vendor_id FROM products WHERE id = ?');
    $stmt->execute([$id]);
    $existing = $stmt->fetch();
    if (!$existing) json_error('Product not found.', 404);
    if ($user['id'] !== $existing['vendor_id']) require_role($user, ['admin']);
    try {
        $pdo->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
    } catch (PDOException $e) {
        // Foreign-key violation: product appears in past orders / pre-orders.
        if ($e->getCode() === '23000') json_error('This product has order history and cannot be deleted. Set its stock to 0 instead.', 409);
        throw $e;
    }
    json_ok(null, 200, ['message' => 'Product deleted.']);
}
