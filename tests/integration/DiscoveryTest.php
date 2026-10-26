<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Integration;

/** Heritage discovery and map data: FR-07, FR-08, FR-10, FR-11, FR-21 (SRS §4.1, §6.1). */
final class DiscoveryTest extends ApiTestCase
{
    /** TC-40 | FR-07 | Integration | EP | P1 | + */
    public function test_TC_40_places_filter_by_category_and_division(): void
    {
        $forts = $this->call('GET', '/places?category=fort')['data'];
        $sylhet = $this->call('GET', '/places?division=Sylhet')['data'];

        $this->assertNotEmpty($forts);
        $this->assertSame(['fort'], array_values(array_unique(array_column($forts, 'category'))));
        $this->assertSame(['Sylhet'], array_values(array_unique(array_column($sylhet, 'division'))));
    }

    /** TC-41 | FR-07 | Integration | EP | P2 | + */
    public function test_TC_41_search_is_case_insensitive(): void
    {
        $lower = array_column($this->call('GET', '/places?search=lalbagh')['data'], 'id');
        $upper = array_column($this->call('GET', '/places?search=LALBAGH')['data'], 'id');

        $this->assertNotEmpty($lower);
        $this->assertSame($lower, $upper);
    }

    /** TC-42 | FR-07 | Integration | EP | P2 | − */
    public function test_TC_42_search_with_no_match_returns_an_empty_list_not_an_error(): void
    {
        $r = $this->call('GET', '/places?search=zzqqxx-no-such-place');

        $this->assertStatus(200, $r);
        $this->assertSame([], $r['data']);
    }

    /** TC-43 | FR-07 | Integration | BVA | P2 | + */
    public function test_TC_43_list_limit_is_capped_at_200(): void
    {
        $this->assertLessThanOrEqual(200, count($this->call('GET', '/products?limit=100000')['data']));
        $this->assertCount(1, $this->call('GET', '/products?limit=1')['data']);
    }

    /** TC-44 | FR-07 | Integration | EP | P3 | + */
    public function test_TC_44_upcoming_events_end_today_or_later(): void
    {
        $events = $this->call('GET', '/events?upcoming=1')['data'];

        foreach ($events as $e) $this->assertGreaterThanOrEqual(date('Y-m-d'), substr($e['endDate'], 0, 10));
        $this->assertStatus(200, $this->call('GET', '/stories?category=food'));
    }

    /** TC-45 | FR-08 | Integration | EP | P1 | + */
    public function test_TC_45_place_detail_has_the_fields_listed_in_the_srs(): void
    {
        $p = $this->call('GET', '/places/p1')['data'];

        foreach (['images', 'description', 'historicalBackground', 'significance', 'visitInfo', 'tags', 'nearbyAttractions', 'coordinates'] as $field) {
            $this->assertArrayHasKey($field, $p, "place detail lacks $field");
        }
        $this->assertArrayHasKey('entryFee', $p['visitInfo']);
        $this->assertArrayHasKey('bestTime', $p['visitInfo']);
    }

    /** TC-46 | FR-08 | Integration | EP | P2 | − */
    public function test_TC_46_unknown_place_returns_404(): void
    {
        $this->assertStatus(404, $this->call('GET', '/places/no-such-place'));
    }

    /** TC-47 | FR-10 | Integration | EP | P2 | + */
    public function test_TC_47_categories_report_the_number_of_places(): void
    {
        $categories = $this->call('GET', '/categories')['data'];
        $forts = array_values(array_filter($categories, fn($c) => $c['id'] === 'fort'))[0];

        $this->assertSame((int)self::db()->query("SELECT COUNT(*) FROM heritage_places WHERE category = 'fort'")->fetchColumn(), (int)$forts['count']);
    }

    /** TC-48 | FR-11 | Integration | EP | P1 | + */
    public function test_TC_48_every_place_has_coordinates_inside_bangladesh_for_the_map(): void
    {
        foreach ($this->call('GET', '/places')['data'] as $p) {
            $this->assertGreaterThan(20.5, $p['coordinates']['lat'], $p['name']);
            $this->assertLessThan(26.7, $p['coordinates']['lat'], $p['name']);
            $this->assertGreaterThan(88.0, $p['coordinates']['lng'], $p['name']);
            $this->assertLessThan(92.7, $p['coordinates']['lng'], $p['name']);
        }
    }

    /** TC-49 | FR-21 | Integration | EP | P1 | + */
    public function test_TC_49_products_filter_by_category_and_price_range(): void
    {
        $food = $this->call('GET', '/products?category=food&minPrice=100&maxPrice=500')['data'];

        $this->assertNotEmpty($food);
        foreach ($food as $p) {
            $this->assertSame('food', $p['category']);
            $this->assertGreaterThanOrEqual(100, $p['price']);
            $this->assertLessThanOrEqual(500, $p['price']);
        }
    }

    /** TC-50 | FR-21 | Integration | EP | P2 | + */
    public function test_TC_50_products_sort_by_price_ascending_and_descending(): void
    {
        $asc = array_column($this->call('GET', '/products?sort=price_asc')['data'], 'price');
        $desc = array_column($this->call('GET', '/products?sort=price_desc')['data'], 'price');

        $sorted = $asc; sort($sorted);
        $this->assertSame($sorted, $asc);
        $this->assertSame(array_reverse($sorted), $desc);
    }

    /** TC-51 | FR-21 | Integration | EP | P2 | + */
    public function test_TC_51_preorder_filter_returns_only_eligible_in_stock_products(): void
    {
        foreach ($this->call('GET', '/products?preorder=1')['data'] as $p) {
            $this->assertTrue($p['preOrderEnabled'] ?? $p['preorderEnabled'] ?? false, $p['name']);
            $this->assertGreaterThan(0, $p['stock']);
        }
    }
}
