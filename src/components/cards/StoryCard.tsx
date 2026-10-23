import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User } from 'lucide-react';
import type { Story } from '../../types';
import Badge from '../ui/Badge';

interface StoryCardProps {
  story: Story;
  featured?: boolean;
}

export default function StoryCard({ story, featured = false }: StoryCardProps) {
  if (featured) {
    return (
      <Link to={`/stories/${story.id}`} className="group block">
        <div className="relative h-[420px] rounded-2xl overflow-hidden bg-[var(--color-surface-2)]">
          <img
            src={story.image}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <Badge variant="gold" className="mb-3">{story.category}</Badge>
            <h2 className="text-white font-bold text-2xl mb-2 leading-snug group-hover:text-[#D4A017] transition-colors">
              {story.title}
            </h2>
            <p className="text-white/70 text-sm line-clamp-2 mb-4">{story.excerpt}</p>
            <div className="flex items-center gap-4 text-white/60 text-xs">
              <div className="flex items-center gap-1">
                <User size={12} />
                <span>{story.author.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{story.readTime} read</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/stories/${story.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[var(--color-border)]">
        <div className="h-44 overflow-hidden bg-[var(--color-surface-2)]">
          <img
            src={story.image}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div className="p-4">
          <Badge variant="green" size="sm" className="mb-2">{story.category}</Badge>
          <h3 className="font-semibold text-[var(--color-text)] text-base mb-2 line-clamp-2 group-hover:text-[#006A4E] transition-colors">
            {story.title}
          </h3>
          <p className="text-[var(--color-text-muted)] text-sm line-clamp-2 mb-3">{story.excerpt}</p>
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>{story.author.name}</span>
            <div className="flex items-center gap-1">
              <Clock size={11} />
              <span>{story.readTime}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
