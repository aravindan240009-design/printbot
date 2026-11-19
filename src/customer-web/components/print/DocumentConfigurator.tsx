import React from 'react';
import { Camera, Crop, RotateCcw, RotateCw } from 'lucide-react';
import {
  DocumentItem,
  PrintOptions,
  PaperSize,
  OrientationOption,
  ShopRates,
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
  rates?: ShopRates;
}

export const DocumentConfigurator: React.FC<DocumentConfiguratorProps> = ({
  files,
  activeFile,
  onSetActiveFile,
  applyToAll,
  onToggleApplyToAll,
  onUpdateOptions,
  t,
  rates,
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
        <div className="pb-pill-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <button
            type="button"
            className={`pb-pill-choice ${options.colorMode === 'bw' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ colorMode: 'bw' })}
          >
            <span>{t.colorBw}</span>
            <span className="pb-pill-subtext">{rates?.bwPerSideRupees ? `₹${rates.bwPerSideRupees.toFixed(2)}/pg` : t.colorBwPrice}</span>
          </button>

          <button
            type="button"
            className={`pb-pill-choice ${options.colorMode === 'color' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ colorMode: 'color' })}
          >
            <span style={{ color: options.colorMode === 'color' ? 'var(--pb-brand)' : undefined, fontWeight: 750 }}>
              {t.colorFull}
            </span>
            <span className="pb-pill-subtext">{rates?.colorPerSideRupees ? `₹${rates.colorPerSideRupees.toFixed(2)}/pg` : t.colorFullPrice}</span>
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

      {/* Photo & Media Capabilities (Phase 2) */}
      <div className="pb-form-group">
        <label className="pb-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Camera size={14} color="var(--pb-brand)" />
          Photo &amp; Passport Sheet Layout
        </label>
        <div className="pb-pill-grid pb-photo-preset-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <button
            type="button"
            className={`pb-pill-choice ${options.photoPreset === 'standard' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ photoPreset: 'standard' })}
          >
            <span>📄 Full Page</span>
            <span className="pb-pill-subtext">Fit to standard page</span>
          </button>
          <button
            type="button"
            className={`pb-pill-choice ${options.photoPreset === 'passport_8up' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({
              photoPreset: 'passport_8up',
              photoCrop: options.photoCrop || { zoom: 1, panX: 0, panY: 0, rotation: 0, aspectRatio: '3.5:4.5' },
            })}
          >
            <span style={{ fontWeight: 750, color: options.photoPreset === 'passport_8up' ? 'var(--pb-brand)' : undefined }}>
              🛂 Passport Sheet (8 Photos)
            </span>
            <span className="pb-pill-subtext">35×45mm with cutting guides</span>
          </button>
          <button
            type="button"
            className={`pb-pill-choice ${options.photoPreset === 'photo_4x6' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({
              photoPreset: 'photo_4x6',
              photoCrop: options.photoCrop || { zoom: 1, panX: 0, panY: 0, rotation: 0, aspectRatio: '4:6' },
            })}
          >
            <span>🖼️ 4×6 Photo Print</span>
            <span className="pb-pill-subtext">Standard studio size</span>
          </button>
          <button
            type="button"
            className={`pb-pill-choice ${options.photoPreset === 'id_card' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({
              photoPreset: 'id_card',
              photoCrop: options.photoCrop || { zoom: 1, panX: 0, panY: 0, rotation: 0, aspectRatio: 'free' },
            })}
          >
            <span>🪪 ID Card (2-Up)</span>
            <span className="pb-pill-subtext">Front &amp; back on 1 page</span>
          </button>
        </div>
      </div>

      {/* Interactive Aspect Ratio Cropping & Alignment (Phase 2) */}
      {options.photoPreset !== 'standard' && (
        <div
          className="pb-photo-crop-panel"
          style={{
            background: 'var(--pb-surface-alt, #f8fafc)',
            border: '1px solid var(--pb-border, #e2e8f0)',
            borderRadius: 'var(--pb-radius-md, 12px)',
            padding: '12px 14px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 750, color: 'var(--pb-text, #1e293b)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Crop size={14} color="var(--pb-brand)" />
              Photo Crop &amp; Alignment
            </span>
            <button
              type="button"
              onClick={() => onUpdateOptions({
                photoCrop: {
                  zoom: 1,
                  panX: 0,
                  panY: 0,
                  rotation: 0,
                  aspectRatio: options.photoPreset === 'passport_8up' ? '3.5:4.5' : options.photoPreset === 'photo_4x6' ? '4:6' : 'free',
                },
              })}
              style={{
                fontSize: '0.72rem',
                color: 'var(--pb-brand, #2563eb)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 650,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <RotateCcw size={11} /> Reset
            </button>
          </div>

          {/* Aspect Ratio Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--pb-muted, #64748b)', marginRight: '4px' }}>Crop Ratio:</span>
            {[
              { id: '3.5:4.5', label: 'Passport (3.5:4.5)' },
              { id: '4:6', label: 'Photo (4:6)' },
              { id: '1:1', label: 'Square (1:1)' },
              { id: 'free', label: 'Free / Original' },
            ].map((ratio) => (
              <button
                key={ratio.id}
                type="button"
                onClick={() => onUpdateOptions({
                  photoCrop: {
                    ...(options.photoCrop || { zoom: 1, panX: 0, panY: 0, rotation: 0 }),
                    aspectRatio: ratio.id as any,
                  },
                })}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.73rem',
                  fontWeight: 650,
                  cursor: 'pointer',
                  border: (options.photoCrop?.aspectRatio || (options.photoPreset === 'passport_8up' ? '3.5:4.5' : '4:6')) === ratio.id
                    ? '1px solid var(--pb-brand, #2563eb)'
                    : '1px solid var(--pb-border, #cbd5e1)',
                  background: (options.photoCrop?.aspectRatio || (options.photoPreset === 'passport_8up' ? '3.5:4.5' : '4:6')) === ratio.id
                    ? 'var(--pb-brand-soft, #eff6ff)'
                    : '#ffffff',
                  color: (options.photoCrop?.aspectRatio || (options.photoPreset === 'passport_8up' ? '3.5:4.5' : '4:6')) === ratio.id
                    ? 'var(--pb-brand, #2563eb)'
                    : 'var(--pb-text-secondary, #475569)',
                }}
              >
                {ratio.label}
              </button>
            ))}
          </div>

          {/* Zoom Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--pb-muted)', marginBottom: '3px' }}>
              <span>Zoom / Head Size</span>
              <span style={{ fontWeight: 700, color: 'var(--pb-text)' }}>{Math.round((options.photoCrop?.zoom || 1) * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={options.photoCrop?.zoom || 1}
              onChange={(e) => onUpdateOptions({
                photoCrop: {
                  ...(options.photoCrop || { panX: 0, panY: 0, rotation: 0, aspectRatio: '3.5:4.5' }),
                  zoom: parseFloat(e.target.value),
                },
              })}
              style={{ width: '100%', accentColor: 'var(--pb-brand)' }}
            />
          </div>

          {/* Vertical Pan (Align Face / Chin) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--pb-muted)', marginBottom: '3px' }}>
              <span>Vertical Position (Center Face)</span>
              <span style={{ fontWeight: 700, color: 'var(--pb-text)' }}>{options.photoCrop?.panY || 0}px</span>
            </div>
            <input
              type="range"
              min="-80"
              max="80"
              step="2"
              value={options.photoCrop?.panY || 0}
              onChange={(e) => onUpdateOptions({
                photoCrop: {
                  ...(options.photoCrop || { zoom: 1, panX: 0, rotation: 0, aspectRatio: '3.5:4.5' }),
                  panY: parseInt(e.target.value, 10),
                },
              })}
              style={{ width: '100%', accentColor: 'var(--pb-brand)' }}
            />
          </div>

          {/* Rotate Button */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="pb-btn pb-btn-secondary"
              onClick={() => onUpdateOptions({
                photoCrop: {
                  ...(options.photoCrop || { zoom: 1, panX: 0, panY: 0, aspectRatio: '3.5:4.5' }),
                  rotation: ((options.photoCrop?.rotation || 0) + 90) % 360,
                },
              })}
              style={{ fontSize: '0.75rem', padding: '4px 10px', height: '30px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <RotateCw size={13} /> Rotate 90° ({options.photoCrop?.rotation || 0}°)
            </button>
          </div>
        </div>
      )}

      {/* Page Range Selection (Always Visible on Main Card) */}
      <div className="pb-form-group">
        <VisualPageRangePicker
          range={options.pageRange}
          totalPageCount={activeFile.pageCount || 1}
          onChange={(newRange) => onUpdateOptions({ pageRange: newRange })}
          t={t}
        />
      </div>

      {/* Duplex (Print Sides) */}
      <div className="pb-form-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label className="pb-form-label" style={{ margin: 0 }}>{t.duplex}</label>
          {rates?.duplexDiscountPercent && rates.duplexDiscountPercent > 0 ? (
            <span style={{ fontSize: '0.72rem', background: 'var(--pb-success-soft)', color: 'var(--pb-success)', padding: '2px 7px', borderRadius: 'var(--pb-radius-full)', fontWeight: 750, border: '1px solid var(--pb-success-border)' }}>
              🌱 Save {rates.duplexDiscountPercent}% on 2-Sided
            </span>
          ) : null}
        </div>
        <div className="pb-pill-grid pb-duplex-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <button
            type="button"
            className={`pb-pill-choice ${options.duplex === 'simplex' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ duplex: 'simplex' })}
          >
            <span>{t.duplexSimplex}</span>
            <span className="pb-pill-subtext">Print on front only</span>
          </button>
          <button
            type="button"
            className={`pb-pill-choice ${options.duplex !== 'simplex' ? 'active' : ''}`}
            onClick={() => onUpdateOptions({ duplex: 'duplex_long' })}
          >
            <span>{t.duplexLong}</span>
            <span className="pb-pill-subtext">Open like a book</span>
          </button>
        </div>
      </div>

      {/* Paper size and orientation */}
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
          <label className="pb-form-label">{t.orientation}</label>
          <select
            className="pb-select-control"
            value={options.orientation}
            onChange={(e) => onUpdateOptions({ orientation: e.target.value as OrientationOption })}
          >
            <option value="auto">{t.orientAuto}</option>
            <option value="portrait">{t.orientPortrait}</option>
            <option value="landscape">{t.orientLandscape}</option>
          </select>
        </div>
      </div>
    </div>
  );
};

