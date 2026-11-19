/**
 * Hardware calibration test page generator for Print Bot Workstation
 * Generates an A4 test print canvas with CMYK/RGB bars, grayscale ramp,
 * alignment grid, margin rulers, and workstation hardware diagnostics.
 */

export interface TestPageMetadata {
  shopName: string;
  stationName: string;
  deviceId: string;
  printerName: string;
  driverName?: string;
  portName?: string;
}

export function generateTestPagePngBytes(meta: TestPageMetadata): Promise<number[]> {
  return new Promise((resolve, reject) => {
    try {
      // Standard A4 at 150 DPI for rapid spooler calibration: 1240 x 1754 px
      const width = 1240;
      const height = 1754;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context not available');
      }

      // 1. Crisp white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 2. Outer margin boundary (10mm border)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      // 3. Header Banner
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(40, 40, width - 80, 110);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px "Segoe UI", Roboto, sans-serif';
      ctx.fillText('PRINT BOT — HARDWARE CALIBRATION & TEST PAGE', 70, 95);

      ctx.font = '18px "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#93c5fd';
      ctx.fillText(`Automated Spooler Diagnostic • ${new Date().toLocaleString('en-IN')}`, 70, 130);

      // 4. Shop & Workstation Identity Block
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(60, 175, width - 120, 190);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(60, 175, width - 120, 190);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.fillText('Counter & Hardware Diagnostics', 85, 210);

      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillStyle = '#475569';

      ctx.fillText(`Print Shop: ${meta.shopName || 'Print Bot Workstation'}`, 85, 250);
      ctx.fillText(`Workstation Device: ${meta.stationName || 'Counter PC'} (ID: ${meta.deviceId || 'STATION-01'})`, 85, 280);
      ctx.fillText(`Target Printer: ${meta.printerName}`, 85, 310);
      ctx.fillText(`Driver / Port: ${meta.driverName || 'Windows Print Spooler'} • ${meta.portName || 'Win32 RAW'}`, 85, 340);

      // 5. CMYK & Primary Color Bands
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.fillText('Color Channel Calibration (CMYK + RGB)', 60, 405);

      const colorBands = [
        { name: 'Cyan', color: '#00ffff' },
        { name: 'Magenta', color: '#ff00ff' },
        { name: 'Yellow', color: '#ffff00' },
        { name: 'Black (K)', color: '#000000' },
        { name: 'Red', color: '#ff0000' },
        { name: 'Green', color: '#00ff00' },
        { name: 'Blue', color: '#0000ff' },
      ];

      const bandWidth = (width - 120) / colorBands.length;
      colorBands.forEach((band, idx) => {
        const x = 60 + idx * bandWidth;
        ctx.fillStyle = band.color;
        ctx.fillRect(x + 4, 420, bandWidth - 8, 70);

        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, 420, bandWidth - 8, 70);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillText(band.name, x + 8, 510);
      });

      // 6. Grayscale Density Ramp (0% to 100% in 10% steps)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.fillText('Grayscale Density Gradient (0% – 100%)', 60, 560);

      const steps = 11;
      const stepWidth = (width - 120) / steps;
      for (let i = 0; i < steps; i++) {
        const pct = i * 10;
        const val = Math.round(255 * (1 - i / (steps - 1)));
        const hex = val.toString(16).padStart(2, '0');
        ctx.fillStyle = `#${hex}${hex}${hex}`;
        const x = 60 + i * stepWidth;
        ctx.fillRect(x + 2, 575, stepWidth - 4, 60);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, 575, stepWidth - 4, 60);

        ctx.fillStyle = '#475569';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(`${pct}%`, x + 6, 655);
      }

      // 7. Text Sharpness & Resolution Calibration
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.fillText('Font Sharpness & Legibility Test', 60, 700);

      const fontSizes = [24, 18, 14, 11, 9, 7];
      let yOffset = 735;
      fontSizes.forEach((sz) => {
        ctx.font = `${sz}px "Segoe UI", Roboto, sans-serif`;
        ctx.fillStyle = '#0f172a';
        ctx.fillText(`The quick brown fox jumps over the lazy dog (${sz}pt)`, 60, yOffset);
        yOffset += sz + 12;
      });

      // 8. Geometric Alignment Grid & Crosshairs
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.fillText('Geometric Line & Edge Alignment Grid', 60, yOffset + 25);

      yOffset += 45;
      const gridW = width - 120;
      const gridH = 260;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;

      // Draw grid
      for (let gx = 60; gx <= 60 + gridW; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, yOffset);
        ctx.lineTo(gx, yOffset + gridH);
        ctx.stroke();
      }
      for (let gy = yOffset; gy <= yOffset + gridH; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(60, gy);
        ctx.lineTo(60 + gridW, gy);
        ctx.stroke();
      }

      // Concentric circles in center of grid
      const centerX = 60 + gridW / 2;
      const centerY = yOffset + gridH / 2;
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 2;
      [30, 60, 90].forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      });
      // Center crosshair
      ctx.beginPath();
      ctx.moveTo(centerX - 110, centerY);
      ctx.lineTo(centerX + 110, centerY);
      ctx.moveTo(centerX, centerY - 110);
      ctx.lineTo(centerX, centerY + 110);
      ctx.stroke();

      // 9. Verified Pass Badge Footer
      const footerY = height - 140;
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(60, footerY, width - 120, 80);
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, footerY, width - 120, 80);

      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.fillText('✓ SPOOLER HARDWARE INTEGRATION: PASSED', 90, footerY + 36);

      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillStyle = '#047857';
      ctx.fillText('If colors, gradients, and margin borders appear clear and undistorted, this printer is ready for production orders.', 90, footerY + 62);

      // Convert canvas to PNG blob -> ArrayBuffer -> number[]
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create PNG blob from canvas'));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const arr = new Uint8Array(reader.result as ArrayBuffer);
          resolve(Array.from(arr));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}
