import { supabase } from '../supabase';
import { ShopSession } from '../types';

/**
 * Resolves the shop slug/subdomain from:
 * 1. Hostname subdomain: e.g. "test1.printbotak.vercel.app" -> "test1"
 * 2. Localhost subdomain: e.g. "test1.localhost:3000" -> "test1"
 * 3. Query string parameter: e.g. "?shop=test1" or "?qr=test1"
 * 4. Path routing: e.g. "/shop/test1" or "/s/test1"
 */
export function resolveShopSlugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Check Query Parameters (?shop=test1 or ?qr=...)
  const params = new URLSearchParams(window.location.search);
  const qShop = params.get('shop') || params.get('qr');
  if (qShop && qShop.trim()) {
    const cleaned = qShop.trim().toLowerCase();
    // Ignore internal qr prefix if raw token
    return cleaned.replace(/^qr_/, '');
  }

  // 2. Check Path Routing (/shop/:slug or /s/:slug)
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if ((pathParts[0] === 'shop' || pathParts[0] === 's') && pathParts[1]) {
    return pathParts[1].trim().toLowerCase();
  }
  const reservedPaths = [
    'api',
    'assets',
    'favicon.svg',
    'favicon.ico',
    'index.html',
    'download',
    'docs',
    'cart',
    'checkout',
    'tracking',
  ];
  if (pathParts.length === 1 && !reservedPaths.includes(pathParts[0].toLowerCase())) {
    return pathParts[0].trim().toLowerCase();
  }

  // 3. Subdomain extraction
  const host = window.location.hostname.toLowerCase();

  // Primary platform domain: printbotak.vercel.app
  const vercelDomain = 'printbotak.vercel.app';
  if (host === vercelDomain || host === `www.${vercelDomain}`) {
    return null;
  }
  if (host.endsWith(`.${vercelDomain}`)) {
    const sub = host.slice(0, -(vercelDomain.length + 1)).trim();
    if (sub && sub !== 'www') return sub;
  }

  // Localhost subdomain (e.g. test1.localhost)
  if (host.includes('.localhost')) {
    const sub = host.split('.localhost')[0];
    if (sub && sub !== 'www') return sub.trim();
  }

  // Any other *.vercel.app deployment (e.g. test1.<project>.vercel.app)
  if (host.endsWith('.vercel.app')) {
    const parts = host.split('.');
    if (parts.length >= 4) {
      const candidate = parts[0];
      if (candidate !== 'www') return candidate.trim();
    }
    return null;
  }

  // Generic custom domains with subdomains (e.g. test1.myprintdomain.com)
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const parts = host.split('.');
    if (parts.length >= 3) {
      const candidate = parts[0];
      const reservedSubdomains = ['www', 'app', 'api', 'admin', 'portal', 'status'];
      if (!reservedSubdomains.includes(candidate)) {
        return candidate.trim();
      }
    }
  }

  return null;
}

/**
 * Loads customized shop details, rates, and operating settings from Supabase.
 * If the shop cannot be found or the network is offline, generates a clean fallback.
 */
