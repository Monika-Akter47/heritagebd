import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, Users, Store, Compass, MapPin, Package, ShoppingBag,
  Star, Calendar, BookOpen, BarChart2, Settings, Bell, Shield,
  TrendingUp, CheckCircle, XCircle, Clock, Eye, Edit, Trash2, Search,
  QrCode, Percent, AlertCircle, FileText, UtensilsCrossed, Wallet
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { preordersApi, adminApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import { UsersSection, VendorsSection, ProductsSection, OrdersSection, BookingsSection, ReviewsSection, EventsSection, LocalFoodsSection, StoriesSection, ReportsSection, DocumentsSection, PlacesSection, SiteImagesSection } from './AdminSections';
import PaymentsSection from './PaymentsSection';
import { mockPreOrderSettings } from '../../data/preorderData';
import Badge from '../../components/ui/Badge';
import StatusBadge from "../../components/ui/StatusBadge";
import { useApp } from '../../context/AppContext';
import type { PreOrder, PreOrderSettings } from '../../types';
import { methodLabel } from '../../components/ui/PaymentProofFields';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'vendors', label: 'Vendors', icon: Store },
  { id: 'guides', label: 'Tour Guides', icon: Compass },
  { id: 'verification', label: 'Verification Center', icon: Shield },
  { id: 'documents', label: 'Submitted Documents', icon: FileText },
  { id: 'places', label: 'Heritage Places', icon: MapPin },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'bookings', label: 'Guide Bookings', icon: Calendar },
  { id: 'preorders', label: 'Ready to Pick Orders', icon: QrCode },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'local-foods', label: 'Traditional Foods', icon: UtensilsCrossed },
  { id: 'stories', label: 'Stories', icon: BookOpen },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
  { id: 'payments', label: 'Payments & Advances', icon: Wallet },
  { id: 'earnings', label: 'Earnings & Commission', icon: TrendingUp },
  { id: 'preorder-settings', label: 'Payment Terms & Pre-Order Settings', icon: Percent },
  { id: 'settings', label: 'Settings', icon: Settings },
];


