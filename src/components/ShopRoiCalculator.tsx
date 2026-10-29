import { useState } from 'react';
import { Calculator, ShieldCheck } from 'lucide-react';

export function ShopRoiCalculator() {
  const [dailyPages, setDailyPages] = useState<number>(850);
  const [colorPercent, setColorPercent] = useState<number>(25);
  const [uncollectedPercent, setUncollectedPercent] = useState<number>(6);

  // Math in Indian Paise & Rupees
  // Traditional Xerox waste: uncollected prints (customers abandon files), mismatch reprints, duplex errors (~8-12%)
  // Print Bot eliminates uncollected waste via prepaid verified QR and server-locked previews
  const bwPages = Math.round(dailyPages * (1 - colorPercent / 100));
  const colorPages = Math.round(dailyPages * (colorPercent / 100));
  
  const dailyRevenue = (bwPages * 2) + (colorPages * 8); // ₹2 BW, ₹8 Color
  const monthlyRevenue = dailyRevenue * 26; // 26 working days in India

  // Monthly savings from eliminated waste & staff counter time
  const monthlyWastedPagesSaved = Math.round(dailyPages * (uncollectedPercent / 100) * 26);
  const monthlyPaperSavingsRupees = Math.round(monthlyWastedPagesSaved * 3.5);
  const monthlyHoursSaved = Math.round((dailyPages / 100) * 1.2 * 26); // minutes saved converted to hours

  return (
    <section className="roi-calculator-section shell section-space" aria-label="Print Bot Counter ROI Calculator">
      <div className="roi-card">
        <div className="roi-header">
          <div>
            <span className="roi-eyebrow">
              <Calculator size={14} /> COUNTER ECONOMICS &amp; PAISE MATH
            </span>
            <h2 className="roi-title">
              How much does counter chaos<br />
              <span className="serif-note">actually cost your Xerox shop?</span>
            </h2>
          </div>
          <p className="roi-desc">
            Indian print shops lose thousands each month to abandoned prints, customer WhatsApp confusion, and miscalculated sheet sides. Calculate your immediate monthly recovery.
          </p>
        </div>

        <div className="roi-body-grid">
          {/* Sliders Panel */}
          <div className="roi-sliders-panel">
            {/* Daily Pages Slider */}
            <div className="roi-slider-group">
              <div className="roi-slider-label">
                <span>Daily Total Pages Printed</span>
                <strong>{dailyPages.toLocaleString()} pages / day</strong>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={dailyPages}
                onChange={(e) => setDailyPages(Number(e.target.value))}
                className="roi-range"
              />
              <div className="roi-slider-bounds">
                <span>100 (Small Kiosk)</span>
                <span>2,500 (Campus Hub)</span>
                <span>5,000+ (High-Volume)</span>
              </div>
            </div>

            {/* Color Share Slider */}
            <div className="roi-slider-group">
              <div className="roi-slider-label">
                <span>High-Margin Color Share</span>
                <strong>{colorPercent}% Full Color</strong>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={colorPercent}
                onChange={(e) => setColorPercent(Number(e.target.value))}
                className="roi-range"
              />
              <div className="roi-slider-bounds">
                <span>5% (Mainly Notes)</span>
                <span>25% (Balanced)</span>
                <span>60% (Design/Studio)</span>
              </div>
            </div>

            {/* Uncollected / Wasted Rate */}
            <div className="roi-slider-group">
              <div className="roi-slider-label">
                <span>Typical Abandoned / Misprinted Rate</span>
                <strong>{uncollectedPercent}% eliminated by Print Bot</strong>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                step="1"
                value={uncollectedPercent}
                onChange={(e) => setUncollectedPercent(Number(e.target.value))}
                className="roi-range"
              />
              <div className="roi-slider-bounds">
                <span>2% (Strict Cash)</span>
                <span>6% (Average Shop)</span>
                <span>15% (Heavy Queue)</span>
              </div>
            </div>
          </div>

          {/* Results Display Board */}
          <div className="roi-results-board">
            <div className="roi-result-item highlight">
              <span className="roi-result-label">Monthly Lost Revenue Recovered</span>
              <strong className="roi-result-metric">₹{monthlyPaperSavingsRupees.toLocaleString()}</strong>
              <small>Zero abandoned uncollected jobs via verified QR prepayment</small>
            </div>

            <div className="roi-metrics-pair">
              <div className="roi-result-item">
                <span className="roi-result-label">Monthly Counter Hours Saved</span>
                <strong className="roi-result-metric">{monthlyHoursSaved} hrs</strong>
                <small>No manual Bluetooth/WhatsApp file handling</small>
              </div>

              <div className="roi-result-item">
                <span className="roi-result-label">Estimated Monthly Turnover</span>
                <strong className="roi-result-metric">₹{monthlyRevenue.toLocaleString()}</strong>
                <small>Unlimited printers on one fixed subscription</small>
              </div>
            </div>

            <div className="roi-guarantee-pill">
              <ShieldCheck size={16} className="text-emerald" />
              <span>Zero per-page commission. Unlimited printers included.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
