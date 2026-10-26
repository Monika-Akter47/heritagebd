<?php

// Last 6 calendar months: marketplace revenue (non-cancelled orders) and new sign-ups by role.
function admin_monthly_series(PDO $pdo): array {
    $out = [];
    for ($i = 5; $i >= 0; $i--) {
        $start = date('Y-m-01', strtotime("-$i months"));
        $end   = date('Y-m-01', strtotime($start . ' +1 month'));
        $rev = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE status != 'cancelled' AND created_at >= ? AND created_at < ?");
        $rev->execute([$start, $end]);
        $u = $pdo->prepare("SELECT role, COUNT(*) c FROM users WHERE created_at >= ? AND created_at < ? GROUP BY role");
        $u->execute([$start, $end]);
        $by = array_column($u->fetchAll(), 'c', 'role');
        $out[] = ['month' => date('M', strtotime($start)), 'revenue' => (float)$rev->fetchColumn(),
                  'tourists' => (int)($by['tourist'] ?? 0), 'guides' => (int)($by['guide'] ?? 0), 'vendors' => (int)($by['vendor'] ?? 0)];
    }
    return $out;
}

function admin_stats(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);

    $q = fn(string $sql) => (int)$pdo->query($sql)->fetch()['c'];
    json_ok([
        'totalUsers'         => $q('SELECT COUNT(*) c FROM users'),
        'totalTourists'      => $q("SELECT COUNT(*) c FROM users WHERE role = 'tourist'"),
        'totalVendors'       => $q("SELECT COUNT(*) c FROM users WHERE role = 'vendor'"),
        'totalGuides'        => $q("SELECT COUNT(*) c FROM users WHERE role = 'guide'"),
        'pendingGuides'      => $q("SELECT COUNT(*) c FROM guides WHERE verification_status = 'pending'"),
        'pendingVendors'     => $q("SELECT COUNT(*) c FROM vendors WHERE verification_status = 'pending'"),
        'totalPlaces'        => $q('SELECT COUNT(*) c FROM heritage_places'),
        'totalProducts'      => $q('SELECT COUNT(*) c FROM products'),
        'totalOrders'        => $q('SELECT COUNT(*) c FROM orders'),
        'totalBookings'      => $q('SELECT COUNT(*) c FROM guide_bookings'),
        'completedTours'     => $q(
            "SELECT
                (SELECT COUNT(*) FROM guide_bookings b WHERE b.status = 'completed' AND NOT EXISTS (
                    SELECT 1 FROM trip_plans t WHERE t.user_id = b.tourist_id AND t.guide_id = b.guide_id
                      AND t.start_date = b.start_date AND t.end_date = b.end_date
                      AND t.guide_response = 'accepted' AND t.status = 'completed'
                ))
                + (SELECT COUNT(*) FROM trip_plans WHERE status = 'completed' AND guide_response = 'accepted') c"
        ),
        'totalPreorders'     => $q('SELECT COUNT(*) c FROM preorders'),
        'monthly'            => admin_monthly_series($pdo),
        'revenueThisMonth'   => (function () use ($pdo) {
            // Month range computed in PHP so the query is the same on MySQL and PostgreSQL.
            $stmt = $pdo->prepare("SELECT COALESCE(SUM(total_amount),0) s FROM orders WHERE status != 'cancelled' AND created_at >= ? AND created_at < ?");
            $stmt->execute([date('Y-m-01 00:00:00'), date('Y-m-01 00:00:00', strtotime('first day of next month'))]);
            return (float)$stmt->fetch()['s'];
        })(),
    ]);
}

function admin_users(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $where = ['1=1']; $params = [];
    if (!empty($_GET['role'])) { $where[] = 'role = ?'; $params[] = $_GET['role']; }
    if (!empty($_GET['status'])) { $where[] = 'status = ?'; $params[] = $_GET['status']; }
    $stmt = $pdo->prepare('SELECT * FROM users WHERE ' . implode(' AND ', $where) . ' ORDER BY created_at DESC LIMIT 200');
    $stmt->execute($params);
    json_ok(array_map('public_user', $stmt->fetchAll()));
}

