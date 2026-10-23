<?php

function booking_hydrate(PDO $pdo, array $row): array {
    $dest = $pdo->prepare('SELECT place_name FROM guide_booking_destinations WHERE booking_id = ?');
    $dest->execute([$row['id']]);
    $who = $pdo->prepare('SELECT t.name tname, t.avatar tavatar, g.name gname FROM users t, users g WHERE t.id = ? AND g.id = ?');
    $who->execute([$row['tourist_id'], $row['guide_id']]);
    $w = $who->fetch() ?: [];
    return [
        'touristName' => $w['tname'] ?? null, 'touristAvatar' => $w['tavatar'] ?? null, 'guideName' => $w['gname'] ?? null,
        'id' => $row['id'], 'guideId' => $row['guide_id'], 'touristId' => $row['tourist_id'],
        'tourType' => $row['tour_type'], 'startDate' => $row['start_date'], 'endDate' => $row['end_date'],
        'status' => $row['status'], 'message' => $row['message'], 'totalPrice' => (float)$row['total_price'],
        'advancePercent' => (float)$row['advance_percent'], 'commissionPercent' => (float)$row['commission_percent'],
        'advanceAmount' => (float)$row['advance_amount'], 'balanceAmount' => (float)$row['balance_amount'],
        'advanceStatus' => $row['advance_status'],
        'groupSize' => (int)$row['group_size'], 'createdAt' => $row['created_at'],
        'destinations' => array_column($dest->fetchAll(), 'place_name'),
    ];
}

function bookings_create(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['tourist']);
    $d = body();
    require_fields($d, ['guideId', 'tourType', 'startDate', 'endDate']);

    $start = is_string($d['startDate']) ? DateTime::createFromFormat('!Y-m-d', $d['startDate']) : false;
    $end = is_string($d['endDate']) ? DateTime::createFromFormat('!Y-m-d', $d['endDate']) : false;
    if (!$start || !$end || $start->format('Y-m-d') !== $d['startDate'] || $end->format('Y-m-d') !== $d['endDate']
        || $d['startDate'] < date('Y-m-d')
        || $d['endDate'] < $d['startDate']) {
        json_error('Enter valid future dates. The end date cannot be before the start date.', 422);
    }
    if (!is_string($d['tourType']) || trim($d['tourType']) === '') json_error('Choose a guide service.', 422);
    if (isset($d['message']) && (!is_string($d['message']) || mb_strlen(trim($d['message'])) > 2000)) {
        json_error('Your message must be 2,000 characters or fewer.', 422);
    }

    $pdo->beginTransaction();
    try {
        $guideStmt = $pdo->prepare(
            "SELECT g.price_per_day, g.is_available
             FROM guides g JOIN users u ON u.id = g.user_id
             WHERE g.user_id = ? AND g.verification_status = 'verified'
               AND u.verified = 1 AND u.status = 'active'
               AND g.bio IS NOT NULL AND TRIM(g.bio) <> ''
               AND g.location IS NOT NULL AND TRIM(g.location) <> '' AND g.price_per_day > 0
               AND EXISTS (SELECT 1 FROM guide_tour_types gt WHERE gt.guide_id = g.user_id AND gt.price > 0)
             FOR UPDATE"
        );
        $guideStmt->execute([$d['guideId']]);
        $guide = $guideStmt->fetch();
        if (!$guide) json_error('This guide is not approved for bookings.', 403);
        if (!(bool)$guide['is_available']) json_error('This guide is not currently accepting bookings.', 409);

        $tourStmt = $pdo->prepare('SELECT price FROM guide_tour_types WHERE guide_id = ? AND name = ? LIMIT 1');
        $tourStmt->execute([$d['guideId'], trim((string)$d['tourType'])]);
        $tourPrice = $tourStmt->fetchColumn();
        if ($tourPrice === false) {
            $tourPrice = (float)$guide['price_per_day']
                * ((new DateTime($d['endDate']))->diff(new DateTime($d['startDate']))->days + 1);
        } else {
            $tourPrice = (float)$tourPrice;
        }
        if ($tourPrice <= 0) json_error('The selected tour must have a price greater than zero.', 422);
        // TODO: Derive the booking price exclusively from guide_tour_types and validate the selected service duration.
        $setting = get_setting($pdo, 'guide_booking');
        $split = compute_split((int)round($tourPrice * 100), $setting['advancePercent'], $setting['commissionPercent']);
        $paymentMethod = $d['paymentMethod'] ?? 'bkash';
        if (!is_string($paymentMethod) || !in_array($paymentMethod, ['bkash', 'nagad', 'card'], true)) {
            $pdo->rollBack();
            json_error('Choose bKash, Nagad, or card for the online advance payment.', 422);
        }
        $overlap = $pdo->prepare(
            "SELECT 1 FROM guide_bookings
             WHERE guide_id = ? AND status IN ('pending','accepted','awaiting_confirmation')
               AND start_date <= ? AND end_date >= ? LIMIT 1"
        );
        $overlap->execute([$d['guideId'], $d['endDate'], $d['startDate']]);
        if ($overlap->fetchColumn()) json_error('This guide is not available for the selected dates.', 409);

        if (!collect_advance($paymentMethod, $split['advance'])) {
            $pdo->rollBack();
            json_error('The advance payment could not be collected.', 402);
        }

        $id = id_with_prefix('bk');
        $pdo->prepare(
            'INSERT INTO guide_bookings (id, guide_id, tourist_id, tour_type, start_date, end_date, message, total_price, group_size,
                                         advance_percent, commission_percent, advance_amount, balance_amount, advance_status)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
        )->execute([
            $id, $d['guideId'], $user['id'], trim((string)$d['tourType']), $d['startDate'], $d['endDate'],
            $d['message'] ?? null, $tourPrice, max(1, (int)($d['groupSize'] ?? 1)),
            $setting['advancePercent'], $setting['commissionPercent'], $split['advance'] / 100, $split['cash'] / 100, 'held',
        ]);
        foreach ((array)($d['destinations'] ?? []) as $dest) {
            $pdo->prepare('INSERT INTO guide_booking_destinations (booking_id, place_name) VALUES (?, ?)')->execute([$id, $dest]);
        }
        $conversationId = conversation_for_users($pdo, $user['id'], $d['guideId']);
        $chatMessage = trim((string)($d['message'] ?? ''));
        if ($chatMessage === '') {
            $chatMessage = 'I sent you a booking request for ' . trim($d['tourType']) . ' from '
                . $d['startDate'] . ' to ' . $d['endDate'] . '.';
        }
        $messageId = id_with_prefix('msg');
        $pdo->prepare('INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?,?,?,?)')
            ->execute([$messageId, $conversationId, $user['id'], $chatMessage]);
        $pdo->prepare('UPDATE conversations SET last_message = ?, last_message_at = NOW() WHERE id = ?')
            ->execute([mb_substr($chatMessage, 0, 200), $conversationId]);
        $pdo->prepare('UPDATE conversation_participants SET unread_count = unread_count + 1 WHERE conversation_id = ? AND user_id = ?')
            ->execute([$conversationId, $d['guideId']]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    notify($pdo, guide_owner_user_id($pdo, $d['guideId']), 'New tour booking request',
        $user['name'] . ' requested a ' . $d['tourType'] . ' booking.', 'booking', '/guide-dashboard#bookings');

    $stmt = $pdo->prepare('SELECT * FROM guide_bookings WHERE id = ?');
    $stmt->execute([$id]);
    json_ok(booking_hydrate($pdo, $stmt->fetch()), 201);
}

