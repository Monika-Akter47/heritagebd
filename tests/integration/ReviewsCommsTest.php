<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Integration;

use PHPUnit\Framework\Attributes\DataProvider;

/** Reviews, notifications and chat: FR-39 – FR-43 (SRS §4.7). */
final class ReviewsCommsTest extends ApiTestCase
{
    /** A tourist who bought and received a fresh product: [touristToken, productId]. */
    private function buyerOfNewProduct(): array
    {
        [$vendor] = $this->vendorWithPreorderProduct();
        $productId = $this->call('POST', '/products', ['name' => self::unique('Clay Pot'), 'description' => 'Pottery', 'price' => 250,
            'category' => 'pottery', 'stock' => 5, 'district' => 'Dhaka'], $vendor)['data']['id'];
        [$tourist] = $this->register('tourist');
        $this->call('POST', '/cart', ['productId' => $productId], $tourist);
        $orderId = $this->call('POST', '/orders', ['paymentMethod' => 'card', 'shippingAddress' => ['name' => 'B', 'phone' => '01712345678',
            'address' => 'R', 'city' => 'Dhaka', 'district' => 'Dhaka', 'division' => 'Dhaka']], $tourist)['data']['orders'][0]['id'];
        $this->call('PUT', "/orders/$orderId", ['status' => 'confirmed', 'estimatedDelivery' => date('Y-m-d', strtotime('+2 days'))], $vendor);
        foreach (['preparing', 'shipped', 'out_for_delivery', 'delivered'] as $s) $this->call('PUT', "/orders/$orderId", ['status' => $s], $vendor);
        $this->assertStatus(200, $this->call('PUT', "/orders/$orderId", ['status' => 'completed'], $tourist));
        return [$tourist, $productId];
    }

    /** TC-98 | FR-39 | Integration | EP | P1 | + */
    public function test_TC_98_buyer_reviews_a_purchased_product(): void
    {
        [$tourist, $productId] = $this->buyerOfNewProduct();

        $r = $this->call('POST', '/reviews', ['targetType' => 'product', 'targetId' => $productId, 'rating' => 4, 'title' => 'Good', 'content' => 'Well made'], $tourist);

        $this->assertStatus(201, $r);
    }

    /** TC-99 | FR-39 | Integration | BVA | P1 | − */
    #[DataProvider('ratings')]
    public function test_TC_99_rating_must_be_between_1_and_5(int $rating, int $expected): void
    {
        [$tourist, $productId] = $this->buyerOfNewProduct();

        $this->assertStatus($expected, $this->call('POST', '/reviews', ['targetType' => 'product', 'targetId' => $productId, 'rating' => $rating, 'content' => 'x'], $tourist));
    }

    public static function ratings(): array
    {
        return ['0 (min-1)' => [0, 422], '1 (min)' => [1, 201], '5 (max)' => [5, 201], '6 (max+1)' => [6, 422]];
    }

    /** TC-100 | FR-39 | Integration | EP | P2 | − */
    public function test_TC_100_second_review_of_the_same_item_and_review_without_purchase_are_refused(): void
    {
        [$tourist, $productId] = $this->buyerOfNewProduct();
        $this->call('POST', '/reviews', ['targetType' => 'product', 'targetId' => $productId, 'rating' => 5, 'content' => 'First'], $tourist);
        [$stranger] = $this->register('tourist');

        $this->assertStatus(409, $this->call('POST', '/reviews', ['targetType' => 'product', 'targetId' => $productId, 'rating' => 1, 'content' => 'Again'], $tourist));
        $this->assertStatus(403, $this->call('POST', '/reviews', ['targetType' => 'product', 'targetId' => $productId, 'rating' => 1, 'content' => 'Never bought'], $stranger));
    }

    /** TC-101 | FR-39 | Integration | EP | P2 | + */
    public function test_TC_101_tourist_can_review_a_heritage_place(): void
    {
        [$tourist] = $this->register('tourist');

        // SRS FR-39: users review "places, products and guides".
        $r = $this->call('POST', '/reviews', ['targetType' => 'place', 'targetId' => 'p1', 'rating' => 5, 'content' => 'Beautiful fort'], $tourist);

        $this->assertStatus(201, $r);
    }

