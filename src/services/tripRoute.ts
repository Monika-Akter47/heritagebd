// Trip planner maths: distances, simulated Uber/Pathao fares and a simple itinerary built from the
// real heritage places, so every stop shows that place's own photo.

export interface LatLng { lat: number; lng: number }

export interface StartPoint extends LatLng { name: string }

/** Where a tourist can start from (the planner has no GPS; the tourist picks one). */
export const START_POINTS: StartPoint[] = [
  { name: 'Dhaka (Motijheel)', lat: 23.7330, lng: 90.4172 },
  { name: 'Old Dhaka', lat: 23.7104, lng: 90.4074 },
  { name: 'Mirpur', lat: 23.8223, lng: 90.3654 },
  { name: 'Uttara', lat: 23.8759, lng: 90.3795 },
  { name: 'Gulshan', lat: 23.7925, lng: 90.4078 },
  { name: 'Dhanmondi', lat: 23.7465, lng: 90.3760 },
  { name: 'Narayanganj', lat: 23.6238, lng: 90.5000 },
  { name: 'Chattogram City', lat: 22.3569, lng: 91.7832 },
  { name: 'Sylhet City', lat: 24.8949, lng: 91.8687 },
  { name: 'Rajshahi City', lat: 24.3745, lng: 88.6042 },
  { name: 'Khulna City', lat: 22.8456, lng: 89.5403 },
  { name: 'Barishal City', lat: 22.7010, lng: 90.3535 },
  { name: "Cox's Bazar Town", lat: 21.4272, lng: 92.0058 },
  { name: 'Rangpur City', lat: 25.7439, lng: 89.2752 },
  { name: 'Mymensingh City', lat: 24.7471, lng: 90.4203 },
  { name: 'Bogura', lat: 24.8465, lng: 89.3773 },
];

/** Road distance in km: straight-line distance times 1.3, a usual road factor for Bangladesh. */
export function roadKm(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h)) * 1.3;
}

export interface RideOption {
  id: string;
  service: 'Pathao' | 'Uber';
  label: string;
  emoji: string;
  base: number;
  perKm: number;
  perMin: number;
  minimum: number;
  /** Motorbike rides are not offered for long trips. */
  maxKm?: number;
  /** Average speed in km/h, for the trip time. */
  speed: number;
}

// Simulated rates (taka), close to what the apps charged in Dhaka in 2026. Not live prices.
export const RIDES: RideOption[] = [
  { id: 'pathao-bike', service: 'Pathao', label: 'Pathao Bike', emoji: '🏍️', base: 25, perKm: 12, perMin: 1, minimum: 50, maxKm: 60, speed: 28 },
  { id: 'uber-moto', service: 'Uber', label: 'Uber Moto', emoji: '🛵', base: 30, perKm: 13, perMin: 1, minimum: 55, maxKm: 60, speed: 28 },
  { id: 'pathao-car', service: 'Pathao', label: 'Pathao Car', emoji: '🚙', base: 60, perKm: 30, perMin: 2, minimum: 150, speed: 24 },
  { id: 'uber-x', service: 'Uber', label: 'Uber X', emoji: '🚗', base: 70, perKm: 33, perMin: 2, minimum: 170, speed: 24 },
];

export interface FareEstimate {
  ride: RideOption;
  available: boolean;
  minutes: number;
  /** Low and high estimate in taka, rounded to 10. */
  low: number;
  high: number;
}

const round10 = (n: number) => Math.round(n / 10) * 10;

