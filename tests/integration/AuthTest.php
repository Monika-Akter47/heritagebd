<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Integration;

use PHPUnit\Framework\Attributes\DataProvider;

/** User management and authentication: SRS §4.5, FR-01, FR-02, FR-05, FR-06, FR-48; business rules §5.5. */
final class AuthTest extends ApiTestCase
{
    /** TC-01 | FR-01 | Integration | EP | P1 | + */
    public function test_TC_01_tourist_registration_is_active_immediately_and_returns_token(): void
    {
        $email = self::unique('reg') . '@example.com';

        $r = $this->call('POST', '/auth/register', ['name' => 'Rafi', 'email' => $email, 'password' => 'Secret123', 'role' => 'tourist', 'phone' => '01712345678']);

        $this->assertStatus(201, $r);
        $this->assertSame('active', $r['data']['user']['status']);
        $this->assertSame('tourist', $r['data']['user']['role']);
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $r['data']['token']);   // 256-bit token (SRS §3.3)
    }

    /** TC-02 | FR-01 | Integration | EP | P1 | + */
    public function test_TC_02_vendor_and_guide_registrations_start_pending_verification(): void
    {
        [, $vendor] = $this->register('vendor', ['shopName' => 'Pending Shop', 'nidNumber' => '1234567890', 'tradeLicense' => 'TL-1']);
        [, $guide] = $this->register('guide', ['nidNumber' => '1234567890', 'guideLicense' => 'GL-1', 'languages' => ['Bangla']]);

        $this->assertSame('pending', $vendor['status']);
        $this->assertSame('pending', $guide['status']);
        $row = self::db()->query("SELECT nid_number, trade_license, verification_status FROM vendors WHERE user_id = '{$vendor['id']}'")->fetch();
        $this->assertSame(['nid_number' => '1234567890', 'trade_license' => 'TL-1', 'verification_status' => 'pending'], $row);
    }

    /** TC-03 | FR-01 | Integration | BVA | P1 | − */
    #[DataProvider('passwordLengths')]
    public function test_TC_03_password_shorter_than_8_characters_is_rejected(string $password, int $expected): void
    {
        $r = $this->call('POST', '/auth/register', ['name' => 'X', 'email' => self::unique('pw') . '@example.com', 'password' => $password, 'role' => 'tourist']);

        $this->assertStatus($expected, $r);
    }

    public static function passwordLengths(): array
    {
        return ['7 chars (min-1)' => ['Abc1234', 422], '8 chars (min)' => ['Abc12345', 201], '9 chars (min+1)' => ['Abc123456', 201], 'empty' => ['', 422]];
    }

    /** TC-04 | FR-01 | Integration | EP | P1 | − */
    public function test_TC_04_second_account_with_same_email_is_rejected_case_insensitively(): void
    {
        [, $user] = $this->register('tourist');

        $r = $this->call('POST', '/auth/register', ['name' => 'Dup', 'email' => strtoupper($user['email']), 'password' => 'Secret123', 'role' => 'tourist']);

        $this->assertStatus(409, $r);
    }

    /** TC-05 | FR-01 | Integration | EP | P1 | − */
    public function test_TC_05_admin_role_cannot_self_register(): void
    {
        $r = $this->call('POST', '/auth/register', ['name' => 'Mallory', 'email' => self::unique('adm') . '@example.com', 'password' => 'Secret123', 'role' => 'admin']);

        $this->assertStatus(403, $r);
    }

    /** TC-06 | FR-01 | Integration | EP | P2 | − */
    #[DataProvider('badRegistrations')]
    public function test_TC_06_invalid_registration_input_is_rejected(array $body): void
    {
        $r = $this->call('POST', '/auth/register', $body + ['name' => 'X', 'email' => self::unique('bad') . '@example.com', 'password' => 'Secret123', 'role' => 'tourist']);

        $this->assertStatus(422, $r);
    }

    public static function badRegistrations(): array
    {
        return [
            'malformed email'      => [['email' => 'not-an-email']],
            'unknown role'         => [['role' => 'superuser']],
            'phone not BD mobile'  => [['phone' => '12345']],
            'blank name'           => [['name' => '   ']],
        ];
    }

    /** TC-07 | FR-02 | Integration | EP | P1 | + */
    public function test_TC_07_valid_login_returns_user_and_token_usable_on_me(): void
    {
        $r = $this->call('POST', '/auth/login', ['email' => self::TOURIST, 'password' => self::PASSWORD]);
        $this->assertStatus(200, $r);

        $me = $this->call('GET', '/auth/me', null, $r['data']['token']);

        $this->assertStatus(200, $me);
        $this->assertSame(self::TOURIST, $me['data']['user']['email']);
        $this->assertArrayNotHasKey('password_hash', $me['data']['user']);
    }

    /** TC-08 | FR-02 | Integration | EP | P1 | − */
    public function test_TC_08_wrong_password_and_unknown_email_get_the_same_401(): void
    {
        $wrong = $this->call('POST', '/auth/login', ['email' => self::TOURIST_2, 'password' => 'wrong-password']);
        $unknown = $this->call('POST', '/auth/login', ['email' => self::unique('nobody') . '@example.com', 'password' => 'whatever1']);

        $this->assertStatus(401, $wrong);
        $this->assertStatus(401, $unknown);
        $this->assertSame($wrong['message'], $unknown['message']);   // does not reveal which accounts exist
    }

    /** TC-09 | FR-02 | Integration | State transition | P1 | − */
    public function test_TC_09_sixth_failed_login_within_15_minutes_is_throttled(): void
    {
        $email = self::unique('throttle') . '@example.com';
        $codes = [];
        for ($i = 0; $i < 6; $i++) {
            $codes[] = $this->call('POST', '/auth/login', ['email' => $email, 'password' => 'wrong'])['code'];
        }

        $this->assertSame([401, 401, 401, 401, 401, 429], $codes);
    }

    /** TC-10 | FR-02 | Integration | State transition | P1 | − */
    public function test_TC_10_suspended_account_cannot_log_in(): void
    {
        [, $user] = $this->register('tourist');
        $this->assertStatus(200, $this->call('PUT', "/admin/users/{$user['id']}/status", ['status' => 'suspended'], $this->login(self::ADMIN)));

        $r = $this->call('POST', '/auth/login', ['email' => $user['email'], 'password' => self::PASSWORD]);

        $this->assertStatus(403, $r);
    }

    /** TC-11 | FR-48 | Integration | State transition | P1 | − */
    public function test_TC_11_logout_revokes_the_token(): void
    {
        [$token] = $this->register('tourist');
        $this->assertStatus(200, $this->call('POST', '/auth/logout', null, $token));

        $this->assertStatus(401, $this->call('GET', '/auth/me', null, $token));
    }

    /** TC-12 | FR-48 | Integration | BVA | P1 | − */
    public function test_TC_12_expired_token_is_rejected(): void
    {
        [$token, $user] = $this->register('tourist');
        self::db()->prepare("UPDATE auth_tokens SET expires_at = NOW() - INTERVAL '1 second' WHERE user_id = ?")->execute([$user['id']]);

        $this->assertStatus(401, $this->call('GET', '/auth/me', null, $token));
    }

    /** TC-13 | FR-05 | Integration | EP | P1 | + */
    public function test_TC_13_valid_otp_resets_password_and_signs_out_old_sessions(): void
    {
        [$oldToken, $user] = $this->register('tourist');
        self::db()->prepare('INSERT INTO password_resets (email, otp_code, expires_at) VALUES (?, ?, ?)')
            ->execute([$user['email'], password_hash('482913', PASSWORD_DEFAULT), date('Y-m-d H:i:s', time() + 15 * 60)]);

        $r = $this->call('POST', '/auth/reset-password', ['email' => $user['email'], 'otp' => '482913', 'newPassword' => 'NewSecret99']);

        $this->assertStatus(200, $r);
        $this->assertStatus(200, $this->call('POST', '/auth/login', ['email' => $user['email'], 'password' => 'NewSecret99']));
        $this->assertStatus(401, $this->call('GET', '/auth/me', null, $oldToken));
    }

    /** TC-14 | FR-05 | Integration | BVA | P1 | − */
    public function test_TC_14_otp_older_than_15_minutes_is_rejected(): void
    {
        [, $user] = $this->register('tourist');
        self::db()->prepare('INSERT INTO password_resets (email, otp_code, expires_at) VALUES (?, ?, ?)')
            ->execute([$user['email'], password_hash('111222', PASSWORD_DEFAULT), date('Y-m-d H:i:s', time() - 1)]);

        $r = $this->call('POST', '/auth/reset-password', ['email' => $user['email'], 'otp' => '111222', 'newPassword' => 'NewSecret99']);

        $this->assertStatus(422, $r);
    }

    /** TC-15 | FR-05 | Integration | EP | P2 | − */
    #[DataProvider('badOtps')]
    public function test_TC_15_otp_must_be_exactly_six_digits(string $otp): void
    {
        $r = $this->call('POST', '/auth/reset-password', ['email' => 'someone@example.com', 'otp' => $otp, 'newPassword' => 'NewSecret99']);

        $this->assertStatus(422, $r);
    }

    public static function badOtps(): array
    {
        return ['5 digits' => ['12345'], '7 digits' => ['1234567'], 'letters' => ['12a456']];
    }

    /** TC-16 | FR-05 | Integration | EP | P2 | + */
    public function test_TC_16_forgot_password_answers_the_same_for_unknown_email(): void
    {
        $known = $this->call('POST', '/auth/forgot-password', ['email' => self::TOURIST_2]);
        $unknown = $this->call('POST', '/auth/forgot-password', ['email' => self::unique('ghost') . '@example.com']);

        $this->assertStatus(200, $known);
        $this->assertStatus(200, $unknown);
        $this->assertSame($known['message'], $unknown['message']);
    }

    /** TC-17 | FR-06 | Integration | EP | P2 | + */
    public function test_TC_17_user_updates_own_name_and_phone(): void
    {
        [$token] = $this->register('tourist');

        $r = $this->call('PUT', '/auth/me', ['name' => 'Renamed User', 'phone' => '01812345678'], $token);

        $this->assertStatus(200, $r);
        $me = $this->call('GET', '/auth/me', null, $token)['data']['user'];
        $this->assertSame('Renamed User', $me['name']);
        $this->assertSame('01812345678', $me['phone']);
    }

    /** TC-18 | FR-06 | Integration | State transition | P2 | + */
    public function test_TC_18_tourist_saves_and_unsaves_a_place(): void
    {
        [$token] = $this->register('tourist');
        $saved = fn() => array_column($this->call('GET', '/places/saved', null, $token)['data'] ?? [], 'id');

        $this->assertStatus(200, $this->call('POST', '/places/p1/save', null, $token));
        $this->assertContains('p1', $saved());
        $this->assertStatus(200, $this->call('POST', '/places/p1/save', null, $token));
        $this->assertNotContains('p1', $saved());
    }

    /** TC-19 | FR-06 | Integration | EP | P2 | − */
    public function test_TC_19_wrong_current_password_cannot_change_password(): void
    {
        [$token] = $this->register('tourist');

        $r = $this->call('PUT', '/auth/password', ['currentPassword' => 'not-my-password', 'newPassword' => 'Another123'], $token);

        $this->assertStatus(403, $r);
    }
}
