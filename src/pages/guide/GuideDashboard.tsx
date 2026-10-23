import React, { useEffect, useState } from 'react';
import { Star, Calendar, DollarSign, Users, ToggleLeft, ToggleRight, MapPin, CheckCircle, XCircle, Clock, Phone } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Badge from '../../components/ui/Badge';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';
import { bookingsApi, earningsApi, guidesApi, tripsApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';

const TODAY = () => new Date().toISOString().slice(0, 10);

const fmtDate = (b: any) =>
  b.startDate === b.endDate
    ? new Date(b.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : `${new Date(b.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(b.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

export default function GuideDashboard() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('bookings');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const isGuide = currentUser?.role === 'guide';

  const { data: bookings, loading: bookingsLoading, error: bookingsError, refetch: refetchBookings } = useApiData(
    () => (isGuide ? bookingsApi.list() : Promise.resolve([])), [] as any[], [currentUser?.id]
  );
  const { data: profile, refetch: refetchProfile } = useApiData(
    () => (isGuide ? guidesApi.get(currentUser!.id) : Promise.resolve(null)), null as any, [currentUser?.id]
  );
  const { data: earnings, loading: earningsLoading, error: earningsError, refetch: refetchEarnings } = useApiData(
    () => (isGuide ? earningsApi.me() : Promise.resolve(null)), null as any, [currentUser?.id]
  );
  const { data: sharedPlans, loading: plansLoading, error: plansError, refetch: refetchPlans } = useApiData(
    () => (isGuide ? tripsApi.list() : Promise.resolve([])), [] as any[], [currentUser?.id]
  );
  useEffect(() => {
    if (!isGuide) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        refetchBookings();
        refetchPlans();
        refetchEarnings();
      }
    }, 20000);
    return () => window.clearInterval(timer);
  }, [isGuide, refetchBookings, refetchPlans, refetchEarnings]);

  const isAvailable = !!profile?.isAvailable;
  const locationSharing = !!profile?.isLocationSharing;
  const phonePublic = !!profile?.isPhonePublic;
  const profileIncomplete = !profile?.bio?.trim() || !profile?.location?.trim()
    || !(profile?.pricePerDay > 0) || !Array.isArray(profile?.tourTypes) || profile.tourTypes.length === 0;

  async function toggleProfileFlag(field: 'isAvailable' | 'isLocationSharing' | 'isPhonePublic', value: boolean) {
    setActionError('');
    try {
      await guidesApi.update(currentUser!.id, { [field]: value });
      await refetchProfile();
    } catch (e: any) {
      setActionError(e?.message || 'Could not update your settings.');
    }
  }

  async function changeBookingStatus(id: string, status: string) {
    setBusyId(id); setActionError('');
    try {
      await bookingsApi.update(id, status);
      if (status === 'awaiting_confirmation') {
        await Promise.all([refetchBookings(), refetchProfile(), refetchPlans()]);
      } else {
        await refetchBookings();
      }
    } catch (e: any) {
      setActionError(e?.message || 'Could not update the booking.');
    } finally {
      setBusyId(null);
    }
  }

  async function changeSharedPlanStatus(planId: string, update: { guideResponse?: 'accepted' | 'declined' }) {
    setBusyId(`trip-${planId}`);
    setActionError('');
    try {
      await tripsApi.update(planId, update);
      await Promise.all([
        refetchPlans(),
        refetchBookings(),
      ]);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update the shared trip plan.');
    } finally {
      setBusyId(null);
    }
  }

  const today = TODAY();
  const pending   = bookings.filter((b: any) => b.status === 'pending');
  const upcoming  = bookings.filter((b: any) => b.status === 'accepted' && b.endDate >= today);
  const history   = bookings.filter((b: any) => !pending.includes(b) && !upcoming.includes(b));
  const shown     = activeTab === 'bookings' ? pending : activeTab === 'upcoming' ? upcoming : history;
  const earningsData = (earnings?.byMonth ?? []).map((item: any) => ({
    month: new Date(`${item.month}-01T00:00:00`).toLocaleString('en', { month: 'short' }),
    earnings: Number(item.amount) || 0,
  }));
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthEarnings = Number(
    earnings?.byMonth?.find((item: any) => item.month === currentMonth)?.amount ?? 0
  );
  const lifetimeEarnings = earnings?.totals?.totalEarning ?? 0;

  if (!currentUser || currentUser.role !== 'guide') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-[var(--color-text-muted)] mb-4">Please sign in as a tour guide to access the dashboard.</p>
        <Link to="/login" className="bg-[#006A4E] text-white px-6 py-3 rounded-xl font-semibold">Sign In as Guide</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'Fraunces, serif' }}>Guide Dashboard</h1>
            <p className="text-[var(--color-text-muted)]">Welcome back, {currentUser.name.split(' ')[0]}</p>
          </div>
          <div id="availability" className="flex gap-4">
            <button
              onClick={() => toggleProfileFlag('isAvailable', !isAvailable)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border-2 transition-colors ${isAvailable ? 'border-[#006A4E] bg-[#006A4E]/10 text-[#006A4E]' : 'border-gray-300 text-gray-500'}`}
            >
              {isAvailable ? <ToggleRight size={20} className="text-[#006A4E]" /> : <ToggleLeft size={20} />}
              {isAvailable ? 'Available' : 'Unavailable'}
            </button>
            <button
              onClick={() => toggleProfileFlag('isLocationSharing', !locationSharing)}
              title="When ON (and you are Available and verified), tourists see your approximate base area (~1 km) on the map. This is not live GPS tracking."
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border-2 transition-colors ${locationSharing ? 'border-[#D4A017] bg-[#D4A017]/10 text-[#D4A017]' : 'border-gray-300 text-gray-500'}`}
            >
              <MapPin size={16} />
              {locationSharing ? 'Location ON' : 'Location OFF'}
            </button>
            <button
              onClick={() => toggleProfileFlag('isPhonePublic', !phonePublic)}
              disabled={!currentUser.phone}
              title="When enabled, your account phone number is visible to all visitors on your public guide profile."
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border-2 transition-colors disabled:opacity-50 ${phonePublic ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]' : 'border-gray-300 text-gray-500'}`}
            >
              <Phone size={16} />
              {phonePublic ? 'Phone Public' : 'Phone Private'}
            </button>
          </div>
        </div>
        {profileIncomplete && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">Your verified profile remains visible in guide listings, but tourists cannot book until you add your bio, location, daily price, and tour services.</p>
            <Link to="/onboarding/guide" className="rounded-xl bg-[#006A4E] px-4 py-2 text-sm font-semibold text-white">Complete profile</Link>
          </div>
        )}

        {/* Stats */}
        {earningsError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">Could not load earnings: {earningsError}</p>}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: '#006A4E' },
            { label: 'Earnings This Month', value: earningsLoading ? '…' : `৳${thisMonthEarnings.toLocaleString()}`, icon: DollarSign, color: '#D4A017' },
            { label: 'Total Partner Earnings', value: earningsLoading ? '…' : `৳${lifetimeEarnings.toLocaleString()}`, icon: DollarSign, color: '#006A4E' },
            { label: 'Platform Advance', value: earningsLoading ? '…' : `৳${Number(earnings?.totals?.paidViaPlatform || 0).toLocaleString()}`, icon: DollarSign, color: '#2563EB' },
            { label: 'Cash Balance', value: earningsLoading ? '…' : `৳${Number(earnings?.totals?.collectedCash || 0).toLocaleString()}`, icon: DollarSign, color: '#7C3AED' },
            { label: 'Pending Release', value: earningsLoading ? '…' : `৳${Number(earnings?.totals?.pendingRelease || 0).toLocaleString()}`, icon: Clock, color: '#D4A017' },
            { label: 'Rating', value: profile?.reviewCount ? `${profile.rating} ★ (${profile.reviewCount})` : 'No reviews yet', icon: Star, color: '#F42A41' },
            { label: 'Upcoming Tours', value: upcoming.length, icon: Users, color: '#006A4E' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">{stat.label}</span>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Tour Planner', emoji: '🗺️', to: '/guide/tour-planner', primary: true },
            { label: 'View Bookings', emoji: '📅', to: '#bookings', primary: false },
            { label: 'Availability', emoji: '⏰', to: '#availability', primary: false },
            { label: 'Messages', emoji: '💬', to: '/chat', primary: false },
            { label: 'Edit Profile', emoji: '👤', to: '/onboarding/guide', primary: false },
          ].map(a => (
            <Link key={a.label} to={a.to}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 font-semibold text-sm transition-all hover:shadow-md"
              style={a.primary
                ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'white' }
                : { background: 'white', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
              <span className="text-2xl">{a.emoji}</span>
              {a.label}
            </Link>
          ))}
        </div>

        {/* Earnings Chart */}
        <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] mb-8">
          <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'Fraunces, serif' }}>Earnings Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={earningsData}>
              <defs>
                <linearGradient id="earnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#006A4E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#006A4E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: unknown) => [`৳${Number(v).toLocaleString()}`, 'Earnings']} />
              <Area type="monotone" dataKey="earnings" stroke="#006A4E" strokeWidth={2} fill="url(#earnings)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Requests */}
        <div id="bookings" className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="flex gap-4 p-5 border-b border-[var(--color-border)]">
            {['bookings', 'upcoming', 'history'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-semibold capitalize pb-1 border-b-2 transition-colors ${activeTab === tab ? 'border-[#006A4E] text-[#006A4E]' : 'border-transparent text-[var(--color-text-muted)]'}`}
              >
                {tab === 'bookings' ? 'Booking Requests' : tab === 'upcoming' ? 'Upcoming Tours' : 'History'}
              </button>
            ))}
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {bookingsLoading && <p className="p-5 text-sm text-[var(--color-text-muted)]">Loading bookings…</p>}
            {bookingsError && <p className="p-5 text-sm text-red-600">Couldn't load bookings: {bookingsError}</p>}
            {actionError && <p className="p-3 px-5 text-sm text-red-600 bg-red-50">{actionError}</p>}
            {!bookingsLoading && !bookingsError && shown.length === 0 && (
              <p className="p-8 text-center text-sm text-[var(--color-text-muted)]">
                {activeTab === 'bookings' ? 'No pending booking requests.' : activeTab === 'upcoming' ? 'No upcoming tours.' : 'No past bookings yet.'}
              </p>
            )}
            {shown.map((req: any) => (
              <div key={req.id} className="p-5">
                <div className="flex items-start gap-4 flex-wrap">
                  {req.touristAvatar
                    ? <img src={req.touristAvatar} alt={req.touristName} className="w-12 h-12 rounded-full object-cover" />
                    : <div className="w-12 h-12 rounded-full bg-[#006A4E]/10 flex items-center justify-center font-bold text-[#006A4E]">{(req.touristName || '?')[0]}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <p className="font-semibold">{req.touristName || 'Tourist'}</p>
                      <Badge variant={req.status === 'pending' ? 'gold' : ['accepted', 'awaiting_confirmation', 'completed'].includes(req.status) ? 'green' : 'red'} size="sm">
                        {req.status === 'completed' ? 'Successfully completed' : req.status === 'awaiting_confirmation' ? 'Waiting for tourist confirmation' : req.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)] mb-1">
                      <span className="font-medium">{req.tourType}</span> · {fmtDate(req)} · {req.groupSize} person(s)
                    </p>
                    {req.message && <p className="text-sm text-[var(--color-text-muted)] line-clamp-1 mb-2">{req.message}</p>}
                    <p className="font-bold text-[#006A4E]">৳{req.totalPrice.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      Advance: ৳{Number(req.advanceAmount || 0).toLocaleString()} · Cash balance: ৳{Number(req.balanceAmount || 0).toLocaleString()}
                    </p>
                    {req.status === 'completed' && <p className="mt-2 text-sm font-semibold text-[#006A4E]">Settlement recorded. Check your earnings summary for platform advance and cash balance.</p>}
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button disabled={busyId === req.id} onClick={() => changeBookingStatus(req.id, 'accepted')}
                        className="flex items-center gap-1 bg-[#006A4E] text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-[#004D38] transition-colors disabled:opacity-50">
                        <CheckCircle size={14} /> Accept
                      </button>
                      <button disabled={busyId === req.id} onClick={() => changeBookingStatus(req.id, 'rejected')}
                        className="flex items-center gap-1 border border-[#F42A41] text-[#F42A41] px-3 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50">
                        <XCircle size={14} /> Decline
                      </button>
                    </div>
                  )}
                  {req.status === 'accepted' && (
                    <button disabled={busyId === req.id || req.endDate > today} onClick={() => changeBookingStatus(req.id, 'awaiting_confirmation')}
                      className="flex items-center gap-1 bg-[#D4A017] text-white px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
                      <CheckCircle size={14} /> {req.endDate > today ? `Tour ends ${req.endDate}` : 'Mark Tour Finished'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <section id="plans" className="mt-8 space-y-4">
          <div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>Tourist trip plans shared with you</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Review shared itineraries, respond to the tourist, and mark the tour finished so the tourist can confirm completion.</p>
          </div>
          {plansLoading && <p className="text-sm text-[var(--color-text-muted)]">Loading shared plans…</p>}
          {plansError && <p className="text-sm text-red-600">Could not load shared plans: {plansError}</p>}
          {!plansLoading && !plansError && sharedPlans.length === 0 && (
            <p className="rounded-2xl border border-[var(--color-border)] bg-white p-5 text-sm text-[var(--color-text-muted)]">No tourists have shared a trip plan with you yet.</p>
          )}
          {sharedPlans.map((plan: any) => (
            <article key={plan.id} className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{plan.name}</h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Planned by {plan.ownerName || 'Tourist'} · {plan.startDate} – {plan.endDate}
                    {plan.startTime && plan.endTime ? ` · ${plan.startTime}–${plan.endTime}` : ''}
                  </p>
                  <p className="mt-1 text-sm text-[#006A4E]">{(plan.destinations || []).join(' · ') || 'No destination listed'}</p>
                  {plan.guideFee !== null && plan.guideFee !== undefined && (
                    <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">
                      {plan.guideResponse === 'accepted' ? 'Agreed guide fee' : 'Estimated guide fee'}: ৳{Number(plan.guideFee).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={plan.guideResponse === 'accepted' ? 'green' : plan.guideResponse === 'declined' ? 'red' : 'gold'}>
                    {plan.guideResponse === 'accepted' ? 'Guide accepted' : plan.guideResponse === 'declined' ? 'Guide declined' : 'Awaiting response'}
                  </Badge>
                  <Badge variant={plan.status === 'completed' ? 'green' : 'gray'}>
                    {plan.status === 'completed' ? 'Successfully completed' : 'Not completed'}
                  </Badge>
                </div>
              </div>
              {plan.description && <p className="mt-3 text-sm text-[var(--color-text-muted)]">{plan.description}</p>}
              <div className="mt-4 space-y-3">
                {(plan.days || []).map((day: any, index: number) => (
                  <div key={day.id || index} className="rounded-xl bg-[#F8F7F4] p-3">
                    <p className="mb-2 text-xs font-bold uppercase text-[var(--color-text-muted)]">Day {index + 1} · {day.date}</p>
                    {day.notes && <p className="mb-2 text-sm">{day.notes}</p>}
                    <ul className="space-y-2">
                      {(day.stops || []).map((stop: any) => (
                        <li key={stop.id} className="text-sm">
                          <span className="font-semibold">{stop.placeName}</span>
                          {stop.duration && <span className="text-[var(--color-text-muted)]"> · {stop.duration}</span>}
                          {stop.notes && <p className="text-xs text-[var(--color-text-muted)]">{stop.notes}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {plan.guideResponse === 'pending' && plan.status !== 'completed' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {!plan.guideBookingId && <p className="basis-full text-xs text-amber-800">Accepting creates the guide booking with a demo-mode bKash advance. No real payment gateway is connected.</p>}
                  <button
                    disabled={busyId === `trip-${plan.id}`}
                    onClick={() => changeSharedPlanStatus(plan.id, { guideResponse: 'accepted' })}
                    className="rounded-xl bg-[#006A4E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {busyId === `trip-${plan.id}` ? 'Saving…' : 'Accept trip plan'}
                  </button>
                  <button
                    disabled={busyId === `trip-${plan.id}`}
                    onClick={() => changeSharedPlanStatus(plan.id, { guideResponse: 'declined' })}
                    className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              )}
              {plan.guideResponse === 'accepted' && plan.guideBookingStatus === 'accepted' && plan.guideBookingId && plan.status !== 'completed' && (
                <button
                  disabled={busyId === plan.guideBookingId || plan.endDate > today}
                  onClick={() => changeBookingStatus(plan.guideBookingId, 'awaiting_confirmation')}
                  className="mt-4 rounded-xl bg-[#D4A017] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busyId === plan.guideBookingId ? 'Saving…' : plan.endDate > today ? `Tour ends ${plan.endDate}` : 'Mark Tour Finished'}
                </button>
              )}
              {plan.guideBookingStatus === 'awaiting_confirmation' && <p className="mt-4 text-sm font-semibold text-amber-700">You marked the tour finished. Waiting for the tourist to confirm completion and cash-balance payment.</p>}
              {plan.guideBookingStatus === 'completed' && <p className="mt-4 text-sm font-semibold text-[#006A4E]">Tour completed and settlement recorded.</p>}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
