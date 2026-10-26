<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Integration;

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Role-based access control and ownership: FR-03, FR-49, SRS §5.3 ("role-based guards on protected
 * endpoints", "prevention of unauthorized modification of pre-order status and payment records").
 * Also the OWASP "broken access control" checks: user A cannot read or change user B's data.
 */
final class AccessControlTest extends ApiTestCase
{
    /** TC-20 | FR-49 | Integration | EP | P1 | − */
    #[DataProvider('protectedEndpoints')]
    public function test_TC_20_protected_endpoints_return_401_without_a_token(string $method, string $path): void
    {
        $this->assertStatus(401, $this->call($method, $path));
    }

    public static function protectedEndpoints(): array
    {
        return [
            ['GET', '/auth/me'], ['GET', '/cart'], ['GET', '/orders'], ['GET', '/preorders'], ['GET', '/bookings'],
            ['GET', '/trips'], ['GET', '/notifications'], ['GET', '/conversations'], ['GET', '/earnings/me'], ['GET', '/admin/stats'],
        ];
    }

    /** TC-21 | FR-03 | Integration | Decision table | P1 | − */
    #[DataProvider('roleMatrix')]
    public function test_TC_21_each_role_is_refused_endpoints_of_other_roles(string $email, string $method, string $path, ?array $body): void
    {
        $this->assertStatus(403, $this->call($method, $path, $body, $this->login($email)));
    }

    public static function roleMatrix(): array
    {
        return [
            'tourist → admin stats'        => [self::TOURIST, 'GET', '/admin/stats', null],
            'tourist → admin users'        => [self::TOURIST, 'GET', '/admin/users', null],
            'tourist → create product'     => [self::TOURIST, 'POST', '/products', ['name' => 'x', 'description' => 'x', 'price' => 1, 'category' => 'food', 'stock' => 1]],
            'guide → admin payments'       => [self::GUIDE, 'GET', '/admin/payments', null],
            'guide → create pre-order'     => [self::GUIDE, 'POST', '/preorders', ['productId' => 'po-1', 'pickupDate' => '2030-01-01', 'pickupTime' => '10:00 AM', 'quantity' => 1]],
            'tourist → pre-order settings' => [self::TOURIST, 'PUT', '/preorders/settings', ['cancellationWindowHours' => 99]],
            'tourist → earnings'           => [self::TOURIST, 'GET', '/earnings/me', null],
        ];
    }

    /** TC-22 | FR-49 | Integration | Error guessing | P1 | − */
    public function test_TC_22_tourist_cannot_read_another_tourists_preorder(): void
    {
        [, , $productId] = $this->vendorWithPreorderProduct();
        [$ownerToken] = $this->register('tourist');
        $preorderId = $this->createPreorder($productId, $ownerToken)['data']['id'];
        [$otherToken] = $this->register('tourist');

        $this->assertStatus(403, $this->call('GET', "/preorders/$preorderId", null, $otherToken));
        $this->assertStatus(403, $this->call('PUT', "/preorders/$preorderId", ['status' => 'cancelled', 'cancellationReason' => 'x'], $otherToken));
    }

    /** TC-23 | FR-49 | Integration | Error guessing | P1 | − */
    public function test_TC_23_tourist_cannot_read_another_tourists_order(): void
    {
        [$ownerToken] = $this->register('tourist');
        $productId = (string)self::db()->query("SELECT id FROM products WHERE stock > 5 AND preorder_enabled = 0 ORDER BY id LIMIT 1")->fetchColumn();
        $this->assertStatus(200, $this->call('POST', '/cart', ['productId' => $productId, 'quantity' => 1], $ownerToken));
        $order = $this->call('POST', '/orders', ['paymentMethod' => 'card', 'shippingAddress' => [
            'name' => 'Owner', 'phone' => '01712345678', 'address' => 'Road 1', 'city' => 'Dhaka', 'district' => 'Dhaka', 'division' => 'Dhaka']], $ownerToken);
        $this->assertStatus(201, $order);
        $orderId = $order['data']['orders'][0]['id'];
        [$intruder] = $this->register('tourist');

        $r = $this->call('GET', "/orders/$orderId", null, $intruder);

        $this->assertContains($r['code'], [403, 404], "HTTP {$r['code']}");
    }

    /** TC-24 | FR-49 | Integration | Error guessing | P1 | − */
    public function test_TC_24_tourist_cannot_read_another_users_conversation(): void
    {
        $conversationId = (string)self::db()->query('SELECT id FROM conversations ORDER BY id LIMIT 1')->fetchColumn();
        [$intruder] = $this->register('tourist');

        $r = $this->call('GET', "/conversations/$conversationId/messages", null, $intruder);

        $this->assertContains($r['code'], [403, 404], "HTTP {$r['code']}");
    }

    /** TC-25 | FR-49 | Integration | Error guessing | P1 | − */
    public function test_TC_25_guide_cannot_edit_another_guides_profile(): void
    {
        $r = $this->call('PUT', '/guides/g2', ['bio' => 'hijacked'], $this->login(self::GUIDE));

        $this->assertStatus(403, $r);
        $this->assertNotSame('hijacked', self::db()->query("SELECT bio FROM guides WHERE user_id = 'g2'")->fetchColumn());
    }

    /** TC-26 | FR-49 | Integration | Error guessing | P1 | − */
    public function test_TC_26_vendor_cannot_edit_another_vendors_product(): void
    {
        [$vendorA] = $this->vendorWithPreorderProduct();
        [, , $productOfB] = $this->vendorWithPreorderProduct();

        $this->assertStatus(403, $this->call('PUT', "/products/$productOfB", ['price' => 1], $vendorA));
    }

    /** TC-27 | FR-49 | Integration | Error guessing | P1 | − */
    public function test_TC_27_tourist_cannot_advance_their_own_preorder_to_vendor_only_states(): void
    {
        [, , $productId] = $this->vendorWithPreorderProduct();
        [$tourist] = $this->register('tourist');
        $id = $this->createPreorder($productId, $tourist)['data']['id'];

        $this->assertStatus(403, $this->call('PUT', "/preorders/$id", ['status' => 'vendor_accepted'], $tourist));
    }
}
