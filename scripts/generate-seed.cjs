const fs = require('fs');
const path = require('path');
const d = require('./mock-data.json');

const out = [];
const push = (s) => out.push(s);

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? '1' : '0';
  return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}
function dt(v) {
  if (!v) return 'NOW()';
  // normalize date-only or ISO datetime strings for MySQL
  return esc(String(v).replace('T', ' '));
}

// A single bcrypt hash for all demo accounts, password: "password123"
// (generated with PHP password_hash('password123', PASSWORD_BCRYPT))
const DEMO_HASH = '$2y$10$lNSD45SLV8H9/stVd8mmZOYCGhArmkcLDMUM.5wz.8XGGIYbvWohe';

push('-- ============================================================================');
push('-- HeritageBD - Demo Seed Data (generated from src/data/mockData.ts)');
push('-- All demo accounts use the password: password123');
push('-- ============================================================================');
push('SET NAMES utf8mb4;');
push('SET FOREIGN_KEY_CHECKS = 0;');
push('USE heritagebd;\n');

// ---------------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------------
const categories = [
  ['mosque', 'Mosques', 'landmark'],
  ['fort', 'Forts', 'castle'],
  ['palace', 'Palaces', 'building'],
  ['temple', 'Temples', 'landmark'],
  ['monument', 'Monuments', 'monument'],
  ['archaeological', 'Archaeological Sites', 'pickaxe'],
  ['natural', 'Natural Wonders', 'mountain'],
  ['museum', 'Museums', 'museum'],
];
push('-- Categories');
for (const [id, name, icon] of categories) {
  push(`INSERT INTO categories (id, name, icon) VALUES (${esc(id)}, ${esc(name)}, ${esc(icon)});`);
}
push('');

// ---------------------------------------------------------------------------
// USERS: admin + tourist demo accounts
// ---------------------------------------------------------------------------
push('-- Core demo accounts');
push(`INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES
('admin1', 'Admin User', 'admin@heritagebd.com', '${DEMO_HASH}', '+880 1700-000000', NULL, 'admin', 1, 'active');`);
push(`INSERT INTO admins (user_id, permissions) VALUES ('admin1', '["all"]');`);
push(`INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES
('tourist1', 'Monika Rahman', 'tourist@heritagebd.com', '${DEMO_HASH}', '+880 171-234-5678', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&auto=format', 'tourist', 1, 'active');`);
push(`INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES
('tourist-1', 'Monika Rahman', 'monika@heritagebd.com', '${DEMO_HASH}', '+880 171-234-5678', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&auto=format', 'tourist', 1, 'active');`);
push('');

// ---------------------------------------------------------------------------
// VENDORS (mockVendors + vendors embedded in mockPreOrderProducts)
// ---------------------------------------------------------------------------
push('-- Vendors');
const vendorMap = new Map();
for (const v of d.mockVendors) vendorMap.set(v.id, v);
for (const p of d.mockPreOrderProducts) if (p.vendor && !vendorMap.has(p.vendor.id)) vendorMap.set(p.vendor.id, p.vendor);

for (const v of vendorMap.values()) {
  const email = v.email || `${v.id}@heritagebd.com`;
  push(`INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES (${esc(v.id)}, ${esc(v.name)}, ${esc(email)}, '${DEMO_HASH}', ${esc(v.phone || null)}, ${esc(v.avatar || null)}, 'vendor', 1, 'active');`);
  push(`INSERT INTO vendors (user_id, shop_name, shop_description, shop_image, location, rating, total_sales, verification_status) VALUES (${esc(v.id)}, ${esc(v.shopName)}, ${esc(v.shopDescription || null)}, ${esc(v.shopImage || null)}, ${esc(v.location || null)}, ${esc(v.rating || 0)}, ${esc(v.totalSales || 0)}, 'verified');`);
}
push('');

