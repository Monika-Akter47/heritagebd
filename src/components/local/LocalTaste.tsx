import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, UtensilsCrossed, ShoppingBag } from 'lucide-react';
import { localFoodsApi, productsApi, type AreaQuery, type LocalFood, type LocalFoodType } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import ProductCard from '../cards/ProductCard';
import type { Product } from '../../types';

const FOOD_EMOJI: Record<LocalFoodType, string> = {
  dish: '🍛', sweet: '🍮', snack: '🥟', drink: '🍵', fruit: '🥭', ingredient: '🌾',
};

const FOOD_LABEL: Record<LocalFoodType, string> = {
  dish: 'Dish', sweet: 'Sweet', snack: 'Snack', drink: 'Drink', fruit: 'Seasonal fruit', ingredient: 'Local produce',
};

type Tab = 'foods' | 'products';

interface LocalTasteProps {
  /** Where to look: a division, district or landmark name. */
  query: AreaQuery;
  /** Human label for headings, e.g. "Sylhet" or "Lalbagh Fort". */
  label: string;
  /** Which tabs to show. The shop only needs foods; it already lists products. */
  tabs?: Tab[];
  /** Max products shown before the "see all" link. */
  productLimit?: number;
}

function FoodCard({ food }: { food: LocalFood }) {
  return (
    <article className="flex gap-3 rounded-xl border border-[var(--color-border)] bg-white p-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--color-surface-2)] text-3xl" aria-hidden="true">
        {food.image ? <img src={food.image} alt="" className="h-full w-full object-cover" loading="lazy" /> : FOOD_EMOJI[food.type]}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h4 className="text-sm font-semibold text-[var(--color-text)]">{food.name}</h4>
          {food.nameLocal && <span className="text-xs text-[var(--color-text-muted)]" lang="bn">{food.nameLocal}</span>}
        </div>
        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
          {FOOD_LABEL[food.type]} · {food.district}
          {food.areaMatch === 'nearby' && <span className="ml-1 rounded bg-[var(--color-surface-2)] px-1.5 py-0.5">nearby</span>}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text)]">{food.description}</p>
        {food.whereToTry && (
          <p className="mt-1 flex items-start gap-1 text-xs text-[#006A4E]">
            <MapPin size={12} className="mt-0.5 shrink-0" aria-hidden="true" /> {food.whereToTry}
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * "Taste & take home" section: traditional foods and local products for an area,
 * with the area's own items first and the rest of its division after.
 */
export default function LocalTaste({ query, label, tabs = ['foods', 'products'], productLimit = 6 }: LocalTasteProps) {
  const [tab, setTab] = useState<Tab>(tabs[0]);
  const key = `${query.area}|${query.scope ?? ''}|${query.exact ? 1 : 0}`;
  const foods = useApiData(
    () => (tabs.includes('foods') ? localFoodsApi.list(query) : Promise.resolve([])),
    [] as LocalFood[],
    [key],
  );
  const products = useApiData(
    () => (tabs.includes('products') ? productsApi.byArea(query, { limit: String(productLimit + 1) }) : Promise.resolve([])),
    [] as Product[],
    [key],
  );

  const shopLink = `/shop?area=${encodeURIComponent(query.area)}`;
  const active = tab === 'foods' ? foods : products;

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white" aria-labelledby={`taste-${key}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[#FFF8E7] px-5 py-3">
        <h3 id={`taste-${key}`} className="text-sm font-bold uppercase tracking-wider text-[#8a6a0a]">
          Taste &amp; take home from {label}
        </h3>
        {tabs.length > 1 && (
          <div role="tablist" aria-label="Local foods and products" className="flex gap-1 rounded-lg bg-white p-1">
            {tabs.map(t => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${tab === t ? 'bg-[#D4A017] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'}`}>
                {t === 'foods' ? <UtensilsCrossed size={13} aria-hidden="true" /> : <ShoppingBag size={13} aria-hidden="true" />}
                {t === 'foods' ? `Traditional foods${foods.loading ? '' : ` (${foods.data.length})`}` : `Local products${products.loading ? '' : ` (${Math.min(products.data.length, productLimit)})`}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-5" role="tabpanel">
        {active.loading && <p role="status" className="text-sm text-[var(--color-text-muted)]">Finding what {label} is known for…</p>}
        {active.error && <p role="alert" className="text-sm text-red-600">Could not load this list: {active.error}</p>}

        {!active.loading && !active.error && tab === 'foods' && (
          foods.data.length === 0
            ? <p className="text-sm text-[var(--color-text-muted)]">No traditional foods are listed for {label} yet.</p>
            : <div className="grid gap-3 sm:grid-cols-2">{foods.data.map(f => <FoodCard key={f.id} food={f} />)}</div>
        )}

        {!active.loading && !active.error && tab === 'products' && (
          products.data.length === 0
            ? <p className="text-sm text-[var(--color-text-muted)]">No local products from {label} are listed yet. Browse the <Link to="/shop" className="font-semibold text-[#006A4E] underline">marketplace</Link>.</p>
            : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {products.data.slice(0, productLimit).map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                <Link to={shopLink} className="mt-4 inline-block text-sm font-semibold text-[#006A4E] underline">
                  See all products from {label} →
                </Link>
              </>
            )
        )}
      </div>
    </section>
  );
}
