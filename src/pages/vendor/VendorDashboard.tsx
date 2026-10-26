import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Package, DollarSign, ShoppingBag, Star, Plus, Edit, Trash2, Eye, QrCode, Clock, CheckCircle, MapPin, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { productsApi, ordersApi, preordersApi, productImagesApi, earningsApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import { preOrderStatusConfig } from '../../data/preorderData';
import Badge from '../../components/ui/Badge';
import PaymentProofFields, { emptyPaymentProof, methodLabel, validatePaymentProof, type PaymentProof } from '../../components/ui/PaymentProofFields';
import { useApp } from '../../context/AppContext';
import type { Order, PreOrder, Product } from '../../types';

type VendorDashboardProduct = Product & {
  originalPrice?: number;
  preOrderEnabled?: boolean;
  preparationTime?: string;
  pickupLocation?: string;
};

type VendorDashboardOrder = Order & {
  customerName?: string;
};

const ORDER_TRANSITIONS: Record<string, string[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
};

export default function VendorDashboard() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    ['orders', 'preorders'].includes(searchParams.get('tab') || '')
      ? searchParams.get('tab')!
      : 'products'
  );
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'orders' || tab === 'preorders') setActiveTab(tab);
  }, [searchParams]);
  const [selectedPreOrder, setSelectedPreOrder] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [scanOrderId, setScanOrderId] = useState('');
  const [scanError, setScanError] = useState('');
  const [deliveryDates, setDeliveryDates] = useState<Record<string, string>>({});

  const { data: vendorPreOrders, loading: preOrdersLoading, error: preOrdersError, refetch: refetchPreOrders } = useApiData<PreOrder[]>(
    () => (currentUser?.role === 'vendor' ? preordersApi.list() : Promise.resolve([])),
    [],
    [currentUser?.id]
  );

  async function advancePreOrder(orderId: string, status: string, extra?: Record<string, any>) {
    setUpdatingId(orderId);
    try {
      await preordersApi.update(orderId, { status, ...extra });
      await Promise.all([refetchPreOrders(), refetchProducts(), refetchEarnings()]);
    } catch (e: any) {
      alert(e?.message || 'Could not update the pre-order.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleScanVerify(order: PreOrder) {
    setScanError('');
    const code = window.prompt(`Enter/scan the QR code shown by ${order.touristName}:`, '');
    if (!code) return;
    setUpdatingId(order.id);
    try {
      await preordersApi.update(order.id, { status: 'qr_verified', qrCode: code });
      await refetchPreOrders();
    } catch (e: any) {
      setScanError(e?.message || 'QR code did not match this order.');
    } finally {
      setUpdatingId(null);
    }
  }

  // Remaining payment at pickup: the vendor records how it was paid (and, for bKash/Nagad, the
  // customer's number and TrxID) before handing the order over.
  const [collectingId, setCollectingId] = useState<string | null>(null);
  const [collectMethod, setCollectMethod] = useState<'cash' | 'bkash' | 'nagad' | 'card'>('cash');
  const [collectProof, setCollectProof] = useState<PaymentProof>(emptyPaymentProof);
  const [collectError, setCollectError] = useState('');

  function openCollect(order: PreOrder) {
    setCollectingId(order.id);
    setCollectMethod('cash');
    setCollectProof(emptyPaymentProof);
    setCollectError('');
  }

  async function handleCollectPayment(order: PreOrder) {
    const proofError = validatePaymentProof(collectMethod, collectProof);
    if (proofError) {
      setCollectError(proofError);
      return;
    }
    setUpdatingId(order.id);
    setCollectError('');
    try {
      if (order.status === 'qr_verified') {
        await preordersApi.update(order.id, { status: 'pickup_payment_pending' });
      }
      await preordersApi.update(order.id, {
        status: 'picked_up',
        pickupPaymentMethod: collectMethod,
        pickupPayerPhone: collectProof.phone,
        pickupTransactionId: collectProof.transactionId,
      });
      setCollectingId(null);
      await refetchPreOrders();
    } catch (e: any) {
      await refetchPreOrders();
      setCollectError(e?.message || 'Could not record the payment and hand over the order.');
    } finally {
      setUpdatingId(null);
    }
  }
  const [editing, setEditing] = useState<any | null>(null);   // null = closed, {} = new, {id,...} = edit
  const [form, setForm] = useState<any>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  function openForm(product?: any) {
    setFormError('');
    setEditing(product ?? {});
    setForm(product
      ? { name: product.name, description: product.description,
          price: product.originalPrice ?? product.price,
          discountPercent: product.originalPrice && product.originalPrice > product.price
            ? Math.round((1 - product.price / product.originalPrice) * 100)
            : 0,
          stock: product.stock,
          category: product.category, district: product.district ?? '', image: product.images?.[0] ?? '',
          imageFile: null as File | null,
          preOrderEnabled: Boolean(product.preOrderEnabled), preparationTime: product.preparationTime ?? '',
          pickupLocation: product.pickupLocation ?? '' }
      : { name: '', description: '', price: '', discountPercent: 0, stock: '', category: 'handicraft', district: '', image: '',
          imageFile: null as File | null,
          preOrderEnabled: false, preparationTime: '', pickupLocation: '' });
  }

  async function saveProduct() {
    const regularPrice = Number(form.price), stock = Number(form.stock);
    const discountPercent = form.preOrderEnabled ? Number(form.discountPercent) || 0 : 0;
    if (!form.name.trim() || !form.description.trim()) return setFormError('Name and description are required.');
    if (!(regularPrice > 0)) return setFormError('Price must be greater than 0.');
    if (!Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 90) return setFormError('Discount must be a whole number from 0% to 90%.');
    if (!Number.isInteger(stock) || stock < 0) return setFormError('Stock must be a whole number (0 or more).');
    if (form.preOrderEnabled && !form.preparationTime.trim()) return setFormError('Add an estimated preparation time for Ready to Pick orders.');
    if (!editing?.id && !form.imageFile) return setFormError('Upload a product photo before adding this product.');
    setSaving(true); setFormError('');
    try {
      const imageUrl = form.imageFile
        ? (await productImagesApi.upload(form.imageFile)).url
        : form.image;
      const price = discountPercent > 0 ? Math.round(regularPrice * (100 - discountPercent)) / 100 : regularPrice;
      const payload: any = { name: form.name.trim(), description: form.description.trim(), price,
        originalPrice: discountPercent > 0 ? regularPrice : null, stock,
        category: form.category, district: form.district || null, images: imageUrl ? [imageUrl] : [],
        preOrderEnabled: Boolean(form.preOrderEnabled), preparationTime: form.preparationTime || null,
        pickupLocation: form.pickupLocation || null };
      if (editing?.id) await productsApi.update(editing.id, payload);
      else await productsApi.create(payload);
      setEditing(null);
      await refetchProducts();
    } catch (e: any) {
      setFormError(e?.message || 'Could not save the product.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(p: any) {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await productsApi.remove(p.id);
      await refetchProducts();
    } catch (e: any) {
      alert(e?.message || 'Could not delete the product (it may be part of existing orders).');
    }
  }

  const { data: myProducts, loading: productsLoading, error: productsError, refetch: refetchProducts } = useApiData<VendorDashboardProduct[]>(
    () => (currentUser?.role === 'vendor' ? productsApi.list({ vendorId: currentUser.id }) : Promise.resolve([])),
    [],
    [currentUser?.id]
  );
  const { data: vendorOrders, loading: ordersLoading, error: ordersError, refetch: refetchOrders } = useApiData<VendorDashboardOrder[]>(
    () => (currentUser?.role === 'vendor' ? ordersApi.list() : Promise.resolve([])),
    [],
    [currentUser?.id]
  );
  const { data: earnings, loading: earningsLoading, error: earningsError, refetch: refetchEarnings } = useApiData(
    () => (currentUser?.role === 'vendor' ? earningsApi.me() : Promise.resolve(null)),
    null as any,
    [currentUser?.id]
  );
  useEffect(() => {
    if (currentUser?.role !== 'vendor') return;
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        refetchPreOrders();
        refetchOrders();
        refetchProducts();
        refetchEarnings();
      }
    }, 20000);
    return () => window.clearInterval(timer);
  }, [currentUser?.id, refetchPreOrders, refetchOrders, refetchProducts, refetchEarnings]);

  async function updateOrderStatus(orderId: string, status: string) {
    const payload: Record<string, string> = { status };
    if (status === 'confirmed') {
      const estimatedDelivery = deliveryDates[orderId];
      if (!estimatedDelivery) {
        alert('Choose an estimated delivery date before confirming this order.');
        return;
      }
      payload.estimatedDelivery = estimatedDelivery;
    }
    setUpdatingId(orderId);
    try {
      await ordersApi.update(orderId, payload);
      await Promise.all([refetchOrders(), refetchProducts(), refetchEarnings()]);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not update this order.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (!currentUser || currentUser.role !== 'vendor') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-[var(--color-text-muted)] mb-4">Please sign in as a vendor to access the dashboard.</p>
        <Link to="/login" className="bg-[#006A4E] text-white px-6 py-3 rounded-xl font-semibold">Sign In as Vendor</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Vendor Dashboard</h1>
            <p className="text-[var(--color-text-muted)]">Manage your products and orders</p>
          </div>
          <button onClick={() => openForm()} className="flex items-center gap-2 bg-[#006A4E] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#004D38] transition-colors">
            <Plus size={18} /> Add Product
          </button>
        </div>

        {(productsError || ordersError || preOrdersError || earningsError) && (
          <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Some dashboard information could not be loaded.</p>
            <ul className="mt-1 list-disc pl-5">
              {productsError && <li>Products: {productsError}</li>}
              {ordersError && <li>Orders: {ordersError}</li>}
              {preOrdersError && <li>Ready to Pick orders: {preOrdersError}</li>}
              {earningsError && <li>Earnings: {earningsError}</li>}
            </ul>
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => !saving && setEditing(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>{editing.id ? 'Edit Product' : 'Add Product'}</h2>
              <div className="space-y-3 text-sm">
                <input className="w-full px-3 py-2.5 rounded-xl border" placeholder="Product name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <textarea className="w-full px-3 py-2.5 rounded-xl border" rows={3} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-[var(--color-text-muted)]">Regular price (৳)
                    <input type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm" placeholder="Regular price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                  </label>
                  <input type="number" min="0" step="1" className="px-3 py-2.5 rounded-xl border" placeholder="Stock" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">Available stock is reserved when an order is placed and restored if that order is cancelled.</p>
                {form.preOrderEnabled && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <label htmlFor="ready-pick-discount" className="block text-sm font-semibold text-amber-950">Ready to Pick discount (%)</label>
                    <input id="ready-pick-discount" type="number" min="0" max="90" step="1"
                      className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5"
                      placeholder="0" value={form.discountPercent ?? 0}
                      onChange={e => setForm({ ...form, discountPercent: e.target.value })} />
                    <p className="mt-1 text-xs text-amber-900">Set a percentage off the regular price. Tourists see the discounted price and the original price when Ready to Pick is enabled.</p>
                    {Number(form.discountPercent) > 0 && Number(form.price) > 0 && (
                      <p className="mt-1 text-sm font-semibold text-green-800">
                        New price: ৳{(Math.round(Number(form.price) * (100 - Number(form.discountPercent))) / 100).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <select className="px-3 py-2.5 rounded-xl border" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {['gi-product', 'handicraft', 'clothing', 'food', 'jewelry', 'pottery', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input className="px-3 py-2.5 rounded-xl border" placeholder="District" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} />
                </div>
                <label className="block rounded-xl border-2 border-dashed p-3 text-sm">
                  <span className="font-medium">{editing?.id ? 'Replace product photo (optional)' : 'Product photo *'}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full"
                    onChange={e => setForm({ ...form, imageFile: e.target.files?.[0] || null })} />
                  <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                    {form.imageFile?.name || (form.image ? 'A product photo is already saved.' : 'JPG, PNG or WebP · maximum 5 MB')}
                  </span>
                </label>
                <label className="flex items-center gap-2 rounded-xl border p-3 font-medium">
                  <input type="checkbox" checked={form.preOrderEnabled} onChange={e => setForm({ ...form, preOrderEnabled: e.target.checked })} />
                  List as Ready to Pick for tourists planning a nearby trip
                </label>
                {form.preOrderEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <input className="px-3 py-2.5 rounded-xl border" placeholder="Preparation time (e.g. 2 hours)" value={form.preparationTime} onChange={e => setForm({ ...form, preparationTime: e.target.value })} />
                    <input className="px-3 py-2.5 rounded-xl border" placeholder="Pickup location (required for Ready to Pick)" value={form.pickupLocation} onChange={e => setForm({ ...form, pickupLocation: e.target.value })} />
                  </div>
                )}
                {form.preOrderEnabled && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Tourists can choose delivery or Ready to Pick for this product. Enter a pickup location here, or configure a default in your vendor profile.
                  </p>
                )}
                {formError && <p className="text-red-600 text-xs">{formError}</p>}
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button disabled={saving} onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border font-semibold text-sm">Cancel</button>
                <button disabled={saving} onClick={saveProduct} className="px-5 py-2 rounded-xl bg-[#006A4E] text-white font-semibold text-sm disabled:opacity-50">{saving ? 'Saving…' : 'Save Product'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Stats — computed from the vendor's real orders/products, not hardcoded */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            {
              label: 'Total Partner Earnings',
              value: earningsLoading ? '…' : `৳${Number(earnings?.totals?.totalEarning || 0).toLocaleString()}`,
              icon: DollarSign, color: '#006A4E',
            },
            { label: 'Paid via Platform', value: earningsLoading ? '…' : `৳${Number(earnings?.totals?.paidViaPlatform || 0).toLocaleString()}`, icon: DollarSign, color: '#2563EB' },
            { label: 'Cash Balance', value: earningsLoading ? '…' : `৳${Number(earnings?.totals?.collectedCash || 0).toLocaleString()}`, icon: DollarSign, color: '#7C3AED' },
            { label: 'Pending Release', value: earningsLoading ? '…' : `৳${Number(earnings?.totals?.pendingRelease || 0).toLocaleString()}`, icon: Clock, color: '#D4A017' },
            { label: 'Products', value: myProducts.length, icon: Package, color: '#D4A017' },
            { label: 'Orders', value: vendorOrders.length + vendorPreOrders.length, icon: ShoppingBag, color: '#F42A41' },
            {
              label: 'Avg Rating',
              value: myProducts.length
                ? `${(myProducts.reduce((s: number, p: any) => s + (p.rating || 0), 0) / myProducts.length).toFixed(1)} ★`
                : '— ★',
              icon: Star, color: '#006A4E',
            },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">{stat.label}</span>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] mb-8">
          <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-display)' }}>Partner Earnings Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={(earnings?.byMonth ?? []).map((item: any) => ({
              month: new Date(`${item.month}-01T00:00:00`).toLocaleString('en', { month: 'short' }),
              sales: Number(item.amount) || 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: unknown) => [`৳${Number(v).toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="sales" fill="#006A4E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--color-border)] mb-6">
          {[
            { id: 'products', label: 'Products' },
            { id: 'orders', label: 'Orders' },
            { id: 'preorders', label: '🟢 Pre-Orders', badge: vendorPreOrders.filter(o => o.status === 'confirmed' || o.status === 'advance_paid').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchParams({ tab: tab.id }, { replace: true });
              }}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-2 ${activeTab === tab.id ? 'border-[#006A4E] text-[#006A4E]' : 'border-transparent text-[var(--color-text-muted)]'}`}
            >
              {tab.label}
              {tab.badge ? <span className="text-xs bg-[#F42A41] text-white rounded-full px-1.5 py-0.5">{tab.badge}</span> : null}
            </button>
          ))}
        </div>

        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {['Product', 'Price', 'Stock', 'Rating', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {productsLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]" aria-live="polite">Loading products…</td></tr>}
                  {!productsLoading && !productsError && myProducts.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">No products yet. Add your first product to start selling.</td></tr>}
                  {myProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                          <p className="text-sm font-medium line-clamp-1 max-w-[200px]">{product.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-[#006A4E]">৳{product.price.toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <Badge variant={product.stock > 10 ? 'green' : product.stock > 0 ? 'gold' : 'red'} size="sm">
                          {product.stock > 0 ? `${product.stock} units` : 'Out of stock'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-sm">⭐ {product.rating}</td>
                      <td className="px-4 py-4">
                        <Badge variant={product.featured ? 'gold' : 'gray'} size="sm">{product.featured ? 'Featured' : 'Standard'}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button title="View" onClick={() => navigate(`/shop/${product.id}`)} className="p-1.5 text-[var(--color-text-muted)] hover:text-[#006A4E] transition-colors"><Eye size={15} /></button>
                          <button title="Edit" onClick={() => openForm(product)} className="p-1.5 text-[var(--color-text-muted)] hover:text-[#D4A017] transition-colors"><Edit size={15} /></button>
                          <button title="Delete" onClick={() => deleteProduct(product)} className="p-1.5 text-[var(--color-text-muted)] hover:text-[#F42A41] transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
          {vendorOrders.some(order => order.status === 'placed') && (
            <div className="rounded-2xl border border-[#D4A017] bg-amber-50 p-4 text-sm text-amber-900">
              {vendorOrders.filter(order => order.status === 'placed').length} new order(s) are waiting for your confirmation.
            </div>
          )}
          <div className="bg-white rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {['Order ID', 'Customer', 'Date', 'Items', 'Total', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {ordersLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]" aria-live="polite">Loading orders…</td></tr>}
                  {!ordersLoading && !ordersError && vendorOrders.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">No orders yet. New customer orders will appear here.</td></tr>}
                  {vendorOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium"><Link to={`/order-tracking?id=${encodeURIComponent(order.id)}`} className="text-[#006A4E] hover:underline">{order.id}</Link></td>
                      <td className="px-4 py-4 text-sm">{order.customerName || order.shippingAddress?.name}</td>
                      <td className="px-4 py-4 text-sm text-[var(--color-text-muted)]">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-sm">{order.items.length} items</td>
                      <td className="px-4 py-4 text-sm font-semibold text-[#006A4E]">
                        ৳{order.totalAmount.toLocaleString()}
                        <span className="mt-1 block text-xs font-normal text-[var(--color-text-muted)]">
                          {order.advancePercent ?? 20}% advance: ৳{Number(order.advanceAmount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {order.status === 'delivered' && <span className="text-xs font-semibold text-amber-700">Delivered · waiting for tourist confirmation</span>}
                          {order.status === 'completed' && <span className="text-xs font-semibold text-green-700">Delivery confirmed · advance settled</span>}
                          {order.status === 'cancelled' && <span className="text-xs font-semibold text-red-600">Cancelled · advance refunded</span>}
                          {order.status === 'placed' && (
                            <>
                              <label className="text-xs text-[var(--color-text-muted)]">
                                Estimated delivery
                                <input
                                  type="date"
                                  min={new Date().toISOString().slice(0, 10)}
                                  value={deliveryDates[order.id] || ''}
                                  onChange={event => setDeliveryDates(current => ({ ...current, [order.id]: event.target.value }))}
                                  className="ml-2 rounded-lg border px-2 py-1"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                disabled={updatingId === order.id}
                                className="rounded-lg bg-[#006A4E] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                {updatingId === order.id ? 'Confirming…' : 'Confirm order'}
                              </button>
                              <button
                                type="button"
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                disabled={updatingId === order.id}
                                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {(ORDER_TRANSITIONS[order.status] ?? []).filter(status => status !== 'cancelled').map(status => (
                            <button key={status} type="button" onClick={() => updateOrderStatus(order.id, status)}
                              disabled={updatingId === order.id}
                              className="rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize disabled:opacity-50">
                              {updatingId === order.id ? 'Updating…' : status === 'delivered' ? 'Mark delivered' : status.replace(/_/g, ' ')}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        )}

        {/* ─── PRE-ORDERS TAB ──────────────────────────────────── */}
        {activeTab === 'preorders' && (
          <div className="space-y-4">
            {/* New order notification banner */}
            {vendorPreOrders.some(o => o.status === 'confirmed' || o.status === 'advance_paid') && (
              <div className="flex items-start gap-3 p-4 rounded-2xl border-2" style={{ background: '#E6F4EF', borderColor: '#006A4E' }}>
                <Bell size={18} style={{ color: '#006A4E' }} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: '#006A4E' }}>🔔 New Pre-Order{vendorPreOrders.filter(o => o.status === 'confirmed' || o.status === 'advance_paid').length > 1 ? 's' : ''} Received</p>
                  <p className="text-xs mt-0.5" style={{ color: '#004D38' }}>A tourist is visiting your area. Review and accept their orders below.</p>
                </div>
              </div>
            )}

            {/* Today's pre-orders */}
            <div className="grid gap-4">
              {preOrdersLoading && <p className="rounded-xl bg-white p-8 text-center text-sm text-[var(--color-text-muted)]" aria-live="polite">Loading Ready to Pick orders…</p>}
              {!preOrdersLoading && !preOrdersError && vendorPreOrders.length === 0 && <p className="rounded-xl bg-white p-8 text-center text-sm text-[var(--color-text-muted)]">No Ready to Pick orders yet. Orders for your eligible products will appear here.</p>}
              {vendorPreOrders.map(order => {
                const cfg = preOrderStatusConfig[order.status];
                const isSelected = selectedPreOrder === order.id;
                return (
                  <div key={order.id} className="bg-white rounded-2xl border-2 overflow-hidden transition-all" style={{ borderColor: isSelected ? '#006A4E' : 'var(--color-border)' }}>
                    {/* Card header */}
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <img src={order.productImage} alt={order.productName} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>#{order.orderNumber}</p>
                              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{order.productName}</p>
                              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                {order.quantity} × ৳{order.unitPrice.toLocaleString()}
                              </p>
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0" style={{ background: cfg?.bg, color: cfg?.color }}>
                              {cfg?.label}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                              <Clock size={11} /> Pickup: {order.pickupTime}
                            </div>
                            <div className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                              <MapPin size={11} /> {order.destination}
                            </div>
                          </div>

                          {/* Payment summary */}
                          <div className="mt-3 flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1 text-green-700 font-semibold">
                              <CheckCircle size={12} /> Advance Paid: ৳{Number(order.advancePaid).toLocaleString()}
                            </span>
                            <span
                              style={{ color: ['picked_up', 'completed'].includes(order.status) ? '#15803D' : 'var(--color-accent)' }}
                              className="font-semibold"
                            >
                              {['picked_up', 'completed'].includes(order.status)
                                ? `Paid at Pickup: ৳${Math.max(Number(order.totalAmount) - Number(order.advancePaid), 0).toLocaleString()}`
                                : `Remaining: ৳${Number(order.remainingAmount).toLocaleString()}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {order.status === 'confirmed' || order.status === 'advance_paid' ? (
                          <>
                            <button
                              disabled={updatingId === order.id}
                              onClick={() => advancePreOrder(order.id, 'vendor_accepted')}
                              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                              style={{ background: 'var(--color-primary)' }}
                            >
                              {updatingId === order.id ? 'Accepting…' : 'Accept Order'}
                            </button>
                            <button
                              disabled={updatingId === order.id}
                              onClick={() => advancePreOrder(order.id, 'cancelled', { cancellationReason: 'Declined by vendor' })}
                              className="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-red-50 disabled:opacity-50"
                              style={{ borderColor: '#F42A41', color: '#F42A41' }}
                            >
                              Decline
                            </button>
                          </>
                        ) : order.status === 'vendor_accepted' ? (
                          <button
                            disabled={updatingId === order.id}
                            onClick={() => advancePreOrder(order.id, 'preparing')}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                            style={{ background: '#D4A017' }}
                          >
                            {updatingId === order.id ? 'Updating…' : 'Start Preparing'}
                          </button>
                        ) : order.status === 'preparing' ? (
                          <button
                            disabled={updatingId === order.id}
                            onClick={() => advancePreOrder(order.id, 'ready_for_pickup')}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                            style={{ background: '#2563EB' }}
                          >
                            {updatingId === order.id ? 'Updating…' : 'Mark as Ready ✓'}
                          </button>
                        ) : order.status === 'ready_for_pickup' ? (
                          <button
                            disabled={updatingId === order.id}
                            onClick={() => advancePreOrder(order.id, 'arrived')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                            style={{ background: '#7C3AED' }}
                          >
                            <QrCode size={15} /> Tourist Has Arrived
                          </button>
                        ) : order.status === 'arrived' ? (
                          <button
                            disabled={updatingId === order.id}
                            onClick={() => handleScanVerify(order)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                            style={{ background: '#7C3AED' }}
                          >
                            <QrCode size={15} /> Verify QR Code
                          </button>
                        ) : (order.status === 'qr_verified' || order.status === 'pickup_payment_pending') && collectingId !== order.id ? (
                          <button
                            disabled={updatingId === order.id}
                            onClick={() => openCollect(order)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                            style={{ background: '#059669' }}
                          >
                            {`Receive ৳${Number(order.remainingAmount).toLocaleString()} & Hand Over`}
                          </button>
                        ) : order.status === 'picked_up' ? (
                          <>
                            <button
                              disabled={updatingId === order.id}
                              onClick={() => advancePreOrder(order.id, 'completed')}
                              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                              style={{ background: '#059669' }}
                            >
                              Mark Completed
                            </button>
                            <span className="self-center text-xs" style={{ color: 'var(--color-text-muted)' }}>or wait for the tourist to confirm receipt</span>
                          </>
                        ) : null}
                        <button
                          onClick={() => setSelectedPreOrder(isSelected ? null : order.id)}
                          className="px-4 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                        >
                          {isSelected ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>

                      {collectingId === order.id && (
                        <div className="mt-4 space-y-3 rounded-xl border p-4" style={{ borderColor: '#059669' }}>
                          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                            Remaining payment: ৳{Number(order.remainingAmount).toLocaleString()}
                          </p>
                          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="How the customer paid">
                            {(['cash', 'bkash', 'nagad', 'card'] as const).map(m => (
                              <button key={m} type="button" role="radio" aria-checked={collectMethod === m}
                                onClick={() => { setCollectMethod(m); setCollectError(''); }}
                                className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                                style={collectMethod === m
                                  ? { borderColor: 'var(--color-primary)', background: '#E6F4EF', color: 'var(--color-primary)' }
                                  : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                                {methodLabel(m)}
                              </button>
                            ))}
                          </div>
                          <PaymentProofFields method={collectMethod} value={collectProof} onChange={setCollectProof} perspective="receiver" />
                          {collectError && <p role="alert" className="text-xs text-red-600">{collectError}</p>}
                          <div className="flex gap-2">
                            <button disabled={updatingId === order.id} onClick={() => handleCollectPayment(order)}
                              className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ background: '#059669' }}>
                              {updatingId === order.id ? 'Saving…' : 'Payment Received · Hand Over'}
                            </button>
                            <button onClick={() => setCollectingId(null)} className="rounded-xl border px-4 py-2 text-sm"
                              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expanded detail */}
                    {isSelected && (
                      <div className="border-t px-5 py-4 space-y-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
                        <h4 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Order Details</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><p className="text-xs text-[var(--color-text-muted)]">Customer</p><p className="font-medium">{order.touristName}</p></div>
                          <div><p className="text-xs text-[var(--color-text-muted)]">Phone</p><p className="font-medium">{order.touristPhone}</p></div>
                          <div><p className="text-xs text-[var(--color-text-muted)]">Pickup Date</p><p className="font-medium">{new Date(order.pickupDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                          <div><p className="text-xs text-[var(--color-text-muted)]">Pickup Time</p><p className="font-medium">{order.pickupTime}</p></div>
                          <div><p className="text-xs text-[var(--color-text-muted)]">Pickup Location</p><p className="font-medium">{order.pickupLocation}</p></div>
                          <div><p className="text-xs text-[var(--color-text-muted)]">Preparation Time</p><p className="font-medium">{order.preparationTime}</p></div>
                        </div>
                        <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                          <div className="flex justify-between text-sm mb-1"><span style={{ color: 'var(--color-text-muted)' }}>Total Amount</span><span className="font-bold">৳{order.totalAmount.toLocaleString()}</span></div>
                          <div className="flex justify-between text-sm mb-1"><span style={{ color: 'var(--color-text-muted)' }}>Advance Paid ({order.advancePercent}%)</span><span className="font-semibold text-green-700">৳{order.advancePaid.toLocaleString()} ✓</span></div>
                          <div className="flex justify-between text-sm">
                            <span style={{ color: 'var(--color-text-muted)' }}>{['picked_up', 'completed'].includes(order.status) ? 'Paid at Pickup' : `Remaining at Pickup (${100 - order.advancePercent}%)`}</span>
                            <span className="font-bold" style={{ color: ['picked_up', 'completed'].includes(order.status) ? '#15803D' : 'var(--color-accent)' }}>
                              ৳{(['picked_up', 'completed'].includes(order.status)
                                ? Math.max(Number(order.totalAmount) - Number(order.advancePaid), 0)
                                : Number(order.remainingAmount)).toLocaleString()}
                              {['picked_up', 'completed'].includes(order.status) && order.pickupPaymentMethod ? ` · ${methodLabel(order.pickupPaymentMethod)}` : ''}
                            </span>
                          </div>
                          {(order.advancePaymentMethod || order.pickupTransactionId) && (
                            <div className="mt-2 space-y-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              {order.advancePaymentMethod && (
                                <p>Advance: {methodLabel(order.advancePaymentMethod)}{order.advancePayerPhone ? ` from ${order.advancePayerPhone}` : ''}{order.advanceTransactionId ? ` · TrxID ${order.advanceTransactionId}` : ''}</p>
                              )}
                              {order.pickupTransactionId && (
                                <p>Pickup: {methodLabel(order.pickupPaymentMethod)}{order.pickupPayerPhone ? ` from ${order.pickupPayerPhone}` : ''} · TrxID {order.pickupTransactionId}</p>
                              )}
                            </div>
                          )}
                        </div>
                        {order.notes && (
                          <div className="p-3 rounded-xl bg-amber-50 text-xs" style={{ color: '#92660A' }}>
                            <strong>Customer note:</strong> {order.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Manual QR verification */}
            <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)]">
              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <QrCode size={20} style={{ color: 'var(--color-primary)' }} /> Verify a Pickup QR Code
              </h3>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                This project doesn't include a camera-based scanner — type or paste the code the tourist shows you instead.
                Find the order below once it reaches "Tourist Has Arrived" and use "Verify QR Code" on that card.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  value={scanOrderId}
                  onChange={e => setScanOrderId(e.target.value)}
                  placeholder="Order ID (e.g. po_xxxxxxxx)"
                  className="flex-1 px-4 py-2.5 rounded-xl border text-sm"
                  style={{ borderColor: 'var(--color-border)' }}
                />
                <button
                  onClick={() => {
                    const order = vendorPreOrders.find(o => o.id === scanOrderId);
                    if (!order) { setScanError('No pre-order found with that ID.'); return; }
                    if (order.status !== 'arrived') { setScanError(`This order is currently "${order.status}" — it must reach "arrived" before QR verification.`); return; }
                    handleScanVerify(order);
                  }}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors hover:opacity-90"
                  style={{ background: 'var(--color-primary)' }}
                >
                  Verify
                </button>
              </div>
              {scanError && <p className="text-xs mt-2 text-red-600">{scanError}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
