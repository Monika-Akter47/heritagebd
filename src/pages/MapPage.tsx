import React, { useState, useEffect } from 'react';
import { MapPin, Filter, X, CheckCircle, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { placesApi, guidesApi } from '../services/api';
import { useApiData } from '../hooks/useApiData';
import Badge from '../components/ui/Badge';

interface MapMarker {
  id: string;
  type: 'place' | 'guide';
  name: string;
  lat: number;
  lng: number;
  rating?: number;
  image?: string;
  description?: string;
}

const markerColors = {
  place: '#006A4E',
  guide: '#D4A017',
};

export default function MapPage() {
  const [filters, setFilters] = useState({ places: true, guides: true });
  const [selected, setSelected] = useState<MapMarker | null>(null);
  const [MapComponents, setMapComponents] = useState<{ MapContainer: unknown; TileLayer: unknown; Marker: unknown; Popup: unknown; useMap: unknown } | null>(null);
  const [L, setL] = useState<unknown>(null);

  const { data: mockPlaces } = useApiData(() => placesApi.list(), [] as any[]);
  const { data: mockGuides } = useApiData(() => guidesApi.list(), [] as any[]);

  useEffect(() => {
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([rl, leaflet]) => {
      import('leaflet/dist/leaflet.css');
      // Fix leaflet default icons
      const l = leaflet.default;
      delete (l.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      l.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      setMapComponents(rl as never);
      setL(l);
    });
  }, []);

  const markers: MapMarker[] = [
    ...mockPlaces.filter(() => filters.places).map(p => ({
      id: p.id,
      type: 'place' as const,
      name: p.name,
      lat: p.coordinates.lat,
      lng: p.coordinates.lng,
      rating: p.rating,
      image: p.images[0],
      description: p.description,
    })),
    // Only guides who are available AND have chosen to share location come back with
    // coordinates (and those are approximate, ~1 km). Everyone else is simply not on the map.
    ...mockGuides.filter((g: any) => filters.guides && g.coordinates).map((g: any) => ({
      id: g.id,
      type: 'guide' as const,
      name: g.name,
      lat: g.coordinates.lat,
      lng: g.coordinates.lng,
      rating: g.rating,
      image: g.profileImage,
      description: `${g.bio ?? ''}${g.coordinates.approximate ? ' (approximate area — guide has shared location)' : ''}`,
    })),
  ];

  const toggleFilter = (key: 'places' | 'guides') => {
    setFilters(f => ({ ...f, [key]: !f[key] }));
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 shrink-0 bg-white border-r border-[var(--color-border)] overflow-y-auto flex flex-col">
        <div className="p-5 border-b border-[var(--color-border)]">
          <h2 className="font-bold text-lg mb-1" style={{ fontFamily: 'var(--font-display)' }}>Explore on Map</h2>
          <p className="text-[var(--color-text-muted)] text-sm">Click a marker to learn more</p>
        </div>

        {/* Filters */}
        <div className="p-5 border-b border-[var(--color-border)]">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Filter size={14} /> Show on Map</h3>
          <div className="space-y-2">
            {[
              { key: 'places' as const, label: 'Heritage Places', color: '#006A4E', count: mockPlaces.length },
              { key: 'guides' as const, label: 'Tour Guides', color: '#D4A017', count: mockGuides.length },
            ].map(f => (
              <label key={f.key} className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors">
                <input
                  type="checkbox"
                  checked={filters[f.key]}
                  onChange={() => toggleFilter(f.key)}
                  className="hidden"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${filters[f.key] ? 'border-none' : 'border-gray-300 bg-white'}`}
                  style={{ backgroundColor: filters[f.key] ? f.color : undefined }}>
                  {filters[f.key] && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="text-sm font-medium flex-1">{f.label}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{f.count}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Selected place info */}
        {selected ? (
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            {selected.image && (
              <img src={selected.image} alt={selected.name} className="w-full h-40 object-cover rounded-xl mb-3" />
            )}
            {selected.rating && (
              <div className="flex items-center gap-1 mb-2">
                <Star size={14} className="text-[#D4A017] fill-[#D4A017]" />
                <span className="text-sm font-semibold">{selected.rating.toFixed(1)}</span>
                <Badge variant={selected.type === 'place' ? 'green' : 'gold'} size="sm" className="ml-2">
                  {selected.type === 'place' ? 'Heritage Place' : 'Tour Guide'}
                </Badge>
              </div>
            )}
            <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mb-4 line-clamp-3">
              {selected.description}
            </p>
            <Link
              to={selected.type === 'place' ? `/places/${selected.id}` : `/guides/${selected.id}`}
              className="block w-full bg-[#006A4E] text-white text-center py-2.5 rounded-xl text-sm font-semibold hover:bg-[#004D38] transition-colors"
            >
              View {selected.type === 'place' ? 'Place' : 'Guide'} Details
            </Link>
          </div>
        ) : (
          <div className="p-5">
            <p className="text-[var(--color-text-muted)] text-sm">
              {markers.length} locations shown. Click any marker on the map to see details.
            </p>
            <div className="mt-4 space-y-2">
              {markers.slice(0, 6).map(m => (
                <button
                  key={`${m.type}-${m.id}`}
                  onClick={() => setSelected(m)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors text-left"
                >
                  <MapPin size={16} style={{ color: markerColors[m.type] }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)] capitalize">{m.type}</p>
                  </div>
                  {m.rating && (
                    <div className="flex items-center gap-0.5">
                      <Star size={11} className="text-[#D4A017] fill-[#D4A017]" />
                      <span className="text-xs font-semibold">{m.rating.toFixed(1)}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {MapComponents ? (
          (() => {
            const { MapContainer, TileLayer, Marker, Popup } = MapComponents as {
              MapContainer: React.ComponentType<{ center: [number, number]; zoom: number; style: React.CSSProperties; children: React.ReactNode }>;
              TileLayer: React.ComponentType<{ url: string; attribution: string }>;
              Marker: React.ComponentType<{ position: [number, number]; children?: React.ReactNode; eventHandlers?: { click: () => void } }>;
              Popup: React.ComponentType<{ children: React.ReactNode }>;
            };
            return (
              <MapContainer
                center={[23.8103, 90.4125]}
                zoom={7}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                {markers.map(m => (
                  <Marker
                    key={`${m.type}-${m.id}`}
                    position={[m.lat, m.lng]}
                    eventHandlers={{ click: () => setSelected(m) }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">{m.name}</p>
                        <p className="capitalize text-gray-500">{m.type}</p>
                        {m.rating && <p>Rating: {m.rating.toFixed(1)} ★</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            );
          })()
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface-2)]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#006A4E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[var(--color-text-muted)]">Loading map...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
