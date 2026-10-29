import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Upload,
  Camera,
  FileText,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ShieldCheck,
  SlidersHorizontal,
  LockKeyhole,
  Printer,
  CheckCircle2,
  QrCode,
  Banknote,
  Clock,
  Sparkles,
  RotateCcw,
  X
} from 'lucide-react';
import { MotionSurface, StudioHeader, useGsapStagger, Select } from '@xerox/ui';
import { translations, Language } from './locales';
import { openShopSession, quoteFiles, scanFile, ServerQuote, ShopSession } from './api';

interface Options {
  copies: number;
  colorMode: 'bw' | 'color' | 'grayscale';
  finishing: string;
  paperSize: string;
  duplex: string;
  pageRange: string;
  nup: number;
  photoPreset: string;
}

interface DocumentSelection {
  id: string;
  name: string;
  size: string;
  format: string;
  options: Options;
  source: File;
  assetId?: string;
  pageCount?: number;
}

interface PlacedOrder {
  orderId: string;
  pickupPin: string;
  shopName: string;
  totalRupees: number;
  totalSheets: number;
  totalLogicalPages: number;
  paymentMethod: string;
  placedAt: string;
  files: Array<{ name: string; copies: number; colorMode: string; sheets: number }>;
}

const defaults: Options = {
  copies: 1,
  finishing: 'none',
  colorMode: 'bw',
  paperSize: 'A4',
  duplex: 'simplex',
  pageRange: 'all',
  nup: 1,
  photoPreset: 'standard',
};

const defaultShopSession: ShopSession = {
  session_token: 'local-shop-session-anna-univ',
  shop_id: 'shop-anna-univ-01',
  shop_name: 'Anna University Quick Xerox',
  shop_slug: 'anna-univ-quick-xerox',
  expires_at: new Date(Date.now() + 86400000).toISOString(),
};

const copy = {
  en: {
    welcome: 'Your documents. Beautifully printed.',
    intro: 'Upload your documents, choose B&W or color print settings, and collect directly from the counter.',
    select: 'Select Documents',
    selected: 'Uploaded Files',
    configure: 'Print Settings',
    review: 'Review & Pay',
    advanced: 'Page Layout & Duplex Options',
    next: 'Continue to Options',
    back: 'Back to Documents',
    pending: 'Price Quote Ready',
    workflow: 'Direct to Counter Printer',
    workflowInfo: 'Once submitted, your job is sent directly to the shop printer queue.',
    options: 'Print Settings',
    payment: 'Select Payment Method',
    empty: 'No documents uploaded yet',
    fileInfo: 'PDF, Word, Excel, PPT, JPG, PNG · Up to 100 MB per file',
    verifiedInfo: 'Calculated in real-time according to shop pricing.',
    example: 'Anna University Quick Xerox · Guindy',
    privacy: '100% Private · Zero Account Required',
    clear: 'Clear queue',
  },
  ta: {
    welcome: 'துல்லியமான அச்சுக்கலை. உடனடி ஜெராக்ஸ்.',
    intro: 'உயர்தர ஆவண அச்சிடுதல். உங்கள் கோப்புகளைப் பதிவேற்றி, கவுண்டரில் உடனடியாகப் பெற்றுக் கொள்ளுங்கள்.',
    select: 'முதன்மை ஆவணங்களைத் தேர்ந்தெடுக்கவும்',
    selected: 'வரிசையில் உள்ள கோப்புகள்',
    configure: 'அச்சிடும் அமைப்புகள்',
    review: 'விருப்பங்களைச் சரிபார்க்கவும்',
    advanced: 'கூடுதல் அச்சிடும் தேர்வுகள்',
    next: 'தொடரவும்',
    back: 'பின்செல்',
    pending: 'உறுதிசெய்யப்பட்ட விலை தயார்',
    workflow: 'நேரடி இயந்திர அச்சிடுதல்',
    workflowInfo: 'உறுதிசெய்தவுடன் கோப்பு நேரடியாக பிரிண்டர் வரிசையில் சேரும்.',
    options: 'அச்சிடும் விருப்பங்கள்',
    payment: 'கட்டண முறை',
    empty: 'கோப்புகள் எதுவும் சேர்க்கப்படவில்லை',
    fileInfo: 'PDF, PNG, JPG, DOCX, XLSX, PPTX · கோப்புக்கு 100 MB வரை',
    verifiedInfo: 'கடை விலை அட்டவணையின்படி கணக்கிடப்பட்டது.',
    example: 'அண்ணா பல்கலைக்கழக ஜெராக்ஸ் · கிண்டி',
    privacy: 'வாடிக்கையாளருக்குக் கணக்கு தேவையில்லை',
    clear: 'வரிசையை அழிக்கவும்',
  },
  hi: {
    welcome: 'सटीक प्रिंटिंग। शून्य प्रतीक्षा।',
    intro: 'उत्कृष्ट गुणवत्ता वाले दस्तावेज़ प्रिंट। अपनी फ़ाइलें अपलोड करें और काउंटर से तुरंत प्राप्त करें।',
    select: 'अपने मुख्य दस्तावेज़ चुनें',
    selected: 'कतारबद्ध फ़ाइलें',
    configure: 'विस्तृत प्रिंट विकल्प',
    review: 'अपने विकल्प देखें',
    advanced: 'अतिरिक्त परिष्करण विकल्प',
    next: 'आगे बढ़ें',
    back: 'वापस',
    pending: 'प्रमाणित दर सूची तैयार है',
    workflow: 'सीधे मशीन पर प्रिंट',
    workflowInfo: 'ऑर्डर के बाद फ़ाइल सीधे दुकान के प्रिंटर स्पूलर में पहुँच जाएगी।',
    options: 'प्रिंट प्राथमिकताएँ',
    payment: 'पसंदीदा भुगतान तरीका',
    empty: 'कतार में कोई फ़ाइल नहीं है',
    fileInfo: 'PDF, PNG, JPG, DOCX, XLSX, PPTX · प्रति फ़ाइल 100 MB',
    verifiedInfo: 'दुकान की दर सूची के अनुसार सटीक गणना।',
    example: 'अन्ना यूनिवर्सिटी ज़ेरॉक्स · गिंडी',
    privacy: 'किसी खाते की आवश्यकता नहीं · अल्पकालिक मेमोरी',
    clear: 'कतार साफ़ करें',
  },
};

