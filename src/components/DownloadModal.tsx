import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Check, 
  Copy, 
  ShieldCheck, 
  AlertCircle, 
  Laptop, 
  FileCode, 
  ExternalLink 
} from 'lucide-react';
import { DOWNLOAD_CONFIG, triggerInstallerDownload, type InstallerArtifact } from '../config/download';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedArtifact?: InstallerArtifact;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ 
  isOpen, 
  onClose,
  selectedArtifact 
}) => {
  const [artifact, setArtifact] = useState<InstallerArtifact>(() => {
    return selectedArtifact || DOWNLOAD_CONFIG.artifacts[0];
  });
  const [copied, setCopied] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (selectedArtifact) {
      setArtifact(selectedArtifact);
    }
  }, [selectedArtifact]);

  useEffect(() => {
    if (isOpen && !hasTriggered) {
      triggerInstallerDownload(artifact);
      setHasTriggered(true);
    }
    if (!isOpen) {
      setHasTriggered(false);
    }
  }, [isOpen, artifact, hasTriggered]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(artifact.sha256);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectArtifact = (art: InstallerArtifact) => {
    setArtifact(art);
    triggerInstallerDownload(art);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div 
        className="relative w-full max-w-2xl bg-[#0F1420] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden z-10 my-8 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
      >
        {/* Header bar */}
        <div className="p-6 pb-4 border-b border-white/[0.08] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/20 border border-brand-blue/30 flex items-center justify-center text-brand-400">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 id="download-modal-title" className="text-lg font-bold text-white tracking-tight">
                Downloading Print Bot for Windows
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Version {DOWNLOAD_CONFIG.currentVersion} • x86_64 Architecture • {artifact.filesize}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6">
          
          {/* Active Download Status */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-medium text-slate-400">Target File:</div>
              <div className="text-sm font-mono font-semibold text-white break-all">
                {artifact.filename}
              </div>
              <div className="text-xs text-emerald-400 flex items-center gap-1.5 pt-0.5">
                <Check className="w-3.5 h-3.5" />
                <span>Browser download initiated automatically</span>
              </div>
            </div>
            <button
              onClick={() => triggerInstallerDownload(artifact)}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-blue hover:bg-blue-600 rounded-lg transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-md shadow-brand-blue/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {artifact.format.toUpperCase()} ({artifact.filesize})</span>
            </button>
          </div>

          {/* Installer Format Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Select Package Format:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DOWNLOAD_CONFIG.artifacts.map((art) => {
                const isCurrent = art.id === artifact.id;
                return (
                  <button
                    key={art.id}
                    onClick={() => setArtifact(art)}
                    className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-brand-blue/15 border-brand-blue text-white shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{art.format.toUpperCase()}</span>
                      <span className="text-[10px] font-normal opacity-70">{art.filesize}</span>
                    </div>
                    <div className="text-[11px] truncate mt-1 text-slate-300">
                      {art.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checksum Hash */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">SHA-256 Checksum Verification:</span>
              <button
                onClick={handleCopyHash}
                className="text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SHA-256</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-2.5 rounded-lg bg-black/50 border border-white/[0.06] font-mono text-[11px] text-slate-300 break-all select-all">
              {artifact.sha256}
            </div>
          </div>

          {/* Quick Setup Checklist */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>3-Step Quick Start</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-white">1. Run Setup</span>
                <p className="text-slate-400 text-[11px]">
                  Open <code className="text-slate-300">{artifact.filename}</code> once downloaded.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-white">2. SmartScreen</span>
                <p className="text-slate-400 text-[11px]">
                  Click "More info" &gt; "Run anyway" if prompted by Windows.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-white">3. Pair Counter</span>
                <p className="text-slate-400 text-[11px]">
                  Launch Print Bot and scan your shop pairing QR code.
                </p>
              </div>
            </div>
          </div>

          {/* Browser SmartScreen Guidance */}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-white">Notice: "Isn't commonly downloaded" in Edge/Chrome?</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Microsoft Defender SmartScreen displays this standard advisory for any new software release. To proceed: hover the file in Downloads &gt; click <strong>... (three dots)</strong> &gt; <strong>Keep</strong> &gt; <strong>Show more</strong> &gt; <strong>Keep anyway</strong>.
              </p>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-black/40 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Authenticode ready • Clean binary guarantee</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-white font-medium transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

