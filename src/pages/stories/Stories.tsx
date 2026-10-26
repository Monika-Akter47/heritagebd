import React, { useState } from 'react';
import { storiesApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import StoryCard from '../../components/cards/StoryCard';

const CATEGORIES = ['All', 'Heritage', 'Food', 'Culture', 'Travel', 'Festival', 'Artisan'];

export default function Stories() {
  const [category, setCategory] = useState('All');
  const { data: mockStories } = useApiData(() => storiesApi.list(), [] as any[]);

  const filtered = mockStories.filter((s: any) => {
    if (category === 'All') return true;
    return s.category.toLowerCase() === category.toLowerCase();
  });

  const featuredStory = filtered.find(s => s.featured) || filtered[0];
  const rest = filtered.filter(s => s.id !== featuredStory?.id);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="bg-[#1A1A2E] py-16 px-4 text-center">
        <p className="text-[#D4A017] text-sm font-semibold uppercase tracking-widest mb-2">Stories</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          Heritage Digest
        </h1>
        <p className="text-white/60 mt-3">Stories, guides, and insights from the heart of Bangladesh</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-10">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-[#1A1A2E] text-white'
                  : 'bg-white border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[#1A1A2E] hover:text-[#1A1A2E]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured story */}
        {featuredStory && (
          <div className="mb-10">
            <StoryCard story={featuredStory} featured />
          </div>
        )}

        {/* Story grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map(story => <StoryCard key={story.id} story={story} />)}
        </div>
      </div>
    </div>
  );
}
