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
      filesize: '3.38 MB',
      bytes: 3548570,
      downloadUrl: '/downloads/Print-Bot-1.0.0-x64-Setup.exe',
      sha256: '04E97004BA530D1DA5E5718792DC0BC54BAF6BC59B70CBD90603E40158557934',
      recommended: true,
      description: 'Standard single-click Windows installer with automatic start menu registration and desktop shortcut.',
    },
    {
      id: 'msi-package',
      name: 'Print Bot Workstation MSI Enterprise Package',
      type: 'Microsoft Windows Installer Package',
      format: 'msi',
      filename: 'Print-Bot-1.0.0-x64.msi',
      filesize: '4.49 MB',
      bytes: 4706304,
      downloadUrl: '/downloads/Print-Bot-1.0.0-x64.msi',
      sha256: '2EE957BFC01367E656F27D575F1A1A955012B9C7F24DA45B1D0813EA520C405A',
      recommended: false,
      description: 'Enterprise MSI package with support for silent install (msiexec /qn) and Active Directory Group Policy deployment.',
    },
    {
      id: 'portable-exe',
      name: 'Print Bot Portable Workstation',
      type: 'Standalone Single-File Binary',
      format: 'exe',
      filename: 'print-bot.exe',
      filesize: '10.86 MB',
      bytes: 11383808,
      downloadUrl: '/downloads/print-bot.exe',
      sha256: 'B4F8FBBE4E2F56E758A320D59291312223375956BED890950DDA6E8C12C89ABA',
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
      description: 'Click "Download for Windows" to fetch the 3.38 MB setup executable (Print-Bot-1.0.0-x64-Setup.exe).',
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
      'High-speed native Windows desktop architecture with sub-40MB memory footprint',
      'Direct Windows Print Spooler integration with automatic paper size and duplex detection',
      'Local print audit journal providing 100% duplicate job rejection and shift reconciliation',
      'Integrated touchless QR customer order receiver with instant PDF preview and live rupee pricing',
      'Audio alert chime notifications for incoming customer counter print jobs',
    ],
    changes: [
      {
        category: 'Workstation',
        description: 'Responsive multi-pane counter dashboard with queue management, filter by state, and instant job approval.',
      },
      {
        category: 'Print Spooler',
        description: 'Native automatic printer discovery for USB, network LAN, and Wi-Fi printers.',
      },
      {
        category: 'Security',
        description: 'End-to-end customer document privacy with automatic file purge post-printing.',
      },
      {
        category: 'Customer Flow',
        description: 'Mobile-optimized QR document configurator with visual page range selection and live price breakdown.',
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

