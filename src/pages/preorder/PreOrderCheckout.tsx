import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Clock, Calendar, Package, ChevronRight, CheckCircle, Smartphone, CreditCard, Banknote, AlertCircle } from 'lucide-react';
import { paymentTermsApi, productsApi, preordersApi, type PaymentTerms } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import type { PreOrderProduct } from '../../types';

const STEPS = ['Pickup Info', 'Order Summary', 'Payment', 'Confirmation'];

type PaymentMethod = 'bkash' | 'nagad' | 'card';

function localDateString(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function PreOrderCheckout() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product') || '';
  const destinationParam = searchParams.get('destination') || 'Sonargaon';

  const { data: product, loading, error: productError, refetch: refetchProduct } = useApiData<PreOrderProduct | null>(
    () => (productId ? productsApi.get(productId) : Promise.resolve(null)),
    null,
    [productId]
  );
  const { data: paymentTerms, loading: termsLoading, error: termsError, refetch: refetchPaymentTerms } = useApiData(
    () => paymentTermsApi.get(),
    null as PaymentTerms | null,
    []
  );
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [pickupDate, setPickupDate] = useState(() => localDateString(new Date()));
  const [pickupTime, setPickupTime] = useState('2:00 PM');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-[var(--color-text-muted)]">Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <p role={productError ? 'alert' : 'status'} className={productError ? 'text-red-700' : 'text-[var(--color-text-muted)]'}>
            {productError ? `Could not load this product: ${productError}` : 'Choose a product to place a pre-order.'}
          </p>
          {productError && (
            <button onClick={() => void refetchProduct()} className="mt-3 rounded-lg bg-[#006A4E] px-4 py-2 text-sm font-semibold text-white">
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  const totalAmount = product.price * quantity;
  const advancePct = paymentTerms?.preorder ?? 0;
  const advanceAmount = Math.round(totalAmount * advancePct / 100);
  const remainingAmount = totalAmount - advanceAmount;

  function handleNextStep() {
    if (step < 3) setStep(s => s + 1);
    else handleConfirm();
  }

  async function handleConfirm() {
    if (!product) {
      setSubmitError('Product details are unavailable. Reload the checkout and try again.');
      return;
    }

    setIsProcessing(true);
    setSubmitError(null);
    try {
      const created = await preordersApi.create({
        productId: product.id,
        pickupDate,
        pickupTime,
        quantity,
        advancePaymentMethod: paymentMethod,
      });
      if (!created?.orderNumber) {
        throw new Error('The server created the pre-order but did not return its order number. Check My Orders before trying again.');
      }
      setOrderNumber(created.orderNumber);
      setStep(4);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to place pre-order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  if (step === 4) {
    return <ConfirmationScreen
      orderNumber={orderNumber}
      product={product}
      pickupDate={pickupDate}
      pickupTime={pickupTime}
      quantity={quantity}
      totalAmount={totalAmount}
      advanceAmount={advanceAmount}
      remainingAmount={remainingAmount}
      paymentMethod={paymentMethod}
    />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--color-primary)' }} className="text-white py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-green-200 text-sm mb-3">
            <span className="cursor-pointer hover:text-white" onClick={() => navigate(-1)}>← Back</span>
          </div>
          <h1 className="font-display text-2xl font-bold">Pre-Order for Pickup</h1>
          <p className="text-green-100 text-sm mt-1">Ready to Pick · {destinationParam}</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="bg-white border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const active = n === step;
              const done = n < step;
              return (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      done ? 'text-white' : active ? 'text-white' : 'text-gray-400 border-2 border-gray-200'
                    }`} style={done || active ? { background: 'var(--color-primary)' } : {}}>
                      {done ? <CheckCircle size={16} /> : n}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${active ? 'text-green-800' : done ? 'text-green-700' : 'text-gray-400'}`}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2" style={{ background: done ? 'var(--color-primary)' : 'var(--color-border)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Product summary strip */}
        <div className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm" style={{ border: '1px solid var(--color-border)' }}>
          <img src={product.images[0]} alt={product.name} className="w-16 h-16 rounded-xl object-cover" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-1" style={{ color: 'var(--color-text)' }}>{product.name}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{product.vendor.shopName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: 'var(--color-primary)' }}>
                🟢 Pre-order Available
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg" style={{ color: 'var(--color-primary)' }}>৳{product.price.toLocaleString()}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>per unit</p>
          </div>
        </div>

        {/* Step 1: Pickup Info */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Pickup Information</h2>

            {/* Destination */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Destination</label>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border-2" style={{ borderColor: 'var(--color-primary)' }}>
                <MapPin size={20} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{destinationParam}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{product.pickupLocation}</p>
                </div>
              </div>
            </div>

            {/* Pickup Date */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Pickup Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-primary)' }} />
                <input
                  type="date"
                  value={pickupDate}
                  min={localDateString(new Date())}
                  max={product.maxAdvanceDays ? localDateString(new Date(Date.now() + product.maxAdvanceDays * 86400000)) : undefined}
                  onChange={e => setPickupDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 outline-none text-sm font-medium"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', background: 'white' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; }}
                />
              </div>
            </div>

            {/* Pickup Time */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Expected Pickup Time</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {product.availableTimeSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setPickupTime(slot)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      pickupTime === slot ? 'text-white' : 'bg-white'
                    }`}
                    style={pickupTime === slot
                      ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }
                      : { borderColor: 'var(--color-border)', color: 'var(--color-text)' }
                    }
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>Quantity</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-colors hover:bg-gray-50"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >−</button>
                <span className="text-2xl font-bold w-8 text-center" style={{ color: 'var(--color-text)' }}>{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(10, q + 1))}
                  className="w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-colors hover:bg-gray-50"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >+</button>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Max 10 per order</span>
              </div>
            </div>

            {/* Prep time notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#FDF6E3' }}>
              <Clock size={18} style={{ color: 'var(--color-gold)' }} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#92660A' }}>Preparation Time: {product.preparationTime}</p>
                <p className="text-xs mt-0.5" style={{ color: '#A07820' }}>Order at least {product.preparationTime} before your pickup time.</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Order Summary */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Order Summary</h2>

            {/* Items */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-text-muted)' }}>{product.name}</span>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>৳{product.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--color-text-muted)' }}>Quantity</span>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>×{quantity}</span>
                </div>
                <div className="border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
                    <span className="font-medium" style={{ color: 'var(--color-text)' }}>৳{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span style={{ color: 'var(--color-text-muted)' }}>Preparation fee</span>
                    <span className="font-medium text-green-700">Free</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pickup details */}
            <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: '1px solid var(--color-border)' }}>
              <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--color-text)' }}>Pickup Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Destination</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{destinationParam}</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Date</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{new Date(pickupDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Time</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{pickupTime}</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Vendor</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{product.vendor.shopName}</p>
                </div>
              </div>
              <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Pickup Location</p>
                <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
                  <MapPin size={13} style={{ color: 'var(--color-accent)' }} />{product.pickupLocation}
                </p>
              </div>
            </div>

            {/* Payment preview */}
            {paymentTerms ? (
              <PaymentSummaryBox totalAmount={totalAmount} advancePct={advancePct} advanceAmount={advanceAmount} remainingAmount={remainingAmount} />
            ) : (
              <p role={termsError ? 'alert' : 'status'} className={`rounded-xl p-4 text-sm ${termsError ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                {termsError ? `Could not load payment terms: ${termsError}` : 'Loading payment terms before showing the advance breakdown…'}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>Advance Payment</h2>

            {paymentTerms ? (
              <PaymentSummaryBox totalAmount={totalAmount} advancePct={advancePct} advanceAmount={advanceAmount} remainingAmount={remainingAmount} highlight />
            ) : (
              <p role={termsError ? 'alert' : 'status'} className={`rounded-xl p-4 text-sm ${termsError ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                {termsError ? `Could not load payment terms: ${termsError}` : 'Loading payment terms…'}
              </p>
            )}

            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Payment Method for Advance (৳{advanceAmount.toLocaleString()})</label>
              <div className="space-y-3">
                {([
                  { id: 'bkash', label: 'bKash', color: '#E2136E', icon: '📱', desc: 'Mobile financial service' },
                  { id: 'nagad', label: 'Nagad', color: '#F7901E', icon: '📲', desc: 'Digital financial service' },
                  { id: 'card', label: 'Debit / Credit Card', color: '#1A56DB', icon: '💳', desc: 'Visa, Mastercard, Amex' },
                ] as const).map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left"
                    style={paymentMethod === method.id
                      ? { borderColor: 'var(--color-primary)', background: '#E6F4EF' }
                      : { borderColor: 'var(--color-border)', background: 'white' }
                    }
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: method.color + '15' }}>
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: method.color }}>{method.label}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{method.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? 'border-green-600' : 'border-gray-300'}`}>
                      {paymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 p-4 rounded-xl" style={{ background: '#EFF6FF' }}>
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#2563EB' }} />
              <p className="text-xs" style={{ color: '#1D4ED8' }}>
                Pay <strong>৳{advanceAmount.toLocaleString()} ({advancePct}%)</strong> now to confirm your Ready to Pick order. The remaining <strong>৳{remainingAmount.toLocaleString()} ({100 - advancePct}%)</strong> is paid in cash at pickup.
              </p>
            </div>
            <p className="text-xs text-amber-800">Online advance is currently simulated in demo mode. No real payment gateway is connected.</p>
          </div>
        )}

        {/* CTA */}
        <div className="pt-2">
          {submitError && (
            <p className="text-sm text-red-600 mb-3 text-center">{submitError}</p>
          )}
          {step > 1 && !paymentTerms && termsError && (
            <p role="alert" className="text-sm text-red-600 mb-3 text-center">
              Payment terms are required before continuing. Use the button below to retry.
            </p>
          )}
          <button
            onClick={() => {
              if (step > 1 && !paymentTerms && termsError) {
                void refetchPaymentTerms();
                return;
              }
              handleNextStep();
            }}
            disabled={isProcessing || (step > 1 && (termsLoading || (!paymentTerms && !termsError)))}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: 'var(--color-primary)' }}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : step > 1 && !paymentTerms && termsError ? 'Retry payment terms' :
              step === 1 ? 'Continue to Order Summary' :
              step === 2 ? 'Proceed to Payment' :
              `Pay ৳${advanceAmount.toLocaleString()} & Confirm Pre-Order`}
          </button>
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="w-full mt-3 py-3 rounded-2xl font-medium text-sm transition-colors hover:bg-gray-100"
              style={{ color: 'var(--color-text-muted)' }}
            >
              ← Go Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentSummaryBox({ totalAmount, advancePct, advanceAmount, remainingAmount, highlight }: {
  totalAmount: number; advancePct: number; advanceAmount: number; remainingAmount: number; highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl overflow-hidden ${highlight ? 'shadow-md' : ''}`} style={{ border: `2px solid ${highlight ? 'var(--color-primary)' : 'var(--color-border)'}` }}>
      <div className="p-4 text-white text-sm font-semibold" style={{ background: highlight ? 'var(--color-primary)' : 'var(--color-surface-2)' }}>
        <span style={highlight ? {} : { color: 'var(--color-text)' }}>Payment Breakdown</span>
      </div>
      <div className="bg-white p-5 space-y-3 text-sm">
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>Order Total</span>
          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>৳{totalAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>Advance Payment ({advancePct}%)</span>
          <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>৳{advanceAmount.toLocaleString()}</span>
        </div>
        <div className="border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex justify-between">
            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Pay Now</span>
            <span className="font-bold text-base" style={{ color: 'var(--color-primary)' }}>৳{advanceAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between mt-2">
            <span style={{ color: 'var(--color-text-muted)' }}>Remaining at Pickup</span>
            <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>৳{remainingAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmationScreen({ orderNumber, product, pickupDate, pickupTime, quantity, totalAmount, advanceAmount, remainingAmount, paymentMethod }: {
  orderNumber: string; product: PreOrderProduct; pickupDate: string; pickupTime: string; quantity: number;
  totalAmount: number; advanceAmount: number; remainingAmount: number; paymentMethod: PaymentMethod;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-md">
        {/* Success icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: '#E6F4EF' }}>
            <CheckCircle size={44} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h1 className="font-display text-3xl font-bold text-center" style={{ color: 'var(--color-text)' }}>Pre-order Confirmed!</h1>
          <p className="text-center mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Your order will be prepared by the vendor and ready when you arrive.
          </p>
        </div>

        {/* Order card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid var(--color-border)' }}>
          {/* Order number header */}
          <div className="p-4 text-center" style={{ background: 'var(--color-primary)' }}>
            <p className="text-green-100 text-xs font-medium">ORDER NUMBER</p>
            <p className="font-bold text-white text-2xl mt-0.5">#{orderNumber}</p>
          </div>

          <div className="p-5 space-y-4">
            {/* Product */}
            <div className="flex items-center gap-3">
              <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{product.name}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{product.vendor.shopName} · ×{quantity}</p>
              </div>
            </div>

            <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

            {/* Payment status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  <CheckCircle size={14} className="text-green-600" /> Advance Paid
                </span>
                <span className="font-bold text-green-700">৳{advanceAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-text-muted)' }}>Remaining at Pickup</span>
                <span className="font-bold" style={{ color: 'var(--color-accent)' }}>৳{remainingAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-text-muted)' }}>Payment via</span>
                <span className="font-medium capitalize" style={{ color: 'var(--color-text)' }}>{paymentMethod}</span>
              </div>
            </div>

            <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

            {/* Pickup info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={14} style={{ color: 'var(--color-accent)' }} className="mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Pickup Location</p>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{product.pickupLocation}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} style={{ color: 'var(--color-accent)' }} />
                <div>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Date: </span>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>{new Date(pickupDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} style={{ color: 'var(--color-accent)' }} />
                <div>
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Time: </span>
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>{pickupTime}</span>
                </div>
              </div>
            </div>

            {/* Remaining reminder */}
            <div className="rounded-xl p-3 text-sm flex items-center gap-2" style={{ background: '#FEF2F2' }}>
              <span className="text-lg">💳</span>
              <p style={{ color: '#B91C1C' }}>
                Remember to bring <strong>৳{remainingAmount.toLocaleString()}</strong> for the remaining payment at pickup.
              </p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => navigate('/preorder/tracking/' + orderNumber)}
            className="w-full py-4 rounded-2xl font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'var(--color-primary)' }}
          >
            View Order & Track Status
          </button>
          <button
            onClick={() => navigate('/planner')}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm border-2 transition-all hover:bg-green-50"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
          >
            + Add Pickup to My Trip
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 text-sm transition-colors hover:text-gray-600"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
