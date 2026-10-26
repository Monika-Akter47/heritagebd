<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Integration;

/**
 * Guide balance payments and the admin payment ledger (FR-16 / FR-29 / FR-33 / FR-45 money flow),
 * security requirements FR-50 and SRS §5.3, and OWASP Top 10 checks (injection, misconfiguration,
 * cryptographic storage).
 */
final class PaymentsSecurityTest extends ApiTestCase
{
    /** A finished tour of the seed guide: [bookingId, touristToken, guideToken, balance]. */
    private function finishedTour(): array
    {
        [$tourist] = $this->register('tourist');
        [$guide, $guideId, $tour] = $this->bookableGuide();
        $r = $this->call('POST', '/bookings', ['guideId' => $guideId, 'tourType' => $tour,
            'startDate' => date('Y-m-d'), 'endDate' => date('Y-m-d'), 'paymentMethod' => 'card'], $tourist);
        $this->assertStatus(201, $r);
        $id = $r['data']['id'];
        $this->call('PUT', "/bookings/$id", ['status' => 'accepted'], $guide);
        $this->assertStatus(200, $this->call('PUT', "/bookings/$id", ['status' => 'awaiting_confirmation'], $guide));
        return [$id, $tourist, $guide, (float)$r['data']['balanceAmount']];
    }

    /** TC-108 | FR-16 | Integration | State transition | P1 | + */
    public function test_TC_108_tourist_reports_cash_and_guide_confirms_it(): void
    {
        [$bookingId, $tourist, $guide, $balance] = $this->finishedTour();

        $reported = $this->call('POST', '/guide-payments', ['bookingId' => $bookingId, 'method' => 'cash'], $tourist);
        $this->assertStatus(201, $reported);
        $this->assertSame('reported', $reported['data']['status']);
        $this->assertEquals($balance, $reported['data']['amount']);          // the balance, not the full tour price

        $confirmed = $this->call('PUT', "/guide-payments/{$reported['data']['id']}/confirm", [], $guide);
        $this->assertStatus(200, $confirmed);
        $this->assertSame('confirmed', $confirmed['data']['status']);
    }

    /** TC-109 | FR-16 | Integration | State transition | P1 | + */
    public function test_TC_109_guide_records_bkash_payment_directly_and_earnings_show_it_received(): void
    {
        [$bookingId, $tourist, $guide] = $this->finishedTour();
        $this->assertStatus(200, $this->call('PUT', "/bookings/$bookingId", ['status' => 'completed'], $tourist));
        $before = $this->call('GET', '/earnings/me', null, $guide)['data']['totals'];

        $r = $this->call('POST', '/guide-payments', ['bookingId' => $bookingId, 'method' => 'bkash', 'payerPhone' => '01712345678', 'reference' => 'GUIDE12345'], $guide);

        $this->assertStatus(201, $r);
        $this->assertSame(['confirmed', 'guide'], [$r['data']['status'], $r['data']['recordedBy']]);
        $after = $this->call('GET', '/earnings/me', null, $guide)['data']['totals'];
        $this->assertEqualsWithDelta($before['cashConfirmed'] + $r['data']['amount'], $after['cashConfirmed'], 0.01);
        $this->assertEqualsWithDelta($before['cashAwaiting'] - $r['data']['amount'], $after['cashAwaiting'], 0.01);
    }

    /** TC-110 | FR-16 | Integration | EP | P1 | − */
    public function test_TC_110_guide_payment_rules_are_enforced(): void
    {
        [$bookingId, $tourist, $guide] = $this->finishedTour();
        [$stranger] = $this->register('tourist');

        $this->assertStatus(422, $this->call('POST', '/guide-payments', ['bookingId' => $bookingId, 'method' => 'nagad'], $tourist));   // no number/TrxID
        $this->assertStatus(404, $this->call('POST', '/guide-payments', ['bookingId' => $bookingId, 'method' => 'cash'], $stranger)); // not their booking
        $this->call('POST', '/guide-payments', ['bookingId' => $bookingId, 'method' => 'cash'], $guide);
        $this->assertStatus(409, $this->call('POST', '/guide-payments', ['bookingId' => $bookingId, 'method' => 'cash'], $tourist)); // already confirmed
    }

