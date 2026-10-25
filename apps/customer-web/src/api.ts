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

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
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