// ---------------------------------------------------------------------------
// GUIDES
// ---------------------------------------------------------------------------
push('-- Guides');
for (const g of d.mockGuides) {
  push(`INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES (${esc(g.id)}, ${esc(g.name)}, ${esc(g.email)}, '${DEMO_HASH}', ${esc(g.phone || null)}, ${esc(g.profileImage || null)}, 'guide', 1, 'active');`);
  push(`INSERT INTO guides (user_id, bio, location, lat, lng, price_per_day, rating, review_count, tours_completed, years_experience, is_available, is_location_sharing, profile_image, verification_status) VALUES (${esc(g.id)}, ${esc(g.bio || null)}, ${esc(g.location || null)}, ${esc(g.coordinates?.lat || 0)}, ${esc(g.coordinates?.lng || 0)}, ${esc(g.pricePerDay || 0)}, ${esc(g.rating || 0)}, ${esc(g.reviewCount || 0)}, ${esc(g.toursCompleted || 0)}, ${esc(g.yearsExperience || 0)}, ${esc(!!g.isAvailable)}, ${esc(!!g.isLocationSharing)}, ${esc(g.profileImage || null)}, 'verified');`);
  for (const lang of g.languages || []) push(`INSERT INTO guide_languages (guide_id, language) VALUES (${esc(g.id)}, ${esc(lang)});`);
  for (const spec of g.specializations || []) push(`INSERT INTO guide_specializations (guide_id, specialization) VALUES (${esc(g.id)}, ${esc(spec)});`);
  for (const c of g.certifications || []) push(`INSERT INTO guide_certifications (guide_id, certification) VALUES (${esc(g.id)}, ${esc(c)});`);
  for (const a of g.coverAreas || []) push(`INSERT INTO guide_cover_areas (guide_id, area) VALUES (${esc(g.id)}, ${esc(a)});`);
  for (const t of g.tourTypes || []) push(`INSERT INTO guide_tour_types (guide_id, name, duration, price, description) VALUES (${esc(g.id)}, ${esc(t.name)}, ${esc(t.duration)}, ${esc(t.price)}, ${esc(t.description || null)});`);
}
push('');

// ---------------------------------------------------------------------------
// HERITAGE PLACES
// ---------------------------------------------------------------------------
push('-- Heritage Places');
const placeIds = new Set();
for (const p of d.mockPlaces) {
  placeIds.add(p.id);
  push(`INSERT INTO heritage_places (id, name, name_local, description, historical_background, significance, location, district, division, lat, lng, category, rating, review_count, open_time, close_time, entry_fee, best_time, featured, established) VALUES (${esc(p.id)}, ${esc(p.name)}, ${esc(p.nameLocal || null)}, ${esc(p.description)}, ${esc(p.historicalBackground || null)}, ${esc(p.significance || null)}, ${esc(p.location)}, ${esc(p.district)}, ${esc(p.division)}, ${esc(p.coordinates?.lat || 0)}, ${esc(p.coordinates?.lng || 0)}, ${esc(p.category)}, ${esc(p.rating || 0)}, ${esc(p.reviewCount || 0)}, ${esc(p.visitInfo?.openTime || null)}, ${esc(p.visitInfo?.closeTime || null)}, ${esc(p.visitInfo?.entryFee || null)}, ${esc(p.visitInfo?.bestTime || null)}, ${esc(!!p.featured)}, ${esc(p.established || null)});`);
  (p.images || []).forEach((url, i) => push(`INSERT INTO place_images (place_id, url, sort_order) VALUES (${esc(p.id)}, ${esc(url)}, ${i});`));
  for (const tag of p.tags || []) push(`INSERT INTO place_tags (place_id, tag) VALUES (${esc(p.id)}, ${esc(tag)});`);
  for (const n of p.nearbyAttractions || []) push(`INSERT INTO place_nearby (place_id, nearby_name) VALUES (${esc(p.id)}, ${esc(n)});`);
}
push('');

