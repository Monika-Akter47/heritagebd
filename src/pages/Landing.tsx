import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, MapPin, Users, Star, ShoppingBag, Shield, Award, Compass, ChevronRight, Flame, Leaf, QrCode, Clock } from 'lucide-react';
import { placesApi, guidesApi, productsApi, eventsApi, storiesApi, siteContentApi, assetUrl } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import PlaceCard from '../components/cards/PlaceCard';
import GuideCard from '../components/cards/GuideCard';
import ProductCard from '../components/cards/ProductCard';
import EventCard from '../components/cards/EventCard';
import StoryCard from '../components/cards/StoryCard';
import { mockEvents as developmentEvents } from '../data/mockData';
import type { Event } from '../types';

export default function Landing() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: mockPlaces } = useApiData(() => placesApi.list(), [] as any[]);
  const { data: mockGuides } = useApiData(() => guidesApi.list(), [] as any[]);
  const { data: mockProducts } = useApiData(() => productsApi.list(), [] as any[]);
  const { data: homepageImages } = useApiData(() => siteContentApi.homepageImages(), null as any);
  const { data: events } = useApiData(
    () => eventsApi.list().catch(error => {
      if (import.meta.env.DEV) return developmentEvents;
      throw error;
    }),
    import.meta.env.DEV ? developmentEvents : [] as Event[],
  );
  const { data: mockStories } = useApiData(() => storiesApi.list(), [] as any[]);
  const liveProducts = Array.isArray(mockProducts) ? mockProducts : (mockProducts as any)?.items ?? [];
  const offerProducts = liveProducts.filter((product: any) => Number(product.originalPrice) > Number(product.price)).slice(0, 4);
  const artisanPicks = liveProducts.filter((product: any) => !offerProducts.some((offer: any) => offer.id === product.id)).slice(0, 4);
  const featuredGuides = [...mockGuides]
    .filter((guide: any) => guide.verified)
    .sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
      || Number(b.rating || 0) - Number(a.rating || 0))
    .slice(0, 8);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/explore?q=${searchQuery}`);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={homepageImages?.heroImage || assetUrl('/api/product-images/835d69733226b8c1632d5527003e3f35')}
            alt="Bangladesh Heritage"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E]/90 via-[#1A1A2E]/60 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 w-full">
          <div className="max-w-2xl">
            {/* Label */}
            <div className="inline-flex items-center gap-2 bg-[#D4A017]/20 border border-[#D4A017]/40 text-[#D4A017] px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star size={14} className="fill-[#D4A017]" />
              Bangladesh Heritage Tourism Platform
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Discover the{' '}
              <span className="italic text-[#D4A017]">Soul</span>{' '}
              of Bangladesh
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-xl">
              Explore ancient monuments, taste authentic flavors, and connect with expert local guides. Your gateway to Bangladesh's rich cultural heritage.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex items-center bg-white rounded-2xl shadow-2xl p-2 mb-8 max-w-xl">
              <Search size={18} className="ml-3 text-[var(--color-text-muted)] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search heritage places, guides, products..."
                className="flex-1 px-4 py-2 text-[var(--color-text)] bg-transparent outline-none text-sm"
              />
              <button type="submit" className="bg-[#006A4E] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#004D38] transition-colors shrink-0">
                Explore
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/explore"
                className="flex items-center gap-2 bg-[#006A4E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#004D38] transition-colors"
              >
                Explore Bangladesh
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/guides"
                className="flex items-center gap-2 bg-white/15 backdrop-blur border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/25 transition-colors"
              >
                Find a Guide
              </Link>
            </div>
          </div>
        </div>

        {/* Floating stat cards */}
        <div className="absolute bottom-8 right-8 hidden xl:flex flex-col gap-3">
          {[
            { label: 'Heritage Sites', value: '300+' },
            { label: 'Expert Guides', value: '150+' },
            { label: 'Happy Travelers', value: '50K+' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-3 text-white text-right">
              <div className="font-bold text-2xl" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</div>
              <div className="text-white/60 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#006A4E] text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Heritage Places', value: '300+', icon: MapPin },
              { label: 'Verified Guides', value: '150+', icon: Users },
              { label: 'Authentic Products', value: '1,200+', icon: ShoppingBag },
              { label: 'Happy Travelers', value: '50,000+', icon: Star },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col items-center gap-2">
                <stat.icon size={24} className="text-[#D4A017]" />
                <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🔥 Today's Offers */}
      <section className="py-16" style={{ background: 'var(--color-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <Flame size={18} className="text-[#F42A41]" />
                <span className="text-[#F42A41] text-sm font-bold uppercase tracking-widest">Limited Time</span>
              </div>
              <h2 className="text-4xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
                Today's Offers
              </h2>
            </div>
            <Link to="/shop?filter=offers" className="flex items-center gap-2 text-[#F42A41] font-semibold text-sm hover:gap-3 transition-all">
              All Offers <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {offerProducts.map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow group">
                <div className="relative">
                  <img src={p.images?.[0] || ''} alt={p.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-3 left-3 bg-[#F42A41] text-white text-xs font-bold px-2 py-1 rounded-lg">
                    {Math.round((1 - Number(p.price) / Number(p.originalPrice)) * 100)}% OFF
                  </div>
                  {p.preOrderEnabled && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#006A4E] text-white text-xs font-bold px-2 py-1 rounded-lg">
                      🟢 Ready to Pick
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-text)' }}>{p.name}</h3>
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>📍 {p.district || p.vendor?.location || 'Bangladesh'} · {p.vendor?.shopName || p.vendor?.name || 'Local vendor'}</p>
                  <div className="flex items-center gap-1 mb-3">
                    <Star size={11} className="fill-[#D4A017] text-[#D4A017]" />
                    <span className="text-xs font-semibold">{p.rating}</span>
                    <span className="text-xs ml-auto" style={{ color: '#F42A41' }}>Limited offer</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-lg" style={{ color: 'var(--color-primary)' }}>৳{p.price.toLocaleString()}</span>
                    <span className="text-xs line-through" style={{ color: 'var(--color-text-muted)' }}>৳{Number(p.originalPrice).toLocaleString()}</span>
                  </div>
                  <Link to={`/shop/${p.id}`} className="block text-center py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ background: 'var(--color-primary)' }}>
                    Shop Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Artisan Picks */}
      <section className="py-16" style={{ background: '#F0F9F5' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <Leaf size={18} style={{ color: 'var(--color-primary)' }} />
                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>From verified local vendors</span>
              </div>
              <h2 className="text-4xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
                Artisan Picks
              </h2>
            </div>
            <Link to="/shop?filter=seasonal" className="flex items-center gap-2 font-semibold text-sm hover:gap-3 transition-all" style={{ color: 'var(--color-primary)' }}>
              View All Products <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {artisanPicks.map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow group">
                <div className="relative">
                  <img src={p.images?.[0] || ''} alt={p.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1"
                    style={{ color: 'var(--color-primary)' }}>
                    {p.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-text)' }}>{p.name}</h3>
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>📍 {p.district || p.vendor?.location || 'Bangladesh'} · {p.vendor?.shopName || p.vendor?.name || 'Local vendor'}</p>
                  <div className="flex items-center gap-1 mb-3">
                    <Star size={11} className="fill-[#D4A017] text-[#D4A017]" />
                    <span className="text-xs font-semibold">{p.rating}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg" style={{ color: 'var(--color-primary)' }}>৳{p.price.toLocaleString()}</span>
                    <Link to={`/shop/${p.id}`} className="text-xs font-bold px-3 py-1.5 rounded-lg text-white" style={{ background: 'var(--color-primary)' }}>
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ready to Pick Banner */}
      <section className="py-12" style={{ background: '#1A1A2E' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full text-sm font-bold" style={{ background: 'rgba(0,106,78,0.3)', color: '#4ade80' }}>
                🟢 Ready to Pick
              </div>
              <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                Order Ahead, Pick Up Fresh
              </h2>
              <p className="text-white/60 mb-6 max-w-lg">
                Pre-order authentic local products before you visit. Pay 30% advance to secure your order — pay the remaining 70% when you pick it up at the destination.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link to="/shop?filter=ready-to-pick" className="flex items-center gap-2 bg-[#006A4E] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#004D38] text-sm transition-colors">
                  <QrCode size={16} /> Browse Ready to Pick
                </Link>
                <Link to="/places" className="flex items-center gap-2 border border-white/20 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-white/10 text-sm transition-colors">
                  Explore Destinations
                </Link>
              </div>
            </div>
            <div className="flex gap-4 flex-shrink-0">
              {[
                { icon: '📍', label: 'Choose destination', step: '01' },
                { icon: '🛒', label: 'Pre-order product', step: '02' },
                { icon: '💳', label: 'Pay 30% advance', step: '03' },
                { icon: '🤝', label: 'Pick up & pay rest', step: '04' },
              ].map(s => (
                <div key={s.step} className="text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-2 mx-auto" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    {s.icon}
                  </div>
                  <p className="text-white/40 text-xs font-bold">{s.step}</p>
                  <p className="text-white/70 text-xs mt-0.5 max-w-[72px]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Heritage Places */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[#006A4E] text-sm font-semibold uppercase tracking-widest mb-2">Discover</p>
            <h2 className="text-4xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
              Featured Heritage Places
            </h2>
          </div>
          <Link to="/places" className="flex items-center gap-2 text-[#006A4E] font-semibold text-sm hover:gap-3 transition-all">
            View All <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPlaces.filter(p => p.featured).slice(0, 6).map(place => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </section>

      {/* Popular Tour Guides */}
      <section className="py-20 bg-[var(--color-surface-2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[#006A4E] text-sm font-semibold uppercase tracking-widest mb-2">Expert Guides</p>
              <h2 className="text-4xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
                Verified Tour Guides
              </h2>
            </div>
            <Link to="/guides" className="flex items-center gap-2 text-[#006A4E] font-semibold text-sm hover:gap-3 transition-all">
              All Guides <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGuides.map(guide => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[#006A4E] text-sm font-semibold uppercase tracking-widest mb-2">Marketplace</p>
            <h2 className="text-4xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
              Authentic Bengali Products
            </h2>
            <p className="text-[var(--color-text-muted)] mt-2 max-w-lg">
              GI-certified products, traditional handicrafts, and culinary treasures from Bangladesh's finest artisans.
            </p>
          </div>
          <Link to="/shop" className="flex items-center gap-2 text-[#006A4E] font-semibold text-sm hover:gap-3 transition-all">
            Shop Now <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockProducts.filter(p => p.featured).slice(0, 8).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20 bg-[var(--color-surface-2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[#006A4E] text-sm font-semibold uppercase tracking-widest mb-2">What's On</p>
              <h2 className="text-4xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
                Upcoming Events
              </h2>
            </div>
            <Link to="/events" className="flex items-center gap-2 text-[#006A4E] font-semibold text-sm hover:gap-3 transition-all">
              All Events <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.filter(e => e.featured).slice(0, 3).map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* Heritage Stories */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[#006A4E] text-sm font-semibold uppercase tracking-widest mb-2">Heritage Stories</p>
            <h2 className="text-4xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
              Discover Bangladesh
            </h2>
          </div>
          <Link to="/stories" className="flex items-center gap-2 text-[#006A4E] font-semibold text-sm hover:gap-3 transition-all">
            All Stories <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {mockStories.length > 0 && (
            <>
              <div className="lg:col-span-2">
                <StoryCard story={mockStories[0]} featured />
              </div>
              <div className="flex flex-col gap-6">
                {mockStories[1] && <StoryCard story={mockStories[1]} />}
                {mockStories[2] && <StoryCard story={mockStories[2]} />}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Why HeritageBD */}
      <section className="py-20 bg-[#006A4E] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-[#D4A017] text-sm font-semibold uppercase tracking-widest mb-2">Why Choose Us</p>
            <h2 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Why HeritageBD?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: 'Verified Guides',
                description: 'Every tour guide is background-checked, certified, and personally vetted by our team.',
              },
              {
                icon: Award,
                title: 'Authentic Products',
                description: 'Shop directly from certified artisans and GI-registered producers across Bangladesh.',
              },
              {
                icon: Compass,
                title: 'Heritage Discovery',
                description: 'Access detailed guides, 3D maps, and expert insights for 300+ heritage sites.',
              },
              {
                icon: Star,
                title: 'Secure Booking',
                description: 'Protected payments, instant confirmation, and 24/7 traveler support.',
              },
            ].map(feature => (
              <div key={feature.title} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon size={24} className="text-[#D4A017]" />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'var(--font-display)' }}>{feature.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Preview */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[var(--color-surface-2)] rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-12 flex flex-col justify-center">
              <p className="text-[#006A4E] text-sm font-semibold uppercase tracking-widest mb-2">Interactive Map</p>
              <h2 className="text-4xl font-bold text-[var(--color-text)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Explore Bangladesh on the Map
              </h2>
              <p className="text-[var(--color-text-muted)] leading-relaxed mb-8">
                Discover heritage sites, locate available tour guides, find authentic food spots, and plan your route — all on our interactive map.
              </p>
              <Link to="/map" className="inline-flex items-center gap-2 bg-[#006A4E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#004D38] transition-colors w-fit">
                Open Interactive Map
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="relative h-80 lg:h-auto">
              <img
                src={homepageImages?.mapImage || assetUrl('/api/product-images/c6ca3a2a90150458aed55de5116908d1')}
                alt="Bangladesh Map"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-xl">
                  <MapPin size={32} className="text-[#006A4E] mx-auto mb-1" />
                  <p className="text-xs font-semibold text-center">300+ Locations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA: Become Guide / Seller */}
      <section className="py-20 bg-[var(--color-surface-2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="relative rounded-3xl overflow-hidden bg-[#006A4E] p-10 text-white">
              <div className="relative z-10">
                <div className="text-4xl mb-4">🧭</div>
                <h3 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>Become a Guide</h3>
                <p className="text-white/70 mb-6 leading-relaxed">
                  Share your passion for Bangladesh's heritage. Earn income doing what you love — guiding curious travelers through history and culture.
                </p>
                <Link to="/signup?role=guide" className="inline-flex items-center gap-2 bg-white text-[#006A4E] px-6 py-3 rounded-xl font-semibold hover:bg-[#D4A017] hover:text-white transition-colors">
                  Apply as Guide <ChevronRight size={16} />
                </Link>
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden bg-[#D4A017] p-10 text-white">
              <div className="relative z-10">
                <div className="text-4xl mb-4">🏺</div>
                <h3 className="text-3xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>Sell Your Crafts</h3>
                <p className="text-white/80 mb-6 leading-relaxed">
                  Artisans, weavers, and producers — bring your authentic Bengali products to thousands of heritage enthusiasts worldwide.
                </p>
                <Link to="/signup?role=vendor" className="inline-flex items-center gap-2 bg-white text-[#D4A017] px-6 py-3 rounded-xl font-semibold hover:bg-[#006A4E] hover:text-white transition-colors">
                  Open Your Shop <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-[#006A4E] text-sm font-semibold uppercase tracking-widest mb-2">Testimonials</p>
          <h2 className="text-4xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
            What Travelers Say
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Sarah Mitchell',
              country: 'United Kingdom',
              avatar: homepageImages?.testimonialAvatar1 || assetUrl('/api/product-images/a267387730a3ad03cde593ca8f5762c1'),
              text: 'HeritageBD transformed my Bangladesh trip. My guide Arif brought Lalbagh Fort to life with stories I could never have found in a guidebook. The Jamdani saree I bought is my most treasured souvenir.',
              rating: 5,
            },
            {
              name: 'Takeshi Yamamoto',
              country: 'Japan',
              avatar: homepageImages?.testimonialAvatar2 || assetUrl('/api/product-images/6a1fd8b387fb84eaafdb777895c3c64c'),
              text: 'The Sundarbans expedition with Nazmul was extraordinary. Spotting deer and spotbill ducks in that primeval mangrove forest — and the sunset on the bay — I will never forget it.',
              rating: 5,
            },
            {
              name: 'Amina Hassan',
              country: 'UAE',
              avatar: homepageImages?.testimonialAvatar3 || assetUrl('/api/product-images/80ea735e9138eb83b035c76fe03f499c'),
              text: "As a Bangladeshi living abroad, HeritageBD helped me reconnect with my roots. My children now understand where they come from. The platform is beautifully designed and trustworthy.",
              rating: 5,
            },
          ].map(t => (
            <div key={t.name} className="bg-white rounded-2xl p-8 shadow-sm border border-[var(--color-border)]">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} className="text-[#D4A017] fill-[#D4A017]" />
                ))}
              </div>
              <p className="text-[var(--color-text)] text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-[var(--color-text-muted)] text-xs">{t.country}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