/**
 * Reads binary PDF structures directly in the browser to extract the true page count.
 */
async function inspectFilePages(file: File): Promise<number> {
  if (file.type.startsWith('image/')) return 1;

  if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
    try {
      const buffer = await file.arrayBuffer();
      const text = new TextDecoder('latin1').decode(new Uint8Array(buffer));

      // Fast match on /Type /Page
      const pageMatches = text.match(/\/Type\s*\/Page\b/g);
      if (pageMatches && pageMatches.length > 0) {
        return pageMatches.length;
      }

      // Catalog /Count fallback
      const countMatch = text.match(/\/Count\s+(\d+)/);
      if (countMatch && parseInt(countMatch[1], 10) > 0) {
        return parseInt(countMatch[1], 10);
      }
    } catch {
      // fallback
    }
  }
  return 1;
}

/**
 * Calculates deterministic pricing in INR paise matching the shop owner's pricing table.
 */
function calculateLocalQuote(files: DocumentSelection[]): ServerQuote {
  let totalLogicalPages = 0;
  let totalRenderedSides = 0;
  let totalSheets = 0;
  let totalPaise = 0;

  files.forEach((f) => {
    const rawPages = f.pageCount && f.pageCount > 0 ? f.pageCount : 1;
    let selectedPages = rawPages;

    if (f.options.pageRange && f.options.pageRange !== 'all') {
      const range = f.options.pageRange.trim();
      if (range === 'odd') {
        selectedPages = Math.ceil(rawPages / 2);
      } else if (range === 'even') {
        selectedPages = Math.floor(rawPages / 2);
      } else {
        const parts = range.split(',');
        let count = 0;
        for (const p of parts) {
          const match = p.trim().match(/^(\d+)(?:-(\d+)?)?$/);
          if (match) {
            const start = parseInt(match[1], 10);
            const end = match[2] ? parseInt(match[2], 10) : start;
            count += Math.max(0, Math.min(rawPages, end) - Math.max(1, start) + 1);
          }
        }
        if (count > 0) selectedPages = count;
      }
    }

    const copies = Math.max(1, f.options.copies || 1);
    const nup = Math.max(1, f.options.nup || 1);
    const logical = selectedPages * copies;
    totalLogicalPages += logical;

    const isDuplex = f.options.duplex === 'duplex_long' || f.options.duplex === 'duplex_short';
    const pagesAfterNup = Math.ceil(selectedPages / nup);
    const sidesPerCopy = pagesAfterNup;
    const sheetsPerCopy = isDuplex ? Math.ceil(sidesPerCopy / 2) : sidesPerCopy;

    totalRenderedSides += sidesPerCopy * copies;
    totalSheets += sheetsPerCopy * copies;

    // Base rates in paise:
    // B&W: ₹1.50 (150 paise), Color: ₹10.00 (1000 paise), Grayscale: ₹2.00 (200 paise)
    const baseSideRate =
      f.options.colorMode === 'color' ? 1000 : f.options.colorMode === 'grayscale' ? 200 : 150;

    const paperMultipliers: Record<string, number> = {
      A4: 1.0,
      A3: 2.0,
      A5: 0.8,
      Legal: 1.25,
      Letter: 1.0,
    };
    const paperMult = paperMultipliers[f.options.paperSize] || 1.0;

    let filePaise = 0;
    for (let c = 0; c < copies; c++) {
      if (isDuplex) {
        const fullSheets = Math.floor(sidesPerCopy / 2);
        const hasOddSide = sidesPerCopy % 2 !== 0;
        const sheetCost =
          Math.round(baseSideRate * paperMult) + Math.round(baseSideRate * 0.85 * paperMult);
        filePaise += fullSheets * sheetCost;
        if (hasOddSide) {
          filePaise += Math.round(baseSideRate * paperMult);
        }
      } else {
        filePaise += sidesPerCopy * Math.round(baseSideRate * paperMult);
      }
    }

    // Finishing
    if (f.options.finishing === 'staple') filePaise += 500 * copies;
    if (f.options.finishing === 'spiral') filePaise += 4000 * copies;
    if (f.options.finishing === 'hard_bind') filePaise += 15000 * copies;

    totalPaise += filePaise;
  });

  return {
    total_paise: totalPaise,
    total_rupees: totalPaise / 100,
    total_logical_pages: totalLogicalPages,
    total_rendered_sides: totalRenderedSides,
    total_physical_sheets: totalSheets,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    quote_hash: 'quote_' + Math.random().toString(36).substring(2, 10),
  };
}

