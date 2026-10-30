import React, { useState } from 'react';
import { 
  Download, 
  Check, 
  Copy, 
  ShieldCheck, 
  Laptop, 
  Cpu, 
  HardDrive, 
  FileCode, 
  AlertCircle, 
  ChevronRight, 
  ExternalLink,
  Sparkles,
  Terminal,
  Printer
} from 'lucide-react';
import { 
  DOWNLOAD_CONFIG, 
  triggerInstallerDownload, 
  type InstallerArtifact 
} from '../config/download';

interface DownloadPageProps {
  onOpenDownloadModal: () => void;
}

export const DownloadPage: React.FC<DownloadPageProps> = ({ onOpenDownloadModal }) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const primaryArtifact = DOWNLOAD_CONFIG.artifacts.find((a) => a.recommended) || DOWNLOAD_CONFIG.artifacts[0];

  const handleCopy = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleDownloadArtifact = (art: InstallerArtifact) => {
    triggerInstallerDownload(art);
    onOpenDownloadModal();
  };

  return (
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
      
      {/* ---------------- 1. PAGE HEADER ---------------- */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-xs font-semibold uppercase tracking-wider">
          Official Windows Release
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Download Print Bot for Windows
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          Production desktop workstation for Windows 10 & 11 (64-bit). Native Win32 Print Spooler integration, local SQLite journal, and touchless QR counter engine.
        </p>
      </div>

      {/* ---------------- 2. PRIMARY DOWNLOAD HERO CARD ---------------- */}
      <div className="max-w-4xl mx-auto">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#0E1424] via-[#0A0D15] to-[#0A0D15] border border-brand-blue/30 shadow-2xl relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue to-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-blue/30">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {primaryArtifact.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="font-semibold text-emerald-400">Stable Release v{DOWNLOAD_CONFIG.currentVersion}</span>
                    <span>•</span>
                    <span>{DOWNLOAD_CONFIG.supportedOS}</span>
                    <span>•</span>
                    <span className="font-mono">{primaryArtifact.filesize}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                {primaryArtifact.description} Built with Tauri 2 + native Rust with sub-40MB memory usage.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.08] font-mono">
                  Filename: {primaryArtifact.filename}
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>VirusTotal Clean • Authenticode Ready</span>
                </span>
              </div>
            </div>

            {/* Direct Download Button */}
            <div className="flex flex-col items-stretch sm:items-end gap-2 w-full md:w-auto flex-shrink-0">
              <button
                onClick={() => handleDownloadArtifact(primaryArtifact)}
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-600 hover:from-blue-600 hover:to-brand-700 rounded-xl shadow-xl shadow-brand-blue/30 hover:shadow-brand-blue/45 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer group"
              >
                <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                <span>Download for Windows</span>
              </button>
              <span className="text-[11px] text-slate-400 text-center sm:text-right">
                Free standard setup ({primaryArtifact.filesize})
              </span>
            </div>
          </div>

          {/* Verification Bar */}
          <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] overflow-hidden">
              <span className="font-semibold text-slate-300">SHA-256:</span>
              <span className="truncate max-w-[280px] sm:max-w-md text-slate-400 select-all">
                {primaryArtifact.sha256}
              </span>
            </div>
            <button
              onClick={() => handleCopy(primaryArtifact.sha256, primaryArtifact.id)}
              className="text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
            >
              {copiedHash === primaryArtifact.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied SHA-256</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Checksum</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ---------------- 3. ALTERNATIVE PACKAGES ---------------- */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h3 className="text-lg font-bold text-white tracking-tight">
          Additional Package Formats & Distribution Mirrors
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOWNLOAD_CONFIG.artifacts
            .filter((a) => !a.recommended)
            .map((art) => (
              <div
                key={art.id}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 uppercase">
                      {art.format}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{art.filesize}</span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-2">
                    {art.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {art.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <div className="text-[11px] font-mono text-slate-500 truncate max-w-[180px]">
                    {art.filename}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(art.sha256, art.id)}
                      className="p-1.5 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                      title="Copy SHA-256"
                    >
                      {copiedHash === art.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownloadArtifact(art)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-white/[0.08] hover:bg-white/[0.14] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ---------------- 4. SYSTEM REQUIREMENTS ---------------- */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            System Requirements
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Print Bot is engineered specifically for Windows workstations, counter desktops, and POS setups.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-xs text-slate-400">
                <th className="py-3.5 px-5 font-semibold uppercase tracking-wider">Component</th>
                <th className="py-3.5 px-5 font-semibold uppercase tracking-wider">Minimum</th>
                <th className="py-3.5 px-5 font-semibold uppercase tracking-wider text-brand-300">Recommended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {DOWNLOAD_CONFIG.systemRequirements.map((req, idx) => (
                <tr key={idx} className="hover:bg-white/[0.01]">
                  <td className="py-3.5 px-5 font-medium text-white">{req.category}</td>
                  <td className="py-3.5 px-5 text-slate-400">{req.minimum}</td>
                  <td className="py-3.5 px-5 text-slate-200">{req.recommended}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- 5. STEP-BY-STEP INSTALLATION GUIDE ---------------- */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Installation & Setup Instructions
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Get your counter setup up and running in less than two minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DOWNLOAD_CONFIG.installationSteps.map((step) => (
            <div
              key={step.step}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3"
            >
              <div className="w-8 h-8 rounded-full bg-brand-blue/20 text-brand-400 border border-brand-blue/30 flex items-center justify-center font-mono font-bold text-sm">
                0{step.step}
              </div>
              <h4 className="text-base font-bold text-white">
                {step.title}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {step.description}
              </p>
              {step.note && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
                  <strong>Notice:</strong> {step.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- 6. RELEASE NOTES & CHANGELOG ---------------- */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Release Notes — Version {DOWNLOAD_CONFIG.latestRelease.version}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Released on {DOWNLOAD_CONFIG.latestRelease.releaseDate} • Status: {DOWNLOAD_CONFIG.latestRelease.status}
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Production Build
          </span>
        </div>

        {/* Highlights */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Key Architectural Highlights:
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
            {DOWNLOAD_CONFIG.latestRelease.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Categorized Changes */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Module Changelog:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DOWNLOAD_CONFIG.latestRelease.changes.map((c, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5"
              >
                <div className="text-[11px] font-mono font-semibold text-brand-400 uppercase">
                  [{c.category}]
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  {c.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