function admin_guides_index(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $stmt = $pdo->query(guide_base_query() . ' ORDER BY u.created_at DESC');
    json_ok(array_map(fn($r) => guide_hydrate($pdo, $r), $stmt->fetchAll()));
}

function admin_guides_pending(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $stmt = $pdo->query(guide_base_query() . " WHERE g.verification_status = 'pending' ORDER BY u.created_at ASC");
    json_ok(array_map(fn($r) => guide_hydrate($pdo, $r), $stmt->fetchAll()));
}

function admin_guide_verify(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $d = body();
    require_fields($d, ['status']); // 'verified' | 'rejected'
    if (!in_array($d['status'], ['verified', 'rejected'], true)) json_error('status must be verified or rejected.', 422);

    $exists = $pdo->prepare('SELECT 1 FROM guides WHERE user_id = ?');
    $exists->execute([$id]);
    if (!$exists->fetchColumn()) json_error('Guide not found.', 404);

    $pdo->prepare('UPDATE guides SET verification_status = ? WHERE user_id = ?')->execute([$d['status'], $id]);
    $pdo->prepare('UPDATE users SET verified = ?, status = ? WHERE id = ?')
        ->execute([$d['status'] === 'verified' ? 1 : 0, $d['status'] === 'verified' ? 'active' : 'suspended', $id]);

    notify($pdo, $id, 'Verification update', "Your guide profile has been {$d['status']}.", 'system', '/guide-dashboard');
    json_ok(null, 200, ['message' => "Guide $d[status]."]);
}

function admin_vendors_pending(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $stmt = $pdo->query(
        "SELECT v.*, u.name, u.email, u.phone, u.avatar, u.created_at FROM vendors v
         JOIN users u ON u.id = v.user_id WHERE v.verification_status = 'pending' ORDER BY u.created_at ASC"
    );
    json_ok(array_map(fn($r) => [
        'id' => $r['user_id'], 'name' => $r['name'], 'email' => $r['email'], 'phone' => $r['phone'], 'avatar' => $r['avatar'],
        'shopName' => $r['shop_name'], 'shopDescription' => $r['shop_description'],
        'shopImage' => $r['shop_image'], 'shopCoverImage' => $r['shop_cover_image'] ?? null, 'location' => $r['location'],
        'businessType' => $r['business_type'] ?? null, 'businessAddress' => $r['business_address'] ?? null,
        'productCategories' => json_decode($r['product_categories'] ?: '[]', true) ?: [],
        'pickupLocation' => $r['pickup_location'] ?? null,
        'nidNumber' => $r['nid_number'], 'tradeLicense' => $r['trade_license'], 'createdAt' => $r['created_at'],
    ], $stmt->fetchAll()));
}

function admin_vendors_all(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $where = ['1=1']; $params = [];
    if (!empty($_GET['status'])) { $where[] = 'v.verification_status = ?'; $params[] = $_GET['status']; }
    $stmt = $pdo->prepare(
        'SELECT v.*, u.name, u.email, u.phone, u.avatar, u.created_at FROM vendors v
         JOIN users u ON u.id = v.user_id WHERE ' . implode(' AND ', $where) . ' ORDER BY u.created_at DESC'
    );
    $stmt->execute($params);
    json_ok(array_map(fn($r) => [
        'id' => $r['user_id'], 'name' => $r['name'], 'email' => $r['email'], 'phone' => $r['phone'], 'avatar' => $r['avatar'],
        'shopName' => $r['shop_name'], 'shopDescription' => $r['shop_description'],
        'shopImage' => $r['shop_image'], 'shopCoverImage' => $r['shop_cover_image'] ?? null, 'location' => $r['location'],
        'businessType' => $r['business_type'] ?? null, 'businessAddress' => $r['business_address'] ?? null,
        'productCategories' => json_decode($r['product_categories'] ?: '[]', true) ?: [],
        'pickupLocation' => $r['pickup_location'] ?? null,
        'nidNumber' => $r['nid_number'], 'tradeLicense' => $r['trade_license'],
        'verificationStatus' => $r['verification_status'], 'createdAt' => $r['created_at'],
    ], $stmt->fetchAll()));
}