    /** TC-111 | FR-45 | Integration | EP | P1 | + */
    public function test_TC_111_admin_ledger_lists_advances_with_payer_number_and_trxid(): void
    {
        [, , $productId] = $this->vendorWithPreorderProduct();
        [$tourist] = $this->register('tourist');
        $po = $this->createPreorder($productId, $tourist, ['advanceTransactionId' => 'LEDGER7788'])['data'];

        $ledger = $this->call('GET', '/admin/payments', null, $this->login(self::ADMIN))['data'];

        $row = array_values(array_filter($ledger['advances'], fn($a) => $a['recordId'] === $po['id']))[0];
        $this->assertSame(['preorder', 'bkash', '01712345678', 'LEDGER7788', 'held'],
            [$row['flow'], $row['method'], $row['payerPhone'], $row['transactionId'], $row['advanceStatus']]);
        $this->assertGreaterThanOrEqual($row['advance'], $ledger['totals']['advanceHeld']);
    }

    /** TC-112 | FR-50 | Integration | EP | P2 | + */
    public function test_TC_112_failed_logins_are_logged_with_identifier_and_time(): void
    {
        $email = self::unique('audit') . '@example.com';
        $this->call('POST', '/auth/login', ['email' => $email, 'password' => 'wrong']);

        $this->assertSame(1, (int)self::db()->query("SELECT COUNT(*) FROM auth_attempts WHERE action = 'login_email' AND identifier = '$email'")->fetchColumn());
    }

    /** TC-113 | FR-50 | Integration | EP | P2 | + */
    public function test_TC_113_important_user_and_payment_events_are_kept_in_an_audit_log(): void
    {
        // SRS FR-50: "maintain logs of important user and payment events for auditing".
        $tables = self::db()->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")->fetchAll(\PDO::FETCH_COLUMN);

        $this->assertNotEmpty(array_filter($tables, fn($t) => str_contains($t, 'audit') || str_contains($t, 'activity')), 'no audit/activity log table');
    }

    /** TC-114 | FR-03 | Integration | Error guessing | P1 | − */
    public function test_TC_114_sql_injection_in_search_and_login_is_harmless(): void
    {
        $all = count($this->call('GET', '/places')['data']);
        $r = $this->call('GET', '/places?' . http_build_query(['search' => "' OR 1=1 --"]));
        $login = $this->call('POST', '/auth/login', ['email' => "admin@heritagebd.com' --", 'password' => "' OR '1'='1"]);

        $this->assertStatus(200, $r);
        $this->assertLessThan($all, count($r['data']));    // treated as text, not as SQL
        $this->assertContains($login['code'], [401, 422]);
    }

    /** TC-115 | FR-49 | Integration | Error guessing | P1 | − */
    public function test_TC_115_errors_never_expose_sql_paths_or_stack_traces(): void
    {
        $responses = [
            $this->call('GET', '/no/such/route'),
            $this->call('POST', '/auth/login', ['email' => ['array'], 'password' => ['x']]),
            $this->call('GET', '/products/' . str_repeat('x', 300)),
        ];

        foreach ($responses as $r) {
            $this->assertNotNull($r['json'], "non-JSON body: {$r['raw']}");
            $this->assertDoesNotMatchRegularExpression('/SQLSTATE|Stack trace|\.php|<b>Warning/i', $r['raw']);
        }
    }

    /** TC-116 | FR-02 | Integration | EP | P1 | + */
    public function test_TC_116_passwords_are_stored_only_as_bcrypt_hashes(): void
    {
        [, $user] = $this->register('tourist');

        $hash = self::db()->query("SELECT password_hash FROM users WHERE id = '{$user['id']}'")->fetchColumn();

        $this->assertMatchesRegularExpression('/^\$2y\$1\d\$/', $hash);
        $this->assertTrue(password_verify(self::PASSWORD, $hash));
    }

    /** TC-117 | FR-51 | Integration | EP | P2 | + */
    public function test_TC_117_schema_and_data_can_be_restored_from_the_committed_sql(): void
    {
        // The test database itself is restored from backend/database/postgres/{schema,seed}.sql on every run.
        $this->assertGreaterThanOrEqual(50, (int)self::db()->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")->fetchColumn());
        $this->assertGreaterThan(0, (int)self::db()->query('SELECT COUNT(*) FROM users')->fetchColumn());
    }
}
