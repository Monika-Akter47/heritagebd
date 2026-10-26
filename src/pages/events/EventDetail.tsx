import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { eventsApi } from "../../services/api";
import { useApiData } from "../../hooks/useApiData";
import type { Event } from "../../types";
import Badge from "../../components/ui/Badge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { mockEvents as developmentEvents } from "../../data/mockData";

export default function EventDetail() {
  const { id = "" } = useParams();
  const { data: event, loading, error } = useApiData<Event | null>(
    () => eventsApi.get(id).catch(error => {
      if (import.meta.env.DEV) {
        const sampleEvent = developmentEvents.find(item => item.id === id);
        if (sampleEvent) return sampleEvent;
      }
      throw error;
    }),
    import.meta.env.DEV ? developmentEvents.find(item => item.id === id) ?? null : null,
    [id],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-[var(--color-text-muted)]">
          {error ? "This event could not be loaded." : "This event could not be found."}
        </p>
        <Link to="/events" className="font-semibold text-[#006A4E] hover:underline">
          Browse all events
        </Link>
      </div>
    );
  }

  return (
    <article className="min-h-screen pb-16" style={{ background: "var(--color-bg)" }}>
      <div className="relative h-[45vh] min-h-80 overflow-hidden bg-[var(--color-surface-2)]">
        <img src={event.image} alt={event.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 py-8 text-white sm:px-6">
          <Badge variant="gold" className="mb-3">{event.category}</Badge>
          <h1 className="text-4xl font-bold sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
            {event.name}
          </h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <Link to="/events" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#006A4E] hover:underline">
            <ArrowLeft size={16} /> All events
          </Link>
          <h2 className="mb-3 mt-5 text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            About this event
          </h2>
          <p className="whitespace-pre-line leading-7 text-[var(--color-text-muted)]">
            {event.description || "More details about this event will be available soon."}
          </p>
          {event.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white px-3 py-1 text-sm text-[var(--color-text-muted)]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-[var(--color-border)] bg-white p-6">
          <div className="mb-5 flex items-start gap-3">
            <Calendar size={18} className="mt-0.5 text-[#006A4E]" />
            <div>
              <p className="font-semibold">Event dates</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {new Date(event.startDate).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" })}
                {event.endDate && event.endDate.slice(0, 10) !== event.startDate.slice(0, 10) &&
                  ` – ${new Date(event.endDate).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" })}`}
              </p>
            </div>
          </div>
          <div className="mb-5 flex items-start gap-3">
            <MapPin size={18} className="mt-0.5 text-[#006A4E]" />
            <div>
              <p className="font-semibold">Location</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{event.location}, {event.district}</p>
            </div>
          </div>
          <div className="border-t border-[var(--color-border)] pt-5">
            <p className="text-sm text-[var(--color-text-muted)]">Entry</p>
            <p className="mt-1 text-xl font-bold text-[#006A4E]">
              {event.isFree ? "Free" : `৳${event.ticketPrice ?? 0}`}
            </p>
          </div>
          {event.organizer && (
            <p className="mt-5 text-sm text-[var(--color-text-muted)]">
              Organized by <span className="font-semibold text-[var(--color-text)]">{event.organizer}</span>
            </p>
          )}
        </aside>
      </div>
    </article>
  );
}
