<?php

function order_hydrate(PDO $pdo, array $row, ?string $vendorId = null): array {
    $sql = 'SELECT oi.* FROM order_items oi';
    $params = [$row['id']];
    if ($vendorId !== null) {
        $sql .= ' JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ? AND p.vendor_id = ?';
        $params[] = $vendorId;
    } else {
        $sql .= ' WHERE oi.order_id = ?';
    }
    $items = $pdo->prepare($sql);
    $items->execute($params);
    $orderItems = [];
    $visibleTotal = 0.0;
    foreach ($items->fetchAll() as $it) {
        $p = $pdo->prepare('SELECT * FROM products WHERE id = ?');
        $p->execute([$it['product_id']]);
        $productRow = $p->fetch();
        $orderItems[] = [
            'product' => $productRow ? product_hydrate($pdo, $productRow) : null,
            'quantity' => (int)$it['quantity'], 'price' => (float)$it['price'],
        ];
        $visibleTotal += (float)$it['price'] * (int)$it['quantity'];
    }
    $customer = $pdo->prepare('SELECT name FROM users WHERE id = ?');
    $customer->execute([$row['user_id']]);
    return [
        'id' => $row['id'], 'userId' => $row['user_id'], 'customerName' => $customer->fetchColumn() ?: $row['ship_name'],
        'items' => $orderItems,
        'status' => $row['status'], 'totalAmount' => $vendorId === null ? (float)$row['total_amount'] : $visibleTotal + (float)($row['delivery_fee'] ?? 0),
        'advancePercent' => (float)$row['advance_percent'],
        'commissionPercent' => (float)$row['commission_percent'],
        'advanceAmount' => (float)$row['advance_amount'],
        'advanceStatus' => $row['advance_status'],
        'subtotal' => $vendorId === null ? (float)$row['total_amount'] - (float)($row['delivery_fee'] ?? 0) : $visibleTotal,
        'deliveryFee' => (float)($row['delivery_fee'] ?? 0),
        'shippingAddress' => [
            'name' => $row['ship_name'], 'phone' => $row['ship_phone'], 'address' => $row['ship_address'],
            'city' => $row['ship_city'], 'district' => $row['ship_district'], 'division' => $row['ship_division'],
            'postalCode' => $row['ship_postal_code'],
        ],
        'advancePayerPhone' => $row['advance_payer_phone'] ?? null, 'advanceTransactionId' => $row['advance_transaction_id'] ?? null,
        'paymentMethod' => $row['payment_method'], 'createdAt' => $row['created_at'], 'updatedAt' => $row['updated_at'],
        'estimatedDelivery' => $row['estimated_delivery'], 'trackingNumber' => $row['tracking_number'],
    ];
}

function vendor_owns_order(PDO $pdo, string $orderId, string $vendorId): bool {
    $stmt = $pdo->prepare(
        'SELECT 1 FROM order_items oi JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ? AND p.vendor_id = ? LIMIT 1'
    );
    $stmt->execute([$orderId, $vendorId]);
    return (bool)$stmt->fetchColumn();
}

function notify_order_admins(PDO $pdo, string $title, string $message): void {
    $admins = $pdo->query("SELECT id FROM users WHERE role = 'admin' AND status = 'active'");
    foreach ($admins->fetchAll(PDO::FETCH_COLUMN) as $adminId) {
        notify($pdo, $adminId, $title, $message, 'order', '/admin?section=orders');
    }
}

