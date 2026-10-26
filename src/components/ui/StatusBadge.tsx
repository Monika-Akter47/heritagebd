import Badge from './Badge';

type Variant = 'green' | 'red' | 'gold' | 'gray' | 'blue' | 'orange';

// One readable label and colour per status value, shared by every dashboard and tracking page.
// Keys cover orders, pre-orders, guide bookings, trips, users, verification and payments.
const STATUS: Record<string, [string, Variant]> = {
  // marketplace orders
  placed: ['Placed', 'gold'],
  confirmed: ['Confirmed', 'blue'],
  preparing: ['Preparing', 'gold'],
  shipped: ['Shipped', 'blue'],
  out_for_delivery: ['Out for Delivery', 'blue'],
  delivered: ['Delivered · Awaiting Confirmation', 'orange'],
  completed: ['Completed', 'green'],
  cancelled: ['Cancelled', 'red'],
  // pre-orders
  advance_paid: ['Advance Paid', 'blue'],
  vendor_accepted: ['Vendor Accepted', 'blue'],
  ready_for_pickup: ['Ready for Pickup', 'green'],
  arrived: ['Tourist Arrived', 'orange'],
  qr_verified: ['QR Verified', 'blue'],
  pickup_payment_pending: ['Awaiting Final Payment', 'orange'],
  picked_up: ['Picked Up · Awaiting Receipt', 'orange'],
  refunded: ['Refunded', 'gray'],
  // guide bookings
  pending: ['Pending', 'gold'],
  accepted: ['Accepted', 'blue'],
  rejected: ['Declined', 'red'],
  awaiting_confirmation: ['Tour Finished · Awaiting Confirmation', 'orange'],
  // trips
  draft: ['Draft', 'gray'],
  planned: ['Planned', 'blue'],
  ongoing: ['Ongoing', 'gold'],
  // accounts and verification
  active: ['Active', 'green'],
  suspended: ['Suspended', 'red'],
  unverified: ['Unverified', 'gray'],
  verified: ['Verified', 'green'],
  // payments
  held: ['Held', 'gold'],
  released: ['Released', 'green'],
  reported: ['Awaiting Guide', 'gold'],
};

export function statusLabel(status?: string | null): string {
  if (!status) return '—';
  return STATUS[status]?.[0] ?? status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function statusVariant(status?: string | null): Variant {
  return (status && STATUS[status]?.[1]) || 'gray';
}

export default function StatusBadge({ status, label, size = 'sm', className }: {
  status?: string | null; label?: string; size?: 'sm' | 'md'; className?: string;
}) {
  return (
    <Badge variant={statusVariant(status)} size={size} className={`whitespace-nowrap ${className ?? ''}`}>
      {label ?? statusLabel(status)}
    </Badge>
  );
}
