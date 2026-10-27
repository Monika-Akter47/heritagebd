<?php

function preorder_hydrate(array $row, bool $includeQrCode = false): array {
    $order = [
        'id' => $row['id'], 'orderNumber' => $row['order_number'],
        'touristId' => $row['tourist_id'], 'touristName' => $row['tourist_name'] ?? null, 'touristPhone' => $row['tourist_phone'] ?? null,
        'vendorId' => $row['vendor_id'], 'vendorName' => $row['vendor_name'] ?? null,
        'productId' => $row['product_id'], 'productName' => $row['product_name'] ?? null, 'productImage' => $row['product_image'] ?? null,
        'destination' => $row['destination_name'] ?? null, 'destinationId' => $row['destination_id'],
        'pickupLocation' => $row['pickup_location'], 'pickupDate' => $row['pickup_date'], 'pickupTime' => $row['pickup_time'],
        'quantity' => (int)$row['quantity'], 'unitPrice' => (float)$row['unit_price'], 'totalAmount' => (float)$row['total_amount'],
        'advancePercent' => (int)$row['advance_percent'], 'advancePaid' => (float)$row['advance_paid'],
        'remainingAmount' => (float)$row['remaining_amount'],
        'advancePaymentMethod' => $row['advance_payment_method'], 'pickupPaymentMethod' => $row['pickup_payment_method'],
        'advancePayerPhone' => $row['advance_payer_phone'] ?? null, 'advanceTransactionId' => $row['advance_transaction_id'] ?? null,
        'pickupPayerPhone' => $row['pickup_payer_phone'] ?? null, 'pickupTransactionId' => $row['pickup_transaction_id'] ?? null,
        'status' => $row['status'], 'createdAt' => $row['created_at'], 'updatedAt' => $row['updated_at'],
        'preparationTime' => $row['preparation_time'], 'notes' => $row['notes'],
        'cancellationReason' => $row['cancellation_reason'], 'refundAmount' => $row['refund_amount'] !== null ? (float)$row['refund_amount'] : null,
        'advanceStatus' => $row['advance_status'] ?? null, 'refundMethod' => $row['refund_method'] ?? null,
        'refundTransactionId' => $row['refund_transaction_id'] ?? null, 'refundedAt' => $row['refunded_at'] ?? null,
    ];
    if ($includeQrCode) {
        $order['qrCode'] = $row['qr_code'];
        $order['pickupCode'] = preorder_pickup_code($row['qr_code']);
    }
    return $order;
}

/** Short code the tourist reads out at pickup: the last 8 characters of the QR text, upper-case. */
function preorder_pickup_code(string $qrCode): string {
    return strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $qrCode), -8));
}

function preorder_select_sql(): string {
    return "SELECT po.*, u.name AS tourist_name, u.phone AS tourist_phone,
                   vu.name AS vendor_name, p.name AS product_name,
                   (SELECT url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) AS product_image,
                   hp.name AS destination_name
            FROM preorders po
            JOIN users u ON u.id = po.tourist_id
            JOIN vendors v ON v.user_id = po.vendor_id
            JOIN users vu ON vu.id = v.user_id
            JOIN products p ON p.id = po.product_id
            LEFT JOIN heritage_places hp ON hp.id = po.destination_id";
}

function preorders_settings(PDO $pdo): void {
    $row = $pdo->query('SELECT * FROM preorder_settings WHERE id = 1')->fetch();
    $commission = get_setting($pdo, 'preorder');
    if (!$row) {
        json_ok([
            'advancePercent' => $commission['advancePercent'], 'paymentMethods' => ['bkash', 'nagad', 'card'],
            'cancellationWindowHours' => 2, 'advanceRefundPercent' => 80,
            'vendorPreparationCutoffMinutes' => 30, 'maxPickupTimeSlots' => 6, 'allowCashAtPickup' => true,
        ]);
    }
    json_ok([
        'advancePercent' => $commission['advancePercent'],
        'paymentMethods' => json_decode($row['payment_methods'] ?? '["bkash","nagad","card"]', true),
        'cancellationWindowHours' => (int)$row['cancellation_window_hours'],
        'advanceRefundPercent' => (int)$row['advance_refund_percent'],
        'vendorPreparationCutoffMinutes' => (int)$row['vendor_preparation_cutoff_minutes'],
        'maxPickupTimeSlots' => (int)$row['max_pickup_time_slots'],
        'allowCashAtPickup' => (bool)$row['allow_cash_at_pickup'],
    ]);
}

