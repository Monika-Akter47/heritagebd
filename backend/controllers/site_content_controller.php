<?php

function site_homepage_images(PDO $pdo): void {
    // Defaults are images shipped in heritagebd-data/uploads (the former Unsplash hero and map
    // photos were deleted upstream). Admins override them from the homepage image editor.
    $defaults = [
        'heroImage' => '/api/product-images/835d69733226b8c1632d5527003e3f35',          // Lalbagh Fort
        'mapImage' => '/api/product-images/c6ca3a2a90150458aed55de5116908d1',           // Sylhet tea gardens
        'testimonialAvatar1' => '/api/product-images/a267387730a3ad03cde593ca8f5762c1',
        'testimonialAvatar2' => '/api/product-images/6a1fd8b387fb84eaafdb777895c3c64c',
        'testimonialAvatar3' => '/api/product-images/80ea735e9138eb83b035c76fe03f499c',
    ];
    $keys = [
        'homepage_hero_image' => 'heroImage',
        'homepage_map_image' => 'mapImage',
        'homepage_testimonial_avatar_1' => 'testimonialAvatar1',
        'homepage_testimonial_avatar_2' => 'testimonialAvatar2',
        'homepage_testimonial_avatar_3' => 'testimonialAvatar3',
    ];
    $stmt = $pdo->prepare('SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (?, ?, ?, ?, ?)');
    $stmt->execute(array_keys($keys));
    foreach ($stmt->fetchAll() as $setting) {
        $defaults[$keys[$setting['setting_key']]] = $setting['setting_value'];
    }
    json_ok($defaults);
}

function admin_homepage_images_update(PDO $pdo): void {
    $admin = require_auth($pdo);
    require_role($admin, ['admin']);
    $data = body();
    $allowed = [
        'heroImage' => 'homepage_hero_image',
        'mapImage' => 'homepage_map_image',
        'testimonialAvatar1' => 'homepage_testimonial_avatar_1',
        'testimonialAvatar2' => 'homepage_testimonial_avatar_2',
        'testimonialAvatar3' => 'homepage_testimonial_avatar_3',
    ];
    $updates = [];
    foreach ($allowed as $field => $key) {
        if (!array_key_exists($field, $data)) continue;
        $url = $data[$field];
        if (!is_image_ref($url)) {
            json_error("A valid $field URL is required.", 422);
        }
        $updates[$key] = trim($url);
    }
    if (!$updates) json_error('Choose at least one homepage image to update.', 422);
    $stmt = $pdo->prepare(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ' . (db_is_pgsql()
            ? 'ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP'
            : 'ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)')
    );
    $pdo->beginTransaction();
    try {
        foreach ($updates as $key => $url) $stmt->execute([$key, $url]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
    site_homepage_images($pdo);
}
