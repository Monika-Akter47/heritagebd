import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { placesApi } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import PlaceCard from '../components/cards/PlaceCard';

const CATEGORIES = ['All', 'mosque', 'fort', 'palace', 'temple', 'monument', 'archaeological', 'natural', 'museum'];
const DIVISIONS = ['All', 'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet', 'Barisal', 'Rangpur', 'Mymensingh'];

export default function Places() {
  const [category, setCategory] = useState('All');
  const [division, setDivision] = useState('All');
  const [query, setQuery] = useState('');

  const { data: mockPlaces } = useApiData(() => placesApi.list(), [] as any[]);

  const filtered = mockPlaces.filter((p: any) => {
    if (category !== 'All' && p.category !== category) return false;
    if (division !== 'All' && !p.division.includes(division)) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="bg-gradient-to-br from-[#006A4E] to-[#004D38] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
            Heritage Places
          </h1>
          <p className="text-white/70 mb-8">Discover Bangladesh's ancient monuments, UNESCO sites, and cultural landmarks</p>
          <div className="flex items-center bg-white rounded-2xl p-2 max-w-xl mx-auto shadow-xl">
            <Search size={18} className="ml-3 text-[var(--color-text-muted)] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search heritage places..."
              className="flex-1 px-4 py-2 outline-none text-sm bg-transparent"
            />
            {query && <button onClick={() => setQuery('')}><X size={16} className="text-[var(--color-text-muted)] mr-2" /></button>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-colors ${
                  category === cat ? 'bg-[#006A4E] text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[#006A4E]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <select value={division} onChange={e => setDivision(e.target.value)} className="px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm bg-white outline-none">
            {DIVISIONS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        <p className="text-[var(--color-text-muted)] text-sm mb-6">
          <span className="font-semibold text-[var(--color-text)]">{filtered.length}</span> heritage places found
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(place => <PlaceCard key={place.id} place={place} />)}
        </div>
      </div>
    </div>
  );
}
