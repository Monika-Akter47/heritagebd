// Payer number + transaction ID for a manual bKash/Nagad payment ("Send Money"), used until a
// payment gateway is connected. The server validates the same rules (backend/helpers/payments.php).

export type PaymentMethodId = 'bkash' | 'nagad' | 'card' | 'cash';

export interface PaymentProof {
  phone: string;
  transactionId: string;
}

export const emptyPaymentProof: PaymentProof = { phone: '', transactionId: '' };

export const isWalletMethod = (method: string) => method === 'bkash' || method === 'nagad';

export const methodLabel = (method?: string | null) =>
  ({ bkash: 'bKash', nagad: 'Nagad', card: 'Card', cash: 'Cash', cod: 'Cash on delivery' } as Record<string, string>)[method ?? ''] ?? (method || '—');

/** Returns an error message, or null when the proof is complete for this method. */
export function validatePaymentProof(method: string, proof: PaymentProof): string | null {
  if (!isWalletMethod(method)) return null;
  const label = methodLabel(method);
  const digits = proof.phone.replace(/[\s\-()]/g, '').replace(/^\+?880/, '0');
  if (!digits) return `Enter the ${label} number the payment was sent from.`;
  if (!/^01[3-9]\d{8}$/.test(digits)) return 'Enter a valid Bangladeshi mobile number, e.g. 01712345678.';
  const txn = proof.transactionId.trim();
  if (!txn) return `Enter the ${label} transaction ID (TrxID).`;
  if (!/^[A-Za-z0-9]{6,20}$/.test(txn)) return 'The transaction ID should be 6–20 letters and digits, as shown in the payment SMS.';
  return null;
}

interface Props {
  method: string;
  value: PaymentProof;
  onChange: (value: PaymentProof) => void;
  /** Amount to send, shown in the instruction line. */
  amount?: number;
  /** Who is entering it: the payer ("your number") or the receiver ("customer's number"). */
  perspective?: 'payer' | 'receiver';
}

export default function PaymentProofFields({ method, value, onChange, amount, perspective = 'payer' }: Props) {
  if (!isWalletMethod(method)) return null;
  const label = methodLabel(method);
  const phoneLabel = perspective === 'payer' ? `Your ${label} number` : `Customer's ${label} number`;
  const input = 'w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]';
  return (
    <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
      {perspective === 'payer' && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Use <strong>Send Money</strong> in your {label} app{amount !== undefined ? <> to pay <strong>৳{amount.toLocaleString()}</strong></> : null},
          then enter the number you paid from and the TrxID from the confirmation SMS.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
          {phoneLabel}
          <input
            className={input + ' mt-1 font-normal'}
            style={{ borderColor: 'var(--color-border)' }}
            inputMode="tel"
            autoComplete="tel"
            placeholder="01XXXXXXXXX"
            maxLength={16}
            value={value.phone}
            onChange={e => onChange({ ...value, phone: e.target.value })}
          />
        </label>
        <label className="block text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
          Transaction ID (TrxID)
          <input
            className={input + ' mt-1 font-normal uppercase'}
            style={{ borderColor: 'var(--color-border)' }}
            autoCapitalize="characters"
            placeholder="e.g. 9BG7XK2L5M"
            maxLength={20}
            value={value.transactionId}
            onChange={e => onChange({ ...value, transactionId: e.target.value.replace(/\s/g, '') })}
          />
        </label>
      </div>
    </div>
  );
}
