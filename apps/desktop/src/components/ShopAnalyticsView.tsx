import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Layers,
  BarChart3,
  Calendar,
  RefreshCw,
  Sparkles,
  FileText,
  CheckCircle2,
  Phone,
  Search,
  ArrowUpRight,
  Printer,
  PieChart,
} from 'lucide-react';
import { type PrintJob, type ShopLicense } from '../App';
import {
  type DateRangeType,
  getDateRangeBounds,
  filterJobsByRange,
  generateChartPoints,
} from '../utils/analyticsUtils';
import { DateRangePicker } from './DateRangePicker';
import { InteractiveLineGraph } from './InteractiveLineGraph';

interface ShopAnalyticsViewProps {
  currentShop?: ShopLicense;
  jobs: PrintJob[];
  onRefreshJobs: () => void;
  onWhatsAppCustomer?: (job: PrintJob) => void;
}

export const ShopAnalyticsView: React.FC<ShopAnalyticsViewProps> = ({
  currentShop,
  jobs,
  onRefreshJobs,
  onWhatsAppCustomer,
}) => {
  const [rangeType, setRangeType] = useState<DateRangeType>('7d');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter jobs that belong to this shop
  const shopJobs = useMemo(() => {
    const shopUser = (currentShop?.username || '').toLowerCase();
    const shopName = (currentShop?.shopName || '').toLowerCase();

    return jobs.filter((j) => {
      const jShop = ((j as any).shop_id || '').toLowerCase();
      const jEmail = (j.customer_email || '').toLowerCase();

      if (!shopUser) return true;
      if (jShop && (jShop === shopUser || jShop === shopName || jShop.includes(shopUser) || shopUser.includes(jShop))) {
        return true;
      }
      if (jEmail && jEmail.includes(shopUser)) return true;
      return true; // Single-tenant workstation fallback
    });
  }, [jobs, currentShop]);

  // All completed jobs for this shop
  const allCompletedJobs = useMemo(() => {
    return shopJobs.filter((j) => j.status === 'COMPLETED');
  }, [shopJobs]);

  // Jobs filtered by chosen date range
  const rangeCompletedJobs = useMemo(() => {
    return filterJobsByRange(shopJobs, rangeType, customStart, customEnd);
  }, [shopJobs, rangeType, customStart, customEnd]);

  // Range bounds info
  const bounds = useMemo(() => {
    return getDateRangeBounds(rangeType, customStart, customEnd);
  }, [rangeType, customStart, customEnd]);

  // Today's jobs specifically
  const todayJobs = useMemo(() => {
    return filterJobsByRange(shopJobs, 'today');
  }, [shopJobs]);

  // Metrics computation for active period
  const periodRevenue = useMemo(() => {
    return rangeCompletedJobs.reduce((acc, j) => acc + (j.calculated_price_rupees || 0), 0);
  }, [rangeCompletedJobs]);

  const todayRevenue = useMemo(() => {
    return todayJobs.reduce((acc, j) => acc + (j.calculated_price_rupees || 0), 0);
  }, [todayJobs]);

  const allTimeRevenue = useMemo(() => {
    return allCompletedJobs.reduce((acc, j) => acc + (j.calculated_price_rupees || 0), 0);
  }, [allCompletedJobs]);

  const periodOrdersCount = rangeCompletedJobs.length;

  const { totalPages, bwPages, colorPages } = useMemo(() => {
    let total = 0;
    let bw = 0;
    let col = 0;
    rangeCompletedJobs.forEach((j) => {
      const p = (j.page_count || 1) * (j.options.copies || 1);
      total += p;
      if (j.options.color_mode === 'color') col += p;
      else bw += p;
    });
    return { totalPages: total, bwPages: bw, colorPages: col };
  }, [rangeCompletedJobs]);

  const aov = periodOrdersCount > 0 ? periodRevenue / periodOrdersCount : 0;

  // Chart data points
  const chartPoints = useMemo(() => {
    return generateChartPoints(shopJobs, rangeType, customStart, customEnd);
  }, [shopJobs, rangeType, customStart, customEnd]);

  // Filtered orders list for ledger table
  const filteredOrderList = useMemo(() => {
    if (!searchQuery.trim()) return rangeCompletedJobs;
    const q = searchQuery.toLowerCase();
    return rangeCompletedJobs.filter((j) => {
      return (
        j.id.toLowerCase().includes(q) ||
        j.customer_email.toLowerCase().includes(q) ||
        j.file_name.toLowerCase().includes(q) ||
        (j.pickup_pin && j.pickup_pin.toLowerCase().includes(q))
      );
    });
  }, [rangeCompletedJobs, searchQuery]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    onRefreshJobs();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="pb-view" style={{ paddingBottom: '60px' }}>
      {/* Page Header */}
      <div className="pb-page-header">
        <div>
          <span className="pb-page-eyebrow">COUNTER STATION INTELLIGENCE</span>
          <h1 className="pb-page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={24} color="#059669" />
            Revenue &amp; Analytics
          </h1>
          <p className="pb-page-subtitle">
            Live revenue trajectory, sales turnover, and print volume diagnostics for{' '}
            <strong>{currentShop?.shopName || 'Main Counter'}</strong>
          </p>
        </div>

        <div className="pb-header-actions">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#065f46',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
              }}
            />
            <span>Live Real-Time Sync</span>
          </div>

          <button
            type="button"
            className="pb-btn pb-btn-secondary"
            onClick={handleManualRefresh}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'pb-spin' : ''} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {/* Date Range Picker Filter Bar */}
      <DateRangePicker
        rangeType={rangeType}
        onChangeRange={setRangeType}
        customStart={customStart}
        customEnd={customEnd}
        onChangeCustomStart={setCustomStart}
        onChangeCustomEnd={setCustomEnd}
        activeLabel={bounds.label}
      />

      {/* Primary KPI Stats Grid */}
      <div className="pb-stats-grid">
        <div className="pb-stat-card">
          <div className="pb-stat-label">Period Print Revenue</div>
          <div className="pb-stat-val" style={{ color: '#059669' }}>
            ₹{periodRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="pb-stat-sub">
            {bounds.label} • All-Time: ₹{allTimeRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="pb-stat-card">
          <div className="pb-stat-label">Today's Earnings</div>
          <div className="pb-stat-val" style={{ color: '#2563eb' }}>
            ₹{todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="pb-stat-sub">
            {todayJobs.length} completed order{todayJobs.length === 1 ? '' : 's'} today
          </div>
        </div>

        <div className="pb-stat-card">
          <div className="pb-stat-label">Completed Orders</div>
          <div className="pb-stat-val">{periodOrdersCount}</div>
          <div className="pb-stat-sub">Dispatched &amp; collected in period</div>
        </div>

        <div className="pb-stat-card">
          <div className="pb-stat-label">Pages Spooled</div>
          <div className="pb-stat-val">{totalPages}</div>
          <div className="pb-stat-sub">
            {bwPages} B&amp;W • {colorPages} Color
          </div>
        </div>

        <div className="pb-stat-card">
          <div className="pb-stat-label">Average Order Value</div>
          <div className="pb-stat-val">₹{aov.toFixed(2)}</div>
          <div className="pb-stat-sub">Revenue per completed print order</div>
        </div>
      </div>

      {/* Interactive Line Graph */}
      <InteractiveLineGraph
        data={chartPoints}
        title={`Revenue Trajectory • ${bounds.label}`}
        subtitle={`Real-time daily earnings timeline for ${currentShop?.shopName || 'Counter'}`}
        accentColor="#059669"
        defaultMetric="revenue"
        height={260}
      />

      {/* Volume Breakdown & Print Distribution Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Color vs B&W Ratio Card */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={16} color="#2563eb" />
              Print Volume Composition
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>{totalPages} total pages</span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>Black &amp; White (B&amp;W)</span>
              <strong style={{ color: '#0f172a' }}>
                {bwPages} pages ({totalPages > 0 ? Math.round((bwPages / totalPages) * 100) : 0}%)
              </strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${totalPages > 0 ? (bwPages / totalPages) * 100 : 0}%`,
                  height: '100%',
                  background: '#475569',
                  borderRadius: '4px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: '#2563eb', fontWeight: 600 }}>Color Prints</span>
              <strong style={{ color: '#0f172a' }}>
                {colorPages} pages ({totalPages > 0 ? Math.round((colorPages / totalPages) * 100) : 0}%)
              </strong>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${totalPages > 0 ? (colorPages / totalPages) * 100 : 0}%`,
                  height: '100%',
                  background: '#2563eb',
                  borderRadius: '4px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Counter Station Status Info */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={16} color="#059669" />
              Station License &amp; Status
            </h3>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 750,
                color: currentShop?.status === 'ACTIVE' ? '#047857' : '#b91c1c',
                background: currentShop?.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {currentShop?.status || 'ACTIVE'}
            </span>
          </div>

          <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px', color: '#475569' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subscription Tier:</span>
              <strong style={{ color: '#0f172a' }}>{currentShop?.duration || '1 Year Subscription'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>License Key:</span>
              <code style={{ fontSize: '11px', color: '#2563eb' }}>{currentShop?.licenseKey || 'PB-COMMERCIAL'}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Order Dispatch Mode:</span>
              <strong style={{ color: '#0f172a' }}>
                {currentShop?.orderMode === 'FULL_AUTOMATIC' ? 'Full Automatic' : 'Manual Approval'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Terminal Bound Hardware:</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{currentShop?.deviceId || 'Win32 Spooler Engine'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Orders Ledger */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        }}
      >
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
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
              Completed Orders Ledger ({filteredOrderList.length})
            </h3>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Direct audit trail of all jobs completed in {bounds.label}
            </div>
          </div>

          <div style={{ position: 'relative', width: '240px' }}>
            <Search
              size={14}
              color="#94a3b8"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search by ID, file, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '12px',
                background: '#f8fafc',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="pb-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '10px 12px' }}>Order ID</th>
                <th style={{ padding: '10px 12px' }}>Document / File</th>
                <th style={{ padding: '10px 12px' }}>Customer / Contact</th>
                <th style={{ padding: '10px 12px' }}>Pages &amp; Mode</th>
                <th style={{ padding: '10px 12px' }}>Price (₹)</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
                <th style={{ padding: '10px 12px' }}>Dispatched At</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrderList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    No completed orders found for this selected period.
                  </td>
                </tr>
              ) : (
                filteredOrderList.map((job) => (
                  <tr
                    key={job.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '#f8fafc')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <code style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700 }}>
                        {job.id.length > 14 ? `${job.id.slice(0, 12)}...` : job.id}
                      </code>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 650, color: '#0f172a', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.file_name}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                        {job.options.paper_size || 'A4'} • {job.options.duplex_mode === 'simplex' ? '1-Sided' : '2-Sided'}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#334155' }}>
                      {job.customer_email}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: job.options.color_mode === 'color' ? '#fdf4ff' : '#f1f5f9',
                          color: job.options.color_mode === 'color' ? '#9333ea' : '#475569',
                          marginRight: '6px',
                        }}
                      >
                        {job.options.color_mode === 'color' ? 'Color' : 'B&W'}
                      </span>
                      <strong>{(job.page_count || 1) * (job.options.copies || 1)} pgs</strong>
                      {job.options.copies > 1 && (
                        <span style={{ fontSize: '10.5px', color: '#64748b', marginLeft: '4px' }}>
                          ({job.options.copies} copies)
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ color: '#059669', fontSize: '13px' }}>
                        ₹{(job.calculated_price_rupees || 0).toFixed(2)}
                      </strong>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          background: '#ecfdf5',
                          color: '#047857',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={11} />
                        Completed
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '11px' }}>
                      {job.created_at || 'Recently'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      {onWhatsAppCustomer && job.customer_email && /\d{10}/.test(job.customer_email) ? (
                        <button
                          type="button"
                          onClick={() => onWhatsAppCustomer(job)}
                          style={{
                            border: '1px solid #10b981',
                            background: '#ecfdf5',
                            color: '#047857',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 650,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Phone size={11} />
                          WhatsApp
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