function preorders_settings_update(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $d = body();

    $intIn = fn(string $key, int $min, int $max) => !array_key_exists($key, $d)
        || (is_numeric($d[$key]) && (int)$d[$key] == $d[$key] && (int)$d[$key] >= $min && (int)$d[$key] <= $max);
    if (!$intIn('advanceRefundPercent', 0, 100)) json_error('The advance refund must be a whole percentage from 0 to 100.', 422);
    if (!$intIn('cancellationWindowHours', 0, 720)) json_error('The cancellation window must be 0–720 hours.', 422);
    if (!$intIn('vendorPreparationCutoffMinutes', 0, 1440)) json_error('The preparation cut-off must be 0–1440 minutes.', 422);
    if (!$intIn('maxPickupTimeSlots', 1, 24)) json_error('Allow between 1 and 24 pickup time slots.', 422);
    if (isset($d['paymentMethods']) && (!is_array($d['paymentMethods']) || !$d['paymentMethods']
        || array_diff($d['paymentMethods'], ['bkash', 'nagad', 'card', 'cash']))) {
        json_error('Payment methods must be chosen from bKash, Nagad, card and cash.', 422);
    }

    $existing = $pdo->query('SELECT * FROM preorder_settings WHERE id = 1')->fetch();
    $merged = [
        'payment_methods' => isset($d['paymentMethods']) ? json_encode(array_values($d['paymentMethods'])) : ($existing['payment_methods'] ?? '["bkash","nagad","card"]'),
        'cancellation_window_hours' => $d['cancellationWindowHours'] ?? ($existing['cancellation_window_hours'] ?? 2),
        'advance_refund_percent' => $d['advanceRefundPercent'] ?? ($existing['advance_refund_percent'] ?? 80),
        'vendor_preparation_cutoff_minutes' => $d['vendorPreparationCutoffMinutes'] ?? ($existing['vendor_preparation_cutoff_minutes'] ?? 30),
        'max_pickup_time_slots' => $d['maxPickupTimeSlots'] ?? ($existing['max_pickup_time_slots'] ?? 6),
        'allow_cash_at_pickup' => isset($d['allowCashAtPickup']) ? (!empty($d['allowCashAtPickup']) ? 1 : 0) : ($existing['allow_cash_at_pickup'] ?? 1),
    ];

    if ($existing) {
        $pdo->prepare(
            'UPDATE preorder_settings SET payment_methods = ?, cancellation_window_hours = ?,
                advance_refund_percent = ?, vendor_preparation_cutoff_minutes = ?, max_pickup_time_slots = ?, allow_cash_at_pickup = ?
             WHERE id = 1'
        )->execute(array_values($merged));
    } else {
        $pdo->prepare(
            'INSERT INTO preorder_settings (id, advance_percent, payment_methods, cancellation_window_hours, advance_refund_percent, vendor_preparation_cutoff_minutes, max_pickup_time_slots, allow_cash_at_pickup)
             VALUES (1, 30, ?, ?, ?, ?, ?, ?)'
        )->execute(array_values($merged));
    }

    preorders_settings($pdo);
}

