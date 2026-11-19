import { type PrintJob } from '../App';
import { type ShopLicense } from '../components/AdminPortal';

export type DateRangeType = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'all' | 'custom';

export interface DateRangeBounds {
  start: Date;
  end: Date;
  label: string;
}

export interface ChartPoint {
  key: string;       // YYYY-MM-DD or HH:00
  label: string;     // Short display (e.g. "19 Nov" or "5 PM")
  fullLabel: string; // Detailed tooltip header (e.g. "19 Nov 2026, 5:00 PM")
  revenue: number;   // In Rupees
  adminRevenue?: number; // Admin License SaaS fee in Rupees
  shopRevenue?: number;  // Shop print turnover in Rupees
  totalRevenue?: number; // Combined revenue
  licensesCount?: number; // Number of licenses created/renewed
  orders: number;    // Completed orders
  pages: number;     // Spooled pages
  bwPages: number;
  colorPages: number;
}

export interface ShopAnalyticsItem {
  rank: number;
  shopName: string;
  username: string;
  location: string;
  phone: string;
  licenseKey: string;
  planDuration: string;
  status: 'ACTIVE' | 'REVOKED';
  ordersCount: number;
  pagesCount: number;
  bwPages: number;
  colorPages: number;
  printTurnover: number;
  subscriptionFee: number;
  totalRevenue: number;
  avgOrderValue: number;
  marketSharePercent: number;
  lastActive?: string;
}

/**
 * Safely extracts a valid JavaScript Date from a PrintJob.
 */
export function getJobDate(job: PrintJob): Date {
  if (job.timestamp) {
    const d = new Date(job.timestamp);
    if (!isNaN(d.getTime())) return d;
  }

  if (job.created_at) {
    const d = new Date(job.created_at);
    if (!isNaN(d.getTime())) return d;

    // If it's a time string like "17:05" or "05:30 PM", assume today's date
    const timeMatch = job.created_at.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (timeMatch) {
      const now = new Date();
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const meridiem = timeMatch[4]?.toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      now.setHours(hours, minutes, 0, 0);
      return now;
    }
  }

  return new Date();
}

/**
 * Returns the SaaS subscription fee in Rupees for a given plan duration.
 */
export function getLicenseFee(duration?: string): number {
  if (duration === '1 Month') return 499;
  if (duration === 'Lifetime Commercial') return 14999;
  return 4999; // Default 1 Year
}

/**
 * Safely extracts a valid JavaScript Date for a ShopLicense.
 */
