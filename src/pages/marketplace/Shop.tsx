import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Tag, SlidersHorizontal, QrCode, MapPin } from 'lucide-react';
import { areasApi, productsApi, type AreaDivision } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import ProductCard from '../../components/cards/ProductCard';
import Badge from '../../components/ui/Badge';
import LocalTaste from '../../components/local/LocalTaste';

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'gi-product', label: 'GI Products' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'handicraft', label: 'Handicrafts' },
  { id: 'food', label: 'Food & Delicacies' },
  { id: 'pottery', label: 'Pottery' },
  { id: 'jewelry', label: 'Jewelry' },
  { id: 'souvenir', label: 'Souvenirs' },
  { id: 'seasonal', label: '🌿 Seasonal' },
];

const PRICE_RANGES = [
  { id: 'all', label: 'Any Price', min: 0, max: Infinity },
  { id: 'under500', label: 'Under ৳500', min: 0, max: 500 },
  { id: '500-1000', label: '৳500–৳1,000', min: 500, max: 1000 },
  { id: '1000-2500', label: '৳1,000–৳2,500', min: 1000, max: 2500 },
  { id: 'above2500', label: 'Above ৳2,500', min: 2500, max: Infinity },
];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  // ?area= holds a division or district; kept in the URL so area links are shareable.
  const area = searchParams.get('area') || '';
  const { data: divisions } = useApiData(() => areasApi.list(), [] as AreaDivision[]);
  const activeDivision = divisions.find(d => d.division === area || d.districts.includes(area));
  const setArea = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next) params.set('area', next); else params.delete('area');
    setSearchParams(params, { replace: true });
  };
  // A district chosen here is an explicit filter, so don't widen it to the division.
  const isDistrict = !!activeDivision && area !== activeDivision.division;
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState('all');
  const [onlyReadyToPick, setOnlyReadyToPick] = useState(searchParams.get('filter') === 'ready-to-pick');
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const priceConfig = PRICE_RANGES.find(r => r.id === priceRange)!;

  const { data: mockProducts, loading: productsLoading } = useApiData(
    () => (area
      ? productsApi.byArea(isDistrict ? { area, scope: 'district', exact: true } : { area })
      : productsApi.list()),
    [] as any[],
    [area, isDistrict],
  );

  const filtered = mockProducts.filter(p => {
    const isGiProduct = p.category === 'gi-product'
      || p.tags?.some((tag: string) => tag.trim().toLowerCase() === 'gi product');
    if (category === 'gi-product' && !isGiProduct) return false;
    if (category !== 'all' && category !== 'gi-product' && p.category !== category) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (p.price < priceConfig.min || p.price > priceConfig.max) return false;
    if (onlyReadyToPick && (!p.preOrderEnabled || p.stock <= 0)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'newest') return 0;
    return b.featured ? 1 : -1;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#D4A017] to-[#b88a10] py-14 px-4 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="green" className="mb-4">Authentic Bangladesh</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
            Heritage Marketplace
          </h1>
          <p className="text-white/80 mb-8">Shop directly from certified artisans, weavers, and GI-registered producers</p>
          <div className="flex items-center bg-white rounded-2xl p-2 max-w-xl mx-auto shadow-xl">
            <Search size={18} className="ml-3 text-[var(--color-text-muted)] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products, crafts, GI items..."
              className="flex-1 px-4 py-2 outline-none text-sm bg-transparent text-[var(--color-text)]"
            />
            {query && <button onClick={() => setQuery('')}><X size={16} className="text-[var(--color-text-muted)] mr-2" /></button>}
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="sticky top-16 z-30 bg-white border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  category === cat.id
                    ? 'bg-[#D4A017] text-white'
                    : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Area filter: division chips, then an optional district within it */}
        <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by area">
          <span className="mr-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            <MapPin size={13} aria-hidden="true" /> Area
          </span>
          <button type="button" onClick={() => setArea('')} aria-pressed={!area}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${!area ? 'bg-[#006A4E] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:bg-gray-200'}`}>
            All Bangladesh
          </button>
          {divisions.map(d => (
            <button key={d.division} type="button" onClick={() => setArea(d.division)} aria-pressed={activeDivision?.division === d.division}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${activeDivision?.division === d.division ? 'bg-[#006A4E] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:bg-gray-200'}`}>
              {d.division}
            </button>
          ))}
          {activeDivision && (
            <select value={isDistrict ? area : ''} onChange={e => setArea(e.target.value || activeDivision.division)}
              aria-label={`District in ${activeDivision.division}`}
              className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs outline-none">
              <option value="">All of {activeDivision.division}</option>
              {activeDivision.districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>

        {area && (
          <div className="mb-6">
            <LocalTaste query={isDistrict ? { area, scope: 'district' } : { area }} label={area} tabs={['foods']} />
          </div>
        )}

        {/* Filters row */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{filtered.length}</span> products found
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setOnlyReadyToPick(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all"
              style={onlyReadyToPick
                ? { borderColor: 'var(--color-primary)', background: '#E6F4EF', color: 'var(--color-primary)' }
                : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              🟢 Ready to Pick
            </button>
            <button onClick={() => setOnlyOffers(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all"
              style={onlyOffers
                ? { borderColor: '#F42A41', background: '#FEF2F2', color: '#F42A41' }
                : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              🔥 Offers Only
            </button>
            <button onClick={() => setShowFilters(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-semibold"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              <SlidersHorizontal size={13} /> Filters
            </button>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm bg-white outline-none">
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="bg-white rounded-2xl border p-5 mb-5" style={{ borderColor: 'var(--color-border)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Price Range</p>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map(r => (
                    <button key={r.id} onClick={() => setPriceRange(r.id)}
                      className="px-3 py-1.5 rounded-xl border-2 text-xs font-semibold transition-all"
                      style={priceRange === r.id
                        ? { borderColor: 'var(--color-primary)', background: '#E6F4EF', color: 'var(--color-primary)' }
                        : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Rating</p>
                <div className="flex gap-2">
                  {['4.5+', '4.0+', '3.5+', 'Any'].map(r => (
                    <button key={r} className="px-3 py-1.5 rounded-xl border-2 text-xs font-semibold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                      ⭐ {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {productsLoading ? (
          <p role="status" className="py-20 text-center text-sm text-[var(--color-text-muted)]">Loading products…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-text-muted)]">
            <Tag size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold">No products found{area ? ` in ${area}` : ''}</p>
            {area && <button type="button" onClick={() => setArea('')} className="mt-2 text-sm font-semibold text-[#006A4E] underline">Show all of Bangladesh</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </div>
  );
}
