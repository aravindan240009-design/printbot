import { motion } from 'motion/react';

interface RealisticPrinterFallbackProps {
  printing?: boolean;
  paused?: boolean;
}

export function RealisticPrinterFallback({ printing = false, paused = false }: RealisticPrinterFallbackProps) {
  return (
    <div className="realistic-printer-fallback" aria-hidden="true">
      {/* Main 2.5D Isometric Printer Body (Clean Floating Presentation — Zero Floor Shadow Pedestal) */}
      <div className="fallback-printer-body">
        {/* Top Scanner & ADF Lid */}
        <div className="fallback-scanner-lid">
          <div className="fallback-adf-tray" />
          <div className="fallback-scanner-glass" />
        </div>

        {/* Gold Metallic Divider Trim */}
        <div className="fallback-gold-trim" />

        {/* Upper Ceramic Ivory Housing */}
        <div className="fallback-upper-housing">
          {/* OLED Interactive Touchscreen */}
          <div className="fallback-touchscreen">
            <div className="fallback-screen-header">
              <span className="fallback-screen-brand">PRINT BOT PRO</span>
              <span className={`fallback-screen-dot ${printing ? 'dot-printing' : 'dot-ready'}`} />
            </div>
            <div className="fallback-screen-title">
              {printing ? 'Printing Thesis...' : 'Ready to impress'}
            </div>
            <div className="fallback-screen-bar">
              <div
                className="fallback-screen-fill"
                style={{ width: printing ? '78%' : '100%' }}
              />
            </div>
            <div className="fallback-screen-meta">
              A4 · DUPLEX · 300 DPI · winspool.drv OK
            </div>
          </div>

          {/* Central Logo Stamp */}
          <div className="fallback-face-logo">printbot</div>

          {/* Illuminated Gold Power Ring */}
          <div className="fallback-power-ring" />
        </div>

        {/* Lower Charcoal Chassis with Cooling Louvers */}
        <div className="fallback-lower-chassis">
          <div className="fallback-vent-louvers">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          {/* Paper Output Slot */}
          <div className="fallback-output-slot" />

          {/* Extended Output Paper Tray */}
          <div className="fallback-paper-tray">
            {/* Animated Printed Paper Sheet */}
            <motion.div
              className="fallback-printed-sheet"
              animate={
                printing && !paused
                  ? { y: [0, 18, 0], opacity: [0.85, 1, 0.85] }
                  : { y: 0, opacity: 1 }
              }
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="fallback-sheet-header">
                <b>DOUBLE YOUR COUNTER SPEED</b>
                <span>Keep 100% of your print revenue · Zero Commission</span>
              </div>
              <div className="fallback-sheet-lines">
                <span />
                <span />
                <span />
              </div>
              <div className="fallback-sheet-footer">
                SUBSCRIBE TODAY · ₹199/MO · UNLIMITED PRINTERS
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