export function getLicenseDate(lic: ShopLicense): Date {
  if (lic.createdAt) {
    const d = new Date(lic.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (lic.boundAt) {
    const d = new Date(lic.boundAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (lic.lastActive && lic.lastActive.includes(',')) {
    const d = new Date(lic.lastActive);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * Computes start & end bounds for a given DateRangeType.
 */
export function getDateRangeBounds(
  rangeType: DateRangeType,
  customStart?: string,
  customEnd?: string
): DateRangeBounds {
  const now = new Date();

  if (rangeType === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return {
      start,
      end,
      label: `Today (${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`,
    };
  }

  if (rangeType === 'yesterday') {
    const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const start = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0, 0);
    const end = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59, 999);
    return {
      start,
      end,
      label: `Yesterday (${yest.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`,
    };
  }

  if (rangeType === '7d') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return {
      start,
      end,
      label: `Last 7 Days (${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`,
    };
  }

  if (rangeType === '30d') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return {
      start,
      end,
      label: `Last 30 Days (${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`,
    };
  }

  if (rangeType === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return {
      start,
      end,
      label: `This Month (${now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })})`,
    };
  }

  if (rangeType === 'custom' && customStart && customEnd) {
    const sParts = customStart.split('-').map(Number);
    const eParts = customEnd.split('-').map(Number);
    const start = new Date(sParts[0], sParts[1] - 1, sParts[2], 0, 0, 0, 0);
    const end = new Date(eParts[0], eParts[1] - 1, eParts[2], 23, 59, 59, 999);
    return {
      start,
      end,
      label: `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
    };
  }

  // All time
  const start = new Date(2020, 0, 1, 0, 0, 0, 0);
  const end = new Date(2099, 11, 31, 23, 59, 59, 999);
  return {
    start,
    end,
    label: 'All Time History',
  };
}

/**
 * Filter jobs to completed jobs inside the selected date range.
 */
export function filterJobsByRange(
  jobs: PrintJob[],
  rangeType: DateRangeType,
  customStart?: string,
  customEnd?: string
): PrintJob[] {
  const { start, end } = getDateRangeBounds(rangeType, customStart, customEnd);
  const startMs = start.getTime();
  const endMs = end.getTime();

  return jobs.filter((job) => {
    if (job.status !== 'COMPLETED') return false;
    const jobDate = getJobDate(job);
    const jobMs = jobDate.getTime();
    return jobMs >= startMs && jobMs <= endMs;
  });
}

/**
 * Filter licenses to those issued/renewed inside the selected date range.
 */
export function filterLicensesByRange(
  licenses: ShopLicense[],
  rangeType: DateRangeType,
  customStart?: string,
  customEnd?: string
): ShopLicense[] {
  const { start, end } = getDateRangeBounds(rangeType, customStart, customEnd);
  const startMs = start.getTime();
  const endMs = end.getTime();

  return licenses.filter((lic) => {
    const licDate = getLicenseDate(lic);
    const licMs = licDate.getTime();
    return licMs >= startMs && licMs <= endMs;
  });
}

/**
 * Generates continuous data points for rendering smooth interactive line graphs.
 */
export function generateChartPoints(
  jobs: PrintJob[],
  rangeType: DateRangeType,
  customStart?: string,
  customEnd?: string
): ChartPoint[] {
  const bounds = getDateRangeBounds(rangeType, customStart, customEnd);
  const filtered = filterJobsByRange(jobs, rangeType, customStart, customEnd);

  // Hourly buckets for "today" or "yesterday"
  if (rangeType === 'today' || rangeType === 'yesterday') {
    const points: ChartPoint[] = [];
    const baseDate = bounds.start;
    const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

    for (const h of hours) {
      const hStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, 0, 0).getTime();
      const hEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h + 2, 0, 0).getTime();

      const bucketJobs = filtered.filter((j) => {
        const ms = getJobDate(j).getTime();
        return ms >= hStart && ms < hEnd;
      });

      const revenue = bucketJobs.reduce((acc, j) => acc + (j.calculated_price_rupees || 0), 0);
      const orders = bucketJobs.length;
      let pages = 0;
      let bwPages = 0;
      let colorPages = 0;

      bucketJobs.forEach((j) => {
        const pg = (j.page_count || 1) * (j.options.copies || 1);
        pages += pg;
        if (j.options.color_mode === 'color') colorPages += pg;
        else bwPages += pg;
      });

      const displayHour = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;

      points.push({
        key: `${h}:00`,
        label: displayHour,
        fullLabel: `${baseDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${displayHour}`,
        revenue: Math.round(revenue * 100) / 100,
        orders,
        pages,
        bwPages,
        colorPages,
      });
    }

    return points;
  }

  // Daily buckets for rolling days (7d, 30d, month, custom, all)
  const diffDays = Math.max(1, Math.round((bounds.end.getTime() - bounds.start.getTime()) / (1000 * 60 * 60 * 24)));
  const daysToGenerate = Math.min(diffDays, 31); // Keep max 31 days on daily timeline for clean chart spacing

  const points: ChartPoint[] = [];
  const startDay = new Date(bounds.end);
  startDay.setDate(startDay.getDate() - (daysToGenerate - 1));

  for (let i = 0; i < daysToGenerate; i++) {
    const cur = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + i);
    const dayStart = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 0, 0, 0).getTime();
    const dayEnd = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 23, 59, 59, 999).getTime();

    const bucketJobs = filtered.filter((j) => {
      const ms = getJobDate(j).getTime();
      return ms >= dayStart && ms <= dayEnd;
    });

    const revenue = bucketJobs.reduce((acc, j) => acc + (j.calculated_price_rupees || 0), 0);
    const orders = bucketJobs.length;
    let pages = 0;
    let bwPages = 0;
    let colorPages = 0;

    bucketJobs.forEach((j) => {
      const pg = (j.page_count || 1) * (j.options.copies || 1);
      pages += pg;
      if (j.options.color_mode === 'color') colorPages += pg;
      else bwPages += pg;
    });

    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    const label = cur.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const fullLabel = cur.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    points.push({
      key,
      label,
      fullLabel,
      revenue: Math.round(revenue * 100) / 100,
      orders,
      pages,
      bwPages,
      colorPages,
    });
  }

  return points;
}

/**
 * Generates continuous data points specifically for Super Admin Platform Revenue Trajectory.
 * Plots SaaS license fees collected (from new licenses created/renewed) alongside network volume.
 */
export function generateAdminChartPoints(
  licenses: ShopLicense[],
  jobs: PrintJob[],
  rangeType: DateRangeType,
  customStart?: string,
  customEnd?: string
): ChartPoint[] {
  const bounds = getDateRangeBounds(rangeType, customStart, customEnd);
  const filteredJobs = filterJobsByRange(jobs, rangeType, customStart, customEnd);
  const filteredLicenses = filterLicensesByRange(licenses, rangeType, customStart, customEnd);

  // Hourly buckets for "today" or "yesterday"
  if (rangeType === 'today' || rangeType === 'yesterday') {
    const points: ChartPoint[] = [];
    const baseDate = bounds.start;
    const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

    for (const h of hours) {
      const hStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, 0, 0).getTime();
      const hEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h + 2, 0, 0).getTime();

      const bucketJobs = filteredJobs.filter((j) => {
        const ms = getJobDate(j).getTime();
        return ms >= hStart && ms < hEnd;
      });

      const bucketLicenses = filteredLicenses.filter((lic) => {
        const ms = getLicenseDate(lic).getTime();
        return ms >= hStart && ms < hEnd;
      });

      const adminRevenue = bucketLicenses.reduce((acc, lic) => acc + getLicenseFee(lic.duration), 0);
      const shopRevenue = bucketJobs.reduce((acc, j) => acc + (j.calculated_price_rupees || 0), 0);
      const totalRevenue = adminRevenue + shopRevenue;
      const orders = bucketJobs.length;
      let pages = 0;
      let bwPages = 0;
      let colorPages = 0;

      bucketJobs.forEach((j) => {
        const pg = (j.page_count || 1) * (j.options.copies || 1);
        pages += pg;
        if (j.options.color_mode === 'color') colorPages += pg;
        else bwPages += pg;
      });

      const displayHour = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;

      points.push({
        key: `${h}:00`,
        label: displayHour,
        fullLabel: `${baseDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${displayHour}`,
        revenue: Math.round(adminRevenue * 100) / 100, // Primary metric: Admin SaaS revenue
        adminRevenue: Math.round(adminRevenue * 100) / 100,
        shopRevenue: Math.round(shopRevenue * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        licensesCount: bucketLicenses.length,
        orders,
        pages,
        bwPages,
        colorPages,
      });
    }

    return points;
  }

  // Daily buckets for rolling days (7d, 30d, month, custom, all)
  const diffDays = Math.max(1, Math.round((bounds.end.getTime() - bounds.start.getTime()) / (1000 * 60 * 60 * 24)));
  const daysToGenerate = Math.min(diffDays, 31);

  const points: ChartPoint[] = [];
  const startDay = new Date(bounds.end);
  startDay.setDate(startDay.getDate() - (daysToGenerate - 1));

  for (let i = 0; i < daysToGenerate; i++) {
    const cur = new Date(startDay.getFullYear(), startDay.getMonth(), startDay.getDate() + i);
    const dayStart = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 0, 0, 0).getTime();
    const dayEnd = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 23, 59, 59, 999).getTime();

    const bucketJobs = filteredJobs.filter((j) => {
      const ms = getJobDate(j).getTime();
      return ms >= dayStart && ms <= dayEnd;
    });

    const bucketLicenses = filteredLicenses.filter((lic) => {
      const ms = getLicenseDate(lic).getTime();
      return ms >= dayStart && ms <= dayEnd;
    });

    const adminRevenue = bucketLicenses.reduce((acc, lic) => acc + getLicenseFee(lic.duration), 0);
    const shopRevenue = bucketJobs.reduce((acc, j) => acc + (j.calculated_price_rupees || 0), 0);
    const totalRevenue = adminRevenue + shopRevenue;
    const orders = bucketJobs.length;
    let pages = 0;
    let bwPages = 0;
    let colorPages = 0;

    bucketJobs.forEach((j) => {
      const pg = (j.page_count || 1) * (j.options.copies || 1);
      pages += pg;
      if (j.options.color_mode === 'color') colorPages += pg;
      else bwPages += pg;
    });

    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    const label = cur.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const fullLabel = cur.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    points.push({
      key,
      label,
      fullLabel,
      revenue: Math.round(adminRevenue * 100) / 100, // Primary metric: Admin SaaS revenue
      adminRevenue: Math.round(adminRevenue * 100) / 100,
      shopRevenue: Math.round(shopRevenue * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      licensesCount: bucketLicenses.length,
      orders,
      pages,
      bwPages,
      colorPages,
    });
  }

  return points;
}

/**
 * Computes shop analytics ranked dynamically with HIGHEST REVENUE ON TOP.
 * Real-time order turnover updates dynamically reorder the list!
 */
export function computeShopAnalytics(
  shopList: ShopLicense[],
  completedJobs: PrintJob[],
  totalSubscriptionRevenue: number
): { items: ShopAnalyticsItem[]; totalNetworkTurnover: number; totalNetworkOrders: number; totalNetworkPages: number } {
  // Total network print turnover
  const totalNetworkTurnover = completedJobs.reduce((acc, j) => acc + (j.calculated_price_rupees || 0), 0);
  const totalNetworkOrders = completedJobs.length;
  const totalNetworkPages = completedJobs.reduce((acc, j) => acc + (j.page_count * (j.options.copies || 1)), 0);

  const items: ShopAnalyticsItem[] = shopList.map((lic) => {
    // Match jobs belonging to this shop
    const shopJobs = completedJobs.filter((j) => {
      const licUser = (lic.username || '').toLowerCase();
      const licName = (lic.shopName || '').toLowerCase();
      const jShop = ((j as any).shop_id || '').toLowerCase();
      const jEmail = (j.customer_email || '').toLowerCase();

      if (shopList.length === 1) return true;
      if (jShop && (jShop === licUser || jShop === licName || jShop.includes(licUser) || licUser.includes(jShop))) {
        return true;
      }
      if (jEmail && jEmail.includes(licUser)) return true;
      return false;
    });

    const ordersCount = shopJobs.length;
    let pagesCount = 0;
    let bwPages = 0;
    let colorPages = 0;

    shopJobs.forEach((j) => {
      const count = (j.page_count || 1) * (j.options.copies || 1);
      pagesCount += count;
      if (j.options.color_mode === 'color') colorPages += count;
      else bwPages += count;
    });

    const printTurnover = shopJobs.reduce((acc, j) => acc + (j.calculated_price_rupees || 0), 0);
    const subscriptionFee = lic.duration === '1 Month' ? 499 : lic.duration === 'Lifetime Commercial' ? 14999 : 4999;
    const totalRevenue = printTurnover;
    const avgOrderValue = ordersCount > 0 ? printTurnover / ordersCount : 0;
    const marketSharePercent = totalNetworkTurnover > 0 ? (printTurnover / totalNetworkTurnover) * 100 : 0;

    return {
      rank: 1, // Will be set after sorting
      shopName: lic.shopName,
      username: lic.username,
      location: lic.location || 'Main Counter',
      phone: lic.phone || '-',
      licenseKey: lic.licenseKey,
      planDuration: lic.duration || '1 Year',
      status: lic.status,
      ordersCount,
      pagesCount,
      bwPages,
      colorPages,
      printTurnover: Math.round(printTurnover * 100) / 100,
      subscriptionFee,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      marketSharePercent: Math.round(marketSharePercent * 10) / 10,
      lastActive: lic.lastActive,
    };
  });

  // Sort by Print Turnover descending (Highest Revenue Top), then orders count, then alphabetical
  items.sort((a, b) => {
    if (b.printTurnover !== a.printTurnover) {
      return b.printTurnover - a.printTurnover;
    }
    if (b.ordersCount !== a.ordersCount) {
      return b.ordersCount - a.ordersCount;
    }
    if (b.pagesCount !== a.pagesCount) {
      return b.pagesCount - a.pagesCount;
    }
    return a.shopName.localeCompare(b.shopName);
  });

  // Assign ranks
  items.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return {
    items,
    totalNetworkTurnover,
    totalNetworkOrders,
    totalNetworkPages,
  };
}

