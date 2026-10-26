<?php
declare(strict_types=1);

namespace HeritageBD\Tests\Integration;

/** Tour guides and the trip planner: FR-14 – FR-19 (SRS §4.1, §4.3, §4.6). */
final class GuideTripTest extends ApiTestCase
{
    private function guideId(): string
    {
        return $this->call('GET', '/auth/me', null, $this->login(self::GUIDE))['data']['user']['id'];
    }

    /** @param array{0:string,1:string,2:string} $guide from bookableGuide() */
    private function bookingFor(string $touristToken, string $date, array $guide): array
    {
        return $this->call('POST', '/bookings', ['guideId' => $guide[1], 'tourType' => $guide[2],
            'startDate' => $date, 'endDate' => $date, 'groupSize' => 2, 'destinations' => ['Lalbagh Fort'], 'paymentMethod' => 'card'], $touristToken);
    }

    /** TC-52 | FR-14 | Integration | EP | P2 | + */
    public function test_TC_52_guide_updates_profile_languages_and_price(): void
    {
        $token = $this->login(self::GUIDE);
        $id = $this->guideId();

        $current = $this->call('GET', "/guides/$id")['data'];
        $r = $this->call('PUT', "/guides/$id", ['bio' => 'Old Dhaka specialist', 'pricePerDay' => 3500, 'languages' => ['Bangla', 'English', 'Hindi'],
            'location' => $current['location'], 'tourTypes' => $current['tourTypes']], $token);

        $this->assertStatus(200, $r);
        $g = $this->call('GET', "/guides/$id")['data'];
        $this->assertSame('Old Dhaka specialist', $g['bio']);
        $this->assertEquals(3500, $g['pricePerDay']);
        $this->assertEqualsCanonicalizing(['Bangla', 'English', 'Hindi'], $g['languages']);
    }

    /** TC-53 | FR-15 | Integration | Decision table | P1 | − */
    public function test_TC_53_public_sees_no_coordinates_unless_available_and_sharing(): void
    {
        $token = $this->login(self::GUIDE);
        $id = $this->guideId();
        $public = fn() => $this->call('GET', "/guides/$id")['data']['coordinates'];

        $this->call('PUT', "/guides/$id", ['isAvailable' => true, 'isLocationSharing' => false], $token);
        $this->assertNull($public(), 'available but not sharing');
        $this->call('PUT', "/guides/$id", ['isAvailable' => false, 'isLocationSharing' => true], $token);
        $this->assertNull($public(), 'sharing but not available');
        $this->call('PUT', "/guides/$id", ['isAvailable' => true, 'isLocationSharing' => true], $token);
        $this->assertNotNull($public(), 'available and sharing');
    }

    /** TC-54 | FR-15 | Integration | EP | P2 | + */
    public function test_TC_54_shared_position_is_approximate_for_the_public(): void
    {
        $token = $this->login(self::GUIDE);
        $id = $this->guideId();
        $this->call('PUT', "/guides/$id", ['isAvailable' => true, 'isLocationSharing' => true, 'coordinates' => ['lat' => 23.718912, 'lng' => 90.388456]], $token);

        $coords = $this->call('GET', "/guides/$id")['data']['coordinates'];

        $this->assertSame(23.72, $coords['lat']);
        $this->assertTrue($coords['approximate']);
    }

    /** TC-55 | FR-16 | Integration | State transition | P1 | + */
    public function test_TC_55_booking_goes_pending_accepted_finished_completed_and_notifies(): void
    {
        [$tourist] = $this->register('tourist');
        $g = $this->bookableGuide();
        $guide = $g[0];
        $today = date('Y-m-d');
        $r = $this->bookingFor($tourist, $today, $g);
        $this->assertStatus(201, $r);
        $id = $r['data']['id'];
        $this->assertSame('pending', $r['data']['status']);

        $this->assertStatus(200, $this->call('PUT', "/bookings/$id", ['status' => 'accepted'], $guide));
        $this->assertStatus(200, $this->call('PUT', "/bookings/$id", ['status' => 'awaiting_confirmation'], $guide));
        $this->assertStatus(200, $this->call('PUT', "/bookings/$id", ['status' => 'completed'], $tourist));

        $this->assertContains('Booking update', array_column($this->call('GET', '/notifications', null, $tourist)['data'], 'title'));
    }

    /** TC-56 | FR-16 | Integration | State transition | P1 | − */
    public function test_TC_56_guide_cannot_skip_from_pending_to_completed(): void
    {
        [$tourist] = $this->register('tourist');
        $g = $this->bookableGuide();
        $id = $this->bookingFor($tourist, date('Y-m-d', strtotime('+20 days')), $g)['data']['id'];

        $this->assertContains($this->call('PUT', "/bookings/$id", ['status' => 'completed'], $g[0])['code'], [403, 422]);
    }

