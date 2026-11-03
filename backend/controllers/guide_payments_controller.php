<?php

// The balance of a guide booking (total minus the online advance) is paid to the guide directly,
// usually in cash at the end of the tour. Either side can record it:
//   - the tourist reports it ('reported'), and the guide confirms receipt ('confirmed');
//   - or the guide records it directly, which counts as confirmed at once.
// Only confirmed payments count as "cash received" in the guide's earnings.

const GUIDE_PAYMENT_BOOKING_STATUSES = ['awaiting_confirmation', 'completed'];

/**
 * 6-character code the tourist reads out when paying the guide in cash, like the pre-order pickup code.
 * Only the tourist is shown it, so a guide who types it proves the tourist was there and agreed.
 */
function booking_payment_code(string $bookingId): string {
    $salt = getenv('DB_PASS') ?: 'heritagebd-guide-payment';
    return strtoupper(substr(hash_hmac('sha256', 'guide-payment|' . $bookingId, $salt), 0, 6));
}

function guide_payment_require_code(array $d, string $bookingId): void {
    $given = strtoupper(preg_replace('/[\s-]+/', '', (string)($d['verificationCode'] ?? '')));
    if ($given === '' || !hash_equals(booking_payment_code($bookingId), $given)) {
        json_error("That code does not match. Ask the tourist for the 6-character payment code shown on their booking.", 422);
    }
}

function guide_payment_hydrate(array $row): array {
    return [
        'id' => $row['id'],
        'bookingId' => $row['booking_id'],
        'guideId' => $row['guide_id'],
        'touristId' => $row['tourist_id'],
        'guideName' => $row['guide_name'],
        'touristName' => $row['tourist_name'],
        'tourType' => $row['tour_type'],
        'startDate' => $row['start_date'],
        'endDate' => $row['end_date'],
        'amount' => (float)$row['amount'],
        'method' => $row['method'],
        'reference' => $row['reference'],
        'payerPhone' => $row['payer_phone'] ?? null,
        'recordedBy' => $row['recorded_by'] ?? 'tourist',
        'status' => $row['status'],
        'reportedAt' => $row['reported_at'],
        'confirmedAt' => $row['confirmed_at'],
    ];
}

function guide_payment_select_sql(): string {
    return 'SELECT p.*, b.guide_id, b.tourist_id, b.tour_type, b.start_date, b.end_date,
                   guide.name AS guide_name, tourist.name AS tourist_name
            FROM guide_payments p
            JOIN guide_bookings b ON b.id = p.booking_id
            JOIN users guide ON guide.id = b.guide_id
            JOIN users tourist ON tourist.id = b.tourist_id';
}

function guide_payments_index(PDO $pdo): void {
    $user = require_auth($pdo);
    if ($user['role'] === 'admin') {
        $stmt = $pdo->query(guide_payment_select_sql() . ' ORDER BY p.reported_at DESC LIMIT 500');
    } elseif ($user['role'] === 'guide') {
        $stmt = $pdo->prepare(guide_payment_select_sql() . ' WHERE b.guide_id = ? ORDER BY p.reported_at DESC');
        $stmt->execute([$user['id']]);
    } elseif ($user['role'] === 'tourist') {
        $stmt = $pdo->prepare(guide_payment_select_sql() . ' WHERE b.tourist_id = ? ORDER BY p.reported_at DESC');
        $stmt->execute([$user['id']]);
    } else {
        json_error('Only tourists, guides, and admins can view guide payments.', 403);
    }
    json_ok(array_map('guide_payment_hydrate', $stmt->fetchAll()));
}

