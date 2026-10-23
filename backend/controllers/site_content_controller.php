<?php

function site_homepage_images(PDO $pdo): void {
    $defaults = [
        'heroImage' => 'https://images.unsplash.com/photo-1601315773738-d529c1a65d08?w=1920&h=1080&fit=crop&auto=format',
        'mapImage' => 'https://images.unsplash.com/photo-1524230659092-07f99a4d0ef6?w=800&h=600&fit=crop&auto=format',
        'testimonialAvatar1' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&auto=format',
        'testimonialAvatar2' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format',
        'testimonialAvatar3' => 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&auto=format',
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
        if (!is_string($url) || trim($url) === '' || strlen($url) > 500
            || !filter_var($url, FILTER_VALIDATE_URL)
            || !in_array(strtolower((string)parse_url($url, PHP_URL_SCHEME)), ['http', 'https'], true)) {
            json_error("A valid $field URL is required.", 422);
        }
        $updates[$key] = trim($url);
    }
    if (!$updates) json_error('Choose at least one homepage image to update.', 422);
    $stmt = $pdo->prepare(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
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
