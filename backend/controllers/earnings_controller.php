<?php

function payment_terms_show(PDO $pdo): void {
    $rows = $pdo->query('SELECT flow, advance_percent, commission_percent FROM commission_settings')->fetchAll();
    $terms = [];
    foreach ($rows as $row) {
        $terms[$row['flow']] = (float)$row['advance_percent'];
        $terms[$row['flow'] . 'Commission'] = (float)$row['commission_percent'];
    }
    foreach (['order', 'preorder', 'guide_booking'] as $flow) {
        if (!array_key_exists($flow, $terms)) throw new RuntimeException("Missing payment terms for {$flow}.");
    }
    json_ok($terms);
}

function earnings_me(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['vendor', 'guide']);
    $partnerId = $user['id'];
    $role = $user['role'];

    $settled = $pdo->prepare(
        'SELECT COALESCE(SUM(partner_total),0) total_earning,
                COALESCE(SUM(partner_released),0) paid_via_platform,
                COALESCE(SUM(partner_cash),0) collected_cash
         FROM settlements WHERE partner_id = ?'
    );
    $settled->execute([$partnerId]);
    $totals = $settled->fetch();
    $partnerRole = $role === 'vendor' ? 'vendor' : 'guide';
    $pending = 0.0;
    if ($partnerRole === 'vendor') {
        $orders = $pdo->prepare(
            "SELECT DISTINCT o.total_amount, o.advance_percent, o.commission_percent
             FROM orders o JOIN order_items oi ON oi.order_id = o.id
             JOIN products p ON p.id = oi.product_id
             WHERE p.vendor_id = ? AND o.status NOT IN ('cancelled','completed') AND o.advance_status = 'held'"
        );
        $orders->execute([$partnerId]);
        foreach ($orders->fetchAll() as $row) {
            $split = compute_split((int)round((float)$row['total_amount'] * 100), (float)$row['advance_percent'], (float)$row['commission_percent']);
            $pending += $split['released'] / 100;
        }
        $preorders = $pdo->prepare("SELECT total_amount, advance_percent, commission_percent FROM preorders WHERE vendor_id = ? AND status NOT IN ('cancelled','refunded','completed') AND advance_status = 'held'");
        $preorders->execute([$partnerId]);
        foreach ($preorders->fetchAll() as $row) {
            $split = compute_split((int)round((float)$row['total_amount'] * 100), (float)$row['advance_percent'], (float)$row['commission_percent']);
            $pending += $split['released'] / 100;
        }
    } else {
        $bookings = $pdo->prepare("SELECT total_price, advance_percent, commission_percent FROM guide_bookings WHERE guide_id = ? AND status NOT IN ('cancelled','rejected','completed') AND advance_status = 'held'");
        $bookings->execute([$partnerId]);
        foreach ($bookings->fetchAll() as $row) {
            $split = compute_split((int)round((float)$row['total_price'] * 100), (float)$row['advance_percent'], (float)$row['commission_percent']);
            $pending += $split['released'] / 100;
        }
    }
    $rows = $pdo->prepare('SELECT * FROM settlements WHERE partner_id = ? ORDER BY settled_at DESC LIMIT 20');
    $rows->execute([$partnerId]);
    $months = earnings_months($pdo, 'partner_id = ?', [$partnerId], 'partner_total');
    json_ok([
        'totals' => [
            'totalEarning' => (float)$totals['total_earning'],
            'paidViaPlatform' => (float)$totals['paid_via_platform'],
            'collectedCash' => (float)$totals['collected_cash'],
            'pendingRelease' => $pending,
        ],
        'settlements' => array_map('settlement_hydrate', $rows->fetchAll()),
        'byMonth' => $months,
    ]);
}

function settlement_hydrate(array $row): array {
    return [
        'id' => (int)$row['id'], 'flow' => $row['flow'], 'sourceId' => $row['source_id'],
        'partnerId' => $row['partner_id'], 'partnerRole' => $row['partner_role'],
        'grossAmount' => (float)$row['gross_amount'], 'advanceAmount' => (float)$row['advance_amount'],
        'commissionAmount' => (float)$row['commission_amount'], 'partnerReleased' => (float)$row['partner_released'],
        'partnerCash' => (float)$row['partner_cash'], 'partnerTotal' => (float)$row['partner_total'],
        'settledAt' => $row['settled_at'],
    ];
}

function earnings_months(PDO $pdo, string $where, array $params, string $field): array {
    $out = [];
    $start = new DateTime('first day of this month');
    $start->modify('-11 months');
    for ($i = 0; $i < 12; $i++) {
        $month = (clone $start)->modify("+{$i} months")->format('Y-m');
        // Month range instead of DATE_FORMAT so the query runs on MySQL and PostgreSQL.
        $stmt = $pdo->prepare("SELECT COALESCE(SUM({$field}),0) FROM settlements WHERE {$where} AND settled_at >= ? AND settled_at < ?");
        $stmt->execute([...$params, "$month-01", date('Y-m-01', strtotime("$month-01 +1 month"))]);
        $out[] = ['month' => $month, 'amount' => (float)$stmt->fetchColumn()];
    }
    return $out;
}