    /** TC-57 | FR-16 | Integration | BVA | P1 | − */
    public function test_TC_57_booking_dates_in_the_past_or_reversed_are_rejected(): void
    {
        [$tourist] = $this->register('tourist');
        [, $guideId, $tour] = $this->bookableGuide();
        $base = ['guideId' => $guideId, 'tourType' => $tour, 'paymentMethod' => 'card'];

        $this->assertStatus(422, $this->call('POST', '/bookings', $base + ['startDate' => date('Y-m-d', strtotime('-1 day')), 'endDate' => date('Y-m-d')], $tourist));
        $this->assertStatus(422, $this->call('POST', '/bookings', $base + ['startDate' => date('Y-m-d', strtotime('+3 days')), 'endDate' => date('Y-m-d', strtotime('+2 days'))], $tourist));
    }

    /** TC-58 | FR-16 | Integration | EP | P2 | − */
    public function test_TC_58_guide_cannot_be_double_booked_for_overlapping_dates(): void
    {
        [$a] = $this->register('tourist');
        [$b] = $this->register('tourist');
        $date = date('Y-m-d', strtotime('+40 days'));
        $g = $this->bookableGuide();
        $first = $this->bookingFor($a, $date, $g)['data']['id'];
        $this->assertStatus(200, $this->call('PUT', "/bookings/$first", ['status' => 'accepted'], $g[0]));

        $this->assertStatus(409, $this->bookingFor($b, $date, $g));
    }

    /** TC-59 | FR-17 | Integration | EP | P2 | + */
    public function test_TC_59_guide_dashboard_lists_only_the_guides_own_bookings(): void
    {
        $mine = $this->bookableGuide();
        $other = $this->bookableGuide();
        [$tourist] = $this->register('tourist');
        $date = date('Y-m-d', strtotime('+50 days'));
        $myBooking = $this->bookingFor($tourist, $date, $mine)['data']['id'];
        $this->bookingFor($tourist, $date, $other);

        $bookings = $this->call('GET', '/bookings', null, $mine[0])['data'];

        $this->assertSame([$myBooking], array_column($bookings, 'id'));
    }

    /** TC-60 | FR-18 | Integration | EP | P1 | + */
    public function test_TC_60_tourist_creates_a_named_trip_with_destinations(): void
    {
        [$tourist] = $this->register('tourist');

        $r = $this->call('POST', '/trips', ['name' => 'Dhaka Heritage Weekend', 'startDate' => date('Y-m-d', strtotime('+5 days')),
            'endDate' => date('Y-m-d', strtotime('+6 days')), 'destinations' => ['Lalbagh Fort', 'Ahsan Manzil'], 'status' => 'planned'], $tourist);

        $this->assertStatus(201, $r);
        $trip = $this->call('GET', "/trips/{$r['data']['id']}", null, $tourist)['data'];
        $this->assertSame('Dhaka Heritage Weekend', $trip['name']);
        $this->assertSame('planned', $trip['status']);
    }

    /** TC-61 | FR-18 | Integration | BVA | P2 | − */
    public function test_TC_61_trip_needs_a_name_and_end_not_before_start(): void
    {
        [$tourist] = $this->register('tourist');
        $d = date('Y-m-d', strtotime('+5 days'));

        $this->assertStatus(422, $this->call('POST', '/trips', ['name' => ' ', 'startDate' => $d, 'endDate' => $d], $tourist));
        $this->assertStatus(422, $this->call('POST', '/trips', ['name' => 'X', 'startDate' => $d, 'endDate' => date('Y-m-d', strtotime('+4 days'))], $tourist));
    }

    /** TC-62 | FR-19 | Integration | State transition | P1 | + */
    public function test_TC_62_days_and_stops_keep_their_order_and_trip_can_be_deleted(): void
    {
        [$tourist] = $this->register('tourist');
        $d1 = date('Y-m-d', strtotime('+7 days'));
        $id = $this->call('POST', '/trips', ['name' => 'Ordered', 'startDate' => $d1, 'endDate' => $d1], $tourist)['data']['id'];

        $this->assertStatus(200, $this->call('PUT', "/trips/$id", ['days' => [['date' => $d1, 'stops' => [
            ['placeId' => 'p1', 'placeName' => 'First stop'], ['placeName' => 'Second stop'], ['placeName' => 'Third stop']]]]], $tourist));
        $stops = $this->call('GET', "/trips/$id", null, $tourist)['data']['days'][0]['stops'];
        $this->assertSame(['First stop', 'Second stop', 'Third stop'], array_column($stops, 'placeName'));

        $this->assertStatus(200, $this->call('DELETE', "/trips/$id", null, $tourist));
        $this->assertStatus(404, $this->call('GET', "/trips/$id", null, $tourist));
    }

    /** TC-63 | FR-19 | Integration | EP | P1 | − */
    public function test_TC_63_another_tourist_cannot_view_or_delete_my_trip(): void
    {
        [$owner] = $this->register('tourist');
        [$other] = $this->register('tourist');
        $d = date('Y-m-d', strtotime('+9 days'));
        $id = $this->call('POST', '/trips', ['name' => 'Private', 'startDate' => $d, 'endDate' => $d], $owner)['data']['id'];

        $this->assertStatus(403, $this->call('GET', "/trips/$id", null, $other));
        $this->assertContains($this->call('DELETE', "/trips/$id", null, $other)['code'], [403, 404]);
    }
}
