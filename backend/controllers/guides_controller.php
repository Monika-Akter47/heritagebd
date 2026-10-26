<?php

function guide_hydrate(PDO $pdo, array $row): array {
    $id = $row['user_id'];
    $langs = $pdo->prepare('SELECT language FROM guide_languages WHERE guide_id = ?'); $langs->execute([$id]);
    $specs = $pdo->prepare('SELECT specialization FROM guide_specializations WHERE guide_id = ?'); $specs->execute([$id]);
    $certs = $pdo->prepare('SELECT certification FROM guide_certifications WHERE guide_id = ?'); $certs->execute([$id]);
    $areas = $pdo->prepare('SELECT area FROM guide_cover_areas WHERE guide_id = ?'); $areas->execute([$id]);
    $tours = $pdo->prepare('SELECT id, name, duration, price, description FROM guide_tour_types WHERE guide_id = ?'); $tours->execute([$id]);

    // Privacy: contact details and position are only revealed to the guide themself, admins,
    // or (for position only) when the guide has explicitly switched on availability AND
    // location sharing. Public viewers get an approximate position (~1 km), never the exact one.
    static $viewer = false;
    if ($viewer === false) $viewer = current_user($pdo);
    $isPrivileged = $viewer && ($viewer['id'] === $id || $viewer['role'] === 'admin');
    $sharing = (bool)$row['is_available'] && (bool)$row['is_location_sharing'] && (bool)$row['verified'];
    $lat = (float)($row['lat'] ?? 0); $lng = (float)($row['lng'] ?? 0);
    $coords = null;
    if ($isPrivileged) $coords = ['lat' => $lat, 'lng' => $lng];
    elseif ($sharing) $coords = ['lat' => round($lat, 2), 'lng' => round($lng, 2), 'approximate' => true];

    return [
        'id' => $id,
        'name' => $row['name'],
        'email' => $isPrivileged ? $row['email'] : null,
        'phone' => ($isPrivileged || (bool)($row['phone_public'] ?? false)) ? $row['phone'] : null,
        'avatar' => $row['avatar'] ?? $row['profile_image'], 'role' => 'guide',
        'createdAt' => $row['created_at'], 'verified' => (bool)$row['verified'],
        'bio' => $row['bio'], 'location' => $row['location'],
        'coordinates' => $coords,
        'pricePerDay' => (float)$row['price_per_day'],
        'rating' => (float)$row['rating'], 'reviewCount' => (int)$row['review_count'],
        'toursCompleted' => (int)$row['tours_completed'], 'yearsExperience' => (int)$row['years_experience'],
        'isAvailable' => (bool)$row['is_available'], 'isLocationSharing' => (bool)$row['is_location_sharing'],
        'isPhonePublic' => (bool)($row['phone_public'] ?? false),
        'profileImage' => $row['profile_image'] ?: ($row['avatar'] ?? null),
        'languages' => array_column($langs->fetchAll(), 'language'),
        'specializations' => array_column($specs->fetchAll(), 'specialization'),
        'certifications' => array_column($certs->fetchAll(), 'certification'),
        'coverAreas' => array_column($areas->fetchAll(), 'area'),
        'tourTypes' => array_map(fn($t) => [
            'id' => $t['id'], 'name' => $t['name'], 'duration' => $t['duration'],
            'price' => (float)$t['price'], 'description' => $t['description'],
        ], $tours->fetchAll()),
        'verificationStatus' => $row['verification_status'],
    ];
}

function guide_base_query(): string {
    return 'SELECT g.*, u.name, u.email, u.phone, u.avatar, u.verified, u.created_at
            FROM guides g JOIN users u ON u.id = g.user_id';
}

function guides_index(PDO $pdo): void {
    $where = ["g.verification_status = 'verified'", "u.verified = 1", "u.status = 'active'"];
    $params = [];
    if (!empty($_GET['location'])) { $where[] = 'g.location LIKE ?'; $params[] = '%' . $_GET['location'] . '%'; }
    if (!empty($_GET['available'])) { $where[] = 'g.is_available = 1'; }
    if (!empty($_GET['startDate']) || !empty($_GET['endDate'])) {
        $startDate = $_GET['startDate'] ?? '';
        $endDate = $_GET['endDate'] ?? '';
        $start = is_string($startDate) ? DateTime::createFromFormat('!Y-m-d', $startDate) : false;
        $end = is_string($endDate) ? DateTime::createFromFormat('!Y-m-d', $endDate) : false;
        if (!$start || !$end || $start->format('Y-m-d') !== $startDate || $end->format('Y-m-d') !== $endDate || $endDate < $startDate) {
            json_error('Provide a valid trip start and end date to check guide availability.', 422);
        }
        $where[] = "NOT EXISTS (
            SELECT 1 FROM guide_bookings b
            WHERE b.guide_id = g.user_id AND b.status IN ('pending','accepted')
              AND b.start_date <= ? AND b.end_date >= ?
        )";
        $params[] = $endDate;
        $params[] = $startDate;
        $where[] = "NOT EXISTS (
            SELECT 1 FROM trip_plans t
            WHERE t.guide_id = g.user_id AND t.guide_response = 'accepted'
              AND t.start_date <= ? AND t.end_date >= ?
        )";
        $params[] = $endDate;
        $params[] = $startDate;
    }
    if (!empty($_GET['search'])) { $where[] = 'u.name LIKE ?'; $params[] = '%' . $_GET['search'] . '%'; }

    $sql = guide_base_query() . ' WHERE ' . implode(' AND ', $where) . ' ORDER BY g.rating DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    json_ok(array_map(fn($r) => guide_hydrate($pdo, $r), $stmt->fetchAll()));
}

