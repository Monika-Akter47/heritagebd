<?php

function trip_hydrate(PDO $pdo, array $row): array {
    $ownerStmt = $pdo->prepare('SELECT name FROM users WHERE id = ?');
    $ownerStmt->execute([$row['user_id']]);
    $guideStmt = $pdo->prepare('SELECT name FROM users WHERE id = ?');
    $guideStmt->execute([$row['guide_id']]);
    $guideFee = null;
    $guideBookingId = null;
    $guideBookingStatus = null;
    $guideBookingAdvance = null;
    $guideBookingBalance = null;
    if ($row['guide_id']) {
        $feeStmt = $pdo->prepare(
            'SELECT id, status, total_price, advance_amount, balance_amount FROM guide_bookings
             WHERE tourist_id = ? AND guide_id = ? AND start_date = ? AND end_date = ?
             ORDER BY created_at DESC LIMIT 1'
        );
        $feeStmt->execute([$row['user_id'], $row['guide_id'], $row['start_date'], $row['end_date']]);
        $booking = $feeStmt->fetch();
        if ($booking) {
            $guideBookingId = $booking['id'];
            $guideBookingStatus = $booking['status'];
            $guideFee = (float)$booking['total_price'];
            $guideBookingAdvance = (float)$booking['advance_amount'];
            $guideBookingBalance = (float)$booking['balance_amount'];
        } else {
            $rateStmt = $pdo->prepare('SELECT price_per_day FROM guides WHERE user_id = ?');
            $rateStmt->execute([$row['guide_id']]);
            $rate = (float)$rateStmt->fetchColumn();
            if ($rate > 0) {
                $days = (new DateTime($row['start_date']))->diff(new DateTime($row['end_date']))->days + 1;
                $guideFee = $rate * $days;
            }
        }
    }
    $dest = $pdo->prepare('SELECT destination FROM trip_destinations WHERE trip_id = ?'); $dest->execute([$row['id']]);
    $daysStmt = $pdo->prepare('SELECT * FROM trip_days WHERE trip_id = ? ORDER BY sort_order');
    $daysStmt->execute([$row['id']]);
    $days = [];
    foreach ($daysStmt->fetchAll() as $day) {
        $stopsStmt = $pdo->prepare('SELECT * FROM trip_stops WHERE day_id = ? ORDER BY sort_order');
        $stopsStmt->execute([$day['id']]);
        $stops = array_map(fn($s) => [
            'id' => $s['id'], 'placeId' => $s['place_id'], 'placeName' => $s['place_name'],
            'placeImage' => $s['place_image'], 'location' => $s['location'], 'duration' => $s['duration'],
            'notes' => $s['notes'], 'order' => (int)$s['sort_order'],
        ], $stopsStmt->fetchAll());
        $days[] = ['id' => $day['id'], 'date' => $day['day_date'], 'stops' => $stops, 'notes' => $day['notes']];
    }
    return [
        'id' => $row['id'], 'userId' => $row['user_id'], 'ownerName' => $ownerStmt->fetchColumn() ?: null,
        'guideName' => $guideStmt->fetchColumn() ?: null,
        'name' => $row['name'], 'description' => $row['description'],
        'startDate' => $row['start_date'], 'endDate' => $row['end_date'], 'days' => $days,
        'startTime' => $row['start_time'] ? substr($row['start_time'], 0, 5) : null,
        'endTime' => $row['end_time'] ? substr($row['end_time'], 0, 5) : null,
        'destinations' => array_column($dest->fetchAll(), 'destination'),
        'status' => $row['status'], 'guideResponse' => $row['guide_response'],
        'createdAt' => $row['created_at'], 'guideId' => $row['guide_id'],
        'guideFee' => $guideFee, 'guideBookingId' => $guideBookingId, 'guideBookingStatus' => $guideBookingStatus,
        'guideBookingAdvance' => $guideBookingAdvance, 'guideBookingBalance' => $guideBookingBalance,
    ];
}

