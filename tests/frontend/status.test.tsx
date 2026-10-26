import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import StatusBadge, { statusLabel, statusVariant } from '../../src/components/ui/StatusBadge';

// Status display for delivery orders (FR-36), pre-orders (FR-37) and bookings (FR-16).
// Oracle: the status lists in SRS §4.2.4 and §4.4 — every stored value must show a readable label.

const PREORDER_STATUSES = ['confirmed', 'advance_paid', 'vendor_accepted', 'preparing', 'ready_for_pickup', 'arrived',
  'qr_verified', 'pickup_payment_pending', 'picked_up', 'completed', 'cancelled', 'refunded'];
const ORDER_STATUSES = ['placed', 'confirmed', 'preparing', 'shipped', 'out_for_delivery', 'delivered', 'completed', 'cancelled'];

describe('statusLabel', () => {
  // TC-F09 | FR-37 | Unit | EP | P2 | +
  it.each(PREORDER_STATUSES)('TC-F09 pre-order status %s has a readable label', status => {
    const label = statusLabel(status);
    expect(label).not.toContain('_');
    expect(label[0]).toBe(label[0].toUpperCase());
  });

  // TC-F10 | FR-36 | Unit | EP | P2 | +
  it.each(ORDER_STATUSES)('TC-F10 delivery status %s has a readable label and colour', status => {
    expect(statusLabel(status)).not.toContain('_');
    expect(statusVariant(status)).not.toBe('gray');
  });

  // TC-F11 | FR-37 | Unit | EP | P2 | −
  it('TC-F11 unknown or empty status degrades gracefully', () => {
    expect(statusLabel('some_new_state')).toBe('Some New State');
    expect(statusLabel(null)).toBe('—');
    expect(statusVariant('some_new_state')).toBe('gray');
  });

  // TC-F12 | FR-16 | Unit | EP | P3 | +
  it('TC-F12 terminal states use success / danger colours', () => {
    expect(statusVariant('completed')).toBe('green');
    expect(statusVariant('cancelled')).toBe('red');
    expect(statusVariant('rejected')).toBe('red');
  });

  // TC-F13 | FR-37 | Unit | EP | P3 | +
  it('TC-F13 badge renders the label and a custom label override', () => {
    expect(renderToStaticMarkup(<StatusBadge status="pickup_payment_pending" />)).toContain('Awaiting Final Payment');
    expect(renderToStaticMarkup(<StatusBadge status="completed" label="Done" />)).toContain('Done');
  });
});