function orders_create(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['tourist']);
    $d = body();
    require_fields($d, ['shippingAddress', 'paymentMethod']);
    if (!in_array($d['paymentMethod'], ['bkash', 'nagad', 'card'], true)) {
        json_error('Choose bKash, Nagad, or card for the online advance payment.', 422);
    }
    [$advancePhone, $advanceTxn] = payment_proof($d, $d['paymentMethod'], 'advance', false);
    $addr = $d['shippingAddress'];
    if (!is_array($addr)) json_error('Shipping address must include name, phone, address, city, district and division.', 422);
    foreach (['name', 'phone', 'address', 'city', 'district', 'division'] as $f) {
        if (empty(trim((string)($addr[$f] ?? '')))) json_error("Shipping address: '$f' is required.", 422);
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT product_id, quantity FROM cart_items WHERE user_id = ? FOR UPDATE');
    $stmt->execute([$user['id']]);
    $cartItems = $stmt->fetchAll();
    if (!$cartItems) {
        $pdo->rollBack();
        json_error('Your cart is empty.', 422);
    }

    $groups = [];
    $vendorOrderIds = [];
    $setting = get_setting($pdo, 'order');
    try {
        foreach ($cartItems as $ci) {
            $p = $pdo->prepare(
                "SELECT p.id, p.vendor_id, p.price, p.stock, p.name
                 FROM products p JOIN vendors v ON v.user_id = p.vendor_id
                 JOIN users u ON u.id = v.user_id
                 WHERE p.id = ? AND v.verification_status = 'verified' AND u.verified = 1 AND u.status = 'active'
                 FOR UPDATE"
            );
            $p->execute([$ci['product_id']]);
            $prod = $p->fetch();
            if (!$prod) json_error('A product in your cart is no longer available.', 409);
            if ((int)$prod['stock'] < (int)$ci['quantity']) json_error("Insufficient stock for {$prod['name']}.", 422);
            $groups[$prod['vendor_id']][] = [
                'product_id' => $prod['id'], 'quantity' => (int)$ci['quantity'], 'price' => (float)$prod['price'],
            ];
        }

        if (!$groups) json_error('None of the items in your cart are available any more.', 422);
        $orderIds = [];
        foreach ($groups as $vid => $lines) {
            $id = id_with_prefix('ord');
            $subtotal = array_sum(array_map(fn($line) => $line['price'] * $line['quantity'], $lines));
            $deliveryFee = 120;
            $total = $subtotal + $deliveryFee;
            $split = compute_split((int)round($total * 100), $setting['advancePercent'], $setting['commissionPercent']);
            if (!collect_advance($d['paymentMethod'], $split['advance'])) {
                json_error('The advance payment could not be collected.', 402);
            }
            $pdo->prepare(
                'INSERT INTO orders (id, user_id, status, total_amount, delivery_fee, ship_name, ship_phone, ship_address, ship_city,
                                      ship_district, ship_division, ship_postal_code, payment_method, estimated_delivery,
                                      advance_percent, commission_percent, advance_amount, cod_amount, advance_status,
                                      advance_payer_phone, advance_transaction_id)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,?,?,?,?,?,?,?)'
            )->execute([
                $id, $user['id'], 'placed', $total, $deliveryFee, $addr['name'], $addr['phone'], $addr['address'], $addr['city'],
                $addr['district'], $addr['division'], $addr['postalCode'] ?? null, $d['paymentMethod'],
                $setting['advancePercent'], $setting['commissionPercent'], $split['advance'] / 100,
                $split['cash'] / 100, 'held', $advancePhone, $advanceTxn,
            ]);
            foreach ($lines as $line) {
                $pdo->prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?,?,?,?)')
                    ->execute([$id, $line['product_id'], $line['quantity'], $line['price']]);
                $dec = $pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');
                $dec->execute([$line['quantity'], $line['product_id'], $line['quantity']]);
                if ($dec->rowCount() === 0) throw new RuntimeException('OUT_OF_STOCK');
            }
            $orderIds[] = $id;
            $vendorOrderIds[$vid] = $id;
        }
        $pdo->prepare('DELETE FROM cart_items WHERE user_id = ?')->execute([$user['id']]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        if ($e->getMessage() === 'OUT_OF_STOCK') json_error('Sorry, an item just went out of stock. Please review your cart.', 409);
        throw $e;
    }

    foreach (array_keys($groups) as $vid) {
        $productNames = [];
        foreach ($groups[$vid] as $line) {
            $productStmt = $pdo->prepare('SELECT name FROM products WHERE id = ?');
            $productStmt->execute([$line['product_id']]);
            $productNames[] = (string)$productStmt->fetchColumn();
        }
        notify(
            $pdo,
            (string)$vid,
            'New order awaiting confirmation',
            'Order ' . $vendorOrderIds[$vid] . ' includes: ' . implode(', ', $productNames) . '. Please confirm or cancel it.',
            'order',
            '/vendor?tab=orders'
        );
    }
    notify($pdo, $user['id'], 'Order placed', 'Your order has been placed successfully.', 'order', '/order-tracking');
    notify_order_admins(
        $pdo,
        'New marketplace order',
        'Order ' . implode(', ', $orderIds) . ' was placed by ' . $user['name'] . ' and is awaiting vendor confirmation.',
    );
    $createdOrders = [];
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
    foreach ($orderIds as $id) {
        $stmt->execute([$id]);
        $createdOrders[] = order_hydrate($pdo, $stmt->fetch());
    }
    json_ok(['orders' => $createdOrders], 201);
}

