import { supabase } from '../supabase';
import { ShopSession } from '../types';

/**
 * Resolves the shop slug exclusively from:
 * 1. URL Path route: e.g. "/shop/testcase", "/s/testcase", or direct "/testcase"
 * 2. Query parameter: e.g. "?shop=testcase" or "?qr=testcase"
 */
export function resolveShopSlugFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Direct URL Path resolution (Primary customer web workflow)
  const pathParts = window.location.pathname.split('/').filter(Boolean);

  // Format: /shop/:slug or /s/:slug
  if ((pathParts[0] === 'shop' || pathParts[0] === 's') && pathParts[1]) {
    return pathParts[1].trim().toLowerCase();
  }

  // System & Marketing Landing Page reserved paths that should not be treated as shop slugs
  const reservedPaths = new Set([
    '',
    'features',
    'download',
    'downloads',
    'about',
    'contact',
    'privacy',
    'terms',
    'customer',
    'shop',
    's',
    'admin',
    'portal',
    'app',
    'api',
    'assets',
    'favicon.svg',
    'favicon.ico',
    'index.html',
    'docs',
    'cart',
    'checkout',
    'tracking',
    'static',
    'robots.txt',
    'sitemap.xml',
  ]);

  // Format: /:slug (e.g. /testcase)
  if (pathParts.length === 1 && !reservedPaths.has(pathParts[0].toLowerCase())) {
    return pathParts[0].trim().toLowerCase();
  }

  // 2. Query Parameter Fallback (?shop=testcase or ?qr=...)
  const params = new URLSearchParams(window.location.search);
  const qShop = params.get('shop') || params.get('qr');
  if (qShop && qShop.trim()) {
    const cleaned = qShop.trim().toLowerCase();
    return cleaned.replace(/^qr_/, '');
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
      let customDuplex = 15;
      let customPhoto = 30.0;
      let customStaple = 5.0;
      let customSpiral = 40.0;
      let customHardBound = 150.0;
      let customCard = 15.0;
      let customOrderMode: 'MANUAL_APPROVAL' | 'FULL_AUTOMATIC' = 'FULL_AUTOMATIC';

      // Parse custom pricing rates synced by the shop owner's desktop exe
      if (appData.notes) {
        try {
          const parsed =
            typeof appData.notes === 'string' ? JSON.parse(appData.notes) : appData.notes;
          if (parsed.bwRate !== undefined) customBw = Number(parsed.bwRate);
          if (parsed.colorRate !== undefined) customColor = Number(parsed.colorRate);
          if (parsed.duplexDiscountPercent !== undefined) customDuplex = Number(parsed.duplexDiscountPercent);
          if (parsed.photoRate !== undefined) customPhoto = Number(parsed.photoRate);
          if (parsed.stapleRate !== undefined) customStaple = Number(parsed.stapleRate);
          if (parsed.spiralRate !== undefined) customSpiral = Number(parsed.spiralRate);
          if (parsed.hardBoundRate !== undefined) customHardBound = Number(parsed.hardBoundRate);
          if (parsed.cardRate !== undefined) customCard = Number(parsed.cardRate);
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
          duplexDiscountPercent: customDuplex,
          photoRate: customPhoto,
          stapleRate: customStaple,
          spiralRate: customSpiral,
          hardBoundRate: customHardBound,
          cardRate: customCard,
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
          let customDuplex = 15;
          let customPhoto = 30.0;
          let customStaple = 5.0;
          let customSpiral = 40.0;
          let customHardBound = 150.0;
          let customCard = 15.0;
          let orderMode: 'MANUAL_APPROVAL' | 'FULL_AUTOMATIC' = 'FULL_AUTOMATIC';

          if (row.notes) {
            try {
              const parsed =
                typeof row.notes === 'string' ? JSON.parse(row.notes) : row.notes;
              if (parsed.bwRate !== undefined) customBw = Number(parsed.bwRate);
              if (parsed.colorRate !== undefined) customColor = Number(parsed.colorRate);
              if (parsed.duplexDiscountPercent !== undefined) customDuplex = Number(parsed.duplexDiscountPercent);
              if (parsed.photoRate !== undefined) customPhoto = Number(parsed.photoRate);
              if (parsed.stapleRate !== undefined) customStaple = Number(parsed.stapleRate);
              if (parsed.spiralRate !== undefined) customSpiral = Number(parsed.spiralRate);
              if (parsed.hardBoundRate !== undefined) customHardBound = Number(parsed.hardBoundRate);
              if (parsed.cardRate !== undefined) customCard = Number(parsed.cardRate);
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
              duplexDiscountPercent: customDuplex,
              photoRate: customPhoto,
              stapleRate: customStaple,
              spiralRate: customSpiral,
              hardBoundRate: customHardBound,
              cardRate: customCard,
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