// ---------------------------------------------------------------------------
// PRODUCTS (regular marketplace + pre-order enabled)
// ---------------------------------------------------------------------------
push('-- Marketplace Products');
const productIds = new Set();
for (const p of d.mockProducts) {
  productIds.add(p.id);
  const vendorId = p.vendor ? p.vendor.id : p.vendorId;
  push(`INSERT INTO products (id, vendor_id, name, description, price, original_price, category, rating, review_count, stock, featured, district, preorder_enabled) VALUES (${esc(p.id)}, ${esc(vendorId)}, ${esc(p.name)}, ${esc(p.description)}, ${esc(p.price)}, ${esc(p.originalPrice || null)}, ${esc(p.category)}, ${esc(p.rating || 0)}, ${esc(p.reviewCount || 0)}, ${esc(p.stock ?? 10)}, ${esc(!!p.featured)}, ${esc(p.district || null)}, 0);`);
  (p.images || []).forEach((url, i) => push(`INSERT INTO product_images (product_id, url, sort_order) VALUES (${esc(p.id)}, ${esc(url)}, ${i});`));
  for (const tag of p.tags || []) push(`INSERT INTO product_tags (product_id, tag) VALUES (${esc(p.id)}, ${esc(tag)});`);
  if (p.specifications) for (const [k, v] of Object.entries(p.specifications)) push(`INSERT INTO product_specifications (product_id, spec_key, spec_value) VALUES (${esc(p.id)}, ${esc(k)}, ${esc(v)});`);
}
push('');

push('-- Pre-order Enabled Products ("Ready When You Arrive")');
for (const p of d.mockPreOrderProducts) {
  productIds.add(p.id);
  const vendorId = p.vendor ? p.vendor.id : p.vendorId;
  push(`INSERT INTO products (id, vendor_id, name, description, price, category, rating, review_count, stock, featured, district, preorder_enabled, preparation_time, pickup_location, pickup_lat, pickup_lng, max_advance_days) VALUES (${esc(p.id)}, ${esc(vendorId)}, ${esc(p.name)}, ${esc(p.description)}, ${esc(p.price)}, ${esc(p.category)}, ${esc(p.rating || 0)}, ${esc(p.reviewCount || 0)}, ${esc(p.stock ?? 20)}, ${esc(!!p.featured)}, ${esc(p.district || null)}, 1, ${esc(p.preparationTime || null)}, ${esc(p.pickupLocation || null)}, ${esc(p.pickupLocationCoords?.lat || null)}, ${esc(p.pickupLocationCoords?.lng || null)}, ${esc(p.maxAdvanceDays || null)});`);
  (p.images || []).forEach((url, i) => push(`INSERT INTO product_images (product_id, url, sort_order) VALUES (${esc(p.id)}, ${esc(url)}, ${i});`));
  for (const tag of p.tags || []) push(`INSERT INTO product_tags (product_id, tag) VALUES (${esc(p.id)}, ${esc(tag)});`);
  for (const s of p.availableTimeSlots || []) push(`INSERT INTO product_time_slots (product_id, slot_label) VALUES (${esc(p.id)}, ${esc(s)});`);
  for (const nd of p.nearDestinations || []) {
    if (placeIds.has(nd)) push(`INSERT INTO product_near_destinations (product_id, place_id) VALUES (${esc(p.id)}, ${esc(nd)});`);
  }
}
push('');

// ---------------------------------------------------------------------------
// EVENTS
// ---------------------------------------------------------------------------
push('-- Events');
for (const e of d.mockEvents) {
  push(`INSERT INTO events (id, name, description, category, location, district, lat, lng, start_date, end_date, image, featured, is_free, ticket_price, organizer) VALUES (${esc(e.id)}, ${esc(e.name)}, ${esc(e.description || null)}, ${esc(e.category)}, ${esc(e.location)}, ${esc(e.district)}, ${esc(e.coordinates?.lat || null)}, ${esc(e.coordinates?.lng || null)}, ${dt(e.startDate)}, ${dt(e.endDate)}, ${esc(e.image)}, ${esc(!!e.featured)}, ${esc(e.isFree !== false)}, ${esc(e.ticketPrice || null)}, ${esc(e.organizer || null)});`);
  for (const url of e.images || []) push(`INSERT INTO event_images (event_id, url) VALUES (${esc(e.id)}, ${esc(url)});`);
  for (const t of e.tags || []) push(`INSERT INTO event_tags (event_id, tag) VALUES (${esc(e.id)}, ${esc(t)});`);
}
push('');

// ---------------------------------------------------------------------------
// STORIES
// ---------------------------------------------------------------------------
push('-- Stories');
for (const s of d.mockStories) {
  push(`INSERT INTO stories (id, title, excerpt, content, author_name, author_avatar, author_bio, category, image, read_time, featured, published_at) VALUES (${esc(s.id)}, ${esc(s.title)}, ${esc(s.excerpt || null)}, ${esc(s.content)}, ${esc(s.author?.name || 'HeritageBD')}, ${esc(s.author?.avatar || null)}, ${esc(s.author?.bio || null)}, ${esc(s.category)}, ${esc(s.image)}, ${esc(s.readTime || null)}, ${esc(!!s.featured)}, ${dt(s.publishedAt)});`);
  for (const t of s.tags || []) push(`INSERT INTO story_tags (story_id, tag) VALUES (${esc(s.id)}, ${esc(t)});`);
}
push('');

