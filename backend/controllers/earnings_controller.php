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
    // Settlement counts the booking balance as cash the guide collects; it is only "received" once a
    // guide payment for that booking is confirmed (recorded by the guide, or the tourist's report confirmed).
    $cashConfirmed = (float)$totals['collected_cash'];
    $cashAwaiting = 0.0;
    if ($partnerRole === 'guide') {
        $cash = $pdo->prepare(
            "SELECT COALESCE(SUM(CASE WHEN gp.status = 'confirmed' THEN s.partner_cash ELSE 0 END),0) confirmed,
                    COALESCE(SUM(CASE WHEN gp.status = 'confirmed' THEN 0 ELSE s.partner_cash END),0) awaiting
             FROM settlements s LEFT JOIN guide_payments gp ON gp.booking_id = s.source_id
             WHERE s.partner_id = ? AND s.flow = 'guide_booking'"
        );
        $cash->execute([$partnerId]);
        $cashRow = $cash->fetch();
        $cashConfirmed = (float)$cashRow['confirmed'];
        $cashAwaiting = (float)$cashRow['awaiting'];
    }
    $rows = $pdo->prepare(
        "SELECT s.*, gp.status AS cash_status, gp.method AS cash_method
         FROM settlements s
         LEFT JOIN guide_payments gp ON s.flow = 'guide_booking' AND gp.booking_id = s.source_id
         WHERE s.partner_id = ? ORDER BY s.settled_at DESC LIMIT 20"
    );
    $rows->execute([$partnerId]);
    $months = earnings_months($pdo, 'partner_id = ?', [$partnerId], 'partner_total');
    json_ok([
        'totals' => [
            'totalEarning' => (float)$totals['total_earning'],
            'paidViaPlatform' => (float)$totals['paid_via_platform'],
            'collectedCash' => (float)$totals['collected_cash'],
            'pendingRelease' => $pending,
            'cashConfirmed' => $cashConfirmed,
            'cashAwaiting' => $cashAwaiting,
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
        // Guide bookings only: 'confirmed', 'reported', or null while no payment is recorded.
        'cashStatus' => $row['cash_status'] ?? null, 'cashMethod' => $row['cash_method'] ?? null,
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

/**
 * GET /admin/payments — every payment the platform has taken or recorded, for reconciliation:
 *   advances: the online advance of each order, pre-order and guide booking (held → released or refunded);
 *   balances: the remainder paid to the partner — pre-order pickup payments and guide cash payments.
 * Wallet rows carry the payer number and TrxID so they can be matched against the bKash/Nagad statement.
 */
function admin_payments(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);

    $advances = $pdo->query(
        "SELECT * FROM (
           SELECT 'order' AS flow, o.id AS ref, o.id AS record_id, o.created_at, o.status,
                  u.name AS customer_name, u.phone AS customer_phone,
                  (SELECT v.shop_name FROM order_items oi JOIN products p ON p.id = oi.product_id
                     JOIN vendors v ON v.user_id = p.vendor_id WHERE oi.order_id = o.id LIMIT 1) AS partner_name,
                  o.total_amount AS total, o.advance_amount AS advance, o.payment_method AS method,
                  o.advance_payer_phone AS payer_phone, o.advance_transaction_id AS transaction_id, o.advance_status,
                  NULL AS refund_method, NULL AS refund_transaction_id, NULL AS refunded_at
           FROM orders o JOIN users u ON u.id = o.user_id
           UNION ALL
           SELECT 'preorder', po.order_number, po.id, po.created_at, po.status,
                  u.name, u.phone, v.shop_name,
                  po.total_amount, po.advance_paid, po.advance_payment_method,
                  po.advance_payer_phone, po.advance_transaction_id, po.advance_status,
                  po.refund_method, po.refund_transaction_id, po.refunded_at
           FROM preorders po JOIN users u ON u.id = po.tourist_id JOIN vendors v ON v.user_id = po.vendor_id
           UNION ALL
           SELECT 'guide_booking', b.id, b.id, b.created_at, b.status,
                  u.name, u.phone, g.name,
                  b.total_price, b.advance_amount, b.advance_payment_method,
                  b.advance_payer_phone, b.advance_transaction_id, b.advance_status,
                  b.refund_method, b.refund_transaction_id, b.refunded_at
           FROM guide_bookings b JOIN users u ON u.id = b.tourist_id JOIN users g ON g.id = b.guide_id
         ) advances ORDER BY created_at DESC LIMIT 500"
    )->fetchAll();

    $balances = $pdo->query(
        "SELECT * FROM (
           SELECT 'preorder' AS flow, po.order_number AS ref, po.id AS record_id, po.updated_at AS paid_at,
                  u.name AS customer_name, v.shop_name AS partner_name,
                  po.total_amount - po.advance_paid AS amount, po.pickup_payment_method AS method,
                  po.pickup_payer_phone AS payer_phone, po.pickup_transaction_id AS transaction_id,
                  'confirmed' AS status, 'vendor' AS recorded_by
           FROM preorders po JOIN users u ON u.id = po.tourist_id JOIN vendors v ON v.user_id = po.vendor_id
           WHERE po.status IN ('picked_up','completed')
           UNION ALL
           SELECT 'guide_booking', gp.booking_id, gp.id, COALESCE(gp.confirmed_at, gp.reported_at),
                  u.name, g.name, gp.amount, gp.method, gp.payer_phone, gp.reference, gp.status, gp.recorded_by
           FROM guide_payments gp JOIN guide_bookings b ON b.id = gp.booking_id
             JOIN users u ON u.id = b.tourist_id JOIN users g ON g.id = b.guide_id
         ) balances ORDER BY paid_at DESC LIMIT 500"
    )->fetchAll();

    $totals = ['advanceCollected' => 0.0, 'advanceHeld' => 0.0, 'advanceReleased' => 0.0, 'advanceRefunded' => 0.0, 'advanceRefundPending' => 0.0,
               'balanceCollected' => 0.0, 'balanceAwaitingConfirmation' => 0.0, 'walletMissingProof' => 0];
    foreach ($advances as $row) {
        $amount = (float)$row['advance'];
        $totals['advanceCollected'] += $amount;
        $key = ['held' => 'advanceHeld', 'released' => 'advanceReleased', 'refunded' => 'advanceRefunded', 'refund_pending' => 'advanceRefundPending'][$row['advance_status']] ?? null;
        if ($key) $totals[$key] += $amount;
        if (in_array($row['method'], ['bkash', 'nagad'], true) && (!$row['payer_phone'] || !$row['transaction_id'])) {
            $totals['walletMissingProof']++;
        }
    }
    foreach ($balances as $row) {
        $totals[$row['status'] === 'confirmed' ? 'balanceCollected' : 'balanceAwaitingConfirmation'] += (float)$row['amount'];
    }
    $totals['commissionEarned'] = (float)$pdo->query('SELECT COALESCE(SUM(commission_amount),0) FROM settlements')->fetchColumn();

    json_ok([
        'totals' => $totals,
        'advances' => array_map(fn($r) => [
            'flow' => $r['flow'], 'ref' => $r['ref'], 'recordId' => $r['record_id'], 'createdAt' => $r['created_at'],
            'status' => $r['status'], 'customerName' => $r['customer_name'], 'customerPhone' => $r['customer_phone'],
            'partnerName' => $r['partner_name'], 'total' => (float)$r['total'], 'advance' => (float)$r['advance'],
            'method' => $r['method'], 'payerPhone' => $r['payer_phone'], 'transactionId' => $r['transaction_id'],
            'advanceStatus' => $r['advance_status'], 'refundMethod' => $r['refund_method'],
            'refundTransactionId' => $r['refund_transaction_id'], 'refundedAt' => $r['refunded_at'],
        ], $advances),
        'balances' => array_map(fn($r) => [
            'flow' => $r['flow'], 'ref' => $r['ref'], 'recordId' => $r['record_id'], 'paidAt' => $r['paid_at'],
            'customerName' => $r['customer_name'], 'partnerName' => $r['partner_name'], 'amount' => (float)$r['amount'],
            'method' => $r['method'], 'payerPhone' => $r['payer_phone'], 'transactionId' => $r['transaction_id'],
            'status' => $r['status'], 'recordedBy' => $r['recorded_by'],
        ], $balances),
    ]);
}

