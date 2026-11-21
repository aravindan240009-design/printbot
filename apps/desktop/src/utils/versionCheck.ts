export const CURRENT_DESKTOP_VERSION = '1.0.0';

export interface DesktopReleaseInfo {
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  mandatory?: boolean;
  publishedAt?: string;
  minVersion?: string;
}

/**
 * Returns true if the remote version string is strictly greater than the current version string.
 * Example: isNewerVersion('1.0.1', '1.0.0') -> true
 * Example: isNewerVersion('1.0.0', '1.0.0') -> false
 */
export function isNewerVersion(remote: string | undefined | null, current: string = CURRENT_DESKTOP_VERSION): boolean {
  if (!remote) return false;
  const clean = (v: string) =>
    v
      .replace(/^v/i, '')
      .trim()
      .split('.')
      .map((n) => parseInt(n, 10) || 0);

  const rParts = clean(remote);
  const cParts = clean(current);

  const len = Math.max(rParts.length, cParts.length);
  for (let i = 0; i < len; i++) {
    const r = rParts[i] || 0;
    const c = cParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }

  return false;
}