function orders_index(PDO $pdo): void {
    $user = require_auth($pdo);
    if ($user['role'] === 'admin') {
        $stmt = $pdo->query('SELECT * FROM orders ORDER BY created_at DESC');
    } elseif ($user['role'] === 'vendor') {
        $stmt = $pdo->prepare(
            'SELECT DISTINCT o.* FROM orders o
             JOIN order_items oi ON oi.order_id = o.id
             JOIN products p ON p.id = oi.product_id
             WHERE p.vendor_id = ? ORDER BY o.created_at DESC'
        );
        $stmt->execute([$user['id']]);
    } else {
        $stmt = $pdo->prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->execute([$user['id']]);
    }
    json_ok(array_map(
        fn($r) => order_hydrate($pdo, $r, $user['role'] === 'vendor' ? $user['id'] : null),
        $stmt->fetchAll()
    ));
}

function orders_show(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) json_error('Order not found.', 404);
    if ($row['user_id'] !== $user['id']
        && $user['role'] !== 'admin'
        && ($user['role'] !== 'vendor' || !vendor_owns_order($pdo, $id, $user['id']))) {
        json_error('Forbidden.', 403);
    }
    json_ok(order_hydrate($pdo, $row, $user['role'] === 'vendor' ? $user['id'] : null));
}

