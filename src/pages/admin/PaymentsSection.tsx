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

type Advance = AdminPayments['advances'][number];

/** The admin records the advance sent back to the tourist (vendor or guide cancelled). */
function RefundDialog({ advance, onClose, onDone }: { advance: Advance; onClose: () => void; onDone: () => void }) {
  const [method, setMethod] = useState(advance.method === 'nagad' ? 'nagad' : advance.method === 'card' ? 'card' : 'bkash');
  const [txn, setTxn] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await adminApi.refund(advance.flow as 'preorder' | 'guide_booking', advance.recordId, { method, transactionId: txn.trim() });
      onDone();
    } catch (err: any) {
      setError(err?.message || 'The refund could not be recorded.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-label="Record refund">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-5">
        <h3 className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Refund {taka(advance.advance)}</h3>
        <p className="text-xs text-[var(--color-text-muted)]">
          {FLOW_LABEL[advance.flow]} <span className="font-mono">{advance.ref}</span> to {advance.customerName}
          {advance.payerPhone ? ` (${advance.payerPhone})` : advance.customerPhone ? ` (${advance.customerPhone})` : ''}.
          Send the money first, then record it here.
        </p>
        <label className="block text-xs font-semibold">Sent by
          <select value={method} onChange={e => setMethod(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-2 py-2 text-sm">
            <option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="card">Card</option>
          </select>
        </label>
        <label className="block text-xs font-semibold">Refund TrxID
          <input value={txn} onChange={e => setTxn(e.target.value)} required placeholder="e.g. 9BC4D7XQ2L"
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 font-mono text-sm uppercase" />
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold">Cancel</button>
          <button type="submit" disabled={saving || !txn.trim()} className="rounded-lg bg-[#006A4E] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Mark refunded'}
          </button>
        </div>
      </form>
    </div>
  );
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
  const [refunding, setRefunding] = useState<Advance | null>(null);

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
      {refunding && (
        <RefundDialog advance={refunding} onClose={() => setRefunding(null)}
          onDone={() => { setRefunding(null); void refetch(); }} />
      )}
      {t && t.advanceRefundPending > 0 && (
        <button onClick={() => { setView('advances'); setFlow(''); setStatus('refund_pending'); }}
          className="w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-left text-sm font-semibold text-red-700">
          {taka(t.advanceRefundPending)} waiting to be refunded to tourists (vendor or guide cancelled). Show them →
        </button>
      )}
      {t && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Advances Collected', value: taka(t.advanceCollected), note: 'all online advances', color: '#006A4E' },
            { label: 'Held by Platform', value: taka(t.advanceHeld), note: 'released when the order completes', color: '#D4A017' },
            { label: 'Released to Partners', value: taka(t.advanceReleased), note: `commission earned ${taka(t.commissionEarned)}`, color: '#2563EB' },
            { label: 'Refunded', value: taka(t.advanceRefunded), note: 'cancelled orders and bookings', color: '#F42A41' },
            { label: 'Refund Pending', value: taka(t.advanceRefundPending), note: 'vendor or guide cancelled; admin to send back', color: t.advanceRefundPending ? '#F42A41' : '#6B7280' },
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
            {(view === 'advances' ? ['held', 'released', 'refund_pending', 'refunded'] : ['confirmed', 'reported']).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => void refetch()} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold">Refresh</button>
        </div>

        {loading && <p className="p-6 text-sm text-[var(--color-text-muted)]">Loading payments…</p>}
        {error && <p className="p-6 text-sm text-red-600">Couldn't load payments: {error}</p>}
        {!loading && !error && rows.length === 0 && <p className="p-6 text-sm text-[var(--color-text-muted)]">No payments match.</p>}

        {view === 'advances' && advances.length > 0 && (
          <Table head={['Date', 'Flow / Ref', 'Customer', 'Partner', 'Total', 'Advance', 'Method', 'Payer / TrxID', 'Advance', 'Order status', '']}>
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
                <td className={td}>
                  <StatusBadge status={a.advanceStatus} />
                  {a.advanceStatus === 'refunded' && a.refundTransactionId && (
                    <p className="mt-1 font-mono text-[11px] text-[var(--color-text-muted)]">{methodLabel(a.refundMethod)} {a.refundTransactionId}</p>
                  )}
                </td>
                <td className={td}><StatusBadge status={a.status} /></td>
                <td className={td}>
                  {a.advanceStatus === 'refund_pending' && (
                    <button onClick={() => setRefunding(a)} className="whitespace-nowrap rounded-lg bg-[#F42A41] px-3 py-1.5 text-xs font-semibold text-white">Refund</button>
                  )}
                </td>
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
