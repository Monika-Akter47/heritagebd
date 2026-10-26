import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Share2, BookOpen } from 'lucide-react';
import { storiesApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import Badge from '../../components/ui/Badge';
import StoryCard from '../../components/cards/StoryCard';

export default function StoryDetail() {
  const { id } = useParams();
  const { data: story, loading } = useApiData(() => storiesApi.get(id as string), null as any, [id]);
  const { data: allStories } = useApiData(() => storiesApi.list(), [] as any[]);

  if (loading || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-[var(--color-text-muted)]">Loading story…</p>
      </div>
    );
  }

  const related = allStories.filter((s: any) => s.id !== story.id && s.category === story.category).slice(0, 3);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Hero */}
      <div className="relative h-[55vh]">
        <img src={story.image} alt={story.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="absolute top-4 left-4">
          <Link to="/stories" className="flex items-center gap-2 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-xl text-sm hover:bg-white/30 transition-colors">
            <ArrowLeft size={16} /> All Stories
          </Link>
        </div>
        <div className="absolute bottom-8 left-0 right-0 px-4">
          <div className="max-w-3xl mx-auto">
            <Badge variant="gold" className="mb-4">{story.category}</Badge>
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {story.title}
            </h1>
            <div className="flex items-center gap-6 text-white/70 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <img src={story.author.avatar} alt={story.author.name} className="w-6 h-6 rounded-full object-cover" />
                <span>{story.author.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={13} />
                <span>{new Date(story.publishedAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={13} />
                <span>{story.readTime} read</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-xl text-[var(--color-text-muted)] italic leading-relaxed mb-8 border-l-4 border-[#D4A017] pl-6">
          {story.excerpt}
        </p>
        <div className="prose max-w-none">
          {story.content.split('\n\n').map((para: string, i: number) => (
            <p key={i} className="text-[var(--color-text)] leading-relaxed text-base mb-6">
              {para}
            </p>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-[var(--color-border)]">
          {story.tags.map((tag: string) => <Badge key={tag} variant="gray">{tag}</Badge>)}
        </div>

        {/* Author */}
        <div className="flex items-start gap-4 mt-10 p-6 bg-[var(--color-surface-2)] rounded-2xl">
          <img src={story.author.avatar} alt={story.author.name} className="w-14 h-14 rounded-full object-cover" />
          <div>
            <p className="font-bold">{story.author.name}</p>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">{story.author.bio}</p>
          </div>
        </div>

        {/* Share */}
        <div className="flex items-center gap-3 mt-8">
          <span className="text-sm font-semibold">Share this story:</span>
          <button className="p-2 rounded-lg bg-[var(--color-surface-2)] hover:bg-gray-200 transition-colors">
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-[var(--color-border)]">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>More Stories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {related.map((s: any) => <StoryCard key={s.id} story={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}
