<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Integration;

/** Administration: FR-04, FR-09, FR-44, FR-45, FR-46, FR-47 (SRS §4.8). */
final class AdminTest extends ApiTestCase
{
    /** TC-28 | FR-04 | Integration | State transition | P1 | + */
    public function test_TC_28_approving_a_pending_guide_makes_it_verified_active_and_notifies_it(): void
    {
        [$guideToken, $guide] = $this->register('guide');

        $this->assertStatus(200, $this->call('PUT', "/admin/guides/{$guide['id']}/verify", ['status' => 'verified'], $this->login(self::ADMIN)));

        $me = $this->call('GET', '/auth/me', null, $guideToken)['data']['user'];
        $this->assertSame('active', $me['status']);
        $this->assertTrue($me['verified']);
        $titles = array_column($this->call('GET', '/notifications', null, $guideToken)['data'], 'title');
        $this->assertContains('Verification update', $titles);
    }

    /** TC-128 | FR-04 | Integration | Use case | P1 | + */
    public function test_TC_128_admin_is_notified_when_a_guide_or_vendor_submits_for_verification(): void
    {
        $admin = $this->login(self::ADMIN);
        [$guideToken, $guide] = $this->register('guide');
        [$vendorToken] = $this->register('vendor', ['shopName' => 'Notify Shop']);

        $this->assertStatus(200, $this->call('PUT', "/guides/{$guide['id']}", ['bio' => 'Old Dhaka walks', 'location' => 'Dhaka', 'pricePerDay' => 2500,
            'tourTypes' => [['name' => 'Walk', 'duration' => '1 day', 'price' => 2500]]], $guideToken));
        $this->assertStatus(200, $this->call('PUT', '/vendor/profile', ['shopName' => 'Notify Shop', 'businessType' => 'Food', 'businessAddress' => 'Dhaka',
            'location' => 'Dhaka', 'shopDescription' => 'Pitha', 'pickupLocation' => 'Lalbagh', 'productCategories' => ['Handicrafts']], $vendorToken));

        $titles = array_column($this->call('GET', '/notifications', null, $admin)['data'], 'title');
        $this->assertContains('Guide verification request', $titles);
        $this->assertContains('Vendor verification request', $titles);
    }

    /** TC-29 | FR-04 | Integration | State transition | P1 | − */
    public function test_TC_29_rejecting_a_pending_vendor_suspends_the_account(): void
    {
        [, $vendor] = $this->register('vendor', ['shopName' => 'Reject Me']);

        $this->assertStatus(200, $this->call('PUT', "/admin/vendors/{$vendor['id']}/verify", ['status' => 'rejected'], $this->login(self::ADMIN)));

        $this->assertStatus(403, $this->call('POST', '/auth/login', ['email' => $vendor['email'], 'password' => self::PASSWORD]));
    }

    /** TC-30 | FR-04 | Integration | EP | P2 | − */
    public function test_TC_30_verification_status_must_be_verified_or_rejected(): void
    {
        [, $guide] = $this->register('guide');

        $this->assertStatus(422, $this->call('PUT', "/admin/guides/{$guide['id']}/verify", ['status' => 'maybe'], $this->login(self::ADMIN)));
    }

    /** TC-31 | FR-04 | Integration | EP | P1 | − */
    public function test_TC_31_only_an_admin_can_verify(): void
    {
        [, $guide] = $this->register('guide');

        $this->assertStatus(403, $this->call('PUT', "/admin/guides/{$guide['id']}/verify", ['status' => 'verified'], $this->login(self::GUIDE)));
    }

    /** TC-32 | FR-44 | Integration | EP | P2 | + */
    public function test_TC_32_admin_lists_users_filtered_by_role(): void
    {
        $r = $this->call('GET', '/admin/users?role=guide', null, $this->login(self::ADMIN));

        $this->assertStatus(200, $r);
        $this->assertNotEmpty($r['data']);
        $this->assertSame(['guide'], array_values(array_unique(array_column($r['data'], 'role'))));
    }

    /** TC-33 | FR-44 | Integration | State transition | P1 | + */
    public function test_TC_33_admin_suspends_and_reinstates_a_user(): void
    {
        [$token, $user] = $this->register('tourist');
        $admin = $this->login(self::ADMIN);

        $this->assertStatus(200, $this->call('PUT', "/admin/users/{$user['id']}/status", ['status' => 'suspended'], $admin));
        $this->assertStatus(401, $this->call('GET', '/auth/me', null, $token));        // live session stops working
        $this->assertStatus(200, $this->call('PUT', "/admin/users/{$user['id']}/status", ['status' => 'active'], $admin));
        $this->assertStatus(200, $this->call('POST', '/auth/login', ['email' => $user['email'], 'password' => self::PASSWORD]));
    }

