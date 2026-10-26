import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Ticket, Calendar, ChevronRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { placesApi, guidesApi, productsApi } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import Badge from '../components/ui/Badge';
import StarRating from '../components/ui/StarRating';
import GuideCard from '../components/cards/GuideCard';
import ReviewCard from '../components/cards/ReviewCard';
import LocalTaste from '../components/local/LocalTaste';

const TABS = ['Overview', 'Gallery', 'Reviews', 'Guides', 'Pre-Order'];

export default function PlaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: place, loading } = useApiData(() => placesApi.get(id as string), null as any, [id]);
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedImg, setSelectedImg] = useState(0);

  const { data: placeReviews } = useApiData(
    () => (id ? placesApi.reviews(id) : Promise.resolve([])),
    [] as any[],
    [id]
  );
  const { data: allGuides } = useApiData(() => guidesApi.list(), [] as any[]);
  // Pre-order products from this place's district first, then the rest of its division.
  const { data: preOrderProducts } = useApiData(
    () => (place?.district
      ? productsApi.byArea({ area: place.district, scope: 'district' }, { preorder: '1' })
      : Promise.resolve([])),
    [] as any[],
    [place?.district],
  );

  if (loading || !place) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-[var(--color-text-muted)]">Loading place…</p>
      </div>
    );
  }

  const nearbyPreOrderProducts = preOrderProducts.slice(0, 4);
  const nearbyGuides = allGuides.filter((g: any) => (g.coverAreas || []).some((a: string) => a.toLowerCase().includes(place.division.toLowerCase()))).slice(0, 3);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Hero Image */}
      <div className="relative h-[60vh] bg-[var(--color-surface-2)]">
        <img
          src={place.images[selectedImg]}
          alt={place.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        <div className="absolute top-4 left-4">
          <Link to="/places" className="flex items-center gap-2 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/30 transition-colors">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex gap-2 mb-4">
            <Badge variant="green">{place.category}</Badge>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            {place.name}
          </h1>
          {place.nameLocal && <p className="text-white/70 text-lg">{place.nameLocal}</p>}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-1 text-white">
              <StarRating rating={place.rating} size="sm" showValue />
              <span className="text-white/70 text-sm">({place.reviewCount} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-white/80 text-sm">
              <MapPin size={14} />
              {place.location}
            </div>
          </div>
        </div>
        {/* Thumbnails */}
        {place.images.length > 1 && (
          <div className="absolute bottom-6 right-6 flex gap-2">
            {place.images.map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedImg(i)}
                className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${selectedImg === i ? 'border-white scale-110' : 'border-white/40'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--color-border)] mb-8 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-[#006A4E] text-[#006A4E]'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {activeTab === 'Overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>About</h2>
                  <p className="text-[var(--color-text-muted)] leading-relaxed">{place.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>Historical Background</h3>
                  <p className="text-[var(--color-text-muted)] leading-relaxed">{place.historicalBackground}</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>Significance</h3>
                  <p className="text-[var(--color-text-muted)] leading-relaxed">{place.significance}</p>
                </div>
                {place.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {place.tags.map((tag: string) => (
                      <Badge key={tag} variant="gray">{tag}</Badge>
                    ))}
                  </div>
                )}
                <LocalTaste query={{ area: place.district, scope: 'district' }} label={place.district} />
              </div>
            )}

            {activeTab === 'Gallery' && (
              <div className="grid grid-cols-2 gap-4">
                {place.images.map((img: string, i: number) => (
                  <div key={i} className={`rounded-2xl overflow-hidden ${i === 0 ? 'col-span-2 h-80' : 'h-52'}`}>
                    <img src={img} alt={`${place.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Reviews' && (
              <div className="space-y-6">
                <div className="bg-[var(--color-surface-2)] rounded-2xl p-6 flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-[#006A4E]" style={{ fontFamily: 'var(--font-display)' }}>{place.rating.toFixed(1)}</div>
                    <StarRating rating={place.rating} size="md" />
                    <div className="text-sm text-[var(--color-text-muted)] mt-1">{place.reviewCount} reviews</div>
                  </div>
                </div>
                {placeReviews.length > 0 ? (
                  placeReviews.map(r => <ReviewCard key={r.id} review={r} />)
                ) : (
                  <p className="text-[var(--color-text-muted)] text-center py-8">No reviews yet. Be the first to review!</p>
                )}
              </div>
            )}

            {activeTab === 'Guides' && (
              <div>
                <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Available Guides for this Area</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {nearbyGuides.map(guide => <GuideCard key={guide.id} guide={guide} />)}
                </div>
              </div>
            )}

            {/* ─── PRE-ORDER TAB ─────────────────────────────────────── */}
            {activeTab === 'Pre-Order' && (
              <div className="space-y-6">
                {/* Feature banner */}
                <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #006A4E 0%, #004D38 100%)' }}>
                  <div className="p-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🛍️</span>
                      <span className="text-sm font-bold uppercase tracking-wider text-green-200">Ready to Pick</span>
                    </div>
                    <h3 className="font-display text-2xl font-bold mb-2">Make Your Visit Easier</h3>
                    <p className="text-green-100 text-sm leading-relaxed">
                      Pre-order local food, handicrafts, and authentic products before your visit to {place.name}. We will have them ready when you arrive — no waiting, just experiencing.
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-xs text-green-200">
                      <span>✓ 30% advance only</span>
                      <span>✓ 70% at pickup</span>
                      <span>✓ QR verification</span>
                    </div>
                  </div>
                </div>

                {/* How it works */}
                <div className="bg-white rounded-2xl p-5 border border-[var(--color-border)]">
                  <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--color-text)' }}>How It Works</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
                    {[
                      { icon: '🔍', step: '1', label: 'Choose Product' },
                      { icon: '📅', step: '2', label: 'Set Pickup Time' },
                      { icon: '💳', step: '3', label: 'Pay 30% Advance' },
                      { icon: '📦', step: '4', label: 'Pick Up & Pay 70%' },
                    ].map(s => (
                      <div key={s.step} className="flex flex-col items-center gap-1">
                        <div className="text-2xl mb-1">{s.icon}</div>
                        <div className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center mb-1" style={{ background: 'var(--color-primary)' }}>{s.step}</div>
                        <p style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Products grid */}
                <div>
                  <h4 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
                    Products You Can Pre-Order Near {place.name}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {nearbyPreOrderProducts.map(product => (
                      <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border transition-shadow hover:shadow-md" style={{ border: '1px solid var(--color-border)' }}>
                        <div className="relative">
                          <img src={product.images[0]} alt={product.name} className="w-full h-40 object-cover" />
                          <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: 'var(--color-primary)' }}>
                            🟢 Pre-order Available
                          </span>
                        </div>
                        <div className="p-4">
                          <h5 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{product.name}</h5>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{product.vendor.shopName}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="font-bold" style={{ color: 'var(--color-primary)' }}>৳{product.price.toLocaleString()}</span>
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>⭐ {product.rating}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <Clock size={11} style={{ color: 'var(--color-gold)' }} />
                            Ready in approx. {product.preparationTime}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <MapPin size={11} style={{ color: 'var(--color-accent)' }} />
                            {product.pickupLocation}
                          </div>
                          {/* Payment preview */}
                          <div className="mt-3 p-2 rounded-lg text-xs" style={{ background: 'var(--color-surface-2)' }}>
                            <div className="flex justify-between">
                              <span style={{ color: 'var(--color-text-muted)' }}>Pay now (30%)</span>
                              <span className="font-bold" style={{ color: 'var(--color-primary)' }}>৳{Math.round(product.price * 0.3).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between mt-0.5">
                              <span style={{ color: 'var(--color-text-muted)' }}>At pickup (70%)</span>
                              <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>৳{Math.round(product.price * 0.7).toLocaleString()}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate(`/preorder/checkout?product=${product.id}&destination=${encodeURIComponent(place.name)}`)}
                            className="mt-3 w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
                            style={{ background: 'var(--color-primary)' }}
                          >
                            Pre-order for Pickup
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Visit Info */}
            <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] shadow-sm">
              <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-display)' }}>Visitor Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-[#006A4E] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Opening Hours</p>
                    <p className="text-sm font-medium">{place.visitInfo.openTime} – {place.visitInfo.closeTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Ticket size={16} className="text-[#006A4E] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Entry Fee</p>
                    <p className="text-sm font-medium">{place.visitInfo.entryFee}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-[#006A4E] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Best Time to Visit</p>
                    <p className="text-sm font-medium">{place.visitInfo.bestTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-[#006A4E] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Location</p>
                    <p className="text-sm font-medium">{place.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="bg-[#006A4E] rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-3" style={{ fontFamily: 'var(--font-display)' }}>Ready to Visit?</h3>
              <p className="text-white/70 text-sm mb-4">Find an expert guide to make the most of your visit.</p>
              <div className="space-y-3">
                <Link to="/guides" className="block w-full bg-white text-[#006A4E] text-center py-3 rounded-xl font-semibold text-sm hover:bg-[#D4A017] hover:text-white transition-colors">
                  Find a Guide
                </Link>
                <Link to="/planner" className="block w-full bg-white/10 border border-white/20 text-white text-center py-3 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors">
                  Add to Trip Plan
                </Link>
              </div>
            </div>

            {/* Nearby Attractions */}
            {place.nearbyAttractions.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)]">
                <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'var(--font-display)' }}>Nearby Attractions</h3>
                <ul className="space-y-2">
                  {place.nearbyAttractions.map((attraction: string) => (
                    <li key={attraction} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                      <ChevronRight size={14} className="text-[#006A4E]" />
                      {attraction}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