// ---------------------------------------------------------------------------
// REVIEWS
// ---------------------------------------------------------------------------
push('-- Reviews');
for (const r of d.mockReviews) {
  push(`INSERT INTO reviews (id, user_id, target_id, target_type, rating, title, content, helpful, created_at) VALUES (${esc(r.id)}, ${esc(r.userId === 'u1' ? 'tourist1' : r.userId)}, ${esc(r.targetId)}, ${esc(r.targetType)}, ${esc(r.rating)}, ${esc(r.title || null)}, ${esc(r.content)}, ${esc(r.helpful || 0)}, ${dt(r.createdAt)});`);
  for (const url of r.photos || []) push(`INSERT INTO review_photos (review_id, url) VALUES (${esc(r.id)}, ${esc(url)});`);
}
push('');

// The mockReviews reference userId "u1" which isn't otherwise seeded - add it as a lightweight tourist.
out.splice(out.findIndex(l => l.startsWith('-- Reviews')), 0,
  `INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status) VALUES ('u1', 'Sarah Mitchell', 'sarah.reviewer@example.com', '${DEMO_HASH}', NULL, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&auto=format', 'tourist', 1, 'active') ON DUPLICATE KEY UPDATE name=name;`);

// ---------------------------------------------------------------------------
// TRIP PLANS
// ---------------------------------------------------------------------------
push('-- Trip Plans');
for (const t of d.mockTripPlans) {
  push(`INSERT INTO trip_plans (id, user_id, name, description, start_date, end_date, status, created_at) VALUES (${esc(t.id)}, ${esc(t.userId)}, ${esc(t.name)}, ${esc(t.description || null)}, ${esc(t.startDate)}, ${esc(t.endDate)}, ${esc(t.status || 'draft')}, ${dt(t.createdAt)});`);
  for (const dest of t.destinations || []) push(`INSERT INTO trip_destinations (trip_id, destination) VALUES (${esc(t.id)}, ${esc(dest)});`);
  (t.days || []).forEach((day, di) => {
    push(`INSERT INTO trip_days (id, trip_id, day_date, notes, sort_order) VALUES (${esc(day.id)}, ${esc(t.id)}, ${esc(day.date)}, ${esc(day.notes || null)}, ${di});`);
    (day.stops || []).forEach((stop, si) => {
      const placeId = placeIds.has(stop.placeId) ? stop.placeId : null;
      push(`INSERT INTO trip_stops (id, day_id, place_id, place_name, place_image, location, duration, notes, sort_order) VALUES (${esc(stop.id)}, ${esc(day.id)}, ${esc(placeId)}, ${esc(stop.placeName)}, ${esc(stop.placeImage || null)}, ${esc(stop.location || null)}, ${esc(stop.duration || null)}, ${esc(stop.notes || null)}, ${esc(stop.order ?? si)});`);
    });
  });
}
push('');

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------
push('-- Notifications');
for (const n of d.mockNotifications) {
  push(`INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at) VALUES (${esc(n.id)}, ${esc(n.userId)}, ${esc(n.title)}, ${esc(n.message)}, ${esc(n.type)}, ${esc(!!n.read)}, ${esc(n.link || null)}, ${dt(n.createdAt)});`);
}
push('');

// ---------------------------------------------------------------------------
// CONVERSATIONS + MESSAGES
// ---------------------------------------------------------------------------
push('-- Conversations & Messages');
for (const c of d.mockConversations) {
  push(`INSERT INTO conversations (id, last_message, last_message_at) VALUES (${esc(c.id)}, ${esc(c.lastMessage || null)}, ${dt(c.lastMessageAt)});`);
  (c.participants || []).forEach((uid, i) => {
    const unread = i === 0 ? (c.unreadCount || 0) : 0;
    push(`INSERT INTO conversation_participants (conversation_id, user_id, unread_count) VALUES (${esc(c.id)}, ${esc(uid)}, ${esc(unread)});`);
  });
}
for (const [convId, msgs] of Object.entries(d.mockMessages)) {
  for (const m of msgs) {
    push(`INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) VALUES (${esc(m.id)}, ${esc(convId)}, ${esc(m.senderId)}, ${esc(m.content)}, ${esc(!!m.read)}, ${dt(m.createdAt)});`);
  }
}
push('');

