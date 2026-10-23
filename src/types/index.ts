export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'tourist' | 'vendor' | 'guide' | 'admin';
  createdAt: string;
  verified: boolean;
  status?: 'active' | 'pending' | 'suspended';
}

export interface Tourist extends User {
  role: 'tourist';
  savedPlaces: string[];
  trips: string[];
}

export interface Vendor extends User {
  role: 'vendor';
  shopName: string;
  shopDescription: string;
  shopImage?: string;
  shopCoverImage?: string;
  location: string;
  rating: number;
  totalSales: number;
  products: string[];
}

export interface TourGuide extends User {
  role: 'guide';
  bio: string;
  languages: string[];
  specializations: string[];
  location: string;
  coordinates: { lat: number; lng: number };
  pricePerDay: number;
  rating: number;
  reviewCount: number;
  toursCompleted: number;
  yearsExperience: number;
  isAvailable: boolean;
  isLocationSharing: boolean;
  isPhonePublic?: boolean;
  certifications: string[];
  coverAreas: string[];
  tourTypes: TourType[];
  profileImage: string;
}

export interface TourType {
  name: string;
  duration: string;
  price: number;
  description: string;
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

export interface HeritagePlace {
  id: string;
  name: string;
  nameLocal?: string;
  description: string;
  historicalBackground: string;
  significance: string;
  location: string;
  district: string;
  division: string;
  coordinates: { lat: number; lng: number };
  category: 'mosque' | 'fort' | 'palace' | 'temple' | 'monument' | 'archaeological' | 'natural' | 'museum';
  images: string[];
  rating: number;
  reviewCount: number;
  visitInfo: {
    openTime: string;
    closeTime: string;
    entryFee: string;
    bestTime: string;
  };
  nearbyAttractions: string[];
  tags: string[];
  featured: boolean;
  established?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: 'gi-product' | 'handicraft' | 'clothing' | 'food' | 'jewelry' | 'pottery' | 'other';
  vendor: Vendor;
  vendorId: string;
  rating: number;
  reviewCount: number;
  stock: number;
  tags: string[];
  specifications?: Record<string, string>;
  featured: boolean;
  district?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: 'placed' | 'confirmed' | 'preparing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled';
  totalAmount: number;
  advancePercent?: number;
  commissionPercent?: number;
  advanceAmount?: number;
  codAmount?: number;
  advanceStatus?: 'held' | 'released' | 'refunded';
  shippingAddress: Address;
  paymentMethod: 'bkash' | 'nagad' | 'card' | 'cod';
  createdAt: string;
  updatedAt: string;
  estimatedDelivery: string;
  trackingNumber?: string;
}

export interface Address {
  name: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  division: string;
  postalCode: string;
}

export interface TourGuideBooking {
  id: string;
  guideId: string;
  touristId: string;
  tourType: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'accepted' | 'rejected' | 'awaiting_confirmation' | 'completed' | 'cancelled';
  message: string;
  totalPrice: number;
  advancePercent?: number;
  commissionPercent?: number;
  advanceAmount?: number;
  balanceAmount?: number;
  advanceStatus?: 'held' | 'released' | 'refunded';
  destinations: string[];
  groupSize: number;
  createdAt: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  category: 'cultural' | 'food' | 'market' | 'heritage' | 'festival' | 'religious';
  location: string;
  district: string;
  coordinates?: { lat: number; lng: number };
  startDate: string;
  endDate: string;
  image: string;
  images?: string[];
  featured: boolean;
  isFree: boolean;
  ticketPrice?: number;
  organizer: string;
  tags: string[];
}

export interface Story {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    bio: string;
  };
  category: 'heritage' | 'food' | 'culture' | 'travel' | 'festival' | 'artisan';
  image: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
  featured: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  targetId: string;
  targetType: 'place' | 'product' | 'guide';
  rating: number;
  title?: string;
  content: string;
  photos?: string[];
  createdAt: string;
  helpful: number;
}

export interface TripStop {
  id: string;
  placeId: string;
  placeName: string;
  placeImage: string;
  location: string;
  duration: string;
  notes?: string;
  order: number;
}

export interface TripDay {
  id: string;
  date: string;
  stops: TripStop[];
  notes?: string;
}

export interface TripPlan {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  days: TripDay[];
  destinations: string[];
  status: 'draft' | 'planned' | 'ongoing' | 'completed';
  createdAt: string;
  guideId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'order' | 'review' | 'system' | 'message';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  read: boolean;
  attachments?: string[];
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  participantAvatars: string[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  image?: string;
}

// ─── PRE-ORDER / READY WHEN YOU ARRIVE ───────────────────────────────────────

export interface PreOrderProduct extends Product {
  preOrderEnabled: boolean;
  preparationTime: string;     // e.g. "2 hours"
  pickupLocation: string;      // e.g. "Sonargaon Traditional Market"
  pickupLocationCoords?: { lat: number; lng: number };
  maxAdvanceDays: number;      // how many days ahead you can pre-order
  availableTimeSlots: string[];// e.g. ["10:00 AM", "12:00 PM", "2:00 PM"]
  nearDestinations: string[];  // heritage place IDs this product is near
}

export type PreOrderStatus =
  | 'confirmed'
  | 'advance_paid'
  | 'vendor_accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'arrived'
  | 'qr_verified'
  | 'pickup_payment_pending'
  | 'picked_up'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface PreOrder {
  id: string;
  orderNumber: string;
  touristId: string;
  touristName: string;
  touristPhone: string;
  vendorId: string;
  vendorName: string;
  productId: string;
  productName: string;
  productImage: string;
  destination: string;
  destinationId: string;
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  advancePercent: number;       // default 30
  advancePaid: number;
  remainingAmount: number;
  advancePaymentMethod?: 'bkash' | 'nagad' | 'card';
  pickupPaymentMethod?: 'bkash' | 'nagad' | 'card' | 'cash';
  status: PreOrderStatus;
  qrCode: string;              // mock QR data string
  createdAt: string;
  updatedAt: string;
  preparationTime: string;
  notes?: string;
  cancellationReason?: string;
  refundAmount?: number;
}

export interface PreOrderSettings {
  advancePercent: number;         // default 30
  paymentMethods: ('bkash' | 'nagad' | 'card' | 'cash')[];
  cancellationWindowHours: number;
  advanceRefundPercent: number;
  vendorPreparationCutoffMinutes: number;
  maxPickupTimeSlots: number;
  allowCashAtPickup: boolean;
}
