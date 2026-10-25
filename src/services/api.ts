/**
 * HeritageBD API client.
 *
 * Talks to the PHP + MySQL backend in /backend.
 * Set VITE_API_URL in a .env file to point at your backend
 * (defaults to http://localhost:8080 for local development with
 *  `php -S localhost:8080 index.php` run from the backend/ folder).
 */

import imageManifest from '../data/imageManifest.json';

// Without VITE_API_URL a production build talks to the site it is served from (frontend and
// backend on one host), instead of localhost on the visitor's machine. Image URLs are built
// from this too, so this is what makes stored /api/... image paths work after deployment.
const API_URL = (
  (import.meta as any).env?.VITE_API_URL
  || ((import.meta as any).env?.DEV ? 'http://localhost:8080' : window.location.origin)
).replace(/\/+$/, '');

const TOKEN_KEY = 'heritagebd_token';

// Images committed to the repo are published with the frontend (scripts/build-image-manifest.mjs
// copies them to public/uploads), so they load from the site itself even while the API is asleep
// or down. imageManifest.json lists them; anything not in it, such as photos uploaded after
// deploy, still comes from the API. VITE_IMAGE_BASE_URL can point at another copy of
// heritagebd-data/uploads (e.g. raw.githubusercontent.com/<owner>/<repo>/main/heritagebd-data/uploads
// for a public repo), or be "none" to always use the API.
const IMAGE_BASE_URL = (
  (import.meta as any).env?.VITE_IMAGE_BASE_URL
  ?? `${(import.meta as any).env?.BASE_URL ?? '/'}uploads`
).replace(/\/+$/, '');
const imageFiles: Record<string, string> = imageManifest;

/** Public URL for an uploaded image path such as '/api/product-images/<id>'. */
export function assetUrl(path: string): string {
  const match = path.match(/^\/api\/(product|profile)-images\/([a-f0-9]{32})/i);
  if (match && IMAGE_BASE_URL !== 'none') {
    const dir = match[1].toLowerCase() === 'product' ? 'products' : 'profiles';
    const file = imageFiles[`${dir}/${match[2].toLowerCase()}`];
    if (file) return `${IMAGE_BASE_URL}/${dir}/${file}`;
  }
  return `${API_URL}${path}`;
}

function normalizeImagePaths(value: unknown, direction: 'client' | 'database'): unknown {
  if (typeof value === 'string') {
    let path: string;
    try {
      const parsed = new URL(value, `${API_URL}/`);
      // Accept both the API form and the GitHub form, so images edited in the admin pages are
      // saved back as the host-independent /api/... path.
      const api = parsed.pathname.match(/\/api\/(product-images|profile-images)\/([a-f0-9]{32})$/i);
      const repo = parsed.pathname.match(/\/(products|profiles)\/([a-f0-9]{32})\.(?:jpe?g|png|webp)$/i);
      if (api) path = `/api/${api[1]}/${api[2]}`;
      else if (repo && IMAGE_BASE_URL !== 'none'
        && new URL(value, window.location.href).href.startsWith(new URL(`${IMAGE_BASE_URL}/`, window.location.href).href)) {
        path = `/api/${repo[1] === 'products' ? 'product' : 'profile'}-images/${repo[2]}`;
      } else return value;
    } catch {
      return value;
    }
    return direction === 'database' ? path : assetUrl(path);
  }
  if (Array.isArray(value)) {
    return value.map(item => normalizeImagePaths(item, direction));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeImagePaths(item, direction)]),
    );
  }
  return value;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T = any>(
  path: string,
  options: { method?: string; body?: any; auth?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(normalizeImagePaths(body, 'database')) : undefined,
    });
  } catch {
    throw new ApiError('Unable to reach the HeritageBD server. Check your internet connection and backend configuration, then try again.', 0);
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) throw new ApiError(`Request failed (${res.status})`, res.status);
    throw new ApiError('The server returned an invalid response. Please check the backend configuration.', res.status);
  }
  if (!res.ok || json.success === false) {
    if (res.status === 401 && auth) {
      setToken(null);
      window.dispatchEvent(new Event('heritagebd:unauthorized'));
    }
    throw new ApiError(json.message || `Request failed (${res.status})`, res.status);
  }
  return normalizeImagePaths(json.data, 'client') as T;
}