    /** TC-34 | FR-45 | Integration | EP | P2 | + */
    public function test_TC_34_admin_sees_preorders_of_every_tourist(): void
    {
        $r = $this->call('GET', '/preorders', null, $this->login(self::ADMIN));

        $this->assertStatus(200, $r);
        $this->assertGreaterThan(1, count(array_unique(array_column($r['data'], 'touristId'))));
    }

    /** TC-35 | FR-46 | Integration | EP | P1 | + */
    public function test_TC_35_statistics_counters_match_the_database(): void
    {
        $r = $this->call('GET', '/admin/stats', null, $this->login(self::ADMIN));
        $this->assertStatus(200, $r);
        $count = fn(string $sql) => (int)self::db()->query($sql)->fetchColumn();

        $this->assertSame($count('SELECT COUNT(*) FROM users'), (int)$r['data']['totalUsers']);
        $this->assertSame($count("SELECT COUNT(*) FROM guides WHERE verification_status = 'pending'"), (int)$r['data']['pendingGuides']);
        $this->assertSame($count('SELECT COUNT(*) FROM heritage_places'), (int)$r['data']['totalPlaces']);
        $this->assertSame($count('SELECT COUNT(*) FROM preorders'), (int)$r['data']['totalPreorders']);
        $this->assertArrayHasKey('revenueThisMonth', $r['data']);
    }

    /** TC-36 | FR-47 | Integration | EP | P2 | + */
    public function test_TC_36_reports_provide_12_month_series_and_breakdown_by_flow(): void
    {
        $r = $this->call('GET', '/admin/earnings', null, $this->login(self::ADMIN));

        $this->assertStatus(200, $r);
        $this->assertNotEmpty($r['data']['byMonth']);
        $this->assertArrayHasKey('month', $r['data']['byMonth'][0]);
        $this->assertArrayHasKey('grossSettled', $r['data']['totals']);
        $this->assertArrayHasKey('preorder', $r['data']['byFlow']);   // seed has a settled pre-order
        $this->assertNotEmpty($this->call('GET', '/admin/stats', null, $this->login(self::ADMIN))['data']['monthly']);
    }

    /** TC-37 | FR-09 | Integration | State transition | P2 | + */
    public function test_TC_37_admin_creates_updates_and_deletes_a_place(): void
    {
        $admin = $this->login(self::ADMIN);
        $r = $this->call('POST', '/places', ['name' => 'Test Fort', 'description' => 'Test', 'location' => 'Feni', 'district' => 'Feni',
            'division' => 'Chattogram', 'category' => 'fort', 'coordinates' => ['lat' => 23.01, 'lng' => 91.40]], $admin);
        $this->assertContains($r['code'], [200, 201], $r['message']);
        $id = $r['data']['id'];

        $this->assertStatus(200, $this->call('PUT', "/places/$id", ['visitInfo' => ['entryFee' => '৳20']], $admin));
        $this->assertSame('৳20', $this->call('GET', "/places/$id")['data']['visitInfo']['entryFee']);
        $this->assertStatus(200, $this->call('DELETE', "/places/$id", null, $admin));
        $this->assertStatus(404, $this->call('GET', "/places/$id"));
    }

    /** TC-38 | FR-09 | Integration | EP | P2 | − */
    public function test_TC_38_non_admin_cannot_create_places_events_or_stories(): void
    {
        $tourist = $this->login(self::TOURIST);

        $this->assertStatus(403, $this->call('POST', '/places', ['name' => 'X'], $tourist));
        $this->assertStatus(403, $this->call('POST', '/admin/events', ['name' => 'X'], $tourist));
        $this->assertStatus(403, $this->call('POST', '/admin/stories', ['title' => 'X'], $tourist));
    }

    /** TC-39 | FR-09 | Integration | EP | P3 | + */
    public function test_TC_39_admin_creates_and_deletes_an_event_and_a_story(): void
    {
        $admin = $this->login(self::ADMIN);
        $img = '/api/product-images/a2998d77660b2504af2ab639b4268df4';
        $event = $this->call('POST', '/admin/events', ['name' => 'Test Mela', 'category' => 'market', 'location' => 'Feni', 'district' => 'Feni',
            'startDate' => '2030-01-01 10:00:00', 'endDate' => '2030-01-01 18:00:00', 'image' => $img], $admin);
        $story = $this->call('POST', '/admin/stories', ['title' => 'Test Story', 'content' => 'Body', 'category' => 'food', 'image' => $img], $admin);

        $this->assertContains($event['code'], [200, 201], $event['message']);
        $this->assertContains($story['code'], [200, 201], $story['message']);
        $this->assertStatus(200, $this->call('DELETE', "/admin/events/{$event['data']['id']}", null, $admin));
        $this->assertStatus(200, $this->call('DELETE', "/admin/stories/{$story['data']['id']}", null, $admin));
    }
}
