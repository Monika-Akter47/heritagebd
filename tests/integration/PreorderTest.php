<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Integration;

use PHPUnit\Framework\Attributes\DataProvider;

/** "Ready When You Arrive" pre-orders: FR-25 – FR-35, FR-37 (SRS §4.2, payment model §4.2.1, timeline §4.2.4). */
final class PreorderTest extends ApiTestCase
{
    /** Walks a fresh pre-order to $until; returns [preorder, vendorToken, touristToken]. */
    private function preorderAt(string $until, float $price = 1000): array
    {
        [$vendor, , $productId] = $this->vendorWithPreorderProduct(10, $price);
        [$tourist] = $this->register('tourist');
        $po = $this->createPreorder($productId, $tourist)['data'];
        $steps = ['vendor_accepted' => $vendor, 'preparing' => $vendor, 'ready_for_pickup' => $vendor, 'arrived' => $tourist,
                  'qr_verified' => $vendor, 'pickup_payment_pending' => $vendor];
        foreach ($steps as $status => $who) {
            if ($po['status'] === $until) break;
            $body = ['status' => $status] + ($status === 'qr_verified' ? ['qrCode' => $po['qrCode']] : []);
            $r = $this->call('PUT', "/preorders/{$po['id']}", $body, $who);
            $this->assertStatus(200, $r);
            $po = $r['data'] + ['qrCode' => $po['qrCode']];
        }
        return [$po, $vendor, $tourist];
    }

    /** TC-76 | FR-25 | Integration | EP | P1 | − */
    public function test_TC_76_preorder_eligible_product_requires_preparation_time_and_pickup_location(): void
    {
        [$vendor] = $this->vendorWithPreorderProduct();
        $base = ['name' => 'PO', 'description' => 'x', 'price' => 100, 'category' => 'food', 'stock' => 5, 'preOrderEnabled' => true];

        $this->assertStatus(422, $this->call('POST', '/products', $base, $vendor));   // no preparation time
    }

    /** TC-77 | FR-25 | Integration | EP | P2 | − */
    public function test_TC_77_tourist_cannot_preorder_a_product_that_is_not_preorder_enabled(): void
    {
        $productId = (string)self::db()->query('SELECT id FROM products WHERE preorder_enabled = 0 AND stock > 0 LIMIT 1')->fetchColumn();
        [$tourist] = $this->register('tourist');

        $this->assertStatus(422, $this->createPreorder($productId, $tourist));
    }

    /** TC-78 | FR-26 | Integration | EP | P1 | + */
    public function test_TC_78_preorder_products_are_listed_for_a_destination_area(): void
    {
        $products = $this->call('GET', '/products?' . http_build_query(['preorder' => 1, 'area' => 'Lalbagh Fort, Dhaka']))['data'];

        $this->assertNotEmpty($products);
        foreach ($products as $p) $this->assertGreaterThan(0, $p['stock']);
    }

    /** TC-79 | FR-27 | Integration | BVA | P1 | − */
    #[DataProvider('badQuantities')]
    public function test_TC_79_quantity_must_be_a_whole_number_within_stock(mixed $qty): void
    {
        [, , $productId] = $this->vendorWithPreorderProduct(3);
        [$tourist] = $this->register('tourist');

        $this->assertContains($this->createPreorder($productId, $tourist, ['quantity' => $qty])['code'], [409, 422]);
    }

    public static function badQuantities(): array
    {
        return ['zero' => [0], 'negative' => [-1], 'fraction' => [1.5], 'stock + 1' => [4]];
    }

    /** TC-80 | FR-28 | Integration | EP | P1 | + */
    public function test_TC_80_preorder_stores_30_percent_advance_and_70_percent_remaining(): void
    {
        [, , $productId] = $this->vendorWithPreorderProduct(10, 1000);
        [$tourist] = $this->register('tourist');

        $po = $this->createPreorder($productId, $tourist)['data'];

        $this->assertEquals(1000, $po['totalAmount']);
        $this->assertEquals(300, $po['advancePaid']);
        $this->assertEquals(700, $po['remainingAmount']);
        $this->assertSame(30, $po['advancePercent']);
    }