/** POST /guide-payments — the tourist reports the payment, or the guide records it as received. */
function guide_payments_report(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['tourist', 'guide']);
    $byGuide = $user['role'] === 'guide';
    $d = body();
    require_fields($d, ['bookingId', 'method']);
    if (!is_string($d['bookingId']) || !is_string($d['method'])
        || !in_array($d['method'], ['cash', 'bkash', 'nagad'], true)) {
        json_error('Choose cash, bKash, or Nagad for this payment.', 422);
    }
    // Wallet payments need the sender number and TrxID so the other side can check them.
    [$payerPhone, $reference] = payment_proof(
        ['payPayerPhone' => $d['payerPhone'] ?? '', 'payTransactionId' => $d['reference'] ?? ''],
        $d['method'], 'pay'
    );
    // Cash leaves no wallet record, so the guide must type the tourist's payment code.
    if ($byGuide && $d['method'] === 'cash') guide_payment_require_code($d, $d['bookingId']);

    $pdo->beginTransaction();
    try {
        $bookingStmt = $pdo->prepare('SELECT * FROM guide_bookings WHERE id = ? FOR UPDATE');
        $bookingStmt->execute([$d['bookingId']]);
        $booking = $bookingStmt->fetch();
        $owner = $byGuide ? $booking['guide_id'] ?? null : $booking['tourist_id'] ?? null;
        if (!$booking || $owner !== $user['id']) {
            $pdo->rollBack();
            json_error('Guide booking not found.', 404);
        }
        if (!in_array($booking['status'], GUIDE_PAYMENT_BOOKING_STATUSES, true)) {
            $pdo->rollBack();
            json_error('Payment can be recorded once the tour is marked finished.', 409);
        }

        $paymentStmt = $pdo->prepare('SELECT * FROM guide_payments WHERE booking_id = ? FOR UPDATE');
        $paymentStmt->execute([$booking['id']]);
        $payment = $paymentStmt->fetch();
        if ($payment && $payment['status'] === 'confirmed') {
            $pdo->rollBack();
            json_error('The guide has already confirmed this payment.', 409);
        }

        $status = $byGuide ? 'confirmed' : 'reported';
        $recordedBy = $byGuide ? 'guide' : 'tourist';
        $confirmedAt = $byGuide ? date('Y-m-d H:i:s') : null;
        if ($payment) {
            $pdo->prepare(
                'UPDATE guide_payments
                 SET method = ?, reference = ?, payer_phone = ?, status = ?, recorded_by = ?, reported_at = NOW(), confirmed_at = ?
                 WHERE id = ?'
            )->execute([$d['method'], $reference, $payerPhone, $status, $recordedBy, $confirmedAt, $payment['id']]);
            $paymentId = $payment['id'];
        } else {
            $paymentId = id_with_prefix('gp');
            $pdo->prepare(
                'INSERT INTO guide_payments (id, booking_id, amount, method, reference, payer_phone, status, recorded_by, reported_at, confirmed_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)'
            )->execute([
                $paymentId, $booking['id'], $booking['balance_amount'], $d['method'], $reference, $payerPhone,
                $status, $recordedBy, $confirmedAt,
            ]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    $amount = '৳' . number_format((float)$booking['balance_amount'], 2);
    if ($byGuide) {
        notify($pdo, $booking['tourist_id'], 'Guide recorded your payment',
            $user['name'] . " recorded receiving {$amount} ({$d['method']}) for your tour.", 'booking', '/profile');
    } else {
        notify($pdo, $booking['guide_id'], 'Tour payment reported',
            $user['name'] . " reported paying {$amount} ({$d['method']}) for a finished tour. Please confirm receipt.",
            'booking', '/guide-dashboard#bookings');
    }

    $stmt = $pdo->prepare(guide_payment_select_sql() . ' WHERE p.id = ?');
    $stmt->execute([$paymentId]);
    json_ok(guide_payment_hydrate($stmt->fetch()), 201);
}

function guide_payments_confirm(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    require_role($user, ['guide']);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT p.*, b.guide_id, b.tourist_id FROM guide_payments p
                               JOIN guide_bookings b ON b.id = p.booking_id WHERE p.id = ? FOR UPDATE');
        $stmt->execute([$id]);
        $payment = $stmt->fetch();
        if (!$payment || $payment['guide_id'] !== $user['id']) {
            $pdo->rollBack();
            json_error('Payment not found.', 404);
        }
        if ($payment['status'] !== 'reported') {
            $pdo->rollBack();
            json_error('Only a reported payment can be confirmed.', 409);
        }
        if ($payment['method'] === 'cash') {
            $pdo->rollBack();
            guide_payment_require_code(body(), $payment['booking_id']);
            $pdo->beginTransaction();
        }
        $pdo->prepare("UPDATE guide_payments SET status = 'confirmed', confirmed_at = NOW() WHERE id = ? AND status = 'reported'")
            ->execute([$id]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    notify($pdo, $payment['tourist_id'], 'Guide confirmed payment',
        $user['name'] . ' confirmed receiving your tour payment of ৳' . number_format((float)$payment['amount'], 2) . '.',
        'booking', '/profile');

    $stmt = $pdo->prepare(guide_payment_select_sql() . ' WHERE p.id = ?');
    $stmt->execute([$id]);
    json_ok(guide_payment_hydrate($stmt->fetch()));
}
