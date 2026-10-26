import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, CheckCircle, Truck, MapPin, Clock, ArrowLeft, Star } from 'lucide-react';
import { ordersApi, reviewsApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import Badge from '../../components/ui/Badge';
import StatusBadge from '../../components/ui/StatusBadge';
import { useApp } from '../../context/AppContext';
import type { Order } from '../../types';

type TrackedOrder = Order & {
  customerName?: string;
  deliveryFee?: number;
  subtotal?: number;
};

const TIMELINE = [
  { key: 'placed', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered — confirmation required', icon: CheckCircle },
  { key: 'completed', label: 'Delivery Confirmed & Advance Settled', icon: CheckCircle },
];

const STATUS_ORDER = ['placed', 'confirmed', 'preparing', 'shipped', 'out_for_delivery', 'delivered', 'completed'];

export default function OrderTracking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useApp();
  const { data: orders, loading, error, refetch } = useApiData<TrackedOrder[]>(() => ordersApi.list(), []);
  const selectedId = searchParams.get('id');
  const { data: selectedOrder, loading: selectedLoading, error: selectedError, refetch: refetchSelected } = useApiData<TrackedOrder | null>(
    () => selectedId ? ordersApi.get(selectedId) : Promise.resolve(null),
    null,
    [selectedId],
  );
  const { data: myReviews, refetch: refetchReviews } = useApiData(
    () => currentUser?.role === 'tourist' ? reviewsApi.mine() : Promise.resolve([]),
    [] as any[],
    [currentUser?.id],
  );
  const [reviewVendorId, setReviewVendorId] = React.useState<string | null>(null);
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewContent, setReviewContent] = React.useState('');
  const [reviewError, setReviewError] = React.useState('');
  const [reviewSaving, setReviewSaving] = React.useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = React.useState(false);
  const [deliveryConfirmError, setDeliveryConfirmError] = React.useState('');
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) {
        void refetch();
        if (selectedId) void refetchSelected();
      }
    }, 30000);
    return () => window.clearInterval(timer);
  }, [refetch, refetchSelected, selectedId]);
  const listedOrder = selectedId ? orders.find((item: any) => item.id === selectedId) : null;
  const selectedOrderForId = selectedOrder?.id === selectedId ? selectedOrder : null;
  const order = selectedId ? selectedOrderForId || listedOrder : orders[0];
  const pageLoading = selectedId
    ? !order && (selectedLoading || loading)
    : loading;
  const pageError = selectedId
    ? !order && !pageLoading ? selectedError || error : null
    : error;

  if (pageLoading || pageError || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <p role={pageError ? 'alert' : 'status'} className={pageError ? 'text-red-700' : 'text-[var(--color-text-muted)]'}>
            {pageLoading ? 'Loading order…' : pageError ? `Could not load this order: ${pageError}` : 'No orders found yet.'}
          </p>
          {pageError && <button onClick={() => {
            if (selectedId) void refetchSelected();
            else void refetch();
          }} className="mt-3 rounded-lg bg-[#006A4E] px-4 py-2 text-sm font-semibold text-white">Try again</button>}
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const advanceAmount = Math.round(Number(order.advanceAmount || 0) * 100) / 100;
  const platformShare = Math.round(Number(order.totalAmount) * 100 * Number(order.commissionPercent || 10) / 100) / 100;
  const vendorAdvanceShare = Math.round((advanceAmount - platformShare) * 100) / 100;


  const orderVendors = [...new Map(
    order.items
      .map((item: any) => item.product?.vendor)
      .filter((vendor: any) => vendor?.id)
      .map((vendor: any) => [vendor.id, vendor]),
  ).values()] as any[];

  async function confirmDelivery() {
    if (!order) return;

    setConfirmingDelivery(true);
    setDeliveryConfirmError('');
    try {
      await ordersApi.update(order.id, { status: 'completed' });
      await Promise.all([refetch(), refetchSelected()]);
    } catch (error) {
      setDeliveryConfirmError(error instanceof Error ? error.message : 'Could not confirm delivery.');
    } finally {
      setConfirmingDelivery(false);
    }
  }

  async function submitShopReview(vendorId: string) {
    if (!reviewContent.trim()) {
      setReviewError('Write a short review of your experience with the shop.');
      return;
    }

    setReviewSaving(true);
    setReviewError('');
    try {
      await reviewsApi.create({
        targetId: vendorId,
        targetType: 'vendor',
        rating: reviewRating,
        content: reviewContent.trim(),
      });
      await refetchReviews();
      setReviewVendorId(null);
      setReviewContent('');
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Could not submit your shop review.');
    } finally {
      setReviewSaving(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {orders.length > 1 && (
          <label className="block mb-5 text-sm font-semibold">
            Select an order
            <select value={order.id} onChange={event => setSearchParams({ id: event.target.value })}
              className="ml-3 px-3 py-2 border border-[var(--color-border)] rounded-xl bg-white">
              {orders.map((item: any) => <option key={item.id} value={item.id}>{item.id} — {item.status.replace(/_/g, ' ')}</option>)}
            </select>
          </label>
        )}
        <Link to={currentUser?.role === 'vendor' ? '/vendor' : currentUser?.role === 'admin' ? '/admin' : '/profile'} className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-6 text-sm">
          <ArrowLeft size={16} /> Back to Orders
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Order #{order.id}</h1>
              <p className="text-sm text-[var(--color-text-muted)]">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <StatusBadge status={order.status} size="md" />
          </div>
          {order.estimatedDelivery && (
            <div className="flex items-center gap-2 mt-4 text-sm text-[#006A4E]">
              <Clock size={14} />
              <span>Estimated delivery: {new Date(`${order.estimatedDelivery}T12:00:00`).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          )}
          {order.trackingNumber && (
            <p className="text-sm text-[var(--color-text-muted)] mt-1">Tracking: {order.trackingNumber}</p>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] mb-6">
          <h2 className="font-bold text-lg mb-6" style={{ fontFamily: 'var(--font-display)' }}>Order Status</h2>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {TIMELINE.map((step, i) => {
                const done = i <= currentIndex;
                const current = i === currentIndex;
                return (
                  <div key={step.key} className="flex items-start gap-4 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 ${done ? 'bg-[#006A4E] border-[#006A4E]' : 'bg-white border-gray-200'}`}>
                      <step.icon size={16} className={done ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <div className="flex-1 pb-2">
                      <p className={`font-semibold text-sm ${done ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>
                        {step.label}
                      </p>
                      {current && (
                        <p className="text-xs text-[#006A4E] mt-0.5">Current status</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {order.status === 'delivered' && order.advanceStatus === 'held' && currentUser?.role === 'tourist' && order.userId === currentUser.id && (
          <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <h2 className="font-bold text-lg text-amber-950">Please confirm you received the order</h2>
            <p className="mt-1 text-sm text-amber-900">
              Your online advance of ৳{advanceAmount.toLocaleString()} is held until you confirm delivery.
              After confirmation, ৳{platformShare.toLocaleString()} ({Number(order.commissionPercent || 10)}%) is recorded as platform commission and ৳{vendorAdvanceShare.toLocaleString()} ({Number(order.advancePercent || 20) - Number(order.commissionPercent || 10)}%) is recorded as vendor earnings.
            </p>
            <p className="mt-1 text-xs text-amber-800">The remaining ৳{(Number(order.totalAmount) - Number(order.advanceAmount || 0)).toLocaleString()} is paid in cash on delivery.</p>
            {deliveryConfirmError && <p role="alert" className="mt-3 text-sm text-red-700">{deliveryConfirmError}</p>}
            <button
              type="button"
              disabled={confirmingDelivery}
              onClick={() => {
                if (window.confirm(`Confirm that you received this order? This releases and records the ${Number(order.advancePercent || 20)}% advance split between the platform and vendor.`)) {
                  void confirmDelivery();
                }
              }}
              className="mt-4 rounded-xl bg-[#006A4E] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {confirmingDelivery ? 'Confirming…' : 'Confirm delivery'}
            </button>
          </div>
        )}
        {order.status === 'completed' && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-900">
            Delivery confirmed. The {Number(order.advancePercent || 20)}% advance has been settled: ৳{platformShare.toLocaleString()} platform commission and ৳{vendorAdvanceShare.toLocaleString()} vendor earnings.
          </div>
        )}

        {/* Items */}
        <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] mb-6">
          <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-display)' }}>Items Ordered</h2>
          <div className="space-y-4">
            {order.items.map(item => (
              <div key={item.product.id} className="flex gap-4">
                <img src={item.product.images[0]} alt={item.product.name} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Qty: {item.quantity}</p>
                  <p className="text-sm font-semibold text-[#006A4E]">৳{item.price.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--color-border)] mt-4 pt-4 flex justify-between font-bold">
            <span>Total <span className="block text-xs font-normal text-[var(--color-text-muted)]">Includes ৳{Number(order.deliveryFee || 0).toLocaleString()} delivery</span></span>
            <span className="text-[#006A4E]">৳{order.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)]">
          <h2 className="font-bold text-lg mb-4" style={{ fontFamily: 'var(--font-display)' }}>Delivery Address</h2>
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-[#006A4E] mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">{order.shippingAddress.name}</p>
              <p className="text-[var(--color-text-muted)]">{order.shippingAddress.address}</p>
              <p className="text-[var(--color-text-muted)]">{order.shippingAddress.city}, {order.shippingAddress.district}</p>
              <p className="text-[var(--color-text-muted)]">{order.shippingAddress.division} - {order.shippingAddress.postalCode}</p>
              <p className="text-[var(--color-text-muted)]">Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>

          {currentUser?.role === 'tourist' && ['delivered', 'completed'].includes(order.status) && orderVendors.length > 0 && (
            <section className="mt-6 bg-white rounded-2xl p-6 border border-[var(--color-border)]">
              <h2 className="font-bold text-lg mb-2" style={{ fontFamily: 'var(--font-display)' }}>Review the Shop</h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Your order was delivered. Share your experience to help other tourists.</p>
              <div className="space-y-4">
                {orderVendors.map((vendor: any) => {
                  const previousReview = myReviews.find(
                    (review: any) => review.targetType === 'vendor' && review.targetId === vendor.id,
                  );
                  return (
                    <div key={vendor.id} className="rounded-xl border border-[var(--color-border)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{vendor.shopName || vendor.name || 'Shop'}</h3>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {vendor.reviewCount
                              ? `★ ${Number(vendor.rating).toFixed(1)} · ${vendor.reviewCount} shop reviews`
                              : 'Be the first to review this shop'}
                          </p>
                        </div>
                        {previousReview && <span className="text-sm font-semibold text-green-700">Reviewed ✓</span>}
                        {!previousReview && reviewVendorId !== vendor.id && (
                          <button
                            onClick={() => { setReviewVendorId(vendor.id); setReviewError(''); }}
                            className="rounded-lg bg-[#006A4E] px-4 py-2 text-sm font-semibold text-white"
                          >
                            Write a Review
                          </button>
                        )}
                      </div>
                      {reviewVendorId === vendor.id && (
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center gap-1" aria-label={`Rating: ${reviewRating} out of 5`}>
                            {[1, 2, 3, 4, 5].map(rating => (
                              <button
                                key={rating}
                                type="button"
                                aria-label={`${rating} star${rating > 1 ? 's' : ''}`}
                                onClick={() => setReviewRating(rating)}
                                className="p-1"
                              >
                                <Star size={20} fill={rating <= reviewRating ? '#D4A017' : 'none'} color="#D4A017" />
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={reviewContent}
                            onChange={event => setReviewContent(event.target.value)}
                            rows={3}
                            maxLength={2000}
                            placeholder="How was the product and your experience with this shop?"
                            className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                          />
                          {reviewError && <p role="alert" className="text-sm text-red-600">{reviewError}</p>}
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setReviewVendorId(null); setReviewError(''); }} className="rounded-lg border px-4 py-2 text-sm">
                              Cancel
                            </button>
                            <button
                              disabled={reviewSaving}
                              onClick={() => void submitShopReview(vendor.id)}
                              className="rounded-lg bg-[#006A4E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              {reviewSaving ? 'Submitting…' : 'Submit Review'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
