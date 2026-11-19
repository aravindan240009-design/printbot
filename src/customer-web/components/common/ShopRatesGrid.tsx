import React from 'react';
import { TranslationKeys } from '../../locales';
import { Sparkles, ArrowLeftRight } from 'lucide-react';

interface ShopRatesGridProps {
  rates?: {
    bwPerSideRupees?: number;
    colorPerSideRupees?: number;
    duplexDiscountPercent?: number;
  };
  t?: TranslationKeys;
  shopName?: string;
}

export const ShopRatesGrid: React.FC<ShopRatesGridProps> = ({ rates, t, shopName }) => {
  const bwBase = Number(rates?.bwPerSideRupees ?? 1.5);
  const colorBase = Number(rates?.colorPerSideRupees ?? 10.0);
  const duplexDiscount = Number(rates?.duplexDiscountPercent ?? 15);
  const duplexFactor = 1 - (duplexDiscount / 100);

  const bwSingle = bwBase.toFixed(2);
  const bwDouble = (bwBase * duplexFactor).toFixed(2);
  const colorSingle = colorBase.toFixed(2);
  const colorDouble = (colorBase * duplexFactor).toFixed(2);

  return (
    <div className="pb-shop-rates-wrapper" aria-label="Shop Printing Rates">
      <div className="pb-rates-header-row">
        <div className="pb-rates-title-group">
          <span className="pb-rates-tag">
            <Sparkles size={12} className="text-amber-500 inline mr-1" />
            {t?.viewPricing || 'Live Counter Rates'}
          </span>
          {shopName && <span className="pb-rates-shop-sub">{shopName}</span>}
        </div>
        {duplexDiscount > 0 && (
          <span className="pb-rates-discount-badge">
            <ArrowLeftRight size={11} className="inline mr-1" />
            {duplexDiscount}% off duplex
          </span>
        )}
      </div>

      <div className="pb-rates-grid-2x2">
        {/* B&W Single */}
        <div className="pb-rate-cell pb-rate-bw">
          <div className="pb-rate-meta">
            <span className="pb-rate-dot pb-dot-bw" />
            <span className="pb-rate-label">{t?.rateBwSingle || 'B&W Single'}</span>
          </div>
          <div className="pb-rate-price">
            ₹{bwSingle}
            <span className="pb-rate-unit">/pg</span>
          </div>
        </div>

        {/* B&W Double */}
        <div className="pb-rate-cell pb-rate-bw pb-rate-duplex">
          <div className="pb-rate-meta">
            <span className="pb-rate-dot pb-dot-duplex">⇋</span>
            <span className="pb-rate-label">{t?.rateBwDouble || 'B&W Double'}</span>
          </div>
          <div className="pb-rate-price highlight-duplex">
            ₹{bwDouble}
            <span className="pb-rate-unit">/side</span>
          </div>
        </div>

        {/* Color Single */}
        <div className="pb-rate-cell pb-rate-color">
          <div className="pb-rate-meta">
            <span className="pb-rate-dot pb-dot-color" />
            <span className="pb-rate-label">{t?.rateColorSingle || 'Color Single'}</span>
          </div>
          <div className="pb-rate-price">
            ₹{colorSingle}
            <span className="pb-rate-unit">/pg</span>
          </div>
        </div>

        {/* Color Double */}
        <div className="pb-rate-cell pb-rate-color pb-rate-duplex">
          <div className="pb-rate-meta">
            <span className="pb-rate-dot pb-dot-duplex">⇋</span>
            <span className="pb-rate-label">{t?.rateColorDouble || 'Color Double'}</span>
          </div>
          <div className="pb-rate-price highlight-duplex">
            ₹{colorDouble}
            <span className="pb-rate-unit">/side</span>
          </div>
        </div>
      </div>
    </div>
  );
};
