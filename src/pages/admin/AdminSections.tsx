import React, { useEffect, useState } from 'react';
import { adminApi, productsApi, ordersApi, bookingsApi, eventsApi, storiesApi, placesApi, productImagesApi, siteContentApi, areasApi, localFoodsApi, type AreaDivision, type LocalFood, type LocalFoodType } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import Badge from '../../components/ui/Badge';
import StatusBadge from "../../components/ui/StatusBadge";
import type { HeritagePlace } from '../../types';

// ---------------------------------------------------------------------------
// Small shared pieces: every admin section loads from the API, shows
// loading / error / empty states, and runs actions through the backend.
// ---------------------------------------------------------------------------

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
        <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function State({ loading, error, empty }: { loading: boolean; error: string | null; empty: boolean }) {
  if (loading) return <p className="p-6 text-sm text-[var(--color-text-muted)]">Loading…</p>;
  if (error) return <p className="p-6 text-sm text-red-600">Couldn't load this section: {error}</p>;
  if (empty) return <p className="p-6 text-sm text-[var(--color-text-muted)]">Nothing here yet.</p>;
  return null;
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {head.map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase text-[var(--color-text-muted)] whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">{children}</tbody>
      </table>
    </div>
  );
}

const td = 'px-4 py-3 align-middle';
const fmt = (d?: string) => (d ? new Date(d.replace(' ', 'T')).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const taka = (n: number) => `৳${Number(n || 0).toLocaleString()}`;

function useAction() {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  async function run(key: string, fn: () => Promise<any>, after: () => Promise<any> | void) {
    setBusy(key); setMsg('');
    try { await fn(); await after(); }
    catch (e: any) { setMsg(e?.message || 'Action failed.'); }
    finally { setBusy(null); }
  }
  return { busy, msg, run };
}

const Msg = ({ msg }: { msg: string }) => (msg ? <p className="px-5 py-2 text-sm text-red-600 bg-red-50">{msg}</p> : null);
const btn = 'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50';

// ---------------------------------------------------------------------------
export function UsersSection({ currentUserId }: { currentUserId?: string }) {
  const [role, setRole] = useState('');
  const { data, loading, error, refetch } = useApiData(() => adminApi.users(role ? { role } : {}), [] as any[], [role]);
  const { busy, msg, run } = useAction();
  return (
    <Panel title={`Users (${data.length})`} action={
      <select value={role} onChange={e => setRole(e.target.value)} className="text-sm border rounded-lg px-2 py-1">
        <option value="">All roles</option>
        {['tourist', 'vendor', 'guide', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
      </select>}>
      <Msg msg={msg} />
      <State loading={loading} error={error} empty={!loading && !error && data.length === 0} />
      {data.length > 0 && (
        <Table head={['Name', 'Email', 'Role', 'Status', 'Joined', 'Action']}>
          {data.map((u: any) => (
            <tr key={u.id}>
              <td className={td + ' font-medium'}>{u.name}</td>
              <td className={td}>{u.email}</td>
              <td className={td}><Badge variant="gray" size="sm">{u.role}</Badge></td>
              <td className={td}><StatusBadge status={u.status} /></td>
              <td className={td}>{fmt(u.createdAt)}</td>
              <td className={td}>
                {u.role !== 'admin' && u.id !== currentUserId && (
                  <button disabled={busy === u.id} className={btn}
                    style={u.status === 'active' ? { borderColor: '#F42A41', color: '#F42A41' } : { borderColor: '#006A4E', color: '#006A4E' }}
                    onClick={() => {
                      const next = u.status === 'active' ? 'suspended' : 'active';
                      if (next === 'suspended' && !window.confirm(`Suspend ${u.name}? They will be logged out immediately.`)) return;
                      run(u.id, () => adminApi.setUserStatus(u.id, next), refetch);
                    }}>
                    {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

export function DocumentsSection({ userId, onShowAll }: { userId?: string; onShowAll?: () => void }) {
  const { data, loading, error, refetch } = useApiData(() => adminApi.documents(), [] as any[]);
  const [downloadError, setDownloadError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; fileName: string; mimeType: string } | null>(null);
  const filteredDocuments = userId ? data.filter((item: any) => item.userId === userId) : data;

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) refetch();
    }, 20000);
    return () => window.clearInterval(timer);
  }, [refetch]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  async function getDocumentBlob(item: any) {
    if (item.fileAvailable === false) {
      throw new Error('This file is missing from the server upload directory. Check HERITAGE_UPLOAD_DIR and restore the file from backup.');
    }
    return adminApi.downloadDocument(item.id);
  }

  async function downloadDocument(item: any) {
    setBusyId(item.id);
    setDownloadError('');
    try {
      const blob = await getDocumentBlob(item);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = item.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Could not download this document.');
    } finally {
      setBusyId(null);
    }
  }

  async function previewDocument(item: any) {
    setBusyId(item.id);
    setDownloadError('');
    if (preview) {
      URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
    try {
      const blob = await getDocumentBlob(item);
      setPreview({
        url: URL.createObjectURL(blob),
        fileName: item.fileName,
        mimeType: item.mimeType,
      });
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Could not open this document.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Panel title={userId ? `Submitted Documents (${filteredDocuments.length})` : `Submitted Documents (${data.length})`}>
      {downloadError && <Msg msg={downloadError} />}
      {userId && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <p className="text-sm text-[var(--color-text-muted)]">Showing files submitted by this account.</p>
          {onShowAll && <button type="button" onClick={onShowAll} className="text-xs font-semibold text-[#006A4E] hover:underline">Show all documents</button>}
        </div>
      )}
      <State loading={loading} error={error} empty={!loading && !error && filteredDocuments.length === 0} />
      {filteredDocuments.length > 0 && (
        <Table head={['Account', 'Role', 'Document', 'File', 'Submitted', 'Action']}>
          {filteredDocuments.map((item: any) => (
            <tr key={item.id}>
              <td className={td}>{item.name}<div className="text-xs text-[var(--color-text-muted)]">{item.email}</div></td>
              <td className={td}><Badge variant="gray" size="sm">{item.role}</Badge></td>
              <td className={td + ' capitalize'}>{item.documentType.replace('_', ' ')}</td>
              <td className={td}>
                {item.fileName}
                <div className="text-xs text-[var(--color-text-muted)]">{Math.ceil(item.fileSize / 1024)} KB</div>
                {item.fileAvailable === false && <div className="text-xs font-medium text-red-700">File missing on server</div>}
              </td>
              <td className={td}>{fmt(item.createdAt)}</td>
              <td className={td + ' whitespace-nowrap'}>
                <button disabled={busyId === item.id || item.fileAvailable === false}
                  onClick={() => void previewDocument(item)} className={btn}>
                  {busyId === item.id ? 'Loading…' : 'View'}
                </button>
                <button disabled={busyId === item.id || item.fileAvailable === false}
                  onClick={() => void downloadDocument(item)} className={`${btn} ml-2`}>
                  Download
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}
      {preview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
          role="dialog" aria-modal="true" aria-label={`Preview ${preview.fileName}`}
          onClick={() => setPreview(null)}>
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 border-b p-4">
              <h2 className="truncate font-semibold">{preview.fileName}</h2>
              <button type="button" onClick={() => setPreview(null)} className={btn}>Close</button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-gray-100 p-3">
              {preview.mimeType === 'application/pdf'
                ? <iframe title={preview.fileName} src={preview.url} className="h-[75vh] w-full rounded-lg bg-white" />
                : preview.mimeType.startsWith('image/')
                  ? <img src={preview.url} alt={preview.fileName} className="mx-auto max-h-[75vh] max-w-full object-contain" />
                  : <p className="p-6 text-sm text-[var(--color-text-muted)]">Preview is not available for this file type. Download the file to view it.</p>}
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

export function VendorsSection() {
  const { data, loading, error, refetch } = useApiData(() => adminApi.allVendors(), [] as any[]);
  const { busy, msg, run } = useAction();
  return (
    <Panel title={`Vendors (${data.length})`}>
      <Msg msg={msg} />
      <State loading={loading} error={error} empty={!loading && !error && data.length === 0} />
      {data.length > 0 && (
        <Table head={['Shop', 'Owner', 'Location', 'Verification', 'Action']}>
          {data.map((v: any) => (
            <tr key={v.id}>
              <td className={td + ' font-medium'}>{v.shopName}</td>
              <td className={td}>
                <div className="flex items-center gap-2">
                  {v.avatar && <img src={v.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />}
                  <div>{v.name}<div className="text-xs text-[var(--color-text-muted)]">{v.email}</div></div>
                </div>
              </td>
              <td className={td}>{v.location || '—'}</td>
              <td className={td}><Badge variant={v.verificationStatus === 'verified' ? 'green' : v.verificationStatus === 'rejected' ? 'red' : 'gold'} size="sm">{v.verificationStatus}</Badge></td>
              <td className={td + ' space-x-2 whitespace-nowrap'}>
                {v.verificationStatus !== 'verified' && <button disabled={busy === v.id} className={btn} style={{ borderColor: '#006A4E', color: '#006A4E' }} onClick={() => run(v.id, () => adminApi.verifyVendor(v.id, 'verified'), refetch)}>Verify</button>}
                {v.verificationStatus !== 'rejected' && <button disabled={busy === v.id} className={btn} style={{ borderColor: '#F42A41', color: '#F42A41' }} onClick={() => run(v.id, () => adminApi.verifyVendor(v.id, 'rejected'), refetch)}>Reject</button>}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

export function ProductsSection() {
  const { data, loading, error, refetch } = useApiData(() => productsApi.list({ limit: 200 }), [] as any, []);
  const list: any[] = Array.isArray(data) ? data : (data as any)?.items ?? [];
  const { busy, msg, run } = useAction();
  async function replaceImage(product: any, file?: File) {
    if (!file) return;
    await run(product.id, async () => {
      const { url } = await productImagesApi.upload(file);
      return adminApi.updateProductImage(product.id, { images: [url, ...(product.images ?? []).slice(1)] });
    }, refetch);
  }
  return (
    <Panel title={`Products (${list.length})`}>
      <Msg msg={msg} />
      <State loading={loading} error={error} empty={!loading && !error && list.length === 0} />
      {list.length > 0 && (
        <Table head={['Product', 'Vendor', 'Price', 'Stock', 'Rating', 'Image / Action']}>
          {list.map((p: any) => (
            <tr key={p.id}>
              <td className={td + ' font-medium max-w-[240px] truncate'}>{p.name}</td>
              <td className={td}>{p.vendor?.shopName || p.vendor?.name || '—'}</td>
              <td className={td}>{taka(p.price)}</td>
              <td className={td}>{p.stock}</td>
              <td className={td}>{p.reviewCount ? `⭐ ${p.rating} (${p.reviewCount})` : '—'}</td>
              <td className={td}>
                <label className={`${btn} inline-block cursor-pointer`} style={{ borderColor: '#006A4E', color: '#006A4E' }}>
                  {busy === p.id ? 'Uploading…' : 'Change image'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy === p.id}
                    onChange={e => { void replaceImage(p, e.target.files?.[0]); e.currentTarget.value = ''; }} />
                </label>
                <button disabled={busy === p.id} className={btn} style={{ borderColor: '#F42A41', color: '#F42A41' }}
                  onClick={() => { if (window.confirm(`Remove "${p.name}" from the marketplace?`)) run(p.id, () => productsApi.remove(p.id), refetch); }}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

type HeritagePlaceForm = {
  name: string;
  nameLocal: string;
  description: string;
  historicalBackground: string;
  significance: string;
  location: string;
  district: string;
  division: string;
  category: HeritagePlace['category'];
  lat: string;
  lng: string;
  openTime: string;
  closeTime: string;
  entryFee: string;
  bestTime: string;
  established: string;
  tags: string;
  nearbyAttractions: string;
  featured: boolean;
  imageFile: File | null;
};

const emptyHeritagePlace: HeritagePlaceForm = {
  name: '',
  nameLocal: '',
  description: '',
  historicalBackground: '',
  significance: '',
  location: '',
  district: '',
  division: '',
  category: 'monument',
  lat: '',
  lng: '',
  openTime: '',
  closeTime: '',
  entryFee: '',
  bestTime: '',
  established: '',
  tags: '',
  nearbyAttractions: '',
  featured: false,
  imageFile: null,
};

export function PlacesSection() {
  const { data, loading, error, refetch } = useApiData<HeritagePlace[]>(
    () => placesApi.list({ limit: 200 }),
    [],
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<HeritagePlaceForm>(emptyHeritagePlace);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [imageBusy, setImageBusy] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function updateField<K extends keyof HeritagePlaceForm>(key: K, value: HeritagePlaceForm[K]) {
    setForm(previous => ({ ...previous, [key]: value }));
  }

  function validatePlaceImage(file: File): string | null {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return 'Choose a JPG, PNG, or WebP image.';
    }
    if (file.size > 5 * 1024 * 1024) {
      return 'Heritage place photos must be 5 MB or smaller.';
    }
    return null;
  }

  async function replacePlaceImage(place: HeritagePlace, file?: File) {
    if (!file) return;
    const validationError = validatePlaceImage(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }
    setImageBusy(place.id);
    setImageError('');
    try {
      const { url } = await productImagesApi.upload(file);
      await placesApi.update(place.id, { images: [url, ...(place.images ?? []).slice(1)] });
      await refetch();
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Could not update the heritage place photo.');
    } finally {
      setImageBusy(null);
    }
  }

  function selectPlaceImage(file?: File) {
    if (!file) {
      updateField('imageFile', null);
      return;
    }
    const validationError = validatePlaceImage(file);
    if (validationError) {
      updateField('imageFile', null);
      setFormError(validationError);
      return;
    }
    setFormError('');
    updateField('imageFile', file);
  }

  useEffect(() => {
    if (!form.imageFile) {
      setImagePreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(form.imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [form.imageFile]);

  async function createPlace() {
    if (!form.name.trim() || !form.description.trim() || !form.location.trim()
      || !form.district.trim() || !form.division.trim()) {
      setFormError('Enter the place name, description, location, district, and division.');
      return;
    }
    if (!form.imageFile) {
      setFormError('Choose a photo for this heritage place.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const { url } = await productImagesApi.upload(form.imageFile);
      await placesApi.create({
        name: form.name.trim(),
        nameLocal: form.nameLocal.trim() || null,
        description: form.description.trim(),
        historicalBackground: form.historicalBackground.trim() || null,
        significance: form.significance.trim() || null,
        location: form.location.trim(),
        district: form.district.trim(),
        division: form.division.trim(),
        category: form.category,
        coordinates: { lat: Number(form.lat) || 0, lng: Number(form.lng) || 0 },
        visitInfo: {
          openTime: form.openTime || null,
          closeTime: form.closeTime || null,
          entryFee: form.entryFee.trim() || null,
          bestTime: form.bestTime.trim() || null,
        },
        established: form.established.trim() || null,
        featured: form.featured,
        images: [url],
        tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        nearbyAttractions: form.nearbyAttractions.split(',').map(place => place.trim()).filter(Boolean),
      });
      setForm(emptyHeritagePlace);
      setOpen(false);
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create the heritage place.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel
      title={`Heritage Places (${data.length})`}
      action={
        <button
          className={btn}
          style={{ borderColor: '#006A4E', color: '#006A4E' }}
          onClick={() => { setOpen(value => !value); setFormError(''); }}
        >
          {open ? 'Close' : '+ Add Heritage Place'}
        </button>
      }
    >
      {open && (
        <div className="p-5 border-b border-[var(--color-border)] grid sm:grid-cols-2 gap-3 text-sm">
          <input className="border rounded-xl px-3 py-2" placeholder="Place name *" value={form.name} onChange={e => updateField('name', e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="Local name" value={form.nameLocal} onChange={e => updateField('nameLocal', e.target.value)} />
          <textarea className="border rounded-xl px-3 py-2 sm:col-span-2" rows={3} placeholder="Description *" value={form.description} onChange={e => updateField('description', e.target.value)} />
          <textarea className="border rounded-xl px-3 py-2" rows={2} placeholder="Historical background" value={form.historicalBackground} onChange={e => updateField('historicalBackground', e.target.value)} />
          <textarea className="border rounded-xl px-3 py-2" rows={2} placeholder="Cultural or historical significance" value={form.significance} onChange={e => updateField('significance', e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="Location *" value={form.location} onChange={e => updateField('location', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="min-w-0 border rounded-xl px-3 py-2" placeholder="District *" value={form.district} onChange={e => updateField('district', e.target.value)} />
            <input className="min-w-0 border rounded-xl px-3 py-2" placeholder="Division *" value={form.division} onChange={e => updateField('division', e.target.value)} />
          </div>
          <select className="border rounded-xl px-3 py-2 capitalize" value={form.category} onChange={e => updateField('category', e.target.value as HeritagePlace['category'])}>
            {['mosque', 'fort', 'palace', 'temple', 'monument', 'archaeological', 'natural', 'museum'].map(category => <option key={category} value={category}>{category}</option>)}
          </select>
          <input className="border rounded-xl px-3 py-2" placeholder="Established (e.g. 17th century)" value={form.established} onChange={e => updateField('established', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" step="any" className="min-w-0 border rounded-xl px-3 py-2" placeholder="Latitude (optional)" value={form.lat} onChange={e => updateField('lat', e.target.value)} />
            <input type="number" step="any" className="min-w-0 border rounded-xl px-3 py-2" placeholder="Longitude (optional)" value={form.lng} onChange={e => updateField('lng', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="time" aria-label="Opening time" className="min-w-0 border rounded-xl px-3 py-2" value={form.openTime} onChange={e => updateField('openTime', e.target.value)} />
            <input type="time" aria-label="Closing time" className="min-w-0 border rounded-xl px-3 py-2" value={form.closeTime} onChange={e => updateField('closeTime', e.target.value)} />
          </div>
          <input className="border rounded-xl px-3 py-2" placeholder="Entry fee" value={form.entryFee} onChange={e => updateField('entryFee', e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="Best time to visit" value={form.bestTime} onChange={e => updateField('bestTime', e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="Tags (comma separated)" value={form.tags} onChange={e => updateField('tags', e.target.value)} />
          <input className="border rounded-xl px-3 py-2" placeholder="Nearby attractions (comma separated)" value={form.nearbyAttractions} onChange={e => updateField('nearbyAttractions', e.target.value)} />
          <label className="sm:col-span-2 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-3">
            {imagePreview
              ? <img src={imagePreview} alt="Selected heritage place preview" className="h-16 w-16 rounded-lg object-cover" />
              : <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 text-2xl text-[var(--color-text-muted)]" aria-hidden="true">+</span>}
            <span className="min-w-0">
              <span className="block font-medium">Choose heritage place photo *</span>
              <span className="mt-1 block truncate text-xs text-[var(--color-text-muted)]">{form.imageFile?.name || 'JPG, PNG or WebP · maximum 5 MB'}</span>
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose heritage place photo"
              onChange={e => { selectPlaceImage(e.target.files?.[0]); e.currentTarget.value = ''; }} />
          </label>
          <label className="sm:col-span-2 flex items-center gap-2 rounded-xl border p-3 font-medium">
            <input type="checkbox" checked={form.featured} onChange={e => updateField('featured', e.target.checked)} />
            Feature this place on the site
          </label>
          {formError && <p className="sm:col-span-2 text-red-600 text-xs">{formError}</p>}
          <button disabled={saving} onClick={createPlace} className="sm:col-span-2 py-2 rounded-xl bg-[#006A4E] text-white font-semibold disabled:opacity-50">
            {saving ? 'Uploading and saving…' : 'Save Heritage Place'}
          </button>
        </div>
      )}
      <State loading={loading} error={error} empty={!loading && !error && data.length === 0} />
      {imageError && <p role="alert" className="p-3 text-sm text-red-700">{imageError}</p>}
      {data.length > 0 && (
        <Table head={['Place', 'Location', 'Category', 'Rating', 'Reviews', 'Photo']}>
          {data.map(place => (
            <tr key={place.id}>
              <td className={td + ' font-medium'}>
                <div className="flex items-center gap-3">
                  {place.images?.[0] && <img src={place.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                  <span>{place.name}</span>
                </div>
              </td>
              <td className={td}>{place.district}, {place.division}</td>
              <td className={td}><Badge variant="green" size="sm">{place.category}</Badge></td>
              <td className={td}>{place.rating ? `★ ${place.rating}` : '—'}</td>
              <td className={td}>{place.reviewCount}</td>
              <td className={td}>
                <label className={`${btn} inline-block cursor-pointer`} style={{ borderColor: '#006A4E', color: '#006A4E' }}>
                  {imageBusy === place.id ? 'Uploading…' : 'Change photo'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={imageBusy === place.id}
                    onChange={e => { void replacePlaceImage(place, e.target.files?.[0]); e.currentTarget.value = ''; }} />
                </label>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

export function OrdersSection() {
  const { data, loading, error, refetch } = useApiData(() => ordersApi.list(), [] as any[]);
  const { busy, msg, run } = useAction();
  const [deliveryDates, setDeliveryDates] = useState<Record<string, string>>({});
  const transitions: Record<string, string[]> = {
    placed: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['shipped'],
    shipped: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
  };
  const updateOrder = (orderId: string, status: string) => {
    const payload: Record<string, string> = { status };
    if (status === 'confirmed') {
      if (!deliveryDates[orderId]) {
        window.alert('Set an estimated delivery date before confirming this order.');
        return;
      }
      payload.estimatedDelivery = deliveryDates[orderId];
    }
    run(orderId, () => ordersApi.update(orderId, payload), refetch);
  };
  return (
    <Panel title={`Orders (${data.length})`}>
      <Msg msg={msg} />
      <State loading={loading} error={error} empty={!loading && !error && data.length === 0} />
      {data.length > 0 && (
        <Table head={['Order', 'Customer', 'Vendor / Products', 'Total / Delivery', 'Placed', 'Delivery Date', 'Status']}>
          {data.map((o: any) => (
            <tr key={o.id}>
              <td className={td + ' font-mono text-xs'}>{o.id}</td>
              <td className={td}>{o.customerName || o.shippingAddress?.name || o.userId}</td>
              <td className={td}>
                <div className="space-y-1">
                  {(o.items ?? []).map((item: any, index: number) => (
                    <p key={`${item.product?.id ?? 'item'}-${index}`} className="text-xs">
                      {item.product?.vendor?.shopName || item.product?.vendor?.name || 'Vendor'} — {item.product?.name || 'Product'}
                      {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                    </p>
                  ))}
                </div>
              </td>
              <td className={td + ' font-semibold'}>
                {taka(o.totalAmount)}
                <p className="text-xs font-normal text-[var(--color-text-muted)]">Includes {taka(o.deliveryFee ?? 0)} delivery</p>
              </td>
              <td className={td}>{fmt(o.createdAt)}</td>
              <td className={td}>{o.estimatedDelivery ? fmt(o.estimatedDelivery) : 'Awaiting vendor confirmation'}</td>
              <td className={td}>
                <div className="space-y-1">
                  <Badge variant={o.status === 'completed' ? 'green' : o.status === 'cancelled' ? 'red' : 'gold'} size="sm">
                    {o.status === 'delivered' ? 'delivered · awaiting tourist confirmation' : o.status.replace(/_/g, ' ')}
                  </Badge>
                  {transitions[o.status]?.length ? (
                    <>
                      {o.status === 'placed' && (
                        <input type="date" min={new Date().toISOString().slice(0, 10)}
                          value={deliveryDates[o.id] || ''}
                          onChange={e => setDeliveryDates(current => ({ ...current, [o.id]: e.target.value }))}
                          className="block max-w-[150px] text-xs border rounded-lg px-2 py-1" />
                      )}
                      <select disabled={busy === o.id} value="" className="text-xs border rounded-lg px-2 py-1"
                        onChange={e => { if (e.target.value) updateOrder(o.id, e.target.value); }}>
                        <option value="">Update status…</option>
                        {transitions[o.status].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

export function BookingsSection() {
  const { data, loading, error, refetch } = useApiData(() => bookingsApi.list(), [] as any[]);
  const { busy, msg, run } = useAction();
  return (
    <Panel title={`Guide Bookings (${data.length})`}>
      <Msg msg={msg} />
      <State loading={loading} error={error} empty={!loading && !error && data.length === 0} />
      {data.length > 0 && (
        <Table head={['Tourist', 'Guide', 'Tour', 'Dates', 'Price', 'Status', 'Action']}>
          {data.map((b: any) => (
            <tr key={b.id}>
              <td className={td}>{b.touristName || b.touristId}</td>
              <td className={td}>{b.guideName || b.guideId}</td>
              <td className={td}>{b.tourType}</td>
              <td className={td + ' whitespace-nowrap'}>{fmt(b.startDate)}{b.endDate !== b.startDate ? ` – ${fmt(b.endDate)}` : ''}</td>
              <td className={td}>{taka(b.totalPrice)}</td>
              <td className={td}><StatusBadge status={b.status} /></td>
              <td className={td}>
                {['pending', 'accepted'].includes(b.status) && (
                  <button disabled={busy === b.id} className={btn} style={{ borderColor: '#F42A41', color: '#F42A41' }}
                    onClick={() => { if (window.confirm('Cancel this booking?')) run(b.id, () => bookingsApi.update(b.id, 'cancelled'), refetch); }}>
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

export function ReviewsSection() {
  const { data, loading, error, refetch } = useApiData(() => adminApi.reviews(), [] as any[]);
  const { busy, msg, run } = useAction();
  return (
    <Panel title={`Reviews (${data.length})`}>
      <Msg msg={msg} />
      <State loading={loading} error={error} empty={!loading && !error && data.length === 0} />
      {data.length > 0 && (
        <Table head={['Reviewer', 'On', 'Rating', 'Review', 'Date', 'Action']}>
          {data.map((r: any) => (
            <tr key={r.id}>
              <td className={td + ' font-medium'}>{r.userName}</td>
              <td className={td}>{r.targetType}<div className="text-xs font-mono text-[var(--color-text-muted)]">{r.targetId}</div></td>
              <td className={td}>{'★'.repeat(r.rating)}</td>
              <td className={td + ' max-w-[320px]'}><span className="line-clamp-2">{r.title ? `${r.title} — ` : ''}{r.content}</span></td>
              <td className={td}>{fmt(r.createdAt)}</td>
              <td className={td}>
                <button disabled={busy === r.id} className={btn} style={{ borderColor: '#F42A41', color: '#F42A41' }}
                  onClick={() => { if (window.confirm('Delete this review? The average rating will be recalculated.')) run(r.id, () => adminApi.deleteReview(r.id), refetch); }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

export function EventsSection() {
  const { data, loading, error, refetch } = useApiData(() => eventsApi.list(), [] as any[]);
  const { busy, msg, run } = useAction();
  const [open, setOpen] = useState(false);
  const blank = { name: '', category: 'cultural', location: '', district: '', startDate: '', endDate: '', imageFile: null as File | null, description: '' };
  const [f, setF] = useState<any>(blank);
  const [err, setErr] = useState('');
  async function save() {
    if (!f.name || !f.location || !f.district || !f.startDate || !f.endDate || !f.imageFile) return setErr('Please fill in name, location, district, dates and choose a photo.');
    if (f.endDate < f.startDate) return setErr('End date cannot be before start date.');
    setErr('');
    await run('new', async () => {
      const { url } = await productImagesApi.upload(f.imageFile);
      return adminApi.createEvent({
        name: f.name, category: f.category, location: f.location, district: f.district,
        description: f.description, image: url,
        startDate: f.startDate.replace('T', ' ') + ':00',
        endDate: f.endDate.replace('T', ' ') + ':00',
      });
    },
      async () => { setOpen(false); setF(blank); await refetch(); });
  }
  return (
    <Panel title={`Events (${data.length})`} action={<button className={btn} style={{ borderColor: '#006A4E', color: '#006A4E' }} onClick={() => setOpen(!open)}>{open ? 'Close' : '+ New Event'}</button>}>
      <Msg msg={msg} />
      {open && (
        <div className="p-5 border-b border-[var(--color-border)] grid sm:grid-cols-2 gap-3 text-sm">
          <input className="border rounded-xl px-3 py-2" placeholder="Event name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <select className="border rounded-xl px-3 py-2" value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
            {['cultural', 'food', 'market', 'heritage', 'festival', 'religious'].map(c => <option key={c}>{c}</option>)}
          </select>
          <input className="border rounded-xl px-3 py-2" placeholder="Location" value={f.location} onChange={e => setF({ ...f, location: e.target.value })} />
          <input className="border rounded-xl px-3 py-2" placeholder="District" value={f.district} onChange={e => setF({ ...f, district: e.target.value })} />
          <input type="datetime-local" className="border rounded-xl px-3 py-2" value={f.startDate} onChange={e => setF({ ...f, startDate: e.target.value })} />
          <input type="datetime-local" className="border rounded-xl px-3 py-2" value={f.endDate} onChange={e => setF({ ...f, endDate: e.target.value })} />
          <label className="sm:col-span-2 rounded-xl border-2 border-dashed p-3">
            <span className="font-medium">Event photo *</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full" onChange={e => setF({ ...f, imageFile: e.target.files?.[0] || null })} />
            <span className="mt-1 block text-xs text-[var(--color-text-muted)]">{f.imageFile?.name || 'JPG, PNG or WebP · maximum 5 MB'}</span>
          </label>
          <textarea className="border rounded-xl px-3 py-2 sm:col-span-2" rows={2} placeholder="Description" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
          {err && <p className="text-red-600 text-xs sm:col-span-2">{err}</p>}
          <button disabled={busy === 'new'} onClick={save} className="sm:col-span-2 py-2 rounded-xl bg-[#006A4E] text-white font-semibold disabled:opacity-50">{busy === 'new' ? 'Saving…' : 'Create Event'}</button>
        </div>
      )}
      <State loading={loading} error={error} empty={!loading && !error && data.length === 0} />
      {data.length > 0 && (
        <Table head={['Event', 'Category', 'Where', 'When', 'Photo / Action']}>
          {data.map((e: any) => (
            <tr key={e.id}>
              <td className={td + ' font-medium'}>{e.name}</td>
              <td className={td}><Badge variant="gray" size="sm">{e.category}</Badge></td>
              <td className={td}>{e.location}, {e.district}</td>
              <td className={td + ' whitespace-nowrap'}>{fmt(e.startDate)}</td>
              <td className={td}>
                <label className={`${btn} inline-block cursor-pointer`} style={{ borderColor: '#006A4E', color: '#006A4E' }}>
                  Change photo
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy === e.id}
                    onChange={event => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (file) void run(e.id, async () => {
                        const { url } = await productImagesApi.upload(file);
                        return eventsApi.updateImage(e.id, url);
                      }, refetch);
                    }} />
                </label>
                <button disabled={busy === e.id} className={btn} style={{ borderColor: '#F42A41', color: '#F42A41' }}
                  onClick={() => { if (window.confirm(`Delete "${e.name}"?`)) run(e.id, () => adminApi.deleteEvent(e.id), refetch); }}>Delete</button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

const FOOD_TYPES: LocalFoodType[] = ['dish', 'sweet', 'snack', 'drink', 'fruit', 'ingredient'];

export function LocalFoodsSection() {
  const { data: divisions } = useApiData(() => areasApi.list(), [] as AreaDivision[]);
  const [division, setDivision] = useState('');
  const { data, loading, error, refetch } = useApiData(
    () => localFoodsApi.list(division ? { area: division } : undefined, { limit: '200' }),
    [] as LocalFood[],
    [division],
  );
  const { busy, msg, run } = useAction();
  const [open, setOpen] = useState(false);
  const blank = { name: '', nameLocal: '', district: '', type: 'dish' as LocalFoodType, whereToTry: '', description: '', featured: false, imageFile: null as File | null };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');

  async function save() {
    if (!f.name.trim() || !f.district || !f.description.trim()) return setErr('Please fill in name, district and description.');
    setErr('');
    await run('new', async () => {
      const image = f.imageFile ? (await productImagesApi.upload(f.imageFile)).url : undefined;
      return localFoodsApi.create({
        name: f.name, nameLocal: f.nameLocal, district: f.district, type: f.type,
        whereToTry: f.whereToTry, description: f.description, featured: f.featured, image,
      });
    }, async () => { setOpen(false); setF(blank); await refetch(); });
  }

  return (
    <Panel title={`Traditional Foods (${data.length})`} action={
      <div className="flex items-center gap-2">
        <select aria-label="Filter by division" className="border rounded-lg px-2 py-1 text-xs" value={division} onChange={e => setDivision(e.target.value)}>
          <option value="">All divisions</option>
          {divisions.map(d => <option key={d.division}>{d.division}</option>)}
        </select>
        <button className={btn} style={{ borderColor: '#006A4E', color: '#006A4E' }} onClick={() => setOpen(!open)}>{open ? 'Close' : '+ New Food'}</button>
      </div>
    }>
      <Msg msg={msg} />
      {open && (
        <div className="p-5 border-b border-[var(--color-border)] grid sm:grid-cols-2 gap-3 text-sm">
          <input className="border rounded-xl px-3 py-2" placeholder="Name (English) *" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <input className="border rounded-xl px-3 py-2" placeholder="Name (Bangla)" lang="bn" value={f.nameLocal} onChange={e => setF({ ...f, nameLocal: e.target.value })} />
          <select className="border rounded-xl px-3 py-2" value={f.district} onChange={e => setF({ ...f, district: e.target.value })} aria-label="District">
            <option value="">District *</option>
            {divisions.map(d => (
              <optgroup key={d.division} label={d.division}>
                {d.districts.map(x => <option key={x}>{x}</option>)}
              </optgroup>
            ))}
          </select>
          <select className="border rounded-xl px-3 py-2" value={f.type} onChange={e => setF({ ...f, type: e.target.value as LocalFoodType })} aria-label="Food type">
            {FOOD_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <input className="border rounded-xl px-3 py-2 sm:col-span-2" placeholder="Where to try it" value={f.whereToTry} onChange={e => setF({ ...f, whereToTry: e.target.value })} />
          <textarea className="border rounded-xl px-3 py-2 sm:col-span-2" rows={2} placeholder="Description *" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
          <label className="rounded-xl border-2 border-dashed p-3">
            <span className="font-medium">Photo (optional)</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full" onChange={e => setF({ ...f, imageFile: e.target.files?.[0] || null })} />
          </label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.featured} onChange={e => setF({ ...f, featured: e.target.checked })} /> Featured (shown first)</label>
          {err && <p className="text-red-600 text-xs sm:col-span-2">{err}</p>}
          <button disabled={busy === 'new'} onClick={save} className="sm:col-span-2 py-2 rounded-xl bg-[#006A4E] text-white font-semibold disabled:opacity-50">{busy === 'new' ? 'Saving…' : 'Add Food'}</button>
        </div>
      )}
      <State loading={loading} error={error} empty={!loading && !error && data.length === 0} />
      {data.length > 0 && (
        <Table head={['Food', 'Type', 'Area', 'Featured', 'Actions']}>
          {data.map(food => (
            <tr key={food.id}>
              <td className={td}>
                <p className="font-medium">{food.name}</p>
                {food.nameLocal && <p className="text-xs text-[var(--color-text-muted)]" lang="bn">{food.nameLocal}</p>}
              </td>
              <td className={td}><Badge variant="gray" size="sm">{food.type}</Badge></td>
              <td className={td + ' whitespace-nowrap'}>{food.district}, {food.division}</td>
              <td className={td}>
                <button disabled={busy === food.id} className={btn} aria-pressed={food.featured}
                  style={food.featured ? { borderColor: '#D4A017', color: '#8a6a0a' } : { borderColor: 'var(--color-border)' }}
                  onClick={() => run(food.id, () => localFoodsApi.update(food.id, { featured: !food.featured }), refetch)}>
                  {food.featured ? '★ Featured' : '☆ Feature'}
                </button>
              </td>
              <td className={td + ' whitespace-nowrap'}>
                <label className={`${btn} inline-block cursor-pointer mr-1`} style={{ borderColor: '#006A4E', color: '#006A4E' }}>
                  {food.image ? 'Change photo' : 'Add photo'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy === food.id}
                    onChange={event => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (file) void run(food.id, async () => {
                        const { url } = await productImagesApi.upload(file);
                        return localFoodsApi.update(food.id, { image: url });
                      }, refetch);
                    }} />
                </label>
                <button disabled={busy === food.id} className={btn} style={{ borderColor: '#F42A41', color: '#F42A41' }}
                  onClick={() => { if (window.confirm(`Delete "${food.name}"?`)) run(food.id, () => localFoodsApi.remove(food.id), refetch); }}>Delete</button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

export function StoriesSection() {
  const { data, loading, error, refetch } = useApiData(() => storiesApi.list(), [] as any[]);
  const { busy, msg, run } = useAction();
  const [open, setOpen] = useState(false);
  const blank = { title: '', category: 'heritage', imageFile: null as File | null, excerpt: '', content: '' };
  const [f, setF] = useState<any>(blank);
  const [err, setErr] = useState('');
  async function save() {
    if (!f.title.trim() || !f.content.trim() || !f.imageFile) return setErr('Title, content and a story photo are required.');
    setErr('');
    await run('new', async () => {
      const { url } = await productImagesApi.upload(f.imageFile);
      return adminApi.createStory({
        title: f.title, category: f.category, excerpt: f.excerpt, content: f.content, image: url,
      });
    }, async () => { setOpen(false); setF(blank); await refetch(); });
  }
  return (
    <Panel title={`Stories (${data.length})`} action={<button className={btn} style={{ borderColor: '#006A4E', color: '#006A4E' }} onClick={() => setOpen(!open)}>{open ? 'Close' : '+ New Story'}</button>}>
      <Msg msg={msg} />
      {open && (
        <div className="p-5 border-b border-[var(--color-border)] grid gap-3 text-sm">
          <input className="border rounded-xl px-3 py-2" placeholder="Title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
          <div className="grid sm:grid-cols-2 gap-3">
            <select className="border rounded-xl px-3 py-2" value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
              {['heritage', 'food', 'culture', 'travel', 'festival', 'artisan'].map(c => <option key={c}>{c}</option>)}
            </select>
            <label className="rounded-xl border-2 border-dashed p-3">
              <span className="font-medium">Story photo *</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full" onChange={e => setF({ ...f, imageFile: e.target.files?.[0] || null })} />
              <span className="mt-1 block text-xs text-[var(--color-text-muted)]">{f.imageFile?.name || 'JPG, PNG or WebP · maximum 5 MB'}</span>
            </label>
          </div>
          <input className="border rounded-xl px-3 py-2" placeholder="Short excerpt" value={f.excerpt} onChange={e => setF({ ...f, excerpt: e.target.value })} />
          <textarea className="border rounded-xl px-3 py-2" rows={5} placeholder="Story content" value={f.content} onChange={e => setF({ ...f, content: e.target.value })} />
          {err && <p className="text-red-600 text-xs">{err}</p>}
          <button disabled={busy === 'new'} onClick={save} className="py-2 rounded-xl bg-[#006A4E] text-white font-semibold disabled:opacity-50">{busy === 'new' ? 'Publishing…' : 'Publish Story'}</button>
        </div>
      )}
      <State loading={loading} error={error} empty={!loading && !error && data.length === 0} />
      {data.length > 0 && (
        <Table head={['Title', 'Category', 'Author', 'Published', 'Photo / Action']}>
          {data.map((s: any) => (
            <tr key={s.id}>
              <td className={td + ' font-medium max-w-[300px] truncate'}>{s.title}</td>
              <td className={td}><Badge variant="gray" size="sm">{s.category}</Badge></td>
              <td className={td}>{s.author?.name}</td>
              <td className={td}>{fmt(s.publishedAt)}</td>
              <td className={td}>
                <label className={`${btn} inline-block cursor-pointer`} style={{ borderColor: '#006A4E', color: '#006A4E' }}>
                  Change photo
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy === s.id}
                    onChange={event => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (file) void run(s.id, async () => {
                        const { url } = await productImagesApi.upload(file);
                        return storiesApi.updateImage(s.id, url);
                      }, refetch);
                    }} />
                </label>
                <button disabled={busy === s.id} className={btn} style={{ borderColor: '#F42A41', color: '#F42A41' }}
                  onClick={() => { if (window.confirm(`Delete "${s.title}"?`)) run(s.id, () => adminApi.deleteStory(s.id), refetch); }}>Delete</button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

export function ReportsSection() {
  const { data: s, loading, error } = useApiData(() => adminApi.stats(), null as any);
  const rows: [string, any][] = s ? [
    ['Total users', s.totalUsers], ['Tourists', s.totalTourists], ['Vendors', s.totalVendors], ['Guides', s.totalGuides],
    ['Guides awaiting verification', s.pendingGuides], ['Vendors awaiting verification', s.pendingVendors],
    ['Heritage places', s.totalPlaces], ['Products', s.totalProducts], ['Marketplace orders', s.totalOrders],
    ['Guide bookings', s.totalBookings], ['Ready-When-You-Arrive pre-orders', s.totalPreorders], ['Revenue this month', taka(s.revenueThisMonth)],
  ] : [];
  return (
    <Panel title="Platform Report (live from the database)">
      <State loading={loading} error={error} empty={false} />
      {rows.length > 0 && <Table head={['Metric', 'Value']}>{rows.map(([k, v]) => <tr key={k}><td className={td}>{k}</td><td className={td + ' font-semibold'}>{v}</td></tr>)}</Table>}
    </Panel>
  );
}

export function SiteImagesSection() {
  const { data, loading, error, refetch } = useApiData(
    () => siteContentApi.homepageImages(),
    {
      heroImage: '',
      mapImage: '',
      testimonialAvatar1: '',
      testimonialAvatar2: '',
      testimonialAvatar3: '',
    },
  );
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [previews, setPreviews] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const next: Record<string, string> = {};
    Object.entries(files).forEach(([key, file]) => {
      if (file) next[key] = URL.createObjectURL(file);
    });
    setPreviews(next);
    return () => Object.values(next).forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  async function save() {
    if (!Object.values(files).some(Boolean)) {
      setActionError('Choose at least one image to update.');
      return;
    }
    setSaving(true);
    setActionError('');
    setMessage('');
    try {
      const updates: Record<string, string> = {};
      for (const [key, file] of Object.entries(files)) {
        if (file) updates[key] = (await productImagesApi.upload(file)).url;
      }
      await adminApi.updateHomepageImages(updates);
      setFiles({});
      setMessage('Homepage images saved.');
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save the homepage images.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Homepage images">
      <div className="p-5 space-y-5">
        <State loading={loading} error={error} empty={false} />
        <p className="text-sm text-[var(--color-text-muted)]">Upload JPG, PNG or WebP images up to 5 MB. Changes are saved to the site and appear on the homepage.</p>
        {([
          ['heroImage', 'Homepage hero'],
          ['mapImage', 'Homepage map preview'],
          ['testimonialAvatar1', 'Traveler testimonial 1'],
          ['testimonialAvatar2', 'Traveler testimonial 2'],
          ['testimonialAvatar3', 'Traveler testimonial 3'],
        ] as const).map(([key, label]) => (
          <div key={key} className="grid sm:grid-cols-[160px_1fr] gap-4 items-center rounded-xl border border-[var(--color-border)] p-4">
            <img src={previews[key] || data?.[key]} alt={`${label} preview`} className="h-24 w-full rounded-lg object-cover bg-gray-100" />
            <label className="text-sm font-semibold">
              {label}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full font-normal"
                onChange={e => setFiles(current => ({ ...current, [key]: e.target.files?.[0] }))} />
            </label>
          </div>
        ))}
        {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}
        {message && <p role="status" className="text-sm text-green-700">{message}</p>}
        <button type="button" disabled={saving || loading} onClick={save}
          className="rounded-xl bg-[#006A4E] px-5 py-2.5 font-semibold text-white disabled:opacity-50">
          {saving ? 'Uploading and saving…' : 'Save homepage images'}
        </button>
      </div>
    </Panel>
  );
}
