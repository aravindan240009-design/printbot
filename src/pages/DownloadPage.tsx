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
    <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 bg-slate-50 text-slate-900">
      
      {/* ---------------- 1. PAGE HEADER ---------------- */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold uppercase tracking-wider">
          Official Windows Release
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Download Print Bot for Windows
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Production desktop workstation for Windows 10 & 11 (64-bit). Direct Windows Print Spooler integration, local audit journal, and touchless QR counter engine.
        </p>
      </div>

      {/* ---------------- 2. PRIMARY DOWNLOAD HERO CARD ---------------- */}
      <div className="max-w-4xl mx-auto">
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <Printer className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {primaryArtifact.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Stable v{DOWNLOAD_CONFIG.currentVersion}</span>
                    <span>•</span>
                    <span>{DOWNLOAD_CONFIG.supportedOS}</span>
                    <span>•</span>
                    <span className="font-mono">{primaryArtifact.filesize}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
                {primaryArtifact.description} Lightweight, starts instantly, and uses under 40 MB of memory.
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono text-slate-700 font-medium">
                  Filename: {primaryArtifact.filename}
                </span>
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>VirusTotal Clean • Verified Package</span>
                </span>
              </div>
            </div>

            {/* Direct Download Button */}
            <div className="flex flex-col items-stretch sm:items-end gap-2 w-full md:w-auto flex-shrink-0">
              <button
                onClick={() => handleDownloadArtifact(primaryArtifact)}
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer group"
              >
                <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                <span>Download for Windows</span>
              </button>
              <span className="text-[11px] text-slate-500 text-center sm:text-right">
                Free standard setup ({primaryArtifact.filesize})
              </span>
            </div>
          </div>

          {/* Verification Bar */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-mono text-[11px] overflow-hidden">
              <span className="font-bold text-slate-800">SHA-256:</span>
              <span className="truncate max-w-[280px] sm:max-w-md text-slate-500 select-all font-mono">
                {primaryArtifact.sha256}
              </span>
            </div>
            <button
              onClick={() => handleCopy(primaryArtifact.sha256, primaryArtifact.id)}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
            >
              {copiedHash === primaryArtifact.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied SHA-256</span>
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
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          Additional Package Formats & Distribution Mirrors
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOWNLOAD_CONFIG.artifacts
            .filter((a) => !a.recommended)
            .map((art) => (
              <div
                key={art.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between hover:border-blue-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      {art.format}
                    </span>
                    <span className="text-xs font-mono text-slate-500 font-medium">{art.filesize}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2">
                    {art.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {art.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-mono text-slate-500 truncate max-w-[180px]">
                    {art.filename}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(art.sha256, art.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                      title="Copy SHA-256 checksum"
                    >
                      {copiedHash === art.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownloadArtifact(art)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
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
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            System Requirements
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Print Bot is engineered to run reliably on any standard counter computer.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
                <th className="py-3.5 px-5 font-bold uppercase tracking-wider">Component</th>
                <th className="py-3.5 px-5 font-bold uppercase tracking-wider">Minimum</th>
                <th className="py-3.5 px-5 font-bold uppercase tracking-wider text-blue-700">Recommended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DOWNLOAD_CONFIG.systemRequirements.map((req, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-5 font-semibold text-slate-900">{req.category}</td>
                  <td className="py-3.5 px-5 text-slate-600">{req.minimum}</td>
                  <td className="py-3.5 px-5 text-slate-900 font-medium">{req.recommended}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- 5. STEP-BY-STEP INSTALLATION GUIDE ---------------- */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            Installation & Setup Instructions
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Get your counter setup up and running in less than two minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DOWNLOAD_CONFIG.installationSteps.map((step) => (
            <div
              key={step.step}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-mono font-bold text-sm">
                0{step.step}
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {step.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {step.description}
              </p>
              {step.note && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                  <strong>Notice:</strong> {step.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- 6. RELEASE NOTES & CHANGELOG ---------------- */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              Release Notes — Version {DOWNLOAD_CONFIG.latestRelease.version}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Released on {DOWNLOAD_CONFIG.latestRelease.releaseDate} • Status: {DOWNLOAD_CONFIG.latestRelease.status}
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Production Build
          </span>
        </div>

        {/* Highlights */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Key Architectural Highlights:
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
            {DOWNLOAD_CONFIG.latestRelease.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Categorized Changes */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Module Changelog:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DOWNLOAD_CONFIG.latestRelease.changes.map((c, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5"
              >
                <div className="text-[11px] font-mono font-bold text-blue-700 uppercase">
                  [{c.category}]
                </div>
                <div className="text-xs text-slate-600 leading-relaxed">
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
