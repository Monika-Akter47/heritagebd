import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Clock, Calendar, Shield, ChevronLeft } from 'lucide-react';
import { preordersApi } from '../../services/api';
import { useApiData } from '../../hooks/useApiData';

export default function PreOrderQR() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { data: allOrders, loading } = useApiData(() => preordersApi.list(), [] as any[]);
  const order = allOrders.find((o: any) => o.orderNumber === orderId);

  if (loading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-[var(--color-text-muted)]">{loading ? 'Loading order…' : 'Order not found.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--color-primary)' }} className="text-white py-5 px-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-green-200 hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold">Pickup QR Code</h1>
            <p className="text-green-100 text-xs">Order #{order.orderNumber}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 flex flex-col items-center gap-6">
        {/* Instruction */}
        <p className="text-center text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          Show this QR code to the vendor at pickup.
        </p>

        {/* QR Code card */}
        <div className="w-full bg-white rounded-3xl p-6 shadow-md flex flex-col items-center" style={{ border: '1px solid var(--color-border)' }}>
          <div className="text-xs font-bold tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>ORDER #{order.orderNumber}</div>

          {/* Simulated QR code using CSS grid pattern */}
          <div className="relative w-52 h-52 p-3 bg-white rounded-2xl shadow-inner" style={{ border: '3px solid var(--color-primary)' }}>
            <div className="w-full h-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: '2px' }}>
              {generateQRPattern(order.orderNumber).map((cell, i) => (
                <div
                  key={i}
                  className="rounded-sm"
                  style={{ background: cell ? '#1A1A2E' : 'transparent', aspectRatio: '1' }}
                />
              ))}
            </div>
            {/* Center logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md" style={{ background: 'var(--color-primary)' }}>
                HBD
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs tracking-widest font-mono" style={{ color: 'var(--color-text-muted)' }}>{order.qrCode}</p>
        </div>

        {/* Order details */}
        <div className="w-full bg-white rounded-2xl p-5 space-y-3 shadow-sm" style={{ border: '1px solid var(--color-border)' }}>
          <div className="flex items-start gap-3 text-sm">
            <MapPin size={15} style={{ color: 'var(--color-accent)' }} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Pickup Location</p>
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{order.pickupLocation}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar size={15} style={{ color: 'var(--color-accent)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Date</p>
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {new Date(order.pickupDate).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock size={15} style={{ color: 'var(--color-accent)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Time</p>
              <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{order.pickupTime}</p>
            </div>
          </div>
          <div className="border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Remaining Payment</span>
              <span className="font-bold text-base" style={{ color: 'var(--color-accent)' }}>৳{order.remainingAmount.toLocaleString()}</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Due at pickup ({100 - order.advancePercent}% of total)</p>
          </div>
        </div>

        {/* Security note */}
        <div className="w-full flex items-start gap-3 p-4 rounded-2xl" style={{ background: '#F0FDF4' }}>
          <Shield size={16} style={{ color: 'var(--color-primary)' }} className="mt-0.5 flex-shrink-0" />
          <p className="text-xs" style={{ color: '#166534' }}>
            Your order will be verified by the vendor before pickup. Do not share this QR code with anyone else. This code expires once used.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="w-full py-3.5 rounded-2xl font-semibold text-sm border-2 transition-all hover:bg-green-50"
          style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          Back to Order Tracking
        </button>
      </div>
    </div>
  );
}

function generateQRPattern(seed: string): boolean[] {
  const cells: boolean[] = [];
  for (let i = 0; i < 169; i++) {
    const row = Math.floor(i / 13);
    const col = i % 13;
    // Corner finder patterns
    const isCorner =
      (row < 3 && col < 3) || (row < 3 && col > 9) || (row > 9 && col < 3);
    if (isCorner) { cells.push(true); continue; }
    // Pseudo-random based on seed + position
    const hash = (seed.charCodeAt(i % seed.length) + i * 17 + row * 3 + col * 7) % 3;
    cells.push(hash !== 0);
  }
  return cells;
}
