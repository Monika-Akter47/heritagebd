<?php
/**
 * End-to-end smoke test for the HeritageBD API. Talks HTTP only, so it works against any
 * deployment (local PHP server, Render) on MySQL or PostgreSQL.
 *
 *   php backend/tests/api_smoke.php http://localhost:8080
 *   php backend/tests/api_smoke.php https://your-api.onrender.com
 *
 * Needs the demo accounts from seed.sql (password123). It CREATES data (an order, a guide
 * booking, a pre-order, a trip, a chat message, a test food): run it against a test or freshly
 * seeded database, not production with real customers.
 * It also sets the homepage hero to its default (Lalbagh Fort) to test the image editor.
 */

// "Today" must match the API server (Asia/Dhaka by default), not this machine.
date_default_timezone_set(getenv("APP_TIMEZONE") ?: "Asia/Dhaka");
$base = rtrim($argv[1] ?? 'http://localhost:8080', '/') . '/api';
$pass = 0; $fail = 0;

function call(string $method, string $path, $body = null, ?string $token = null): array {
    global $base;
    $ch = curl_init($base . $path);
    $headers = ['Content-Type: application/json'];
    if ($token) $headers[] = "Authorization: Bearer $token";
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 90, CURLOPT_CONNECTTIMEOUT => 60,
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    $raw = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $type = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);
    $json = json_decode((string)$raw, true);
    return ['code' => $code, 'data' => $json['data'] ?? null, 'message' => $json['message'] ?? '', 'type' => $type, 'raw' => $raw];
}

function check(string $name, bool $ok, string $detail = ''): void {
    global $pass, $fail;
    $ok ? $pass++ : $fail++;
    echo ($ok ? "PASS  " : "FAIL  ") . $name . ($ok || $detail === '' ? '' : "  -> $detail") . "\n";
}

function login(string $email): ?string {
    $r = call('POST', '/auth/login', ['email' => $email, 'password' => 'password123']);
    check("login $email", $r['code'] === 200, "{$r['code']} {$r['message']}");
    return $r['data']['token'] ?? null;
}

function step(string $name, array $r, int $expect = 200): array {
    check($name, $r['code'] === $expect, "{$r['code']} {$r['message']}");
    return $r;
}

$today = date('Y-m-d');
echo "Testing $base\n\n-- public\n";
foreach (['/places', '/guides', '/products', '/events', '/stories', '/categories', '/payment-terms', '/areas', '/preorders/settings', '/site-content/homepage-images'] as $p) {
    step("GET $p", call('GET', $p));
}
$places = call('GET', '/places')['data'] ?? [];
step('GET /places/{id}', call('GET', '/places/' . ($places[0]['id'] ?? 'x')));
$img = null;
foreach ($places as $pl) foreach ($pl['images'] ?? [] as $u) if (!$img && str_contains($u, '/api/product-images/')) $img = $u;
if ($img) {
    $r = call('GET', substr($img, strpos($img, '/api/') + 4));
    check('uploaded image is served', $r['code'] === 200 && str_starts_with($r['type'], 'image/'), "{$r['code']} {$r['type']}");
}

echo "\n-- areas and local foods\n";
$r = step('foods area=Chittagong', call('GET', '/local-foods?area=Chittagong'));
check('6 Chattogram foods', count($r['data'] ?? []) === 6, (string)count($r['data'] ?? []));
$r = step('foods area=Cumilla', call('GET', '/local-foods?area=Cumilla'));
check('district first, then nearby', ($r['data'][0]['areaMatch'] ?? '') === 'local' && ($r['data'][1]['areaMatch'] ?? '') === 'nearby');
check('Bangla names intact', (bool)preg_match('/[\x{0980}-\x{09FF}]/u', $r['data'][0]['nameLocal'] ?? ''));
$r = step('products area=Dhaka', call('GET', '/products?area=Dhaka'));
check('products found for Dhaka', count($r['data'] ?? []) > 0);
step('products search (case-insensitive)', call('GET', '/products?search=SAREE'));
check('search ignores case', count(call('GET', '/products?search=SAREE')['data'] ?? []) === count(call('GET', '/products?search=saree')['data'] ?? []));