async function upload<T = any>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, { method: 'POST', headers, body: formData });
  } catch {
    throw new ApiError('Unable to reach the HeritageBD server. Check your internet connection and backend configuration, then try again.', 0);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    if (res.status === 401) {
      setToken(null);
      window.dispatchEvent(new Event('heritagebd:unauthorized'));
    }
    throw new ApiError(json.message || `Upload failed (${res.status})`, res.status);
  }
  return normalizeImagePaths(json.data, 'client') as T;
}

async function fetchProtectedFile(path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, { headers });
  } catch {
    throw new ApiError('Unable to reach the HeritageBD server. Check your internet connection and backend configuration, then try again.', 0);
  }
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setToken(null);
      window.dispatchEvent(new Event('heritagebd:unauthorized'));
    }
    throw new ApiError(json.message || `Request failed (${res.status})`, res.status);
  }
  return res.blob();
}

const get = <T = any>(path: string) => request<T>(path, { method: 'GET' });
const post = <T = any>(path: string, body?: any) => request<T>(path, { method: 'POST', body });
const put = <T = any>(path: string, body?: any) => request<T>(path, { method: 'PUT', body });
const del = <T = any>(path: string) => request<T>(path, { method: 'DELETE' });

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authApi = {
  register: (data: Record<string, any>) => post<{ user: any; token: string }>('/auth/register', data),
  login: (email: string, password: string) => post<{ user: any; token: string }>('/auth/login', { email, password }),
  logout: () => post('/auth/logout'),
  me: () => get<{ user: any }>('/auth/me'),
  updateMe: (data: Record<string, any>) => put<{ user: any }>('/auth/me', data),
  changePassword: (currentPassword: string, newPassword: string) => put('/auth/password', { currentPassword, newPassword }),
  forgotPassword: (email: string) => post('/auth/forgot-password', { email }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    post('/auth/reset-password', { email, otp, newPassword }),
};

export const vendorApi = {
  profile: () => get('/vendor/profile'),
  updateProfile: (data: Record<string, any>) => put('/vendor/profile', data),
  uploadShopImage: async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    const result = await upload<{ url: string }>('/product-images', data);
    return { url: new URL(result.url, API_URL).toString() };
  },
};

export const documentsApi = {
  upload: (file: File, documentType: 'identity' | 'business_license' | 'guide_license' | 'other') => {
    const data = new FormData();
    data.append('file', file);
    data.append('documentType', documentType);
    return upload('/documents', data);
  },
  list: () => get('/documents'),
};

export const productImagesApi = {
  upload: async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    const result = await upload<{ url: string }>('/product-images', data);
    return { url: new URL(result.url, API_URL).toString() };
  },
};

export const profileImagesApi = {
  upload: async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    const result = await upload<{ url: string }>('/profile-images', data);
    return { url: new URL(result.url, API_URL).toString() };
  },
};

export const siteContentApi = {
  homepageImages: () => get<{
    heroImage: string;
    mapImage: string;
    testimonialAvatar1: string;
    testimonialAvatar2: string;
    testimonialAvatar3: string;
  }>('/site-content/homepage-images'),
};

// ---------------------------------------------------------------------------
// Heritage Places
// ---------------------------------------------------------------------------
export const placesApi = {
  list: (params: Record<string, any> = {}) => get(`/places?${new URLSearchParams(params)}`),
  get: (id: string) => get(`/places/${id}`),
  create: (data: Record<string, any>) => post('/places', data),
  update: (id: string, data: Record<string, any>) => put(`/places/${id}`, data),
  remove: (id: string) => del(`/places/${id}`),
  toggleSave: (id: string) => post<{ saved: boolean }>(`/places/${id}/save`),
  saved: () => get('/places/saved'),
  reviews: (id: string) => get(`/places/${id}/reviews`),
};

export const categoriesApi = {
  list: () => get('/categories'),
};

// ---------------------------------------------------------------------------
// Areas & traditional foods
// ---------------------------------------------------------------------------
export interface AreaDivision {
  division: string;
  districts: string[];
}

export type LocalFoodType = 'dish' | 'sweet' | 'snack' | 'drink' | 'fruit' | 'ingredient';