function guide_owner_user_id(PDO $pdo, string $guideId): string {
    return $guideId; // guides.user_id === guide id
}

function bookings_index(PDO $pdo): void {
    $user = require_auth($pdo);
    if ($user['role'] === 'admin') {
        $stmt = $pdo->prepare('SELECT * FROM guide_bookings WHERE ? IS NOT NULL ORDER BY created_at DESC LIMIT 300');
    } elseif ($user['role'] === 'guide') {
        $stmt = $pdo->prepare('SELECT * FROM guide_bookings WHERE guide_id = ? ORDER BY created_at DESC');
    } else {
        $stmt = $pdo->prepare('SELECT * FROM guide_bookings WHERE tourist_id = ? ORDER BY created_at DESC');
    }
    $stmt->execute([$user['id']]);
    json_ok(array_map(fn($r) => booking_hydrate($pdo, $r), $stmt->fetchAll()));
}

function bookings_update(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    $d = body();
    require_fields($d, ['status']);
    if (!is_string($d['status']) || !in_array($d['status'], ['accepted', 'rejected', 'awaiting_confirmation', 'completed', 'cancelled'], true)) {
        json_error('Invalid booking status.', 422);
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT * FROM guide_bookings WHERE id = ? FOR UPDATE');
    $stmt->execute([$id]);
    $booking = $stmt->fetch();
    if (!$booking) {
        $pdo->rollBack();
        json_error('Booking not found.', 404);
    }
    if ($user['id'] !== $booking['guide_id'] && $user['id'] !== $booking['tourist_id'] && $user['role'] !== 'admin') {
        $pdo->rollBack();
        json_error('Forbidden.', 403);
    }
    $isAdmin = $user['role'] === 'admin';
    $isGuide = $user['role'] === 'guide' && $user['id'] === $booking['guide_id'];
    $isTourist = $user['role'] === 'tourist' && $user['id'] === $booking['tourist_id'];
    if (!$isAdmin && !$isGuide && !$isTourist) {
        $pdo->rollBack();
        json_error('Forbidden.', 403);
    }
    if (in_array($booking['status'], ['completed', 'cancelled', 'rejected'], true)) {
        $pdo->rollBack();
        json_error('Completed, cancelled, or rejected bookings cannot be changed.', 409);
    }
    $transitions = [
        'pending' => ['accepted', 'rejected', 'cancelled'],
        'accepted' => ['awaiting_confirmation', 'cancelled'],
        'awaiting_confirmation' => ['completed'],
    ];
    $allowed = $transitions[$booking['status']] ?? [];
    if ($isAdmin && in_array($d['status'], ['completed', 'rejected', 'cancelled'], true)) {
        $allowed[] = $d['status'];
    }
    if (!$isAdmin && $isGuide) {
        $allowed = $booking['status'] === 'pending'
            ? ['accepted', 'rejected']
            : ($booking['status'] === 'accepted' ? ['awaiting_confirmation', 'cancelled'] : []);
    } elseif (!$isAdmin && $isTourist) {
        $allowed = $booking['status'] === 'awaiting_confirmation'
            ? ['completed']
            : (in_array($booking['status'], ['pending', 'accepted'], true) ? ['cancelled'] : []);
    }
    if (!in_array($d['status'], $allowed, true)) {
        $pdo->rollBack();
        json_error('That booking status change is not allowed.', 422);
    }

    if ($d['status'] === 'accepted') {
        $guide = $pdo->prepare(
            "SELECT g.user_id FROM guides g JOIN users u ON u.id = g.user_id
             WHERE g.user_id = ? AND g.verification_status = 'verified'
               AND u.verified = 1 AND u.status = 'active' FOR UPDATE"
        );
        $guide->execute([$booking['guide_id']]);
        if (!$guide->fetchColumn()) {
            $pdo->rollBack();
            json_error('This guide is no longer approved for bookings.', 409);
        }
        $conflict = $pdo->prepare(
            "SELECT 1 FROM guide_bookings
             WHERE guide_id = ? AND id != ? AND status IN ('accepted','awaiting_confirmation')
               AND start_date <= ? AND end_date >= ? LIMIT 1"
        );
        $conflict->execute([$booking['guide_id'], $id, $booking['end_date'], $booking['start_date']]);
        if ($conflict->fetchColumn()) {
            $pdo->rollBack();
            json_error('This booking conflicts with another accepted booking.', 409);
        }
    }

    if ($d['status'] === 'awaiting_confirmation' && $booking['end_date'] > date('Y-m-d')) {
        $pdo->rollBack();
        json_error('A tour can only be marked finished after its final day.', 422);
    }
    if ($d['status'] === 'completed' && !$isAdmin && $booking['end_date'] > date('Y-m-d')) {
        $pdo->rollBack();
        json_error('A tour can only be confirmed after its final day.', 422);
    }

    $pdo->prepare('UPDATE guide_bookings SET status = ? WHERE id = ?')->execute([$d['status'], $id]);
    if ($d['status'] === 'completed') {
        $sharedPlan = $pdo->prepare(
            "SELECT id, status FROM trip_plans
             WHERE user_id = ? AND guide_id = ? AND guide_response = 'accepted'
               AND start_date = ? AND end_date = ?
             ORDER BY created_at DESC LIMIT 1 FOR UPDATE"
        );
        $sharedPlan->execute([
            $booking['tourist_id'], $booking['guide_id'], $booking['start_date'], $booking['end_date'],
        ]);
        $plan = $sharedPlan->fetch();
        if ($plan && $plan['status'] !== 'completed') {
            $pdo->prepare("UPDATE trip_plans SET status = 'completed' WHERE id = ?")->execute([$plan['id']]);
        }
        if (!$plan || $plan['status'] !== 'completed') {
            $pdo->prepare('UPDATE guides SET tours_completed = tours_completed + 1 WHERE user_id = ?')
                ->execute([$booking['guide_id']]);
        }
        settle_booking($pdo, $booking);
    } elseif (in_array($d['status'], ['rejected', 'cancelled'], true)) {
        $pdo->prepare("UPDATE guide_bookings SET advance_status = 'refunded' WHERE id = ? AND advance_status = 'held'")
            ->execute([$id]);
    }
    $pdo->commit();

    $participants = [
        [$booking['tourist_id'], '/profile?tab=trips'],
        [$booking['guide_id'], '/guide-dashboard#bookings'],
    ];
    foreach ($participants as [$participantId, $notificationLink]) {
        if ($participantId !== $user['id'] || $isAdmin) {
            notify($pdo, $participantId, 'Booking update', "Your booking is now: {$d['status']}", 'booking', $notificationLink);
        }
    }

    $stmt = $pdo->prepare('SELECT * FROM guide_bookings WHERE id = ?');
    $stmt->execute([$id]);
    json_ok(booking_hydrate($pdo, $stmt->fetch()));
}
