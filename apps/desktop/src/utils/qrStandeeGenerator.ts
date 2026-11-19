import QRCode from 'qrcode';

export interface QrStandeeOptions {
  shopName: string;
  shopLocation?: string;
  qrUrl: string;
  phone?: string;
  themeColor?: string;
}

/**
 * Generates an ultra-crisp, high-resolution A4 Counter QR Standee (150 DPI: 1240 x 1754 px)
 * ready for direct counter printing or display.
 */
export async function generateCounterStandeePngBytes(options: QrStandeeOptions): Promise<number[]> {
  const width = 1240;
  const height = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  const brandColor = options.themeColor || '#2563eb';

  // 1. Crisp White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Decorative Outer Border with rounded corners
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // Inner Accent Border
  ctx.strokeStyle = brandColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(46, 46, width - 92, height - 92);

  // 3. Top Header Bar
  ctx.fillStyle = brandColor;
  ctx.fillRect(48, 48, width - 96, 170);

  // App / Brand Pill
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 130, 68, 260, 36, 18);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ TOUCHLESS SELF-SERVICE PRINTING', width / 2, 92);

  // Shop Name & Subtitle
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px "Segoe UI", Roboto, sans-serif';
  ctx.fillText(options.shopName || 'PRINT BOT COUNTER', width / 2, 150);

  ctx.font = '20px "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#bfdbfe';
  ctx.fillText(options.shopLocation ? `📍 ${options.shopLocation}` : 'Main Counter Print Station', width / 2, 190);

  // 4. Headline / Call to Action
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Scan to Print from Your Phone', width / 2, 275);

  ctx.font = '20px "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('No App Download or Account Required • Takes Under 30 Seconds', width / 2, 312);

  // 5. Giant QR Code Container
  const qrBoxSize = 560;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = 345;

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Generate QR Code image as data URL
  const qrDataUrl = await QRCode.toDataURL(options.qrUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 490,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  const qrImg = new Image();
  await new Promise((res, rej) => {
    qrImg.onload = res;
    qrImg.onerror = rej;
    qrImg.src = qrDataUrl;
  });

  // Draw QR Image inside container
  ctx.drawImage(qrImg, qrBoxX + 35, qrBoxY + 35, 490, 490);

  // QR Standee URL Subtext
  ctx.fillStyle = '#475569';
  ctx.font = '600 17px "JetBrains Mono", Consolas, monospace';
  ctx.fillText(options.qrUrl.replace(/^https?:\/\//, ''), width / 2, qrBoxY + qrBoxSize + 40);

  // 6. 3-Step Instruction Cards
  const stepCardY = qrBoxY + qrBoxSize + 75;
  const stepCardW = (width - 150) / 3;
  const stepCardH = 185;

  const steps = [
    {
      num: '1',
      title: 'Scan QR Code',
      desc: 'Open phone camera or Google Lens and scan the QR code above.',
      badge: '📱 Fast Camera Scan',
    },
    {
      num: '2',
      title: 'Upload & Pick Settings',
      desc: 'Upload PDF/Images. Choose Black & White, Color, or Duplex.',
      badge: '📄 Live Price Quote',
    },
    {
      num: '3',
      title: 'Pay & Collect',
      desc: 'Pay via UPI QR (Zero Waiting) or Pay Cash directly at the counter.',
      badge: '⚡ Auto-Spooling',
    },
  ];

  steps.forEach((step, idx) => {
    const cardX = 60 + idx * (stepCardW + 15);

    // Card background
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(cardX, stepCardY, stepCardW, stepCardH, 16);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Step Number Circle
    ctx.fillStyle = brandColor;
    ctx.beginPath();
    ctx.arc(cardX + 38, stepCardY + 42, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(step.num, cardX + 38, stepCardY + 50);

    // Step Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(step.title, cardX + 72, stepCardY + 48);

    // Step Desc
    ctx.fillStyle = '#475569';
    ctx.font = '15px "Segoe UI", sans-serif';
    wrapText(ctx, step.desc, cardX + 22, stepCardY + 86, stepCardW - 44, 22);

    // Step Badge
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(cardX + 20, stepCardY + stepCardH - 40, stepCardW - 40, 26, 6);
    ctx.fill();
    ctx.fillStyle = brandColor;
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(step.badge, cardX + stepCardW / 2, stepCardY + stepCardH - 23);
  });

  // 7. Security & Supported Payment Guarantee Bar
  const footerY = height - 240;
  ctx.fillStyle = '#ecfdf5';
  ctx.beginPath();
  ctx.roundRect(60, footerY, width - 120, 150, 16);
  ctx.fill();
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 24px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔒 100% PRIVATE & ENCRYPTED PRINTING', width / 2, footerY + 45);

  ctx.fillStyle = '#047857';
  ctx.font = '17px "Segoe UI", sans-serif';
  ctx.fillText('Your documents are processed securely and deleted automatically right after printing.', width / 2, footerY + 80);

  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 15px "Segoe UI", sans-serif';
  ctx.fillText('Supported UPI Payments: Google Pay • PhonePe • Paytm • BHIM • Cred • Cash at Counter', width / 2, footerY + 115);

  // Convert to PNG byte array
  return new Promise((resolve, reject) => {
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
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