    /** TC-81 | FR-29 | Integration | EP | P1 | + */
    public function test_TC_81_advance_is_recorded_with_method_payer_number_and_trxid(): void
    {
        [, , $productId] = $this->vendorWithPreorderProduct();
        [$tourist] = $this->register('tourist');

        $r = $this->createPreorder($productId, $tourist, ['advancePaymentMethod' => 'nagad', 'advancePayerPhone' => '+880 1812-345678', 'advanceTransactionId' => 'ab12cd34ef']);

        $this->assertStatus(201, $r);
        $this->assertSame('advance_paid', $r['data']['status']);
        $this->assertSame('nagad', $r['data']['advancePaymentMethod']);
        $this->assertSame('01812345678', $r['data']['advancePayerPhone']);
        $this->assertSame('AB12CD34EF', $r['data']['advanceTransactionId']);
    }

    /** TC-82 | FR-29 | Integration | EP | P1 | − */
    #[DataProvider('badProof')]
    public function test_TC_82_wallet_advance_without_valid_number_or_trxid_is_rejected(array $proof): void
    {
        [, , $productId] = $this->vendorWithPreorderProduct();
        [$tourist] = $this->register('tourist');

        $this->assertStatus(422, $this->createPreorder($productId, $tourist, $proof));
    }

    public static function badProof(): array
    {
        return [
            'missing number' => [['advancePayerPhone' => '']],
            'missing TrxID'  => [['advanceTransactionId' => '']],
            'invalid number' => [['advancePayerPhone' => '0171234567']],
            'TrxID 5 chars'  => [['advanceTransactionId' => 'AB12C']],
            'TrxID 21 chars' => [['advanceTransactionId' => str_repeat('A', 21)]],
        ];
    }

    /** TC-83 | FR-29 | Integration | BVA | P2 | + */
    public function test_TC_83_trxid_of_6_and_20_characters_and_card_without_proof_are_accepted(): void
    {
        [, , $productId] = $this->vendorWithPreorderProduct();
        [$tourist] = $this->register('tourist');

        $this->assertStatus(201, $this->createPreorder($productId, $tourist, ['advanceTransactionId' => 'AB12CD']));
        $this->assertStatus(201, $this->createPreorder($productId, $tourist, ['advanceTransactionId' => str_repeat('B', 20)]));
        $this->assertStatus(201, $this->createPreorder($productId, $tourist, ['advancePaymentMethod' => 'card', 'advancePayerPhone' => '', 'advanceTransactionId' => '']));
    }

    /** TC-84 | FR-30 | Integration | EP | P1 | + */
    public function test_TC_84_each_preorder_gets_a_unique_order_number_and_qr_code(): void
    {
        [, , $productId] = $this->vendorWithPreorderProduct();
        [$tourist] = $this->register('tourist');

        $a = $this->createPreorder($productId, $tourist)['data'];
        $b = $this->createPreorder($productId, $tourist)['data'];

        $this->assertMatchesRegularExpression('/^HB\d{6}[A-Z0-9]{5}$/', $a['orderNumber']);
        $this->assertNotSame($a['orderNumber'], $b['orderNumber']);
        $this->assertNotSame($a['qrCode'], $b['qrCode']);
    }

    /** TC-85 | FR-31 | Integration | State transition | P1 | + */
    public function test_TC_85_vendor_moves_preorder_to_ready_and_tourist_is_notified(): void
    {
        [$po, , $tourist] = $this->preorderAt('ready_for_pickup');

        $this->assertSame('ready_for_pickup', $po['status']);
        $this->assertContains('Pre-order update', array_column($this->call('GET', '/notifications', null, $tourist)['data'], 'title'));
    }