// ---------------------------------------------------------------------------
// PREORDER SETTINGS
// ---------------------------------------------------------------------------
push('-- Pre-order Settings');
const ps = d.mockPreOrderSettings;
push(`INSERT INTO preorder_settings (id, advance_percent, payment_methods, cancellation_window_hours, advance_refund_percent, vendor_preparation_cutoff_minutes, max_pickup_time_slots, allow_cash_at_pickup) VALUES (1, ${esc(ps.advancePercent)}, ${esc(JSON.stringify(ps.paymentMethods))}, ${esc(ps.cancellationWindowHours)}, ${esc(ps.advanceRefundPercent)}, ${esc(ps.vendorPreparationCutoffMinutes)}, ${esc(ps.maxPickupTimeSlots)}, ${esc(!!ps.allowCashAtPickup)});`);
push('');

// ---------------------------------------------------------------------------
// PREORDERS
// ---------------------------------------------------------------------------
push('-- Pre-orders');
for (const p of d.mockPreOrders) {
  const destId = placeIds.has(p.destinationId) ? p.destinationId : null;
  push(`INSERT INTO preorders (id, order_number, tourist_id, vendor_id, product_id, destination_id, pickup_location, pickup_date, pickup_time, quantity, unit_price, total_amount, advance_percent, advance_paid, remaining_amount, advance_payment_method, status, qr_code, preparation_time, notes, created_at, updated_at) VALUES (${esc(p.id)}, ${esc(p.orderNumber)}, ${esc(p.touristId)}, ${esc(p.vendorId)}, ${esc(p.productId)}, ${esc(destId)}, ${esc(p.pickupLocation)}, ${esc(p.pickupDate)}, ${esc(p.pickupTime)}, ${esc(p.quantity)}, ${esc(p.unitPrice)}, ${esc(p.totalAmount)}, ${esc(p.advancePercent)}, ${esc(p.advancePaid)}, ${esc(p.remainingAmount)}, ${esc(p.advancePaymentMethod || null)}, ${esc(p.status)}, ${esc(p.qrCode)}, ${esc(p.preparationTime || null)}, ${esc(p.notes || null)}, ${dt(p.createdAt)}, ${dt(p.updatedAt)});`);
}
push('');

// ---------------------------------------------------------------------------
// ORDERS (marketplace)
// ---------------------------------------------------------------------------
push('-- Orders');
for (const o of d.mockOrders) {
  push(`INSERT INTO orders (id, user_id, status, total_amount, ship_name, ship_phone, ship_address, ship_city, ship_district, ship_division, ship_postal_code, payment_method, tracking_number, estimated_delivery, created_at) VALUES (${esc(o.id)}, ${esc(o.userId)}, ${esc(o.status)}, ${esc(o.totalAmount)}, ${esc(o.shippingAddress?.name)}, ${esc(o.shippingAddress?.phone)}, ${esc(o.shippingAddress?.address)}, ${esc(o.shippingAddress?.city)}, ${esc(o.shippingAddress?.district)}, ${esc(o.shippingAddress?.division)}, ${esc(o.shippingAddress?.postalCode || null)}, ${esc(o.paymentMethod)}, ${esc(o.trackingNumber || null)}, ${esc(o.estimatedDelivery || null)}, ${dt(o.createdAt)});`);
  for (const item of o.items || []) {
    if (productIds.has(item.product.id)) {
      push(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (${esc(o.id)}, ${esc(item.product.id)}, ${esc(item.quantity)}, ${esc(item.price ?? item.product.price)});`);
    }
  }
}
push('');

push('SET FOREIGN_KEY_CHECKS = 1;');

fs.writeFileSync(path.join(__dirname, '../backend/database/seed.sql'), out.join('\n'));
console.log('Wrote seed.sql with', out.length, 'statements');