function orders_update(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    require_role($user, ['tourist', 'vendor', 'admin']);
    $d = body();
    require_fields($d, ['status']);

    // Tourists only confirm receipt; vendors and admins cannot release the advance.
    if ($user['role'] === 'tourist' && $d['status'] !== 'completed') {
        json_error('Tourists can only confirm delivery after the order has been delivered.', 403);
    }
    if ($d['status'] === 'completed' && $user['role'] !== 'tourist') {
        json_error('Only the tourist who placed the order can confirm delivery and release the advance.', 403);
    }
    if ($user['role'] === 'vendor' && !vendor_owns_order($pdo, $id, $user['id'])) {
        json_error('Forbidden.', 403);
    }
    if (!is_string($d['status']) || !in_array($d['status'], ['placed', 'confirmed', 'preparing', 'shipped', 'out_for_delivery', 'delivered', 'completed', 'cancelled'], true)) {
        json_error('Invalid order status.', 422);
    }
    $transitions = [
        'placed' => ['confirmed', 'cancelled'],
        'confirmed' => ['preparing', 'cancelled'],
        'preparing' => ['shipped'],
        'shipped' => ['out_for_delivery'],
        'out_for_delivery' => ['delivered'],
        'delivered' => ['completed'],
        'completed' => [],
        'cancelled' => [],
    ];
    if ($d['status'] === 'confirmed') {
        $deliveryDate = $d['estimatedDelivery'] ?? null;
        $parsedDeliveryDate = is_string($deliveryDate) ? DateTime::createFromFormat('!Y-m-d', $deliveryDate) : false;
        if (!$parsedDeliveryDate || $parsedDeliveryDate->format('Y-m-d') !== $deliveryDate || $deliveryDate < date('Y-m-d')) {
            json_error('Choose a valid delivery date today or later when confirming the order.', 422);
        }
    } elseif (isset($d['estimatedDelivery'])) {
        $deliveryDate = $d['estimatedDelivery'];
        $parsedDeliveryDate = is_string($deliveryDate) ? DateTime::createFromFormat('!Y-m-d', $deliveryDate) : false;
        if (!$parsedDeliveryDate || $parsedDeliveryDate->format('Y-m-d') !== $deliveryDate || $deliveryDate < date('Y-m-d')) {
            json_error('Enter a valid estimated delivery date.', 422);
        }
    }
    $fields = ['status = ?']; $params = [$d['status']];
    if ($d['status'] === 'confirmed' || isset($d['estimatedDelivery'])) {
        $fields[] = 'estimated_delivery = ?';
        $params[] = $d['estimatedDelivery'];
    }
    if (isset($d['trackingNumber'])) { $fields[] = 'tracking_number = ?'; $params[] = $d['trackingNumber']; }
    $pdo->beginTransaction();
    $lockOrder = $pdo->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE');
    $lockOrder->execute([$id]);
    $currentOrder = $lockOrder->fetch();
    if (!$currentOrder) {
        $pdo->rollBack();
        json_error('Order not found.', 404);
    }
    if ($user['role'] === 'tourist' && $currentOrder['user_id'] !== $user['id']) {
        $pdo->rollBack();
        json_error('Forbidden.', 403);
    }
    if (in_array($currentOrder['status'], ['completed', 'cancelled'], true)) {
        $pdo->rollBack();
        json_error('Completed or cancelled orders cannot be changed.', 409);
    }
    if ($user['role'] === 'tourist' && $currentOrder['status'] !== 'delivered') {
        $pdo->rollBack();
        json_error('You can confirm the order only after the vendor marks it delivered.', 409);
    }
    if ($user['role'] !== 'tourist' && $d['status'] === 'completed') {
        $pdo->rollBack();
        json_error('Only the tourist can confirm delivery.', 403);
    }
    if (!in_array($d['status'], $transitions[$currentOrder['status']] ?? [], true)) {
        $pdo->rollBack();
        json_error('That order status change is not allowed. Follow the order lifecycle one step at a time.', 422);
    }
    if ($d['status'] === 'delivered') {
        $vendorCount = $pdo->prepare(
            'SELECT COUNT(DISTINCT p.vendor_id) FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?'
        );
        $vendorCount->execute([$id]);
        if ($user['role'] === 'vendor' && (int)$vendorCount->fetchColumn() > 1) {
            $pdo->rollBack();
            json_error('Only an admin can mark a multi-vendor order delivered.', 403);
        }
    }
    $params[] = $id;
    $update = $pdo->prepare('UPDATE orders SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $update->execute($params);
    if ($d['status'] === 'completed') {
        settle_order($pdo, $currentOrder);
    } elseif ($d['status'] === 'cancelled') {
        $pdo->prepare("UPDATE orders SET advance_status = 'refunded' WHERE id = ? AND advance_status = 'held'")->execute([$id]);
        $pdo->prepare(
            'UPDATE products p JOIN order_items oi ON oi.product_id = p.id
             SET p.stock = p.stock + oi.quantity WHERE oi.order_id = ?'
        )->execute([$id]);
    }
    $pdo->commit();

    $ownerId = $currentOrder['user_id'];
    $dateMessage = isset($d['estimatedDelivery']) ? ' Estimated delivery: ' . $d['estimatedDelivery'] . '.' : '';
    if ($ownerId) {
        $message = $d['status'] === 'delivered'
            ? 'The vendor marked your order delivered. Confirm receipt in order tracking to settle the held advance.'
            : ($d['status'] === 'completed'
                ? 'You confirmed delivery. The held advance has been settled according to the order payment terms.'
                : "Your order status is now: {$d['status']}." . $dateMessage);
        notify($pdo, $ownerId, 'Order update', $message, 'order', "/order-tracking?id=$id");
    }
    if ($d['status'] === 'completed') {
        $vendors = $pdo->prepare(
            'SELECT DISTINCT p.vendor_id FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?'
        );
        $vendors->execute([$id]);
        foreach ($vendors->fetchAll(PDO::FETCH_COLUMN) as $vendorId) {
            notify($pdo, (string)$vendorId, 'Order delivery confirmed', "The tourist confirmed delivery for order $id. The advance settlement is reflected in your earnings dashboard.", 'order', '/vendor?tab=orders');
        }
        notify_order_admins($pdo, 'Order advance settled', "The tourist confirmed delivery for order $id. The platform commission is recorded in admin earnings.");
    }
    if ($user['role'] === 'vendor') {
        notify_order_admins(
            $pdo,
            'Marketplace order updated',
            "Vendor {$user['name']} updated order $id to {$d['status']}.",
        );
    } elseif ($user['role'] === 'admin') {
        $vendors = $pdo->prepare(
            'SELECT DISTINCT p.vendor_id FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?'
        );
        $vendors->execute([$id]);
        foreach ($vendors->fetchAll(PDO::FETCH_COLUMN) as $vendorId) {
            notify($pdo, (string)$vendorId, 'Order update', "An admin changed order $id to {$d['status']}.", 'order', '/vendor?tab=orders');
        }
    }

    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
    $stmt->execute([$id]);
    json_ok(order_hydrate($pdo, $stmt->fetch(), $user['role'] === 'vendor' ? $user['id'] : null));
}
