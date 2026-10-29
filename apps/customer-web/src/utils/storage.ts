import { PlacedOrder, Language } from '../types';

const THEME_KEY = 'pb_theme';
const LANG_KEY = 'pb_lang';

export function getStoredTheme(): 'light' | 'dark' {
  try {
    const val = localStorage.getItem(THEME_KEY);
    if (val === 'dark' || val === 'light') return val;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function setStoredTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
  } catch {
    // ignore
  }
}

export function getStoredLanguage(): Language {
  try {
    const val = localStorage.getItem(LANG_KEY);
    if (val === 'en' || val === 'ta' || val === 'hi') return val;
  } catch {
    // ignore
  }
  return 'en';
}

export function setStoredLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // ignore
  }
}

export function getOrdersKey(shopId: string): string {
  return `pb_orders_${shopId}`;
}

export function loadStoredOrders(shopId: string): PlacedOrder[] {
  try {
    const data = localStorage.getItem(getOrdersKey(shopId));
    if (!data) return [];
    return JSON.parse(data) as PlacedOrder[];
  } catch {
    return [];
  }
}

export function saveOrderToStorage(order: PlacedOrder): void {
  try {
    const key = getOrdersKey(order.shopId);
    const existing = loadStoredOrders(order.shopId);
    const updated = [order, ...existing.filter((o) => o.orderId !== order.orderId)];
    localStorage.setItem(key, JSON.stringify(updated.slice(0, 30)));
  } catch {
    // ignore
  }
}

export function updateStoredOrderStatus(shopId: string, orderId: string, status: PlacedOrder['status']): void {
  try {
    const key = getOrdersKey(shopId);
    const orders = loadStoredOrders(shopId);
    const updated = orders.map((o) => (o.orderId === orderId ? { ...o, status } : o));
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // ignore
  }
}
