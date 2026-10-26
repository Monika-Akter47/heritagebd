import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronRight, CreditCard, Phone, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ordersApi, paymentTermsApi, type PaymentTerms } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import PaymentProofFields, { emptyPaymentProof, validatePaymentProof, type PaymentProof } from '../../components/ui/PaymentProofFields';

const STEPS = ['Shipping', 'Payment', 'Review', 'Confirmation'];

const DIVISIONS = ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet', 'Barisal', 'Rangpur', 'Mymensingh'];
const DELIVERY_FEE_PER_VENDOR = 120;

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useApp();
  const [step, setStep] = useState(0);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderError, setOrderError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  const [address, setAddress] = useState({
    name: '', phone: '', address: '', city: '', district: '', division: 'Dhaka', postalCode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'card'>('bkash');
  const [paymentProof, setPaymentProof] = useState<PaymentProof>(emptyPaymentProof);
  const [paymentError, setPaymentError] = useState('');
  const { data: paymentTerms, loading: termsLoading, error: termsError } = useApiData(
    () => paymentTermsApi.get(),
    null as PaymentTerms | null,
    []
  );

  const vendorCount = new Set(cart.map(item => item.product.vendorId)).size;
  const deliveryFee = vendorCount * DELIVERY_FEE_PER_VENDOR;
  const total = cartTotal + deliveryFee;
  const advancePercent = paymentTerms?.order ?? 20;
  const commissionPercent = paymentTerms?.orderCommission ?? 10;
  const advanceAmount = Math.round(total * 100 * advancePercent / 100) / 100;
  const platformShare = Math.round(total * 100 * commissionPercent / 100) / 100;
  const vendorShare = advanceAmount - platformShare;
  const formatMoney = (amount: number) => amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePlaceOrder = async () => {
    setOrderError('');
    setPlacingOrder(true);
    try {
      const result = await ordersApi.create({
        shippingAddress: address,
        paymentMethod,
        advancePayerPhone: paymentProof.phone,
        advanceTransactionId: paymentProof.transactionId,
      });
      const createdOrders = result.orders ?? [];
      if (!createdOrders.length) throw new Error('The server did not return a created order.');
      setOrderNumber(createdOrders[0].id);
      clearCart();
      setStep(3);
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : 'Could not place your order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-[#006A4E]/10 flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-[#006A4E]" />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>Order Confirmed!</h1>
        <p className="text-[var(--color-text-muted)] mb-2">Thank you for your purchase.</p>
        <p className="font-bold text-[#006A4E] text-lg mb-8">Order #{orderNumber}</p>
        <p className="text-[var(--color-text-muted)] text-sm mb-8 max-w-sm">
          The vendor will confirm your order and share an estimated delivery date. You can follow status updates from order tracking.
        </p>
        <div className="flex gap-4">
          <Link to="/shop" className="px-6 py-3 border-2 border-[#006A4E] text-[#006A4E] rounded-xl font-semibold hover:bg-[#006A4E] hover:text-white transition-colors">
            Continue Shopping
          </Link>
          <Link to={`/order-tracking?id=${encodeURIComponent(orderNumber.split(', ')[0])}`} className="px-6 py-3 bg-[#006A4E] text-white rounded-xl font-semibold hover:bg-[#004D38] transition-colors">
            Track Order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-8" style={{ fontFamily: 'var(--font-display)' }}>Checkout</h1>

        {/* Step indicator */}
        <div className="flex items-center mb-10">
          {STEPS.slice(0, 3).map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? 'bg-[#006A4E] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i < step ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-[#006A4E]' : 'text-[var(--color-text-muted)]'}`}>{s}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-[#006A4E]' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 0 && (
              <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)]">
                <h2 className="font-bold text-xl mb-6" style={{ fontFamily: 'var(--font-display)' }}>Shipping Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'name', label: 'Full Name', placeholder: 'Your full name' },
                    { key: 'phone', label: 'Phone Number', placeholder: '01XXXXXXXXX' },
                    { key: 'address', label: 'Street Address', placeholder: 'House, Road, Area', full: true },
                    { key: 'city', label: 'City/Upazila', placeholder: 'City or Upazila' },
                    { key: 'district', label: 'District', placeholder: 'District name' },
                    { key: 'postalCode', label: 'Postal Code', placeholder: '1200' },
                  ].map(field => (
                    <div key={field.key} className={field.full ? 'sm:col-span-2' : ''}>
                      <label className="text-sm font-semibold mb-1 block">{field.label}</label>
                      <input
                        type="text"
                        value={(address as Record<string, string>)[field.key]}
                        onChange={e => setAddress(a => ({ ...a, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#006A4E]/30"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-sm font-semibold mb-1 block">Division</label>
                    <select
                      value={address.division}
                      onChange={e => setAddress(a => ({ ...a, division: e.target.value }))}
                      className="w-full px-4 py-3 border border-[var(--color-border)] rounded-xl text-sm outline-none"
                    >
                      {DIVISIONS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="mt-6 flex items-center gap-2 bg-[#006A4E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#004D38] transition-colors"
                >
                  Continue to Payment <ChevronRight size={16} />
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)]">
                <h2 className="font-bold text-xl mb-6" style={{ fontFamily: 'var(--font-display)' }}>Payment Method</h2>
                <div className="space-y-3">
                  {[
                    { id: 'bkash' as const, label: 'bKash', icon: Phone, desc: 'Pay the advance online; remaining balance is cash on delivery', color: '#E2136E' },
                    { id: 'nagad' as const, label: 'Nagad', icon: Phone, desc: 'Pay the advance online; remaining balance is cash on delivery', color: '#F7941D' },
                    { id: 'card' as const, label: 'Credit/Debit Card', icon: CreditCard, desc: 'Pay the advance online; remaining balance is cash on delivery', color: '#006A4E' },
                  ].map(method => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === method.id ? 'border-[#006A4E] bg-[#006A4E]/5' : 'border-[var(--color-border)] hover:border-gray-300'}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="hidden"
                      />
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${method.color}15` }}>
                        <method.icon size={20} style={{ color: method.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{method.label}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{method.desc}</p>
                      </div>
                      {paymentMethod === method.id && <CheckCircle size={20} className="text-[#006A4E]" />}
                    </label>
                  ))}
                </div>
                {termsLoading && <p role="status" className="mt-3 text-sm text-[var(--color-text-muted)]">Loading payment terms…</p>}
                {termsError && <p role="alert" className="mt-3 text-sm text-red-600">Could not load payment terms: {termsError}</p>}
                {paymentTerms && (
                  <div className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-900">
                    <p>Pay {advancePercent}% advance online: ৳{formatMoney(advanceAmount)}. Pay the remaining {100 - advancePercent}% in cash on delivery.</p>
                    <p className="mt-1 text-xs">After you confirm delivery, the advance is split: ৳{formatMoney(platformShare)} ({commissionPercent}%) to the platform and ৳{formatMoney(vendorShare)} ({advancePercent - commissionPercent}%) to the vendor.</p>
                  </div>
                )}
                <div className="mt-4">
                  <PaymentProofFields method={paymentMethod} value={paymentProof} onChange={p => { setPaymentProof(p); setPaymentError(''); }} amount={advanceAmount} />
                </div>
                {paymentError && <p role="alert" className="mt-2 text-sm text-red-600">{paymentError}</p>}
                <p className="mt-2 text-xs text-amber-800">No payment gateway is connected yet: the admin checks your number and TrxID against the wallet statement. Card payments are simulated.</p>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(0)} className="px-5 py-3 border border-[var(--color-border)] rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                    Back
                  </button>
                  <button onClick={() => {
                    const proofError = validatePaymentProof(paymentMethod, paymentProof);
                    if (proofError) { setPaymentError(proofError); return; }
                    setStep(2);
                  }} disabled={!paymentTerms || termsLoading || !!termsError} className="flex items-center gap-2 bg-[#006A4E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#004D38] transition-colors disabled:opacity-50">
                    Review Order <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)]">
                <h2 className="font-bold text-xl mb-6" style={{ fontFamily: 'var(--font-display)' }}>Review Your Order</h2>
                <div className="space-y-4 mb-6">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex gap-3">
                      <img src={item.product.images[0]} alt={item.product.name} className="w-16 h-16 rounded-xl object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-sm">৳{(item.product.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[var(--color-border)] pt-4 mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[var(--color-text-muted)]">Payment</span>
                    <span className="font-medium capitalize">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[var(--color-text-muted)]">Delivery ({vendorCount} shipment{vendorCount === 1 ? '' : 's'})</span>
                    <span className="font-medium">৳{deliveryFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2">
                    <span>Total</span>
                    <span className="text-[#006A4E]">৳{total.toLocaleString()}</span>
                  </div>
                  {paymentTerms && (
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Advance held until delivery confirmation ({advancePercent}%)</span><span>৳{formatMoney(advanceAmount)}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--color-text-muted)]">Cash on delivery ({100 - advancePercent}%)</span><span>৳{formatMoney(total - advanceAmount)}</span></div>
                      <p className="pt-2 text-xs text-[var(--color-text-muted)]">When you confirm delivery: platform ৳{formatMoney(platformShare)} · vendor ৳{formatMoney(vendorShare)}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="px-5 py-3 border border-[var(--color-border)] rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                    Back
                  </button>
                  {orderError && <p role="alert" className="text-sm text-red-600 self-center">{orderError}</p>}
                  <button onClick={handlePlaceOrder} disabled={placingOrder || cart.length === 0} className="flex-1 bg-[#006A4E] text-white py-3 rounded-xl font-semibold hover:bg-[#004D38] transition-colors disabled:opacity-50">
                    {placingOrder ? 'Placing order…' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <div className="bg-white rounded-2xl p-5 border border-[var(--color-border)] h-fit sticky top-24">
            <h3 className="font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              {cart.slice(0, 3).map(item => (
                <div key={item.product.id} className="flex justify-between">
                  <span className="text-[var(--color-text-muted)] truncate flex-1 mr-2">{item.product.name} x{item.quantity}</span>
                  <span className="font-medium">৳{(item.product.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--color-border)] pt-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--color-text-muted)]">Delivery fee</span>
                <span>৳{deliveryFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[#006A4E]">৳{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