export interface LocalFood {
  id: string;
  name: string;
  nameLocal: string | null;
  district: string;
  division: string;
  type: LocalFoodType;
  description: string;
  whereToTry: string | null;
  image: string | null;
  featured: boolean;
  /** Present when filtered by area: 'local' = that district, 'nearby' = same division. */
  areaMatch?: 'local' | 'nearby';
}

/**
 * Area query shared by products and foods. `area` accepts a division, district or
 * landmark ("Chittagong", "Sreemangal"); `scope: 'district'` keeps "Dhaka" a district;
 * `exact` stops a district being widened to its division.
 */
export interface AreaQuery {
  area: string;
  scope?: 'district';
  exact?: boolean;
}

function areaParams({ area, scope, exact }: AreaQuery): Record<string, string> {
  const params: Record<string, string> = { area };
  if (scope) params.scope = scope;
  if (exact) params.exact = '1';
  return params;
}

export const areasApi = {
  list: () => get<AreaDivision[]>('/areas'),
};

export const localFoodsApi = {
  list: (query?: AreaQuery, extra: Record<string, string> = {}) =>
    get<LocalFood[]>(`/local-foods?${new URLSearchParams({ ...(query ? areaParams(query) : {}), ...extra })}`),
  create: (data: Partial<LocalFood>) => post<LocalFood>('/admin/local-foods', data),
  update: (id: string, data: Partial<LocalFood>) => put<LocalFood>(`/admin/local-foods/${id}`, data),
  remove: (id: string) => del(`/admin/local-foods/${id}`),
};

// ---------------------------------------------------------------------------
// Guides & Bookings
// ---------------------------------------------------------------------------
export const guidesApi = {
  list: (params: Record<string, any> = {}) => get(`/guides?${new URLSearchParams(params)}`),
  get: (id: string) => get(`/guides/${id}`),
  update: (id: string, data: Record<string, any>) => put(`/guides/${id}`, data),
};

export const bookingsApi = {
  create: (data: Record<string, any>) => post('/bookings', data),
  list: () => get('/bookings'),
  update: (id: string, status: string) => put(`/bookings/${id}`, { status }),
};

export const guidePaymentsApi = {
  list: () => get('/guide-payments'),
  report: (bookingId: string, method: 'cash' | 'bkash' | 'nagad', reference?: string) =>
    post('/guide-payments', { bookingId, method, reference }),
  confirm: (id: string) => put(`/guide-payments/${id}/confirm`, {}),
};

export interface PaymentTerms {
  order: number;
  preorder: number;
  guide_booking: number;
  orderCommission: number;
  preorderCommission: number;
  guide_bookingCommission: number;
}

export const paymentTermsApi = {
  get: () => get<PaymentTerms>('/payment-terms'),
};

export const earningsApi = {
  me: () => get<{
    totals: { totalEarning: number; paidViaPlatform: number; collectedCash: number; pendingRelease: number };
    settlements: any[];
    byMonth: { month: string; amount: number }[];
  }>('/earnings/me'),
};

// ---------------------------------------------------------------------------
// Marketplace
// ---------------------------------------------------------------------------
export const productsApi = {
  list: (params: Record<string, any> = {}) => get(`/products?${new URLSearchParams(params)}`),
  byArea: (query: AreaQuery, extra: Record<string, string> = {}) =>
    get(`/products?${new URLSearchParams({ ...areaParams(query), ...extra })}`),
  get: (id: string) => get(`/products/${id}`),
  create: (data: Record<string, any>) => post('/products', data),
  update: (id: string, data: Record<string, any>) => put(`/products/${id}`, data),
  remove: (id: string) => del(`/products/${id}`),
};

export const cartApi = {
  get: () => get('/cart'),
  add: (productId: string, quantity = 1) => post('/cart', { productId, quantity }),
  update: (productId: string, quantity: number) => put(`/cart/${productId}`, { quantity }),
  remove: (productId: string) => del(`/cart/${productId}`),
  clear: () => del('/cart'),
};

export const ordersApi = {
  create: (data: Record<string, any>) => post('/orders', data),
  list: () => get('/orders'),
  get: (id: string) => get(`/orders/${encodeURIComponent(id)}`),
  update: (id: string, data: Record<string, any>) => put(`/orders/${id}`, data),
};