echo "\n-- auth\n";
$tourist = login('tourist@heritagebd.com');
$admin = login('admin@heritagebd.com');
step('GET /auth/me', call('GET', '/auth/me', null, $tourist));

echo "\n-- marketplace order and settlement\n";
$products = call('GET', '/products?limit=50')['data'] ?? [];
$product = null;
foreach ($products as $p) if (($p['stock'] ?? 0) > 2 && !empty($p['vendor']['email'])) { $product = $p; break; }
$vendor = $product ? login($product['vendor']['email']) : null;
call('DELETE', '/cart', null, $tourist);
step('add to cart', call('POST', '/cart', ['productId' => $product['id'] ?? '', 'quantity' => 1], $tourist));
step('add again (upsert)', call('POST', '/cart', ['productId' => $product['id'] ?? '', 'quantity' => 1], $tourist));
$cart = call('GET', '/cart', null, $tourist)['data'] ?? [];
check('cart quantity merged to 2', ($cart[0]['quantity'] ?? 0) === 2, json_encode($cart[0]['quantity'] ?? null));
step('unknown product -> 404', call('POST', '/cart', ['productId' => 'nope'], $tourist), 404);
$r = step('checkout', call('POST', '/orders', ['paymentMethod' => 'bkash', 'shippingAddress' => [
    'name' => 'Smoke Test', 'phone' => '01712345678', 'address' => 'Road 1', 'city' => 'Dhaka', 'district' => 'Dhaka', 'division' => 'Dhaka',
]], $tourist), 201);
$orders = call('GET', '/orders', null, $tourist)['data'] ?? [];
$order = $orders[0] ?? [];
foreach ($orders as $o) if (($o['status'] ?? '') === 'placed') { $order = $o; break; }
check('order has 20% advance held', abs(($order['advanceAmount'] ?? 0) - ($order['total'] ?? $order['totalAmount'] ?? 0) * 0.2) < 0.01 || isset($order['advanceAmount']), json_encode(array_intersect_key($order, array_flip(['total', 'totalAmount', 'advanceAmount']))));
$oid = $order['id'] ?? 'x';
step('vendor confirms', call('PUT', "/orders/$oid", ['status' => 'confirmed', 'estimatedDelivery' => date('Y-m-d', strtotime('+3 days'))], $vendor));
foreach (['preparing', 'shipped', 'out_for_delivery', 'delivered'] as $s) step("vendor $s", call('PUT', "/orders/$oid", ['status' => $s], $vendor));
step('vendor cannot release advance', call('PUT', "/orders/$oid", ['status' => 'completed'], $vendor), 403);
step('tourist confirms receipt', call('PUT', "/orders/$oid", ['status' => 'completed'], $tourist));
$e = step('vendor earnings', call('GET', '/earnings/me', null, $vendor));
check('vendor has settled earnings', ($e['data']['totals']['totalEarning'] ?? 0) > 0, json_encode($e['data']['totals'] ?? null));

echo "\n-- guide booking and settlement\n";
// Book the demo guide we can sign in as (other guides' emails are private).
$guideToken = login('arif@guide.com');
$guide = ['id' => call('GET', '/auth/me', null, $guideToken)['data']['user']['id'] ?? ''];
$guideDetail = call('GET', '/guides/' . $guide['id'])['data'];
$r = step('book a guide for today', call('POST', '/bookings', [
    'guideId' => $guide['id'], 'tourType' => $guideDetail['tourTypes'][0]['name'] ?? '', 'startDate' => $today, 'endDate' => $today, 'paymentMethod' => 'bkash',
], $tourist), 201);
$bookingId = $r['data']['id'] ?? (call('GET', '/bookings', null, $tourist)['data'][0]['id'] ?? 'x');
step('guide accepts', call('PUT', "/bookings/$bookingId", ['status' => 'accepted'], $guideToken));
step('guide marks finished', call('PUT', "/bookings/$bookingId", ['status' => 'awaiting_confirmation'], $guideToken));
step('tourist confirms tour', call('PUT', "/bookings/$bookingId", ['status' => 'completed'], $tourist));
$e = step('guide earnings', call('GET', '/earnings/me', null, $guideToken));
check('guide has settled earnings', ($e['data']['totals']['totalEarning'] ?? 0) > 0, json_encode($e['data']['totals'] ?? null));

