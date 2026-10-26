import { useState } from 'react';
import { adminApi, type AdminPayments } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';
import Badge from '../../components/ui/Badge';
import StatusBadge from "../../components/ui/StatusBadge";
import { methodLabel } from '../../components/ui/PaymentProofFields';

// Every online advance (held → released to the partner on completion, or refunded) and every
// balance paid to a partner (pre-order pickup, guide cash), with the payer number and TrxID for
// matching against the bKash/Nagad statement.

const FLOW_LABEL: Record<string, string> = { order: 'Order', preorder: 'Pre-order', guide_booking: 'Guide booking' };
const td = 'px-4 py-3 align-middle';
const taka = (n: number) => `৳${Number(n || 0).toLocaleString()}`;
const fmt = (d?: string) => (d ? new Date(d.replace(' ', 'T')).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

function Proof({ method, phone, txn }: { method: string | null; phone: string | null; txn: string | null }) {
  if (method !== 'bkash' && method !== 'nagad') return <span className="text-[var(--color-text-muted)]">—</span>;
  if (!phone || !txn) return <Badge variant="red" size="sm">missing proof</Badge>;
  return <span className="font-mono text-xs">{phone}<br />{txn}</span>;
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {head.map(h => <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">{children}</tbody>
      </table>
    </div>
  );
}

export default function PaymentsSection() {
  const { data, loading, error, refetch } = useApiData(() => adminApi.payments(), null as AdminPayments | null);
  const [view, setView] = useState<'advances' | 'balances'>('advances');
  const [flow, setFlow] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const matches = (...values: (string | null | undefined)[]) => !q || values.some(v => v?.toLowerCase().includes(q));
  const advances = (data?.advances ?? []).filter(a =>
    (!flow || a.flow === flow) && (!status || a.advanceStatus === status)
    && matches(a.ref, a.customerName, a.partnerName, a.payerPhone, a.transactionId));
  const balances = (data?.balances ?? []).filter(b =>
    (!flow || b.flow === flow) && (!status || b.status === status)
    && matches(b.ref, b.customerName, b.partnerName, b.payerPhone, b.transactionId));
  const rows = view === 'advances' ? advances : balances;
  const t = data?.totals;

  return (
    <div className="space-y-5">
      {t && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Advances Collected', value: taka(t.advanceCollected), note: 'all online advances', color: '#006A4E' },
            { label: 'Held by Platform', value: taka(t.advanceHeld), note: 'released when the order completes', color: '#D4A017' },
            { label: 'Released to Partners', value: taka(t.advanceReleased), note: `commission earned ${taka(t.commissionEarned)}`, color: '#2563EB' },
            { label: 'Refunded', value: taka(t.advanceRefunded), note: 'cancelled orders and bookings', color: '#F42A41' },
            { label: 'Balances Paid to Partners', value: taka(t.balanceCollected), note: 'pickup payments and confirmed guide cash', color: '#059669' },
            { label: 'Awaiting Guide Confirmation', value: taka(t.balanceAwaitingConfirmation), note: 'reported by tourists', color: '#7C3AED' },
            { label: 'Wallet Payments Missing Proof', value: String(t.walletMissingProof), note: 'bKash/Nagad without number or TrxID', color: t.walletMissingProof ? '#F42A41' : '#6B7280' },
          ].map(card => (
            <div key={card.label} className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
              <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">{card.label}</p>
              <p className="mt-1 text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: card.color }}>{card.value}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{card.note}</p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-5 py-3">
          {(['advances', 'balances'] as const).map(v => (
            <button key={v} onClick={() => { setView(v); setStatus(''); setFlow(''); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${view === v ? 'bg-[#006A4E] text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'}`}>
              {v === 'advances' ? `Online advances (${advances.length})` : `Balances: pickup & guide cash (${balances.length})`}
            </button>
          ))}
          <span className="flex-1" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search ref, name, number, TrxID…" aria-label="Search payments"
            className="w-56 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs outline-none" />
          <select value={flow} onChange={e => setFlow(e.target.value)} aria-label="Filter by flow" className="rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-xs">
            <option value="">All flows</option>
            {(view === 'advances' ? ['order', 'preorder', 'guide_booking'] : ['preorder', 'guide_booking']).map(f => <option key={f} value={f}>{FLOW_LABEL[f]}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter by status" className="rounded-lg border border-[var(--color-border)] px-2 py-1.5 text-xs">
            <option value="">All statuses</option>
            {(view === 'advances' ? ['held', 'released', 'refunded'] : ['confirmed', 'reported']).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => void refetch()} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold">Refresh</button>
        </div>

        {loading && <p className="p-6 text-sm text-[var(--color-text-muted)]">Loading payments…</p>}
        {error && <p className="p-6 text-sm text-red-600">Couldn't load payments: {error}</p>}
        {!loading && !error && rows.length === 0 && <p className="p-6 text-sm text-[var(--color-text-muted)]">No payments match.</p>}

        {view === 'advances' && advances.length > 0 && (
          <Table head={['Date', 'Flow / Ref', 'Customer', 'Partner', 'Total', 'Advance', 'Method', 'Payer / TrxID', 'Advance', 'Order status']}>
            {advances.map(a => (
              <tr key={`${a.flow}-${a.recordId}`}>
                <td className={td + ' whitespace-nowrap'}>{fmt(a.createdAt)}</td>
                <td className={td}><p className="text-xs text-[var(--color-text-muted)]">{FLOW_LABEL[a.flow]}</p><p className="font-mono text-xs">{a.ref}</p></td>
                <td className={td}>{a.customerName}<p className="text-xs text-[var(--color-text-muted)]">{a.customerPhone || ''}</p></td>
                <td className={td}>{a.partnerName || '—'}</td>
                <td className={td}>{taka(a.total)}</td>
                <td className={td + ' font-semibold'}>{taka(a.advance)}</td>
                <td className={td}>{methodLabel(a.method)}</td>
                <td className={td}><Proof method={a.method} phone={a.payerPhone} txn={a.transactionId} /></td>
                <td className={td}><StatusBadge status={a.advanceStatus} /></td>
                <td className={td}><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </Table>
        )}

        {view === 'balances' && balances.length > 0 && (
          <Table head={['Date', 'Flow / Ref', 'Customer', 'Paid to', 'Amount', 'Method', 'Payer / TrxID', 'Status', 'Recorded by']}>
            {balances.map(b => (
              <tr key={`${b.flow}-${b.recordId}`}>
                <td className={td + ' whitespace-nowrap'}>{fmt(b.paidAt)}</td>
                <td className={td}><p className="text-xs text-[var(--color-text-muted)]">{FLOW_LABEL[b.flow]}</p><p className="font-mono text-xs">{b.ref}</p></td>
                <td className={td}>{b.customerName}</td>
                <td className={td}>{b.partnerName || '—'}</td>
                <td className={td + ' font-semibold'}>{taka(b.amount)}</td>
                <td className={td}>{methodLabel(b.method)}</td>
                <td className={td}><Proof method={b.method} phone={b.payerPhone} txn={b.transactionId} /></td>
                <td className={td}><Badge variant={b.status === 'confirmed' ? 'green' : 'gold'} size="sm">{b.status === 'confirmed' ? 'received' : 'awaiting guide'}</Badge></td>
                <td className={td + ' text-xs capitalize'}>{b.recordedBy}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}
