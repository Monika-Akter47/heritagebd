import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { tripsApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import { useApp } from '../../context/AppContext';
import {
  MapPin, Plus, Trash2, Save, Navigation, ChevronDown,
  ChevronUp, CheckCircle, X
} from 'lucide-react';

const DESTINATIONS = [
  'Lalbagh Fort', 'Ahsan Manzil', 'Sadarghat', 'Sonargaon', 'Paharpur',
  'Bagerhat Mosque', 'Cox\'s Bazar Beach', 'Sundarbans', 'Srimangal Tea Gardens',
  'Mahasthangarh', 'Mainamati', 'Rangamati', 'Bandarban', 'Sylhet Shrine',
  'Folk Art Museum', 'Baldha Garden', 'Star Mosque', 'Shait Gambuj Mosque'
];

const TRANSPORT_OPTIONS = [
  { id: 'walking', label: 'Walking', emoji: '🚶', costRange: '৳0', speed: 'Slow', color: '#059669' },
  { id: 'rickshaw', label: 'Rickshaw', emoji: '🛺', costRange: '৳100–200', speed: 'Slow', color: '#D97706' },
  { id: 'cng', label: 'CNG', emoji: '🛵', costRange: '৳300–400', speed: 'Medium', color: '#2563EB' },
  { id: 'bus', label: 'Bus', emoji: '🚌', costRange: '৳100–150', speed: 'Medium', color: '#7C3AED' },
  { id: 'car', label: 'Car / Taxi', emoji: '🚗', costRange: '৳500–700', speed: 'Fast', color: '#DC2626' },
  { id: 'rideshare', label: 'Ride Share', emoji: '📱', costRange: '৳500–650', speed: 'Fast', color: '#F42A41' },
];

const ROUTE_OPTIONS = [
  { id: 'recommended', label: 'Recommended', desc: 'Best balance of experience and cost', distance: '48 km', time: '5h 20m', cost: '৳600', tag: '⭐ Best' },
  { id: 'shortest', label: 'Shortest', desc: 'Minimum distance route', distance: '38 km', time: '4h 40m', cost: '৳700', tag: '📍 Shortest' },
  { id: 'cheapest', label: 'Lowest Cost', desc: 'Most economical transport mix', distance: '52 km', time: '6h 10m', cost: '৳420', tag: '💸 Cheapest' },
  { id: 'fastest', label: 'Fastest', desc: 'Minimum travel time', distance: '44 km', time: '3h 50m', cost: '৳850', tag: '⚡ Fastest' },
];

function RouteStop({ index, name, onRemove, onMoveUp, onMoveDown, isFirst, isLast }:
  { index: number; name: string; onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: 'var(--color-primary)' }}>
          {index}
        </div>
        {!isLast && <div className="w-0.5 h-6 mt-1" style={{ background: 'var(--color-border)' }} />}
      </div>
      <div className="flex-1 bg-white rounded-xl border-2 px-4 py-3 flex items-center gap-2"
        style={{ borderColor: 'var(--color-border)' }}>
        <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--color-text)' }}>{name}</span>
        <div className="flex gap-1">
          {!isFirst && <button onClick={onMoveUp} className="p-1 hover:bg-gray-100 rounded" title="Move up"><ChevronUp size={13} /></button>}
          {!isLast && <button onClick={onMoveDown} className="p-1 hover:bg-gray-100 rounded" title="Move down"><ChevronDown size={13} /></button>}
          <button onClick={onRemove} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600" title="Remove"><X size={13} /></button>
        </div>
      </div>
    </div>
  );
}

