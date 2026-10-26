import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Clock, QrCode, Phone, CheckCircle, Circle, Loader, AlertCircle, ArrowRight } from 'lucide-react';
import { preordersApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import { preOrderStatusConfig } from '../../data/preorderData';
import { methodLabel } from '../../components/ui/PaymentProofFields';
import type { PreOrder, PreOrderStatus } from '../../types';

const TIMELINE_STEPS: { key: PreOrderStatus; label: string; desc: string }[] = [
  { key: 'confirmed',              label: 'Pre-order Confirmed',      desc: 'Your pre-order has been placed successfully.' },
  { key: 'advance_paid',           label: 'Advance Payment Received', desc: 'Your advance payment has been confirmed.' },
  { key: 'vendor_accepted',        label: 'Vendor Accepted',          desc: 'The vendor has accepted your order.' },
  { key: 'preparing',              label: 'Preparing Your Order',     desc: 'The vendor is now preparing your product.' },
  { key: 'ready_for_pickup',       label: 'Ready for Pickup!',        desc: 'Your order is ready. Head to the pickup location.' },
  { key: 'arrived',                label: 'Arrived at Location',      desc: 'Tourist has arrived at the vendor location.' },
  { key: 'qr_verified',            label: 'QR Code Verified',         desc: 'Pickup code has been verified by the vendor.' },
  { key: 'pickup_payment_pending', label: 'Remaining Payment',        desc: 'Pay the remaining balance to collect your order.' },
  { key: 'picked_up',              label: 'Order Picked Up',          desc: 'Product has been handed over.' },
  { key: 'completed',              label: 'Completed',                desc: 'Thank you! Enjoy your purchase.' },
];

export default function PreOrderTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { data: order, loading, error, refetch } = useApiData<PreOrder | null>(
    () => orderId ? preordersApi.get(orderId) : Promise.resolve(null),
    null,
    [orderId],
  );
  const [cancelling, setCancelling] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState('');

  async function handleConfirmReceipt() {
    if (!order) return;
    setConfirmingReceipt(true);
    setReceiptError('');
    try {
      await preordersApi.update(order.id, { status: 'completed' });
      await refetch();
    } catch (e: any) {
      setReceiptError(e?.message || 'Could not confirm receipt. Please try again.');
    } finally {
      setConfirmingReceipt(false);
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) void refetch();
    }, 10000);
    return () => window.clearInterval(timer);
  }, [refetch]);

  async function handleCancel() {
    if (!order) return;
    const reason = window.prompt('Why are you cancelling this pre-order?', 'Change of plans');
    if (!reason) return;
    setCancelling(true);
    try {
      await preordersApi.update(order.id, { status: 'cancelled', cancellationReason: reason });
      await refetch();
    } catch (e: any) {
      alert(e?.message || 'Could not cancel the pre-order.');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p role="status" className="text-[var(--color-text-muted)]">Loading order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <p role={error ? 'alert' : 'status'} className={error ? 'text-red-700' : 'text-[var(--color-text-muted)]'}>
            {error ? `Could not load this pre-order: ${error}` : 'Pre-order not found.'}
          </p>
          {error && (
            <button onClick={() => void refetch()} className="mt-3 rounded-lg bg-[#006A4E] px-4 py-2 text-sm font-semibold text-white">
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  const currentConfig = preOrderStatusConfig[order.status as PreOrderStatus];
  const currentStep = currentConfig?.step ?? 0;
  const finalPaymentRecorded = ['picked_up', 'completed'].includes(order.status)
    && Number(order.remainingAmount) === 0;

  if (order.status === 'cancelled' || order.status === 'refunded') {
    return <CancelledView order={order} />;
  }

  if (order.status === 'ready_for_pickup' || order.status === 'arrived') {
    return <ReadyForPickupView order={order} navigate={navigate} refetch={refetch} />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--color-primary)' }} className="text-white py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="text-green-200 text-sm mb-3 hover:text-white flex items-center gap-1">← Back</button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-xl font-bold">Pre-Order #{order.orderNumber}</h1>
              <p className="text-green-100 text-sm mt-1">{order.productName}</p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: currentConfig?.bg, color: currentConfig?.color }}>
              {currentConfig?.label}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Pickup info card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid var(--color-border)' }}>
          <div className="flex items-start gap-4">
            <img src={order.productImage} alt={order.productName} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{order.productName}</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{order.vendorName} · ×{order.quantity}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                  <MapPin size={12} style={{ color: 'var(--color-accent)' }} />
                  {order.destination}
                </div>
                <div className="flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                  <Clock size={12} style={{ color: 'var(--color-accent)' }} />
                  {order.pickupTime}
                </div>
              </div>
            </div>
          </div>
          {/* Payment summary */}
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-3 text-center text-xs" style={{ borderColor: 'var(--color-border)' }}>
            <div>
              <p style={{ color: 'var(--color-text-muted)' }}>Total</p>
              <p className="font-bold text-sm mt-0.5" style={{ color: 'var(--color-text)' }}>৳{order.totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)' }}>Paid ({order.advancePercent}%)</p>
              <p className="font-bold text-sm mt-0.5 text-green-700">৳{order.advancePaid.toLocaleString()}</p>
            </div>
            <div>
              <p style={{ color: 'var(--color-text-muted)' }}>{finalPaymentRecorded ? 'Paid at Pickup' : 'Due at Pickup'}</p>
              <p className="font-bold text-sm mt-0.5" style={{ color: finalPaymentRecorded ? '#15803D' : 'var(--color-accent)' }}>
                ৳{(finalPaymentRecorded
                  ? Math.max(Number(order.totalAmount) - Number(order.advancePaid), 0)
                  : Number(order.remainingAmount)).toLocaleString()}
              </p>
              {finalPaymentRecorded && order.pickupPaymentMethod && (
                <p className="mt-0.5 text-green-700">{methodLabel(order.pickupPaymentMethod)}</p>
              )}
            </div>
          </div>
          {(order.advancePaymentMethod || order.pickupTransactionId) && (
            <div className="mt-3 space-y-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {order.advancePaymentMethod && (
                <p>Advance paid by {methodLabel(order.advancePaymentMethod)}{order.advancePayerPhone ? ` from ${order.advancePayerPhone}` : ''}{order.advanceTransactionId ? ` · TrxID ${order.advanceTransactionId}` : ''}</p>
              )}
              {order.pickupTransactionId && (
                <p>Pickup payment by {methodLabel(order.pickupPaymentMethod)}{order.pickupPayerPhone ? ` from ${order.pickupPayerPhone}` : ''} · TrxID {order.pickupTransactionId}</p>
              )}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: '1px solid var(--color-border)' }}>
          <h2 className="font-semibold mb-5" style={{ color: 'var(--color-text)' }}>Order Timeline</h2>
          <div className="space-y-0">
            {TIMELINE_STEPS.map((step, idx) => {
              const stepNum = idx + 1;
              const isDone = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;
              const isFuture = stepNum > currentStep;
              const isLast = idx === TIMELINE_STEPS.length - 1;

              return (
                <div key={step.key} className="flex gap-4">
                  {/* Icon column */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isDone ? 'bg-green-100' : isCurrent ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {isDone ? (
                        <CheckCircle size={16} className="text-green-600" />
                      ) : isCurrent ? (
                        <Loader size={16} className="text-blue-600 animate-spin" />
                      ) : (
                        <Circle size={16} className="text-gray-300" />
                      )}
                    </div>
                    {!isLast && (
                      <div className="w-0.5 my-1 flex-1 min-h-[20px]" style={{
                        background: isDone ? 'var(--color-primary)' : 'var(--color-border)'
                      }} />
                    )}
                  </div>
                  {/* Text column */}
                  <div className="pb-5">
                    <p className={`text-sm font-semibold ${isDone ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {(isDone || isCurrent) && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{step.desc}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {order.status === 'picked_up' && (
            <div className="rounded-2xl p-4" style={{ background: '#E6F4EF' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Did you receive your order?</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Confirm once you have the product in hand. This completes the order and releases the vendor's payment.
              </p>
              {receiptError && <p role="alert" className="mt-2 text-xs text-red-600">{receiptError}</p>}
              <button
                onClick={handleConfirmReceipt}
                disabled={confirmingReceipt}
                className="mt-3 w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50"
                style={{ background: 'var(--color-primary)' }}
              >
                {confirmingReceipt ? 'Confirming…' : 'Yes, I Received My Order'}
              </button>
            </div>
          )}
          {order.status === 'completed' && (
            <p className="rounded-2xl p-4 text-center text-sm font-semibold" style={{ background: '#E6F4EF', color: 'var(--color-primary)' }}>
              <CheckCircle size={16} className="mr-1 inline" /> Order received and completed. Thank you!
            </p>
          )}
          {currentStep >= 4 && currentStep < 5 && (
            <div className="p-4 rounded-2xl text-center" style={{ background: '#E6F4EF' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Preparing your order…</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Estimated ready: {order.pickupTime}</p>
            </div>
          )}
          <button
            onClick={() => navigate(`/preorder/qr/${order.orderNumber}`)}
            className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-white transition-all hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            <QrCode size={20} /> View Pickup QR Code
          </button>
          <button
            onClick={() => navigate('/planner')}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm border-2 transition-all hover:bg-green-50"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
          >
            Add to Trip Planner
          </button>
          {/* FR-34: cancellation only before preparation begins (enforced by the API too). */}
          {['confirmed', 'advance_paid', 'vendor_accepted'].includes(order.status) && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full py-3 rounded-2xl font-semibold text-sm border transition-all hover:bg-red-50 disabled:opacity-50"
              style={{ borderColor: '#F42A41', color: '#F42A41' }}
            >
              {cancelling ? 'Cancelling…' : 'Cancel Pre-order'}
            </button>
          )}
          <div className="flex items-center gap-2 justify-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <Phone size={14} /> Need help? <span className="underline cursor-pointer">Contact Vendor</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadyForPickupView({ order, navigate, refetch }: { order: any; navigate: ReturnType<typeof useNavigate>; refetch: () => Promise<void> }) {
  const [arriving, setArriving] = useState(false);
  async function handleArrived() {
    setArriving(true);
    try {
      await preordersApi.update(order.id, { status: 'arrived' });
      await refetch();
    } catch (e: any) {
      alert(e?.message || 'Could not update your status.');
    } finally {
      setArriving(false);
    }
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Your order is ready!</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Order #{order.orderNumber} is ready for pickup. Head to the vendor location now.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6" style={{ border: '1px solid var(--color-border)' }}>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <MapPin size={16} style={{ color: 'var(--color-accent)' }} className="mt-0.5" />
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Pickup Location</p>
                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{order.pickupLocation}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={16} style={{ color: 'var(--color-accent)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Pickup Time</p>
                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{order.pickupTime} · {new Date(order.pickupDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'long' })}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Remaining Payment</span>
              <span className="font-bold text-lg" style={{ color: 'var(--color-accent)' }}>৳{order.remainingAmount.toLocaleString()}</span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Due at pickup ({100 - order.advancePercent}%)</p>
          </div>
        </div>

        <div className="space-y-3">
          {order.status === 'ready_for_pickup' ? (
            <button
              onClick={handleArrived}
              disabled={arriving}
              className="w-full py-3.5 rounded-2xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#7C3AED' }}
            >
              {arriving ? 'Updating…' : "I've Arrived at the Pickup Location"}
            </button>
          ) : (
            <p className="text-center text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
              Arrival recorded — show your QR code to the vendor.
            </p>
          )}
          <button
            onClick={() => navigate(`/preorder/qr/${order.orderNumber}`)}
            className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            <QrCode size={20} /> Show Pickup QR Code
          </button>
          <button
            onClick={() => navigate('/map')}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm border-2 transition-all hover:bg-gray-50"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            Get Directions
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelledView({ order }: { order: any }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-red-600" />
        </div>
        <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          {order.status === 'refunded' ? 'Order Refunded' : 'Order Cancelled'}
        </h2>
        <p className="text-sm mt-2 mb-6" style={{ color: 'var(--color-text-muted)' }}>
          {`Your pre-order #${order.orderNumber} has been ${order.status === 'refunded' ? 'refunded' : 'cancelled'}.`}
          {order.refundAmount != null && ` A refund of ৳${Number(order.refundAmount).toLocaleString()} of your ৳${Number(order.advancePaid).toLocaleString()} advance has been initiated.`}
        </p>
        <button onClick={() => navigate('/shop')} className="w-full py-4 rounded-2xl font-bold text-white" style={{ background: 'var(--color-primary)' }}>
          Browse More Products
        </button>
      </div>
    </div>
  );
}
