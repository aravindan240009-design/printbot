import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart2, Layers, DollarSign, Calendar, Sparkles, KeyRound } from 'lucide-react';
import { type ChartPoint } from '../utils/analyticsUtils';

export type ChartMetric = string;

export interface MetricOption {
  key: string;
  label: string;
  color: string;
  icon?: React.ReactNode;
  formatValue?: (val: number) => string;
  getValue: (point: ChartPoint) => number;
}

interface InteractiveLineGraphProps {
  data: ChartPoint[];
  title?: string;
  subtitle?: string;
  accentColor?: string;
  defaultMetric?: string;
  height?: number;
  customMetrics?: MetricOption[];
  emptyMessage?: string;
}

export const InteractiveLineGraph: React.FC<InteractiveLineGraphProps> = ({
  data,
  title = 'Revenue & Volume Trend',
  subtitle,
  accentColor = '#2563eb',
  defaultMetric = 'revenue',
  height = 240,
  customMetrics,
  emptyMessage,
}) => {
  const [metric, setMetric] = useState<string>(defaultMetric);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activeCustomMetric = useMemo(() => {
    if (!customMetrics || customMetrics.length === 0) return null;
    return customMetrics.find((m) => m.key === metric) || customMetrics[0];
  }, [customMetrics, metric]);

  // Extract values based on chosen metric
  const values = useMemo(() => {
    if (activeCustomMetric) {
      return data.map((d) => activeCustomMetric.getValue(d));
    }
    return data.map((d) => {
      if (metric === 'revenue') return d.revenue;
      if (metric === 'orders') return d.orders;
      return d.pages;
    });
  }, [data, metric, activeCustomMetric]);

  const totalValue = useMemo(() => values.reduce((a, b) => a + b, 0), [values]);
  const peakValue = useMemo(() => Math.max(...values, 0), [values]);
  const avgValue = useMemo(() => (values.length > 0 ? totalValue / values.length : 0), [values, totalValue]);

  // Find peak point index
  const peakIdx = useMemo(() => {
    if (peakValue <= 0) return -1;
    return values.indexOf(peakValue);
  }, [values, peakValue]);

  // Chart dimensions & scaling
  const svgWidth = 800;
  const svgHeight = height;
  const padding = { top: 25, right: 30, bottom: 35, left: 65 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Compute nice Y scale max
  const yMax = useMemo(() => {
    const isRev = activeCustomMetric ? activeCustomMetric.key.toLowerCase().includes('revenue') : metric === 'revenue';
    if (peakValue <= 0) return isRev ? 100 : 10;
    const factor = isRev ? 1.2 : 1.25;
    return Math.ceil(peakValue * factor);
  }, [peakValue, metric, activeCustomMetric]);

  // Compute point coordinates
  const coordinates = useMemo(() => {
    if (data.length === 0) return [];
    if (data.length === 1) {
      return [
        {
          x: padding.left + plotWidth / 2,
          y: padding.top + plotHeight - (values[0] / yMax) * plotHeight,
          point: data[0],
          value: values[0],
        },
      ];
    }

    return data.map((point, i) => {
      const x = padding.left + (i / (data.length - 1)) * plotWidth;
      const y = padding.top + plotHeight - (values[i] / yMax) * plotHeight;
      return { x, y, point, value: values[i] };
    });
  }, [data, values, yMax, plotWidth, plotHeight, padding]);

  // Smooth Bezier path generator
  const { linePath, areaPath } = useMemo(() => {
    if (coordinates.length === 0) return { linePath: '', areaPath: '' };
    if (coordinates.length === 1) {
      const p = coordinates[0];
      return {
        linePath: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`,
        areaPath: `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y} L ${p.x + 20} ${padding.top + plotHeight} L ${p.x - 20} ${padding.top + plotHeight} Z`,
      };
    }

    // Bezier control point calculation
    let d = `M ${coordinates[0].x} ${coordinates[0].y}`;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const p0 = coordinates[i === 0 ? i : i - 1];
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];
      const p3 = coordinates[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const lastX = coordinates[coordinates.length - 1].x;
    const firstX = coordinates[0].x;
    const groundY = padding.top + plotHeight;
    const a = `${d} L ${lastX} ${groundY} L ${firstX} ${groundY} Z`;

    return { linePath: d, areaPath: a };
  }, [coordinates, padding, plotHeight]);

  // Y-axis tick intervals
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  const formatTick = (val: number) => {
    if (activeCustomMetric?.formatValue) {
      if (val >= 1000 && activeCustomMetric.key.toLowerCase().includes('revenue')) {
        return `₹${(val / 1000).toFixed(1)}k`;
      }
      return activeCustomMetric.formatValue(Math.round(val));
    }
    if (metric === 'revenue' || metric.toLowerCase().includes('revenue')) {
      if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
      return `₹${Math.round(val)}`;
    }
    return Math.round(val).toString();
  };

  // Determine active hovered point
  const activeCoord = hoveredIdx !== null && coordinates[hoveredIdx] ? coordinates[hoveredIdx] : null;

  // Active theme gradient colors
  const strokeColor = activeCustomMetric
    ? activeCustomMetric.color
    : metric === 'revenue'
      ? '#059669'
      : metric === 'orders'
        ? '#2563eb'
        : '#7c3aed';
  const gradId = `graph-grad-${metric}-${(activeCustomMetric?.color || accentColor).replace('#', '')}`;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px 22px',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        position: 'relative',
      }}
    >
      {/* Chart Header & Metric Switcher */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: metric === 'revenue' ? '#ecfdf5' : '#eff6ff',
                color: strokeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {metric === 'revenue' ? <DollarSign size={16} /> : metric === 'orders' ? <BarChart2 size={16} /> : <Layers size={16} />}
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {title}
            </h3>
          </div>
          {subtitle && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', marginLeft: '36px' }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Metric Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px', flexWrap: 'wrap' }}>
          {customMetrics && customMetrics.length > 0 ? (
            customMetrics.map((opt) => {
              const isSelected = opt.key === metric;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setMetric(opt.key)}
                  style={{
                    border: 'none',
                    background: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? opt.color : '#64748b',
                    fontWeight: isSelected ? 750 : 600,
                    fontSize: '11.5px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              );
            })
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMetric('revenue')}
                style={{
                  border: 'none',
                  background: metric === 'revenue' ? '#ffffff' : 'transparent',
                  color: metric === 'revenue' ? '#059669' : '#64748b',
                  fontWeight: metric === 'revenue' ? 750 : 600,
                  fontSize: '11.5px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: metric === 'revenue' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Revenue (₹)
              </button>
              <button
                type="button"
                onClick={() => setMetric('orders')}
                style={{
                  border: 'none',
                  background: metric === 'orders' ? '#ffffff' : 'transparent',
                  color: metric === 'orders' ? '#2563eb' : '#64748b',
                  fontWeight: metric === 'orders' ? 750 : 600,
                  fontSize: '11.5px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: metric === 'orders' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Orders Count
              </button>
              <button
                type="button"
                onClick={() => setMetric('pages')}
                style={{
                  border: 'none',
                  background: metric === 'pages' ? '#ffffff' : 'transparent',
                  color: metric === 'pages' ? '#7c3aed' : '#64748b',
                  fontWeight: metric === 'pages' ? 750 : 600,
                  fontSize: '11.5px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: metric === 'pages' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Pages Spooled
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '10px 14px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #edf2f7',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 650, textTransform: 'uppercase' }}>
            Period Total:
          </span>
          <span style={{ fontSize: '15px', fontWeight: 800, color: strokeColor }}>
            {activeCustomMetric?.formatValue
              ? activeCustomMetric.formatValue(totalValue)
              : metric === 'revenue' || metric.toLowerCase().includes('revenue')
                ? `₹${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : totalValue.toLocaleString('en-IN')}
          </span>
        </div>

        <div style={{ width: '1px', height: '16px', background: '#cbd5e1' }} />

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 650, textTransform: 'uppercase' }}>
            Peak {data.length <= 12 ? 'Interval' : 'Day'}:
          </span>
          <span style={{ fontSize: '13px', fontWeight: 750, color: '#0f172a' }}>
            {activeCustomMetric?.formatValue
              ? activeCustomMetric.formatValue(peakValue)
              : metric === 'revenue' || metric.toLowerCase().includes('revenue')
                ? `₹${peakValue.toFixed(2)}`
                : peakValue}
            {peakIdx >= 0 && <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginLeft: '4px' }}>({data[peakIdx]?.label})</span>}
          </span>
        </div>

        <div style={{ width: '1px', height: '16px', background: '#cbd5e1' }} />

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 650, textTransform: 'uppercase' }}>
            Daily Avg:
          </span>
          <span style={{ fontSize: '13px', fontWeight: 750, color: '#0f172a' }}>
            {activeCustomMetric?.formatValue
              ? activeCustomMetric.formatValue(avgValue)
              : metric === 'revenue' || metric.toLowerCase().includes('revenue')
                ? `₹${avgValue.toFixed(2)}`
                : avgValue.toFixed(1)}
          </span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.28} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((tickVal, i) => {
            const y = padding.top + plotHeight - (tickVal / yMax) * plotHeight;
            return (
              <g key={`y-grid-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={i === 0 ? undefined : '3 3'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="600"
                >
                  {formatTick(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Area under curve */}
          {areaPath && (
            <path
              d={areaPath}
              fill={`url(#${gradId})`}
              pointerEvents="none"
              style={{ transition: 'd 0.3s ease' }}
            />
          )}

          {/* The Trend Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
              style={{ transition: 'd 0.3s ease, stroke 0.3s ease' }}
            />
          )}

          {/* X-Axis Labels */}
          {coordinates.map((coord, i) => {
            // Show every Nth label if dense
            const step = Math.max(1, Math.ceil(coordinates.length / 8));
            const isLast = i === coordinates.length - 1;
            const isFirst = i === 0;
            if (i % step !== 0 && !isLast) return null;

            return (
              <text
                key={`x-label-${i}`}
                x={coord.x}
                y={svgHeight - 10}
                textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
                fill="#64748b"
                fontSize="10"
                fontWeight={hoveredIdx === i ? '750' : '550'}
              >
                {coord.point.label}
              </text>
            );
          })}

          {/* Hover guideline */}
          {activeCoord && (
            <line
              x1={activeCoord.x}
              y1={padding.top}
              x2={activeCoord.x}
              y2={padding.top + plotHeight}
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={0.8}
            />
          )}

          {/* Interactive invisible hit targets + point circles */}
          {coordinates.map((coord, i) => {
            const isHovered = hoveredIdx === i;
            const isPeak = i === peakIdx && peakValue > 0;

            return (
              <g key={`point-${i}`}>
                {/* Hit area */}
                <rect
                  x={coord.x - (plotWidth / Math.max(coordinates.length - 1, 1)) / 2}
                  y={padding.top}
                  width={plotWidth / Math.max(coordinates.length - 1, 1)}
                  height={plotHeight}
                  fill="transparent"
                  cursor="pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                />

                {/* Point circle */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isHovered ? 6 : isPeak ? 4.5 : 3}
                  fill="#ffffff"
                  stroke={strokeColor}
                  strokeWidth={isHovered ? 3 : 2}
                  pointerEvents="none"
                  style={{ transition: 'r 0.15s ease' }}
                />

                {/* Outer halo on hover */}
                {isHovered && (
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={10}
                    fill={strokeColor}
                    opacity={0.2}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activeCoord && (
          <div
            style={{
              position: 'absolute',
              left: `${(activeCoord.x / svgWidth) * 100}%`,
              top: `${Math.max(10, (activeCoord.y / svgHeight) * 100 - 30)}%`,
              transform: 'translate(-50%, -100%)',
              background: '#0f172a',
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '8px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
              fontSize: '11px',
              pointerEvents: 'none',
              zIndex: 30,
              minWidth: '150px',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ fontWeight: 700, color: '#94a3b8', borderBottom: '1px solid #334155', paddingBottom: '4px', marginBottom: '4px' }}>
              {activeCoord.point.fullLabel}
            </div>
            {activeCustomMetric ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                <span style={{ color: '#cbd5e1' }}>{activeCustomMetric.label}:</span>
                <strong style={{ color: activeCustomMetric.color, fontSize: '12px' }}>
                  {activeCustomMetric.formatValue ? activeCustomMetric.formatValue(activeCoord.value) : activeCoord.value}
                </strong>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                <span style={{ color: '#cbd5e1' }}>Revenue:</span>
                <strong style={{ color: '#34d399', fontSize: '12px' }}>
                  ₹{activeCoord.point.revenue.toFixed(2)}
                </strong>
              </div>
            )}
            {activeCoord.point.adminRevenue !== undefined && activeCustomMetric?.key !== 'adminRevenue' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                <span style={{ color: '#94a3b8' }}>Admin License Fee:</span>
                <span style={{ color: '#60a5fa', fontWeight: 700 }}>₹{activeCoord.point.adminRevenue.toLocaleString('en-IN')}</span>
              </div>
            )}
            {activeCoord.point.shopRevenue !== undefined && activeCustomMetric?.key !== 'shopRevenue' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                <span style={{ color: '#94a3b8' }}>Shop Print Turnover:</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>₹{activeCoord.point.shopRevenue.toLocaleString('en-IN')}</span>
              </div>
            )}
            {Boolean(activeCoord.point.licensesCount && activeCoord.point.licensesCount > 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
                <span style={{ color: '#94a3b8' }}>Licenses Issued:</span>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>{activeCoord.point.licensesCount} key{activeCoord.point.licensesCount === 1 ? '' : 's'}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
              <span style={{ color: '#cbd5e1' }}>Orders:</span>
              <strong style={{ color: '#60a5fa' }}>{activeCoord.point.orders} completed</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '2px 0' }}>
              <span style={{ color: '#cbd5e1' }}>Pages:</span>
              <strong style={{ color: '#c084fc' }}>
                {activeCoord.point.pages} ({activeCoord.point.bwPages} B&amp;W / {activeCoord.point.colorPages} Col)
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Empty State Overlay if all values are 0 */}
      {totalValue === 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(4px)',
            border: '1px dashed #cbd5e1',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '12px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          }}
        >
          <Calendar size={14} color="#94a3b8" />
          <span>{emptyMessage || 'No completed jobs in this selected period yet. Live orders will populate automatically.'}</span>
        </div>
      )}
    </div>
  );
};

