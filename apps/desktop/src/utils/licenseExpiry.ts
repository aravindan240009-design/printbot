/**
 * License Expiry and Real-Time Countdown Utilities for PrintBot Counter Workstation
 */

export interface LicenseExpiryInfo {
  isLifetime: boolean;
  expiryDate: Date | null;
  expiryTimestamp: number | null;
  status: 'LIFETIME' | 'ACTIVE' | 'WARNING_72H' | 'COUNTDOWN_24H' | 'EXPIRED';
  remainingMs: number;
  formattedCountdown: string;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  daysRemaining: number;
  is72hWarning: boolean;
  is24hCountdown: boolean;
  isExpired: boolean;
  expiryDateDisplay: string;
}

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Parses any license expiry format (LIFETIME, YYYY-MM-DD, ISO 8601, etc.)
 */
export function parseLicenseExpiry(expiresAt?: string | null): {
  isLifetime: boolean;
  expiryDate: Date | null;
  expiryTimestamp: number | null;
} {
  if (!expiresAt || expiresAt === 'EXPIRED') {
    return { isLifetime: false, expiryDate: new Date(0), expiryTimestamp: 0 };
  }

  const normalized = expiresAt.trim();
  if (normalized.toUpperCase() === 'LIFETIME' || normalized.toLowerCase().includes('lifetime')) {
    return { isLifetime: true, expiryDate: null, expiryTimestamp: Infinity };
  }

  // Handle date-only format "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split('-').map(Number);
    // End of day in local time (23:59:59.999) so the shop owner gets the full calendar day
    const d = new Date(year, month - 1, day, 23, 59, 59, 999);
    return { isLifetime: false, expiryDate: d, expiryTimestamp: d.getTime() };
  }

  // Handle ISO 8601 timestamps
  const parsed = new Date(normalized);
  if (!isNaN(parsed.getTime())) {
    return { isLifetime: false, expiryDate: parsed, expiryTimestamp: parsed.getTime() };
  }

  return { isLifetime: false, expiryDate: null, expiryTimestamp: null };
}

/**
 * Formats remaining milliseconds into HH:MM:SS format (e.g. 24:00:00, 23:45:12, 00:15:30)
 */
export function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return '00:00:00';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hStr = String(hours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  return `${hStr}:${mStr}:${sStr}`;
}

/**
 * Formats a Date object for friendly user display
 */
export function formatExpiryDate(date: Date | null, isLifetime: boolean): string {
  if (isLifetime) return 'Lifetime Commercial';
  if (!date || date.getTime() === 0) return 'Expired';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculates current license expiry status, remaining time, countdown, and active warnings
 */
export function getLicenseExpiryStatus(
  expiresAt?: string | null,
  nowMs: number = Date.now()
): LicenseExpiryInfo {
  const { isLifetime, expiryDate, expiryTimestamp } = parseLicenseExpiry(expiresAt);

  if (isLifetime) {
    return {
      isLifetime: true,
      expiryDate: null,
      expiryTimestamp: Infinity,
      status: 'LIFETIME',
      remainingMs: Infinity,
      formattedCountdown: 'LIFETIME',
      hoursRemaining: Infinity,
      minutesRemaining: Infinity,
      secondsRemaining: Infinity,
      daysRemaining: Infinity,
      is72hWarning: false,
      is24hCountdown: false,
      isExpired: false,
      expiryDateDisplay: 'Lifetime Commercial License',
    };
  }

  if (expiryTimestamp === null || expiryTimestamp <= 0) {
    return {
      isLifetime: false,
      expiryDate: new Date(0),
      expiryTimestamp: 0,
      status: 'EXPIRED',
      remainingMs: 0,
      formattedCountdown: '00:00:00',
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      daysRemaining: 0,
      is72hWarning: false,
      is24hCountdown: false,
      isExpired: true,
      expiryDateDisplay: 'License Expired',
    };
  }

  const remainingMs = expiryTimestamp - nowMs;

  if (remainingMs <= 0) {
    return {
      isLifetime: false,
      expiryDate,
      expiryTimestamp,
      status: 'EXPIRED',
      remainingMs: 0,
      formattedCountdown: '00:00:00',
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      daysRemaining: 0,
      is72hWarning: false,
      is24hCountdown: false,
      isExpired: true,
      expiryDateDisplay: formatExpiryDate(expiryDate, false),
    };
  }

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hoursRemaining = Math.floor(totalSeconds / 3600);
  const minutesRemaining = Math.floor((totalSeconds % 3600) / 60);
  const secondsRemaining = totalSeconds % 60;
  const daysRemaining = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  const formattedCountdown = formatCountdown(remainingMs);
  const expiryDateDisplay = formatExpiryDate(expiryDate, false);

  // Final 24 hours countdown: remainingMs <= 24 hours
  if (remainingMs <= TWENTY_FOUR_HOURS_MS) {
    return {
      isLifetime: false,
      expiryDate,
      expiryTimestamp,
      status: 'COUNTDOWN_24H',
      remainingMs,
      formattedCountdown,
      hoursRemaining,
      minutesRemaining,
      secondsRemaining,
      daysRemaining,
      is72hWarning: false,
      is24hCountdown: true,
      isExpired: false,
      expiryDateDisplay,
    };
  }

  // Exactly 3 days (72 hours) warning: 24h < remainingMs <= 72h
  if (remainingMs <= SEVENTY_TWO_HOURS_MS) {
    return {
      isLifetime: false,
      expiryDate,
      expiryTimestamp,
      status: 'WARNING_72H',
      remainingMs,
      formattedCountdown,
      hoursRemaining,
      minutesRemaining,
      secondsRemaining,
      daysRemaining,
      is72hWarning: true,
      is24hCountdown: false,
      isExpired: false,
      expiryDateDisplay,
    };
  }

  // Normal active license (> 72 hours)
  return {
    isLifetime: false,
    expiryDate,
    expiryTimestamp,
    status: 'ACTIVE',
    remainingMs,
    formattedCountdown,
    hoursRemaining,
    minutesRemaining,
    secondsRemaining,
    daysRemaining,
    is72hWarning: false,
    is24hCountdown: false,
    isExpired: false,
    expiryDateDisplay,
  };
}

/**
 * Extends the existing license expiry date by a given duration.
 * If the current expiry is in the future, it extends from that future date.
 * If the license is already expired, it extends from today.
 */
export function calculateExtendedExpiry(
  currentExpiresAt: string | undefined | null,
  durationToAdd: '1 Month' | '1 Year'
): string {
  const { expiryDate } = parseLicenseExpiry(currentExpiresAt);
  const now = new Date();
  
  // Extend from current expiry if it's still in the future; otherwise extend from now
  const baseDate = expiryDate && expiryDate > now ? new Date(expiryDate) : new Date(now);

  if (durationToAdd === '1 Month') {
    baseDate.setDate(baseDate.getDate() + 30);
  } else {
    baseDate.setFullYear(baseDate.getFullYear() + 1);
  }

  return baseDate.toISOString().split('T')[0];
}