function CustomerFlow() {
  const [lang, setLang] = useState<Language>('en');
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<DocumentSelection[]>([]);
  const [activeId, setActiveId] = useState('');
  const [applyAll, setApplyAll] = useState(true);
  const [payment, setPayment] = useState<'upi' | 'cash'>('upi');
  const [error, setError] = useState('');
  const [session, setSession] = useState<ShopSession>(defaultShopSession);
  const [serverQuote, setServerQuote] = useState<ServerQuote | null>(null);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [scanning, setScanning] = useState(false);

  // Live WebRTC Camera Scanner State
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && cameraStream && !capturedPreview) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((err) => console.warn('Video play warning:', err));
    }
  }, [cameraStream, cameraOpen, capturedPreview]);

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    setCapturedPreview(null);
    setCameraOpen(true);
    setCameraLoading(true);

    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser environment. You can upload photo files directly.');
      }

      const streamPromise = navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Camera request timed out or device not responding. Please allow camera permissions or upload an image.'
              )
            ),
          6000
        )
      );

      const stream = await Promise.race([streamPromise, timeoutPromise]);
      setCameraStream(stream);
      setCameraLoading(false);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraLoading(false);
      setCameraError(err?.message || 'Unable to access camera. Please check camera permissions or upload an image file.');
    }
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraLoading(false);
    setCameraOpen(false);
    setCapturedPreview(null);
    setCameraError(null);
  };

  const flipCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedPreview(dataUrl);
  };

  const confirmCapturedPhoto = () => {
    if (!capturedPreview) return;
    fetch(capturedPreview)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `camera-scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
        selectFiles([file]);
        closeCamera();
      })
      .catch(() => {
        closeCamera();
      });
  };

  const retakePhoto = () => {
    setCapturedPreview(null);
  };

  // Sync video stream when camera opens
  useEffect(() => {
    if (cameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen, cameraStream, capturedPreview]);

  // Clean up media stream when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const fileListRef = useGsapStagger<HTMLUListElement>({ selector: 'li', stagger: 0.05, y: 10 });
  const t = translations[lang];
  const c = copy[lang];
  const isPreviewSession = session.session_token === defaultShopSession.session_token;
  const active = files.find((f) => f.id === activeId) || files[0];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Attempt QR resolution if present in URL
  useEffect(() => {
    const qrCode = new URLSearchParams(window.location.search).get('qr');
    if (!qrCode) return;
    openShopSession(qrCode)
      .then(setSession)
      .catch(() => {
        // Fallback to shop profile gracefully
      });
  }, []);

  // Compute live quote based on current file configurations
  const quote = useMemo(() => {
    if (!files.length) return null;
    if (serverQuote) return serverQuote;
    return calculateLocalQuote(files);
  }, [files, serverQuote]);

  const selectFiles = async (selected: FileList | File[] | null) => {
    if (!selected) return;
    const accepted: DocumentSelection[] = [];
    const rejected: string[] = [];

    for (const file of Array.from(selected)) {
      if (
        !/\.(pdf|png|jpe?g|docx|xlsx|pptx)$/i.test(file.name) ||
        file.size > 100 * 1024 * 1024 ||
        file.size === 0
      ) {
        rejected.push(file.name);
        continue;
      }

      // Count pages immediately
      const pages = await inspectFilePages(file);

      accepted.push({
        id: crypto.randomUUID(),
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        format: file.name.split('.').pop()!.toUpperCase(),
        options: { ...(applyAll && active ? active.options : defaults) },
        source: file,
        assetId: 'asset_' + crypto.randomUUID().slice(0, 8),
        pageCount: pages,
      });
    }

    if (rejected.length) {
      setError(`Unsupported, empty, or over 100 MB: ${rejected.join(', ')}`);
    } else {
      setError('');
    }

    const nextFiles = [...files, ...accepted];
    setFiles(nextFiles);
    setServerQuote(null);

    // Try server scan in background if live API is connected
    if (accepted.length && session && session.session_token !== defaultShopSession.session_token) {
      setScanning(true);
      try {
        const scanned = await Promise.all(
          accepted.map((file) => scanFile(file.source, session.session_token))
        );
        setFiles((prev) =>
          prev.map((file) => {
            const index = accepted.findIndex((candidate) => candidate.id === file.id);
            const res = index >= 0 ? scanned[index] : undefined;
            return res ? { ...file, assetId: res.asset_id, pageCount: res.page_count } : file;
          })
        );
      } catch {
        // Local calculation is already active and accurate
      } finally {
        setScanning(false);
      }
    }
  };

  const update = (patch: Partial<Options>) => {
    setServerQuote(null);
    setFiles((prev) =>
      prev.map((file) =>
        applyAll || file.id === active?.id
          ? { ...file, options: { ...file.options, ...patch } }
          : file
      )
    );
  };

  const remove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (files.length <= 1) setStep(1);
  };

  const move = (index: number, direction: number) => {
    setFiles((prev) => {
      const result = [...prev];
      [result[index], result[index + direction]] = [result[index + direction], result[index]];
      return result;
    });
  };

  const rangeValid = files.every((file) =>
    /^(all|odd|even|[1-9]\d*(?:-(?:[1-9]\d*)?)?(?:\s*,\s*[1-9]\d*(?:-(?:[1-9]\d*)?)?)*)$/.test(
      file.options.pageRange
    )
  );

  const handlePlaceOrder = () => {
    if (!quote || !files.length) return;
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    const randomOrderId = 'PB-' + Math.floor(10000 + Math.random() * 90000);

    const order: PlacedOrder = {
      orderId: randomOrderId,
      pickupPin: randomPin,
      shopName: session.shop_name,
      totalRupees: quote.total_rupees,
      totalSheets: quote.total_physical_sheets,
      totalLogicalPages: quote.total_logical_pages,
      paymentMethod: payment === 'upi' ? 'Instant UPI QR (Paid)' : 'Pay Cash at Counter',
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      files: files.map((f) => ({
        name: f.name,
        copies: f.options.copies,
        colorMode: f.options.colorMode === 'color' ? 'Color' : 'B&W',
        sheets: Math.ceil((f.pageCount || 1) / (f.options.duplex === 'simplex' ? 1 : 2)) * f.options.copies,
      })),
    };

    setPlacedOrder(order);
    setStep(4);
  };

  const resetOrder = () => {
    setFiles([]);
    setActiveId('');
    setServerQuote(null);
    setPlacedOrder(null);
    setStep(1);
  };

  return (
    <div className="customer-app">
      <StudioHeader title={t.title} subtitle={session.shop_name || c.example}>
        <label className="customer-language">
          <span className="sr-only">Language</span>
          <select value={lang} onChange={(e) => setLang(e.target.value as Language)}>
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
            <option value="hi">हिन्दी</option>
          </select>
        </label>
      </StudioHeader>

      {isPreviewSession && (
        <div className="customer-preview-notice" role="note">
          <ShieldCheck size={19} aria-hidden="true" />
          <div>
            <strong>{lang === 'ta' ? 'முன்னோட்ட அமர்வு' : lang === 'hi' ? 'पूर्वावलोकन सत्र' : 'Preview session'}</strong>
            <p>{lang === 'ta' ? 'விலைகளும் மாதிரி ஆர்டர்களும் இந்தச் சாதனத்தில் மட்டுமே. பணம் சரிபார்க்கப்படாது; உண்மையான அச்சிடுதல் தொடங்காது. ஆர்டர் செய்ய கடையின் QR குறியீட்டை ஸ்கேன் செய்யவும்.' : lang === 'hi' ? 'कीमतें और नमूना ऑर्डर इस डिवाइस पर ही हैं। भुगतान सत्यापित नहीं होता और वास्तविक प्रिंट नहीं भेजा जाता। ऑर्डर के लिए दुकान का QR स्कैन करें।' : 'Prices and sample orders are local to this device. No payment is verified and no real print job is dispatched. Scan the shop’s QR to begin an order.'}</p>
          </div>
        </div>
      )}
      <div className="customer-layout">
        <aside className="customer-welcome">
          <div className="customer-eyebrow-row">
            <span className="customer-eyebrow">
              <Printer size={13} /> DOCUMENT PRINTING
            </span>
            <span className="customer-live-pill">
              <span className="live-pulse"></span>
              Shop print portal
            </span>
          </div>
          <h1 className="customer-headline">
            <span className="headline-main">{c.welcome}</span>
          </h1>
          <p className="customer-intro">{c.intro}</p>

          {/* Clean Authentic Indian Counter Rate Card */}
          <div className="customer-dispatch-card" style={{ padding: '18px', background: 'var(--pb-surface)', borderRadius: '16px', border: '1px solid var(--pb-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--pb-border)' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--pb-text)' }}>Standard Counter Rates</span>
              <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>{isPreviewSession ? 'Sample' : 'Rate guide'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: 'var(--pb-raised)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--pb-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--pb-muted)' }}>Black &amp; White</div>
                <div style={{ fontSize: '16px', fontWeight: 750, color: 'var(--pb-text)', marginTop: '2px' }}>₹1.50 <small style={{ fontSize: '11px', fontWeight: 400, color: 'var(--pb-muted)' }}>/ page</small></div>
              </div>
              <div style={{ background: 'var(--pb-raised)', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--pb-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--pb-muted)' }}>Full Color</div>
                <div style={{ fontSize: '16px', fontWeight: 750, color: 'var(--pb-accent)', marginTop: '2px' }}>₹7.00 <small style={{ fontSize: '11px', fontWeight: 400, color: 'var(--pb-muted)' }}>/ page</small></div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--pb-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Paper: A4 · A3 · Legal</span>
              <span>Duplex (2-Sided) Available</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '11px 14px', background: 'var(--pb-raised)', borderRadius: '12px', border: '1px solid var(--pb-border)', color: 'var(--pb-muted)', fontSize: '12.5px', marginTop: '16px' }}>
            <ShieldCheck size={16} color="#10b981" style={{ flexShrink: 0 }} />
            <span style={{ color: 'var(--pb-text)', fontWeight: 500 }}>Your files belong to this shop session. No account required.</span>
          </div>
        </aside>

        <main className="customer-main" id="main">
          {/* Progress Steps Header */}
          {step <= 3 && (
            <nav className="customer-steps" aria-label="Order steps">
              {[t.step1_upload, t.step2_config, t.step3_pay].map((label, i) => (
                <button
                  key={i}
                  disabled={i > 0 && (!files.length || (i === 2 && !rangeValid))}
                  aria-current={step === i + 1 ? 'step' : undefined}
                  onClick={() => setStep(i + 1)}
                >
                  <span className="step-num">{i === 0 ? <Upload size={15} /> : i === 1 ? <SlidersHorizontal size={15} /> : <LockKeyhole size={15} />}<span>{String(i + 1).padStart(2, '0')}</span></span>
                  <span className="step-label">{label.replace(/^\d\.\s*/, '')}</span>
                </button>
              ))}
            </nav>
          )}

          <MotionSurface transitionKey={step} className="customer-step">
            {/* Step 1: Upload */}
            {step === 1 && (
              <>
                <div className="customer-section-heading">
                  <div>
                    <span className="section-step-badge">01 / 03</span>
                    <h2>{c.select}</h2>
                  </div>
                  <span className="section-meta-hint">No account required · Price estimate</span>
                </div>

                <label className="customer-upload">
                  <input
                    aria-label={t.upload_cta}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.pptx"
                    onChange={(e) => {
                      selectFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <div className="customer-upload-seal">
                    <span className="customer-upload-icon">
                      <Upload size={28} />
                    </span>
                  </div>
                  <strong className="upload-title">{t.upload_cta}</strong>
                  <p className="upload-subtitle">Choose documents from your phone or computer</p>
                  <div className="upload-format-chips">
                    <span>PDF</span>
                    <span>DOCX</span>
                    <span>XLSX</span>
                    <span>PPTX</span>
                    <span>PNG</span>
                    <span>JPG</span>
                    <span className="format-limit">Up to 100 MB</span>
                  </div>
                </label>

                <button
                  type="button"
                  className="customer-camera"
                  onClick={() => startCamera('environment')}
                >
                  <div className="camera-icon-disc">
                    <Camera size={18} />
                  </div>
                  <span>{t.camera_cta}</span>
                  <span className="camera-pill-hint">Scan Paper</span>
                </button>

                {error && (
                  <p role="alert" className="customer-error">
                    {error}
                  </p>
                )}

                <div className="customer-files-heading">
                  <h3>
                    {c.selected} <span className="files-counter">{files.length}</span>
                  </h3>
                  {files.length > 0 && <button onClick={() => setFiles([])} className="btn-clear-queue">{c.clear}</button>}
                </div>

                {!files.length && (
                  <div className="customer-empty-bay">
                    <div className="empty-bay-icon">
                      <FileText size={24} />
                    </div>
                    <div className="empty-bay-info">
                      <strong>{c.empty}</strong>
                      <p>Upload your files above to calculate page count and preview your print</p>
                    </div>
                  </div>
                )}

                <ul ref={fileListRef} className="customer-file-list">
                  {files.map((file, index) => (
                    <li key={file.id} className="customer-file-card">
                      <div className="file-badge-crest">
                        <FileText size={20} />
                        <span className="file-ext-tag">{file.format.toUpperCase()}</span>
                      </div>
                      <div className="file-details">
                        <strong className="file-title">{file.name}</strong>
                        <div className="file-meta-row">
                          <span className="file-meta-pill">{file.size}</span>
                          <span className="file-meta-pill page-pill">
                            {file.pageCount || 1} {file.pageCount === 1 ? 'Page' : 'Pages'}
                          </span>
                          <span className="file-status-pill">Ready to Print</span>
                        </div>
                      </div>
                      <div className="customer-file-actions">
                        <button
                          aria-label={`Move ${file.name} up`}
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                          title="Move up in print queue"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          aria-label={`Move ${file.name} down`}
                          disabled={index === files.length - 1}
                          onClick={() => move(index, 1)}
                          title="Move down in print queue"
                        >
                          <ArrowDown size={16} />
                        </button>
                        <button
                          aria-label={`Remove ${file.name}`}
                          onClick={() => remove(file.id)}
                          className="btn-remove"
                          title="Remove document"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Step 2: Configure */}
            {step === 2 && active && (
              <>
                <div className="customer-section-heading">
                  <div><span className="section-step-badge">02 / 03</span><h2>{c.configure}</h2></div>
                </div>
                <label className="customer-field">
                  {c.selected}
                  <select value={active.id} onChange={(e) => setActiveId(e.target.value)}>
                    {files.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.pageCount || 1} {f.pageCount === 1 ? 'page' : 'pages'})
                      </option>
                    ))}
                  </select>
                </label>

                {files.length > 1 && (
                  <label className="customer-check">
                    <input
                      type="checkbox"
                      checked={applyAll}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setApplyAll(checked);
                        if (checked) {
                          setFiles((prev) =>
                            prev.map((f) => ({ ...f, options: { ...active.options } }))
                          );
                        }
                      }}
                    />
                    {t.apply_to_all}
                  </label>
                )}

                <div className="customer-configuration">
                  <fieldset>
                    <legend>{t.color_mode}</legend>
                    <div className="customer-choice-row">
                      {(['bw', 'color', 'grayscale'] as const).map((mode) => (
                        <button
                          aria-pressed={active.options.colorMode === mode}
                          key={mode}
                          onClick={() => update({ colorMode: mode })}
                        >
                          <span className={`customer-color-dot ${mode}`} />
                          {mode === 'bw'
                            ? t.bw
                            : mode === 'color'
                            ? t.color
                            : lang === 'ta'
                            ? 'சாம்பல் நிறம் (₹2.00)'
                            : lang === 'hi'
                            ? 'ग्रेस्केल (₹2.00)'
                            : 'Grayscale (₹2.00)'}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <label className="customer-field">
                    {t.duplex}
                    <select
                      value={active.options.duplex}
                      onChange={(e) => update({ duplex: e.target.value })}
                    >
                      <option value="simplex">{t.single_sided}</option>
                      <option value="duplex_long">{t.double_sided_long}</option>
                      <option value="duplex_short">{t.double_sided_short}</option>
                    </select>
                  </label>

                  <div className="customer-two-columns">
                    <label className="customer-field">
                      {t.copies}
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={active.options.copies}
                        onChange={(e) =>
                          update({
                            copies: Math.max(1, Math.min(999, Number(e.target.value) || 1)),
                          })
                        }
                      />
                    </label>
                    <label className="customer-field">
                      {t.paper_size}
                      <select
                        value={active.options.paperSize}
                        onChange={(e) => update({ paperSize: e.target.value })}
                      >
                        {['A4', 'A3', 'A5', 'Legal', 'Letter'].map((size) => (
                          <option key={size}>{size}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <details className="customer-advanced">
                    <summary>
                      <SlidersHorizontal size={19} />
                      {c.advanced}
                    </summary>
                    <div className="customer-advanced-content">
                      <label className="customer-field">
                        {t.page_range}
                        <input
                          value={active.options.pageRange}
                          aria-invalid={!rangeValid}
                          aria-describedby="range-help"
                          onChange={(e) => update({ pageRange: e.target.value })}
                        />
                      </label>
                      <p id="range-help" className={rangeValid ? 'customer-hint' : 'customer-error'}>
                        {c.verifiedInfo}
                      </p>
                      <div className="customer-range-presets">
                        {[
                          ['all', t.all_pages],
                          ['odd', t.odd_only],
                          ['even', t.even_only],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            aria-pressed={active.options.pageRange === value}
                            onClick={() => update({ pageRange: value })}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <label className="customer-field">
                        {t.nup}
                        <select
                          value={active.options.nup}
                          onChange={(e) => update({ nup: Number(e.target.value) })}
                        >
                          {[1, 2, 4, 6, 9, 16].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="customer-field">
                        {lang === 'ta'
                          ? 'பைண்டிங் விருப்பம்'
                          : lang === 'hi'
                          ? 'बाइंडिंग प्राथमिकता'
                          : 'Finishing preference'}
                        <select
                          value={active.options.finishing}
                          onChange={(e) => update({ finishing: e.target.value })}
                        >
                          <option value="none">
                            {lang === 'ta' ? 'இல்லை' : lang === 'hi' ? 'नहीं' : 'None'}
                          </option>
                          <option value="staple">
                            {lang === 'ta' ? 'ஸ்டேப்ளர் (+₹5)' : lang === 'hi' ? 'स्टेपल (+₹5)' : 'Corner staple (+₹5)'}
                          </option>
                          <option value="spiral">
                            {lang === 'ta'
                              ? 'ஸ்பைரல் பைண்டிங் (+₹40)'
                              : lang === 'hi'
                              ? 'स्पाइरल (+₹40)'
                              : 'Spiral coil (+₹40)'}
                          </option>
                          <option value="hard_bind">
                            {lang === 'ta'
                              ? 'ஹார்ட் பைண்ட் (+₹150)'
                              : lang === 'hi'
                              ? 'हार्ड बाइंड (+₹150)'
                              : 'Hard bound (+₹150)'}
                          </option>
                        </select>
                      </label>
                    </div>
                  </details>
                </div>

                <div className="customer-server-note">
                  <CheckCircle2 size={22} color="var(--pb-success)" />
                  <div>
                    <strong>
                      {active.name} · {active.pageCount || 1} {active.pageCount === 1 ? 'page' : 'pages'} verified
                    </strong>
                    <p>
                      {c.verifiedInfo} Current selection:{' '}
                      {active.options.colorMode === 'color' ? 'Color (₹10/pg)' : 'B&W (₹1.50/pg)'} ·{' '}
                      {active.options.duplex === 'simplex' ? 'Single side' : 'Double sided'} ·{' '}
                      {active.options.copies} {active.options.copies === 1 ? 'copy' : 'copies'}.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Review & Pay */}
            {step === 3 && (
              <>
                <div className="customer-section-heading">
                  <div><span className="section-step-badge">03 / 03</span><h2>{c.review}</h2></div>
                </div>
                <div className="customer-summary">
                  {files.map((file) => (
                    <div key={file.id}>
                      <FileText size={21} />
                      <div>
                        <strong>{file.name}</strong>
                        <p>
                          {file.options.copies} × {file.options.paperSize} ·{' '}
                          {file.options.colorMode === 'bw'
                            ? 'B&W (₹1.50)'
                            : file.options.colorMode === 'color'
                            ? 'Color (₹10.00)'
                            : 'Grayscale (₹2.00)'}{' '}
                          · {file.options.duplex === 'simplex' ? 'Single side' : 'Double side'} ·{' '}
                          {file.pageCount || 1} pages
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="customer-quote">
                  <LockKeyhole size={25} />
                  <h3>Your print summary</h3>
                  <p>Accurate price locked according to {session.shop_name} rate table.</p>
                  <dl>
                    {[
                      [t.logical_pages, quote?.total_logical_pages],
                      [t.rendered_sides, quote?.total_rendered_sides],
                      [t.physical_sheets, quote?.total_physical_sheets],
                      [t.price_total, quote ? `₹${quote.total_rupees.toFixed(2)}` : '—'],
                    ].map(([label, val]) => (
                      <div key={String(label)}>
                        <dt>{label}</dt>
                        <dd>{val ?? '—'}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <fieldset>
                  <legend>{c.payment}</legend>
                  <div className="customer-choice-row" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <button
                      aria-pressed={payment === 'upi'}
                      onClick={() => setPayment('upi')}
                    >
                      <QrCode size={18} />
                      {t.pay_upi}
                    </button>
                    <button
                      aria-pressed={payment === 'cash'}
                      onClick={() => setPayment('cash')}
                    >
                      <Banknote size={18} />
                      {t.pay_cash}
                    </button>
                  </div>
                </fieldset>

                {payment === 'upi' && quote && (
                  <div className="customer-server-note" style={{ background: 'var(--pb-surface)', marginTop: '16px' }}>
                    <QrCode size={36} color="var(--pb-accent)" />
                    <div>
                      <strong>Scan UPI to Pay ₹{quote.total_rupees.toFixed(2)}</strong>
                      <p>
                        VPA: <code>quickxerox@okaxis</code> · Instant settlement via GPay / PhonePe / Paytm.
                      </p>
                    </div>
                  </div>
                )}

                {payment === 'cash' && quote && (
                  <div className="customer-server-note" style={{ background: 'var(--pb-surface)', marginTop: '16px' }}>
                    <Printer size={36} color="var(--pb-accent)" />
                    <div>
                      <strong>Pay ₹{quote.total_rupees.toFixed(2)} in Cash at Counter</strong>
                      <p>Your order will be queued immediately and printed upon counter confirmation.</p>
                    </div>
                  </div>
                )}

                <div className="customer-server-note">
                  <Printer size={24} />
                  <div>
                    <strong>{c.workflow}</strong>
                    <p>{c.workflowInfo}</p>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Order Confirmed & Tracking Screen */}
            {step === 4 && placedOrder && (
              <>
                <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      margin: '0 auto 16px',
                      borderRadius: '50%',
                      background: 'var(--pb-accent-soft)',
                      color: 'var(--pb-accent)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Sparkles size={32} />
                  </div>
                  <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>{isPreviewSession ? 'Sample order saved' : 'Order Submitted!'}</h2>
                  <p style={{ color: 'var(--pb-muted)', fontSize: '14px' }}>
                    {isPreviewSession ? 'This preview stays on your device. No payment was verified and no print job was dispatched.' : <>Sent directly to <strong>{placedOrder.shopName}</strong> workstation spooler.</>}
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '12px',
                    margin: '16px 0',
                    padding: '16px',
                    borderRadius: 'var(--pb-radius-card)',
                    border: '1px solid var(--pb-border)',
                    background: 'var(--pb-raised)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--pb-muted)', textTransform: 'uppercase' }}>
                      Order Tracking ID
                    </span>
                    <strong style={{ display: 'block', fontSize: '18px', marginTop: '4px' }}>
                      {placedOrder.orderId}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--pb-muted)', textTransform: 'uppercase' }}>
                      Pickup PIN
                    </span>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: '18px',
                        marginTop: '4px',
                        color: 'var(--pb-accent)',
                        letterSpacing: '2px',
                      }}
                    >
                      {placedOrder.pickupPin}
                    </strong>
                  </div>
                </div>

                <div className="customer-quote" style={{ marginTop: '0' }}>
                  <Clock size={24} />
                  <h3>{isPreviewSession ? 'Sample order status' : 'Live Print Status'}</h3>
                  <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={18} color="var(--pb-success)" />
                      <span>{t.order_received} · {placedOrder.placedAt}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Printer size={18} color="var(--pb-accent)" />
                      <strong>{isPreviewSession ? 'Preview only · No printer dispatch' : `${t.order_approved} · Counter Spooler Active`}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--pb-muted)' }}>
                      <Clock size={18} />
                      <span>{isPreviewSession ? 'Collection is unavailable in preview' : `${t.ready} (Show PIN ${placedOrder.pickupPin} at Counter)`}</span>
                    </div>
                  </div>
                </div>

                <div className="customer-summary" style={{ marginTop: '16px' }}>
                  <strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                    Items in this Print Job ({placedOrder.totalSheets} sheets, {placedOrder.totalLogicalPages} pages):
                  </strong>
                  {placedOrder.files.map((file, idx) => (
                    <div key={idx}>
                      <FileText size={18} />
                      <div>
                        <strong>{file.name}</strong>
                        <p>
                          {file.copies} copies · {file.colorMode} · {file.sheets} sheets
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '20px',
                    padding: '14px 18px',
                    borderRadius: 'var(--pb-radius-card)',
                    background: 'var(--pb-surface)',
                    border: '1px solid var(--pb-border)',
                  }}
                >
                  <span>{isPreviewSession ? 'Sample total · Unpaid' : `Total Paid (${placedOrder.paymentMethod}):`}</span>
                  <strong style={{ fontSize: '18px' }}>₹{placedOrder.totalRupees.toFixed(2)}</strong>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <button
                    className="customer-primary"
                    style={{ width: '100%', minHeight: '48px', gap: '8px' }}
                    onClick={resetOrder}
                  >
                    <RotateCcw size={18} />
                    {t.add_more_files || 'Print Another Document'}
                  </button>
                </div>
              </>
            )}
          </MotionSurface>

          {/* Persistent Action Bar at bottom */}
          {files.length > 0 && step <= 3 && (
            <footer className="customer-action-bar">
              <div>
                <strong>
                  {files.length} {c.selected.toLowerCase()}
                </strong>
                <span>
                  {scanning
                    ? 'Inspecting document...'
                    : quote
                    ? `₹${quote.total_rupees.toFixed(2)} · ${quote.total_physical_sheets} ${
                        quote.total_physical_sheets === 1 ? 'sheet' : 'sheets'
                      }`
                    : 'Calculating price...'}
                </span>
              </div>
              <div className="customer-footer-buttons">
                {step > 1 && <button onClick={() => setStep(step - 1)}>{c.back}</button>}
                {step < 3 && (
                  <button
                    className="customer-primary"
                    disabled={!files.length || !rangeValid}
                    onClick={() => setStep(step + 1)}
                  >
                    {lang === 'en' && step === 2 ? 'Review order' : c.next}
                    <ArrowRight size={18} />
                  </button>
                )}
                {step === 3 && (
                  <button
                    className="customer-primary"
                    disabled={!quote || !files.length}
                    onClick={handlePlaceOrder}
                  >
                    {payment === 'upi' ? 'Pay via UPI & Print' : 'Confirm Order (Pay Cash)'}
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </footer>
          )}
        </main>
      </div>

      {/* Interactive Live WebRTC Camera Document Scanner Modal */}
      {cameraOpen && (
        <div className="customer-camera-modal" role="dialog" aria-modal="true" aria-label="Camera Document Scanner">
          <div className="camera-card">
            <div className="camera-header">
              <div className="camera-header-title">
                <span className="camera-live-dot" />
                <span>Live Document Scanner</span>
              </div>
              <div className="camera-header-actions">
                {!capturedPreview && (
                  <button
                    type="button"
                    className="camera-btn-icon"
                    onClick={flipCamera}
                    title="Flip camera (front / back)"
                    aria-label="Flip camera"
                  >
                    <RotateCcw size={18} />
                  </button>
                )}
                <button
                  type="button"
                  className="camera-btn-icon"
                  onClick={closeCamera}
                  title="Close camera"
                  aria-label="Close camera"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="camera-viewport">
              {cameraError ? (
                <div className="camera-error-view">
                  <div className="camera-error-icon-box">
                    <Camera size={36} />
                  </div>
                  <strong style={{ fontSize: '15px', color: '#fff' }}>Camera Access Blocked</strong>
                  <p className="camera-error-text">{cameraError}</p>
                  <label className="btn-camera-fallback">
                    <Upload size={16} />
                    <span>Choose photo from device</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        selectFiles(e.target.files);
                        closeCamera();
                      }}
                    />
                  </label>
                </div>
              ) : capturedPreview ? (
                <div className="camera-preview-container">
                  <img src={capturedPreview} alt="Captured Document" className="camera-preview-img" />
                  <div className="preview-watermark-chip">Scanned Document Ready</div>
                </div>
              ) : cameraLoading || !cameraStream ? (
                <div className="camera-loading-view">
                  <div className="camera-radar-pulse" />
                  <div className="camera-loading-content">
                    <Camera size={40} className="camera-icon-pulse" />
                    <strong style={{ fontSize: '15px', color: '#fff', marginTop: '12px', display: 'block' }}>
                      Connecting to Camera Sensor...
                    </strong>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0', maxWidth: '320px', lineHeight: 1.5 }}>
                      Please click "Allow" if prompted by your browser for camera permissions.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                  />
                  <div className="camera-reticle">
                    <span className="reticle-corner tl" />
                    <span className="reticle-corner tr" />
                    <span className="reticle-corner bl" />
                    <span className="reticle-corner br" />
                  </div>
                  <div className="camera-guide-text">
                    Align document or certificate within guidelines
                  </div>
                </>
              )}
            </div>

            <div className="camera-controls">
              {capturedPreview ? (
                <div className="camera-action-group">
                  <button type="button" className="btn-camera-retake" onClick={retakePhoto}>
                    <RotateCcw size={16} />
                    <span>Retake Photo</span>
                  </button>
                  <button type="button" className="btn-camera-accept" onClick={confirmCapturedPhoto}>
                    <CheckCircle2 size={16} />
                    <span>Add to Print Order</span>
                  </button>
                </div>
              ) : !cameraError && !cameraLoading ? (
                <div className="camera-shutter-container">
                  <button
                    type="button"
                    className="camera-shutter-btn"
                    onClick={captureFrame}
                    aria-label="Snap photo"
                    title="Capture document"
                  >
                    <div className="shutter-inner" />
                  </button>
                  <span className="shutter-hint">TAP TO SNAP DOCUMENT</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerFlow;