function preorders_create(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['tourist']);
    $d = body();
    require_fields($d, ['productId', 'pickupDate', 'pickupTime', 'quantity']);

    $pdo->beginTransaction();
    $p = $pdo->prepare(
        "SELECT p.*, COALESCE(NULLIF(p.pickup_location, ''), v.pickup_location) AS effective_pickup_location
         FROM products p JOIN vendors v ON v.user_id = p.vendor_id
         JOIN users u ON u.id = v.user_id
         WHERE p.id = ? AND v.verification_status = 'verified' AND u.verified = 1 AND u.status = 'active'
         FOR UPDATE"
    );
    $p->execute([$d['productId']]);
    $product = $p->fetch();
    if (!$product) {
        $pdo->rollBack();
        json_error('Product not found.', 404);
    }
    if (!$product['preorder_enabled']) {
        $pdo->rollBack();
        json_error('This product does not support pre-order.', 422);
    }
    if (trim((string)($product['effective_pickup_location'] ?? '')) === '') {
        $pdo->rollBack();
        json_error('The vendor has not configured a pickup location for this product yet.', 422);
    }
    if (!is_numeric($d['quantity']) || (int)$d['quantity'] != $d['quantity'] || (int)$d['quantity'] < 1) {
        $pdo->rollBack();
        json_error('Quantity must be a whole number greater than zero.', 422);
    }
    $qty = (int)$d['quantity'];
    if ((int)$product['stock'] < $qty) {
        $pdo->rollBack();
        json_error('There is not enough stock available for this Ready to Pick order.', 409);
    }
    $unitPrice = (float)$product['price'];
    $total = $unitPrice * $qty;
    $settings = $pdo->query('SELECT payment_methods FROM preorder_settings WHERE id = 1')->fetch();
    $commission = get_setting($pdo, 'preorder');
    $advancePercent = $commission['advancePercent'];
    $commissionPercent = $commission['commissionPercent'];
    $paymentMethods = json_decode($settings['payment_methods'] ?? '["bkash","nagad","card"]', true);
    if (!is_array($paymentMethods)) $paymentMethods = ['bkash', 'nagad', 'card'];
    $paymentMethod = $d['advancePaymentMethod'] ?? null;
    if ($paymentMethod !== null && !in_array($paymentMethod, $paymentMethods, true)) {
        $pdo->rollBack();
        json_error('That advance payment method is not available.', 422);
    }
    $split = compute_split((int)round($total * 100), $advancePercent, $commissionPercent);
    if ($paymentMethod === null) $paymentMethod = 'bkash';
    [$advancePhone, $advanceTxn] = payment_proof($d, $paymentMethod, 'advance');
    if (!collect_advance($paymentMethod, $split['advance'])) {
        $pdo->rollBack();
        json_error('The advance payment could not be collected.', 402);
    }
    $advancePaid = $split['advance'] / 100;
    $remaining = $split['cash'] / 100;

    $id = id_with_prefix('po');
    $orderNumber = 'HB' . date('ymd') . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));
    $qrCode = 'HERITAGEBD-PREORDER-' . $id;

    $pdo->prepare(
        'INSERT INTO preorders (id, order_number, tourist_id, vendor_id, product_id, destination_id, pickup_location,
                                 pickup_date, pickup_time, quantity, unit_price, total_amount, advance_percent, advance_paid,
                                 remaining_amount, advance_payment_method, advance_payer_phone, advance_transaction_id,
                                 commission_percent, advance_status, status, qr_code, preparation_time, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $id, $orderNumber, $user['id'], $product['vendor_id'], $product['id'], $d['destinationId'] ?? null,
        $product['effective_pickup_location'], $d['pickupDate'], $d['pickupTime'], $qty, $unitPrice, $total,
        $advancePercent, $advancePaid, $remaining, $paymentMethod, $advancePhone, $advanceTxn, $commissionPercent, 'held',
        'advance_paid', $qrCode, $product['preparation_time'], $d['notes'] ?? null,
    ]);
    $decrement = $pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');
    $decrement->execute([$qty, $product['id'], $qty]);
    if ($decrement->rowCount() !== 1) {
        $pdo->rollBack();
        json_error('Stock changed while placing the order. Please review the available quantity and try again.', 409);
    }
    $pdo->commit();

    notify($pdo, $product['vendor_id'], 'New pre-order', "New pre-order for {$product['name']} - pickup on {$d['pickupDate']}.", 'order', '/vendor?tab=preorders');

    $stmt = $pdo->prepare(preorder_select_sql() . ' WHERE po.id = ?');
    $stmt->execute([$id]);
    json_ok(preorder_hydrate($stmt->fetch(), true), 201);
}