function guides_show(PDO $pdo, string $id): void {
    $viewer = current_user($pdo);
    $where = ' WHERE g.user_id = ?';
    if (!$viewer || ($viewer['id'] !== $id && $viewer['role'] !== 'admin')) {
        $where .= " AND g.verification_status = 'verified' AND u.verified = 1 AND u.status = 'active'";
    }
    $stmt = $pdo->prepare(guide_base_query() . $where);
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) json_error('Guide not found.', 404);
    json_ok(guide_hydrate($pdo, $row));
}

function guides_update(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    if ($user['role'] !== 'guide' || $user['id'] !== $id) require_role($user, ['admin']);
    $d = body();
    if (!empty($d['isPhonePublic'])) {
        $phone = $pdo->prepare('SELECT phone FROM users WHERE id = ?');
        $phone->execute([$id]);
        if (!trim((string)$phone->fetchColumn())) {
            json_error('Add a phone number to your account before making it public.', 422);
        }
    }

    $profileFields = ['bio', 'location', 'pricePerDay', 'tourTypes'];
    $isProfileSubmission = count(array_intersect($profileFields, array_keys($d))) > 0;
    if ($user['role'] === 'guide' && $isProfileSubmission) {
        require_fields($d, $profileFields);
        if (!is_string($d['bio']) || trim($d['bio']) === ''
            || !is_string($d['location']) || trim($d['location']) === ''
            || !is_numeric($d['pricePerDay']) || (float)$d['pricePerDay'] <= 0
            || !is_array($d['tourTypes']) || count($d['tourTypes']) === 0) {
            json_error('Add your bio, location, daily price, and at least one priced tour service.', 422);
        }
        foreach ($d['tourTypes'] as $tour) {
            if (!is_array($tour) || !isset($tour['name'], $tour['duration'], $tour['price'])
                || !is_string($tour['name']) || trim($tour['name']) === ''
                || !is_string($tour['duration']) || trim($tour['duration']) === ''
                || !is_numeric($tour['price']) || (float)$tour['price'] <= 0) {
                json_error('Every tour service needs a name, duration, and price greater than zero.', 422);
            }
        }
    }

    $map = [
        'bio' => 'bio', 'location' => 'location', 'pricePerDay' => 'price_per_day',
        'isAvailable' => 'is_available', 'isLocationSharing' => 'is_location_sharing',
        'isPhonePublic' => 'phone_public', 'profileImage' => 'profile_image', 'yearsExperience' => 'years_experience',
    ];
    $fields = []; $params = [];
    foreach ($map as $k => $col) {
        if (array_key_exists($k, $d)) {
            $fields[] = "$col = ?";
            $params[] = in_array($k, ['isAvailable', 'isLocationSharing', 'isPhonePublic'], true)
                ? (!empty($d[$k]) ? 1 : 0)
                : $d[$k];
        }
    }
    if (isset($d['coordinates'])) {
        $fields[] = 'lat = ?'; $params[] = $d['coordinates']['lat'];
        $fields[] = 'lng = ?'; $params[] = $d['coordinates']['lng'];
    }
    $pdo->beginTransaction();
    try {
        if ($fields) {
            $params[] = $id;
            $pdo->prepare('UPDATE guides SET ' . implode(', ', $fields) . ' WHERE user_id = ?')->execute($params);
        }

        foreach (['languages' => 'guide_languages,language', 'specializations' => 'guide_specializations,specialization',
                  'certifications' => 'guide_certifications,certification', 'coverAreas' => 'guide_cover_areas,area'] as $k => $spec) {
            if (isset($d[$k])) {
                [$table, $col] = explode(',', $spec);
                $pdo->prepare("DELETE FROM $table WHERE guide_id = ?")->execute([$id]);
                foreach ((array)$d[$k] as $val) {
                    $pdo->prepare("INSERT INTO $table (guide_id, $col) VALUES (?, ?)")->execute([$id, $val]);
                }
            }
        }
        if (isset($d['tourTypes'])) {
            $pdo->prepare('DELETE FROM guide_tour_types WHERE guide_id = ?')->execute([$id]);
            foreach ((array)$d['tourTypes'] as $t) {
                $pdo->prepare('INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES (?,?,?,?,?)')
                    ->execute([$id, $t['name'], $t['duration'], $t['price'], $t['description'] ?? null]);
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    // A pending guide saving their profile (the onboarding "submit") is a verification request.
    if ($user['id'] === $id && isset($d['bio'])) {
        $status = $pdo->prepare('SELECT verification_status FROM guides WHERE user_id = ?');
        $status->execute([$id]);
        if ($status->fetchColumn() === 'pending') {
            notify_admins($pdo, 'Guide verification request', "{$user['name']} submitted a guide profile for verification.", 'system', '/admin?section=verification');
        }
    }

    guides_show($pdo, $id);
}
