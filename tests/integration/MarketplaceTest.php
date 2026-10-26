<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Integration;

/** Marketplace and delivery orders: FR-20 – FR-24, FR-36, FR-38 (SRS §4.4, business rules §5.5). */
final class MarketplaceTest extends ApiTestCase
{
    private const ADDRESS = ['name' => 'Test Buyer', 'phone' => '01712345678', 'address' => 'House 1, Road 2',
        'city' => 'Dhaka', 'district' => 'Dhaka', 'division' => 'Dhaka'];

    /** Verified vendor with one delivery product: [vendorToken, productId]. */
    private function vendorProduct(int $stock = 5, float $price = 400): array
    {
        [$vendor, , ] = $this->vendorWithPreorderProduct();
        $r = $this->call('POST', '/products', ['name' => self::unique('Nakshi Kantha'), 'description' => 'Hand embroidered',
            'price' => $price, 'category' => 'handicraft', 'stock' => $stock, 'district' => 'Dhaka', 'tags' => ['textile'],
            'specifications' => ['Material' => 'Cotton']], $vendor);
        $this->assertContains($r['code'], [200, 201], $r['message']);
        return [$vendor, $r['data']['id']];
    }

    private function checkout(string $tourist, string $productId, int $qty = 1): array
    {
        $this->call('DELETE', '/cart', null, $tourist);
        $this->assertStatus(200, $this->call('POST', '/cart', ['productId' => $productId, 'quantity' => $qty], $tourist));
        return $this->call('POST', '/orders', ['paymentMethod' => 'card', 'shippingAddress' => self::ADDRESS], $tourist);
    }

    /** TC-64 | FR-20 | Integration | State transition | P1 | + */
    public function test_TC_64_vendor_adds_edits_and_deletes_a_product_with_tags_and_specs(): void
    {
        [$vendor, $id] = $this->vendorProduct();
        $p = $this->call('GET', "/products/$id")['data'];
        $this->assertContains('textile', $p['tags']);

        $this->assertStatus(200, $this->call('PUT', "/products/$id", ['price' => 450, 'stock' => 9], $vendor));
        $this->assertEquals(450, $this->call('GET', "/products/$id")['data']['price']);
        $this->assertStatus(200, $this->call('DELETE', "/products/$id", null, $vendor));
        $this->assertStatus(404, $this->call('GET', "/products/$id"));
    }

    /** TC-65 | FR-20 | Integration | BVA | P1 | − */
    public function test_TC_65_price_must_be_above_zero_and_stock_not_negative(): void
    {
        [$vendor] = $this->vendorWithPreorderProduct();
        $base = ['name' => 'Bad', 'description' => 'x', 'category' => 'food'];

        $this->assertStatus(422, $this->call('POST', '/products', $base + ['price' => 0, 'stock' => 1], $vendor));
        $this->assertStatus(422, $this->call('POST', '/products', $base + ['price' => 1, 'stock' => -1], $vendor));
        $this->assertStatus(422, $this->call('POST', '/products', ['category' => 'weapons', 'price' => 1, 'stock' => 1] + $base, $vendor));
        $ok = $this->call('POST', '/products', $base + ['price' => 0.01, 'stock' => 0], $vendor);
        $this->assertContains($ok['code'], [200, 201], 'smallest valid price and zero stock are allowed');
    }

    /** TC-66 | FR-22 | Integration | State transition | P1 | + */
    public function test_TC_66_cart_add_merges_update_remove_and_clear(): void
    {
        [, $productId] = $this->vendorProduct();
        [$tourist] = $this->register('tourist');

        $this->call('POST', '/cart', ['productId' => $productId, 'quantity' => 1], $tourist);
        $this->call('POST', '/cart', ['productId' => $productId, 'quantity' => 2], $tourist);
        $this->assertSame(3, $this->call('GET', '/cart', null, $tourist)['data'][0]['quantity']);
        $this->assertStatus(200, $this->call('PUT', "/cart/$productId", ['quantity' => 1], $tourist));
        $this->assertSame(1, $this->call('GET', '/cart', null, $tourist)['data'][0]['quantity']);
        $this->assertStatus(200, $this->call('DELETE', "/cart/$productId", null, $tourist));
        $this->assertSame([], $this->call('GET', '/cart', null, $tourist)['data']);
    }

    /** TC-67 | FR-22 | Integration | EP | P2 | − */
    public function test_TC_67_unknown_product_cannot_be_added_to_cart(): void
    {
        [$tourist] = $this->register('tourist');

        $this->assertStatus(404, $this->call('POST', '/cart', ['productId' => 'no-such-product'], $tourist));
    }

    /** TC-68 | FR-23 | Integration | Use case | P1 | + */
    public function test_TC_68_checkout_creates_order_clears_cart_and_holds_the_advance(): void
    {
        [, $productId] = $this->vendorProduct(5, 400);
        [$tourist] = $this->register('tourist');

        $r = $this->checkout($tourist, $productId, 2);

        $this->assertStatus(201, $r);
        $order = $r['data']['orders'][0];
        $this->assertSame('placed', $order['status']);
        $this->assertEquals(920, $order['totalAmount']);              // 2 × ৳400 + ৳120 delivery
        $this->assertEquals(184, $order['advanceAmount']);            // 20% advance (payment terms)
        $this->assertSame('held', $order['advanceStatus']);
        $this->assertSame([], $this->call('GET', '/cart', null, $tourist)['data']);
    }

