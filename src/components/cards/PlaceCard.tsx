import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';
import type { HeritagePlace } from '../../types';
import Badge from '../ui/Badge';

interface PlaceCardProps {
  place: HeritagePlace;
  compact?: boolean;
}

const categoryLabels: Record<string, string> = {
  mosque: 'Mosque',
  fort: 'Fort',
  palace: 'Palace',
  temple: 'Temple',
  monument: 'Monument',
  archaeological: 'Archaeological',
  natural: 'Natural',
  museum: 'Museum',
};

export default function PlaceCard({ place, compact = false }: PlaceCardProps) {
  return (
    <Link to={`/places/${place.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[var(--color-border)]">
        <div className={`relative overflow-hidden bg-[var(--color-surface-2)] ${compact ? 'h-44' : 'h-56'}`}>
          <img
            src={place.images[0]}
            alt={place.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 left-3">
            <Badge variant="green">{categoryLabels[place.category]}</Badge>
          </div>
          {place.featured && (
            <div className="absolute top-3 right-3">
              <Badge variant="gold">Featured</Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-[var(--color-text)] text-base mb-1 group-hover:text-[#006A4E] transition-colors line-clamp-1">
            {place.name}
          </h3>
          {place.nameLocal && (
            <p className="text-xs text-[var(--color-text-muted)] mb-2">{place.nameLocal}</p>
          )}
          <div className="flex items-center gap-1 text-[var(--color-text-muted)] text-sm mb-2">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{place.location}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star size={13} className="text-[#D4A017] fill-[#D4A017]" />
              <span className="text-sm font-semibold text-[var(--color-text)]">{place.rating.toFixed(1)}</span>
              <span className="text-xs text-[var(--color-text-muted)]">({place.reviewCount})</span>
            </div>
            {!compact && place.established && (
              <span className="text-xs text-[var(--color-text-muted)]">Est. {place.established}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