    /** TC-86 | FR-31 | Integration | State transition | P1 | − */
    public function test_TC_86_vendor_cannot_skip_from_accepted_to_ready(): void
    {
        [$po, $vendor] = $this->preorderAt('vendor_accepted');

        $this->assertStatus(422, $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'ready_for_pickup'], $vendor));
    }

    /** TC-87 | FR-32 | Integration | EP | P1 | − */
    public function test_TC_87_wrong_qr_code_is_rejected(): void
    {
        [$po, $vendor] = $this->preorderAt('arrived');

        $this->assertStatus(422, $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'qr_verified', 'qrCode' => 'HERITAGEBD-PREORDER-forged'], $vendor));
    }

    /** TC-88 | FR-32 | Integration | State transition | P1 | − */
    public function test_TC_88_qr_code_can_be_used_only_once(): void
    {
        [$po, $vendor] = $this->preorderAt('qr_verified');

        $again = $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'qr_verified', 'qrCode' => $po['qrCode']], $vendor);

        $this->assertContains($again['code'], [409, 422]);
    }

    /** TC-127 | FR-32 | Integration | EP | P1 | + */
    public function test_TC_127_vendor_can_verify_with_the_short_pickup_code_the_tourist_sees(): void
    {
        [$po, $vendor, $tourist] = $this->preorderAt('ready_for_pickup');
        $code = $this->call('GET', "/preorders/{$po['id']}", null, $tourist)['data']['pickupCode'];
        $this->assertMatchesRegularExpression('/^[A-Z0-9]{8}$/', $code);
        $this->assertArrayNotHasKey('pickupCode', $this->call('GET', "/preorders/{$po['id']}", null, $vendor)['data']);

        $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'arrived'], $vendor);
        // typed by hand: lower case with a space in the middle
        $typed = strtolower(substr($code, 0, 4) . ' ' . substr($code, 4));
        $this->assertStatus(200, $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'qr_verified', 'qrCode' => $typed], $vendor));
    }

    /** TC-89 | FR-33 | Integration | State transition | P1 | + */
    public function test_TC_89_remaining_payment_by_bkash_is_recorded_and_tourist_confirms_receipt(): void
    {
        [$po, $vendor, $tourist] = $this->preorderAt('pickup_payment_pending');

        $r = $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'picked_up', 'pickupPaymentMethod' => 'bkash',
            'pickupPayerPhone' => '01912345678', 'pickupTransactionId' => 'PICK12345'], $vendor);
        $this->assertStatus(200, $r);
        $this->assertEquals(0, $r['data']['remainingAmount']);
        $this->assertSame('PICK12345', $r['data']['pickupTransactionId']);

        $done = $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'completed'], $tourist);
        $this->assertStatus(200, $done);
        $this->assertSame('released', self::db()->query("SELECT advance_status FROM preorders WHERE id = '{$po['id']}'")->fetchColumn());
    }

    /** TC-90 | FR-33 | Integration | EP | P1 | − */
    public function test_TC_90_wallet_pickup_payment_needs_payer_number_and_trxid(): void
    {
        [$po, $vendor] = $this->preorderAt('pickup_payment_pending');

        $this->assertStatus(422, $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'picked_up', 'pickupPaymentMethod' => 'nagad'], $vendor));
        $this->assertStatus(200, $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'picked_up', 'pickupPaymentMethod' => 'cash'], $vendor));
    }

    /** TC-91 | FR-34 | Integration | State transition | P1 | + */
    public function test_TC_91_cancellation_before_preparation_refunds_advance_and_restores_stock(): void
    {
        [$po, , $tourist] = $this->preorderAt('vendor_accepted');
        $stockBefore = (int)self::db()->query("SELECT stock FROM products WHERE id = (SELECT product_id FROM preorders WHERE id = '{$po['id']}')")->fetchColumn();

        $r = $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'cancelled', 'cancellationReason' => 'Change of plans'], $tourist);

        $this->assertStatus(200, $r);
        $this->assertSame('refunded', self::db()->query("SELECT advance_status FROM preorders WHERE id = '{$po['id']}'")->fetchColumn());
        $this->assertSame($stockBefore + 1, (int)self::db()->query("SELECT stock FROM products WHERE id = (SELECT product_id FROM preorders WHERE id = '{$po['id']}')")->fetchColumn());
    }

    /** TC-92 | FR-34 | Integration | State transition | P1 | − */
    public function test_TC_92_tourist_cannot_cancel_once_preparation_has_begun(): void
    {
        [$po, , $tourist] = $this->preorderAt('preparing');

        $r = $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'cancelled', 'cancellationReason' => 'Too late'], $tourist);

        $this->assertContains($r['code'], [403, 409, 422], 'SRS FR-34: cancellation only before preparation begins');
    }

    /** TC-93 | FR-34 | Integration | EP | P1 | + */
    public function test_TC_93_refund_amount_follows_the_configured_refund_percentage(): void
    {
        [$po, , $tourist] = $this->preorderAt('vendor_accepted', 1000);   // advance ৳300; seed refund policy 80%

        $r = $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'cancelled', 'cancellationReason' => 'Change of plans'], $tourist);

        $this->assertEquals(240, $r['data']['refundAmount'], 'SRS FR-34: refund = 80% of the ৳300 advance');
    }

    /** TC-126 | FR-34 | Integration | Error guessing | P1 | − */
    public function test_TC_126_tourist_cannot_choose_their_own_refund_amount(): void
    {
        [$po, , $tourist] = $this->preorderAt('vendor_accepted', 1000);

        $r = $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'cancelled', 'cancellationReason' => 'x', 'refundAmount' => 99999], $tourist);

        $this->assertStatus(200, $r);
        $this->assertEquals(240, $r['data']['refundAmount']);
    }

    /** TC-94 | FR-34 | Integration | EP | P2 | − */
    public function test_TC_94_cancellation_needs_a_reason(): void
    {
        [$po, , $tourist] = $this->preorderAt('vendor_accepted');

        $this->assertStatus(422, $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'cancelled'], $tourist));
    }

    /** TC-95 | FR-35 | Integration | EP | P1 | + */
    public function test_TC_95_admin_updates_preorder_settings_and_they_are_served_publicly(): void
    {
        $admin = $this->login(self::ADMIN);

        $this->assertStatus(200, $this->call('PUT', '/preorders/settings', ['cancellationWindowHours' => 3, 'advanceRefundPercent' => 75, 'maxPickupTimeSlots' => 5], $admin));
        $s = $this->call('GET', '/preorders/settings')['data'];
        $this->assertSame(3, $s['cancellationWindowHours']);
        $this->assertSame(75, $s['advanceRefundPercent']);
        $this->assertSame(5, $s['maxPickupTimeSlots']);
        $this->call('PUT', '/preorders/settings', ['cancellationWindowHours' => 2, 'advanceRefundPercent' => 80, 'maxPickupTimeSlots' => 6], $admin);
    }

    /** TC-96 | FR-35 | Integration | BVA | P2 | − */
    public function test_TC_96_refund_percentage_outside_0_to_100_is_rejected(): void
    {
        $admin = $this->login(self::ADMIN);

        $this->assertStatus(422, $this->call('PUT', '/preorders/settings', ['advanceRefundPercent' => 101], $admin));
        $this->assertStatus(422, $this->call('PUT', '/preorders/settings', ['advanceRefundPercent' => -1], $admin));
        $this->call('PUT', '/preorders/settings', ['advanceRefundPercent' => 80], $admin);
    }

    /** TC-97 | FR-37 | Integration | State transition | P1 | + */
    public function test_TC_97_full_timeline_reaches_completed_through_every_srs_state(): void
    {
        [$po, $vendor] = $this->preorderAt('pickup_payment_pending');
        $this->assertStatus(200, $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'picked_up', 'pickupPaymentMethod' => 'cash'], $vendor));
        $this->assertStatus(200, $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'completed'], $vendor));

        $this->assertSame('completed', $this->call('GET', "/preorders/{$po['id']}", null, $vendor)['data']['status']);
    }
}
