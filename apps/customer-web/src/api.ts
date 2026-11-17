import { supabase } from './supabase';

export interface ShopSession {
  session_token: string;
  shop_id: string;
  shop_name: string;
  shop_slug: string;
  expires_at: string;
}

export interface ServerScan {
  asset_id: string;
  is_valid: boolean;
  page_count: number;
  error_message?: string | null;
}

export interface ServerQuote {
  total_paise: number;
  total_rupees: number;
  total_logical_pages: number;
  total_rendered_sides: number;
  total_physical_sheets: number;
  expires_at: string;
  quote_hash: string;
}

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const developmentApiBase = import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '';

function isSecurePublicApiBase(base: string): boolean {
  try {
    const url = new URL(base);
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    const isLoopback = hostname === 'localhost' || hostname.endsWith('.localhost') ||
      hostname === '::1' || /^127(?:\.|$)/.test(hostname);
    return url.protocol === 'https:' && !isLoopback;
  } catch {
    return false;
  }
}

// Never let a production build send customer traffic to the visitor's machine.
const productionApiBase = configuredApiBase && isSecurePublicApiBase(configuredApiBase) ? configuredApiBase : '';
const API_BASE = (import.meta.env.DEV ? configuredApiBase || developmentApiBase : productionApiBase).replace(/\/$/, '');
export const isApiConfigured = API_BASE.length > 0;

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  if (!API_BASE) {
    throw new Error('The Print Bot API is not configured. Set VITE_API_BASE_URL for this deployment.');
  }

  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.detail || `Request failed (${response.status})`);
  return body as T;
}

export async function openShopSession(qrCode: string): Promise<ShopSession> {
  return request<ShopSession>('/guest/session/from-qr', {
    method: 'POST',
    body: JSON.stringify({ qr_code: qrCode }),
  });
}

export async function scanFile(file: File, token: string): Promise<ServerScan> {
  const form = new FormData();
  form.append('file', file);
  const result = await request<ServerScan>('/documents/scan', { method: 'POST', body: form }, token);
  if (!result.is_valid || !result.asset_id) throw new Error(result.error_message || `${file.name} was rejected by the server.`);
  return result;
}

export async function quoteFiles(items: Array<{ fileId: string; fileName: string; pageCount: number; options: object }>, token: string): Promise<ServerQuote> {
  const result = await request<ServerQuote>('/documents/quote', {
    method: 'POST',
    body: JSON.stringify({
      // The API must validate this against the guest token; this field is kept
      // for backwards-compatible contract decoding and is not authorization.
      shop_id: 'guest-session-bound',
      items: items.map(item => ({ file_id: item.fileId, file_name: item.fileName, page_count: item.pageCount, options: item.options })),
    }),
  }, token);
  return result;
}

export interface CreateOrderPayload {
  customer_email: string;
  customer_phone?: string;
  file_name: string;
  file_size_bytes: number;
  page_count: number;
  options: {
    copies: number;
    color_mode: string;
    paper_size: string;
    duplex_mode: string;
    paper_gsm?: number;
    binding?: string;
    page_range?: string;
    pages_per_sheet?: number;
  };
  quote_hash?: string;
}

export interface PaymentIntent {
  provider: 'RAZORPAY';
  payment_intent_id: string;
  order_id: string;
  shop_id: string;
  amount_paise: number;
  currency: string;
  client_secret: string;
}

export async function createOrder(payload: CreateOrderPayload, token?: string, shopId?: string): Promise<any> {
  const headers: Record<string, string> = {};
  if (shopId) headers['X-Tenant-ID'] = shopId;
  return request<any>('/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  }, token);
}

export async function quoteOrder(
  pageCount: number,
  options: object,
  shopSlug: string,
): Promise<ServerQuote> {
  const { data, error } = await supabase.functions.invoke<ServerQuote>('quote-order', {
    body: { shop_slug: shopSlug, page_count: pageCount, options },
  });
  if (error) {
    const response = error.context;
    if (response instanceof Response) {
      const body = await response.clone().json().catch(() => null) as { detail?: unknown } | null;
      if (typeof body?.detail === 'string') throw new Error(body.detail);
    }
    throw new Error(`Could not load the shop price: ${error.message}`);
  }
  if (!data) throw new Error('The shop pricing service returned no quote.');
  return data;
}

export async function createPaymentIntent(orderId: string, token: string, shopId: string): Promise<PaymentIntent> {
  const headers: Record<string, string> = { 'X-Tenant-ID': shopId };
  const result = await request<PaymentIntent>(`/orders/${encodeURIComponent(orderId)}/payment-intent`, {
    method: 'POST',
    headers,
  }, token);
  if (result.provider !== 'RAZORPAY' || !result.payment_intent_id || !result.client_secret) {
    throw new Error('The server did not return a valid Razorpay payment order.');
  }
  return result;
}

export async function fetchOrderStatus(orderId: string, token?: string, shopId?: string): Promise<any> {
  const headers: Record<string, string> = {};
  if (shopId) headers['X-Tenant-ID'] = shopId;
  return request<any>(`/orders/${orderId}`, {
    method: 'GET',
    headers,
  }, token);
}
