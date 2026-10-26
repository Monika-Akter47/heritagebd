<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Unit;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../backend/helpers/response.php';
require_once __DIR__ . '/../../backend/helpers/payments.php';

/**
 * Payer wallet number for manual bKash/Nagad payments (FR-29 advance, FR-33 remaining payment).
 * Oracle: Bangladeshi mobile numbers are 11 digits, 01 + operator digit 3–9 + 8 digits, optionally
 * written with the +880 / 880 country code, spaces or dashes.
 */
final class PaymentProofTest extends TestCase
{
    /** TC-U08 | FR-29 | Unit | EP | P1 | + */
    #[DataProvider('validNumbers')]
    public function test_TC_U08_valid_bangladeshi_mobile_numbers_are_normalised(string $input, string $expected): void
    {
        $this->assertSame($expected, normalize_bd_phone($input));
    }

    public static function validNumbers(): array
    {
        return [
            'plain'                 => ['01712345678', '01712345678'],
            '+880 with spaces'      => ['+880 1712-345678', '01712345678'],
            '880 prefix'            => ['8801912345678', '01912345678'],
            'lowest operator (013)' => ['01312345678', '01312345678'],
            'highest operator (019)'=> ['01912345678', '01912345678'],
        ];
    }

    /** TC-U09 | FR-29 | Unit | BVA | P1 | − */
    #[DataProvider('invalidNumbers')]
    public function test_TC_U09_invalid_numbers_are_rejected(string $input): void
    {
        $this->assertNull(normalize_bd_phone($input));
    }

    public static function invalidNumbers(): array
    {
        return [
            '10 digits (one short)'   => ['0171234567'],
            '12 digits (one long)'    => ['017123456789'],
            'operator 2 (below 3)'    => ['01212345678'],
            'not starting 01'         => ['02712345678'],
            'letters'                 => ['01712abc678'],
            'empty'                   => [''],
        ];
    }
}