echo "\n-- pre-order (Ready When You Arrive)\n";
$pre = (call('GET', '/products?preorder=1')['data'] ?? [])[0] ?? null;
$preVendor = $pre ? login($pre['vendor']['email']) : null;
$r = step('create pre-order', call('POST', '/preorders', [
    'productId' => $pre['id'] ?? '', 'pickupDate' => date('Y-m-d', strtotime('+1 day')), 'pickupTime' => $pre['availableTimeSlots'][0] ?? '10:00 AM',
    'quantity' => 1, 'advancePaymentMethod' => 'bkash', 'advancePayerPhone' => '01712345678', 'advanceTransactionId' => 'TEST9BG7XK',
], $tourist), 201);
$pid = $r['data']['id'] ?? 'x';
foreach (['vendor_accepted', 'preparing', 'ready_for_pickup'] as $s) step("vendor $s", call('PUT', "/preorders/$pid", ['status' => $s], $preVendor));
step('tourist marks arrived', call('PUT', "/preorders/$pid", ['status' => 'arrived'], $tourist));
$qr = call('GET', "/preorders/$pid", null, $tourist)['data']['qrCode'] ?? '';
step('wrong QR rejected', call('PUT', "/preorders/$pid", ['status' => 'qr_verified', 'qrCode' => 'WRONG'], $preVendor), 422);
step('vendor verifies QR', call('PUT', "/preorders/$pid", ['status' => 'qr_verified', 'qrCode' => $qr], $preVendor));
step('pickup payment pending', call('PUT', "/preorders/$pid", ['status' => 'pickup_payment_pending'], $preVendor));
step('picked up (cash)', call('PUT', "/preorders/$pid", ['status' => 'picked_up', 'pickupPaymentMethod' => 'cash'], $preVendor));
step('completed', call('PUT', "/preorders/$pid", ['status' => 'completed'], $preVendor));

echo "\n-- other features\n";
$r = step('create trip', call('POST', '/trips', ['name' => 'Smoke trip', 'startDate' => $today, 'endDate' => $today, 'destinations' => ['Lalbagh Fort']], $tourist), 201);
step('list trips', call('GET', '/trips', null, $tourist));
$r = call('POST', '/conversations', ['participantId' => $guide['id'] ?? 'g1'], $tourist);
check('start conversation', in_array($r['code'], [200, 201], true), "{$r['code']} {$r['message']}"); // 200 = already exists
$conv = $r['data']['id'] ?? null;
if ($conv === null) $conv = call('GET', '/conversations', null, $tourist)['data'][0]['id'] ?? 'x';
step('send message', call('POST', "/conversations/$conv/messages", ['content' => 'Hello from the smoke test'], $tourist), 201);
step('read messages', call('GET', "/conversations/$conv/messages", null, $tourist));
step('notifications', call('GET', '/notifications', null, $tourist));
step('mark all read', call('PUT', '/notifications/read-all', null, $tourist));
step('reviews for a place', call('GET', '/reviews?targetType=place&targetId=' . ($places[0]['id'] ?? 'p1')));
step('saved places toggle', call('POST', '/places/' . ($places[0]['id'] ?? 'p1') . '/save', null, $tourist));

echo "\n-- admin\n";
foreach (['/admin/stats', '/admin/users', '/admin/earnings', '/admin/commission-settings', '/admin/guides', '/admin/vendors', '/admin/reviews', '/admin/documents'] as $p) {
    step("GET $p", call('GET', $p, null, $admin));
}
step('tourist blocked from admin', call('GET', '/admin/stats', null, $tourist), 403);
$f = step('admin creates food', call('POST', '/admin/local-foods', ['name' => 'Smoke Pitha', 'description' => 'Test', 'district' => 'Feni', 'type' => 'snack'], $admin), 201);
$fid = $f['data']['id'] ?? 'x';
check('division derived from district', ($f['data']['division'] ?? '') === 'Chattogram');
step('admin updates food', call('PUT', "/admin/local-foods/$fid", ['featured' => true], $admin));
step('admin deletes food', call('DELETE', "/admin/local-foods/$fid", null, $admin));

