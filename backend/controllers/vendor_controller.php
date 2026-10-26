<?php

function vendor_profile_show(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['vendor']);

    $stmt = $pdo->prepare('SELECT * FROM vendors WHERE user_id = ?');
    $stmt->execute([$user['id']]);
    $vendor = $stmt->fetch();
    if (!$vendor) json_error('Vendor profile not found.', 404);

    json_ok([
        'shopName' => $vendor['shop_name'],
        'shopDescription' => $vendor['shop_description'],
        'shopImage' => $vendor['shop_image'],
        'shopCoverImage' => $vendor['shop_cover_image'] ?? null,
        'verificationStatus' => $vendor['verification_status'],
        'location' => $vendor['location'],
        'businessType' => $vendor['business_type'],
        'businessAddress' => $vendor['business_address'],
        'productCategories' => json_decode($vendor['product_categories'] ?: '[]', true) ?: [],
        'pickupLocation' => $vendor['pickup_location'],
        'rating' => (float)$vendor['rating'],
        'reviewCount' => (int)$vendor['review_count'],
        'nidNumber' => $vendor['nid_number'],
        'tradeLicense' => $vendor['trade_license'],
    ]);
}

function vendor_profile_update(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['vendor']);
    $data = body();
    $required = ['shopName', 'businessType', 'businessAddress', 'location', 'shopDescription', 'pickupLocation'];
    foreach ($required as $field) {
        if (!isset($data[$field]) || !is_string($data[$field]) || trim($data[$field]) === '') {
            json_error('Please complete all required business and shop information.', 422);
        }
    }

    $categories = $data['productCategories'] ?? null;
    if (!is_array($categories)) json_error('Choose at least one product category.', 422);
    $allowedCategories = ['GI Products', 'Handicrafts', 'Traditional Clothing', 'Food & Delicacies', 'Pottery', 'Jewelry', 'Artisan Products', 'Souvenirs'];
    $categories = array_values(array_unique(array_filter(
        array_map(
            fn($category) => is_string($category) && in_array(trim($category), $allowedCategories, true) ? trim($category) : '',
            $categories
        )
    )));
    if (!$categories) json_error('Choose at least one product category.', 422);
    foreach (['nidNumber', 'tradeLicense'] as $field) {
        if (isset($data[$field]) && !is_string($data[$field])) {
            json_error('Document reference fields must be text.', 422);
        }
    }
    foreach (['shopImage', 'shopCoverImage'] as $field) {
        if (isset($data[$field]) && (!is_string($data[$field]) || strlen($data[$field]) > 500)) {
            json_error('Shop images must be valid image URLs.', 422);
        }
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            "UPDATE vendors SET shop_name = ?, shop_description = ?, location = ?, business_type = ?,
             business_address = ?, product_categories = ?, pickup_location = ?, nid_number = ?, trade_license = ?,
             shop_image = COALESCE(?, shop_image), shop_cover_image = COALESCE(?, shop_cover_image),
             verification_status = 'pending' WHERE user_id = ?"
        );
        $stmt->execute([
            trim($data['shopName']), trim($data['shopDescription']), trim($data['location']),
            trim($data['businessType']), trim($data['businessAddress']), json_encode($categories),
            trim($data['pickupLocation']), trim((string)($data['nidNumber'] ?? '')),
            trim((string)($data['tradeLicense'] ?? '')), $data['shopImage'] ?? null,
            $data['shopCoverImage'] ?? null, $user['id'],
        ]);
        if ($stmt->rowCount() === 0) {
            $check = $pdo->prepare('SELECT 1 FROM vendors WHERE user_id = ?');
            $check->execute([$user['id']]);
            if (!$check->fetchColumn()) json_error('Vendor profile not found.', 404);
        }
        $pdo->prepare("UPDATE users SET verified = 0, status = 'active' WHERE id = ?")->execute([$user['id']]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }

    notify_admins($pdo, 'Vendor verification request', "{$user['name']} submitted shop details for verification.", 'system', '/admin?section=verification');
    vendor_profile_show($pdo);
}
