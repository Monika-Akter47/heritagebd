import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CartItem, Product, Notification, User } from '../types';
import { authApi, cartApi, notificationsApi, getToken, setToken, ApiError } from '../services/api';

interface AppContextType {
  currentUser: User | null;
  userRole: 'tourist' | 'vendor' | 'guide' | 'admin' | null;
  cart: CartItem[];
  notifications: Notification[];
  unreadCount: number;
  actionError: string | null;
  clearActionError: () => void;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, any>) => Promise<User>;
  logout: () => void;
  updateCurrentUser: (user: User) => void;
  addToCart: (product: Product, quantity?: number) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  updateCartQty: (productId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  markNotificationRead: (id: string) => Promise<boolean>;
  markAllNotificationsRead: () => Promise<boolean>;
  cartTotal: number;
  cartCount: number;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'tourist' | 'vendor' | 'guide' | 'admin' | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // On mount, restore the session from a saved token (if any) by calling /auth/me.
  useEffect(() => {
    const clearAuthentication = () => {
      setCurrentUser(null);
      setUserRole(null);
      setCart([]);
      setNotifications([]);
      setActionError(null);
    };
    window.addEventListener('heritagebd:unauthorized', clearAuthentication);
    return () => window.removeEventListener('heritagebd:unauthorized', clearAuthentication);
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ user }) => {
        setCurrentUser(user);
        setUserRole(user.role);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) setToken(null);
        else console.error('Could not restore the saved HeritageBD session.', error);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  // Whenever we have a logged-in user, pull their cart + notifications from the server.
  useEffect(() => {
    if (!currentUser) {
      setCart([]);
      setNotifications([]);
      return;
    }
    cartApi
      .get()
      .then((items: any[]) =>
        setCart(items.map((i) => ({ product: i.product, quantity: i.quantity })))
      )
      .catch((error) => setActionError(error instanceof Error ? error.message : 'Could not load your cart.'));
    notificationsApi.list().then(setNotifications).catch((error) => {
      setActionError(error instanceof Error ? error.message : 'Could not load your notifications.');
    });
    // Poll for new notifications every 20 s while signed in (HTTP polling, not push).
    const timer = window.setInterval(() => {
      if (!document.hidden) notificationsApi.list().then(setNotifications).catch(() => {});
    }, 20000);
    return () => window.clearInterval(timer);
  }, [currentUser?.id]);

  const login = useCallback(async (email: string, password: string) => {
    const { user, token } = await authApi.login(email, password);
    setToken(token);
    setCurrentUser(user);
    setUserRole(user.role);
    setActionError(null);
    return user;
  }, []);

  const register = useCallback(async (data: Record<string, any>) => {
    const { user, token } = await authApi.register(data);
    setToken(token);
    setCurrentUser(user);
    setUserRole(user.role);
    setActionError(null);
    return user;
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch((error) => {
      console.error('Could not revoke the HeritageBD session on the server.', error);
    });
    setToken(null);
    setCurrentUser(null);
    setUserRole(null);
    setCart([]);
    setNotifications([]);
    setActionError(null);
  }, []);

  const addToCart = useCallback(async (product: Product, quantity = 1) => {
    try {
      if (getToken()) await cartApi.add(product.id, quantity);
      setCart(prev => {
        const existing = prev.find(item => item.product.id === product.id);
        if (existing) {
          return prev.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { product, quantity }];
      });
      setActionError(null);
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not add this product to your cart.');
      return false;
    }
  }, []);

  const removeFromCart = useCallback(async (productId: string) => {
    try {
      if (getToken()) await cartApi.remove(productId);
      setCart(prev => prev.filter(item => item.product.id !== productId));
      setActionError(null);
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not remove this product from your cart.');
      return false;
    }
  }, []);

  const updateCartQty = useCallback(async (productId: string, quantity: number) => {
    try {
      if (getToken()) await cartApi.update(productId, quantity);
      if (quantity <= 0) {
        setCart(prev => prev.filter(item => item.product.id !== productId));
      } else {
        setCart(prev =>
          prev.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
          )
        );
      }
      setActionError(null);
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update your cart.');
      return false;
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      if (getToken()) await cartApi.clear();
      setCart([]);
      setActionError(null);
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not clear your cart.');
      return false;
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      if (getToken()) await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
      setActionError(null);
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not mark the notification as read.');
      return false;
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      if (getToken()) await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setActionError(null);
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not mark notifications as read.');
      return false;
    }
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        userRole,
        cart,
        notifications,
        unreadCount,
        actionError,
        clearActionError: () => setActionError(null),
        authLoading,
        login,
        register,
        logout,
        updateCurrentUser: setCurrentUser,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        markNotificationRead,
        markAllNotificationsRead,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Re-export ApiError so pages can `instanceof` check it without importing services/api directly.
export { ApiError };
