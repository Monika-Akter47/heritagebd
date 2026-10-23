import React, { useState } from 'react';
import {
  Plus, Calendar, MapPin, Trash2, ChevronDown, ChevronUp, Navigation,
  Zap, Clock, DollarSign, Star, QrCode, Users, ArrowRight, CheckCircle,
  Compass, Search, Crosshair, RotateCcw, Save, Share2,
  X
} from 'lucide-react';
import { bookingsApi, tripsApi, placesApi, productsApi, guidesApi } from '../../services/api';
import type { TripDay, TripStop } from '../../types';
import LocalTaste from '../../components/local/LocalTaste';
import { useApiData } from '../../hooks/useApiData';
import Badge from '../../components/ui/Badge';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';

// ─── Mock data for smart route planning ──────────────────────────────────────

const LOCATIONS = [
  'Dhaka (Motijheel)', 'Old Dhaka', 'Mirpur', 'Uttara', 'Gulshan',
  'Chittagong City', 'Sylhet City', 'Rajshahi City', 'Khulna City',
  'Barishal City', 'Cox\'s Bazar Town', 'Rangpur City',
];

const DESTINATIONS = [
  { id: 'd1', name: 'Lalbagh Fort & Old Dhaka', location: 'Old Dhaka', district: 'Dhaka', type: 'Heritage', duration: '3–4 hrs', img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=280&fit=crop&auto=format' },
  { id: 'd2', name: 'Sonargaon & Panam City', location: 'Narayanganj', district: 'Narayanganj', type: 'Heritage', duration: '5–6 hrs', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=280&fit=crop&auto=format' },
  { id: 'd3', name: 'Paharpur Buddhist Vihara', location: 'Rajshahi', district: 'Naogaon', type: 'Archaeological', duration: '4–5 hrs', img: 'https://images.unsplash.com/photo-1524230659092-07f99a4d0ef6?w=400&h=280&fit=crop&auto=format' },
  { id: 'd4', name: 'Sundarbans Mangrove', location: 'Khulna', district: 'Khulna', type: 'Nature', duration: 'Multi-day', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=280&fit=crop&auto=format' },
  { id: 'd5', name: 'Cox\'s Bazar Beach', location: "Cox's Bazar", district: "Cox's Bazar", type: 'Nature', duration: 'Multi-day', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=280&fit=crop&auto=format' },
  { id: 'd6', name: 'Srimangal Tea Gardens', location: 'Sylhet', district: 'Moulvibazar', type: 'Nature', duration: '3–4 hrs', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=280&fit=crop&auto=format' },
  { id: 'd7', name: 'Ahsan Manzil Pink Palace', location: 'Old Dhaka', district: 'Dhaka', type: 'Heritage', duration: '2–3 hrs', img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=280&fit=crop&auto=format' },
  { id: 'd8', name: 'Bagerhat Mosque City', location: 'Bagerhat', district: 'Bagerhat', type: 'Heritage', duration: '5–6 hrs', img: 'https://images.unsplash.com/photo-1524230659092-07f99a4d0ef6?w=400&h=280&fit=crop&auto=format' },
];

const PREFS = [
  { id: 'heritage', label: 'Heritage Sites', emoji: '🏛️' },
  { id: 'food', label: 'Local Food', emoji: '🍛' },
  { id: 'shopping', label: 'Handicrafts', emoji: '🧵' },
  { id: 'readytopick', label: 'Ready to Pick', emoji: '🟢' },
  { id: 'guides', label: 'Find a Guide', emoji: '🧭' },
  { id: 'events', label: 'Local Events', emoji: '🎉' },
];

const BUDGETS = [
  { id: 'low', label: 'Budget', desc: 'Under ৳1,000', icon: '💚' },
  { id: 'mid', label: 'Comfortable', desc: '৳1,000–৳3,000', icon: '💛' },
  { id: 'flex', label: 'Flexible', desc: '৳3,000+', icon: '💎' },
];

const DURATIONS = [
  { id: 'halfday', label: 'Half Day', desc: '4–5 hours' },
  { id: 'fullday', label: 'Full Day', desc: '7–9 hours' },
  { id: 'weekend', label: 'Weekend', desc: '2 days' },
];

const TRANSPORT_OPTS = [
  { id: 'cng', emoji: '🛵', label: 'CNG', cost: '৳300–400' },
  { id: 'rickshaw', emoji: '🛺', label: 'Rickshaw', cost: '৳100–200' },
  { id: 'bus', emoji: '🚌', label: 'Bus', cost: '৳100–150' },
  { id: 'car', emoji: '🚗', label: 'Car', cost: '৳600–800' },
];

// Generated itinerary mock based on destination selection
const GENERATED_ROUTES: Record<string, {
  stops: { time: string; name: string; type: string; duration: string; img: string; tip: string }[];
  readyToPick: { name: string; vendor: string; price: number; prepTime: string }[];
  summary: { distance: string; totalTime: string; cost: string };
}> = {
  d1: {
    stops: [
      { time: '9:00 AM', name: 'Lalbagh Fort', type: 'Heritage', duration: '1.5 hrs', img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=200&h=140&fit=crop', tip: 'Go early to avoid crowds' },
      { time: '10:45 AM', name: 'Ahsan Manzil', type: 'Museum', duration: '1 hr', img: 'https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=200&h=140&fit=crop', tip: 'Closed on Thursdays' },
      { time: '12:00 PM', name: 'Sadarghat River Port', type: 'Landmark', duration: '45 min', img: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=200&h=140&fit=crop', tip: 'Great for photography' },
      { time: '1:00 PM', name: 'Old Dhaka Food Street', type: 'Food', duration: '1 hr', img: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=140&fit=crop', tip: 'Try biryani and kebabs' },
      { time: '2:30 PM', name: 'Star Mosque', type: 'Heritage', duration: '30 min', img: 'https://images.unsplash.com/photo-1524230659092-07f99a4d0ef6?w=200&h=140&fit=crop', tip: 'Remove shoes before entering' },
    ],
    readyToPick: [
      { name: 'Old Dhaka Biryani Set', vendor: 'Haji Biriyani', price: 380, prepTime: '45 min' },
      { name: 'Nakshi Kantha (small)', vendor: 'Old Town Crafts', price: 850, prepTime: '1 hr' },
    ],
    summary: { distance: '12 km', totalTime: '6h 30m', cost: '৳800–1,200' },
  },
  d2: {
    stops: [
      { time: '8:30 AM', name: 'Panam City Ruins', type: 'Heritage', duration: '1.5 hrs', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=140&fit=crop', tip: 'Best in morning light' },
      { time: '10:15 AM', name: 'Goaldi Mosque', type: 'Heritage', duration: '45 min', img: 'https://images.unsplash.com/photo-1524230659092-07f99a4d0ef6?w=200&h=140&fit=crop', tip: '15th century architecture' },
      { time: '11:15 AM', name: 'Folk Art Museum', type: 'Museum', duration: '1 hr', img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&h=140&fit=crop', tip: 'Buy local crafts here' },
      { time: '12:30 PM', name: 'Sonargaon Riverside', type: 'Nature', duration: '45 min', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=140&fit=crop', tip: 'Boat ride available' },
    ],
    readyToPick: [
      { name: 'Muslin Stole (handwoven)', vendor: 'Sonargaon Weavers', price: 1200, prepTime: '30 min' },
      { name: 'Traditional Pitha Box', vendor: 'Narayanganj Kitchen', price: 350, prepTime: '1 hr' },
    ],
    summary: { distance: '32 km', totalTime: '5h 30m', cost: '৳600–1,000' },
  },
};

// Fallback route for destinations without specific data
const DEFAULT_ROUTE = {
  stops: [
    { time: '9:00 AM', name: 'Main Entrance & Visitor Center', type: 'Info', duration: '30 min', img: 'https://images.unsplash.com/photo-1524230659092-07f99a4d0ef6?w=200&h=140&fit=crop', tip: 'Pick up a map here' },
    { time: '9:45 AM', name: 'Main Heritage Site', type: 'Heritage', duration: '2 hrs', img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=200&h=140&fit=crop', tip: 'Best viewed before noon' },
    { time: '12:00 PM', name: 'Local Food Stop', type: 'Food', duration: '1 hr', img: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=140&fit=crop', tip: 'Try the local specialty' },
    { time: '1:30 PM', name: 'Craft Market', type: 'Shopping', duration: '1 hr', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=140&fit=crop', tip: 'Bargain gently and respectfully' },
  ],
  readyToPick: [
    { name: 'Local Specialty Snack Pack', vendor: 'Local Vendor', price: 250, prepTime: '30 min' },
  ],
  summary: { distance: '40–80 km', totalTime: '6–8h', cost: '৳700–1,500' },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function LocationDetector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(false);

  function handleDetect() {
    setDetecting(true);
    setTimeout(() => {
      onChange('Dhaka (Motijheel)');
      setDetecting(false);
      setDetected(true);
    }, 1200);
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleDetect}
        disabled={detecting}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 font-semibold text-sm transition-all"
        style={detected
          ? { borderColor: 'var(--color-primary)', background: '#E6F4EF', color: 'var(--color-primary)' }
          : { borderColor: 'var(--color-border)', background: 'white', color: 'var(--color-text)' }}>
        {detecting
          ? <><span className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin inline-block" /> Detecting location...</>
          : detected
          ? <><CheckCircle size={16} /> 📍 {value}</>
          : <><Crosshair size={16} style={{ color: 'var(--color-primary)' }} /> Use My Current Location</>}
      </button>
      <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>or enter manually</p>
      <select value={value} onChange={e => { onChange(e.target.value); setDetected(false); }}
        className="w-full px-4 py-3 rounded-2xl border-2 text-sm outline-none bg-white border-[var(--color-border)] focus:border-[var(--color-primary)]">
        <option value="">Select your location...</option>
        {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
    </div>
  );
}

function GuideBookingModal({ guide, destination, location, route, preferredDate, onClose }: {
  guide: any;
  destination: string;
  location: string;
  route: typeof DEFAULT_ROUTE;
  preferredDate: string;
  onClose: () => void;
}) {
  const { currentUser } = useApp();
  const today = new Date();
  const todayString = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const initialDate = preferredDate >= todayString ? preferredDate : todayString;
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [tourType, setTourType] = useState(guide.tourTypes?.[0]?.name || 'Private tour');
  const [groupSize, setGroupSize] = useState(1);
  const [message, setMessage] = useState(`Please guide me around ${destination}.`);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sharedTrip, setSharedTrip] = useState<any | null>(null);

  async function submitBooking(event: React.FormEvent) {
    event.preventDefault();
    if (!currentUser || currentUser.role !== 'tourist') {
      setError('Sign in with a tourist account to request a guide booking.');
      return;
    }
    setSaving(true);
    setError('');
    let tripWasShared = !!sharedTrip;
    try {
      if (!sharedTrip) {
        const trip = await tripsApi.create({
          name: destination,
          description: message.trim(),
          startDate,
          endDate,
          destinations: [location],
          guideId: guide.id,
          status: 'planned',
          days: [{
            date: startDate,
            stops: route.stops.map((stop, index) => ({
              placeName: stop.name,
              placeImage: stop.img,
              location,
              duration: stop.duration,
              notes: stop.tip,
              order: index,
            })),
          }],
        });
        setSharedTrip(trip);
        tripWasShared = true;
      }
      await bookingsApi.create({
        guideId: guide.id,
        tourType,
        startDate,
        endDate,
        groupSize,
        message: message.trim(),
        destinations: [destination],
      });
      setSubmitted(true);
    } catch (bookingError) {
      const reason = bookingError instanceof Error ? bookingError.message : 'Could not submit the booking request.';
      setError(tripWasShared
        ? `Your trip plan has been shared with ${guide.name}, but the booking request failed: ${reason}`
        : reason);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 py-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <img src={guide.profileImage || guide.avatar} alt={guide.name} className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{guide.name}</p>
            <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
              <span className={`inline-block w-2 h-2 rounded-full ${guide.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
              {guide.isAvailable ? 'Available' : 'Currently unavailable'} · ⭐ {Number(guide.rating || 0).toFixed(1)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100" style={{ color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#E6F4EF' }}>
                <CheckCircle size={28} style={{ color: 'var(--color-primary)' }} />
              </div>
              <p className="font-bold mb-1" style={{ fontFamily: 'Fraunces, serif', color: 'var(--color-text)' }}>Booking request sent</p>
              <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
                {guide.name} received your trip plan and can review your request for {destination}. Track its status in your tourist profile.
              </p>
              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 py-3 rounded-xl border-2 text-sm font-semibold"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                  Close
                </button>
                <Link to="/profile"
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white text-center"
                  style={{ background: 'var(--color-primary)' }}>
                  View my bookings
                </Link>
              </div>
            </div>
          ) : !currentUser || currentUser.role !== 'tourist' ? (
            <div className="py-5 text-center">
              <p className="mb-4 text-sm text-[var(--color-text-muted)]">Sign in as a tourist to request this guide.</p>
              <Link to={`/login?from=${encodeURIComponent('/planner')}`} className="inline-block rounded-xl bg-[#006A4E] px-5 py-3 text-sm font-bold text-white">
                Sign in as tourist
              </Link>
            </div>
          ) : (
            <form onSubmit={submitBooking} className="space-y-4">
              <p className="rounded-xl bg-[#E6F4EF] p-3 text-sm text-[#006A4E]">
                Your itinerary and planned stops will be shared with {guide.name} when you send this request.
              </p>
              <div>
                <label className="mb-1 block text-sm font-semibold">Guide service</label>
                <select value={tourType} onChange={event => setTourType(event.target.value)} className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-3 text-sm">
                  {guide.tourTypes?.map((tour: any) => <option key={tour.id || tour.name} value={tour.name}>{tour.name} · ৳{Number(tour.price).toLocaleString()}</option>)}
                  {!guide.tourTypes?.length && <option value="Private tour">Private tour · ৳{Number(guide.pricePerDay || 0).toLocaleString()}/day</option>}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">Start date
                  <input required type="date" min={todayString} value={startDate} onChange={event => { setStartDate(event.target.value); if (event.target.value > endDate) setEndDate(event.target.value); }} className="mt-1 w-full rounded-xl border border-[var(--color-border)] px-3 py-3 text-sm" />
                </label>
                <label className="text-sm font-semibold">End date
                  <input required type="date" min={startDate} value={endDate} onChange={event => setEndDate(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--color-border)] px-3 py-3 text-sm" />
                </label>
              </div>
              <label className="block text-sm font-semibold">Group size
                <input required type="number" min={1} max={50} value={groupSize} onChange={event => setGroupSize(Math.max(1, Number(event.target.value)))} className="mt-1 w-full rounded-xl border border-[var(--color-border)] px-3 py-3 text-sm" />
              </label>
              <label className="block text-sm font-semibold">Message to the guide
                <textarea value={message} onChange={event => setMessage(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-[var(--color-border)] px-3 py-3 text-sm" />
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="rounded-xl border-2 px-5 py-3 text-sm font-semibold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>Cancel</button>
                <button type="submit" disabled={saving || !guide.isAvailable} className="flex-1 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50" style={{ background: 'var(--color-primary)' }}>
                  {saving ? 'Sending request…' : guide.isAvailable ? 'Request this guide' : 'Guide unavailable'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function GeneratedItinerary({
  destination, prefs, budget, duration, transport, onReset, onSave, onBook
}: {
  destination: typeof DESTINATIONS[0];
  prefs: string[];
  budget: string;
  duration: string;
  transport: string;
  onReset: () => void;
  onSave: () => void;
  onBook: (guide: any) => void;
}) {
  const route = GENERATED_ROUTES[destination.id] || DEFAULT_ROUTE;
  const [activeStop, setActiveStop] = useState<number | null>(null);
  const transportOpt = TRANSPORT_OPTS.find(t => t.id === transport)!;
  const {
    data: fetchedGuides,
    loading: guidesLoading,
    error: guidesError,
  } = useApiData(() => guidesApi.list(), [] as any[]);
  const normalizedPlace = `${destination.name} ${destination.location} ${destination.district}`.toLowerCase();
  const guides = [...fetchedGuides].sort((a: any, b: any) => {
    const matchesPlace = (guide: any) => [guide.location, ...(guide.coverAreas || [])]
      .some(area => area && normalizedPlace.includes(String(area).toLowerCase()));
    const placeOrder = Number(matchesPlace(b)) - Number(matchesPlace(a));
    if (placeOrder) return placeOrder;
    const availabilityOrder = Number(Boolean(b.isAvailable)) - Number(Boolean(a.isAvailable));
    if (availabilityOrder) return availabilityOrder;
    return Number(b.rating || 0) - Number(a.rating || 0);
  });
  const productDestination = [destination.name, destination.location, destination.district].join('|');
  const {
    data: readyToPickProducts,
    loading: productsLoading,
    error: productsError,
  } = useApiData(
    () => (prefs.includes('readytopick')
      ? productsApi.list({ preorder: 1, destination: productDestination, limit: 100 })
      : Promise.resolve([])),
    [] as any[],
    [productDestination, prefs.includes('readytopick')]
  );

  return (
    <div className="space-y-5">
      {/* Route header */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
        <div className="relative h-44">
          <img src={destination.img} alt={destination.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E]/80 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#D4A017] text-white">{destination.type}</span>
              <span className="text-xs text-white/70">✨ AI-generated itinerary</span>
            </div>
            <h2 className="text-white font-bold text-xl" style={{ fontFamily: 'Fraunces, serif' }}>{destination.name}</h2>
            <p className="text-white/70 text-xs">📍 {destination.location}</p>
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 divide-x bg-white" style={{ borderColor: 'var(--color-border)' }}>
          {[
            { icon: <MapPin size={14} />, label: 'Distance', val: route.summary.distance },
            { icon: <Clock size={14} />, label: 'Total Time', val: route.summary.totalTime },
            { icon: <DollarSign size={14} />, label: 'Est. Cost', val: route.summary.cost },
          ].map(s => (
            <div key={s.label} className="py-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5" style={{ color: 'var(--color-primary)' }}>{s.icon}</div>
              <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>{s.val}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transport badge */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold" style={{ background: 'var(--color-surface-2)' }}>
        <span className="text-lg">{transportOpt.emoji}</span>
        <span style={{ color: 'var(--color-text)' }}>Recommended: {transportOpt.label}</span>
        <span className="ml-auto text-xs" style={{ color: 'var(--color-text-muted)' }}>{transportOpt.cost}</span>
      </div>

      {/* Stop-by-stop timeline */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Your Itinerary</p>
          <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>{route.stops.length} stops</p>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {route.stops.map((stop, i) => (
            <div key={i}>
              <button onClick={() => setActiveStop(activeStop === i ? null : i)}
                className="w-full flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'var(--color-primary)' }}>{i + 1}</div>
                  {i < route.stops.length - 1 && <div className="w-0.5 h-6 mt-1" style={{ background: 'var(--color-border)' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{stop.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{stop.time} · {stop.duration}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>{stop.type}</span>
                  </div>
                </div>
                <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${activeStop === i ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--color-text-muted)' }} />
              </button>
              {activeStop === i && (
                <div className="px-5 pb-4 flex gap-3 bg-gray-50">
                  <img src={stop.img} alt={stop.name} className="w-24 h-16 rounded-xl object-cover flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: '#D97706' }}>
                      💡 Tip
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text)' }}>{stop.tip}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ready to Pick along the route */}
      {prefs.includes('readytopick') && (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-border)', background: '#E6F4EF' }}>
            <span className="text-base">🟢</span>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>Ready to Pick — Along Your Route</p>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {productsLoading && <p className="px-5 py-4 text-sm text-[var(--color-text-muted)]">Finding ready-to-pick products near {destination.district}…</p>}
            {productsError && <p className="px-5 py-4 text-sm text-red-600">Could not load ready-to-pick products: {productsError}</p>}
            {!productsLoading && !productsError && readyToPickProducts.length === 0 && (
              <p className="px-5 py-4 text-sm text-[var(--color-text-muted)]">No in-stock ready-to-pick products are listed near {destination.district} yet. Browse all available products in the <Link to="/shop?filter=ready-to-pick" className="font-semibold text-[#006A4E] underline">marketplace</Link>.</p>
            )}
            {readyToPickProducts.map((item: any) => (
              <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {item.images?.[0] && <img src={item.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{item.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{item.vendor?.shopName || item.vendor?.name || 'Local vendor'} · ⏱ Prep: {item.preparationTime || 'Varies by vendor'}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>৳{item.price.toLocaleString()}</p>
                  <Link to={`/preorder/checkout?product=${encodeURIComponent(item.id)}&destination=${encodeURIComponent(destination.name)}`}
                    className="text-xs font-bold px-3 py-1 rounded-lg text-white mt-1 block"
                    style={{ background: 'var(--color-primary)' }}>
                    Pre-order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Traditional foods and local products of the destination's area */}
      <LocalTaste query={{ area: destination.district, scope: 'district' }} label={destination.district} />

      {/* Verified guides serving this destination */}
      {(
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
            <span className="text-base">🧭</span>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              Guides for {destination.name}
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {guidesLoading && <p className="p-5 text-sm text-[var(--color-text-muted)]">Loading verified guides…</p>}
            {guidesError && <p className="p-5 text-sm text-red-600">Could not load guides: {guidesError}</p>}
            {!guidesLoading && !guidesError && guides.length === 0 && (
              <p className="p-5 text-sm text-[var(--color-text-muted)]">There are no verified guides available yet. Please check the <Link to="/guides" className="font-semibold text-[#006A4E] underline">guide directory</Link> again later.</p>
            )}
            {guides.map((guide: any) => {
              const placeMatch = [guide.location, ...(guide.coverAreas || [])]
                .some(area => area && normalizedPlace.includes(String(area).toLowerCase()));
              return (
                <div key={guide.id} className="flex flex-wrap items-center gap-4 p-4">
                  <img src={guide.profileImage || guide.avatar} alt={guide.name} className="h-14 w-14 rounded-full object-cover" />
                  <div className="min-w-[160px] flex-1">
                    <p className="font-bold" style={{ color: 'var(--color-text)', fontFamily: 'Fraunces, serif' }}>{guide.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      {placeMatch ? `Covers ${destination.location}` : guide.location}
                      {guide.languages?.length ? ` · ${guide.languages.slice(0, 2).join(', ')}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      ⭐ {Number(guide.rating || 0).toFixed(1)} ({guide.reviewCount || 0} reviews) · ৳{Number(guide.pricePerDay || 0).toLocaleString()}/day
                    </p>
                    <span className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${guide.isAvailable ? 'text-green-700' : 'text-gray-500'}`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${guide.isAvailable ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {guide.isAvailable ? 'Accepting bookings' : 'Unavailable'}
                      {placeMatch && <span className="ml-1 rounded-full bg-green-50 px-2 py-0.5 text-green-700">Local guide</span>}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/guides/${guide.id}`} className="rounded-xl border-2 px-3 py-2 text-xs font-bold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      Profile
                    </Link>
                    <button type="button" disabled={!guide.isAvailable} onClick={() => onBook(guide)} className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ background: 'var(--color-primary)' }}>
                      Choose guide <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onSave}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm hover:opacity-90 transition-opacity"
          style={{ background: 'var(--color-primary)' }}>
          <Save size={15} /> Save This Trip
        </button>
        <button className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border-2 font-semibold text-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          <Share2 size={15} />
        </button>
        <button onClick={onReset}
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl border-2 font-semibold text-sm"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function TripPlanner() {
  const { currentUser } = useApp();
  const [tab, setTab] = useState<'quick' | 'saved'>('quick');

  // Quick planner state
  const [step, setStep] = useState<'form' | 'results'>('form');
  const [myLocation, setMyLocation] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [selectedDest, setSelectedDest] = useState<typeof DESTINATIONS[0] | null>(null);
  const [prefs, setPrefs] = useState<string[]>(['heritage', 'food', 'readytopick']);
  const [budget, setBudget] = useState('mid');
  const [duration, setDuration] = useState('fullday');
  const [transport, setTransport] = useState('cng');
  const [travelDate, setTravelDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bookingGuide, setBookingGuide] = useState<any | null>(null);

  // Saved trips state
  const { data: fetchedTrips } = useApiData(() => tripsApi.list(), [] as any[]);
  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  React.useEffect(() => {
    setTrips(fetchedTrips);
    if (fetchedTrips.length > 0) setSelectedTrip((prev: any) => prev || fetchedTrips[0]);
  }, [fetchedTrips]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set(['day1']));
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [newTripName, setNewTripName] = useState('');

  const filteredDests = DESTINATIONS.filter(d =>
    !destSearch || d.name.toLowerCase().includes(destSearch.toLowerCase()) || d.location.toLowerCase().includes(destSearch.toLowerCase())
  );

  function togglePref(id: string) {
    setPrefs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  function handleGenerate() {
    if (!myLocation || !selectedDest) return;
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setStep('results'); }, 1800);
  }

  async function handleSave() {
    if (!selectedDest) return;
    const route = GENERATED_ROUTES[selectedDest.id] || DEFAULT_ROUTE;
    const date = travelDate || new Date().toISOString().split('T')[0];
    try {
      const newTrip = await tripsApi.create({
        name: selectedDest.name,
        startDate: date,
        endDate: date,
        destinations: [selectedDest.location],
        status: 'planned',
        days: [{
          date,
          stops: route.stops.map((s, i) => ({
            placeName: s.name,
            placeImage: s.img,
            location: selectedDest.location,
            duration: s.duration,
            notes: s.tip,
            order: i,
          })),
        }],
      });
      setTrips(prev => [newTrip, ...prev]);
      setSaved(true);
      setTimeout(() => { setSaved(false); setTab('saved'); setSelectedTrip(newTrip); }, 1500);
    } catch (err) {
      console.error('Failed to save trip', err);
    }
  }

  // ---- Persisted trip editing (every change goes to MySQL via PUT /trips/:id) ----
  const { data: allPlaces } = useApiData(() => placesApi.list({ limit: 200 }), [] as any[]);
  const {
    data: availableTripGuides,
    loading: guideAvailabilityLoading,
    error: guideAvailabilityError,
  } = useApiData(
    () => currentUser?.role === 'tourist' && selectedTrip?.startDate && selectedTrip?.endDate
      ? guidesApi.list({ available: '1', startDate: selectedTrip.startDate, endDate: selectedTrip.endDate })
      : Promise.resolve([]),
    [] as any[],
    [currentUser?.role, selectedTrip?.startDate, selectedTrip?.endDate],
  );
  const [tripBusy, setTripBusy] = useState(false);
  const [tripError, setTripError] = useState('');
  const [addingToDay, setAddingToDay] = useState<string | null>(null);
  const [pickPlaceId, setPickPlaceId] = useState('');

  const toPayloadDays = (days: any[]) => days.map(d => ({
    date: d.date, notes: d.notes ?? null,
    stops: d.stops.map((st: any, i: number) => ({
      placeId: st.placeId ?? null, placeName: st.placeName, placeImage: st.placeImage ?? null,
      location: st.location ?? null, duration: st.duration ?? null, notes: st.notes ?? null, order: i,
    })),
  }));

  async function saveDays(days: any[]) {
    if (!selectedTrip) return;
    setTripBusy(true); setTripError('');
    try {
      const last = days.length ? days[days.length - 1].date : selectedTrip.startDate;
      const updated = await tripsApi.update(selectedTrip.id, {
        days: toPayloadDays(days),
        startDate: days.length ? days[0].date : selectedTrip.startDate,
        endDate: last,
      });
      setSelectedTrip(updated);
      setTrips(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    } catch (e: any) {
      setTripError(e?.message || 'Could not save your changes.');
    } finally {
      setTripBusy(false);
    }
  }

  async function saveTripSchedule() {
    if (!selectedTrip) return;
    if (selectedTrip.endDate < selectedTrip.startDate) {
      setTripError('Trip end date cannot be before the start date.');
      return;
    }
    if (selectedTrip.startTime && selectedTrip.endTime && selectedTrip.endTime <= selectedTrip.startTime) {
      setTripError('Trip end time must be after its start time.');
      return;
    }
    setTripBusy(true);
    setTripError('');
    try {
      const updated = await tripsApi.update(selectedTrip.id, {
        startDate: selectedTrip.startDate,
        endDate: selectedTrip.endDate,
        startTime: selectedTrip.startTime || null,
        endTime: selectedTrip.endTime || null,
      });
      setSelectedTrip(updated);
      setTrips(prev => prev.map(trip => trip.id === updated.id ? updated : trip));
    } catch (error) {
      setTripError(error instanceof Error ? error.message : 'Could not save the trip schedule.');
    } finally {
      setTripBusy(false);
    }
  }

  async function shareTripWithGuide(guide: any) {
    if (!selectedTrip) return;
    setTripBusy(true);
    setTripError('');
    try {
      const updated = await tripsApi.update(selectedTrip.id, { guideId: guide.id });
      setSelectedTrip(updated);
      setTrips(prev => prev.map(trip => trip.id === updated.id ? updated : trip));
    } catch (error) {
      setTripError(error instanceof Error ? error.message : 'Could not share the trip with this guide.');
    } finally {
      setTripBusy(false);
    }
  }

  const removeStop = (dayId: string, stopId: string) =>
    saveDays(selectedTrip.days.map((d: any) => (d.id === dayId ? { ...d, stops: d.stops.filter((st: any) => st.id !== stopId) } : d)));

  function addStop(dayId: string) {
    const place = allPlaces.find((p: any) => p.id === pickPlaceId);
    if (!place) return;
    const stop = { placeId: place.id, placeName: place.name, placeImage: place.images?.[0] ?? null,
                   location: `${place.district}, ${place.division}`, duration: '1–2 hours', notes: null };
    setAddingToDay(null); setPickPlaceId('');
    saveDays(selectedTrip.days.map((d: any) => (d.id === dayId ? { ...d, stops: [...d.stops, stop] } : d)));
  }

  function addDay() {
    const base = selectedTrip.days.length ? new Date(selectedTrip.days[selectedTrip.days.length - 1].date) : new Date(selectedTrip.startDate);
    if (selectedTrip.days.length) base.setDate(base.getDate() + 1);
    saveDays([...selectedTrip.days, { id: `new-${Date.now()}`, date: base.toISOString().slice(0, 10), stops: [] }]);
  }

  async function deleteTrip() {
    if (!selectedTrip || !window.confirm(`Delete the trip "${selectedTrip.name}"? This cannot be undone.`)) return;
    setTripBusy(true); setTripError('');
    try {
      await tripsApi.remove(selectedTrip.id);
      const remaining = trips.filter(t => t.id !== selectedTrip.id);
      setTrips(remaining);
      setSelectedTrip(remaining[0] ?? null);
    } catch (e: any) {
      setTripError(e?.message || 'Could not delete the trip.');
    } finally {
      setTripBusy(false);
    }
  }

  function toggleDay(dayId: string) {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId); else next.add(dayId);
      return next;
    });
  }

  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <Compass size={64} className="mb-6 opacity-20" style={{ color: 'var(--color-primary)' }} />
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Fraunces, serif' }}>Plan Your Heritage Journey</h2>
        <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>Sign in to create and save personalised trip plans</p>
        <Link to="/login" className="bg-[#006A4E] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#004D38] transition-colors">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {bookingGuide && selectedDest && (
        <GuideBookingModal
          guide={bookingGuide}
          destination={selectedDest.name}
          location={selectedDest.location}
          route={GENERATED_ROUTES[selectedDest.id] || DEFAULT_ROUTE}
          preferredDate={travelDate}
          onClose={() => setBookingGuide(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--color-text)' }}>Trip Planner</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Plan your perfect heritage journey from your location</p>
          </div>
          {saved && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: '#D1FAE5', color: '#059669' }}>
              <CheckCircle size={15} /> Trip saved! Switching to My Saved Trips...
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1.5 rounded-2xl mb-7" style={{ background: 'var(--color-surface-2)', width: 'fit-content' }}>
          <button onClick={() => setTab('quick')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={tab === 'quick'
              ? { background: 'var(--color-primary)', color: 'white' }
              : { color: 'var(--color-text-muted)' }}>
            <Zap size={15} /> Quick Route Plan
          </button>
          <button onClick={() => setTab('saved')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={tab === 'saved'
              ? { background: 'var(--color-primary)', color: 'white' }
              : { color: 'var(--color-text-muted)' }}>
            <Calendar size={15} /> My Saved Trips ({trips.length})
          </button>
        </div>

        {/* ── QUICK ROUTE PLAN ── */}
        {tab === 'quick' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Form column */}
            <div className={`${step === 'results' ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-5 transition-all`}>

              {step === 'results' && (
                <button onClick={() => { setStep('form'); setSelectedDest(null); }}
                  className="flex items-center gap-2 text-sm font-semibold hover:underline"
                  style={{ color: 'var(--color-text-muted)' }}>
                  ← Change plan
                </button>
              )}

              {/* My Location */}
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--color-primary)' }}>1</div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Your Starting Location</h3>
                </div>
                <LocationDetector value={myLocation} onChange={setMyLocation} />
              </div>

              {/* Choose Destination */}
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--color-primary)' }}>2</div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Choose Destination</h3>
                </div>
                <div className="relative mb-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                  <input value={destSearch} onChange={e => setDestSearch(e.target.value)}
                    placeholder="Search heritage places..."
                    className="w-full pl-9 pr-4 py-3 rounded-xl border-2 text-sm outline-none border-[var(--color-border)] focus:border-[var(--color-primary)]" />
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                  {filteredDests.map(d => (
                    <button key={d.id} onClick={() => setSelectedDest(d)}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all"
                      style={selectedDest?.id === d.id
                        ? { borderColor: 'var(--color-primary)', background: '#E6F4EF' }
                        : { borderColor: 'var(--color-border)', background: 'white' }}>
                      <img src={d.img} alt={d.name} className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{d.name}</p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>📍 {d.location} · ⏱ {d.duration}</p>
                      </div>
                      {selectedDest?.id === d.id && <CheckCircle size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--color-primary)' }}>3</div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>What interests you?</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PREFS.map(p => (
                    <button key={p.id} onClick={() => togglePref(p.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all"
                      style={prefs.includes(p.id)
                        ? { borderColor: 'var(--color-primary)', background: '#E6F4EF', color: 'var(--color-primary)' }
                        : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                      {p.emoji} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget + Duration */}
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--color-primary)' }}>4</div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Budget & Duration</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Budget</p>
                    <div className="grid grid-cols-3 gap-2">
                      {BUDGETS.map(b => (
                        <button key={b.id} onClick={() => setBudget(b.id)}
                          className="flex flex-col items-center p-3 rounded-xl border-2 text-center transition-all"
                          style={budget === b.id
                            ? { borderColor: 'var(--color-primary)', background: '#E6F4EF' }
                            : { borderColor: 'var(--color-border)' }}>
                          <span className="text-lg mb-1">{b.icon}</span>
                          <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>{b.label}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{b.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Duration</p>
                    <div className="grid grid-cols-3 gap-2">
                      {DURATIONS.map(d => (
                        <button key={d.id} onClick={() => setDuration(d.id)}
                          className="flex flex-col items-center p-3 rounded-xl border-2 text-center transition-all"
                          style={duration === d.id
                            ? { borderColor: 'var(--color-primary)', background: '#E6F4EF' }
                            : { borderColor: 'var(--color-border)' }}>
                          <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>{d.label}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{d.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transport + Date */}
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'var(--color-primary)' }}>5</div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Transport & Date</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>Preferred transport</p>
                    <div className="grid grid-cols-2 gap-2">
                      {TRANSPORT_OPTS.map(t => (
                        <button key={t.id} onClick={() => setTransport(t.id)}
                          className="flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all"
                          style={transport === t.id
                            ? { borderColor: 'var(--color-primary)', background: '#E6F4EF' }
                            : { borderColor: 'var(--color-border)' }}>
                          <span className="text-lg">{t.emoji}</span>
                          <div>
                            <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>{t.label}</p>
                            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.cost}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--color-text-muted)' }}>Travel date</p>
                    <input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none border-[var(--color-border)] focus:border-[var(--color-primary)]" />
                  </div>
                </div>
              </div>

              {/* Generate button */}
              <button onClick={handleGenerate} disabled={!myLocation || !selectedDest || generating}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-50 hover:opacity-90"
                style={{ background: 'var(--color-primary)' }}>
                {generating
                  ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating your plan...</>
                  : <><Zap size={18} /> Generate My Route Plan</>}
              </button>
              {(!myLocation || !selectedDest) && (
                <p className="text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Please set your location and choose a destination to continue
                </p>
              )}
            </div>

            {/* Results column */}
            <div className={step === 'results' ? 'lg:col-span-3' : 'lg:col-span-2'}>
              {step === 'results' && selectedDest ? (
                <GeneratedItinerary
                  destination={selectedDest}
                  prefs={prefs}
                  budget={budget}
                  duration={duration}
                  transport={transport}
                  onReset={() => { setStep('form'); setSelectedDest(null); }}
                  onSave={handleSave}
                  onBook={setBookingGuide}
                />
              ) : (
                /* Preview / placeholder */
                <div className="sticky top-24 space-y-4">
                  <div className="bg-white rounded-2xl border p-6 text-center" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E6F4EF' }}>
                      <Compass size={30} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <h3 className="font-bold mb-2" style={{ fontFamily: 'Fraunces, serif', color: 'var(--color-text)' }}>Your Route Will Appear Here</h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Fill in your details and click <strong>Generate My Route Plan</strong> to get a personalised itinerary with stops, costs, and Ready to Pick products along the way.
                    </p>
                  </div>
                  <div className="rounded-2xl p-5" style={{ background: '#1A1A2E' }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4ade80' }}>What you get</p>
                    {[
                      '📍 Turn-by-turn stop itinerary',
                      '⏱ Time estimates at each stop',
                      '💰 Total trip cost estimate',
                      '🟢 Ready to Pick products nearby',
                      '🧭 Guide recommendation',
                      '💡 Local tips & warnings',
                    ].map(item => (
                      <p key={item} className="text-sm py-1.5 border-b border-white/10 last:border-0" style={{ color: 'rgba(255,255,255,0.7)' }}>{item}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SAVED TRIPS ── */}
        {tab === 'saved' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{trips.length} saved trips</p>
              <button onClick={() => setShowNewTrip(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white"
                style={{ background: 'var(--color-primary)' }}>
                <Plus size={15} /> New Trip
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Trip list */}
              <div className="space-y-3">
                {trips.map(trip => (
                  <button key={trip.id} onClick={() => setSelectedTrip(trip)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selectedTrip?.id === trip.id ? 'border-[#006A4E] bg-[#006A4E]/5' : 'border-[var(--color-border)] bg-white hover:border-gray-300'}`}>
                    <p className="font-semibold text-sm">{trip.name}</p>
                    <div className="flex items-center gap-1 text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      <Calendar size={11} />
                      {new Date(trip.startDate).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' })} – {new Date(trip.endDate).toLocaleDateString('en-BD', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <Badge variant={trip.status === 'planned' ? 'green' : 'gray'} size="sm" className="mt-2">{trip.status}</Badge>
                  </button>
                ))}
                {showNewTrip && (
                  <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-[#006A4E]">
                    <input autoFocus type="text" value={newTripName} onChange={e => setNewTripName(e.target.value)}
                      placeholder="Trip name..." className="w-full text-sm outline-none border-b border-[var(--color-border)] pb-1 mb-3" />
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        if (newTripName) {
                          const today = new Date().toISOString().split('T')[0];
                          try {
                            const created = await tripsApi.create({ name: newTripName, startDate: today, endDate: today, status: 'draft', destinations: [], days: [] });
                            setTrips(t => [...t, created]);
                            setSelectedTrip(created);
                          } catch (err) {
                            console.error('Failed to create trip', err);
                          }
                          setNewTripName('');
                          setShowNewTrip(false);
                        }
                      }} className="flex-1 text-white text-xs py-2 rounded-lg font-semibold" style={{ background: 'var(--color-primary)' }}>
                        Create
                      </button>
                      <button onClick={() => setShowNewTrip(false)} className="px-3 py-2 text-xs border border-[var(--color-border)] rounded-lg">Cancel</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Trip detail */}
              <div className="lg:col-span-3">
                {selectedTrip && (
                  <div>
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>{selectedTrip.name}</h2>
                        <div className="flex items-center gap-2 text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                          <Calendar size={14} />
                          {new Date(selectedTrip.startDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'long' })} –{' '}
                          {new Date(selectedTrip.endDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedTrip.destinations.map((d: string) =><Badge key={d} variant="green" size="sm">{d}</Badge>)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={addDay} disabled={tripBusy} className="px-3 py-2 rounded-xl text-xs font-semibold border disabled:opacity-50" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>+ Add Day</button>
                        <button onClick={deleteTrip} disabled={tripBusy} className="px-3 py-2 rounded-xl text-xs font-semibold border disabled:opacity-50" style={{ borderColor: '#F42A41', color: '#F42A41' }}>Delete Trip</button>
                      </div>
                    </div>
                    <section className="mb-5 rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
                      <h3 className="mb-3 font-bold">Trip schedule</h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                          Start date
                          <input type="date" value={selectedTrip.startDate} onChange={event => setSelectedTrip({ ...selectedTrip, startDate: event.target.value })} className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-2 py-2 text-sm text-[var(--color-text)]" />
                        </label>
                        <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                          End date
                          <input type="date" min={selectedTrip.startDate} value={selectedTrip.endDate} onChange={event => setSelectedTrip({ ...selectedTrip, endDate: event.target.value })} className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-2 py-2 text-sm text-[var(--color-text)]" />
                        </label>
                        <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                          Starting time
                          <input type="time" value={selectedTrip.startTime || ''} onChange={event => setSelectedTrip({ ...selectedTrip, startTime: event.target.value || null })} className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-2 py-2 text-sm text-[var(--color-text)]" />
                        </label>
                        <label className="text-xs font-semibold text-[var(--color-text-muted)]">
                          Ending time
                          <input type="time" value={selectedTrip.endTime || ''} onChange={event => setSelectedTrip({ ...selectedTrip, endTime: event.target.value || null })} className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-2 py-2 text-sm text-[var(--color-text)]" />
                        </label>
                      </div>
                      <button onClick={saveTripSchedule} disabled={tripBusy} className="mt-3 rounded-xl bg-[#006A4E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        {tripBusy ? 'Saving…' : 'Save schedule'}
                      </button>
                      {selectedTrip.startTime && selectedTrip.endTime && selectedTrip.endTime <= selectedTrip.startTime && (
                        <p className="mt-2 text-sm text-red-600">Ending time must be after starting time.</p>
                      )}
                    </section>
                    {tripError && <p className="text-sm text-red-600 mb-3">{tripError}</p>}
                    {currentUser.role === 'tourist' && (
                      <section className="mb-5 rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
                        <h3 className="font-bold">Guide availability for these dates</h3>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          Suggestions are based on guides accepting bookings and no pending or confirmed booking conflicts. Your requested hours are shared with the guide, who must confirm the exact time.
                        </p>
                        {selectedTrip.guideId && (
                          <p className="mt-2 text-sm font-semibold text-[#006A4E]">This trip is already shared with your selected guide.</p>
                        )}
                        {guideAvailabilityLoading && <p className="mt-3 text-sm text-[var(--color-text-muted)]">Checking guide availability…</p>}
                        {guideAvailabilityError && <p className="mt-3 text-sm text-red-600">Could not check guide availability: {guideAvailabilityError}</p>}
                        {!guideAvailabilityLoading && !guideAvailabilityError && availableTripGuides.length === 0 && (
                          <p className="mt-3 text-sm text-[var(--color-text-muted)]">No currently available guides were found for these dates. Try adjusting your dates.</p>
                        )}
                        <div className="mt-3 space-y-2">
                          {availableTripGuides.map((guide: any) => (
                            <div key={guide.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F8F7F4] p-3">
                              <div>
                                <p className="text-sm font-semibold">{guide.name} · {Number(guide.rating || 0).toFixed(1)} ★</p>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                  {guide.location || 'Location not listed'} · No booking conflict for these dates
                                  {selectedTrip.startTime && selectedTrip.endTime ? ` · Requested ${selectedTrip.startTime}–${selectedTrip.endTime}` : ''}
                                </p>
                              </div>
                              <button onClick={() => shareTripWithGuide(guide)} disabled={tripBusy || selectedTrip.guideId === guide.id} className="rounded-lg bg-[#006A4E] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                                {selectedTrip.guideId === guide.id ? 'Selected guide' : tripBusy ? 'Sharing…' : 'Share trip'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                    {selectedTrip.days.length === 0 && (
                      <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>This trip has no days yet — use “+ Add Day”, then add stops from our heritage places.</p>
                    )}
                    <div className="space-y-4">
                      {selectedTrip.days.map((day: TripDay) => (
                        <div key={day.id} className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                          <button onClick={() => toggleDay(day.id)}
                            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: 'var(--color-primary)' }}>
                                {selectedTrip.days.indexOf(day) + 1}
                              </div>
                              <div className="text-left">
                                <p className="font-semibold">Day {selectedTrip.days.indexOf(day) + 1}</p>
                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                                  {new Date(day.date).toLocaleDateString('en-BD', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{day.stops.length} stops</span>
                              {expandedDays.has(day.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </button>
                          {expandedDays.has(day.id) && (
                            <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                              <div className="space-y-3 mt-4">
                                {day.stops.map((stop: TripStop, idx: number) => (
                                  <div key={stop.id} className="flex gap-4 items-start">
                                    <div className="flex flex-col items-center">
                                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#E6F4EF', color: 'var(--color-primary)' }}>{idx + 1}</div>
                                      {idx < day.stops.length - 1 && <div className="w-0.5 h-8 mt-1" style={{ background: '#E6F4EF' }} />}
                                    </div>
                                    <div className="flex-1 flex gap-3 rounded-xl p-3" style={{ background: 'var(--color-surface-2)' }}>
                                      <img src={stop.placeImage} alt={stop.placeName} className="w-14 h-14 rounded-lg object-cover" />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm">{stop.placeName}</p>
                                        <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                                          <MapPin size={10} /> {stop.location}
                                        </p>
                                        <p className="text-xs mt-1" style={{ color: 'var(--color-primary)' }}>{stop.duration}</p>
                                      </div>
                                      <button title="Remove stop" disabled={tripBusy} onClick={() => removeStop(day.id, stop.id)} className="p-1.5 hover:text-red-500 transition-colors disabled:opacity-50" style={{ color: 'var(--color-text-muted)' }}>
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {addingToDay === day.id ? (
                                <div className="mt-4 flex gap-2">
                                  <select value={pickPlaceId} onChange={e => setPickPlaceId(e.target.value)} className="flex-1 text-sm border rounded-xl px-3 py-2">
                                    <option value="">Choose a heritage place…</option>
                                    {allPlaces.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {p.district}</option>)}
                                  </select>
                                  <button disabled={!pickPlaceId || tripBusy} onClick={() => addStop(day.id)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: 'var(--color-primary)' }}>Add</button>
                                  <button onClick={() => { setAddingToDay(null); setPickPlaceId(''); }} className="px-3 py-2 rounded-xl text-sm border">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => setAddingToDay(day.id)} className="mt-4 flex items-center gap-2 text-sm font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
                                  <Plus size={14} /> Add a stop
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
