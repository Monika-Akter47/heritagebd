import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import type { Event } from '../../types';
import Badge from '../ui/Badge';

interface EventCardProps {
  event: Event;
}

const categoryColors: Record<string, 'green' | 'red' | 'gold' | 'gray' | 'blue' | 'orange'> = {
  cultural: 'blue',
  food: 'orange',
  market: 'gold',
  heritage: 'green',
  festival: 'red',
  religious: 'gray',
};

export default function EventCard({ event }: EventCardProps) {
  const date = new Date(event.startDate);
  const month = date.toLocaleString('default', { month: 'short' });
  const day = date.getDate();

  return (
    <Link to={`/events/${event.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[var(--color-border)]">
        <div className="relative h-48 overflow-hidden bg-[var(--color-surface-2)]">
          <img
            src={event.image}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant={categoryColors[event.category] || 'gray'}>{event.category}</Badge>
            {event.isFree && <Badge variant="green">Free</Badge>}
          </div>
          <div className="absolute top-3 right-3 bg-white rounded-xl text-center p-2 shadow-md min-w-[48px]">
            <div className="text-xs font-bold text-[#F42A41] uppercase">{month}</div>
            <div className="text-xl font-bold text-[var(--color-text)] leading-none">{day}</div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-[var(--color-text)] text-base mb-2 line-clamp-2 group-hover:text-[#006A4E] transition-colors">
            {event.name}
          </h3>
          <div className="flex items-center gap-1 text-[var(--color-text-muted)] text-sm mb-1">
            <MapPin size={13} />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-1 text-[var(--color-text-muted)] text-sm">
            <Calendar size={13} />
            <span>{new Date(event.startDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          {!event.isFree && event.ticketPrice && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
              <span className="font-bold text-[#006A4E]">৳{event.ticketPrice}</span>
              <span className="text-xs text-[var(--color-text-muted)]"> per person</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