function trips_index(PDO $pdo): void {
    $user = require_auth($pdo);
    if ($user['role'] === 'admin') {
        $stmt = $pdo->query('SELECT * FROM trip_plans ORDER BY created_at DESC LIMIT 300');
    } elseif ($user['role'] === 'guide') {
        $stmt = $pdo->prepare('SELECT * FROM trip_plans WHERE guide_id = ? AND user_id != ? ORDER BY created_at DESC');
        $stmt->execute([$user['id'], $user['id']]);
    } else {
        $stmt = $pdo->prepare('SELECT * FROM trip_plans WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->execute([$user['id']]);
    }
    json_ok(array_map(fn($r) => trip_hydrate($pdo, $r), $stmt->fetchAll()));
}

function trips_show(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    $stmt = $pdo->prepare('SELECT * FROM trip_plans WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) json_error('Trip not found.', 404);
    if ($row['user_id'] !== $user['id'] && $user['role'] !== 'admin'
        && !($user['role'] === 'guide' && $row['guide_id'] === $user['id'])) json_error('Forbidden.', 403);
    json_ok(trip_hydrate($pdo, $row));
}

function trip_validate_selected_guide(PDO $pdo, string $guideId, string $startDate, string $endDate, ?string $excludeTripId = null): void {
    $guide = $pdo->prepare(
        "SELECT g.user_id FROM guides g JOIN users u ON u.id = g.user_id
         WHERE g.user_id = ? AND g.verification_status = 'verified'
           AND g.is_available = 1 AND u.role = 'guide' AND u.verified = 1 AND u.status = 'active'
           AND g.bio IS NOT NULL AND TRIM(g.bio) <> ''
           AND g.location IS NOT NULL AND TRIM(g.location) <> '' AND g.price_per_day > 0
           AND EXISTS (SELECT 1 FROM guide_tour_types gt WHERE gt.guide_id = g.user_id AND gt.price > 0)
           AND NOT EXISTS (
             SELECT 1 FROM guide_bookings b
             WHERE b.guide_id = g.user_id AND b.status IN ('pending','accepted')
               AND b.start_date <= ? AND b.end_date >= ?
           )
           AND NOT EXISTS (
             SELECT 1 FROM trip_plans t
             WHERE t.guide_id = g.user_id AND t.id != COALESCE(?, '')
               AND t.guide_response = 'accepted' AND t.start_date <= ? AND t.end_date >= ?
           )"
    );
    $guide->execute([$guideId, $endDate, $startDate, $excludeTripId, $endDate, $startDate]);
    if (!$guide->fetchColumn()) json_error('Choose a guide who is accepting bookings and has no booking conflict on these dates.', 422);
}

function trip_validate_dates(string $startDate, string $endDate): void {
    $start = DateTime::createFromFormat('!Y-m-d', $startDate);
    $end = DateTime::createFromFormat('!Y-m-d', $endDate);
    if (!$start || !$end || $start->format('Y-m-d') !== $startDate || $end->format('Y-m-d') !== $endDate || $endDate < $startDate) {
        json_error('Enter valid trip dates. The end date cannot be before the start date.', 422);
    }
}

function trip_save_days(PDO $pdo, string $tripId, array $days): void {
    $pdo->prepare('DELETE FROM trip_days WHERE trip_id = ?')->execute([$tripId]);
    foreach ($days as $i => $day) {
        $dayId = id_with_prefix('day');
        $pdo->prepare('INSERT INTO trip_days (id, trip_id, day_date, notes, sort_order) VALUES (?,?,?,?,?)')
            ->execute([$dayId, $tripId, $day['date'], $day['notes'] ?? null, $i]);
        foreach ((array)($day['stops'] ?? []) as $j => $stop) {
            $stopId = id_with_prefix('stop');
            $pdo->prepare(
                'INSERT INTO trip_stops (id, day_id, place_id, place_name, place_image, location, duration, notes, sort_order)
                 VALUES (?,?,?,?,?,?,?,?,?)'
            )->execute([
                $stopId, $dayId, $stop['placeId'] ?? null, $stop['placeName'], $stop['placeImage'] ?? null,
                $stop['location'] ?? null, $stop['duration'] ?? null, $stop['notes'] ?? null, $stop['order'] ?? $j,
            ]);
        }
    }
}

function trips_create(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['tourist', 'guide']);
    $d = body();
    require_fields($d, ['name', 'startDate', 'endDate']);

    if (!is_string($d['name']) || trim($d['name']) === '') json_error('A trip name is required.', 422);
    if (!is_string($d['startDate']) || !is_string($d['endDate'])) json_error('Enter valid trip dates.', 422);
    trip_validate_dates($d['startDate'], $d['endDate']);
    foreach (['startTime', 'endTime'] as $timeField) {
        if (isset($d[$timeField]) && $d[$timeField] !== null
            && (!is_string($d[$timeField]) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $d[$timeField]))) {
            json_error('Enter valid trip start and end times.', 422);
        }
    }
    if (!empty($d['startTime']) && !empty($d['endTime']) && $d['endTime'] <= $d['startTime']) {
        json_error('Trip end time must be after its start time.', 422);
    }
    $planStatus = $d['status'] ?? 'draft';
    if (!in_array($planStatus, ['draft', 'planned', 'ongoing'], true)) {
        json_error('A new trip cannot be marked as completed.', 422);
    }
    $guideId = null;
    if ($user['role'] === 'guide') {
        $guideId = $user['id'];
    } elseif (isset($d['guideId']) && $d['guideId'] !== null && $d['guideId'] !== '') {
        if (!is_string($d['guideId'])) json_error('Invalid guide selection.', 422);
        trip_validate_selected_guide($pdo, $d['guideId'], $d['startDate'], $d['endDate']);
        $guideId = $d['guideId'];
    }
    $id = id_with_prefix('trip');
    $pdo->beginTransaction();
    try {
        $pdo->prepare('INSERT INTO trip_plans (id, user_id, name, description, start_date, end_date, start_time, end_time, status, guide_id) VALUES (?,?,?,?,?,?,?,?,?,?)')
            ->execute([$id, $user['id'], $d['name'], $d['description'] ?? null, $d['startDate'], $d['endDate'], $d['startTime'] ?? null, $d['endTime'] ?? null, $planStatus, $guideId]);

        foreach ((array)($d['destinations'] ?? []) as $dest) {
            $pdo->prepare('INSERT INTO trip_destinations (trip_id, destination) VALUES (?, ?)')->execute([$id, $dest]);
        }
        if (!empty($d['days'])) trip_save_days($pdo, $id, $d['days']);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $e;
    }

    if ($guideId && $guideId !== $user['id']) {
        notify($pdo, $guideId, 'Tourist shared a trip plan', $user['name'] . ' shared "' . trim($d['name']) . '" with you.', 'booking', '/guide-dashboard#plans');
    }

    trips_show_internal($pdo, $id);
}