export async function loadShopProfile(slug: string): Promise<ShopSession> {
  const cleanId = slug.toLowerCase().trim();

  // Fallback defaults
  const fallbackName =
    cleanId.charAt(0).toUpperCase() + cleanId.slice(1) + ' Print & Xerox Stand';

  const defaultResult: ShopSession = {
    session_token: `sess_${cleanId}_${Date.now()}`,
    shop_id: cleanId,
    shop_name: fallbackName,
    shop_slug: cleanId,
    shop_address: 'Local Counter Stand',
    shop_phone: '',
    operating_hours: '08:00 AM – 09:30 PM (Mon–Sat)',
    rates: {
      bwPerSideRupees: 1.5,
      colorPerSideRupees: 10.0,
      duplexDiscountPercent: 15,
    },
    orderMode: 'FULL_AUTOMATIC',
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  };

  try {
    // 1. Direct match by generated_username or shop_name in Supabase pilot_applications
    const { data, error } = await supabase
      .from('pilot_applications')
      .select('id, shop_name, city, contact_number, plan, notes, generated_username, status')
      .or(`generated_username.ilike.${cleanId},shop_name.ilike.${cleanId}`)
      .maybeSingle();

    let appData = data;

    // 2. If not matched, scan approved shops with slug normalization
    if (!appData && !error) {
      const { data: approvedList } = await supabase
        .from('pilot_applications')
        .select('id, shop_name, city, contact_number, plan, notes, generated_username, status')
        .eq('status', 'APPROVED');

      if (approvedList && approvedList.length > 0) {
        appData =
          approvedList.find((s) => {
            const normalizedName = (s.shop_name || '')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '');
            const normalizedUser = (s.generated_username || '')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '');
            return normalizedName === cleanId || normalizedUser === cleanId;
          }) || null;
      }
    }

    if (appData) {
      let customBw = 1.5;
      let customColor = 10.0;
      let customOrderMode: 'MANUAL_APPROVAL' | 'FULL_AUTOMATIC' = 'FULL_AUTOMATIC';

      // Parse custom pricing rates synced by the shop owner's desktop exe
      if (appData.notes) {
        try {
          const parsed =
            typeof appData.notes === 'string' ? JSON.parse(appData.notes) : appData.notes;
          if (parsed.bwRate !== undefined) customBw = Number(parsed.bwRate);
          if (parsed.colorRate !== undefined) customColor = Number(parsed.colorRate);
          if (parsed.orderMode) customOrderMode = parsed.orderMode;
        } catch (e) {
          console.warn('Failed to parse shop notes JSON:', e);
        }
      }

      return {
        session_token: `sess_${appData.generated_username || cleanId}`,
        shop_id: appData.id || appData.generated_username || cleanId,
        shop_name: appData.shop_name || fallbackName,
        shop_slug: cleanId,
        shop_address: appData.city ? `${appData.city} Counter Stand` : 'Local Counter Station',
        shop_phone: appData.contact_number || '',
        operating_hours: '08:00 AM – 09:30 PM (Mon–Sat)',
        rates: {
          bwPerSideRupees: customBw,
          colorPerSideRupees: customColor,
          duplexDiscountPercent: 15,
        },
        orderMode: customOrderMode,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      };
    }
  } catch (err) {
    console.warn(`Could not load cloud profile for shop ${slug}:`, err);
  }

  return defaultResult;
}

/**
 * Subscribes to real-time changes in Supabase for this shop so rates or details
 * updated in the desktop workstation .exe update the customer web page immediately.
 */
export function subscribeToShopRealtime(
  slug: string,
  onUpdate: (updated: Partial<ShopSession>) => void
): () => void {
  const cleanId = slug.toLowerCase().trim();

  const channel = supabase
    .channel(`shop_realtime_${cleanId}_${Date.now()}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'pilot_applications' },
      (payload: any) => {
        const row = payload.new;
        if (!row) return;

        const rowUser = (row.generated_username || '').toLowerCase();
        const rowName = (row.shop_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        if (rowUser === cleanId || rowName === cleanId) {
          let customBw = 1.5;
          let customColor = 10.0;
          let orderMode: 'MANUAL_APPROVAL' | 'FULL_AUTOMATIC' = 'FULL_AUTOMATIC';

          if (row.notes) {
            try {
              const parsed =
                typeof row.notes === 'string' ? JSON.parse(row.notes) : row.notes;
              if (parsed.bwRate !== undefined) customBw = Number(parsed.bwRate);
              if (parsed.colorRate !== undefined) customColor = Number(parsed.colorRate);
              if (parsed.orderMode) orderMode = parsed.orderMode;
            } catch {}
          }

          onUpdate({
            shop_name: row.shop_name,
            shop_phone: row.contact_number,
            shop_address: row.city ? `${row.city} Counter Stand` : undefined,
            rates: {
              bwPerSideRupees: customBw,
              colorPerSideRupees: customColor,
              duplexDiscountPercent: 15,
            },
            orderMode,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
