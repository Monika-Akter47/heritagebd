import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Cart() {
  const { cart, removeFromCart, updateCartQty, cartTotal } = useApp();

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <ShoppingBag size={64} className="text-[#006A4E]/20 mb-6" />
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
          Your cart is empty
        </h2>
        <p className="text-[var(--color-text-muted)] mb-8">Discover authentic Bengali products and add them to your cart</p>
        <Link to="/shop" className="bg-[#006A4E] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#004D38] transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  const shipping = cartTotal > 2000 ? 0 : 120;
  const total = cartTotal + shipping;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-8" style={{ fontFamily: 'Fraunces, serif' }}>
          Shopping Cart ({cart.reduce((s, i) => s + i.quantity, 0)} items)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <div key={item.product.id} className="bg-white rounded-2xl p-5 border border-[var(--color-border)] flex gap-5">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-[var(--color-surface-2)] shrink-0">
                  <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">{item.product.vendor.shopName}</p>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.product.name}</h3>
                  <p className="font-bold text-[#006A4E]">৳{item.product.price.toLocaleString()}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
                      <button onClick={() => updateCartQty(item.product.id, item.quantity - 1)} className="px-3 py-1.5 hover:bg-gray-100 transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="px-3 py-1.5 text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.product.id, item.quantity + 1)} className="px-3 py-1.5 hover:bg-gray-100 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 text-[var(--color-text-muted)] hover:text-[#F42A41] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-base">৳{(item.product.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white rounded-2xl p-6 border border-[var(--color-border)] sticky top-24">
              <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'Fraunces, serif' }}>Order Summary</h3>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">Subtotal</span>
                  <span className="font-medium">৳{cartTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-muted)]">Shipping</span>
                  <span className="font-medium">{shipping === 0 ? 'Free' : `৳${shipping}`}</span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-[#006A4E]">Add ৳{(2000 - cartTotal).toLocaleString()} more for free shipping</p>
                )}
              </div>
              <div className="border-t border-[var(--color-border)] pt-3 mb-4">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-[#006A4E]">৳{total.toLocaleString()}</span>
                </div>
              </div>
              <Link
                to="/checkout"
                className="flex items-center justify-center gap-2 w-full bg-[#006A4E] text-white py-3.5 rounded-xl font-semibold hover:bg-[#004D38] transition-colors"
              >
                Proceed to Checkout
                <ArrowRight size={16} />
              </Link>
              <Link to="/shop" className="block text-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] mt-3">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