export const preordersApi = {
  settings: () => get('/preorders/settings'),
  updateSettings: (data: Record<string, any>) => put('/preorders/settings', data),
  create: (data: Record<string, any>) => post('/preorders', data),
  list: () => get('/preorders'),
  get: (id: string) => get(`/preorders/${encodeURIComponent(id)}`),
  update: (id: string, data: Record<string, any>) => put(`/preorders/${id}`, data),
};

// ---------------------------------------------------------------------------
// Events & Stories
// ---------------------------------------------------------------------------
export const eventsApi = {
  list: (params: Record<string, any> = {}) => get(`/events?${new URLSearchParams(params)}`),
  get: (id: string) => get(`/events/${id}`),
  updateImage: (id: string, image: string) => put(`/admin/events/${id}`, { image }),
};

export const storiesApi = {
  list: (params: Record<string, any> = {}) => get(`/stories?${new URLSearchParams(params)}`),
  get: (id: string) => get(`/stories/${id}`),
  updateImage: (id: string, image: string) => put(`/admin/stories/${id}`, { image }),
};

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export const reviewsApi = {
  list: (targetType: string, targetId: string) => get(`/reviews?targetType=${targetType}&targetId=${targetId}`),
  mine: () => get('/reviews?mine=1'),
  create: (data: Record<string, any>) => post('/reviews', data),
};

// ---------------------------------------------------------------------------
// Trip planner
// ---------------------------------------------------------------------------
export const tripsApi = {
  list: () => get('/trips'),
  get: (id: string) => get(`/trips/${id}`),
  create: (data: Record<string, any>) => post('/trips', data),
  update: (id: string, data: Record<string, any>) => put(`/trips/${id}`, data),
  remove: (id: string) => del(`/trips/${id}`),
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export const notificationsApi = {
  list: () => get('/notifications'),
  markRead: (id: string) => put(`/notifications/${id}/read`),
  markAllRead: () => put('/notifications/read-all'),
};

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------
export const chatApi = {
  conversations: () => get('/conversations'),
  startConversation: (participantId: string) => post('/conversations', { participantId }),
  messages: (conversationId: string) => get(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string, attachments: string[] = []) =>
    post(`/conversations/${conversationId}/messages`, { content, attachments }),
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export const adminApi = {
  stats: () => get('/admin/stats'),
  earnings: () => get('/admin/earnings'),
  commissionSettings: () => get('/admin/commission-settings'),
  updateCommissionSettings: (settings: { flow: string; advancePercent: number; commissionPercent: number }[]) =>
    put('/admin/commission-settings', { settings }),
  users: (params: Record<string, any> = {}) => get(`/admin/users?${new URLSearchParams(params)}`),
  guides: () => get('/admin/guides'),
  pendingGuides: () => get('/admin/guides/pending'),
  verifyGuide: (id: string, status: 'verified' | 'rejected') => put(`/admin/guides/${id}/verify`, { status }),
  pendingVendors: () => get('/admin/vendors/pending'),
  allVendors: (params: Record<string, any> = {}) => get(`/admin/vendors?${new URLSearchParams(params)}`),
  verifyVendor: (id: string, status: 'verified' | 'rejected') => put(`/admin/vendors/${id}/verify`, { status }),
  documents: () => get('/admin/documents'),
  downloadDocument: (id: string) => fetchProtectedFile(`/admin/documents/${encodeURIComponent(id)}/download`),
  setUserStatus: (id: string, status: 'active' | 'suspended') => put(`/admin/users/${id}/status`, { status }),
  reviews: () => get('/admin/reviews'),
  deleteReview: (id: string) => del(`/admin/reviews/${id}`),
  createEvent: (data: Record<string, any>) => post('/admin/events', data),
  updateHomepageImages: (data: Record<string, string>) => put('/admin/homepage-images', data),
  updateProductImage: (id: string, data: Record<string, any>) => put(`/products/${id}`, data),
  deleteEvent: (id: string) => del(`/admin/events/${id}`),
  createStory: (data: Record<string, any>) => post('/admin/stories', data),
  deleteStory: (id: string) => del(`/admin/stories/${id}`),
};
