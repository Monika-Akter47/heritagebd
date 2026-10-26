import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Star, Minus, Plus, Share2, Heart, Clock, MapPin, QrCode } from 'lucide-react';
import { productsApi, reviewsApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import { useApp } from '../../context/AppContext';
import Badge from '../../components/ui/Badge';
import StarRating from '../../components/ui/StarRating';
import ReviewCard from '../../components/cards/ReviewCard';
import ProductCard from '../../components/cards/ProductCard';

export default function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: product, loading } = useApiData(() => productsApi.get(id as string), null as any, [id]);
  const { addToCart } = useApp();
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [added, setAdded] = useState(false);

  const { data: reviews } = useApiData(
    () => (id ? reviewsApi.list('product', id) : Promise.resolve([])),
    [] as any[],
    [id]
  );
  const { data: shopReviews } = useApiData(
    () => (product?.vendorId ? reviewsApi.list('vendor', product.vendorId) : Promise.resolve([])),
    [] as any[],
    [product?.vendorId]
  );
  const { data: allProducts } = useApiData(() => productsApi.list(), [] as any[]);

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-[var(--color-text-muted)]">Loading product…</p>
      </div>
    );
  }

  const related = allProducts.filter((p: any) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAddToCart = async () => {
    const addedToCart = await addToCart(product, qty);
    if (!addedToCart) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/shop" className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-6 text-sm">
          <ArrowLeft size={16} /> Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div>
            <div className="rounded-3xl overflow-hidden bg-[var(--color-surface-2)] h-96 mb-4">
              <img src={product.images[selectedImg]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImg === i ? 'border-[#006A4E]' : 'border-[var(--color-border)]'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-2">
              {product.vendor.shopName}
              {product.vendor.reviewCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Star size={13} fill="#D4A017" color="#D4A017" />
                  {Number(product.vendor.rating).toFixed(1)} ({product.vendor.reviewCount} shop reviews)
                </span>
              )}
            </p>
            <h1 className="text-3xl font-bold text-[var(--color-text)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-1">
                <StarRating rating={product.rating} size="sm" showValue />
                <span className="text-sm text-[var(--color-text-muted)]">({product.reviewCount} reviews)</span>
              </div>
              {product.featured && <Badge variant="gold">GI Certified</Badge>}
              {discount > 0 && <Badge variant="red">{discount}% OFF</Badge>}
              {product.district && <Badge variant="gray">{product.district}</Badge>}
            </div>

            <div className="flex items-end gap-3 mb-6">
              <span className="text-4xl font-bold text-[#006A4E]" style={{ fontFamily: 'var(--font-display)' }}>
                ৳{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-[var(--color-text-muted)] line-through">৳{product.originalPrice.toLocaleString()}</span>
              )}
            </div>

            <p className="text-[var(--color-text-muted)] leading-relaxed mb-6">{product.description}</p>

            {product.specifications && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="flex gap-2 text-sm">
                      <span className="text-[var(--color-text-muted)]">{key}:</span>
                      <span className="font-medium">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm font-semibold text-[var(--color-text)] mb-2">Choose how you want to receive this product</p>

            {/* Delivery is available for all products; pickup is available when the vendor enables it. */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center border border-[var(--color-border)] rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-3 hover:bg-gray-100 transition-colors">
                  <Minus size={16} />
                </button>
                <span className="px-5 py-3 font-semibold text-sm">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-4 py-3 hover:bg-gray-100 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                  added ? 'bg-green-600 text-white' : 'bg-[#006A4E] text-white hover:bg-[#004D38]'
                }`}
              >
                <ShoppingCart size={18} />
                {added ? 'Added to Cart!' : 'Buy for Delivery'}
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </p>

            {/* ─── READY WHEN YOU ARRIVE ─────────────────────── */}
            {product.preOrderEnabled && (() => {
              const poProduct = product;
              return (
                <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: 'var(--color-primary)' }}>
                  <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'var(--color-primary)' }}>
                    <span className="text-base">🛍️</span>
                    <span className="text-white font-bold text-sm uppercase tracking-wide">Ready to Pick</span>
                    <span className="ml-auto text-xs text-green-200 font-medium">Pre-order Available</span>
                  </div>
                  <div className="p-4" style={{ background: '#E6F4EF' }}>
                    <p className="text-sm mb-3" style={{ color: '#004D38' }}>
                      Order before your visit and we will prepare it for pickup when you arrive. No waiting — just experiencing.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="flex items-center gap-1.5" style={{ color: '#006A4E' }}>
                        <Clock size={12} /> Prep: {poProduct.preparationTime}
                      </div>
                      <div className="flex items-center gap-1.5" style={{ color: '#006A4E' }}>
                        <MapPin size={12} /> {poProduct.pickupLocation?.split(',')[0] || 'Pickup location unavailable'}
                      </div>
                    </div>
                    {/* Mini payment preview */}
                    <div className="bg-white rounded-xl p-3 text-xs mb-3" style={{ border: '1px solid #B2D8CB' }}>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: 'var(--color-text-muted)' }}>Order Total</span>
                        <span className="font-semibold">৳{product.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: 'var(--color-text-muted)' }}>Pay Now (30%)</span>
                        <span className="font-bold" style={{ color: 'var(--color-primary)' }}>৳{Math.round(product.price * 0.3).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--color-text-muted)' }}>At Pickup (70%)</span>
                        <span className="font-bold" style={{ color: 'var(--color-accent)' }}>৳{Math.round(product.price * 0.7).toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      disabled={!poProduct.pickupLocation || product.stock < 1}
                      onClick={() => navigate(`/preorder/checkout?product=${encodeURIComponent(poProduct.id)}&destination=${encodeURIComponent(product.district || poProduct.pickupLocation)}`)}
                      className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                      style={{ background: 'var(--color-primary)', opacity: !poProduct.pickupLocation || product.stock < 1 ? 0.55 : 1 }}
                    >
                      <QrCode size={16} /> Choose Ready to Pick · Pay ৳{Math.round(product.price * 0.3).toLocaleString()} Now
                    </button>
                  </div>
                </div>
              );
            })() || (
              <p className="rounded-xl border border-[var(--color-border)] bg-white p-3 text-xs text-[var(--color-text-muted)]">
                Ready to Pick is not enabled for this product. Choose delivery above, or ask the vendor to enable pickup.
              </p>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {product.tags.map((tag: string) =><Badge key={tag} variant="gray" size="sm">{tag}</Badge>)}
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Customer Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>
          </div>
        )}

        {shopReviews.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Reviews for {product.vendor.shopName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shopReviews.map((review: any) => <ReviewCard key={review.id} review={review} />)}
            </div>
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