function admin_vendor_verify(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $d = body();
    require_fields($d, ['status']);
    if (!in_array($d['status'], ['verified', 'rejected'], true)) json_error('status must be verified or rejected.', 422);

    $exists = $pdo->prepare('SELECT 1 FROM vendors WHERE user_id = ?');
    $exists->execute([$id]);
    if (!$exists->fetchColumn()) json_error('Vendor not found.', 404);
    $pdo->beginTransaction();
    try {
        $pdo->prepare('UPDATE vendors SET verification_status = ? WHERE user_id = ?')->execute([$d['status'], $id]);
        // Same as guides (SRS §4.5, FR-04): approval activates the account, rejection suspends it.
        $pdo->prepare('UPDATE users SET verified = ?, status = ? WHERE id = ?')
            ->execute([$d['status'] === 'verified' ? 1 : 0, $d['status'] === 'verified' ? 'active' : 'suspended', $id]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }

    notify($pdo, $id, 'Verification update', "Your vendor shop has been {$d['status']}.", 'system', '/vendor/verification-status');
    json_ok(null, 200, ['message' => "Vendor $d[status]."]);
}


// ---- User moderation -------------------------------------------------------
function admin_user_status(PDO $pdo, string $id): void {
    $admin = require_auth($pdo);
    require_role($admin, ['admin']);
    $d = body();
    require_fields($d, ['status']);
    if (!in_array($d['status'], ['active', 'suspended'], true)) json_error('Status must be active or suspended.', 422);
    if ($id === $admin['id']) json_error('You cannot change your own account status.', 422);
    $t = $pdo->prepare('SELECT role FROM users WHERE id = ?'); $t->execute([$id]);
    $target = $t->fetch();
    if (!$target) json_error('User not found.', 404);
    if ($target['role'] === 'admin') json_error('Admin accounts cannot be suspended here.', 403);
    $pdo->prepare('UPDATE users SET status = ? WHERE id = ?')->execute([$d['status'], $id]);
    if ($d['status'] === 'suspended') $pdo->prepare('DELETE FROM auth_tokens WHERE user_id = ?')->execute([$id]); // force logout
    json_ok(['id' => $id, 'status' => $d['status']]);
}

// ---- Review moderation -----------------------------------------------------
function admin_reviews(PDO $pdo): void {
    $admin = require_auth($pdo);
    require_role($admin, ['admin']);
    $rows = $pdo->query('SELECT r.id, r.target_id, r.target_type, r.rating, r.title, r.content, r.created_at, u.name AS user_name
                         FROM reviews r JOIN users u ON u.id = r.user_id ORDER BY r.created_at DESC LIMIT 200')->fetchAll();
    json_ok(array_map(fn($r) => [
        'id' => $r['id'], 'targetId' => $r['target_id'], 'targetType' => $r['target_type'], 'rating' => (int)$r['rating'],
        'title' => $r['title'], 'content' => $r['content'], 'createdAt' => $r['created_at'], 'userName' => $r['user_name'],
    ], $rows));
}

function admin_review_delete(PDO $pdo, string $id): void {
    $admin = require_auth($pdo);
    require_role($admin, ['admin']);
    $g = $pdo->prepare('SELECT target_id, target_type FROM reviews WHERE id = ?'); $g->execute([$id]);
    $rv = $g->fetch();
    if (!$rv) json_error('Review not found.', 404);
    $pdo->prepare('DELETE FROM reviews WHERE id = ?')->execute([$id]);
    $table = ['place' => 'heritage_places', 'product' => 'products', 'guide' => 'guides', 'vendor' => 'vendors'][$rv['target_type']];
    $idCol = in_array($rv['target_type'], ['guide', 'vendor'], true) ? 'user_id' : 'id';
    $agg = $pdo->prepare('SELECT COALESCE(AVG(rating),0) a, COUNT(*) c FROM reviews WHERE target_type = ? AND target_id = ?');
    $agg->execute([$rv['target_type'], $rv['target_id']]);
    $a = $agg->fetch();
    $pdo->prepare("UPDATE $table SET rating = ?, review_count = ? WHERE $idCol = ?")->execute([round((float)$a['a'], 1), (int)$a['c'], $rv['target_id']]);
    json_ok(null, 200, ['message' => 'Review removed.']);
}

// ---- Events & stories (content management) ---------------------------------
function admin_event_create(PDO $pdo): void {
    $admin = require_auth($pdo); require_role($admin, ['admin']);
    $d = body();
    require_fields($d, ['name', 'category', 'location', 'district', 'startDate', 'endDate', 'image']);
    if (!in_array($d['category'], ['cultural','food','market','heritage','festival','religious'], true)) json_error('Invalid event category.', 422);
    if ($d['endDate'] < $d['startDate']) json_error('End date cannot be before start date.', 422);
    $id = id_with_prefix('ev');
    $pdo->prepare('INSERT INTO events (id,name,description,category,location,district,start_date,end_date,image,featured,is_free,ticket_price,organizer) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
        ->execute([$id, $d['name'], $d['description'] ?? null, $d['category'], $d['location'], $d['district'], $d['startDate'], $d['endDate'],
                   $d['image'], (int)($d['featured'] ?? 0), (int)($d['isFree'] ?? 1), $d['ticketPrice'] ?? null, $d['organizer'] ?? null]);
    events_show($pdo, $id);
}

function admin_event_update(PDO $pdo, string $id): void {
    $admin = require_auth($pdo); require_role($admin, ['admin']);
    $d = body();
    require_fields($d, ['image']);
    if (!is_image_ref($d['image'])) json_error('A valid event image URL is required.', 422);
    $stmt = $pdo->prepare('UPDATE events SET image = ? WHERE id = ?');
    $stmt->execute([trim($d['image']), $id]);
    if (!$stmt->rowCount()) {
        $check = $pdo->prepare('SELECT id FROM events WHERE id = ?');
        $check->execute([$id]);
        if (!$check->fetch()) json_error('Event not found.', 404);
    }
    events_show($pdo, $id);
}

function admin_event_delete(PDO $pdo, string $id): void {
    $admin = require_auth($pdo); require_role($admin, ['admin']);
    $st = $pdo->prepare('DELETE FROM events WHERE id = ?'); $st->execute([$id]);
    if (!$st->rowCount()) json_error('Event not found.', 404);
    json_ok(null, 200, ['message' => 'Event deleted.']);
}

function admin_story_create(PDO $pdo): void {
    $admin = require_auth($pdo); require_role($admin, ['admin']);
    $d = body();
    require_fields($d, ['title', 'content', 'category', 'image']);
    if (!in_array($d['category'], ['heritage','food','culture','travel','festival','artisan'], true)) json_error('Invalid story category.', 422);
    $id = id_with_prefix('st');
    $pdo->prepare('INSERT INTO stories (id,title,excerpt,content,author_name,category,image,read_time,featured) VALUES (?,?,?,?,?,?,?,?,?)')
        ->execute([$id, $d['title'], $d['excerpt'] ?? null, $d['content'], $d['authorName'] ?? $admin['name'], $d['category'], $d['image'],
                   $d['readTime'] ?? null, (int)($d['featured'] ?? 0)]);
    stories_show($pdo, $id);
}

function admin_story_update(PDO $pdo, string $id): void {
    $admin = require_auth($pdo); require_role($admin, ['admin']);
    $d = body();
    require_fields($d, ['image']);
    if (!is_image_ref($d['image'])) json_error('A valid story image URL is required.', 422);
    $stmt = $pdo->prepare('UPDATE stories SET image = ? WHERE id = ?');
    $stmt->execute([trim($d['image']), $id]);
    if (!$stmt->rowCount()) {
        $check = $pdo->prepare('SELECT id FROM stories WHERE id = ?');
        $check->execute([$id]);
        if (!$check->fetch()) json_error('Story not found.', 404);
    }
    stories_show($pdo, $id);
}

function admin_story_delete(PDO $pdo, string $id): void {
    $admin = require_auth($pdo); require_role($admin, ['admin']);
    $st = $pdo->prepare('DELETE FROM stories WHERE id = ?'); $st->execute([$id]);
    if (!$st->rowCount()) json_error('Story not found.', 404);
    json_ok(null, 200, ['message' => 'Story deleted.']);
}
