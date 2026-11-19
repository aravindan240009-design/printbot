import React from 'react';
import { Calendar, Clock, ChevronDown } from 'lucide-react';
import { type DateRangeType } from '../utils/analyticsUtils';

interface DateRangePickerProps {
  rangeType: DateRangeType;
  onChangeRange: (type: DateRangeType) => void;
  customStart: string;
  customEnd: string;
  onChangeCustomStart: (val: string) => void;
  onChangeCustomEnd: (val: string) => void;
  activeLabel?: string;
  compact?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  rangeType,
  onChangeRange,
  customStart,
  customEnd,
  onChangeCustomStart,
  onChangeCustomEnd,
  activeLabel,
  compact = false,
}) => {
  const options: { id: DateRangeType; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'month', label: 'This Month' },
    { id: 'all', label: 'All Time' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px',
        padding: compact ? '4px 0' : '10px 14px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px', color: '#64748b' }}>
        <Calendar size={15} color="#2563eb" />
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Filter Period:</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
        {options.map((opt) => {
          const isActive = rangeType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeRange(opt.id)}
              style={{
                border: 'none',
                background: isActive ? '#2563eb' : '#f1f5f9',
                color: isActive ? '#ffffff' : '#475569',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: isActive ? 750 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9';
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {rangeType === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>From:</label>
          <input
            type="date"
            value={customStart}
            onChange={(e) => onChangeCustomStart(e.target.value)}
            style={{
              padding: '4px 8px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '11.5px',
              color: '#0f172a',
              background: '#f8fafc',
            }}
          />
          <label style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>To:</label>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onChangeCustomEnd(e.target.value)}
            style={{
              padding: '4px 8px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '11.5px',
              color: '#0f172a',
              background: '#f8fafc',
            }}
          />
        </div>
      )}

      {activeLabel && rangeType !== 'custom' && (
        <div
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: '#64748b',
            background: '#f8fafc',
            padding: '3px 8px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            fontWeight: 600,
          }}
        >
          {activeLabel}
        </div>
      )}
    </div>
  );
};

