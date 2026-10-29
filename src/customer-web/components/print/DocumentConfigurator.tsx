import React from 'react';
import {
  SlidersHorizontal,
  Layers,
  Check,
  BookOpen,
  Paperclip,
  Bookmark,
  Camera,
  FileCheck,
  Percent,
} from 'lucide-react';
import {
  DocumentItem,
  PrintOptions,
  ColorMode,
  DuplexMode,
  PaperSize,
  PaperGsm,
  FinishingOption,
  PhotoPreset,
} from '../../types';
import { TranslationKeys } from '../../locales';
import { VisualPageRangePicker } from './VisualPageRangePicker';

interface DocumentConfiguratorProps {
  files: DocumentItem[];
  activeFile: DocumentItem;
  onSetActiveFile: (id: string) => void;
  applyToAll: boolean;
  onToggleApplyToAll: (checked: boolean) => void;
  onUpdateOptions: (patch: Partial<PrintOptions>) => void;
  t: TranslationKeys;
}

export const DocumentConfigurator: React.FC<DocumentConfiguratorProps> = ({
  files,
  activeFile,
  onSetActiveFile,
  applyToAll,
  onToggleApplyToAll,
  onUpdateOptions,
  t,
}) => {
  const options = activeFile.options;

  const copyPresets = [1, 2, 5, 10, 25];

  return (
    <div className="pb-config-form" aria-label="Document print options">
      {/* File selector if multiple files */}
      {files.length > 1 && (
        <div className="pb-form-group">
          <label className="pb-form-label" htmlFor="active-doc-select">
            <span>{t.activeDocument}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--pb-muted)', fontWeight: 600 }}>
              {files.findIndex((f) => f.id === activeFile.id) + 1} of {files.length}
            </span>
          </label>
          <select
            id="active-doc-select"
            className="pb-select-control"
            value={activeFile.id}
            onChange={(e) => onSetActiveFile(e.target.value)}
          >
            {files.map((f, idx) => (
              <option key={f.id} value={f.id}>
                {idx + 1}. {f.name} ({f.pageCount || 1} {f.pageCount === 1 ? 'page' : 'pages'})
              </option>
            ))}
          </select>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px',
              fontSize: '0.85rem',
              color: 'var(--pb-text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => onToggleApplyToAll(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--pb-brand)' }}
            />
            <span>{t.applyToAll}</span>
          </label>
        </div>
      )}

      {/* Color Mode Selection */}
      <div className="pb-form-group">
        <label className="pb-form-label">{t.colorMode}</label>
        <div className="pb-pill-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <button
            type="button"
            className={`pb-pill-choice ${options.colorMode === 'bw' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ colorMode: 'bw' })}
          >
            <span>{t.colorBw}</span>
            <span className="pb-pill-subtext">{t.colorBwPrice}</span>
          </button>

          <button
            type="button"
            className={`pb-pill-choice ${options.colorMode === 'color' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ colorMode: 'color' })}
          >
            <span style={{ color: options.colorMode === 'color' ? 'var(--pb-brand)' : undefined, fontWeight: 750 }}>
              {t.colorFull}
            </span>
            <span className="pb-pill-subtext">{t.colorFullPrice}</span>
          </button>

          <button
            type="button"
            className={`pb-pill-choice ${options.colorMode === 'grayscale' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ colorMode: 'grayscale' })}
          >
            <span>{t.colorGrayscale}</span>
            <span className="pb-pill-subtext">{t.colorGrayscalePrice}</span>
          </button>
        </div>
      </div>

      {/* Copies Stepper & Quick Presets */}
      <div className="pb-form-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label className="pb-form-label" style={{ margin: 0 }}>{t.copies}</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            {copyPresets.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onUpdateOptions({ copies: num })}
                style={{
                  padding: '2px 8px',
                  minHeight: '26px',
                  borderRadius: 'var(--pb-radius-sm)',
                  border: options.copies === num ? '1px solid var(--pb-brand)' : '1px solid var(--pb-border)',
                  background: options.copies === num ? 'var(--pb-brand-soft)' : 'var(--pb-surface-alt)',
                  color: options.copies === num ? 'var(--pb-brand)' : 'var(--pb-text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="pb-copies-stepper">
          <button
            type="button"
            className="pb-stepper-btn"
            onClick={() => onUpdateOptions({ copies: Math.max(1, options.copies - 1) })}
            aria-label="Decrease copies"
          >
            -
          </button>
          <input
            type="number"
            className="pb-copies-input"
            min={1}
            max={999}
            value={options.copies}
            onChange={(e) =>
              onUpdateOptions({ copies: Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)) })
            }
            aria-label="Number of copies"
          />
          <button
            type="button"
            className="pb-stepper-btn"
            onClick={() => onUpdateOptions({ copies: Math.min(999, options.copies + 1) })}
            aria-label="Increase copies"
          >
            +
          </button>
        </div>
      </div>

      {/* Duplex (Print Sides) with 15% discount badge */}
      <div className="pb-form-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label className="pb-form-label" style={{ margin: 0 }}>{t.duplex}</label>
          <span style={{ fontSize: '0.72rem', background: 'var(--pb-success-soft)', color: 'var(--pb-success)', padding: '2px 7px', borderRadius: 'var(--pb-radius-full)', fontWeight: 750, border: '1px solid var(--pb-success-border)' }}>
            🌱 Save 15% on 2-Sided
          </span>
        </div>
        <div className="pb-pill-grid">
          <button
            type="button"
            className={`pb-pill-choice ${options.duplex === 'simplex' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ duplex: 'simplex' })}
          >
            <span>{t.duplexSimplex}</span>
            <span className="pb-pill-subtext">1 side / sheet</span>
          </button>
          <button
            type="button"
            className={`pb-pill-choice ${options.duplex === 'duplex_long' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ duplex: 'duplex_long' })}
          >
            <span>{t.duplexLong}</span>
            <span className="pb-pill-subtext">Book style (Long)</span>
          </button>
          <button
            type="button"
            className={`pb-pill-choice ${options.duplex === 'duplex_short' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ duplex: 'duplex_short' })}
          >
            <span>{t.duplexShort}</span>
            <span className="pb-pill-subtext">Flip style (Short)</span>
          </button>
        </div>
      </div>

      {/* Paper Size & Paper Weight */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div className="pb-form-group">
          <label className="pb-form-label">{t.paperSize}</label>
          <select
            className="pb-select-control"
            value={options.paperSize}
            onChange={(e) => onUpdateOptions({ paperSize: e.target.value as PaperSize })}
          >
            {(['A4', 'A3', 'A5', 'Legal', 'Letter'] as PaperSize[]).map((size) => (
              <option key={size} value={size}>
                {size} {size === 'A3' ? '(2x rate)' : size === 'Legal' ? '(+25%)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="pb-form-group">
          <label className="pb-form-label">{t.paperGsm}</label>
          <select
            className="pb-select-control"
            value={options.paperGsm}
            onChange={(e) => onUpdateOptions({ paperGsm: e.target.value as PaperGsm })}
          >
            <option value="75">{t.gsm75}</option>
            <option value="100">{t.gsm100} (+₹1)</option>
            <option value="220">{t.gsm220} (+₹4)</option>
          </select>
        </div>
      </div>

      {/* Finishing & Binding Options */}
      <div className="pb-form-group">
        <label className="pb-form-label">{t.finishing}</label>
        <div className="pb-pill-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
          <button
            type="button"
            className={`pb-pill-choice ${options.finishing === 'none' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ finishing: 'none' })}
          >
            <span>{t.finishingNone}</span>
            <span className="pb-pill-subtext">Loose</span>
          </button>
          <button
            type="button"
            className={`pb-pill-choice ${options.finishing === 'staple' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ finishing: 'staple' })}
          >
            <span>Corner Staple</span>
            <span className="pb-pill-subtext">+₹5.00</span>
          </button>
          <button
            type="button"
            className={`pb-pill-choice ${options.finishing === 'spiral' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ finishing: 'spiral' })}
          >
            <span>Spiral Coil</span>
            <span className="pb-pill-subtext">+₹40.00</span>
          </button>
          <button
            type="button"
            className={`pb-pill-choice ${options.finishing === 'hard_bind' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ finishing: 'hard_bind' })}
          >
            <span>Hard Bound</span>
            <span className="pb-pill-subtext">+₹150.00</span>
          </button>
        </div>
      </div>

      {/* Visual Page Range Picker */}
      <div className="pb-form-group">
        <VisualPageRangePicker
          range={options.pageRange}
          totalPageCount={activeFile.pageCount || 1}
          onChange={(newRange) => onUpdateOptions({ pageRange: newRange })}
          t={t}
        />
      </div>

      {/* Advanced N-Up & Photo Layout Details */}
      <details
        style={{
          border: '1px solid var(--pb-border)',
          borderRadius: 'var(--pb-radius-md)',
          padding: '12px 16px',
          background: 'var(--pb-surface-alt)',
        }}
      >
        <summary
          style={{
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <SlidersHorizontal size={16} />
          <span>Handouts (N-Up) &amp; Photo Layout Presets</span>
        </summary>

        <div style={{ display: 'grid', gap: '14px', marginTop: '14px' }}>
          {/* N-Up */}
          <div className="pb-form-group" style={{ marginBottom: 0 }}>
            <label className="pb-form-label">{t.pagesPerSheet}</label>
            <select
              className="pb-select-control"
              value={options.nup}
              onChange={(e) => onUpdateOptions({ nup: parseInt(e.target.value, 10) || 1 })}
            >
              <option value={1}>{t.nup1}</option>
              <option value={2}>{t.nup2}</option>
              <option value={4}>{t.nup4}</option>
              <option value={6}>{t.nup6}</option>
              <option value={9}>{t.nup9}</option>
              <option value={16}>{t.nup16}</option>
            </select>
          </div>

          {/* Photo Presets */}
          <div className="pb-form-group" style={{ marginBottom: 0 }}>
            <label className="pb-form-label">Photo &amp; ID Layout Preset</label>
            <select
              className="pb-select-control"
              value={options.photoPreset}
              onChange={(e) => onUpdateOptions({ photoPreset: e.target.value as PhotoPreset })}
            >
              <option value="standard">{t.presetStandard}</option>
              <option value="passport_8up">{t.presetPassport}</option>
              <option value="id_card">{t.presetIdCard}</option>
              <option value="photo_4x6">{t.presetPhoto4x6}</option>
            </select>
          </div>
        </div>
      </details>
    </div>
  );
};