function VerificationCenter({ onOpenDocuments }: { onOpenDocuments: (userId: string) => void }) {
  const [vFilter, setVFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'vendor' | 'guide'>('all');
  const [selected, setSelected] = useState<any | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionDone, setActionDone] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const { data: rawVendors, loading: vendorsLoading, error: vendorsError, setData: setRawVendors } = useApiData(() => adminApi.allVendors(), [] as any[]);
  const { data: rawGuides, loading: guidesLoading, error: guidesError, setData: setRawGuides } = useApiData(() => adminApi.guides(), [] as any[]);
  const loading = vendorsLoading || guidesLoading;

  const applicants = [
    ...rawVendors.map((v: any) => ({
      id: v.id, name: v.name, avatar: v.avatar, type: 'vendor' as const, shop: v.shopName, district: v.location,
      shopImage: v.shopImage, shopCoverImage: v.shopCoverImage,
      businessType: v.businessType, businessAddress: v.businessAddress, shopDescription: v.shopDescription,
      categories: Array.isArray(v.productCategories) ? v.productCategories.join(', ') : '',
      pickupLocation: v.pickupLocation,
      nidNumber: v.nidNumber, tradeLicense: v.tradeLicense,
      submitted: (v.createdAt || '').slice(0, 10), status: v.verificationStatus, docs: [v.nidNumber, v.tradeLicense].filter(Boolean).length,
    })),
    ...rawGuides.map((g: any) => ({
      id: g.id, name: g.name, avatar: g.profileImage || g.avatar, type: 'guide' as const, area: g.location,
      submitted: (g.createdAt || '').slice(0, 10), status: g.verificationStatus, docs: (g.certifications || []).length,
    })),
  ];

  const filtered = applicants.filter(a =>
    (vFilter === 'all' || a.status === vFilter) &&
    (typeFilter === 'all' || a.type === typeFilter)
  );

  const counts = {
    all: applicants.length,
    pending: applicants.filter(a => a.status === 'pending').length,
    verified: applicants.filter(a => a.status === 'verified').length,
    rejected: applicants.filter(a => a.status === 'rejected').length,
  };

  const statusColors: Record<string, { bg: string; color: string }> = {
    unverified: { bg: '#F3F4F6', color: '#6B7280' },
    pending: { bg: '#FEF3C7', color: '#D97706' },
    verified: { bg: '#D1FAE5', color: '#059669' },
    rejected: { bg: '#FEE2E2', color: '#DC2626' },
  };

  async function handleReview(status: 'verified' | 'rejected') {
    if (!selected) return;
    setActionBusy(true);
    setActionError('');
    try {
      if (selected.type === 'vendor') {
        await adminApi.verifyVendor(selected.id, status);
        setRawVendors((prev: any[]) => prev.map(v => v.id === selected.id ? { ...v, verificationStatus: status } : v));
      } else {
        await adminApi.verifyGuide(selected.id, status);
        setRawGuides((prev: any[]) => prev.map(g => g.id === selected.id ? { ...g, verificationStatus: status } : g));
        window.dispatchEvent(new Event('heritagebd:guides-updated'));
      }
      setActionDone(status);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update guide verification.');
    } finally {
      setActionBusy(false);
    }
  }

  if (loading) {
    return <p role="status" aria-live="polite" className="text-sm text-[var(--color-text-muted)] py-12 text-center">Loading applications…</p>;
  }

  if (vendorsError || guidesError) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-semibold">Could not load verification applications.</p>
        {vendorsError && <p className="mt-1">Vendors: {vendorsError}</p>}
        {guidesError && <p className="mt-1">Guides: {guidesError}</p>}
      </div>
    );
  }

  if (selected) {
    return (
      <div className="space-y-5">
        <button onClick={() => { setSelected(null); setActionDone(null); setShowReject(false); }}
          className="flex items-center gap-2 text-sm font-medium hover:underline"
          style={{ color: 'var(--color-text-muted)' }}>
          ← Back to list
        </button>

        {actionDone && (
          <div className="flex items-center gap-2 p-4 rounded-xl"
            style={{ background: actionDone === 'verified' ? '#D1FAE5' : '#FEE2E2', color: actionDone === 'verified' ? '#059669' : '#DC2626' }}>
            {actionDone === 'verified' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            <span className="font-semibold text-sm">Application {actionDone === 'verified' ? 'approved' : 'rejected'} successfully.</span>
          </div>
        )}
        {actionError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Applicant info */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-start gap-4">
                {selected.avatar
                  ? <img src={selected.avatar} alt="" className="h-14 w-14 flex-shrink-0 rounded-full object-cover" />
                  : <div className="w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: selected.type === 'guide' ? '#F5F3FF' : '#E6F4EF' }}>
                    {selected.type === 'guide' ? '🧭' : '🏪'}
                  </div>}
                <div className="flex-1">
                  <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>{selected.name}</h3>
                  <p className="text-sm capitalize" style={{ color: 'var(--color-text-muted)' }}>{selected.type} · Submitted {selected.submitted}</p>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold mt-1 capitalize"
                    style={statusColors[selected.status]}>
                    {selected.status}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                {selected.type === 'vendor' && (selected.shopImage || selected.shopCoverImage) && (
                  <div className="mb-4 flex flex-wrap gap-3">
                    {selected.shopImage && <img src={selected.shopImage} alt="Vendor shop logo" className="h-16 w-16 rounded-xl border object-cover" />}
                    {selected.shopCoverImage && <img src={selected.shopCoverImage} alt="Vendor shop cover" className="h-16 w-40 rounded-xl border object-cover" />}
                  </div>
                )}
                {(selected.type === 'vendor'
                  ? [
                    ['Shop', selected.shop],
                    ['Business type', selected.businessType],
                    ['District', selected.district],
                    ['Business address', selected.businessAddress],
                    ['Description', selected.shopDescription],
                    ['Product categories', selected.categories],
                    ['Pickup location', selected.pickupLocation],
                  ]
                  : [['Coverage', selected.area]]
                ).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>{k}</span>
                    <span className="font-medium" style={{ color: 'var(--color-text)' }}>{v || '—'}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>{selected.type === 'vendor' ? 'Document references' : 'Documents'}</span>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {selected.docs} {selected.type === 'vendor' ? 'provided' : 'uploaded'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
              <h4 className="font-bold text-sm mb-3" style={{ color: 'var(--color-text)' }}>
                Submitted Documents
              </h4>
              {selected.type === 'vendor' ? (
                <>
                  {[
                    ['National ID (NID)', selected.nidNumber],
                    ['Trade License', selected.tradeLicense],
                  ].filter(([, value]) => value).map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 py-2 border-b last:border-b-0 text-sm" style={{ borderColor: 'var(--color-border)' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                      <span className="font-medium text-right" style={{ color: 'var(--color-text)' }}>{value}</span>
                    </div>
                  ))}
                  {selected.docs === 0 && <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No document references provided.</p>}
                </>
              ) : (
                <>
                  {selected.docs > 0 && <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {selected.docs} certification record(s) on the guide profile.
                  </p>}
                  {selected.docs === 0 && <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No documents on file yet.</p>}
                </>
              )}
              <button type="button" onClick={() => onOpenDocuments(selected.id)}
                className="mt-3 rounded-lg border border-[#006A4E] px-3 py-2 text-xs font-semibold text-[#006A4E] hover:bg-[#006A4E]/5">
                View uploaded files
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="space-y-4">
            {!actionDone && selected.status === 'pending' && (
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}>
                <h4 className="font-bold text-sm mb-4" style={{ color: 'var(--color-text)' }}>Review Actions</h4>
                <div className="space-y-3">
                  <button onClick={() => handleReview('verified')} disabled={actionBusy}
                    className="w-full flex items-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white hover:opacity-90 disabled:opacity-60"
                    style={{ background: 'var(--color-primary)' }}>
                    <CheckCircle size={15} /> Approve Application
                  </button>
                  <button onClick={() => setShowReject(true)} disabled={actionBusy}
                    className="w-full flex items-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white hover:opacity-90 disabled:opacity-60"
                    style={{ background: '#DC2626' }}>
                    <XCircle size={15} /> Reject Application
                  </button>
                </div>
              </div>
            )}

            {showReject && !actionDone && (
              <div className="bg-white rounded-2xl border-2 p-5" style={{ borderColor: '#DC2626' }}>
                <h4 className="font-bold text-sm mb-3" style={{ color: '#DC2626' }}>Rejection Reason</h4>
                <textarea rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  placeholder="Provide a clear reason for rejection. This will be sent to the applicant."
                  className="w-full px-3 py-2 rounded-xl border-2 text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--color-border)' }} />
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setShowReject(false)} disabled={actionBusy} className="flex-1 py-2 rounded-xl text-sm border-2 font-semibold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                    Cancel
                  </button>
                  <button onClick={() => handleReview('rejected')} disabled={actionBusy} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#DC2626' }}>
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: counts.all, color: 'var(--color-primary)' },
          { label: 'Pending Review', value: counts.pending, color: '#D97706' },
          { label: 'Verified', value: counts.verified, color: '#059669' },
          { label: 'Rejected', value: counts.rejected, color: '#DC2626' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
          {(['all', 'pending', 'verified', 'rejected'] as const).map(f => (
            <button key={f} onClick={() => setVFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={vFilter === f ? { background: 'white', color: 'var(--color-text)' } : { color: 'var(--color-text-muted)' }}>
              {f} {f !== 'all' && `(${counts[f]})`}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
          {(['all', 'vendor', 'guide'] as const).map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={typeFilter === f ? { background: 'white', color: 'var(--color-text)' } : { color: 'var(--color-text-muted)' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
              {['Applicant', 'Type', 'Details', 'Submitted', 'Docs', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a: any) => (
              <tr key={`${a.type}-${a.id}`} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--color-border)' }}>
                <td className="px-4 py-3 font-semibold" style={{ color: 'var(--color-text)' }}>{a.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={a.type === 'vendor' ? { background: '#E6F4EF', color: '#006A4E' } : { background: '#F5F3FF', color: '#7C3AED' }}>
                    {a.type === 'vendor' ? '🏪' : '🧭'} {a.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {a.type === 'vendor' ? a.shop : a.area}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>{a.submitted}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {a.docs} {a.type === 'vendor' ? 'details' : 'files'}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold capitalize"
                    style={statusColors[a.status]}>
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(a)}
                    className="flex items-center gap-1 text-xs font-semibold hover:underline"
                    style={{ color: 'var(--color-primary)' }}>
                    <Eye size={13} /> Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No applications match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { currentUser } = useApp();
  const [searchParams] = useSearchParams();
  const initialSection = searchParams.get('section');
  const [activeSection, setActiveSection] = useState(
    initialSection === 'orders' || initialSection === 'documents' || initialSection === 'payments' ? initialSection : 'dashboard',
  );
  const [documentsUserId, setDocumentsUserId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [poSettings, setPoSettings] = useState<PreOrderSettings>({ ...mockPreOrderSettings });
  const [poFilter, setPoFilter] = useState('');
  const [poStatus, setPoStatus] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [commissionSettings, setCommissionSettings] = useState<any[]>([]);
  const [commissionSaving, setCommissionSaving] = useState(false);
  const [commissionSaved, setCommissionSaved] = useState(false);

  const { data: stats, loading: statsLoading, error: statsError } = useApiData(() => adminApi.stats(), null as any);
  const { data: finance, loading: financeLoading, error: financeError } = useApiData(() => adminApi.earnings(), null as any);
  const { data: fetchedCommissionSettings, loading: commissionSettingsLoading, error: commissionSettingsError } = useApiData(
    () => adminApi.commissionSettings(), [] as any[]
  );
  const { data: mockGuides, setData: setMockGuides, refetch: refetchGuides } = useApiData(() => adminApi.guides(), [] as any[]);
  const { data: preOrders } = useApiData(() => preordersApi.list(), [] as PreOrder[]);
  const { data: fetchedSettings } = useApiData(() => preordersApi.settings(), null as any);

  React.useEffect(() => {
    if (fetchedSettings) setPoSettings(fetchedSettings);
  }, [fetchedSettings]);
  React.useEffect(() => {
    if (fetchedCommissionSettings.length) setCommissionSettings(fetchedCommissionSettings);
  }, [fetchedCommissionSettings]);

  React.useEffect(() => {
    const refreshGuides = () => { void refetchGuides(); };
    window.addEventListener('heritagebd:guides-updated', refreshGuides);
    return () => window.removeEventListener('heritagebd:guides-updated', refreshGuides);
  }, [refetchGuides]);

  async function verifyGuide(id: string, status: 'verified' | 'rejected') {
    try {
      await adminApi.verifyGuide(id, status);
      setMockGuides((prev: any[]) => prev.map(guide => guide.id === id
        ? { ...guide, verified: status === 'verified', verificationStatus: status }
        : guide));
      window.dispatchEvent(new Event('heritagebd:guides-updated'));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not update guide verification.');
    }
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Shield size={48} className="text-[#006A4E]/20 mb-4" />
        <p className="text-[var(--color-text-muted)] mb-4">Admin access required.</p>
        <Link to="/login" className="bg-[#006A4E] text-white px-6 py-3 rounded-xl font-semibold">Sign In as Admin</Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <div className={`w-64 bg-[#1A1A2E] text-white flex flex-col shrink-0 ${sidebarOpen ? 'block' : 'hidden lg:flex'}`}>
        <div className="p-5 border-b border-white/10">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Admin Panel</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors text-left ${
                activeSection === item.id ? 'bg-[#006A4E] text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 bg-white border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between z-10">
          <h2 className="font-bold text-lg capitalize" style={{ fontFamily: 'var(--font-display)' }}>
            {NAV_ITEMS.find(n => n.id === activeSection)?.label}
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-sm outline-none w-48 focus:w-64 transition-all"
              />
            </div>
            <button className="relative p-2 rounded-lg hover:bg-gray-100">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#F42A41] rounded-full" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {statsError && <p className="text-sm text-red-600">Couldn't load platform statistics: {statsError}</p>}
              {financeError && <p className="text-sm text-red-600">Couldn't load commission totals: {financeError}</p>}
              {/* Quick stats — live from MySQL */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                {[
                  { label: 'Total Users', value: stats?.totalUsers, color: '#006A4E', icon: Users },
                  { label: 'Vendors', value: stats?.totalVendors, color: '#D4A017', icon: Store },
                  { label: 'Guides', value: stats?.totalGuides, color: '#006A4E', icon: Compass },
                  { label: 'Places', value: stats?.totalPlaces, color: '#F42A41', icon: MapPin },
                  { label: 'Orders', value: stats?.totalOrders, color: '#D4A017', icon: ShoppingBag },
                  { label: 'Completed Tours', value: stats?.completedTours, color: '#006A4E', icon: CheckCircle },
                  { label: 'Platform Commission (this month)', value: finance ? `৳${Number(finance.byMonth?.find((month: any) => month.month === new Date().toISOString().slice(0, 7))?.profit || 0).toLocaleString()}` : undefined, color: '#006A4E', icon: TrendingUp },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-2xl p-4 border border-[var(--color-border)]">
                    <stat.icon size={18} style={{ color: stat.color }} className="mb-2" />
                    <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: stat.color }}>{stat.value ?? (statsLoading ? '…' : '—')}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth */}
                <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)]">
                  <h3 className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>New Sign-ups</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mb-3">Accounts created per month, last 6 months</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={stats?.monthly ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="tourists" stroke="#006A4E" strokeWidth={2} dot={false} name="Tourists" />
                      <Line type="monotone" dataKey="guides" stroke="#D4A017" strokeWidth={2} dot={false} name="Guides" />
                      <Line type="monotone" dataKey="vendors" stroke="#F42A41" strokeWidth={2} dot={false} name="Vendors" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Sales */}
                <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)]">
                  <h3 className="font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Marketplace Revenue</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats?.monthly ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 100000 ? `৳${(v / 100000).toFixed(1)}L` : `৳${Number(v).toLocaleString()}`} />
                      <Tooltip formatter={(v: unknown) => [`৳${Number(v).toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#006A4E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)]">
                <h3 className="font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'Verify Guides', onClick: () => setActiveSection('guides'), variant: 'primary' },
                    { label: 'Review Products', onClick: () => setActiveSection('products'), variant: 'secondary' },
                    { label: 'Manage Events', onClick: () => setActiveSection('events'), variant: 'outline' },
                    { label: 'View Reports', onClick: () => setActiveSection('reports'), variant: 'outline' },
                  ].map(action => (
                    <button
                      key={action.label}
                      onClick={action.onClick}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        action.variant === 'primary' ? 'bg-[#006A4E] text-white hover:bg-[#004D38]' :
                        action.variant === 'secondary' ? 'bg-[#D4A017] text-[#1A1A2E] hover:bg-[#b88a10]' :
                        'border border-[var(--color-border)] hover:bg-gray-50'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'guides' && (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                      {['Guide', 'Location', 'Rating', 'Tours', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {mockGuides.map(guide => (
                      <tr key={guide.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <img src={guide.profileImage} alt={guide.name} className="w-9 h-9 rounded-full object-cover" />
                            <div>
                              <p className="font-medium text-sm">{guide.name}</p>
                              <p className="text-xs text-[var(--color-text-muted)]">{guide.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-[var(--color-text-muted)]">{guide.location}</td>
                        <td className="px-4 py-4 text-sm">⭐ {guide.rating}</td>
                        <td className="px-4 py-4 text-sm">{guide.toursCompleted}</td>
                        <td className="px-4 py-4">
                          <Badge variant={guide.verificationStatus === 'verified' ? 'green' : guide.verificationStatus === 'rejected' ? 'red' : 'gold'} size="sm">
                            {guide.verificationStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button title="Open guide verification" onClick={() => setActiveSection('verification')} className="p-1.5 text-[var(--color-text-muted)] hover:text-[#006A4E]"><Eye size={14} /></button>
                            {guide.verificationStatus !== 'verified' && (
                              <button title="Approve guide" onClick={() => void verifyGuide(guide.id, 'verified')} className="p-1.5 text-[var(--color-text-muted)] hover:text-green-600"><CheckCircle size={14} /></button>
                            )}
                            {guide.verificationStatus !== 'rejected' && (
                              <button title="Reject guide" onClick={() => void verifyGuide(guide.id, 'rejected')} className="p-1.5 text-[var(--color-text-muted)] hover:text-[#F42A41]"><XCircle size={14} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'places' && <PlacesSection />}

          {/* Pre-Order Management */}
          {activeSection === 'preorders' && (
            <div className="space-y-5">
              {/* Stats bar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Pre-Orders', value: preOrders.length, color: '#006A4E' },
                  { label: 'Preparing', value: preOrders.filter(o => o.status === 'preparing').length, color: '#D4A017' },
                  { label: 'Ready for Pickup', value: preOrders.filter(o => o.status === 'ready_for_pickup').length, color: '#2563EB' },
                  { label: 'Completed', value: preOrders.filter(o => o.status === 'completed').length, color: '#059669' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl p-4 border border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-muted)] font-semibold uppercase mb-1">{s.label}</p>
                    <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Filter */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input value={poFilter} onChange={e => setPoFilter(e.target.value)} placeholder="Search orders..." className="pl-9 pr-4 py-2 border border-[var(--color-border)] rounded-xl text-sm outline-none w-full" />
                </div>
                <select value={poStatus} onChange={e => setPoStatus(e.target.value)} aria-label="Filter by status"
                  className="border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm outline-none bg-white">
                  <option value="">All Statuses</option>
                  {['advance_paid', 'vendor_accepted', 'preparing', 'ready_for_pickup', 'arrived', 'qr_verified', 'pickup_payment_pending', 'picked_up', 'completed', 'cancelled'].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                        {['Order', 'Tourist', 'Vendor', 'Destination', 'Pickup Date/Time', 'Amount', 'Advance', 'Remaining', 'Payment', 'Status'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {preOrders.filter(o =>
                        (!poStatus || o.status === poStatus)
                        && (!poFilter || o.orderNumber.includes(poFilter) || o.touristName.toLowerCase().includes(poFilter.toLowerCase()) || o.vendorName.toLowerCase().includes(poFilter.toLowerCase()))
                      ).map(order => {
                        return (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm font-semibold">#{order.orderNumber}</td>
                            <td className="px-4 py-4 text-sm">{order.touristName}</td>
                            <td className="px-4 py-4 text-sm text-[var(--color-text-muted)]">{order.vendorName}</td>
                            <td className="px-4 py-4 text-sm">{order.destination}</td>
                            <td className="px-4 py-4 text-sm whitespace-nowrap">{new Date(order.pickupDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'short' })} · {order.pickupTime}</td>
                            <td className="px-4 py-4 text-sm font-semibold">৳{order.totalAmount.toLocaleString()}</td>
                            <td className="px-4 py-4 text-sm text-green-700">৳{order.advancePaid.toLocaleString()}</td>
                            <td className="px-4 py-4 text-sm" style={{ color: 'var(--color-accent)' }}>৳{order.remainingAmount.toLocaleString()}</td>
                            <td className="px-4 py-4 text-xs whitespace-nowrap">
                              {methodLabel(order.advancePaymentMethod)}
                              {order.advanceTransactionId && <p className="font-mono text-[var(--color-text-muted)]">{order.advancePayerPhone} · {order.advanceTransactionId}</p>}
                              {order.pickupPaymentMethod && <p className="text-[var(--color-text-muted)]">Pickup: {methodLabel(order.pickupPaymentMethod)}{order.pickupTransactionId ? ` · ${order.pickupTransactionId}` : ''}</p>}
                            </td>
                            <td className="px-4 py-4">
                              <StatusBadge status={order.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'payments' && <PaymentsSection />}

          {activeSection === 'earnings' && (
            <div className="space-y-6">
              {financeError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Could not load financial reports: {financeError}</p>}
              {financeLoading && <p className="text-sm text-[var(--color-text-muted)]">Loading settlement reports…</p>}
              {!financeLoading && finance && <>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    ['Gross Settled', finance.totals.grossSettled],
                    ['Platform Commission', finance.totals.adminProfit],
                    ['Partner Earnings', finance.totals.partnersEarned],
                    ['Advances Held', finance.totals.advanceHeld],
                    ['Advances Refunded', finance.totals.advanceRefunded],
                  ].map(([label, amount]) => (
                    <div key={String(label)} className="rounded-2xl border bg-white p-4" style={{ borderColor: 'var(--color-border)' }}>
                      <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">{label}</p>
                      <p className="mt-2 text-xl font-bold text-[#006A4E]">৳{Number(amount).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
                    <h3 className="mb-4 font-bold">Monthly Platform Commission</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={finance.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickFormatter={(value: string) => new Date(`${value}-01T00:00:00`).toLocaleString('en', { month: 'short' })} />
                        <YAxis />
                        <Tooltip formatter={(value: unknown) => [`৳${Number(value).toLocaleString()}`, 'Commission']} />
                        <Line dataKey="profit" name="Commission" stroke="#006A4E" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
                    <h3 className="mb-4 font-bold">Settled by Flow</h3>
                    <div className="space-y-3">
                      {Object.entries(finance.byFlow || {}).map(([flow, values]: [string, any]) => (
                        <div key={flow} className="rounded-xl bg-[var(--color-surface-2)] p-3">
                          <p className="font-semibold capitalize">{flow.replace('_', ' ')}</p>
                          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Gross ৳{Number(values.grossSettled).toLocaleString()} · Commission ৳{Number(values.adminProfit).toLocaleString()} · Partners ৳{Number(values.partnersEarned).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  {(['vendors', 'guides'] as const).map(role => (
                    <div key={role} className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
                      <h3 className="mb-3 font-bold">Top {role}</h3>
                      {finance.top?.[role]?.length
                        ? finance.top[role].map((partner: any) => <p key={partner.id} className="flex justify-between border-t py-2 text-sm"><span>{partner.name}</span><strong>৳{Number(partner.earnings).toLocaleString()}</strong></p>)
                        : <p className="text-sm text-[var(--color-text-muted)]">No settled earnings yet.</p>}
                    </div>
                  ))}
                </div>
              </>}
            </div>
          )}

          {/* Pre-Order Settings */}
          {activeSection === 'preorder-settings' && (
            <div className="space-y-6 max-w-2xl">
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Configure the "Ready to Pick" pre-order feature settings. Changes apply platform-wide.
              </p>

              {/* Unified payment and commission settings */}
              <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] space-y-5">
                <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Platform Payment Terms & Commission</h3>
                <p className="text-xs text-[var(--color-text-muted)]">These unified rates apply to new orders only. Existing orders keep their saved terms.</p>
                {commissionSettingsLoading && <p role="status" className="text-sm text-[var(--color-text-muted)]">Loading commission settings…</p>}
                {commissionSettingsError && <p role="alert" className="text-sm text-red-600">Could not load commission settings: {commissionSettingsError}</p>}
                {commissionSettings.map((setting: any) => (
                  <div key={setting.flow} className="grid grid-cols-[1fr_120px_120px] items-center gap-3">
                    <span className="text-sm font-semibold capitalize">{setting.flow.replace('_', ' ')}</span>
                    <label className="text-xs text-[var(--color-text-muted)]">Advance %
                      <input type="number" min="0" max="100" step="0.01" value={setting.advancePercent}
                        onChange={event => setCommissionSettings(current => current.map(item => item.flow === setting.flow ? { ...item, advancePercent: Number(event.target.value) } : item))}
                        className="mt-1 w-full rounded-lg border px-2 py-2 text-sm text-[var(--color-text)]" />
                    </label>
                    <label className="text-xs text-[var(--color-text-muted)]">Commission %
                      <input type="number" min="0" max="100" step="0.01" value={setting.commissionPercent}
                        onChange={event => setCommissionSettings(current => current.map(item => item.flow === setting.flow ? { ...item, commissionPercent: Number(event.target.value) } : item))}
                        className="mt-1 w-full rounded-lg border px-2 py-2 text-sm text-[var(--color-text)]" />
                    </label>
                  </div>
                ))}
                {commissionSaved && <p className="text-sm font-semibold text-green-700">Commission settings saved.</p>}
                {settingsError && <p role="alert" className="text-sm text-red-600">{settingsError}</p>}
                <button type="button" disabled={commissionSaving || commissionSettings.length !== 3}
                  onClick={async () => {
                    setCommissionSaving(true); setSettingsError(''); setCommissionSaved(false);
                    try {
                      const saved = await adminApi.updateCommissionSettings(commissionSettings);
                      setCommissionSettings(saved);
                      setCommissionSaved(true);
                    } catch (error) {
                      setSettingsError(error instanceof Error ? error.message : 'Could not save commission settings.');
                    } finally {
                      setCommissionSaving(false);
                    }
                  }}
                  className="rounded-xl bg-[#006A4E] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {commissionSaving ? 'Saving…' : 'Save payment terms'}
                </button>

                <div>
                  <label className="block text-sm font-semibold mb-2">Allow Cash Payment at Pickup</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPoSettings(s => ({ ...s, allowCashAtPickup: !s.allowCashAtPickup }))}
                      className={`w-12 h-6 rounded-full transition-colors relative ${poSettings.allowCashAtPickup ? 'bg-[#006A4E]' : 'bg-gray-200'}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${poSettings.allowCashAtPickup ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                    <span className="text-sm">{poSettings.allowCashAtPickup ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              {/* Cancellation rules */}
              <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] space-y-5">
                <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Cancellation & Refund Rules</h3>

                <div>
                  <label className="block text-sm font-semibold mb-2">Cancellation Window (hours before pickup)</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min={1} max={48} value={poSettings.cancellationWindowHours}
                      onChange={e => setPoSettings(s => ({ ...s, cancellationWindowHours: Number(e.target.value) }))}
                      className="flex-1 accent-[#006A4E]" />
                    <div className="w-20 text-center py-2 px-3 bg-gray-50 rounded-xl font-bold border border-[var(--color-border)]">
                      {poSettings.cancellationWindowHours}h
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Advance Refund Percentage (if cancelled in window)</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min={0} max={100} step={5} value={poSettings.advanceRefundPercent}
                      onChange={e => setPoSettings(s => ({ ...s, advanceRefundPercent: Number(e.target.value) }))}
                      className="flex-1 accent-[#006A4E]" />
                    <div className="w-16 text-center py-2 px-3 bg-gray-50 rounded-xl font-bold border border-[var(--color-border)]">
                      {poSettings.advanceRefundPercent}%
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Vendor Preparation Cutoff (minutes before pickup)</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min={15} max={120} step={15} value={poSettings.vendorPreparationCutoffMinutes}
                      onChange={e => setPoSettings(s => ({ ...s, vendorPreparationCutoffMinutes: Number(e.target.value) }))}
                      className="flex-1 accent-[#006A4E]" />
                    <div className="w-20 text-center py-2 px-3 bg-gray-50 rounded-xl font-bold border border-[var(--color-border)]">
                      {poSettings.vendorPreparationCutoffMinutes}min
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle size={16} className="mt-0.5 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700">Payment and commission terms are configured above and apply to new orders only. Existing orders retain their saved terms.</p>
              </div>

              <button
                onClick={async () => {
                  setSettingsSaving(true);
                  setSettingsSaved(false);
                  setSettingsError('');
                  try {
                    const updated = await preordersApi.updateSettings(poSettings);
                    setPoSettings(updated);
                    setSettingsSaved(true);
                    setTimeout(() => setSettingsSaved(false), 2500);
                  } catch (err) {
                    setSettingsError(err instanceof Error ? err.message : 'Could not save pre-order settings.');
                  } finally {
                    setSettingsSaving(false);
                  }
                }}
                disabled={settingsSaving}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--color-primary)' }}
              >
                {settingsSaving ? 'Saving…' : settingsSaved ? 'Saved ✓' : 'Save Pre-Order Settings'}
              </button>
              {settingsError && <p role="alert" className="text-sm text-red-600">{settingsError}</p>}
            </div>
          )}

          {activeSection === 'verification' && <VerificationCenter onOpenDocuments={userId => {
            setDocumentsUserId(userId);
            setActiveSection('documents');
          }} />}
          {activeSection === 'documents' && <DocumentsSection userId={documentsUserId} onShowAll={() => setDocumentsUserId(undefined)} />}

          {activeSection === 'users' && <UsersSection currentUserId={currentUser?.id} />}
          {activeSection === 'vendors' && <VendorsSection />}
          {activeSection === 'products' && <ProductsSection />}
          {activeSection === 'orders' && <OrdersSection />}
          {activeSection === 'bookings' && <BookingsSection />}
          {activeSection === 'reviews' && <ReviewsSection />}
          {activeSection === 'events' && <EventsSection />}
          {activeSection === 'local-foods' && <LocalFoodsSection />}
          {activeSection === 'stories' && <StoriesSection />}
          {activeSection === 'reports' && <ReportsSection />}
          {activeSection === 'settings' && (
            <SiteImagesSection />
          )}
        </div>
      </div>
    </div>
  );
}
