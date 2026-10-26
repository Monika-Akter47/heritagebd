import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PaymentProofFields, { isWalletMethod, methodLabel, validatePaymentProof } from '../../src/components/ui/PaymentProofFields';

// Client-side checks of the bKash/Nagad payment proof (FR-29, FR-33). Oracle: the same rules the
// API enforces (TC-U08/U09, TC-82): BD mobile 01[3-9]XXXXXXXX, TrxID 6–20 letters/digits.

const ok = { phone: '01712345678', transactionId: '9BG7XK2L5M' };

describe('validatePaymentProof', () => {
  // TC-F01 | FR-29 | Unit | EP | P1 | +
  it('TC-F01 accepts a complete bKash proof, including +880 numbers', () => {
    expect(validatePaymentProof('bkash', ok)).toBeNull();
    expect(validatePaymentProof('nagad', { ...ok, phone: '+880 1712-345678' })).toBeNull();
  });

  // TC-F02 | FR-29 | Unit | EP | P1 | −
  it('TC-F02 asks for the number, then the TrxID, naming the wallet', () => {
    expect(validatePaymentProof('nagad', { phone: '', transactionId: '' })).toBe('Enter the Nagad number the payment was sent from.');
    expect(validatePaymentProof('bkash', { ...ok, transactionId: '' })).toBe('Enter the bKash transaction ID (TrxID).');
  });

  // TC-F03 | FR-29 | Unit | BVA | P1 | −
  it.each([
    ['0171234567', false], ['01712345678', true], ['017123456789', false], ['01212345678', false], ['01312345678', true],
  ])('TC-F03 phone %s valid=%s', (phone, valid) => {
    expect(validatePaymentProof('bkash', { ...ok, phone }) === null).toBe(valid);
  });

  // TC-F04 | FR-29 | Unit | BVA | P1 | −
  it.each([
    ['ABCDE', false], ['ABCDEF', true], ['A'.repeat(20), true], ['A'.repeat(21), false], ['AB-123', false],
  ])('TC-F04 TrxID %s valid=%s', (transactionId, valid) => {
    expect(validatePaymentProof('nagad', { ...ok, transactionId }) === null).toBe(valid);
  });

  // TC-F05 | FR-33 | Unit | EP | P2 | +
  it('TC-F05 card and cash need no proof', () => {
    expect(validatePaymentProof('card', { phone: '', transactionId: '' })).toBeNull();
    expect(validatePaymentProof('cash', { phone: '', transactionId: '' })).toBeNull();
    expect(isWalletMethod('cash')).toBe(false);
  });
});

describe('PaymentProofFields', () => {
  // TC-F06 | FR-29 | Unit | EP | P2 | +
  it('TC-F06 shows number and TrxID inputs with the amount only for wallets', () => {
    const wallet = renderToStaticMarkup(<PaymentProofFields method="bkash" value={ok} onChange={() => {}} amount={300} />);
    const card = renderToStaticMarkup(<PaymentProofFields method="card" value={ok} onChange={() => {}} amount={300} />);

    expect(wallet).toContain('Your bKash number');
    expect(wallet).toContain('Transaction ID (TrxID)');
    expect(wallet).toContain('৳300');
    expect(card).toBe('');
  });

  // TC-F07 | FR-33 | Unit | EP | P3 | +
  it('TC-F07 vendor view asks for the customer\'s number and has no send instruction', () => {
    const html = renderToStaticMarkup(<PaymentProofFields method="nagad" value={ok} onChange={() => {}} perspective="receiver" />);

    expect(html).toContain('Customer&#x27;s Nagad number');
    expect(html).not.toContain('Send Money');
  });

  // TC-F08 | FR-23 | Unit | EP | P3 | +
  it('TC-F08 labels every payment method', () => {
    expect(['bkash', 'nagad', 'card', 'cash', 'cod'].map(methodLabel)).toEqual(['bKash', 'Nagad', 'Card', 'Cash', 'Cash on delivery']);
    expect(methodLabel(null)).toBe('—');
  });
});
