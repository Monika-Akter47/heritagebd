<?php

function get_setting(PDO $pdo, string $flow): array {
    $stmt = $pdo->prepare('SELECT advance_percent, commission_percent FROM commission_settings WHERE flow = ?');
    $stmt->execute([$flow]);
    $setting = $stmt->fetch();
    if (!$setting) throw new RuntimeException("Missing commission settings for {$flow}.");
    return [
        'advancePercent' => (float)$setting['advance_percent'],
        'commissionPercent' => (float)$setting['commission_percent'],
    ];
}

function compute_split(int $grossPoisha, float $advPct, float $commPct): array {
    if ($grossPoisha < 0 || $commPct < 0 || $advPct < $commPct || $advPct > 100) {
        throw new InvalidArgumentException('Invalid settlement amounts or percentages.');
    }
    $advance = (int)round($grossPoisha * $advPct / 100);
    $commission = (int)round($grossPoisha * $commPct / 100);
    $released = $advance - $commission;
    $cash = $grossPoisha - $advance;
    return [
        'advance' => $advance,
        'commission' => $commission,
        'released' => $released,
        'cash' => $cash,
        'partnerTotal' => $released + $cash,
    ];
}

function settlement_insert(PDO $pdo, string $flow, string $sourceId, string $partnerId, string $role, int $grossPoisha, array $split): void {
    $stmt = $pdo->prepare(
        'INSERT INTO settlements
         (flow, source_id, partner_id, partner_role, gross_amount, advance_amount, commission_amount, partner_released, partner_cash, partner_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $flow, $sourceId, $partnerId, $role,
        number_format($grossPoisha / 100, 2, '.', ''),
        number_format($split['advance'] / 100, 2, '.', ''),
        number_format($split['commission'] / 100, 2, '.', ''),
        number_format($split['released'] / 100, 2, '.', ''),
        number_format($split['cash'] / 100, 2, '.', ''),
        number_format($split['partnerTotal'] / 100, 2, '.', ''),
    ]);
}

function settle_order(PDO $pdo, array $order): void {
    if ($order['advance_status'] !== 'held') return;
    $stmt = $pdo->prepare(
        'SELECT p.vendor_id, SUM(oi.price * oi.quantity) AS line_total
         FROM order_items oi JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ? GROUP BY p.vendor_id ORDER BY p.vendor_id'
    );
    $stmt->execute([$order['id']]);
    $vendors = $stmt->fetchAll();
    if (!$vendors) throw new RuntimeException('Cannot settle an order without vendor items.');

    $lineTotals = array_map(fn($row) => (int)round((float)$row['line_total'] * 100), $vendors);
    $lineSum = array_sum($lineTotals);
    $grossPoisha = (int)round((float)$order['total_amount'] * 100);
    $deliveryPoisha = max(0, $grossPoisha - $lineSum);
    $deliveryAllocated = 0;
    foreach ($vendors as $index => $vendor) {
        $gross = $lineTotals[$index];
        if ($index === count($vendors) - 1) {
            $gross += $deliveryPoisha - $deliveryAllocated;
        } elseif ($lineSum > 0) {
            $deliveryShare = (int)round($deliveryPoisha * $lineTotals[$index] / $lineSum);
            $gross += $deliveryShare;
            $deliveryAllocated += $deliveryShare;
        }
        $split = compute_split($gross, (float)$order['advance_percent'], (float)$order['commission_percent']);
        settlement_insert($pdo, 'order', $order['id'], $vendor['vendor_id'], 'vendor', $gross, $split);
    }
    $pdo->prepare("UPDATE orders SET advance_status = 'released' WHERE id = ? AND advance_status = 'held'")
        ->execute([$order['id']]);
}

function settle_preorder(PDO $pdo, array $order): void {
    if ($order['advance_status'] !== 'held') return;
    $gross = (int)round((float)$order['total_amount'] * 100);
    $split = compute_split($gross, (float)$order['advance_percent'], (float)$order['commission_percent']);
    settlement_insert($pdo, 'preorder', $order['id'], $order['vendor_id'], 'vendor', $gross, $split);
    $pdo->prepare("UPDATE preorders SET advance_status = 'released' WHERE id = ? AND advance_status = 'held'")
        ->execute([$order['id']]);
}

function settle_booking(PDO $pdo, array $booking): void {
    if ($booking['advance_status'] !== 'held') return;
    $gross = (int)round((float)$booking['total_price'] * 100);
    $split = compute_split($gross, (float)$booking['advance_percent'], (float)$booking['commission_percent']);
    settlement_insert($pdo, 'guide_booking', $booking['id'], $booking['guide_id'], 'guide', $gross, $split);
    $pdo->prepare("UPDATE guide_bookings SET advance_status = 'released' WHERE id = ? AND advance_status = 'held'")
        ->execute([$booking['id']]);
}