/** Fare for every ride type over a distance; the cheapest available one is listed first. */
export function estimateFares(km: number): FareEstimate[] {
  return RIDES.map(ride => {
    const minutes = Math.max(5, Math.round((km / ride.speed) * 60));
    const fare = Math.max(ride.minimum, ride.base + ride.perKm * km + ride.perMin * minutes);
    return {
      ride,
      available: ride.maxKm === undefined || km <= ride.maxKm,
      minutes,
      low: round10(fare * 0.9),
      high: round10(fare * 1.15),
    };
  }).sort((a, b) => Number(b.available) - Number(a.available) || a.low - b.low);
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export interface Destination extends LatLng {
  id: string;
  name: string;
  location: string;
  district: string;
  division: string;
  type: string;
  img: string;
  tip: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  mosque: 'Mosque', fort: 'Fort', palace: 'Palace', temple: 'Temple', monument: 'Monument',
  archaeological: 'Archaeological', natural: 'Nature', museum: 'Museum',
};

/** A place from the API in the shape the planner uses. Returns null when it has no coordinates. */
export function toDestination(place: any): Destination | null {
  const lat = Number(place?.coordinates?.lat);
  const lng = Number(place?.coordinates?.lng);
  if (!place?.id || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const visit = place.visitInfo || {};
  const tip = visit.bestTime ? `Best time: ${visit.bestTime}`
    : visit.openTime ? `Open ${visit.openTime}–${visit.closeTime}` : 'Check opening hours before you go';
  return {
    id: place.id,
    name: place.name,
    location: place.location || place.district,
    district: place.district,
    division: place.division,
    type: CATEGORY_LABEL[place.category] || 'Heritage',
    img: place.images?.[0] || '',
    tip: visit.entryFee ? `${tip} · Entry ${visit.entryFee}` : tip,
    lat,
    lng,
  };
}

export interface ItineraryStop {
  placeId: string;
  time: string;
  name: string;
  type: string;
  duration: string;
  img: string;
  tip: string;
  location: string;
}

export interface Itinerary {
  stops: ItineraryStop[];
  summary: { distance: string; totalTime: string; cost: string };
  /** Distance from the starting point to the first stop. */
  startKm: number;
  fares: FareEstimate[];
}

const STOPS_BY_DURATION: Record<string, number> = { halfday: 2, fullday: 4, weekend: 6 };
const VISIT_MIN = 90;
const NEARBY_KM = 80;

function clock(minutesFromMidnight: number): string {
  const h24 = Math.floor(minutesFromMidnight / 60) % 24;
  const m = minutesFromMidnight % 60;
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/**
 * The chosen place plus the nearest other places within 80 km, visited nearest-first. Each stop
 * keeps its own photo. Travel between stops uses the cheapest car fare.
 */
export function buildItinerary(start: LatLng, destination: Destination, all: Destination[], duration: string): Itinerary {
  const wanted = STOPS_BY_DURATION[duration] ?? 4;
  const pool = all.filter(p => p.id !== destination.id && roadKm(destination, p) <= NEARBY_KM);
  const route: Destination[] = [destination];
  while (route.length < wanted && pool.length) {
    const last = route[route.length - 1];
    pool.sort((a, b) => roadKm(last, a) - roadKm(last, b));
    route.push(pool.shift()!);
  }

  const startKm = roadKm(start, destination);
  const fares = estimateFares(startKm);
  const car = estimateFares(1).find(f => f.ride.id === 'pathao-car')!.ride;

  let now = 9 * 60;   // arrive at the first stop at 9:00 AM
  let legKm = 0;
  let travelMin = 0;
  const stops = route.map((p, i) => {
    if (i > 0) {
      const km = roadKm(route[i - 1], p);
      const min = Math.max(10, Math.round((km / car.speed) * 60));
      legKm += km;
      travelMin += min;
      now += min;
    }
    const stop: ItineraryStop = {
      placeId: p.id, time: clock(now), name: p.name, type: p.type, duration: '1.5 hrs',
      img: p.img, tip: p.tip, location: `${p.district}, ${p.division}`,
    };
    now += VISIT_MIN;
    return stop;
  });

  const between = estimateFares(legKm).find(f => f.ride.id === 'pathao-car')!;
  const first = fares.find(f => f.available)!;
  const totalKm = startKm + legKm;
  return {
    stops,
    startKm,
    fares,
    summary: {
      distance: `${Math.round(totalKm)} km`,
      totalTime: formatMinutes(Math.round((startKm / car.speed) * 60) + travelMin + stops.length * VISIT_MIN),
      cost: legKm > 0
        ? `৳${(first.low + between.low).toLocaleString()}–${(first.high + between.high).toLocaleString()}`
        : `৳${first.low.toLocaleString()}–${first.high.toLocaleString()}`,
    },
  };
}
