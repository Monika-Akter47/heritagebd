import React, { useState } from 'react';
import { CheckCircle, XCircle, MessageSquare, Eye, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import Badge from '../../components/ui/Badge';
import StarRating from '../../components/ui/StarRating';

export default function GuideVerification() {
  const { data: fetchedGuides, loading } = useApiData(() => adminApi.guides(), [] as any[]);
  const [guides, setGuides] = useState<any[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  React.useEffect(() => {
    setGuides(fetchedGuides);
    if (fetchedGuides.length > 0) setSelectedGuide((prev: any) => prev || fetchedGuides[0]);
  }, [fetchedGuides]);

  const updateStatus = async (id: string, status: 'verified' | 'rejected') => {
    try {
      await adminApi.verifyGuide(id, status);
      setGuides(prev => prev.map(g => g.id === id ? { ...g, verificationStatus: status } : g));
      setSelectedGuide((prev: any) => prev && prev.id === id ? { ...prev, verificationStatus: status } : prev);
      window.dispatchEvent(new Event('heritagebd:guides-updated'));
    } catch (err) {
      console.error('Failed to update guide status', err);
    }
  };

  const filtered = guides.filter(g => filter === 'all' || g.verificationStatus === filter);

  const statusVariant = (status: string): 'gold' | 'green' | 'red' | 'gray' => {
    if (status === 'pending') return 'gold';
    if (status === 'verified') return 'green';
    if (status === 'rejected') return 'red';
    return 'gray';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-[var(--color-text-muted)]">Loading guides…</p>
      </div>
    );
  }

  if (!selectedGuide) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-[var(--color-text-muted)] mb-4">No guide applications yet.</p>
        <Link to="/admin" className="text-[#006A4E] font-semibold">Return to Admin</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin" className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm">
            <ArrowLeft size={16} /> Admin
          </Link>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Guide Verification</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'verified', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-[#006A4E] text-white' : 'bg-white border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[#006A4E]'}`}
            >
              {f} ({f === 'all' ? guides.length : guides.filter(g => g.verificationStatus === f).length})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guide list */}
          <div className="space-y-3">
            {filtered.map(guide => (
              <button
                key={guide.id}
                onClick={() => setSelectedGuide(guide)}
                className={`w-full flex items-center gap-3 p-4 bg-white rounded-2xl border-2 text-left transition-all ${selectedGuide.id === guide.id ? 'border-[#006A4E]' : 'border-[var(--color-border)] hover:border-gray-300'}`}
              >
                <img src={guide.profileImage} alt={guide.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{guide.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{guide.location}</p>
                  <Badge variant={statusVariant(guide.verificationStatus)} size="sm" className="mt-1">
                    {guide.verificationStatus}
                  </Badge>
                </div>
              </button>
            ))}
          </div>

          {/* Guide detail */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
              <div className="p-6 border-b border-[var(--color-border)]">
                <div className="flex items-start gap-4">
                  <img src={selectedGuide.profileImage} alt={selectedGuide.name} className="w-20 h-20 rounded-2xl object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{selectedGuide.name}</h2>
                      <Badge variant={statusVariant(selectedGuide.verificationStatus)}>
                        {selectedGuide.verificationStatus}
                      </Badge>
                    </div>
                    <p className="text-[var(--color-text-muted)] text-sm">{selectedGuide.email}</p>
                    <p className="text-sm mt-1">{selectedGuide.location} · {selectedGuide.yearsExperience} years experience</p>
                    <div className="flex items-center gap-1 mt-1">
                      <StarRating rating={selectedGuide.rating} size="sm" showValue />
                      <span className="text-xs text-[var(--color-text-muted)]">({selectedGuide.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <h3 className="font-semibold text-sm mb-2">About</h3>
                  <p className="text-[var(--color-text-muted)] text-sm">{selectedGuide.bio}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Languages</h3>
                    <div className="flex flex-wrap gap-1">{selectedGuide.languages.map((l: string) =><Badge key={l} variant="blue" size="sm">{l}</Badge>)}</div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-2">Specializations</h3>
                    <div className="flex flex-wrap gap-1">{selectedGuide.specializations.slice(0, 2).map((s: string) =><Badge key={s} variant="green" size="sm">{s}</Badge>)}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">Certifications</h3>
                  <ul className="space-y-1">
                    {selectedGuide.certifications.map((c: string) => (
                      <li key={c} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <CheckCircle size={13} className="text-[#006A4E]" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action buttons */}
                {selectedGuide.verificationStatus === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
                    <button
                      onClick={() => updateStatus(selectedGuide.id, 'verified')}
                      className="flex items-center gap-2 bg-[#006A4E] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#004D38] transition-colors"
                    >
                      <CheckCircle size={16} /> Approve Guide
                    </button>
                    <button
                      onClick={() => updateStatus(selectedGuide.id, 'rejected')}
                      className="flex items-center gap-2 border-2 border-[#F42A41] text-[#F42A41] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                    <button className="flex items-center gap-2 border border-[var(--color-border)] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
                      <MessageSquare size={16} /> Request Info
                    </button>
                  </div>
                )}

                {selectedGuide.verificationStatus === 'verified' && (
                  <div className="flex items-center gap-2 text-[#006A4E] pt-4 border-t border-[var(--color-border)]">
                    <CheckCircle size={18} />
                    <span className="font-semibold text-sm">This guide is verified and active on the platform.</span>
                  </div>
                )}

                {selectedGuide.verificationStatus === 'rejected' && (
                  <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
                    <button
                      onClick={() => updateStatus(selectedGuide.id, 'verified')}
                      className="flex items-center gap-2 bg-[#006A4E] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#004D38] transition-colors"
                    >
                      <CheckCircle size={16} /> Approve Instead
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