    /** TC-102 | FR-40 | Integration | EP | P1 | + */
    public function test_TC_102_average_rating_and_count_are_recalculated(): void
    {
        [$a, $productId] = $this->buyerOfNewProduct();
        $this->call('POST', '/reviews', ['targetType' => 'product', 'targetId' => $productId, 'rating' => 5, 'content' => 'x'], $a);

        $p = $this->call('GET', "/products/$productId")['data'];

        $this->assertSame(1, $p['reviewCount']);
        $this->assertEquals(5.0, $p['rating']);
    }

    /** TC-103 | FR-41 | Integration | EP | P2 | + */
    public function test_TC_103_reviews_are_listed_with_user_date_rating_and_comment(): void
    {
        $reviews = $this->call('GET', '/reviews?targetType=guide&targetId=g1')['data'];

        $this->assertNotEmpty($reviews);
        foreach (['rating', 'content', 'createdAt'] as $f) $this->assertArrayHasKey($f, $reviews[0]);
        $this->assertTrue(isset($reviews[0]['userName']) || isset($reviews[0]['user']['name']), 'reviewer name');
    }

    /** TC-104 | FR-42 | Integration | State transition | P1 | + */
    public function test_TC_104_notifications_are_created_and_can_be_marked_read(): void
    {
        [$tourist] = $this->register('tourist');
        $this->call('PUT', '/auth/password', ['currentPassword' => self::PASSWORD, 'newPassword' => 'Changed12345'], $tourist);   // creates a notification
        $list = $this->call('GET', '/notifications', null, $tourist)['data'];
        $this->assertNotEmpty($list);
        $this->assertFalse($list[0]['read']);

        $this->assertStatus(200, $this->call('PUT', "/notifications/{$list[0]['id']}/read", null, $tourist));
        $this->assertTrue($this->call('GET', '/notifications', null, $tourist)['data'][0]['read']);
        $this->assertStatus(200, $this->call('PUT', '/notifications/read-all', null, $tourist));
    }

    /** TC-105 | FR-42 | Integration | EP | P2 | − */
    public function test_TC_105_user_cannot_mark_someone_elses_notification(): void
    {
        $foreign = self::db()->query("SELECT id FROM notifications WHERE is_read = 0 LIMIT 1")->fetchColumn();
        [$intruder] = $this->register('tourist');

        $this->call('PUT', "/notifications/$foreign/read", null, $intruder);

        $this->assertSame(0, (int)self::db()->query("SELECT is_read FROM notifications WHERE id = '$foreign'")->fetchColumn());
    }

    /** TC-106 | FR-43 | Integration | Use case | P1 | + */
    public function test_TC_106_chat_message_raises_unread_count_until_read(): void
    {
        [$tourist] = $this->register('tourist');
        $guide = $this->login(self::GUIDE);
        $guideId = $this->call('GET', '/auth/me', null, $guide)['data']['user']['id'];
        $conv = $this->call('POST', '/conversations', ['participantId' => $guideId], $tourist)['data']['id'];

        $this->assertStatus(201, $this->call('POST', "/conversations/$conv/messages", ['content' => 'Assalamu alaikum, are you free on Friday?'], $tourist));
        $mine = fn() => array_values(array_filter($this->call('GET', '/conversations', null, $guide)['data'], fn($c) => $c['id'] === $conv))[0];
        $this->assertSame(1, $mine()['unreadCount']);

        $msgs = $this->call('GET', "/conversations/$conv/messages", null, $guide)['data'];
        $this->assertSame('Assalamu alaikum, are you free on Friday?', end($msgs)['content']);
        $this->assertSame(0, $mine()['unreadCount']);
    }

    /** TC-107 | FR-43 | Integration | EP | P2 | − */
    public function test_TC_107_empty_message_is_rejected(): void
    {
        [$tourist] = $this->register('tourist');
        $conv = $this->call('POST', '/conversations', ['participantId' => 'g1'], $tourist)['data']['id'];

        $this->assertStatus(422, $this->call('POST', "/conversations/$conv/messages", ['content' => '   '], $tourist));
    }
}
