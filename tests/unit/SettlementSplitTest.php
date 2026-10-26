<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Unit;

use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../backend/helpers/earnings.php';

/**
 * compute_split(): how an amount is divided into the online advance, the platform commission, the
 * partner's released share and the cash balance. Amounts are in poisha (৳1 = 100 poisha).
 * Oracle: SRS §4.2.1 (30% advance, 70% at pickup; ৳1,000 → ৳300 / ৳700) and the configured terms.
 */
final class SettlementSplitTest extends TestCase
{
    /** TC-U01 | FR-28 | Unit | EP | P1 | + */
    public function test_TC_U01_srs_example_1000_taka_splits_into_300_advance_and_700_balance(): void
    {
        $split = compute_split(100000, 30, 10);

        $this->assertSame(30000, $split['advance']);   // ৳300 paid now
        $this->assertSame(70000, $split['cash']);      // ৳700 at pickup
        $this->assertSame(10000, $split['commission']);
        $this->assertSame(20000, $split['released']);  // advance minus commission goes to the vendor
        $this->assertSame(90000, $split['partnerTotal']);
    }

    /** TC-U02 | FR-28 | Unit | Decision table | P1 | + */
    #[DataProvider('flowTerms')]
    public function test_TC_U02_each_flow_uses_its_own_terms(int $gross, float $adv, float $comm, array $expected): void
    {
        $split = compute_split($gross, $adv, $comm);

        $this->assertSame($expected, [$split['advance'], $split['commission'], $split['released'], $split['cash'], $split['partnerTotal']]);
    }

    public static function flowTerms(): array
    {
        return [
            'order 20/10 on ৳8,500'          => [850000, 20, 10, [170000, 85000, 85000, 680000, 765000]],
            'pre-order 30/10 on ৳2,800'      => [280000, 30, 10, [84000, 28000, 56000, 196000, 252000]],
            'guide booking 20/10 on ৳7,000'  => [700000, 20, 10, [140000, 70000, 70000, 560000, 630000]],
        ];
    }

    /** TC-U03 | FR-28 | Unit | BVA | P2 | + */
    public function test_TC_U03_zero_amount_gives_all_zero_shares(): void
    {
        $split = compute_split(0, 30, 10);

        $this->assertSame([0, 0, 0, 0, 0], array_values($split));
    }

    /** TC-U04 | FR-28 | Unit | BVA | P2 | + */
    public function test_TC_U04_advance_equal_to_commission_releases_nothing_early(): void
    {
        $split = compute_split(100000, 10, 10);

        $this->assertSame(0, $split['released']);
        $this->assertSame(90000, $split['cash']);
    }

    /** TC-U05 | FR-28 | Unit | BVA | P2 | + */
    public function test_TC_U05_full_advance_leaves_no_cash_balance(): void
    {
        $split = compute_split(100000, 100, 10);

        $this->assertSame(0, $split['cash']);
        $this->assertSame(90000, $split['partnerTotal']);
    }

    /** TC-U06 | FR-28 | Unit | BVA | P2 | + */
    public function test_TC_U06_odd_poisha_amount_is_rounded_and_shares_still_add_up(): void
    {
        $split = compute_split(33333, 30, 10);   // ৳333.33

        $this->assertSame(10000, $split['advance']);  // 9999.9 rounds to 10000
        $this->assertSame(33333, $split['advance'] + $split['cash']);
    }

    /** TC-U07 | FR-28 | Unit | EP | P1 | − */
    #[DataProvider('invalidTerms')]
    public function test_TC_U07_rejects_invalid_amounts_or_percentages(int $gross, float $adv, float $comm): void
    {
        $this->expectException(InvalidArgumentException::class);

        compute_split($gross, $adv, $comm);
    }

    public static function invalidTerms(): array
    {
        return [
            'negative amount'              => [-1, 30, 10],
            'commission above advance'     => [100000, 10, 11],
            'advance above 100%'           => [100000, 101, 10],
            'negative commission'          => [100000, 30, -1],
        ];
    }
}
