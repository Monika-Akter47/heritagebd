import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { placesApi, guidesApi, productsApi, eventsApi } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import PlaceCard from '../components/cards/PlaceCard';
import GuideCard from '../components/cards/GuideCard';
import ProductCard from '../components/cards/ProductCard';
import EventCard from '../components/cards/EventCard';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'places', label: 'Heritage Places' },
  { id: 'guides', label: 'Tour Guides' },
  { id: 'products', label: 'Products' },
  { id: 'events', label: 'Events' },
];

const DIVISIONS = ['All', 'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet', 'Barisal', 'Rangpur', 'Mymensingh'];

export default function Explore() {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [division, setDivision] = useState('All');
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);

  const { data: mockPlaces } = useApiData(() => placesApi.list(), [] as any[]);
  const { data: mockGuides } = useApiData(() => guidesApi.list(), [] as any[]);
  const { data: mockProducts } = useApiData(() => productsApi.list(), [] as any[]);
  const { data: mockEvents } = useApiData(() => eventsApi.list(), [] as any[]);

  const allResults = useMemo(() => {
    const results: Array<{ type: string; item: unknown; rating: number; name: string; division?: string }> = [];
    if (category === 'all' || category === 'places') {
      mockPlaces.forEach(p => results.push({ type: 'place', item: p, rating: p.rating, name: p.name, division: p.division }));
    }
    if (category === 'all' || category === 'guides') {
      mockGuides.forEach(g => results.push({ type: 'guide', item: g, rating: g.rating, name: g.name, division: g.location }));
    }
    if (category === 'all' || category === 'products') {
      mockProducts.forEach(p => results.push({ type: 'product', item: p, rating: p.rating, name: p.name }));
    }
    if (category === 'all' || category === 'events') {
      mockEvents.forEach(e => results.push({ type: 'event', item: e, rating: 0, name: e.name, division: e.district }));
    }
    return results;
  }, [category, mockPlaces, mockGuides, mockProducts, mockEvents]);

  const filtered = useMemo(() => {
    return allResults.filter(r => {
      if (query && !r.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (division !== 'All' && r.division && !r.division.toLowerCase().includes(division.toLowerCase())) return false;
      if (r.rating < minRating) return false;
      return true;
    });
  }, [allResults, query, division, minRating]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [filtered, sortBy]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="bg-[#006A4E] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Explore Bangladesh
          </h1>
          <p className="text-white/70 mb-8">Discover heritage places, expert guides, authentic products, and upcoming events</p>
          <div className="flex items-center bg-white rounded-2xl shadow-xl p-2 max-w-2xl mx-auto">
            <Search size={18} className="ml-3 text-[var(--color-text-muted)] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Where do you want to explore?"
              className="flex-1 px-4 py-2 outline-none text-[var(--color-text)] text-sm bg-transparent"
            />
            {query && (
              <button onClick={() => setQuery('')} className="mr-2 p-1 rounded-lg hover:bg-gray-100">
                <X size={16} className="text-[var(--color-text-muted)]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="sticky top-16 z-30 bg-white border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  category === cat.id
                    ? 'bg-[#006A4E] text-white'
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
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p className="text-[var(--color-text-muted)] text-sm">
            <span className="font-semibold text-[var(--color-text)]">{sorted.length}</span> results found
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal size={15} />
              Filters
            </button>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-sm bg-white outline-none"
            >
              <option value="featured">Featured</option>
              <option value="rating">Top Rated</option>
              <option value="name">A-Z</option>
            </select>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white border border-[var(--color-border)] rounded-2xl p-6 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-semibold mb-2 block">Division</label>
              <select
                value={division}
                onChange={e => setDivision(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm outline-none"
              >
                {DIVISIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block">Min. Rating</label>
              <div className="flex gap-2">
                {[0, 3, 4, 4.5].map(r => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${minRating === r ? 'bg-[#006A4E] text-white border-[#006A4E]' : 'border-[var(--color-border)] hover:border-[#006A4E]'}`}
                  >
                    {r === 0 ? 'All' : `${r}+`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setDivision('All'); setMinRating(0); }}
                className="text-sm text-[#F42A41] hover:underline"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {sorted.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-text-muted)]">
            <Search size={40} className="mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold mb-1">No results found</h3>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sorted.map((r, i) => {
              if (r.type === 'place') return <PlaceCard key={`p-${i}`} place={r.item as never} />;
              if (r.type === 'guide') return <GuideCard key={`g-${i}`} guide={r.item as never} />;
              if (r.type === 'product') return <ProductCard key={`prod-${i}`} product={r.item as never} />;
              if (r.type === 'event') return <EventCard key={`e-${i}`} event={r.item as never} />;
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
