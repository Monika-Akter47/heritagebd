import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import type { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import Badge from '../ui/Badge';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useApp();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
  };

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;
  const isGiProduct = product.category === 'gi-product'
    || product.tags?.some(tag => tag.trim().toLowerCase() === 'gi product');

  return (
    <Link to={`/shop/${product.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[var(--color-border)]">
        <div className="relative h-52 overflow-hidden bg-[var(--color-surface-2)]">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {discount > 0 && (
            <div className="absolute top-3 left-3">
              <Badge variant="red">-{discount}%</Badge>
            </div>
          )}
          {isGiProduct && (
            <div className="absolute top-3 right-3">
              <Badge variant="gold">GI Product</Badge>
            </div>
          )}
          <button
            onClick={handleAddToCart}
            className="absolute bottom-3 right-3 bg-[#006A4E] text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#004D38] shadow-lg"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
        <div className="p-4">
          <p className="text-xs text-[var(--color-text-muted)] mb-1">{product.vendor.shopName}</p>
          <h3 className="font-semibold text-[var(--color-text)] text-sm mb-2 line-clamp-2 group-hover:text-[#006A4E] transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mb-3">
            <Star size={12} className="text-[#D4A017] fill-[#D4A017]" />
            <span className="text-xs font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-[var(--color-text-muted)]">({product.reviewCount})</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-end gap-1.5">
              <span className="font-bold text-[#006A4E] text-base">৳{product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className="text-xs text-[var(--color-text-muted)] line-through">৳{product.originalPrice.toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