    /** TC-69 | FR-23 | Integration | EP | P1 | − */
    public function test_TC_69_checkout_with_empty_cart_or_missing_address_is_rejected(): void
    {
        [$tourist] = $this->register('tourist');

        $this->assertStatus(422, $this->call('POST', '/orders', ['paymentMethod' => 'card', 'shippingAddress' => self::ADDRESS], $tourist));
        [, $productId] = $this->vendorProduct();
        $this->call('POST', '/cart', ['productId' => $productId], $tourist);
        $this->assertStatus(422, $this->call('POST', '/orders', ['paymentMethod' => 'card', 'shippingAddress' => ['name' => 'X'] + array_fill_keys(['phone', 'address', 'city', 'district', 'division'], '')], $tourist));
    }

    /** TC-70 | FR-24 | Integration | BVA | P1 | − */
    public function test_TC_70_checkout_fails_when_quantity_exceeds_stock_and_stock_is_unchanged(): void
    {
        [, $productId] = $this->vendorProduct(3);
        [$tourist] = $this->register('tourist');

        $this->assertContains($this->checkout($tourist, $productId, 4)['code'], [409, 422]);   // stock + 1
        $this->assertSame(3, $this->call('GET', "/products/$productId")['data']['stock']);
    }

    /** TC-71 | FR-24 | Integration | BVA | P1 | + */
    public function test_TC_71_buying_exactly_the_remaining_stock_succeeds_and_decrements_to_zero(): void
    {
        [, $productId] = $this->vendorProduct(3);
        [$tourist] = $this->register('tourist');

        $this->assertStatus(201, $this->checkout($tourist, $productId, 3));
        $this->assertSame(0, $this->call('GET', "/products/$productId")['data']['stock']);
    }

    /** TC-72 | FR-36 | Integration | State transition | P1 | + */
    public function test_TC_72_delivery_order_moves_through_the_srs_states_to_completed(): void
    {
        [$vendor, $productId] = $this->vendorProduct();
        [$tourist] = $this->register('tourist');
        $id = $this->checkout($tourist, $productId)['data']['orders'][0]['id'];

        $this->assertStatus(200, $this->call('PUT', "/orders/$id", ['status' => 'confirmed', 'estimatedDelivery' => date('Y-m-d', strtotime('+3 days'))], $vendor));
        foreach (['preparing', 'shipped', 'out_for_delivery', 'delivered'] as $s) {
            $this->assertStatus(200, $this->call('PUT', "/orders/$id", ['status' => $s], $vendor));
        }
        $this->assertStatus(200, $this->call('PUT', "/orders/$id", ['status' => 'completed'], $tourist));
        $this->assertSame('completed', $this->call('GET', "/orders/$id", null, $tourist)['data']['status']);
    }

    /** TC-73 | FR-36 | Integration | State transition | P1 | − */
    public function test_TC_73_vendor_cannot_skip_states_or_release_the_advance(): void
    {
        [$vendor, $productId] = $this->vendorProduct();
        [$tourist] = $this->register('tourist');
        $id = $this->checkout($tourist, $productId)['data']['orders'][0]['id'];

        $this->assertContains($this->call('PUT', "/orders/$id", ['status' => 'delivered'], $vendor)['code'], [403, 422]);
        $this->assertStatus(403, $this->call('PUT', "/orders/$id", ['status' => 'completed'], $vendor));
    }

    /** TC-74 | FR-36 | Integration | EP | P2 | + */
    public function test_TC_74_order_has_a_tracking_number_and_estimated_delivery(): void
    {
        [, $productId] = $this->vendorProduct();
        [$tourist] = $this->register('tourist');

        $order = $this->checkout($tourist, $productId)['data']['orders'][0];

        // SRS §4.4: "A tracking number and an estimated delivery date (five days after placement) are stored."
        $this->assertNotEmpty($order['trackingNumber'], 'tracking number');
        $this->assertSame(date('Y-m-d', strtotime('+5 days')), substr((string)$order['estimatedDelivery'], 0, 10));
    }

    /** TC-75 | FR-38 | Integration | EP | P1 | + */
    public function test_TC_75_order_history_is_role_aware(): void
    {
        [$vendor, $productId] = $this->vendorProduct();
        [$tourist] = $this->register('tourist');
        $id = $this->checkout($tourist, $productId)['data']['orders'][0]['id'];

        $this->assertSame([$id], array_column($this->call('GET', '/orders', null, $tourist)['data'], 'id'));
        $this->assertContains($id, array_column($this->call('GET', '/orders', null, $vendor)['data'], 'id'));
        $this->assertContains($id, array_column($this->call('GET', '/orders', null, $this->login(self::ADMIN))['data'], 'id'));
        $this->assertNotContains($id, array_column($this->call('GET', '/orders', null, $this->login(self::TOURIST))['data'], 'id'));
    }
}
