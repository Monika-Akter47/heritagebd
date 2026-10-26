<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Integration;

use CURLFile;

/** Uploads, vendor onboarding, local foods and homepage content: FR-01, FR-06, FR-07, FR-09, FR-20. */
final class ContentUploadTest extends ApiTestCase
{
    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    /** POSTs one file as multipart/form-data. */
    private function upload(string $path, string $content, string $mime, string $name, ?string $token, array $fields = []): array
    {
        $tmp = tempnam(sys_get_temp_dir(), 'hbd');
        file_put_contents($tmp, $content);
        $ch = curl_init(self::api() . $path);
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $token ? ["Authorization: Bearer $token"] : [],
            CURLOPT_POSTFIELDS => $fields + ['file' => new CURLFile($tmp, $mime, $name)]]);
        $raw = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        unlink($tmp);
        $json = json_decode((string)$raw, true);
        return ['code' => $code, 'data' => $json['data'] ?? null, 'message' => $json['message'] ?? ''];
    }

    /** TC-118 | FR-20 | Integration | EP | P1 | + */
    public function test_TC_118_vendor_uploads_a_product_image_that_is_served_back(): void
    {
        [$vendor] = $this->vendorWithPreorderProduct();

        $r = $this->upload('/product-images', base64_decode(self::PNG), 'image/png', 'pot.png', $vendor);

        $this->assertStatus(201, $r);
        $this->assertMatchesRegularExpression('#^/api/product-images/[a-f0-9]{32}$#', $r['data']['url']);
        $ch = curl_init(self::api() . substr($r['data']['url'], 4));
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true]);
        curl_exec($ch);
        $this->assertSame(['image/png', 200], [curl_getinfo($ch, CURLINFO_CONTENT_TYPE), (int)curl_getinfo($ch, CURLINFO_HTTP_CODE)]);
    }

    /** TC-119 | FR-20 | Integration | Error guessing | P1 | − */
    public function test_TC_119_non_image_disguised_as_png_and_anonymous_uploads_are_rejected(): void
    {
        [$vendor] = $this->vendorWithPreorderProduct();

        $this->assertStatus(422, $this->upload('/product-images', "<?php echo 'pwned';", 'image/png', 'shell.png', $vendor));
        $this->assertStatus(401, $this->upload('/product-images', base64_decode(self::PNG), 'image/png', 'a.png', null));
    }

    /** TC-120 | FR-01 | Integration | EP | P2 | + */
    public function test_TC_120_vendor_uploads_a_verification_document_that_only_admins_can_list(): void
    {
        [$vendor] = $this->register('vendor', ['shopName' => 'Doc Shop']);

        $r = $this->upload('/documents', base64_decode(self::PNG), 'image/png', 'nid.png', $vendor, ['documentType' => 'identity']);

        $this->assertContains($r['code'], [200, 201], $r['message']);
        $this->assertStatus(403, $this->call('GET', '/admin/documents', null, $vendor));
        $this->assertStatus(200, $this->call('GET', '/admin/documents', null, $this->login(self::ADMIN)));
    }

    /** TC-121 | FR-06 | Integration | EP | P2 | + */
    public function test_TC_121_vendor_completes_shop_profile(): void
    {
        [$vendor] = $this->register('vendor', ['shopName' => 'Profile Shop']);

        $r = $this->call('PUT', '/vendor/profile', ['shopName' => 'Profile Shop', 'businessType' => 'Handicraft', 'businessAddress' => 'Shankhari Bazar, Dhaka',
            'location' => 'Dhaka', 'shopDescription' => 'Conch shell crafts', 'pickupLocation' => 'Shankhari Bazar', 'productCategories' => ['Handicrafts']], $vendor);

        $this->assertStatus(200, $r);
        $this->assertSame('Shankhari Bazar', $this->call('GET', '/vendor/profile', null, $vendor)['data']['pickupLocation']);
    }

    /** TC-122 | FR-06 | Integration | EP | P2 | − */
    public function test_TC_122_incomplete_shop_profile_is_rejected(): void
    {
        [$vendor] = $this->register('vendor', ['shopName' => 'Half Shop']);

        $this->assertStatus(422, $this->call('PUT', '/vendor/profile', ['shopName' => 'Half Shop', 'productCategories' => []], $vendor));
    }

    /** TC-123 | FR-07 | Integration | EP | P2 | + */
    public function test_TC_123_local_foods_for_a_district_list_that_district_first_with_bangla_names(): void
    {
        $foods = $this->call('GET', '/local-foods?area=Cumilla')['data'];

        $this->assertSame('local', $foods[0]['areaMatch']);
        $this->assertSame('Cumilla', $foods[0]['district']);
        $this->assertMatchesRegularExpression('/\p{Bengali}/u', $foods[0]['nameLocal']);
    }

    /** TC-124 | FR-09 | Integration | State transition | P2 | + */
    public function test_TC_124_admin_adds_edits_and_removes_a_local_food(): void
    {
        $admin = $this->login(self::ADMIN);
        $r = $this->call('POST', '/admin/local-foods', ['name' => 'Feni Pitha', 'nameLocal' => 'ফেনীর পিঠা', 'description' => 'Rice cake', 'district' => 'Feni', 'type' => 'snack'], $admin);
        $this->assertStatus(201, $r);
        $this->assertSame('Chattogram', $r['data']['division']);      // derived from the district

        $this->assertStatus(200, $this->call('PUT', "/admin/local-foods/{$r['data']['id']}", ['featured' => true], $admin));
        $this->assertStatus(200, $this->call('DELETE', "/admin/local-foods/{$r['data']['id']}", null, $admin));
        $this->assertStatus(422, $this->call('POST', '/admin/local-foods', ['name' => 'X', 'description' => 'x', 'district' => 'Atlantis', 'type' => 'snack'], $admin));
    }

    /** TC-125 | FR-09 | Integration | EP | P3 | ± */
    public function test_TC_125_admin_sets_homepage_hero_image_and_rejects_invalid_urls(): void
    {
        $admin = $this->login(self::ADMIN);
        $hero = '/api/product-images/835d69733226b8c1632d5527003e3f35';

        $this->assertStatus(200, $this->call('PUT', '/admin/homepage-images', ['heroImage' => $hero], $admin));
        $this->assertSame($hero, $this->call('GET', '/site-content/homepage-images')['data']['heroImage']);
        $this->assertStatus(422, $this->call('PUT', '/admin/homepage-images', ['heroImage' => 'javascript:alert(1)'], $admin));
    }
}
