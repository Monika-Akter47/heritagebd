import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { guidesApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import GuideCard from '../../components/cards/GuideCard';

const LANGUAGES = ['All', 'English', 'Bengali', 'Hindi', 'Arabic', 'Japanese', 'French', 'German'];
const SPECIALIZATIONS = ['All', 'Mughal History', 'Buddhist Heritage', 'Wildlife', 'Eco-Tourism', 'Culinary Tourism', 'Adventure Travel', 'Archaeological Sites'];

export default function GuideListing() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('All');
  const [specialization, setSpecialization] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: mockGuides } = useApiData(() => guidesApi.list(), [] as any[]);

  const filtered = mockGuides.filter((g: any) => {
    if (query && !String(g.name || '').toLowerCase().includes(query.toLowerCase()) && !String(g.location || '').toLowerCase().includes(query.toLowerCase())) return false;
    if (language !== 'All' && !(Array.isArray(g.languages) && g.languages.includes(language))) return false;
    if (specialization !== 'All' && !(Array.isArray(g.specializations) && g.specializations.includes(specialization))) return false;
    if (availableOnly && (!g.isAvailable || !g.bio?.trim() || !g.location?.trim()
      || !(g.pricePerDay > 0) || !Array.isArray(g.tourTypes) || g.tourTypes.length === 0)) return false;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#006A4E] to-[#004D38] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Find Your Perfect Guide
          </h1>
          <p className="text-white/70 mb-8">Expert local guides verified by HeritageBD for authentic, memorable experiences</p>
          <div className="flex items-center bg-white rounded-2xl p-2 max-w-xl mx-auto shadow-xl">
            <Search size={18} className="ml-3 text-[var(--color-text-muted)] shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or location..."
              className="flex-1 px-4 py-2 outline-none text-sm bg-transparent"
            />
            {query && (
              <button onClick={() => setQuery('')}>
                <X size={16} className="text-[var(--color-text-muted)] mr-2" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Filter bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <p className="text-[var(--color-text-muted)] text-sm">
            <span className="font-semibold text-[var(--color-text)]">{filtered.length}</span> guides found
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} className="accent-[#006A4E]" />
              Available now
            </label>
            <select value={language} onChange={e => setLanguage(e.target.value)} className="px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm bg-white outline-none">
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
            <select value={specialization} onChange={e => setSpecialization(e.target.value)} className="px-3 py-2 border border-[var(--color-border)] rounded-xl text-sm bg-white outline-none">
              {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Specializations' : s}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--color-text-muted)]">No guides match your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(guide => <GuideCard key={guide.id} guide={guide} />)}
          </div>
        )}
      </div>
    </div>
  );
}