function admin_earnings(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $totals = $pdo->query(
        'SELECT COALESCE(SUM(gross_amount),0) gross_settled,
                COALESCE(SUM(commission_amount),0) admin_profit,
                COALESCE(SUM(partner_total),0) partners_earned
         FROM settlements'
    )->fetch();
    $held = (float)$pdo->query(
        "SELECT COALESCE(SUM(advance_amount),0) FROM (
           SELECT advance_amount FROM orders WHERE advance_status = 'held'
           UNION ALL SELECT advance_paid FROM preorders WHERE advance_status = 'held'
           UNION ALL SELECT advance_amount FROM guide_bookings WHERE advance_status = 'held'
         ) held_advances"
    )->fetchColumn();
    $refunded = (float)$pdo->query(
        "SELECT COALESCE(SUM(amount),0) FROM (
           SELECT advance_amount amount FROM orders WHERE advance_status = 'refunded'
           UNION ALL SELECT advance_paid amount FROM preorders WHERE advance_status = 'refunded'
           UNION ALL SELECT advance_amount amount FROM guide_bookings WHERE advance_status = 'refunded'
         ) refunds"
    )->fetchColumn();
    $flowRows = $pdo->query(
        'SELECT flow, COALESCE(SUM(gross_amount),0) gross_settled,
                COALESCE(SUM(commission_amount),0) admin_profit,
                COALESCE(SUM(partner_total),0) partners_earned
         FROM settlements GROUP BY flow'
    )->fetchAll();
    $byFlow = [];
    foreach ($flowRows as $row) {
        $byFlow[$row['flow']] = [
            'grossSettled' => (float)$row['gross_settled'],
            'adminProfit' => (float)$row['admin_profit'],
            'partnersEarned' => (float)$row['partners_earned'],
        ];
    }
    $byMonth = [];
    $start = new DateTime('first day of this month');
    $start->modify('-11 months');
    for ($i = 0; $i < 12; $i++) {
        $month = (clone $start)->modify("+{$i} months")->format('Y-m');
        $stmt = $pdo->prepare('SELECT COALESCE(SUM(commission_amount),0) FROM settlements WHERE settled_at >= ? AND settled_at < ?');
        $stmt->execute(["$month-01", date('Y-m-01', strtotime("$month-01 +1 month"))]);
        $byMonth[] = ['month' => $month, 'profit' => (float)$stmt->fetchColumn()];
    }
    $topStmt = $pdo->query(
        "SELECT s.partner_id, u.name, s.partner_role, SUM(s.partner_total) earnings
         FROM settlements s JOIN users u ON u.id = s.partner_id
         GROUP BY s.partner_id, u.name, s.partner_role ORDER BY earnings DESC LIMIT 5"
    );
    $top = ['vendors' => [], 'guides' => []];
    foreach ($topStmt->fetchAll() as $row) {
        $top[$row['partner_role'] === 'vendor' ? 'vendors' : 'guides'][] = [
            'id' => $row['partner_id'], 'name' => $row['name'], 'earnings' => (float)$row['earnings'],
        ];
    }
    json_ok([
        'totals' => [
            'grossSettled' => (float)$totals['gross_settled'],
            'adminProfit' => (float)$totals['admin_profit'],
            'partnersEarned' => (float)$totals['partners_earned'],
            'advanceHeld' => $held, 'advanceRefunded' => $refunded,
        ],
        'byFlow' => $byFlow, 'byMonth' => $byMonth, 'top' => $top,
    ]);
}

function commission_settings_index(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $rows = $pdo->query('SELECT flow, advance_percent, commission_percent FROM commission_settings ORDER BY flow')->fetchAll();
    json_ok(array_map(fn($row) => [
        'flow' => $row['flow'], 'advancePercent' => (float)$row['advance_percent'],
        'commissionPercent' => (float)$row['commission_percent'],
    ], $rows));
}

function commission_settings_update(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $d = body();
    $settings = $d['settings'] ?? null;
    if (!is_array($settings)) json_error('Commission settings must be provided as a settings array.', 422);
    $allowed = ['order', 'preorder', 'guide_booking'];
    $updates = [];
    foreach ($settings as $setting) {
        if (!is_array($setting) || !in_array($setting['flow'] ?? null, $allowed, true)
            || !isset($setting['advancePercent'], $setting['commissionPercent'])
            || !is_numeric($setting['advancePercent']) || !is_numeric($setting['commissionPercent'])) {
            json_error('Each setting requires a valid flow and numeric percentages.', 422);
        }
        $advance = (float)$setting['advancePercent'];
        $commission = (float)$setting['commissionPercent'];
        if ($commission < 0 || $advance < $commission || $advance > 100) {
            json_error('Percentages must satisfy 0 <= commission <= advance <= 100.', 422);
        }
        $updates[$setting['flow']] = [$advance, $commission];
    }
    if (count($updates) !== 3) json_error('Provide exactly one setting for each payment flow.', 422);
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('UPDATE commission_settings SET advance_percent = ?, commission_percent = ? WHERE flow = ?');
        foreach ($updates as $flow => [$advance, $commission]) $stmt->execute([$advance, $commission, $flow]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }
    commission_settings_index($pdo);
}
