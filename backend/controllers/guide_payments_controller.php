<?php

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

function guide_payments_report(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['tourist']);
    $d = body();
    require_fields($d, ['bookingId', 'method']);
    if (!is_string($d['bookingId']) || !is_string($d['method'])
        || !in_array($d['method'], ['cash', 'bkash', 'nagad'], true)) {
        json_error('Choose cash, bKash, or Nagad for this payment.', 422);
    }
    if (isset($d['reference']) && (!is_string($d['reference']) || mb_strlen(trim($d['reference'])) > 120)) {
        json_error('Payment reference must be 120 characters or fewer.', 422);
    }

    $pdo->beginTransaction();
    try {
        $bookingStmt = $pdo->prepare('SELECT * FROM guide_bookings WHERE id = ? FOR UPDATE');
        $bookingStmt->execute([$d['bookingId']]);
        $booking = $bookingStmt->fetch();
        if (!$booking || $booking['tourist_id'] !== $user['id']) {
            $pdo->rollBack();
            json_error('Guide booking not found.', 404);
        }
        if ($booking['status'] !== 'completed') {
            $pdo->rollBack();
            json_error('Payment can be reported after the tour is marked completed.', 409);
        }

        $paymentStmt = $pdo->prepare('SELECT * FROM guide_payments WHERE booking_id = ? FOR UPDATE');
        $paymentStmt->execute([$booking['id']]);
        $payment = $paymentStmt->fetch();
        if ($payment && $payment['status'] === 'confirmed') {
            $pdo->rollBack();
            json_error('The guide has already confirmed full payment for this booking.', 409);
        }

        if ($payment) {
            $pdo->prepare(
                "UPDATE guide_payments
                 SET method = ?, reference = ?, status = 'reported', reported_at = NOW(), confirmed_at = NULL
                 WHERE id = ?"
            )->execute([$d['method'], trim((string)($d['reference'] ?? '')) ?: null, $payment['id']]);
            $paymentId = $payment['id'];
        } else {
            $paymentId = id_with_prefix('gp');
            $pdo->prepare(
                'INSERT INTO guide_payments (id, booking_id, amount, method, reference, status, reported_at)
                 VALUES (?, ?, ?, ?, ?, "reported", NOW())'
            )->execute([
                $paymentId, $booking['id'], $booking['total_price'], $d['method'],
                trim((string)($d['reference'] ?? '')) ?: null,
            ]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    notify($pdo, $booking['guide_id'], 'Tour payment reported',
        $user['name'] . ' reported full payment of ৳' . number_format((float)$booking['total_price'], 2)
            . ' for a completed tour. Please confirm receipt.',
        'booking', '/guide-dashboard#bookings');

    $stmt = $pdo->prepare(guide_payment_select_sql() . ' WHERE p.id = ?');
    $stmt->execute([$paymentId]);
    json_ok(guide_payment_hydrate($stmt->fetch()), 201);
}

function guide_payments_confirm(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    require_role($user, ['guide']);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            guide_payment_select_sql() . ' WHERE p.id = ? FOR UPDATE'
        );
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
        $pdo->prepare("UPDATE guide_payments SET status = 'confirmed', confirmed_at = NOW() WHERE id = ?")
            ->execute([$id]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    notify($pdo, $payment['tourist_id'], 'Guide confirmed payment',
        $user['name'] . ' confirmed receipt of your full tour payment of ৳' . number_format((float)$payment['amount'], 2) . '.',
        'booking', '/profile');

    $stmt = $pdo->prepare(guide_payment_select_sql() . ' WHERE p.id = ?');
    $stmt->execute([$id]);
    json_ok(guide_payment_hydrate($stmt->fetch()));
}
