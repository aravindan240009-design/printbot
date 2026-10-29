import React, { useState, useEffect } from 'react';
import { TranslationKeys } from '../../locales';
import { parsePageRange, isPageRangeValid } from '../../utils/pricing';

interface VisualPageRangePickerProps {
  range: string;
  totalPageCount: number;
  onChange: (newRange: string) => void;
  t: TranslationKeys;
}

export const VisualPageRangePicker: React.FC<VisualPageRangePickerProps> = ({
  range,
  totalPageCount,
  onChange,
  t,
}) => {
  const [customInput, setCustomInput] = useState(range || 'all');
  const valid = isPageRangeValid(customInput);
  const total = Math.max(1, totalPageCount || 1);
  const selectedPages = parsePageRange(range, total);

  useEffect(() => {
    setCustomInput(range || 'all');
  }, [range]);

  const handleInputChange = (val: string) => {
    setCustomInput(val);
    if (isPageRangeValid(val)) {
      onChange(val);
    }
  };

  const handlePreset = (preset: 'all' | 'odd' | 'even') => {
    setCustomInput(preset);
    onChange(preset);
  };

  const togglePage = (pageNum: number) => {
    const currentList = new Set(selectedPages);
    if (currentList.has(pageNum)) {
      if (currentList.size > 1) {
        currentList.delete(pageNum);
      }
    } else {
      currentList.add(pageNum);
    }

    const sorted = Array.from(currentList).sort((a, b) => a - b);
    if (sorted.length === total) {
      handlePreset('all');
      return;
    }

    // Convert array of pages into compact range string
    const ranges: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) {
        prev = sorted[i];
      } else {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = sorted[i];
        prev = sorted[i];
      }
    }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);

    const result = ranges.join(',');
    setCustomInput(result);
    onChange(result);
  };

  return (
    <div className="pb-page-range-box">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{t.pageRange}</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--pb-muted)' }}>
          {selectedPages.length} of {total} {total === 1 ? 'page' : 'pages'} selected
        </span>
      </div>

      <input
        type="text"
        className="pb-input-control"
        style={{ width: '100%', marginBottom: '8px' }}
        value={customInput}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={t.pageRangeHint}
        aria-invalid={!valid}
      />

      {!valid && (
        <p style={{ color: 'var(--pb-danger)', fontSize: '0.75rem', marginBottom: '8px' }}>
          Invalid format. Use formats like: 1-3, 5, 8-
        </p>
      )}

      {/* Quick Preset Buttons */}
      <div className="pb-range-chips-row">
        <button
          type="button"
          className={`pb-range-chip-btn ${customInput === 'all' ? 'active' : ''}`}
          onClick={() => handlePreset('all')}
        >
          {t.allPages}
        </button>
        <button
          type="button"
          className={`pb-range-chip-btn ${customInput === 'odd' ? 'active' : ''}`}
          onClick={() => handlePreset('odd')}
        >
          {t.oddPages}
        </button>
        <button
          type="button"
          className={`pb-range-chip-btn ${customInput === 'even' ? 'active' : ''}`}
          onClick={() => handlePreset('even')}
        >
          {t.evenPages}
        </button>
      </div>

      {/* Interactive Page Chips (if total pages <= 60 for clean UI) */}
      {total > 1 && total <= 60 && (
        <div style={{ marginTop: '12px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--pb-muted)', display: 'block', marginBottom: '4px' }}>
            Tap pages to include/exclude:
          </span>
          <div className="pb-interactive-pages-grid">
            {Array.from({ length: total }, (_, i) => i + 1).map((num) => {
              const isIncluded = selectedPages.includes(num);
              return (
                <button
                  type="button"
                  key={num}
                  className={`pb-page-chip ${isIncluded ? 'included' : 'excluded'}`}
                  onClick={() => togglePage(num)}
                  aria-label={`Page ${num} - ${isIncluded ? 'Included' : 'Excluded'}`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
