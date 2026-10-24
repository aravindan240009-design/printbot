export interface InstallerConfig {
  url: string | null;
  isValid: boolean;
  status: 'available' | 'coming_soon';
}

export function getInstallerConfig(): InstallerConfig {
  const rawUrl = import.meta.env.VITE_WINDOWS_INSTALLER_URL;

  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      url: null,
      isValid: false,
      status: 'coming_soon',
    };
  }

  const trimmed = rawUrl.trim();
  if (trimmed === '') {
    return {
      url: null,
      isValid: false,
      status: 'coming_soon',
    };
  }

  try {
    const parsed = new URL(trimmed);
    const isHttps = parsed.protocol === 'https:';
    const isExe = parsed.pathname.toLowerCase().endsWith('.exe');

    if (isHttps && isExe) {
      return {
        url: trimmed,
        isValid: true,
        status: 'available',
      };
    }
  } catch {
    // Malformed URL, fail safely
  }

  return {
    url: null,
    isValid: false,
    status: 'coming_soon',
  };
}