/**
 * POST /admin/refunds/{preorder|guide_booking}/{id} — the admin records the advance sent back to the tourist
 * after a vendor cancelled a paid pre-order or a guide cancelled or rejected a booking.
 * Body: method (bkash | nagad | card) and transactionId of the refund.
 */
function admin_refund(PDO $pdo, string $flow, string $id): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $d = body();
    $method = $d['method'] ?? '';
    if (!is_string($method) || !in_array($method, ['bkash', 'nagad', 'card'], true)) {
        json_error('Choose how the refund was sent: bKash, Nagad, or card.', 422);
    }
    $txn = strtoupper(trim((string)($d['transactionId'] ?? '')));
    if (!preg_match('/^[A-Z0-9]{6,20}$/', $txn)) {
        json_error('Enter the refund transaction ID (6–20 letters and digits).', 422);
    }

    $table = $flow === 'preorder' ? 'preorders' : 'guide_bookings';
    $pdo->beginTransaction();
    $stmt = $pdo->prepare("SELECT * FROM $table WHERE id = ? FOR UPDATE");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) { $pdo->rollBack(); json_error('Not found.', 404); }
    if ($row['advance_status'] !== 'refund_pending') {
        $pdo->rollBack();
        json_error('This advance is not waiting for a refund.', 409);
    }
    $now = date('Y-m-d H:i:s');
    if ($flow === 'preorder') {
        $pdo->prepare("UPDATE preorders SET advance_status = 'refunded', status = 'refunded', refund_amount = advance_paid,
                         refund_method = ?, refund_transaction_id = ?, refunded_at = ? WHERE id = ?")
            ->execute([$method, $txn, $now, $id]);
        $amount = (float)$row['advance_paid'];
        $label = "pre-order {$row['order_number']}";
        $link = '/preorder/tracking/' . $id;
        $partner = $row['vendor_id'];
    } else {
        $pdo->prepare("UPDATE guide_bookings SET advance_status = 'refunded',
                         refund_method = ?, refund_transaction_id = ?, refunded_at = ? WHERE id = ?")
            ->execute([$method, $txn, $now, $id]);
        $amount = (float)$row['advance_amount'];
        $label = 'your guide booking';
        $link = '/profile?tab=trips';
        $partner = $row['guide_id'];
    }
    $pdo->commit();

    $taka = number_format($amount, 2);
    notify($pdo, $row['tourist_id'], 'Advance refunded',
        "৳$taka for $label was sent back by " . strtoupper($method) . " (TrxID $txn).", $flow === 'preorder' ? 'order' : 'booking', $link);
    notify($pdo, $partner, 'Advance refunded', "The tourist's advance for $label was refunded by the admin.", $flow === 'preorder' ? 'order' : 'booking');
    json_ok(['flow' => $flow, 'id' => $id, 'advanceStatus' => 'refunded', 'amount' => $amount,
             'refundMethod' => $method, 'refundTransactionId' => $txn, 'refundedAt' => $now]);
}
