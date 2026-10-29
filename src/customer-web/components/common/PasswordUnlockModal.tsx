import React, { useState } from 'react';
import { Lock, KeyRound, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { TranslationKeys } from '../../locales';

interface PasswordUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  onUnlock: (password: string) => void;
  t: TranslationKeys;
}

export const PasswordUnlockModal: React.FC<PasswordUnlockModalProps> = ({
  isOpen,
  onClose,
  fileName,
  onUnlock,
  t,
}) => {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setStatus('success');
    setTimeout(() => {
      onUnlock(password);
      setPassword('');
      setStatus('idle');
      onClose();
    }, 400);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.unlockModalTitle}>
      <form onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center', margin: '12px 0 20px' }}>
          <div
            style={{
              display: 'inline-grid',
              placeItems: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--pb-warning-soft)',
              color: 'var(--pb-warning)',
              marginBottom: '10px',
            }}
          >
            <Lock size={22} />
          </div>
          <strong style={{ display: 'block', fontSize: '1rem', marginBottom: '4px' }}>
            {fileName}
          </strong>
          <p style={{ color: 'var(--pb-muted)', fontSize: '0.82rem' }}>
            {t.unlockModalDesc}
          </p>
        </div>

        <div className="pb-form-group" style={{ marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="password"
              className="pb-input-control"
              style={{ width: '100%', paddingLeft: '38px' }}
              placeholder={t.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <KeyRound
              size={18}
              color="var(--pb-muted)"
              style={{ position: 'absolute', left: '12px', top: '13px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              minHeight: '44px',
              borderRadius: 'var(--pb-radius-md)',
              border: '1px solid var(--pb-border)',
              background: 'transparent',
              color: 'var(--pb-text)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="pb-btn-primary"
            style={{ flex: 1.5, minHeight: '44px' }}
            disabled={!password}
          >
            {status === 'success' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Unlocked
              </span>
            ) : (
              t.unlockButton
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
