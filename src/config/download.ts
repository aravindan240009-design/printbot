/**
 * Print Bot - Centralized Software & Download Distribution Configuration
 * Controls installer URLs, binary metadata, system requirements, and release changelogs.
 */

export interface InstallerArtifact {
  id: 'nsis-setup' | 'msi-package' | 'portable-exe';
  name: string;
  type: string;
  format: 'exe' | 'msi';
  filename: string;
  filesize: string;
  bytes: number;
  downloadUrl: string;
  sha256: string;
  recommended?: boolean;
  description: string;
}

export interface SystemRequirement {
  category: string;
  minimum: string;
  recommended: string;
}

export interface ReleaseNote {
  version: string;
  releaseDate: string;
  status: 'Latest Stable' | 'Maintenance' | 'Beta';
  highlights: string[];
  changes: {
    category: 'Workstation' | 'Print Spooler' | 'Security' | 'Customer Flow';
    description: string;
  }[];
}

export interface DownloadConfiguration {
  appName: string;
  tagline: string;
  currentVersion: string;
  releaseDate: string;
  supportedOS: string;
  minWindowsVersion: string;
  artifacts: InstallerArtifact[];
  systemRequirements: SystemRequirement[];
  installationSteps: {
    step: number;
    title: string;
    description: string;
    note?: string;
  }[];
  latestRelease: ReleaseNote;
}

export const DOWNLOAD_CONFIG: DownloadConfiguration = {
  appName: 'Print Bot',
  tagline: 'High-Performance Windows Workstation & Touchless Counter OS',
  currentVersion: '1.0.0',
  releaseDate: 'November 02, 2026',
  supportedOS: 'Windows 10 & Windows 11 (64-bit)',
  minWindowsVersion: 'Windows 10 Build 1809 (Redstone 5) or later',
  
  artifacts: [
    {
      id: 'nsis-setup',
      name: 'Print Bot Workstation Setup (x64)',
      type: 'Windows Installer (NSIS Executable)',
      format: 'exe',
      filename: 'Print-Bot-1.0.0-x64-Setup.exe',
      filesize: '2.83 MB',
      bytes: 2967174,
      downloadUrl: '/downloads/Print-Bot-1.0.0-x64-Setup.exe',
      sha256: '163EDBE9A7D34F3FDB732B9B90F4A7D2317564D3129ECC06CE498D22422B1894',
      recommended: true,
      description: 'Standard single-click Windows installer with automatic start menu registration and desktop shortcut.',
    },
    {
      id: 'msi-package',
      name: 'Print Bot Workstation MSI Enterprise Package',
      type: 'Microsoft Windows Installer Package',
      format: 'msi',
      filename: 'Print-Bot-1.0.0-x64.msi',
      filesize: '3.91 MB',
      bytes: 4104192,
      downloadUrl: '/downloads/Print-Bot-1.0.0-x64.msi',
      sha256: '002EA39E2CB6A357AACEE52D5428F0C801D7508DFB0756896AFCBDFF6A2F3F7A',
      recommended: false,
      description: 'Enterprise MSI package with support for silent install (msiexec /qn) and Active Directory Group Policy deployment.',
    },
    {
      id: 'portable-exe',
      name: 'Print Bot Portable Workstation',
      type: 'Standalone Single-File Binary',
      format: 'exe',
      filename: 'print-bot.exe',
      filesize: '10.12 MB',
      bytes: 10609664,
      downloadUrl: '/downloads/print-bot.exe',
      sha256: 'C5D70BEDE7D2C3D628741DEA438B5AEB51664CB615607A85A1B319996EF3817D',
      recommended: false,
      description: 'Zero-install portable binary. Run directly from a USB stick or external drive on any Windows counter PC.',
    },
  ],

  systemRequirements: [
    {
      category: 'Operating System',
      minimum: 'Windows 10 (64-bit, v1809+)',
      recommended: 'Windows 11 (64-bit, latest release)',
    },
    {
      category: 'Processor',
      minimum: '1.0 GHz Dual-Core Intel/AMD x86_64',
      recommended: '2.0 GHz Quad-Core Intel Core i3/AMD Ryzen 3 or faster',
    },
    {
      category: 'Memory (RAM)',
      minimum: '2 GB System RAM',
      recommended: '4 GB System RAM or higher',
    },
    {
      category: 'Storage Space',
      minimum: '100 MB available disk space',
      recommended: '500 MB (for local spool cache and journals)',
    },
    {
      category: 'Display Resolution',
      minimum: '1280 x 720 (HD)',
      recommended: '1920 x 1080 (Full HD)',
    },
    {
      category: 'Print Hardware Support',
      minimum: 'Any printer with Windows spooler driver',
      recommended: 'Network or USB Thermal, Laser, or High-Speed Office Copiers',
    },
    {
      category: 'Runtime Dependencies',
      minimum: 'Microsoft Edge WebView2 (preinstalled in Windows 10/11)',
      recommended: 'Microsoft Edge WebView2 Evergreen',
    },
  ],

  installationSteps: [
    {
      step: 1,
      title: 'Download the Official Installer',
      description: 'Click "Download for Windows" to fetch the lightweight 2.81 MB setup executable (Print-Bot-1.0.0-x64-Setup.exe).',
    },
    {
      step: 2,
      title: 'Execute the Setup Wizard',
      description: 'Double-click the downloaded executable. The installer configures the native Rust runtime, sets up the local SQLite journal path, and adds Print Bot to your counter workspace.',
      note: 'If prompted by Windows SmartScreen on first run, select "More info" and click "Run anyway".',
    },
    {
      step: 3,
      title: 'Pair Your Shop or Launch Workstation',
      description: 'Launch Print Bot from your desktop. Scan or input your shop pairing token to instantly link your shop pricing, printers, and incoming customer queue.',
    },
  ],

  latestRelease: {
    version: '1.0.0',
    releaseDate: 'October 31, 2026',
    status: 'Latest Stable',
    highlights: [
      'Production Tauri 2 + Rust native desktop architecture with sub-40MB memory footprint',
      'Direct Windows Print Spooler integration via Winspool API with automatic paper size and duplex detection',
      'Cryptographic SQLite print journal providing 100% duplicate job rejection and audit integrity',
      'Integrated touchless QR customer order receiver with instant PDF preview and live rupee pricing',
      'Sound alerts with high-fidelity counter chimes for incoming print jobs',
    ],
    changes: [
      {
        category: 'Workstation',
        description: 'Engineered responsive multi-pane counter dashboard with queue management, filter by state, and instant job approval.',
      },
      {
        category: 'Print Spooler',
        description: 'Implemented Win32 native EnumPrinters discovery boundary for USB, network, and virtual printers.',
      },
      {
        category: 'Security',
        description: 'Enforced strict tenant boundaries and shop token validation, preventing accidental cross-shop spool requests.',
      },
      {
        category: 'Customer Flow',
        description: 'Added mobile-optimized QR document configurator with visual page range selection and live price breakdown.',
      },
    ],
  },
};

/**
 * Triggers the actual browser file download programmatically.
 */
export function triggerInstallerDownload(artifact?: InstallerArtifact): void {
  const target = artifact || DOWNLOAD_CONFIG.artifacts.find((a) => a.recommended) || DOWNLOAD_CONFIG.artifacts[0];
  if (!target) return;

  const link = document.createElement('a');
  link.href = target.downloadUrl;
  link.setAttribute('download', target.filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

