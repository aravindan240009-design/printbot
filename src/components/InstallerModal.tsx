import React, { useEffect } from 'react';

interface InstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallerModal: React.FC<InstallerModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            Windows Installer Status
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          <p>
            The Print Bot Windows desktop application and Rust print service are currently in closed pilot testing across commercial print shops.
          </p>

          <p>
            To activate direct downloading in this environment, configure your HTTPS installer release URL in the environment configuration:
          </p>

          <div className="modal-code-block">
            VITE_WINDOWS_INSTALLER_URL=https://releases.printbot.app/v1.0.0/PrintBot-Setup-x64.exe
          </div>

          <p>
            Once configured with a valid HTTPS executable destination, the download buttons will automatically trigger the official installer download.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