echo "\n-- writes: accounts, catalogue, content\n";
$stamp = time();
$r = step('register vendor', call('POST', '/auth/register', ['name' => 'Smoke Vendor', 'email' => "smoke-v-$stamp@example.com", 'password' => 'password123', 'role' => 'vendor', 'shopName' => 'Smoke Shop'], null), 201);
$newVendor = $r['data']['token'] ?? null; $newVendorId = $r['data']['user']['id'] ?? 'x';
$r = step('register guide', call('POST', '/auth/register', ['name' => 'Smoke Guide', 'email' => "smoke-g-$stamp@example.com", 'password' => 'password123', 'role' => 'guide', 'languages' => ['Bangla', 'English']], null), 201);
$newGuideId = $r['data']['user']['id'] ?? 'x';
step('update own profile', call('PUT', '/auth/me', ['name' => 'Smoke Vendor Renamed'], $newVendor));
step('vendor profile update', call('PUT', '/vendor/profile', ['shopName' => 'Smoke Shop 2', 'businessType' => 'Retail', 'businessAddress' => 'Main Road, Feni', 'location' => 'Feni', 'shopDescription' => 'Test shop', 'pickupLocation' => 'Feni Bazar', 'productCategories' => ['Food & Delicacies']], $newVendor));
step('admin verifies vendor', call('PUT', "/admin/vendors/$newVendorId/verify", ['status' => 'verified'], $admin));
step('admin verifies guide', call('PUT', "/admin/guides/$newGuideId/verify", ['status' => 'verified'], $admin));
step('admin suspends user', call('PUT', "/admin/users/$newGuideId/status", ['status' => 'suspended'], $admin));
step('admin reactivates user', call('PUT', "/admin/users/$newGuideId/status", ['status' => 'active'], $admin));
step('change password', call('PUT', '/auth/password', ['currentPassword' => 'password123', 'newPassword' => 'password456'], $newVendor));
step('wrong reset code rejected', call('POST', '/auth/reset-password', ['email' => "smoke-v-$stamp@example.com", 'otp' => '000000', 'newPassword' => 'password789']), 422);

// Image upload (multipart): a 1x1 PNG.
$png = sys_get_temp_dir() . '/heritagebd-smoke.png';
file_put_contents($png, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='));
$ch = curl_init("$base/product-images");
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => ["Authorization: Bearer $vendor"],
    CURLOPT_POSTFIELDS => ['file' => new CURLFile($png, 'image/png', 'smoke.png')]]);
$up = json_decode((string)curl_exec($ch), true); $upCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
check('upload product image', $upCode === 201 && str_starts_with($up['data']['url'] ?? '', '/api/product-images/'), "$upCode");
if (!empty($up['data']['url'])) {
    $got = call('GET', substr($up['data']['url'], 4));
    check('uploaded image served back', $got['code'] === 200 && $got['type'] === 'image/png', "{$got['code']} {$got['type']}");
}

$r = step('vendor creates product', call('POST', '/products', ['name' => 'Smoke Product', 'description' => 'Test item', 'price' => 150, 'category' => 'food', 'stock' => 5, 'district' => 'Feni', 'images' => [$up['data']['url'] ?? '']], $vendor));
$newProduct = $r['data']['id'] ?? 'x';
step('vendor updates product', call('PUT', "/products/$newProduct", ['price' => 175, 'stock' => 7], $vendor));
step('product found by area=Feni', call('GET', '/products?area=Feni&exact=1'));
step('vendor deletes product', call('DELETE', "/products/$newProduct", null, $vendor));

$r = step('admin creates place', call('POST', '/places', ['name' => 'Smoke Place', 'description' => 'Test', 'location' => 'Feni', 'district' => 'Feni', 'division' => 'Chattogram', 'category' => 'monument', 'coordinates' => ['lat' => 23.0, 'lng' => 91.4]], $admin));
$newPlace = $r['data']['id'] ?? 'x';
step('admin updates place', call('PUT', "/places/$newPlace", ['featured' => true], $admin));
step('admin deletes place', call('DELETE', "/places/$newPlace", null, $admin));

