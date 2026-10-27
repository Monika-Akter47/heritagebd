import { describe, expect, it } from 'vitest';
import { START_POINTS, buildItinerary, estimateFares, roadKm, toDestination } from '../../src/services/tripRoute';

const place = (id: string, name: string, lat: number, lng: number) => ({
  id, name, district: 'Dhaka', division: 'Dhaka', category: 'fort', coordinates: { lat, lng },
  images: [`/img/${id}.jpg`], visitInfo: { bestTime: 'Morning' },
});

describe('trip planner fares and route', () => {
  // TC-135 | FR-18 | Unit | EP | P2 | +
  it('TC-135 measures road distance as 1.3 times the straight line', () => {
    const motijheel = START_POINTS.find(p => p.name === 'Dhaka (Motijheel)')!;
    const lalbagh = { lat: 23.719, lng: 90.388 };
    expect(roadKm(motijheel, lalbagh)).toBeGreaterThan(4);
    expect(roadKm(motijheel, lalbagh)).toBeLessThan(5);
    expect(roadKm(lalbagh, lalbagh)).toBe(0);
  });

  // TC-136 | FR-18 | Unit | BVA | P2 | +
  it('TC-136 offers bikes up to 60 km, recommends the cheapest ride and never goes below the minimum', () => {
    const short = estimateFares(1);
    expect(short[0].ride.id).toBe('pathao-bike');
    expect(short.find(f => f.ride.id === 'uber-x')!.low).toBeGreaterThanOrEqual(150);

    expect(estimateFares(60).find(f => f.ride.id === 'pathao-bike')!.available).toBe(true);
    const long = estimateFares(61);
    expect(long.find(f => f.ride.id === 'pathao-bike')!.available).toBe(false);
    expect(long[0].ride.id).toBe('pathao-car');
    expect(long[0].high).toBeGreaterThan(long[0].low);
  });

  // TC-137 | FR-19 | Unit | EP | P1 | +
  it('TC-137 builds the itinerary from real places, each with its own photo', () => {
    const lalbagh = toDestination(place('p1', 'Lalbagh Fort', 23.719, 90.388))!;
    const all = [
      lalbagh,
      toDestination(place('p2', 'Ahsan Manzil', 23.7086, 90.406))!,
      toDestination(place('p3', 'Star Mosque', 23.7153, 90.4005))!,
      toDestination(place('p4', 'Paharpur', 25.031, 88.977))!, // too far for a day trip
    ];
    const start = START_POINTS[0];

    const half = buildItinerary(start, lalbagh, all, 'halfday');
    expect(half.stops.map(s => s.name)).toEqual(['Lalbagh Fort', 'Star Mosque']);
    expect(half.stops.map(s => s.img)).toEqual(['/img/p1.jpg', '/img/p3.jpg']);
    expect(half.stops[0].time).toBe('9:00 AM');

    const full = buildItinerary(start, lalbagh, all, 'fullday');
    expect(full.stops.map(s => s.placeId)).not.toContain('p4');
    expect(full.fares[0].available).toBe(true);
    expect(toDestination({ id: 'x', name: 'No coords' })).toBeNull();
  });
});
