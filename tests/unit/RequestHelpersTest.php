<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Unit;

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../backend/helpers/response.php';
require_once __DIR__ . '/../../backend/helpers/auth.php';

/** Request/response and token helpers shared by every endpoint. */
final class RequestHelpersTest extends TestCase
{
    /** TC-U16 | FR-20 | Unit | EP | P2 | + */
    public function test_TC_U16_own_upload_paths_and_https_urls_are_accepted_as_images(): void
    {
        $this->assertTrue(is_image_ref('/api/product-images/' . str_repeat('a', 32)));
        $this->assertTrue(is_image_ref('https://example.com/photo.jpg'));
    }

    /** TC-U17 | FR-20 | Unit | EP | P1 | − */
    public function test_TC_U17_scripts_other_schemes_and_malformed_paths_are_not_images(): void
    {
        $this->assertFalse(is_image_ref('javascript:alert(1)'));
        $this->assertFalse(is_image_ref('ftp://example.com/a.jpg'));
        $this->assertFalse(is_image_ref('/api/product-images/NOT-HEX'));
        $this->assertFalse(is_image_ref(''));
    }

    /** TC-U18 | FR-20 | Unit | BVA | P3 | − */
    public function test_TC_U18_image_reference_longer_than_500_chars_is_rejected(): void
    {
        $base = 'https://example.com/';
        $this->assertTrue(is_image_ref($base . str_repeat('a', 500 - strlen($base))));
        $this->assertFalse(is_image_ref($base . str_repeat('a', 501 - strlen($base))));
    }

    /** TC-U19 | FR-15 | Unit | EP | P2 | + */
    public function test_TC_U19_json_booleans_become_0_or_1_at_any_depth(): void
    {
        $this->assertSame(['a' => 1, 'b' => 0, 'n' => ['c' => 1], 's' => 'x'], normalize_bools(['a' => true, 'b' => false, 'n' => ['c' => true], 's' => 'x']));
    }

    /** TC-U20 | FR-02 | Unit | EP | P1 | + */
    public function test_TC_U20_only_a_sha256_hash_of_the_token_is_stored(): void
    {
        $token = str_repeat('ab', 32);

        $this->assertSame(hash('sha256', $token), token_hash($token));
        $this->assertNotSame($token, token_hash($token));
    }

    /** TC-U21 | FR-30 | Unit | EP | P2 | + */
    public function test_TC_U21_generated_ids_are_prefixed_and_unique(): void
    {
        $ids = array_map(fn() => id_with_prefix('po'), range(1, 200));

        $this->assertMatchesRegularExpression('/^po_[a-f0-9]{16}$/', $ids[0]);
        $this->assertCount(200, array_unique($ids));
    }
}