export default function TourPlanner() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'create' | 'saved' | 'active'>('create');
  const [planName, setPlanName] = useState('');
  const [startLocation, setStartLocation] = useState('Dhaka');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [planDate, setPlanDate] = useState(new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 10));
  const [stops, setStops] = useState<string[]>(['Lalbagh Fort', 'Ahsan Manzil']);
  const [newStop, setNewStop] = useState('');
  const [selectedTransport, setSelectedTransport] = useState('cng');
  const [selectedRoute, setSelectedRoute] = useState('recommended');
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [locationOn, setLocationOn] = useState(true);
  const { data: savedPlans, loading: plansLoading, error: plansError, refetch: refetchPlans } = useApiData(
    () => tripsApi.list(),
    [] as any[],
    [currentUser?.id]
  );
  const selectedPlan = savedPlans.find((plan: any) => plan.id === selectedPlanId) || savedPlans[0];
  const activeTour = selectedPlan ? {
    ...selectedPlan,
    start: selectedPlan.destinations?.[0] || '',
    stops: selectedPlan.destinations?.slice(1) || [],
  } : null;

  const route = ROUTE_OPTIONS.find(r => r.id === selectedRoute)!;

  function addStop(dest?: string) {
    const d = dest || newStop;
    if (d && !stops.includes(d)) {
      setStops(s => [...s, d]);
      setNewStop('');
    }
  }

  function removeStop(i: number) {
    setStops(s => s.filter((_, idx) => idx !== i));
  }

  function moveStop(i: number, dir: -1 | 1) {
    const arr = [...stops];
    [arr[i], arr[i + dir]] = [arr[i + dir], arr[i]];
    setStops(arr);
  }

  async function handleSave() {
    if (!planName.trim() || !startLocation.trim() || !planDate || stops.length === 0) {
      setSaveError('Enter a plan name, date, starting location, and at least one destination.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await tripsApi.create({
        name: planName.trim(),
        description: [notes.trim(), `Transport: ${TRANSPORT_OPTIONS.find(item => item.id === selectedTransport)?.label || selectedTransport}`].filter(Boolean).join('\n'),
        startDate: planDate,
        endDate: planDate,
        status: 'planned',
        destinations: [startLocation.trim(), ...stops],
        days: [{ date: planDate, notes: notes.trim(), stops: stops.map((placeName, order) => ({ placeName, location: startLocation.trim(), order })) }],
      });
      await refetchPlans();
      setSaved(true);
      setActiveTab('saved');
      window.setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this tour plan.');
    } finally {
      setSaving(false);
    }
  }

  async function deletePlan(id: string) {
    if (!window.confirm('Delete this saved tour plan? This cannot be undone.')) return;
    setSaveError('');
    try {
      await tripsApi.remove(id);
      await refetchPlans();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not delete this tour plan.');
    }
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border-2 text-sm outline-none bg-white border-[var(--color-border)] focus:border-[var(--color-primary)]";

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Fraunces, serif', color: 'var(--color-text)' }}>
              Tour Planner
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Create, save, and share tour routes</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: locationOn ? '#E6F4EF' : 'var(--color-surface-2)', color: locationOn ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
              <div className={`w-2 h-2 rounded-full ${locationOn ? 'bg-green-500' : 'bg-gray-400'}`} />
              {locationOn ? '📍 Dhaka' : 'Location Off'}
            </div>
            <Link to="/guide-dashboard" className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              ← Dashboard
            </Link>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-3">
          {[
            { id: 'create', label: '+ Create Route' },
            { id: 'saved', label: `Saved Plans (${savedPlans.length})` },
            { id: 'active', label: 'Route Preview' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={activeTab === t.id
                ? { background: 'var(--color-primary)', color: 'white' }
                : { color: 'var(--color-text-muted)', background: 'var(--color-surface-2)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* ── CREATE ROUTE TAB ── */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Builder */}
            <div className="lg:col-span-3 space-y-5">
              {saved && (
                <div className="flex items-center gap-2 p-4 rounded-xl text-sm font-semibold" style={{ background: '#D1FAE5', color: '#059669' }}>
                  <CheckCircle size={16} /> Tour plan saved successfully!
                </div>
              )}

              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--color-text)' }}>Plan Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Plan Name</label>
                    <input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="e.g. Dhaka Heritage Half Day" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Starting Location</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-primary)' }} />
                        <input value={startLocation} onChange={e => setStartLocation(e.target.value)}
                          placeholder="e.g. Dhaka" className={`${inputCls} pl-9`} />
                      </div>
                      <button onClick={() => setLocationOn(v => !v)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-colors whitespace-nowrap"
                        style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: '#E6F4EF' }}>
                        📍 Use My Location
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--color-text-muted)' }}>Tour date</label>
                    <input type="date" min={new Date().toISOString().slice(0, 10)} value={planDate} onChange={event => setPlanDate(event.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Stops */}
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--color-text)' }}>Destinations</h3>
                <div className="space-y-1 mb-4">
                  {/* Start */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#D4A017' }}>S</div>
                      <div className="w-0.5 h-6 mt-1" style={{ background: 'var(--color-border)' }} />
                    </div>
                    <div className="flex-1 bg-amber-50 rounded-xl border-2 px-4 py-3 text-sm font-semibold" style={{ borderColor: '#D4A017', color: '#92400E' }}>
                      START: {startLocation}
                    </div>
                  </div>
                  {stops.map((s, i) => (
                    <RouteStop key={`${s}-${i}`} index={i + 1} name={s}
                      onRemove={() => removeStop(i)}
                      onMoveUp={() => moveStop(i, -1)}
                      onMoveDown={() => moveStop(i, 1)}
                      isFirst={i === 0} isLast={i === stops.length - 1} />
                  ))}
                </div>
                {/* Add stop */}
                <div className="flex gap-2">
                  <select value={newStop} onChange={e => setNewStop(e.target.value)}
                    className={`${inputCls} flex-1`} style={{ color: newStop ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                    <option value="">Add a destination...</option>
                    {DESTINATIONS.filter(d => !stops.includes(d)).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <button onClick={() => addStop()} disabled={!newStop}
                    className="px-4 py-3 rounded-xl font-bold text-white transition-opacity disabled:opacity-40"
                    style={{ background: 'var(--color-primary)' }}>
                    <Plus size={18} />
                  </button>
                </div>
                {/* Quick add chips */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {DESTINATIONS.filter(d => !stops.includes(d)).slice(0, 5).map(d => (
                    <button key={d} onClick={() => addStop(d)}
                      className="text-xs px-2.5 py-1 rounded-full border font-medium transition-colors hover:bg-green-50"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                      + {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transport */}
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--color-text)' }}>Transport Mode</h3>
                <div className="grid grid-cols-3 gap-2">
                  {TRANSPORT_OPTIONS.map(t => (
                    <button key={t.id} onClick={() => setSelectedTransport(t.id)}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center"
                      style={selectedTransport === t.id
                        ? { borderColor: t.color, background: `${t.color}15` }
                        : { borderColor: 'var(--color-border)' }}>
                      <span className="text-xl">{t.emoji}</span>
                      <span className="text-xs font-bold" style={{ color: selectedTransport === t.id ? t.color : 'var(--color-text)' }}>{t.label}</span>
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t.costRange}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--color-text)' }}>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Add notes for tourists (food stops, tips, warnings...)" className={`${inputCls} resize-none`} />
              </div>

              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              <div className="flex gap-3">
                <button onClick={() => void handleSave()} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--color-primary)' }}>
                  <Save size={16} /> {saving ? 'Saving…' : 'Save Tour Plan'}
                </button>
              </div>
            </div>

            {/* Right: Route summary */}
            <div className="lg:col-span-2 space-y-5">
              {/* Simulated map */}
              <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                <div className="relative h-56" style={{ background: 'linear-gradient(135deg, #d4edda 0%, #b8dcc4 100%)' }}>
                  <div className="absolute inset-0 flex flex-col items-start justify-start p-4 gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow">S</div>
                      <div className="w-20 h-0.5 border-t-2 border-dashed" style={{ borderColor: 'var(--color-primary)' }} />
                    </div>
                    {stops.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 ml-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shadow" style={{ background: 'var(--color-primary)' }}>{i + 1}</div>
                        <span className="text-xs font-semibold bg-white/80 backdrop-blur px-2 py-0.5 rounded-lg" style={{ color: 'var(--color-text)' }}>{s}</span>
                        {i < stops.length - 1 && <div className="absolute left-[24px] w-0.5 h-4 top-full" style={{ background: 'var(--color-primary)' }} />}
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur rounded-xl px-3 py-2 text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                    📍 {stops.length} stops
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Route: {startLocation} → {stops[stops.length - 1] || '...'}</p>
                </div>
              </div>

              {/* Route options */}
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Route Options</h3>
                  <button onClick={() => setShowRouteOptions(v => !v)} className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
                    {showRouteOptions ? 'Collapse' : 'Compare all'}
                  </button>
                </div>
                <div className="space-y-2">
                  {(showRouteOptions ? ROUTE_OPTIONS : ROUTE_OPTIONS.slice(0, 2)).map(r => (
                    <button key={r.id} onClick={() => setSelectedRoute(r.id)}
                      className="w-full text-left p-3 rounded-xl border-2 transition-all"
                      style={selectedRoute === r.id
                        ? { borderColor: 'var(--color-primary)', background: '#E6F4EF' }
                        : { borderColor: 'var(--color-border)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>{r.tag} {r.label}</span>
                        {selectedRoute === r.id && <CheckCircle size={13} style={{ color: 'var(--color-primary)' }} />}
                      </div>
                      <div className="flex gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <span>📍 {r.distance}</span>
                        <span>⏱ {r.time}</span>
                        <span>💰 {r.cost}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary card */}
              <div className="rounded-2xl p-5 text-white" style={{ background: 'var(--color-primary)' }}>
                <h3 className="font-bold text-sm mb-3 text-green-100">Selected Route Summary</h3>
                {[
                  { icon: '📍', label: 'Distance', val: route.distance },
                  { icon: '⏱', label: 'Est. Duration', val: route.time },
                  { icon: '💰', label: 'Est. Cost', val: route.cost },
                  { icon: '🚗', label: 'Transport', val: TRANSPORT_OPTIONS.find(t => t.id === selectedTransport)?.label || '' },
                  { icon: '📌', label: 'Stops', val: `${stops.length} destinations` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-1.5 border-b border-white/10 text-sm last:border-0">
                    <span className="text-green-200">{item.icon} {item.label}</span>
                    <span className="font-semibold">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SAVED PLANS TAB ── */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {plansError && <p className="text-sm text-red-600">Could not load saved plans: {plansError}</p>}
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
            {plansLoading && <p className="text-sm text-[var(--color-text-muted)]">Loading saved plans…</p>}
            {!plansLoading && savedPlans.length === 0 && (
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-text-muted)]">
                You have not saved any tour plans yet.
              </div>
            )}
            {savedPlans.map((plan: any) => (
              <div key={plan.id} className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-base mb-1" style={{ fontFamily: 'Fraunces, serif', color: 'var(--color-text)' }}>{plan.name}</h3>
                    <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                      {plan.startDate} · Starts at {plan.destinations?.[0] || 'Unspecified'} · {Math.max(0, (plan.destinations?.length || 1) - 1)} stops
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(plan.destinations || []).slice(1).map((s: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                          {i + 1}. {s}
                        </span>
                      ))}
                    </div>
                    {plan.description && <p className="text-sm text-[var(--color-text-muted)] whitespace-pre-line">{plan.description}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setSelectedPlanId(plan.id); setActiveTab('active'); }} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors hover:opacity-90 text-white" style={{ background: 'var(--color-primary)' }}>
                      <Navigation size={12} /> Preview
                    </button>
                    <button onClick={() => void deletePlan(plan.id)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border text-red-600" style={{ borderColor: 'var(--color-border)' }}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-4">
            {plansError && <p className="text-sm text-red-600">Could not load saved plans: {plansError}</p>}
            {!activeTour && !plansLoading && (
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 text-center text-sm text-[var(--color-text-muted)]">
                Save a tour plan to preview its route here.
              </div>
            )}
            {activeTour && (
              <div className="bg-white rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)' }}>
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Saved route preview · {activeTour.startDate}</p>
                  <h2 className="mt-1 text-xl font-bold" style={{ fontFamily: 'Fraunces, serif' }}>{activeTour.name}</h2>
                </div>
                <ol className="space-y-3">
                  {[activeTour.start, ...activeTour.stops].filter(Boolean).map((place: string, index: number) => (
                    <li key={`${place}-${index}`} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006A4E] text-xs font-bold text-white">{index + 1}</span>
                      <span className="text-sm font-medium">{place}</span>
                    </li>
                  ))}
                </ol>
                {activeTour.description && <p className="mt-5 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-text-muted)] whitespace-pre-line">{activeTour.description}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