function trips_show_internal(PDO $pdo, string $id): void {
    $stmt = $pdo->prepare('SELECT * FROM trip_plans WHERE id = ?');
    $stmt->execute([$id]);
    json_ok(trip_hydrate($pdo, $stmt->fetch()), 201);
}

function trips_update(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    $stmt = $pdo->prepare('SELECT * FROM trip_plans WHERE id = ?');
    $stmt->execute([$id]);
    $existing = $stmt->fetch();
    if (!$existing) json_error('Trip not found.', 404);
    $d = body();
    $isTourist = $user['role'] === 'tourist' && $existing['user_id'] === $user['id'];
    $isGuide = $user['role'] === 'guide' && $existing['guide_id'] === $user['id'];
    if (!$isTourist && !$isGuide) json_error('Forbidden.', 403);
    if ($existing['status'] === 'completed') json_error('A completed tour plan can no longer be changed.', 409);

    if ($isGuide && array_key_exists('guideResponse', $d)) {
        if (count($d) !== 1 || !in_array($d['guideResponse'], ['accepted', 'declined'], true)) {
            json_error('Choose to accept or decline this trip plan.', 422);
        }
        if ($existing['guide_response'] !== 'pending' || $existing['status'] === 'completed') {
            json_error('This trip plan has already been responded to.', 409);
        }
        $pdo->beginTransaction();
        try {
            $lock = $pdo->prepare('SELECT * FROM trip_plans WHERE id = ? FOR UPDATE');
            $lock->execute([$id]);
            $locked = $lock->fetch();
            if (!$locked || $locked['guide_response'] !== 'pending') {
                $pdo->rollBack();
                json_error('This trip plan has already been responded to.', 409);
            }
            if ($d['guideResponse'] === 'accepted') {
                $matchingBookingStmt = $pdo->prepare(
                    'SELECT id, status FROM guide_bookings
                     WHERE tourist_id = ? AND guide_id = ? AND start_date = ? AND end_date = ?
                     ORDER BY created_at DESC LIMIT 1 FOR UPDATE'
                );
                $matchingBookingStmt->execute([
                    $locked['user_id'], $user['id'], $locked['start_date'], $locked['end_date'],
                ]);
                $matchingBooking = $matchingBookingStmt->fetch();
                $matchingBookingId = $matchingBooking ? $matchingBooking['id'] : '';
                $conflict = $pdo->prepare(
                    "SELECT 1 FROM guide_bookings
                     WHERE guide_id = ? AND id != ? AND status IN ('pending','accepted','awaiting_confirmation') AND start_date <= ? AND end_date >= ?
                     UNION ALL
                     SELECT 1 FROM trip_plans
                     WHERE guide_id = ? AND id != ? AND guide_response = 'accepted'
                       AND start_date <= ? AND end_date >= ?
                     LIMIT 1"
                );
                $conflict->execute([
                    $user['id'], $matchingBookingId, $locked['end_date'], $locked['start_date'],
                    $user['id'], $id, $locked['end_date'], $locked['start_date'],
                ]);
                if ($conflict->fetchColumn()) {
                    $pdo->rollBack();
                    json_error('This trip overlaps another confirmed booking or trip.', 409);
                }
                if ($matchingBooking && $matchingBooking['status'] === 'pending') {
                    $pdo->prepare("UPDATE guide_bookings SET status = 'accepted' WHERE id = ?")
                        ->execute([$matchingBooking['id']]);
                } elseif (!$matchingBooking || !in_array($matchingBooking['status'], ['pending', 'accepted'], true)) {
                    $rateStmt = $pdo->prepare('SELECT price_per_day FROM guides WHERE user_id = ? FOR UPDATE');
                    $rateStmt->execute([$user['id']]);
                    $dailyRate = (float)$rateStmt->fetchColumn();
                    if ($dailyRate <= 0) {
                        $pdo->rollBack();
                        json_error('This guide has not configured a valid daily rate.', 409);
                    }
                    $days = (new DateTime($locked['start_date']))->diff(new DateTime($locked['end_date']))->days + 1;
                    $totalPrice = $dailyRate * $days;
                    $setting = get_setting($pdo, 'guide_booking');
                    $split = compute_split((int)round($totalPrice * 100), $setting['advancePercent'], $setting['commissionPercent']);
                    if (!collect_advance('bkash', $split['advance'])) {
                        $pdo->rollBack();
                        json_error('The guide booking advance could not be collected.', 402);
                    }
                    $pdo->prepare(
                        "INSERT INTO guide_bookings
                         (id, guide_id, tourist_id, tour_type, start_date, end_date, message, total_price, group_size, status,
                          advance_percent, commission_percent, advance_amount, balance_amount, advance_status)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'accepted', ?, ?, ?, ?, 'held')"
                    )->execute([
                        id_with_prefix('bk'), $user['id'], $locked['user_id'], 'Shared trip plan',
                        $locked['start_date'], $locked['end_date'],
                        'Agreed from shared itinerary: ' . $locked['name'], $totalPrice,
                        $setting['advancePercent'], $setting['commissionPercent'], $split['advance'] / 100, $split['cash'] / 100,
                    ]);
                }
            }
            $pdo->prepare("UPDATE trip_plans SET guide_response = ? WHERE id = ? AND guide_response = 'pending'")
                ->execute([$d['guideResponse'], $id]);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
        notify(
            $pdo,
            $existing['user_id'],
            $d['guideResponse'] === 'accepted' ? 'Guide accepted your trip plan' : 'Guide declined your trip plan',
            $user['name'] . ($d['guideResponse'] === 'accepted' ? ' accepted ' : ' declined ') . '"' . $existing['name'] . '".',
            'booking',
            '/profile',
        );
        trips_show($pdo, $id);
        return;
    }

    if ($isGuide && array_key_exists('status', $d)) {
        json_error('The guide must mark the linked booking as awaiting tourist confirmation.', 403);
    }
    if (array_key_exists('guideResponse', $d)) {
        json_error('Only the assigned guide can accept or decline a shared trip plan.', 403);
    }

    if (array_key_exists('status', $d)) {
        if (!in_array($d['status'], ['draft', 'planned', 'ongoing'], true)) {
            json_error('Invalid trip status.', 422);
        }
    }

    if (!$isTourist) json_error('Only the tourist who owns this plan can edit its itinerary.', 403);
    $effectiveStartDate = array_key_exists('startDate', $d) ? $d['startDate'] : $existing['start_date'];
    $effectiveEndDate = array_key_exists('endDate', $d) ? $d['endDate'] : $existing['end_date'];
    if (!is_string($effectiveStartDate) || !is_string($effectiveEndDate)) json_error('Enter valid trip dates.', 422);
    trip_validate_dates($effectiveStartDate, $effectiveEndDate);
    if (array_key_exists('guideId', $d)) {
        if ($user['role'] !== 'tourist') json_error('Only tourists can share a trip with a guide.', 403);
        if ($d['guideId'] === null || $d['guideId'] === '') {
            $d['guideId'] = null;
        } elseif (!is_string($d['guideId'])) {
            json_error('Invalid guide selection.', 422);
        } else {
            trip_validate_selected_guide(
                $pdo,
                $d['guideId'],
                $effectiveStartDate,
                $effectiveEndDate,
                $id,
            );
        }
    }
    foreach (['startTime', 'endTime'] as $timeField) {
        if (isset($d[$timeField]) && $d[$timeField] !== null
            && (!is_string($d[$timeField]) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $d[$timeField]))) {
            json_error('Enter valid trip start and end times.', 422);
        }
    }
    $effectiveStartTime = array_key_exists('startTime', $d) ? $d['startTime'] : $existing['start_time'];
    $effectiveEndTime = array_key_exists('endTime', $d) ? $d['endTime'] : $existing['end_time'];
    if ($effectiveStartTime && $effectiveEndTime && $effectiveEndTime <= $effectiveStartTime) {
        json_error('Trip end time must be after its start time.', 422);
    }
    $map = [
        'name' => 'name', 'description' => 'description', 'startDate' => 'start_date', 'endDate' => 'end_date',
        'startTime' => 'start_time', 'endTime' => 'end_time', 'status' => 'status', 'guideId' => 'guide_id',
    ];
    $fields = []; $params = [];
    $guideApprovalReset = (array_key_exists('guideId', $d) && $d['guideId'] !== $existing['guide_id'])
        || ($existing['guide_id'] && (
            $effectiveStartDate !== $existing['start_date']
            || $effectiveEndDate !== $existing['end_date']
            || array_key_exists('startTime', $d)
            || array_key_exists('endTime', $d)
            || array_key_exists('destinations', $d)
            || array_key_exists('days', $d)
        ));
    if ($guideApprovalReset && $existing['guide_id']) {
        $fields[] = 'guide_response = ?';
        $params[] = 'pending';
    }
    foreach ($map as $k => $col) {
        if (array_key_exists($k, $d)) { $fields[] = "$col = ?"; $params[] = $d[$k]; }
    }
    if ($fields) {
        $params[] = $id;
        $pdo->prepare('UPDATE trip_plans SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }
    if (isset($d['destinations'])) {
        $pdo->prepare('DELETE FROM trip_destinations WHERE trip_id = ?')->execute([$id]);
        foreach ((array)$d['destinations'] as $dest) {
            $pdo->prepare('INSERT INTO trip_destinations (trip_id, destination) VALUES (?, ?)')->execute([$id, $dest]);
        }
    }
    if (isset($d['days'])) trip_save_days($pdo, $id, $d['days']);

    $sharedGuideId = array_key_exists('guideId', $d) ? $d['guideId'] : $existing['guide_id'];
    if ($sharedGuideId && $sharedGuideId !== $user['id']) {
        $title = $guideApprovalReset ? 'Tourist updated shared trip plan' : 'Tourist updated a trip plan';
        $message = $guideApprovalReset
            ? $user['name'] . ' updated "' . $existing['name'] . '". Please review and accept the updated plan.'
            : $user['name'] . ' updated "' . $existing['name'] . '".';
        notify($pdo, $sharedGuideId, $title, $message, 'booking', '/guide-dashboard#plans');
    }

    trips_show($pdo, $id);
}

function trips_delete(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    $stmt = $pdo->prepare('SELECT user_id FROM trip_plans WHERE id = ?');
    $stmt->execute([$id]);
    $existing = $stmt->fetch();
    if (!$existing) json_error('Trip not found.', 404);
    if ($existing['user_id'] !== $user['id']) json_error('Forbidden.', 403);
    $pdo->prepare('DELETE FROM trip_plans WHERE id = ?')->execute([$id]);
    json_ok(null, 200, ['message' => 'Trip deleted.']);
}
