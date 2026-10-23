import React, { useState } from 'react';
import { eventsApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import EventCard from '../../components/cards/EventCard';
import Badge from '../../components/ui/Badge';
import { Calendar } from 'lucide-react';
import { mockEvents as developmentEvents } from '../../data/mockData';
import type { Event } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const CATEGORIES = ['All', 'Cultural', 'Food', 'Market', 'Heritage', 'Festival', 'Religious'];

export default function Events() {
  const [category, setCategory] = useState('All');
  const {
    data: events,
    loading,
    error,
  } = useApiData(
    () => eventsApi.list().catch(apiError => {
      if (import.meta.env.DEV) return developmentEvents;
      throw apiError;
    }),
    import.meta.env.DEV ? developmentEvents : [] as Event[],
  );

  const filtered = events.filter((e: Event) => {
    if (category === 'All') return true;
    return e.category.toLowerCase() === category.toLowerCase();
  });

  const featured = filtered.find(e => e.featured) || filtered[0];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Featured Hero */}
      {featured && (
        <div className="relative h-[50vh] overflow-hidden">
          <img src={featured.image} alt={featured.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
            <Badge variant="gold" className="mb-3">Featured Event</Badge>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3" style={{ fontFamily: 'Fraunces, serif' }}>
              {featured.name}
            </h1>
            <div className="flex items-center gap-4 text-white/80 text-sm flex-wrap">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(featured.startDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <span>{featured.location}</span>
              <span>{featured.isFree ? 'Free Entry' : `৳${featured.ticketPrice}`}</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-[#006A4E] text-white'
                  : 'bg-white border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[#006A4E] hover:text-[#006A4E]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-10"><LoadingSpinner /></div>}
        {error && (
          <p role="alert" className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            Events could not be loaded. Please try again later.
          </p>
        )}

        <p className="text-[var(--color-text-muted)] text-sm mb-6">
          <span className="font-semibold text-[var(--color-text)]">{filtered.length}</span> events found
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event: Event) => <EventCard key={event.id} event={event} />)}
        </div>
      </div>
    </div>
  );
}
