<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Integration;

use PDO;
use PHPUnit\Framework\TestCase;

/**
 * Base for API integration tests. Talks HTTP to the PHP API started by tests/run-tests.mjs
 * (TEST_API_URL) and, for arranging or inspecting state, directly to its throwaway PostgreSQL
 * (TEST_DB_URL). The database is seeded from backend/database/postgres/seed.sql on every run;
 * seed accounts use the fixture password below. Tests create their own records with unique names
 * so they do not depend on each other or on run order.
 */
abstract class ApiTestCase extends TestCase
{
    protected const PASSWORD = 'password123';   // fixture password of the seed accounts
    protected const TOURIST = 'tourist@heritagebd.com';
    protected const TOURIST_2 = 'nusrat@example.com';
    protected const ADMIN = 'admin@heritagebd.com';
    protected const GUIDE = 'arif@guide.com';

    private static array $tokens = [];
    private static ?PDO $pdo = null;

    protected function setUp(): void
    {
        if (!getenv('TEST_API_URL')) {
            $this->markTestSkipped('Integration tests need the test API: run `npm test`.');
        }
    }

    protected static function api(): string
    {
        return rtrim((string)getenv('TEST_API_URL'), '/') . '/api';
    }

    /** @return array{code:int, data:mixed, message:string, json:?array, headers:array} */
    protected function call(string $method, string $path, ?array $body = null, ?string $token = null): array
    {
        $ch = curl_init(self::api() . $path);
        $headers = ['Content-Type: application/json'];
        if ($token) $headers[] = "Authorization: Bearer $token";
        $responseHeaders = [];
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HEADERFUNCTION => function ($ch, $line) use (&$responseHeaders) {
                if (str_contains($line, ':')) {
                    [$k, $v] = explode(':', $line, 2);
                    $responseHeaders[strtolower(trim($k))] = trim($v);
                }
                return strlen($line);
            },
        ]);
        if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        $raw = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $json = json_decode((string)$raw, true);
        return [
            'code' => $code,
            'data' => $json['data'] ?? null,
            'message' => (string)($json['message'] ?? ''),
            'json' => is_array($json) ? $json : null,
            'raw' => (string)$raw,
            'headers' => $responseHeaders,
        ];
    }

    protected function assertStatus(int $expected, array $response): void
    {
        $this->assertSame($expected, $response['code'], "HTTP {$response['code']}: {$response['message']}");
    }

    /** Bearer token for a seed account (cached for the run; login is rate-limited per IP on failures only). */
    protected function login(string $email): string
    {
        if (!isset(self::$tokens[$email])) {
            $r = $this->call('POST', '/auth/login', ['email' => $email, 'password' => self::PASSWORD]);
            $this->assertStatus(200, $r);
            self::$tokens[$email] = $r['data']['token'];
        }
        return self::$tokens[$email];
    }

    protected function forgetToken(string $email): void
    {
        unset(self::$tokens[$email]);
    }

    /** Direct connection to the throwaway test database, for arranging and checking state. */
    protected static function db(): PDO
    {
        if (!self::$pdo) {
            $p = parse_url((string)getenv('TEST_DB_URL'));
            self::$pdo = new PDO(
                "pgsql:host={$p['host']};port={$p['port']};dbname=" . ltrim($p['path'], '/') . ';sslmode=disable',
                $p['user'], $p['pass'] ?? '',
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
            );
        }
        return self::$pdo;
    }

    protected static function unique(string $prefix): string
    {
        return $prefix . '-' . bin2hex(random_bytes(4));
    }

    /** Registers a new account and returns [token, user]. */
    protected function register(string $role, array $extra = []): array
    {
        $email = self::unique("test-$role") . '@example.com';
        $r = $this->call('POST', '/auth/register', $extra + [
            'name' => "Test $role", 'email' => $email, 'password' => self::PASSWORD, 'role' => $role,
        ]);
        $this->assertStatus(201, $r);
        return [$r['data']['token'], $r['data']['user'] + ['email' => $email]];
    }

    /** A verified vendor with one in-stock pre-order product: [vendorToken, vendorId, productId]. */
    protected function vendorWithPreorderProduct(int $stock = 10, float $price = 1000): array
    {
        [$token, $user] = $this->register('vendor', ['shopName' => self::unique('Test Shop')]);
        $this->call('PUT', '/vendor/profile', ['pickupLocation' => 'Lalbagh Fort gate', 'location' => 'Dhaka'], $token);
        $this->assertStatus(200, $this->call('PUT', "/admin/vendors/{$user['id']}/verify", ['status' => 'verified'], $this->login(self::ADMIN)));
        $r = $this->call('POST', '/products', [
            'name' => self::unique('Test Pitha'), 'description' => 'Test item', 'price' => $price, 'category' => 'food',
            'stock' => $stock, 'district' => 'Dhaka', 'preOrderEnabled' => true, 'preparationTime' => '2 hours',
            'pickupLocation' => 'Lalbagh Fort gate', 'availableTimeSlots' => ['10:00 AM', '2:00 PM'],
        ], $token);
        $this->assertContains($r['code'], [200, 201], $r['message']);
        return [$token, $user['id'], $r['data']['id']];
    }

    /** A verified guide with a complete, bookable profile: [guideToken, guideId, tourTypeName]. */
    protected function bookableGuide(): array
    {
        [$token, $user] = $this->register('guide', ['languages' => ['Bangla']]);
        $tour = self::unique('Old Dhaka Walk');
        $this->assertStatus(200, $this->call('PUT', "/guides/{$user['id']}", [
            'bio' => 'Licensed heritage guide', 'location' => 'Dhaka', 'pricePerDay' => 3000,
            'tourTypes' => [['name' => $tour, 'duration' => '1 day', 'price' => 3000, 'description' => 'Walking tour']],
        ], $token));
        $this->assertStatus(200, $this->call('PUT', "/admin/guides/{$user['id']}/verify", ['status' => 'verified'], $this->login(self::ADMIN)));
        $this->call('PUT', "/guides/{$user['id']}", ['isAvailable' => true], $token);
        return [$token, $user['id'], $tour];
    }

    protected function createPreorder(string $productId, string $touristToken, array $extra = []): array
    {
        return $this->call('POST', '/preorders', $extra + [
            'productId' => $productId, 'pickupDate' => date('Y-m-d', strtotime('+1 day')), 'pickupTime' => '10:00 AM',
            'quantity' => 1, 'advancePaymentMethod' => 'bkash',
            'advancePayerPhone' => '01712345678', 'advanceTransactionId' => 'TRX9BG7XK2',
        ], $touristToken);
    }
}
