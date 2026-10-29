import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOptionItem<T = string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export type SelectOptionType<T = string | number> = T | SelectOptionItem<T>;

export interface SelectProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOptionType<T>[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  menuStyle?: React.CSSProperties;
  ariaLabel?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  id?: string;
  name?: string;
}

function normalizeOption<T = string | number>(opt: SelectOptionType<T>): SelectOptionItem<T> {
  if (typeof opt === 'object' && opt !== null && 'value' in opt) {
    return opt as SelectOptionItem<T>;
  }
  return {
    value: opt as T,
    label: String(opt),
  };
}

export function Select<T extends string | number = string>({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  style,
  menuStyle,
  ariaLabel,
  disabled = false,
  size = 'md',
  fullWidth = false,
  id,
  name,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  const normalizedOptions = options.map(normalizeOption);
  const selectedIndex = normalizedOptions.findIndex((opt) => opt.value === value);
  const selectedOption = selectedIndex >= 0 ? normalizedOptions[selectedIndex] : null;

  // Sync highlightedIndex when opening
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, selectedIndex]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev + 1 >= normalizedOptions.length ? 0 : prev + 1;
            return next;
          });
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          setHighlightedIndex((prev) => {
            const next = prev - 1 < 0 ? normalizedOptions.length - 1 : prev - 1;
            return next;
          });
          break;
        }
        case 'Home': {
          e.preventDefault();
          setHighlightedIndex(0);
          break;
        }
        case 'End': {
          e.preventDefault();
          setHighlightedIndex(normalizedOptions.length - 1);
          break;
        }
        case 'Enter':
        case ' ': {
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
            const chosen = normalizedOptions[highlightedIndex];
            if (!chosen.disabled) {
              onChange(chosen.value);
              setIsOpen(false);
            }
          }
          break;
        }
        case 'Escape':
        case 'Tab': {
          setIsOpen(false);
          break;
        }
      }
    },
    [disabled, isOpen, highlightedIndex, normalizedOptions, onChange]
  );

  // Scroll highlighted item into view if listbox is scrollable
  useEffect(() => {
    if (isOpen && listboxRef.current && highlightedIndex >= 0) {
      const items = listboxRef.current.querySelectorAll('[role="option"]');
      const item = items[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option: SelectOptionItem<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`pb-select-container ${fullWidth ? 'pb-select-full' : ''} ${className}`}
      style={{
        position: 'relative',
        display: fullWidth ? 'block' : 'inline-block',
        minWidth: style?.minWidth || (size === 'sm' ? 140 : 160),
        ...style,
      }}
    >
      {/* Hidden input for HTML form submission compatibility */}
      {name && <input type="hidden" name={name} value={value !== undefined ? String(value) : ''} />}

      <button
        type="button"
        id={selectId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`pb-select-trigger pb-select-${size} ${isOpen ? 'pb-select-open' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          minHeight: size === 'sm' ? '38px' : size === 'lg' ? '50px' : '44px',
          padding: size === 'sm' ? '6px 12px' : '8px 14px',
          background: 'var(--pb-surface)',
          color: 'var(--pb-text)',
          border: '1.5px solid var(--pb-border-gold)',
          borderRadius: '11px',
          fontSize: size === 'sm' ? '13px' : '14px',
          fontWeight: 500,
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: isOpen
            ? '0 0 0 3px rgba(181, 136, 28, 0.22), 0 4px 12px rgba(0,0,0,0.06)'
            : '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {selectedOption?.icon && (
            <span style={{ display: 'inline-flex', flexShrink: 0 }}>
              {selectedOption.icon}
            </span>
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedOption ? selectedOption.label : <span style={{ color: 'var(--pb-muted)' }}>{placeholder}</span>}
          </span>
          {selectedOption?.badge && (
            <span style={{ marginLeft: 'auto', marginRight: '4px' }}>
              {selectedOption.badge}
            </span>
          )}
        </span>

        <ChevronDown
          size={16}
          aria-hidden="true"
          style={{
            marginLeft: '8px',
            flexShrink: 0,
            color: 'var(--pb-accent)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </button>

      {/* Luxury Animated Popover Menu */}
      {isOpen && (
        <ul
          ref={listboxRef}
          role="listbox"
          aria-labelledby={selectId}
          tabIndex={-1}
          className="pb-select-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            margin: 0,
            padding: '6px',
            listStyle: 'none',
            background: 'var(--pb-surface)',
            border: '1.5px solid var(--pb-border-gold)',
            borderRadius: '12px',
            boxShadow: '0 16px 36px -4px rgba(0, 0, 0, 0.16), 0 6px 14px rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(16px)',
            maxHeight: '260px',
            overflowY: 'auto',
            minWidth: '100%',
            width: 'max-content',
            ...menuStyle,
          }}
        >
          {normalizedOptions.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isHighlighted = idx === highlightedIndex;

            return (
              <li
                key={String(opt.value)}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled}
                onClick={() => handleSelect(opt)}
                onMouseEnter={() => !opt.disabled && setHighlightedIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: size === 'sm' ? '8px 10px' : '10px 12px',
                  borderRadius: '8px',
                  cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  opacity: opt.disabled ? 0.45 : 1,
                  background: isSelected
                    ? 'var(--pb-accent-soft, rgba(181, 136, 28, 0.12))'
                    : isHighlighted
                    ? 'rgba(181, 136, 28, 0.06)'
                    : 'transparent',
                  color: isSelected
                    ? 'var(--pb-accent, #b5881c)'
                    : 'var(--pb-text)',
                  fontWeight: isSelected ? 650 : 500,
                  fontSize: size === 'sm' ? '13px' : '14px',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  {opt.icon && (
                    <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                      {opt.icon}
                    </span>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{opt.label}</span>
                    {opt.description && (
                      <span style={{ fontSize: '11px', color: 'var(--pb-muted)', fontWeight: 400 }}>
                        {opt.description}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {opt.badge && <span>{opt.badge}</span>}
                  {isSelected && (
                    <Check
                      size={14}
                      aria-hidden="true"
                      style={{
                        color: 'var(--pb-accent, #b5881c)',
                        strokeWidth: 2.6,
                      }}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
