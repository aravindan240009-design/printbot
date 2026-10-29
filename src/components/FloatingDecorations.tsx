/**
 * High-precision, transparent floating vector illustrations relevant to Print Bot.
 * All graphics have zero background boxes and blend naturally with light and dark themes.
 */
export function FloatingDecorations() {
  return (
    <div className="floating-decorations-container" aria-hidden="true">
      {/* 1. Official Print Bot Certified Seal */}
      <div className="floating-item float-item-1">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          <circle cx="60" cy="60" r="48" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
          <circle cx="60" cy="60" r="40" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />
          {/* Starburst rays */}
          {Array.from({ length: 16 }).map((_, i) => (
            <line
              key={i}
              x1="60"
              y1="14"
              x2="60"
              y2="19"
              stroke="currentColor"
              strokeWidth="1.5"
              transform={`rotate(${i * 22.5} 60 60)`}
              opacity="0.7"
            />
          ))}
          <text x="60" y="56" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="700" letterSpacing="1.8" opacity="0.85">
            PRINT BOT
          </text>
          <text x="60" y="68" textAnchor="middle" fill="currentColor" fontSize="6" fontWeight="600" letterSpacing="1.2" opacity="0.7">
            CERTIFIED
          </text>
          <text x="60" y="78" textAnchor="middle" fill="currentColor" fontSize="5" fontWeight="500" letterSpacing="0.8" opacity="0.5">
            ★ 2026 ★
          </text>
        </svg>
      </div>

      {/* 2. CMYK Translucent Ink Droplets with glossy reflections */}
      <div className="floating-item float-item-2">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Cyan */}
          <circle cx="38" cy="40" r="22" fill="#00d2ff" fillOpacity="0.22" stroke="#00d2ff" strokeWidth="1.2" strokeOpacity="0.6" />
          {/* Magenta */}
          <circle cx="62" cy="40" r="22" fill="#ff007f" fillOpacity="0.22" stroke="#ff007f" strokeWidth="1.2" strokeOpacity="0.6" />
          {/* Yellow */}
          <circle cx="50" cy="60" r="22" fill="#ffe600" fillOpacity="0.22" stroke="#ffe600" strokeWidth="1.2" strokeOpacity="0.6" />
          {/* Key / Center droplet */}
          <circle cx="50" cy="47" r="10" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" opacity="0.8" />
          <text x="50" y="50" textAnchor="middle" fill="currentColor" fontSize="6" fontWeight="800" opacity="0.9">
            CMYK
          </text>
        </svg>
      </div>

      {/* 3. 3D Isometric Paper Sheet with folded corner */}
      <div className="floating-item float-item-3">
        <svg width="110" height="130" viewBox="0 0 110 130" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Base sheet outline */}
          <path
            d="M20 20 H75 L95 40 V115 H20 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="currentColor"
            fillOpacity="0.04"
            opacity="0.7"
          />
          {/* Folded corner flap */}
          <path d="M75 20 V40 H95" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" opacity="0.8" />
          {/* Document linework */}
          <line x1="32" y1="38" x2="62" y2="38" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
          <line x1="32" y1="52" x2="82" y2="52" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />
          <line x1="32" y1="64" x2="82" y2="64" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />
          <line x1="32" y1="76" x2="82" y2="76" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />
          <line x1="32" y1="88" x2="68" y2="88" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />
          {/* Sheet badge */}
          <rect x="32" y="98" width="28" height="8" rx="2" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.08" opacity="0.7" />
          <text x="46" y="104" textAnchor="middle" fill="currentColor" fontSize="5" fontWeight="700" opacity="0.85">A4 80GSM</text>
        </svg>
      </div>

      {/* 4. Precision 1200 DPI Optical Reticle */}
      <div className="floating-item float-item-4">
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="45" cy="45" r="36" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <circle cx="45" cy="45" r="26" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 4" opacity="0.5" />
          <circle cx="45" cy="45" r="4" fill="currentColor" opacity="0.7" />
          {/* Crosshairs */}
          <line x1="45" y1="3" x2="45" y2="20" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
          <line x1="45" y1="70" x2="45" y2="87" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
          <line x1="3" y1="45" x2="20" y2="45" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
          <line x1="70" y1="45" x2="87" y2="45" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
          <text x="45" y="38" textAnchor="middle" fill="currentColor" fontSize="5" fontWeight="700" letterSpacing="1" opacity="0.75">
            1200 DPI
          </text>
        </svg>
      </div>

      {/* 5. Duplex Long-Edge Rotation Arc */}
      <div className="floating-item float-item-5">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M20 40 A20 20 0 1 1 58 48"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            opacity="0.6"
          />
          <polygon points="63,48 55,44 58,52" fill="currentColor" opacity="0.8" />
          <path
            d="M60 40 A20 20 0 1 1 22 32"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            opacity="0.6"
          />
          <polygon points="17,32 25,36 22,28" fill="currentColor" opacity="0.8" />
          <text x="40" y="43" textAnchor="middle" fill="currentColor" fontSize="6" fontWeight="800" opacity="0.8">
            DUPLEX
          </text>
        </svg>
      </div>

      {/* 6. Indian Rupee Precision Medallion */}
      <div className="floating-item float-item-6">
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="35" cy="35" r="30" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
          <circle cx="35" cy="35" r="24" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
          <text x="35" y="42" textAnchor="middle" fill="currentColor" fontSize="20" fontWeight="700" fontFamily="sans-serif" opacity="0.9">
            ₹
          </text>
        </svg>
      </div>

      {/* 7. Holographic QR Target Bracket */}
      <div className="floating-item float-item-7">
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 4 corner brackets */}
          <path d="M15 30 V15 H30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <path d="M60 15 H75 V30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <path d="M75 60 V75 H60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          <path d="M30 75 H15 V60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          {/* Subtle center scan grid */}
          <rect x="32" y="32" width="26" height="26" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.35" />
          <line x1="22" y1="45" x2="68" y2="45" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
          <text x="45" y="49" textAnchor="middle" fill="currentColor" fontSize="6" fontWeight="700" letterSpacing="1" opacity="0.75">
            SCAN
          </text>
        </svg>
      </div>
    </div>
  );
}
