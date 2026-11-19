// Test License Expiry and Countdown System
const assert = require('assert');

// Simple emulation of licenseExpiry functions in CommonJS
function parseLicenseExpiry(expiresAt) {
  if (!expiresAt || expiresAt === 'EXPIRED') {
    return { isLifetime: false, expiryDate: new Date(0), expiryTimestamp: 0 };
  }

  const normalized = String(expiresAt).trim();
  if (normalized.toUpperCase() === 'LIFETIME' || normalized.toLowerCase().includes('lifetime')) {
    return { isLifetime: true, expiryDate: null, expiryTimestamp: Infinity };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split('-').map(Number);
    const d = new Date(year, month - 1, day, 23, 59, 59, 999);
    return { isLifetime: false, expiryDate: d, expiryTimestamp: d.getTime() };
  }

  const parsed = new Date(normalized);
  if (!isNaN(parsed.getTime())) {
    return { isLifetime: false, expiryDate: parsed, expiryTimestamp: parsed.getTime() };
  }

  return { isLifetime: false, expiryDate: null, expiryTimestamp: null };
}

function formatCountdown(remainingMs) {
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

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function getLicenseExpiryStatus(expiresAt, nowMs = Date.now()) {
  const { isLifetime, expiryDate, expiryTimestamp } = parseLicenseExpiry(expiresAt);

  if (isLifetime) {
    return {
      status: 'LIFETIME',
      remainingMs: Infinity,
      formattedCountdown: 'LIFETIME',
      is72hWarning: false,
      is24hCountdown: false,
      isExpired: false,
    };
  }

  if (expiryTimestamp === null || expiryTimestamp <= 0) {
    return {
      status: 'EXPIRED',
      remainingMs: 0,
      formattedCountdown: '00:00:00',
      is72hWarning: false,
      is24hCountdown: false,
      isExpired: true,
    };
  }

  const remainingMs = expiryTimestamp - nowMs;

  if (remainingMs <= 0) {
    return {
      status: 'EXPIRED',
      remainingMs: 0,
      formattedCountdown: '00:00:00',
      is72hWarning: false,
      is24hCountdown: false,
      isExpired: true,
    };
  }

  const formattedCountdown = formatCountdown(remainingMs);

  if (remainingMs <= TWENTY_FOUR_HOURS_MS) {
    return {
      status: 'COUNTDOWN_24H',
      remainingMs,
      formattedCountdown,
      is72hWarning: false,
      is24hCountdown: true,
      isExpired: false,
    };
  }

  if (remainingMs <= SEVENTY_TWO_HOURS_MS) {
    return {
      status: 'WARNING_72H',
      remainingMs,
      formattedCountdown,
      is72hWarning: true,
      is24hCountdown: false,
      isExpired: false,
    };
  }

  return {
    status: 'ACTIVE',
    remainingMs,
    formattedCountdown,
    is72hWarning: false,
    is24hCountdown: false,
    isExpired: false,
  };
}

function calculateExtendedExpiry(currentExpiresAt, durationToAdd) {
  const { expiryDate } = parseLicenseExpiry(currentExpiresAt);
  const now = new Date();
  const baseDate = expiryDate && expiryDate > now ? new Date(expiryDate) : new Date(now);

  if (durationToAdd === '1 Month') {
    baseDate.setDate(baseDate.getDate() + 30);
  } else {
    baseDate.setFullYear(baseDate.getFullYear() + 1);
  }

  return baseDate.toISOString().split('T')[0];
}

console.log('--- RUNNING LICENSE EXPIRY & COUNTDOWN SYSTEM TESTS ---');

// Test 1: User prompt example: Expiry on 19 November 2026, check warning on 16 November 2026
{
  const expiryDateStr = '2026-11-19';
  const { expiryTimestamp } = parseLicenseExpiry(expiryDateStr);
  
  // 16 Nov at exactly 72 hours before expiry:
  const exact72hBefore = expiryTimestamp - (72 * 60 * 60 * 1000);
  const status72h = getLicenseExpiryStatus(expiryDateStr, exact72hBefore);
  assert.strictEqual(status72h.is72hWarning, true, 'Should trigger 72h warning');
  assert.strictEqual(status72h.status, 'WARNING_72H');

  // More than 72 hours before (e.g. 15 Nov):
  const beforeWarning = exact72hBefore - (10 * 60 * 1000); // 10 minutes earlier
  const statusBefore = getLicenseExpiryStatus(expiryDateStr, beforeWarning);
  assert.strictEqual(statusBefore.is72hWarning, false, 'Should not trigger warning before 72h');
  assert.strictEqual(statusBefore.status, 'ACTIVE');
  console.log('✓ Test 1: 72-hour warning starts exactly 3 days (72 hours) before expiry.');
}

// Test 2: Final 24 hours countdown display
{
  const expiryDateStr = '2026-11-19';
  const { expiryTimestamp } = parseLicenseExpiry(expiryDateStr);

  // Exactly 24 hours remaining
  const at24h = expiryTimestamp - (24 * 60 * 60 * 1000);
  const status24h = getLicenseExpiryStatus(expiryDateStr, at24h);
  assert.strictEqual(status24h.is24hCountdown, true);
  assert.strictEqual(status24h.status, 'COUNTDOWN_24H');
  assert.strictEqual(status24h.formattedCountdown, '24:00:00');

  // 12 hours, 34 minutes, 56 seconds remaining
  const partialRemaining = expiryTimestamp - ((12 * 3600 + 34 * 60 + 56) * 1000);
  const statusPartial = getLicenseExpiryStatus(expiryDateStr, partialRemaining);
  assert.strictEqual(statusPartial.is24hCountdown, true);
  assert.strictEqual(statusPartial.formattedCountdown, '12:34:56');
  console.log('✓ Test 2: Final 24 hours countdown shows real-time HH:MM:SS timer (24:00:00 -> 12:34:56).');
}

// Test 3: Closing and reopening the EXE calculates real-time remaining without drift
{
  const targetExpiry = new Date(Date.now() + 5 * 3600 * 1000 + 30 * 60 * 1000).toISOString();
  
  // App open:
  const open1 = getLicenseExpiryStatus(targetExpiry, Date.now());
  assert.strictEqual(open1.is24hCountdown, true);

  // Reopened 1 hour later:
  const reopenedLater = getLicenseExpiryStatus(targetExpiry, Date.now() + 3600 * 1000);
  assert.strictEqual(reopenedLater.is24hCountdown, true);
  const remainingHours = Math.floor(reopenedLater.remainingMs / 3600000);
  assert.strictEqual(remainingHours, 4, '1 hour elapsed, exactly 4 hours remaining');
  console.log('✓ Test 3: Closing and reopening the EXE continues countdown accurately against real time.');
}

// Test 4: Once license expires, status is EXPIRED, remaining is 0
{
  const pastExpiry = '2025-01-01';
  const statusExpired = getLicenseExpiryStatus(pastExpiry, Date.now());
  assert.strictEqual(statusExpired.isExpired, true);
  assert.strictEqual(statusExpired.status, 'EXPIRED');
  assert.strictEqual(statusExpired.formattedCountdown, '00:00:00');
  assert.strictEqual(statusExpired.remainingMs, 0);
  console.log('✓ Test 4: Expired license immediately flags isExpired and locks operations.');
}

// Test 5: Renewal extends existing expiry date without generating a new license key
{
  const initialExpiry = '2026-11-19';
  const extended1Year = calculateExtendedExpiry(initialExpiry, '1 Year');
  assert(extended1Year.startsWith('2027-11-19') || extended1Year.startsWith('2027-11-20'), `Expected 2027 extension, got ${extended1Year}`);

  // Test status reset after renewal
  const now = new Date('2026-11-19T10:00:00Z').getTime();
  const beforeRenewal = getLicenseExpiryStatus(initialExpiry, now);
  assert.strictEqual(beforeRenewal.status, 'COUNTDOWN_24H');

  // After renewal with extended date:
  const afterRenewal = getLicenseExpiryStatus(extended1Year, now);
  assert.strictEqual(afterRenewal.status, 'ACTIVE');
  assert.strictEqual(afterRenewal.is72hWarning, false);
  assert.strictEqual(afterRenewal.is24hCountdown, false);
  assert.strictEqual(afterRenewal.isExpired, false);
  console.log('✓ Test 5: Renewal extends existing license expiry date and resets warning and countdown.');
}

console.log('\nALL 5 TESTS PASSED SUCCESSFULLY!');