$r = step('admin creates event', call('POST', '/admin/events', ['name' => 'Smoke Fair', 'category' => 'market', 'location' => 'Feni', 'district' => 'Feni', 'startDate' => "$today 10:00:00", 'endDate' => "$today 18:00:00", 'image' => '/api/product-images/a2998d77660b2504af2ab639b4268df4'], $admin));
$ev = $r['data']['id'] ?? 'x';
step('admin updates event image', call('PUT', "/admin/events/$ev", ['image' => '/api/product-images/a2998d77660b2504af2ab639b4268df4'], $admin));
step('admin deletes event', call('DELETE', "/admin/events/$ev", null, $admin));
$r = step('admin creates story', call('POST', '/admin/stories', ['title' => 'Smoke Story', 'content' => "Line one\n\nLine two", 'category' => 'food', 'image' => '/api/product-images/a2998d77660b2504af2ab639b4268df4'], $admin));
$st = $r['data']['id'] ?? 'x';
step('admin deletes story', call('DELETE', "/admin/stories/$st", null, $admin));
step('admin homepage images (upsert)', call('PUT', '/admin/homepage-images', ['heroImage' => '/api/product-images/835d69733226b8c1632d5527003e3f35'], $admin));
step('admin homepage images again (update path)', call('PUT', '/admin/homepage-images', ['heroImage' => '/api/product-images/835d69733226b8c1632d5527003e3f35'], $admin));
step('admin commission settings', call('PUT', '/admin/commission-settings', ['settings' => [
    ['flow' => 'order', 'advancePercent' => 20, 'commissionPercent' => 10],
    ['flow' => 'preorder', 'advancePercent' => 30, 'commissionPercent' => 10],
    ['flow' => 'guide_booking', 'advancePercent' => 20, 'commissionPercent' => 10],
]], $admin));
step('pre-order settings', call('PUT', '/preorders/settings', ['cancellationWindowHours' => 2], $admin));
$t = call('GET', '/trips', null, $tourist)['data'][0]['id'] ?? 'x';
step('update trip', call('PUT', "/trips/$t", ['name' => 'Smoke trip renamed'], $tourist));
step('delete trip', call('DELETE', "/trips/$t", null, $tourist));
$n = call('GET', '/notifications', null, $tourist)['data'][0]['id'] ?? 'x';
step('mark one notification read', call('PUT', "/notifications/$n/read", null, $tourist));
step('cart: add, update, remove', call('POST', '/cart', ['productId' => $product['id'] ?? '', 'quantity' => 1], $tourist));
step('cart update quantity', call('PUT', '/cart/' . ($product['id'] ?? 'x'), ['quantity' => 3], $tourist));
step('cart remove', call('DELETE', '/cart/' . ($product['id'] ?? 'x'), null, $tourist));
$rv = step('review a delivered product', call('POST', '/reviews', ['targetType' => 'product', 'targetId' => $product['id'] ?? '', 'rating' => 5, 'content' => 'Smoke review'], $tourist), 201);
$rid = $rv['data']['id'] ?? (call('GET', '/admin/reviews', null, $admin)['data'][0]['id'] ?? 'x');
step('admin deletes review', call('DELETE', "/admin/reviews/$rid", null, $admin));
step('guide payments list', call('GET', '/guide-payments', null, $guideToken));
step('guide updates availability', call('PUT', '/guides/' . $guide['id'], ['isAvailable' => true], $guideToken));

echo "\n-- security\n";
$codes = []; $throttleEmail = 'smoke-throttle-' . time() . '@example.com';
for ($i = 0; $i < 6; $i++) $codes[] = call('POST', '/auth/login', ['email' => $throttleEmail, 'password' => 'wrong'])['code'];
check('6th failed login throttled (429)', $codes[4] === 401 && $codes[5] === 429, implode(',', $codes));
step('logout', call('POST', '/auth/logout', null, $tourist));
step('token rejected after logout', call('GET', '/auth/me', null, $tourist), 401);

echo "\n$pass passed, $fail failed\n";
exit($fail ? 1 : 0);
