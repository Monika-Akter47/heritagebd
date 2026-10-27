<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Integration;

/** Admin refunds after a vendor or guide cancels, and the vendor's pre-order list order. */
final class RefundTest extends ApiTestCase
{
    /** TC-130 | FR-31 | Integration | EP | P2 | + */
    public function test_TC_130_vendor_sees_open_preorders_by_pickup_date_and_closed_ones_last(): void
    {
        [$vendor, , $productId] = $this->vendorWithPreorderProduct();
        [$tourist] = $this->register('tourist');
        $later = $this->createPreorder($productId, $tourist, ['pickupDate' => date('Y-m-d', strtotime('+5 days'))])['data'];
        $soon = $this->createPreorder($productId, $tourist, ['pickupDate' => date('Y-m-d', strtotime('+1 day'))])['data'];
        $gone = $this->createPreorder($productId, $tourist, ['pickupDate' => date('Y-m-d', strtotime('+2 days'))])['data'];
        $this->call('PUT', "/preorders/{$gone['id']}", ['status' => 'cancelled', 'cancellationReason' => 'Changed plans'], $tourist);

        $ids = array_column($this->call('GET', '/preorders', null, $vendor)['data'], 'id');

        $this->assertSame([$soon['id'], $later['id'], $gone['id']], $ids);
    }

    /** TC-131 | FR-34 | Integration | State transition | P1 | + */
    public function test_TC_131_vendor_cancelling_a_paid_preorder_waits_for_the_admin_to_refund_it(): void
    {
        [$vendor, , $productId] = $this->vendorWithPreorderProduct();
        [$tourist] = $this->register('tourist');
        $po = $this->createPreorder($productId, $tourist)['data'];
        $admin = $this->login(self::ADMIN);

        $r = $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'cancelled', 'cancellationReason' => 'Out of stock'], $vendor);
        $this->assertStatus(200, $r);
        $this->assertSame('refund_pending', $r['data']['advanceStatus']);
        $this->assertContains('Refund needed', array_column($this->call('GET', '/notifications', null, $admin)['data'], 'title'));

        $refund = $this->call('POST', "/admin/refunds/preorder/{$po['id']}", ['method' => 'bkash', 'transactionId' => 'rf7k2m9q1z'], $admin);
        $this->assertStatus(200, $refund);

        $after = $this->call('GET', "/preorders/{$po['id']}", null, $tourist)['data'];
        $this->assertSame(['refunded', 'refunded', 'RF7K2M9Q1Z'], [$after['status'], $after['advanceStatus'], $after['refundTransactionId']]);
        $this->assertSame((float)$po['advancePaid'], (float)$after['refundAmount']);
        $this->assertContains('Advance refunded', array_column($this->call('GET', '/notifications', null, $tourist)['data'], 'title'));
        $this->assertStatus(409, $this->call('POST', "/admin/refunds/preorder/{$po['id']}", ['method' => 'bkash', 'transactionId' => 'RF7K2M9Q1Z'], $admin));
    }

    /** TC-132 | FR-16 | Integration | State transition | P1 | + */
    public function test_TC_132_guide_cancelling_a_booking_waits_for_the_admin_to_refund_the_advance(): void
    {
        [$tourist] = $this->register('tourist');
        $g = $this->bookableGuide();
        $date = date('Y-m-d', strtotime('+3 days'));
        $booking = $this->call('POST', '/bookings', ['guideId' => $g[1], 'tourType' => $g[2], 'startDate' => $date, 'endDate' => $date,
            'groupSize' => 2, 'destinations' => ['Lalbagh Fort'], 'paymentMethod' => 'card'], $tourist)['data'];
        $this->assertStatus(200, $this->call('PUT', "/bookings/{$booking['id']}", ['status' => 'accepted'], $g[0]));

        $this->assertStatus(200, $this->call('PUT', "/bookings/{$booking['id']}", ['status' => 'cancelled'], $g[0]));
        $status = fn() => self::db()->query("SELECT advance_status FROM guide_bookings WHERE id = '{$booking['id']}'")->fetchColumn();
        $this->assertSame('refund_pending', $status());

        $this->assertStatus(200, $this->call('POST', "/admin/refunds/guide_booking/{$booking['id']}",
            ['method' => 'nagad', 'transactionId' => 'NG55TRX0912'], $this->login(self::ADMIN)));
        $this->assertSame('refunded', $status());
    }

    /** TC-133 | FR-34 | Integration | EP | P1 | − */
    public function test_TC_133_only_an_admin_can_refund_and_needs_a_valid_trxid(): void
    {
        [$vendor, , $productId] = $this->vendorWithPreorderProduct();
        [$tourist] = $this->register('tourist');
        $po = $this->createPreorder($productId, $tourist)['data'];
        $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'cancelled', 'cancellationReason' => 'Shop closed'], $vendor);
        $path = "/admin/refunds/preorder/{$po['id']}";

        $this->assertStatus(403, $this->call('POST', $path, ['method' => 'bkash', 'transactionId' => 'ABC12345'], $vendor));
        $this->assertStatus(403, $this->call('POST', $path, ['method' => 'bkash', 'transactionId' => 'ABC12345'], $tourist));
        $admin = $this->login(self::ADMIN);
        $this->assertStatus(422, $this->call('POST', $path, ['method' => 'bkash', 'transactionId' => 'AB12'], $admin));
        $this->assertStatus(422, $this->call('POST', $path, ['method' => 'cash', 'transactionId' => 'ABC12345'], $admin));
    }

    /** TC-134 | FR-34 | Integration | EP | P1 | + */
    public function test_TC_134_a_tourist_cancelling_their_own_preorder_is_refunded_straight_away(): void
    {
        [, , $productId] = $this->vendorWithPreorderProduct();
        [$tourist] = $this->register('tourist');
        $po = $this->createPreorder($productId, $tourist)['data'];

        $r = $this->call('PUT', "/preorders/{$po['id']}", ['status' => 'cancelled', 'cancellationReason' => 'Changed plans'], $tourist);

        $this->assertSame('refunded', $r['data']['advanceStatus']);
    }
}