function preorders_index(PDO $pdo): void {
    $user = require_auth($pdo);
    if ($user['role'] === 'vendor') {
        $stmt = $pdo->prepare(preorder_select_sql() . ' WHERE po.vendor_id = ?
            ORDER BY CASE WHEN po.status IN (\'completed\', \'cancelled\', \'refund_pending\', \'refunded\') THEN 1 ELSE 0 END,
                     po.pickup_date, po.created_at');
    } elseif ($user['role'] === 'admin') {
        $stmt = $pdo->prepare(preorder_select_sql() . ' ORDER BY po.created_at DESC');
    } else {
        $stmt = $pdo->prepare(preorder_select_sql() . ' WHERE po.tourist_id = ? ORDER BY po.created_at DESC');
    }
    $stmt->execute($user['role'] === 'admin' ? [] : [$user['id']]);
    $includeQrCode = $user['role'] === 'tourist';
    json_ok(array_map(fn($row) => preorder_hydrate($row, $includeQrCode), $stmt->fetchAll()));
}

function preorders_show(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    $stmt = $pdo->prepare(preorder_select_sql() . ' WHERE po.id = ? OR po.order_number = ? LIMIT 1');
    $stmt->execute([$id, $id]);
    $row = $stmt->fetch();
    if (!$row) json_error('Pre-order not found.', 404);
    if (!in_array($user['id'], [$row['tourist_id'], $row['vendor_id']], true) && $user['role'] !== 'admin') json_error('Forbidden.', 403);
    $includeQrCode = $user['role'] === 'tourist' && $user['id'] === $row['tourist_id'];
    json_ok(preorder_hydrate($row, $includeQrCode));
}

// Allowed forward transitions for the pre-order lifecycle. Enforced server-side so
// no party can skip steps (e.g. jump straight to "completed" without QR verification
// and the remaining payment being recorded).
const PREORDER_TRANSITIONS = [
    'confirmed'              => ['advance_paid', 'cancelled'],
    'advance_paid'           => ['vendor_accepted', 'cancelled'],
    'vendor_accepted'        => ['preparing', 'cancelled'],
    'preparing'              => ['ready_for_pickup', 'cancelled'],
    'ready_for_pickup'       => ['arrived', 'cancelled'],
    'arrived'                => ['qr_verified', 'cancelled'],
    'qr_verified'            => ['pickup_payment_pending', 'cancelled'],
    'pickup_payment_pending' => ['picked_up', 'cancelled'],
    'picked_up'              => ['completed'],
    'completed'              => [],
    'cancelled'              => [],
    'refunded'               => [],
];

// States in which the tourist may still cancel: before preparation begins (FR-34).
const PREORDER_TOURIST_CANCELLABLE = ['confirmed', 'advance_paid', 'vendor_accepted'];

// Which role(s) may push the pre-order INTO a given status.
const PREORDER_TRANSITION_ROLES = [
    'vendor_accepted'        => ['vendor', 'admin'],
    'preparing'               => ['vendor', 'admin'],
    'ready_for_pickup'        => ['vendor', 'admin'],
    'arrived'                 => ['tourist', 'vendor', 'admin'],
    'qr_verified'              => ['vendor', 'admin'],
    'pickup_payment_pending'  => ['vendor', 'admin'],
    'picked_up'                => ['vendor', 'admin'],
    'completed'                => ['vendor', 'tourist', 'admin'],
    'cancelled'                => ['tourist', 'vendor', 'admin'],
    'refunded'                 => ['admin'],
];

function preorders_update(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    $stmt = $pdo->prepare('SELECT * FROM preorders WHERE id = ?');
    $stmt->execute([$id]);
    $existing = $stmt->fetch();
    if (!$existing) json_error('Pre-order not found.', 404);
    if (!in_array($user['id'], [$existing['tourist_id'], $existing['vendor_id']], true) && $user['role'] !== 'admin') json_error('Forbidden.', 403);

    $d = body();
    $fields = []; $params = [];

    if (isset($d['status'])) {
        $newStatus = $d['status'];
        $currentStatus = $existing['status'];
        $allowedNext = PREORDER_TRANSITIONS[$currentStatus] ?? [];

        if (in_array($currentStatus, ['completed', 'cancelled', 'refunded'], true)) {
            json_error('Completed, cancelled, or refunded pre-orders cannot be changed.', 409);
        }
        if (!in_array($newStatus, $allowedNext, true)) {
            json_error("Cannot move pre-order from '{$currentStatus}' to '{$newStatus}'.", 422);
        }
        // Tourists mark arrival, cancel, or confirm they received a handed-over order.
        if ($user['role'] === 'tourist' && !in_array($newStatus, ['arrived', 'cancelled', 'completed'], true)) {
            json_error('Tourists may only mark arrival, cancel, or confirm receipt of their own pre-orders.', 403);
        }
        if ($newStatus === 'completed' && $user['role'] !== 'admin'
            && !in_array($user['id'], [$existing['vendor_id'], $existing['tourist_id']], true)) {
            json_error('Only the tourist, the vendor, or an admin can complete this pre-order.', 403);
        }
        $allowedRoles = PREORDER_TRANSITION_ROLES[$newStatus] ?? [];
        if ($allowedRoles && !in_array($user['role'], $allowedRoles, true)) {
            json_error('You are not allowed to make this status change.', 403);
        }

        // QR must actually match before we allow verification.
        // The tourist shows either the full QR text or the short pickup code (its last 8 characters);
        // vendors never receive the code, so typing it proves the tourist is present.
        if ($newStatus === 'qr_verified') {
            $given = strtoupper(preg_replace('/[\s-]+/', '', (string)($d['qrCode'] ?? '')));
            $full = strtoupper(preg_replace('/[\s-]+/', '', $existing['qr_code']));
            if ($given === '' || (!hash_equals($full, $given) && !hash_equals(preorder_pickup_code($existing['qr_code']), $given))) {
                json_error('That code does not match this order. Ask the tourist for the 8-character pickup code on their QR screen.', 422);
            }
        }

        // Record the final payment when the vendor confirms handover.
        if ($newStatus === 'picked_up') {
            if (!in_array($user['role'], ['vendor', 'admin'], true)) {
                json_error('Only the vendor can confirm the order handover.', 403);
            }
            $pickupMethod = $d['pickupPaymentMethod'] ?? $existing['pickup_payment_method'];
            if (!is_string($pickupMethod) || !in_array($pickupMethod, ['bkash', 'nagad', 'card', 'cash'], true)) {
                json_error('Choose a valid pickup payment method: bKash, Nagad, card, or cash.', 422);
            }
            if ($currentStatus !== 'pickup_payment_pending' || (float)$existing['remaining_amount'] <= 0) {
                json_error('Record the final payment before marking this order as picked up.', 422);
            }
            [$pickupPhone, $pickupTxn] = payment_proof($d, $pickupMethod, 'pickup');
            $fields[] = 'pickup_payment_method = ?'; $params[] = $pickupMethod;
            $fields[] = 'pickup_payer_phone = ?'; $params[] = $pickupPhone;
            $fields[] = 'pickup_transaction_id = ?'; $params[] = $pickupTxn;
            $fields[] = 'remaining_amount = 0';
        }

        // Cancellation needs a reason on file.
        if ($newStatus === 'cancelled' && empty($d['cancellationReason']) && empty($existing['cancellation_reason'])) {
            json_error('A cancellation reason is required.', 422);
        }

        // FR-34: a tourist may cancel only before the vendor starts preparing, and gets back the
        // administrator-configured share of the advance. A vendor or admin cancelling refunds it all.
        if ($newStatus === 'cancelled') {
            if ($user['role'] === 'tourist' && !in_array($currentStatus, PREORDER_TOURIST_CANCELLABLE, true)) {
                json_error('This pre-order can no longer be cancelled: the vendor has started preparing it.', 409);
            }
            $refundPercent = $user['role'] === 'tourist'
                ? (int)($pdo->query('SELECT advance_refund_percent FROM preorder_settings WHERE id = 1')->fetchColumn() ?: 80)
                : 100;
            $fields[] = 'refund_amount = ?';
            $params[] = round((float)$existing['advance_paid'] * $refundPercent / 100, 2);
            unset($d['refundAmount']);   // computed here, not taken from the client
        }

        $fields[] = 'status = ?'; $params[] = $newStatus;
    }

    // Only an admin may set a refund amount by hand; otherwise it is computed on cancellation above.
    $map = ['cancellationReason' => 'cancellation_reason', 'notes' => 'notes']
        + ($user['role'] === 'admin' ? ['refundAmount' => 'refund_amount'] : []);
    foreach ($map as $k => $col) {
        if (array_key_exists($k, $d)) { $fields[] = "$col = ?"; $params[] = $d[$k]; }
    }
    if (array_key_exists('pickupPaymentMethod', $d)) {
        if (!isset($d['status']) || $d['status'] !== 'picked_up') {
            json_error('Pickup payment method can only be recorded when confirming the final payment.', 422);
        }
    }

    if ($fields) {
        $pdo->beginTransaction();
        $locked = $pdo->prepare('SELECT * FROM preorders WHERE id = ? FOR UPDATE');
        $locked->execute([$id]);
        $lockedOrder = $locked->fetch();
        if (!$lockedOrder || $lockedOrder['status'] !== $existing['status']) {
            $pdo->rollBack();
            json_error('This pre-order was updated by someone else. Refresh and try again.', 409);
        }
        $params[] = $id;
        $pdo->prepare('UPDATE preorders SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        if (($d['status'] ?? null) === 'completed') {
            settle_preorder($pdo, $lockedOrder);
        } elseif (in_array($d['status'] ?? null, ['cancelled', 'refunded'], true)) {
            // A tourist's own cancellation refunds the configured share straight away. When the vendor
            // (or an admin) cancels a paid pre-order, the advance waits until an admin sends it back.
            $pending = $d['status'] === 'cancelled' && $user['role'] !== 'tourist' && (float)$existing['advance_paid'] > 0;
            $pdo->prepare('UPDATE preorders SET advance_status = ? WHERE id = ? AND advance_status = \'held\'')
                ->execute([$pending ? 'refund_pending' : 'refunded', $id]);
            if ($pending) {
                notify_admins($pdo, 'Refund needed',
                    "Pre-order {$existing['order_number']} was cancelled by the vendor. Send the tourist's advance back.",
                    'order', '/admin?section=payments');
            }
        }
        if (($d['status'] ?? null) === 'cancelled') {
            $pdo->prepare('UPDATE products SET stock = stock + ? WHERE id = ?')
                ->execute([(int)$existing['quantity'], $existing['product_id']]);
        }
        $pdo->commit();
    }

    if (isset($d['status'])) {
        $notifyId = $user['id'] === $existing['tourist_id'] ? $existing['vendor_id'] : $existing['tourist_id'];
        notify($pdo, $notifyId, 'Pre-order update', "Pre-order {$existing['order_number']} status: {$d['status']}", 'order', '/preorder/tracking/' . $id);
    }

    $stmt = $pdo->prepare(preorder_select_sql() . ' WHERE po.id = ?');
    $stmt->execute([$id]);
    json_ok(preorder_hydrate($stmt->fetch()));
}
