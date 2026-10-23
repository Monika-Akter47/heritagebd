import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, CheckCircle, Languages } from 'lucide-react';
import type { TourGuide } from '../../types';
import Badge from '../ui/Badge';

interface GuideCardProps {
  guide: TourGuide;
}

export default function GuideCard({ guide }: GuideCardProps) {
  const initials = guide.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('');
  const hasBookableProfile = !!guide.bio?.trim() && !!guide.location?.trim()
    && guide.pricePerDay > 0 && Array.isArray(guide.tourTypes) && guide.tourTypes.length > 0;
  return (
    <Link to={`/guides/${guide.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[var(--color-border)]">
        <div className="relative h-40 overflow-hidden bg-[var(--color-surface-2)]">
          {guide.profileImage || guide.avatar ? (
            <img
              src={guide.profileImage || guide.avatar}
              alt={guide.name}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#006A4E]/10 text-4xl font-bold text-[#006A4E]">{initials}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1">
                <Star size={12} className="text-[#D4A017] fill-[#D4A017]" />
                <span className="text-white text-xs font-semibold">{guide.rating.toFixed(1)}</span>
                <span className="text-white/70 text-xs">({guide.reviewCount})</span>
              </div>
            </div>
            {hasBookableProfile && guide.isAvailable ? (
              <Badge variant="green" size="sm">Available</Badge>
            ) : !hasBookableProfile ? (
              <Badge variant="gold" size="sm">Profile incomplete</Badge>
            ) : (
              <Badge variant="gray" size="sm">Busy</Badge>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-[var(--color-text)] text-base group-hover:text-[#006A4E] transition-colors">
              {guide.name}
            </h3>
            {guide.verified && (
              <CheckCircle size={16} className="text-[#006A4E] shrink-0 mt-0.5" />
            )}
          </div>
          <div className="flex items-center gap-1 text-[var(--color-text-muted)] text-sm mb-2">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{guide.location || 'Location not provided'}</span>
          </div>
          <div className="flex items-center gap-1 text-[var(--color-text-muted)] text-xs mb-3">
            <Languages size={12} />
            <span className="truncate">{guide.languages?.length ? guide.languages.join(', ') : 'Languages not provided'}</span>
          </div>
          <p className="mb-3 min-h-9 line-clamp-2 text-xs text-[var(--color-text-muted)]">
            {guide.bio || 'Guide profile details have not been added yet.'}
          </p>
          <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
            <div>
              {guide.pricePerDay > 0 ? (
                <>
                  <span className="font-bold text-[#006A4E]">৳{guide.pricePerDay.toLocaleString()}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">/day</span>
                </>
              ) : <span className="text-xs text-[var(--color-text-muted)]">Pricing not provided</span>}
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">{guide.toursCompleted} tours</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
