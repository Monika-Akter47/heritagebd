<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Unit;

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../backend/helpers/response.php';
require_once __DIR__ . '/../../backend/helpers/areas.php';

/**
 * resolve_area(): the district / division filter behind product and food browsing (FR-07, FR-21)
 * and destination-based pre-order discovery (FR-26). Oracle: Bangladesh's 8 divisions / 64 districts.
 */
final class AreaResolverTest extends TestCase
{
    /** TC-U10 | FR-26 | Unit | EP | P1 | + */
    public function test_TC_U10_division_name_resolves_to_whole_division(): void
    {
        $area = resolve_area('Sylhet');

        $this->assertSame('division', $area['type']);
        $this->assertSame(['Habiganj', 'Moulvibazar', 'Sunamganj', 'Sylhet'], $area['districts']);
    }

    /** TC-U11 | FR-26 | Unit | EP | P1 | + */
    public function test_TC_U11_old_spelling_resolves_to_current_district(): void
    {
        $this->assertSame('Chattogram', resolve_area('Chittagong')['name']);
        $this->assertSame('Cumilla', resolve_area('comilla')['name']);
    }

    /** TC-U12 | FR-26 | Unit | EP | P2 | + */
    public function test_TC_U12_landmark_inside_destination_name_resolves_to_its_district(): void
    {
        $area = resolve_area('Srimangal Tea Gardens');

        $this->assertSame('Moulvibazar', $area['name']);
        $this->assertSame('Sylhet', $area['division']);
    }

    /** TC-U13 | FR-26 | Unit | EP | P2 | + */
    public function test_TC_U13_prefer_district_keeps_same_named_district(): void
    {
        $area = resolve_area('Sylhet', true);

        $this->assertSame('district', $area['type']);
        $this->assertSame(['Sylhet'], $area['districts']);
    }

    /** TC-U14 | FR-21 | Unit | EP | P2 | − */
    public function test_TC_U14_unknown_or_blank_area_resolves_to_null(): void
    {
        $this->assertNull(resolve_area('Atlantis'));
        $this->assertNull(resolve_area('   '));
    }

    /** TC-U15 | FR-21 | Unit | EP | P3 | + */
    public function test_TC_U15_district_query_is_widened_to_its_division_unless_exact(): void
    {
        $area = resolve_area('Feni');

        $this->assertContains('Cumilla', area_query_terms($area, false)['broad']);
        $this->assertSame(['Feni'], area_query_terms($area, true)['broad']);
    }
}
