import React from 'react';
import {
  Globe,
  Copy,
  Printer,
  Sparkles,
  QrCode,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { type ShopLicense } from '../App';

interface WebsiteViewProps {
  currentShop?: ShopLicense;
  platformDomain: string;
  websiteQrDataUrl: string;
  onCopyNotice: (msg: string) => void;
}

export const WebsiteView: React.FC<WebsiteViewProps> = ({
  currentShop,
  platformDomain,
  websiteQrDataUrl,
  onCopyNotice,
}) => {
  const shopSlug = (currentShop?.shopName || currentShop?.username || 'shop')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
  const cleanDomain = platformDomain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const shopWebUrl = `https://${cleanDomain}/${shopSlug}`;
  const qrImageUrl =
    websiteQrDataUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(shopWebUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shopWebUrl);
    onCopyNotice('Copied shop upload link to clipboard.');
  };

  const handlePrintStandCard = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Print Bot Stand QR - ${currentShop?.shopName || 'Counter'}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: #ffffff;
                color: #0f172a;
              }
              .stand-card {
                border: 3px solid #0f172a;
                border-radius: 28px;
                padding: 44px 36px;
                text-align: center;
                max-width: 360px;
                box-shadow: 0 16px 40px rgba(0,0,0,0.08);
              }
              .badge {
                display: inline-block;
                background: #0f172a;
                color: #ffffff;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 1px;
                text-transform: uppercase;
                padding: 4px 14px;
                border-radius: 999px;
                margin-bottom: 16px;
              }
              h1 {
                margin: 0 0 6px;
                font-size: 26px;
                font-weight: 800;
                letter-spacing: -0.5px;
              }
              p {
                color: #64748b;
                margin: 0 0 28px;
                font-size: 14px;
                line-height: 1.4;
              }
              .qr-box {
                background: #ffffff;
                padding: 16px;
                border-radius: 20px;
                border: 1px solid #e2e8f0;
                display: inline-block;
                box-shadow: 0 8px 24px rgba(0,0,0,0.06);
              }
              img {
                width: 220px;
                height: 220px;
                display: block;
              }
              .instructions {
                margin-top: 24px;
                font-size: 13px;
                font-weight: 700;
                color: #0f172a;
              }
              .url-sub {
                margin-top: 8px;
                font-size: 12px;
                color: #2563eb;
                font-family: monospace;
                word-break: break-all;
              }
            </style>
          </head>
          <body>
            <div class="stand-card">
              <span class="badge">Self-Service Counter</span>
              <h1>${currentShop?.shopName || 'Print Shop'}</h1>
              <p>Scan with your phone camera to upload documents and print instantly</p>
              <div class="qr-box">
                <img src="${qrImageUrl}" alt="Counter QR Code" />
              </div>
              <div class="instructions">Instant UPI Payment · Direct Counter Spooler</div>
              <div class="url-sub">${shopWebUrl}</div>
            </div>
            <script>
              window.onload = function() { window.print(); };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="pb-view">
      {/* Header */}
      <div className="pb-page-header">
        <div>
          <span className="pb-page-eyebrow">ONLINE ACCESS / COUNTER STAND</span>
          <h1 className="pb-page-title">Shop Website &amp; QR Stand</h1>
          <p className="pb-page-subtitle">
            Customers upload documents from their phones via your unique link or counter QR stand. Orders land directly into this workstation.
          </p>
        </div>
      </div>

      {/* Grid: Link Info & QR Showcase */}
      <div className="pb-website-grid">
        {/* Left Column: Link Card */}
        <div className="pb-panel pb-website-link-card">
          <div className="pb-card-header-icon-row">
            <div className="pb-badge-icon" style={{ background: 'var(--pb-desk-accent-subtle)', color: 'var(--pb-desk-accent)', width: '36px', height: '36px', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
              <Globe size={18} />
            </div>
            <div>
              <h3 className="pb-panel-title">Dedicated Shop Web Portal</h3>
              <p className="pb-panel-subtitle">Direct URL for customer smartphone uploads</p>
            </div>
          </div>

          <div className="pb-url-display-box">
            <div className="pb-url-display-top">
              <span className="pb-url-tag">Live Customer URL</span>
              <span className="pb-badge pb-badge-success">SSL Secured</span>
            </div>
            <div className="pb-url-display-row">
              <code className="pb-url-code">{shopWebUrl}</code>
              <button
                type="button"
                className="pb-btn pb-btn-primary pb-btn-sm"
                onClick={handleCopyLink}
              >
                <Copy size={13} /> Copy Link
              </button>
            </div>
          </div>

          <div className="pb-website-features">
            <div className="pb-feature-point">
              <CheckCircle2 size={15} color="var(--pb-desk-accent)" />
              <div>
                <strong>Zero App Download Required</strong>
                <p>Customers open this URL directly in Safari, Chrome, or Firefox.</p>
              </div>
            </div>

            <div className="pb-feature-point">
              <CheckCircle2 size={15} color="var(--pb-desk-accent)" />
              <div>
                <strong>Instant UPI Payment Integration</strong>
                <p>Payments route directly without third-party commission deductions.</p>
              </div>
            </div>

            <div className="pb-feature-point">
              <CheckCircle2 size={15} color="var(--pb-desk-accent)" />
              <div>
                <strong>Secure Ephemeral File Retention</strong>
                <p>Files are automatically spooled and purged post-printing for privacy.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Physical QR Card */}
        <div className="pb-panel pb-website-qr-card">
          <div className="pb-qr-image-container">
            <img
              src={qrImageUrl}
              alt="Shop Counter Stand QR"
              className="pb-qr-image"
            />
          </div>

          <h3 className="pb-qr-card-title">Counter Stand QR Code</h3>
          <p className="pb-qr-card-subtitle">
            Display this QR code at your shop billing counter. Customers scan with their phone camera to upload and pay.
          </p>

          <div className="pb-qr-card-actions">
            <button
              type="button"
              className="pb-btn pb-btn-primary pb-btn-lg"
              onClick={handlePrintStandCard}
              style={{ width: '100%' }}
            >
              <Printer size={16} /> Print Counter Stand QR Card
            </button>

            <button
              type="button"
              className="pb-btn pb-btn-secondary"
              onClick={handleCopyLink}
              style={{ width: '100%' }}
            >
              <Copy size={14} /> Copy Customer Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

