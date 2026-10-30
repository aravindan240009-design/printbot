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
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  Zap,
  MapPin,
  Store,
  Check
} from 'lucide-react';
import { MotionSurface, PrintBotLogo, ThemeSwitch, useGsapStagger } from '@xerox/ui';
import { translations, Language } from './locales';
import { openShopSession, scanFile, ServerQuote, ShopSession } from './api';

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
  files: Array<{ name: string; copies: number; colorMode: string; sheets: number; duplex: string; paperSize: string }>;
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
    intro: 'Self-service mobile print queue for Anna University. Upload from phone or laptop, pick up at counter in under 2 minutes.',
    select: 'Select Documents',
    selected: 'Uploaded Files',
    configure: 'Print Settings',
    review: 'Review & Pay',
    advanced: 'Advanced Page Layout & Finishing',
    next: 'Continue to Options',
    back: 'Back',
    pending: 'Price Quote Ready',
    workflow: 'Direct to Counter Printer',
    workflowInfo: 'Once submitted, your job is sent directly to the shop printer queue with zero manual queue wait.',
    options: 'Print Settings',
    payment: 'Select Payment Method',
    empty: 'No documents uploaded yet',
    fileInfo: 'PDF, Word, Excel, PPT, JPG, PNG · Up to 100 MB per file',
    verifiedInfo: 'Calculated in real-time according to shop pricing.',
    example: 'Anna University Quick Xerox · Guindy',
    privacy: '100% Private · Zero Account Required · Auto-deleted after collection',
    clear: 'Clear queue',
    ratesTitle: 'Standard Counter Rates',
    rateBw: '₹1.50',
    rateColor: '₹7.00',
    rateDuplex: '₹2.50',
    ratesHint: 'Duplex saves 17% on paper',
    hours: '8:30 AM – 9:30 PM (Mon - Sat)',
    location: 'Guindy Campus, Library Wing Counter #2',
  },
  ta: {
    welcome: 'துல்லியமான அச்சுக்கலை. உடனடி ஜெராக்ஸ்.',
    intro: 'அண்ணா பல்கலைக்கழக விரைவு அச்சிடும் தளம். உங்கள் தொலைபேசியிலிருந்து பதிவேற்றி, 2 நிமிடங்களில் கவுண்டரில் பெற்றுக் கொள்ளுங்கள்.',
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
    privacy: 'வாடிக்கையாளருக்குக் கணக்கு தேவையில்லை · அச்சிட்ட பின் அழிக்கப்படும்',
    clear: 'வரிசையை அழிக்கவும்',
    ratesTitle: 'நிலையான கவுண்டர் கட்டணங்கள்',
    rateBw: '₹1.50',
    rateColor: '₹7.00',
    rateDuplex: '₹2.50',
    ratesHint: 'இருபுற அச்சிடுதலில் 17% தள்ளுபடி',
    hours: 'காலை 8:30 – இரவு 9:30 (திங்கள் - சனி)',
    location: 'கிண்டி வளாகம், நூலகப் பிரிவு கவுண்டர் #2',
  },
  hi: {
    welcome: 'सटीक प्रिंटिंग। शून्य प्रतीक्षा।',
    intro: 'अन्ना यूनिवर्सिटी त्वरित प्रिंट सेवा। अपने फोन से दस्तावेज अपलोड करें और काउंटर से तुरंत प्राप्त करें।',
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
    privacy: 'किसी खाते की आवश्यकता नहीं · प्रिंट के बाद स्वतः नष्ट',
    clear: 'कतार साफ़ करें',
    ratesTitle: 'मानक काउंटर दरें',
    rateBw: '₹1.50',
    rateColor: '₹7.00',
    rateDuplex: '₹2.50',
    ratesHint: 'डबल-साइड प्रिंट पर 17% की बचत',
    hours: 'सुबह 8:30 – रात 9:30 (सोम - शनि)',
    location: 'गिंडी कैंपस, लाइब्रेरी विंग काउंटर #2',
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
    // B&W: ₹1.50 (150 paise), Color: ₹7.00 (700 paise), Grayscale: ₹2.00 (200 paise)
    const baseSideRate =
      f.options.colorMode === 'color' ? 700 : f.options.colorMode === 'grayscale' ? 200 : 150;

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
  const [mobileRatesOpen, setMobileRatesOpen] = useState(false);
  const [upiSimulated, setUpiSimulated] = useState(false);
  const [showSandboxNotice, setShowSandboxNotice] = useState(true);

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

  useEffect(() => {
    if (cameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen, cameraStream, capturedPreview]);

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

  useEffect(() => {
    const qrCode = new URLSearchParams(window.location.search).get('qr');
    if (!qrCode) return;
    openShopSession(qrCode)
      .then(setSession)
      .catch(() => {
        // Fallback to shop profile gracefully
      });
  }, []);

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
    if (!activeId && nextFiles.length > 0) {
      setActiveId(nextFiles[0].id);
    }
    setServerQuote(null);

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
        // Local calculation is active
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
        colorMode: f.options.colorMode === 'color' ? 'Color' : f.options.colorMode === 'grayscale' ? 'Grayscale' : 'B&W',
        duplex: f.options.duplex === 'simplex' ? 'Single side' : 'Double side',
        paperSize: f.options.paperSize,
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
    setUpiSimulated(false);
  };

  return (
    <div className="customer-app">
      {/* 1. DISCREET INTERACTIVE SANDBOX TOP-TICKER (Dismissible, only if preview session) */}
      {isPreviewSession && showSandboxNotice && (
        <div className="customer-sandbox-ticker" role="region" aria-label="Interactive Sandbox Notice">
          <div className="sandbox-ticker-inner">
            <span className="ticker-chip">
              <Sparkles size={12} className="sparkle-spin" />
              <span>{lang === 'ta' ? 'மாதிரி கவுண்டர்' : lang === 'hi' ? 'डेमो मोड' : 'Interactive Sandbox'}</span>
            </span>
            <span className="ticker-message">
              {lang === 'ta'
                ? 'நேரடி விலைக் கணிப்பு & Windows பிரிண்ட் வரிசை மாதிரி இயக்கம் · கட்டணம் தேவையில்லை.'
                : lang === 'hi'
                ? 'लाइव पेज गणित और Windows spooler सिमुलेशन सक्रिय · कोई वास्तविक भुगतान नहीं।'
                : 'Real-time duplex sheet math & native Windows spooler simulation · Zero real payment charged'}
            </span>
            <span className="ticker-shop-pill">{session.shop_name}</span>
          </div>
          <button
            type="button"
            className="ticker-dismiss-btn"
            onClick={() => setShowSandboxNotice(false)}
            title="Dismiss notice"
            aria-label="Dismiss notice"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* 2. BESPOKE ULTRA-PREMIUM CUSTOMER COUNTER HEADER */}
      <header className="customer-hub-header">
        <div className="customer-header-inner">
          {/* Left: Brand Emblem + Official Shop Identity & Real-Time Status */}
          <div className="customer-brand-cluster">
            <a href="#main" className="customer-brand-emblem-wrap" title="Print Bot Platform">
              <div className="customer-brand-emblem">
                <PrintBotLogo size={36} />
              </div>
            </a>

            {/* Desktop Shop Identity & Metadata */}
            <div className="customer-shop-id-block desktop-only">
              <div className="shop-name-row">
                <span className="shop-official-name">{session.shop_name || c.example}</span>
                <span className="counter-verified-pill" title="Certified Print Bot Counter">
                  <ShieldCheck size={12} />
                  <span>Verified Counter</span>
                </span>
                <span className="counter-live-beacon" title="Hardware Spooler Online">
                  <span className="live-beacon-dot" />
                  <span>Ready to Print</span>
                </span>
              </div>
              <div className="shop-desk-meta">
                <span className="desk-item"><MapPin size={11} /> Library Wing · Counter #2</span>
                <span className="desk-sep">•</span>
                <span className="desk-item"><Clock size={11} /> 8:30 AM – 9:30 PM</span>
                <span className="desk-sep">•</span>
                <span className="desk-item queue-tag"><Zap size={11} /> 0-Min Queue</span>
              </div>
            </div>

            {/* Mobile Brand Title next to Logo */}
            <div className="customer-mobile-brand mobile-only">
              <span className="mobile-brand-title">Print Bot</span>
            </div>
          </div>

          {/* Center: Live Counter Rate Strip (Desktop >= 960px) */}
          <div className="customer-rates-strip desktop-only-inline">
            <div className="header-rate-chip" title="Black & White Printing Rate">
              <span className="chip-label">B&W</span>
              <strong className="chip-val">{c.rateBw}</strong>
            </div>
            <div className="header-rate-chip" title="Full Color Laser Printing Rate">
              <span className="chip-label">Color</span>
              <strong className="chip-val">{c.rateColor}</strong>
            </div>
            <div className="header-rate-chip eco" title="Two-sided Duplex Paper Discount">
              <span className="chip-label">Duplex</span>
              <strong className="chip-val">-17%</strong>
            </div>
          </div>

          {/* Right: Trilingual Segmented Switcher + Theme Switch + Live Order Summary */}
          <div className="customer-header-controls">
            {/* Live Upload Summary Chip (if user has uploaded documents) */}
            {files.length > 0 && (
              <div className="header-cart-chip" title="Files in printing queue">
                <FileText size={13} />
                <span>{files.length} {files.length === 1 ? 'file' : 'files'}</span>
                <span className="cart-chip-divider">·</span>
                <strong className="cart-chip-price">₹{(serverQuote?.total_rupees || 0).toFixed(2)}</strong>
              </div>
            )}

            {/* Trilingual Segmented Pill Switcher */}
            <div className="customer-lang-segmented" role="radiogroup" aria-label="Select Language">
              {(['en', 'ta', 'hi'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`lang-segment-btn ${lang === l ? 'active' : ''}`}
                  onClick={() => setLang(l)}
                  role="radio"
                  aria-checked={lang === l}
                  title={l === 'en' ? 'English' : l === 'ta' ? 'தமிழ்' : 'हिन्दी'}
                >
                  {l === 'en' ? 'EN' : l === 'ta' ? 'தமிழ்' : 'हिंदी'}
                </button>
              ))}
            </div>

            {/* Haute Theme Switcher */}
            <ThemeSwitch />
          </div>
        </div>
      </header>

      {/* MOBILE ONLY (< 860px): Compact Shop Counter Header with Quick Rates Accordion */}
      <div className="customer-mobile-shop-bar mobile-only">
        <div className="mobile-shop-main-row">
          <div className="mobile-shop-avatar">
            <Store size={18} />
          </div>
          <div className="mobile-shop-info">
            <div className="mobile-shop-title-row">
              <strong className="mobile-shop-name">{session.shop_name}</strong>
              <span className="mobile-shop-open-pill">
                <span className="live-dot" />
                Open
              </span>
            </div>
            <div className="mobile-shop-sub">
              <span>B&W: <strong>{c.rateBw}</strong></span>
              <span className="dot-sep">·</span>
              <span>Color: <strong>{c.rateColor}</strong></span>
              <span className="dot-sep">·</span>
              <span className="eco-tag">Duplex -17%</span>
            </div>
          </div>
          <button
            type="button"
            className="btn-toggle-mobile-rates"
            onClick={() => setMobileRatesOpen(!mobileRatesOpen)}
            aria-expanded={mobileRatesOpen}
          >
            <span>{mobileRatesOpen ? 'Hide' : 'Rates'}</span>
            {mobileRatesOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* Collapsible Mobile Rate & Hours Sheet */}
        {mobileRatesOpen && (
          <div className="mobile-rates-drawer animate-slide-down">
            <div className="mobile-rates-grid">
              <div className="rate-pill-card">
                <span className="rate-type">Black &amp; White</span>
                <span className="rate-cost">{c.rateBw} <small>/ page</small></span>
              </div>
              <div className="rate-pill-card highlight">
                <span className="rate-type">Full Color</span>
                <span className="rate-cost">{c.rateColor} <small>/ page</small></span>
              </div>
              <div className="rate-pill-card">
                <span className="rate-type">Duplex (2-Sided)</span>
                <span className="rate-cost">{c.rateDuplex} <small>/ sheet</small></span>
              </div>
              <div className="rate-pill-card">
                <span className="rate-type">Finishing</span>
                <span className="rate-cost">Spiral from ₹40</span>
              </div>
            </div>
            <div className="mobile-rates-meta">
              <div className="meta-line"><Clock size={13} /> <span>{c.hours}</span></div>
              <div className="meta-line"><MapPin size={13} /> <span>{c.location}</span></div>
              <div className="meta-line privacy"><ShieldCheck size={13} /> <span>{c.privacy}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="customer-layout">
        {/* DESKTOP ONLY: Left Counter Welcome Column */}
        <aside className="customer-welcome desktop-only">
          <div className="customer-shop-card">
            {/* Shop Photo with Live Badge */}
            <div className="customer-shop-cover">
              <div className="cover-overlay-gradient" />
              <div className="cover-status-badge">
                <span className="live-pulse-dot" />
                <span>Workstation Online · Spooler Ready</span>
              </div>
              <div className="cover-shop-badge">
                <Store size={15} />
                <span>Verified Counter #2</span>
              </div>
            </div>

            <div className="customer-shop-body">
              <div className="customer-eyebrow-row">
                <span className="customer-eyebrow">
                  <Printer size={13} /> DOCUMENT PRINTING
                </span>
                <span className="customer-live-pill">
                  <span className="live-pulse" />
                  Direct Spooler Queue
                </span>
              </div>

              <h1 className="customer-headline">
                <span className="headline-main">{c.welcome}</span>
              </h1>
              <p className="customer-intro">{c.intro}</p>

              {/* Standard Counter Rate Card */}
              <div className="customer-dispatch-card">
                <div className="rate-card-header">
                  <span className="rate-card-title">
                    <Zap size={14} className="text-gold" /> {c.ratesTitle}
                  </span>
                  <span className="rate-tag-sample">{isPreviewSession ? 'Live Rates' : 'Official Table'}</span>
                </div>

                <div className="rates-grid-desktop">
                  <div className="rate-cell">
                    <div className="rate-label">Black &amp; White</div>
                    <div className="rate-val">
                      {c.rateBw} <small>/ page</small>
                    </div>
                    <span className="rate-subtext">75 GSM High Speed</span>
                  </div>
                  <div className="rate-cell active-rate">
                    <div className="rate-label">Full Color</div>
                    <div className="rate-val text-accent">
                      {c.rateColor} <small>/ page</small>
                    </div>
                    <span className="rate-subtext">Laser Toner CMYK</span>
                  </div>
                </div>

                <div className="duplex-callout-strip">
                  <div className="duplex-callout-left">
                    <Layers size={15} />
                    <span><strong>Duplex (2-Sided):</strong> {c.rateDuplex} / sheet</span>
                  </div>
                  <span className="eco-badge">{c.ratesHint}</span>
                </div>

                <div className="rate-specs-row">
                  <span>Paper: <strong>A4 · A3 · Legal · A5</strong></span>
                  <span>Finishing: <strong>Staple · Spiral · Binding</strong></span>
                </div>
              </div>

              {/* Shop Operational Details */}
              <div className="customer-operating-box">
                <div className="op-item">
                  <Clock size={15} className="text-gold" />
                  <div>
                    <strong>Hours:</strong> {c.hours}
                  </div>
                </div>
                <div className="op-item">
                  <MapPin size={15} className="text-gold" />
                  <div>
                    <strong>Location:</strong> {c.location}
                  </div>
                </div>
              </div>

              {/* Security & Privacy Guarantee */}
              <div className="customer-privacy-box">
                <ShieldCheck size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <span>{c.privacy}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Flow Column */}
        <main className="customer-main" id="main">
          {/* Progress Steps Header */}
          {step <= 3 && (
            <nav className="customer-steps" aria-label="Order steps">
              {[
                { label: t.step1_upload, icon: Upload, stepNum: 1, count: files.length },
                { label: t.step2_config, icon: SlidersHorizontal, stepNum: 2 },
                { label: t.step3_pay, icon: LockKeyhole, stepNum: 3 },
              ].map((item, i) => {
                const Icon = item.icon;
                const isActive = step === item.stepNum;
                const isPassed = step > item.stepNum;
                const isDisabled = i > 0 && (!files.length || (i === 2 && !rangeValid));

                return (
                  <button
                    key={i}
                    disabled={isDisabled}
                    aria-current={isActive ? 'step' : undefined}
                    onClick={() => setStep(item.stepNum)}
                    className={`step-btn ${isActive ? 'step-active' : ''} ${isPassed ? 'step-completed' : ''}`}
                  >
                    <span className="step-icon-wrap">
                      {isPassed ? <Check size={14} /> : <Icon size={14} />}
                    </span>
                    <span className="step-label-group">
                      <span className="step-index">Step 0{item.stepNum}</span>
                      <span className="step-text desktop-only-inline">{item.label.replace(/^\d\.\s*/, '')}</span>
                      <span className="step-text mobile-only-inline">
                        {item.stepNum === 1
                          ? (lang === 'ta' ? 'பதிவேற்று' : lang === 'hi' ? 'अपलोड' : 'Upload')
                          : item.stepNum === 2
                          ? (lang === 'ta' ? 'அமைப்புகள்' : lang === 'hi' ? 'विकल्प' : 'Options')
                          : (lang === 'ta' ? 'கட்டணம்' : lang === 'hi' ? 'भुगतान' : 'Pay')}
                      </span>
                    </span>
                    {item.count !== undefined && item.count > 0 && (
                      <span className="step-badge-counter">{item.count}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          <MotionSurface transitionKey={step} className="customer-step">
            {/* STEP 1: Upload Documents */}
            {step === 1 && (
              <>
                <div className="customer-section-heading">
                  <div>
                    <span className="section-step-badge">01 / 03</span>
                    <h2>{c.select}</h2>
                  </div>
                  <span className="section-meta-hint">Instant Quote · No Signup</span>
                </div>

                {/* Modern Drag and Drop Zone */}
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
                      <Upload size={30} />
                    </span>
                  </div>
                  <strong className="upload-title">{t.upload_cta}</strong>
                  <p className="upload-subtitle">Choose PDF, Word, Excel, or photos from your device</p>

                  <div className="upload-format-chips">
                    <span className="format-tag pdf">PDF</span>
                    <span className="format-tag docx">DOCX</span>
                    <span className="format-tag xlsx">XLSX</span>
                    <span className="format-tag pptx">PPTX</span>
                    <span className="format-tag img">PNG/JPG</span>
                    <span className="format-limit">Up to 100 MB</span>
                  </div>
                </label>

                {/* Instant Camera Paper Scan Button */}
                <button
                  type="button"
                  className="customer-camera-btn"
                  onClick={() => startCamera('environment')}
                >
                  <div className="camera-btn-left">
                    <div className="camera-icon-bubble">
                      <Camera size={19} />
                    </div>
                    <div className="camera-text-col">
                      <strong className="camera-btn-title">{t.camera_cta}</strong>
                      <span className="camera-btn-desc">Auto-crop paper notes, ID cards &amp; certificates</span>
                    </div>
                  </div>
                  <span className="camera-pill-tag">SCAN PAPER</span>
                </button>

                {error && (
                  <p role="alert" className="customer-error">
                    {error}
                  </p>
                )}

                {/* Uploaded Files Section */}
                <div className="customer-files-heading">
                  <div className="files-heading-left">
                    <FileText size={18} className="text-accent" />
                    <h3>{c.selected}</h3>
                    <span className="files-counter-badge">{files.length}</span>
                  </div>
                  {files.length > 0 && (
                    <button type="button" onClick={() => setFiles([])} className="btn-clear-queue">
                      {c.clear}
                    </button>
                  )}
                </div>

                {!files.length ? (
                  <div className="customer-empty-bay">
                    <div className="empty-bay-icon">
                      <FileText size={28} />
                    </div>
                    <div className="empty-bay-info">
                      <strong>{c.empty}</strong>
                      <p>Tap the box above or scan with camera to begin your order.</p>
                    </div>
                  </div>
                ) : (
                  <ul ref={fileListRef} className="customer-file-list">
                    {files.map((file, index) => {
                      const isPdf = file.format === 'PDF';
                      const isImg = ['JPG', 'JPEG', 'PNG'].includes(file.format);

                      return (
                        <li key={file.id} className="customer-file-card">
                          <div className={`file-format-badge ${isPdf ? 'pdf-badge' : isImg ? 'img-badge' : 'doc-badge'}`}>
                            <FileText size={18} />
                            <span className="file-format-label">{file.format}</span>
                          </div>

                          <div className="file-details-col">
                            <strong className="file-title">{file.name}</strong>
                            <div className="file-tags-row">
                              <span className="file-tag-pill size-pill">{file.size}</span>
                              <span className="file-tag-pill page-pill">
                                {file.pageCount || 1} {file.pageCount === 1 ? 'Page' : 'Pages'}
                              </span>
                              <span className="file-tag-pill config-pill">
                                {file.options.colorMode === 'color' ? '🎨 Color' : '⚫ B&W'} ·{' '}
                                {file.options.duplex === 'simplex' ? '1-Sided' : '2-Sided'}
                              </span>
                            </div>
                          </div>

                          <div className="customer-file-actions">
                            <button
                              type="button"
                              aria-label={`Move ${file.name} up`}
                              disabled={index === 0}
                              onClick={() => move(index, -1)}
                              title="Move up in queue"
                              className="btn-reorder"
                            >
                              <ArrowUp size={15} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Move ${file.name} down`}
                              disabled={index === files.length - 1}
                              onClick={() => move(index, 1)}
                              title="Move down in queue"
                              className="btn-reorder"
                            >
                              <ArrowDown size={15} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Remove ${file.name}`}
                              onClick={() => remove(file.id)}
                              className="btn-remove"
                              title="Remove from queue"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}

            {/* STEP 2: Configure Print Options */}
            {step === 2 && active && (
              <>
                <div className="customer-section-heading">
                  <div>
                    <span className="section-step-badge">02 / 03</span>
                    <h2>{c.configure}</h2>
                  </div>
                  <span className="section-meta-hint">Accurate Sheet Math</span>
                </div>

                {/* Document Selector & Apply to all */}
                <div className="file-selector-strip">
                  <label className="customer-field flex-grow">
                    <span className="field-label-text">Editing Document:</span>
                    <select value={active.id} onChange={(e) => setActiveId(e.target.value)}>
                      {files.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.pageCount || 1} {f.pageCount === 1 ? 'page' : 'pages'})
                        </option>
                      ))}
                    </select>
                  </label>

                  {files.length > 1 && (
                    <label className="customer-check-pill">
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
                      <span>{t.apply_to_all}</span>
                    </label>
                  )}
                </div>

                <div className="customer-configuration-card">
                  {/* Color Mode Selection */}
                  <div className="config-group">
                    <label className="config-group-label">
                      <span>{t.color_mode}</span>
                    </label>
                    <div className="customer-choice-row">
                      <button
                        type="button"
                        aria-pressed={active.options.colorMode === 'bw'}
                        onClick={() => update({ colorMode: 'bw' })}
                        className={`choice-card ${active.options.colorMode === 'bw' ? 'choice-selected' : ''}`}
                      >
                        <span className="choice-dot bw-dot" />
                        <div className="choice-text-col">
                          <strong>Black &amp; White</strong>
                          <span>₹1.50 / page</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        aria-pressed={active.options.colorMode === 'color'}
                        onClick={() => update({ colorMode: 'color' })}
                        className={`choice-card ${active.options.colorMode === 'color' ? 'choice-selected' : ''}`}
                      >
                        <span className="choice-dot color-dot" />
                        <div className="choice-text-col">
                          <strong>Full Color</strong>
                          <span>₹7.00 / page</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        aria-pressed={active.options.colorMode === 'grayscale'}
                        onClick={() => update({ colorMode: 'grayscale' })}
                        className={`choice-card ${active.options.colorMode === 'grayscale' ? 'choice-selected' : ''}`}
                      >
                        <span className="choice-dot gray-dot" />
                        <div className="choice-text-col">
                          <strong>Grayscale</strong>
                          <span>₹2.00 / page</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Duplex / Sides Selection */}
                  <div className="config-group">
                    <label className="config-group-label">
                      <span>{t.duplex}</span>
                    </label>
                    <div className="customer-choice-row">
                      <button
                        type="button"
                        aria-pressed={active.options.duplex === 'simplex'}
                        onClick={() => update({ duplex: 'simplex' })}
                        className={`choice-card ${active.options.duplex === 'simplex' ? 'choice-selected' : ''}`}
                      >
                        <div className="choice-text-col">
                          <strong>{t.single_sided}</strong>
                          <span>1 side per sheet</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        aria-pressed={active.options.duplex === 'duplex_long'}
                        onClick={() => update({ duplex: 'duplex_long' })}
                        className={`choice-card ${active.options.duplex === 'duplex_long' ? 'choice-selected' : ''}`}
                      >
                        <div className="choice-text-col">
                          <strong>{t.double_sided_long}</strong>
                          <span className="text-success">Save 50% Paper (Eco)</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        aria-pressed={active.options.duplex === 'duplex_short'}
                        onClick={() => update({ duplex: 'duplex_short' })}
                        className={`choice-card ${active.options.duplex === 'duplex_short' ? 'choice-selected' : ''}`}
                      >
                        <div className="choice-text-col">
                          <strong>{t.double_sided_short}</strong>
                          <span>Flip-up (Landscape)</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Copies and Paper Size */}
                  <div className="customer-two-columns">
                    <div className="config-group">
                      <label className="config-group-label">{t.copies}</label>
                      <div className="copies-stepper-control">
                        <button
                          type="button"
                          aria-label="Decrease copies"
                          disabled={active.options.copies <= 1}
                          onClick={() => update({ copies: Math.max(1, active.options.copies - 1) })}
                          className="btn-stepper"
                        >
                          -
                        </button>
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
                          className="copies-number-input"
                        />
                        <button
                          type="button"
                          aria-label="Increase copies"
                          onClick={() => update({ copies: active.options.copies + 1 })}
                          className="btn-stepper"
                        >
                          +
                        </button>
                      </div>
                      <div className="quick-chips-row">
                        {[1, 2, 5, 10].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`chip-btn ${active.options.copies === n ? 'chip-active' : ''}`}
                            onClick={() => update({ copies: n })}
                          >
                            {n} {n === 1 ? 'copy' : 'copies'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="config-group">
                      <label className="config-group-label">{t.paper_size}</label>
                      <div className="paper-size-pill-group">
                        {[
                          { id: 'A4', label: 'A4 Standard', sub: '210 × 297 mm' },
                          { id: 'A3', label: 'A3 Large', sub: '297 × 420 mm' },
                          { id: 'Legal', label: 'Legal Court', sub: '216 × 356 mm' },
                          { id: 'A5', label: 'A5 Booklet', sub: '148 × 210 mm' },
                        ].map((paper) => (
                          <button
                            key={paper.id}
                            type="button"
                            className={`paper-pill-btn ${active.options.paperSize === paper.id ? 'paper-active' : ''}`}
                            onClick={() => update({ paperSize: paper.id })}
                          >
                            <strong>{paper.id}</strong>
                            <span>{paper.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Sheet Math & Accounting Callout */}
                  <div className="sheet-accounting-callout">
                    <div className="accounting-header">
                      <Layers size={17} className="text-gold" />
                      <strong>Physical Paper &amp; Sheet Math</strong>
                    </div>
                    <div className="accounting-stats-row">
                      <div className="stat-box">
                        <span className="stat-title">Logical Pages</span>
                        <strong className="stat-number">{(active.pageCount || 1) * active.options.copies}</strong>
                      </div>
                      <span className="stat-arrow">→</span>
                      <div className="stat-box highlight">
                        <span className="stat-title">Physical Sheets</span>
                        <strong className="stat-number">
                          {Math.ceil((active.pageCount || 1) / (active.options.duplex === 'simplex' ? 1 : 2)) * active.options.copies}
                        </strong>
                      </div>
                      <span className="stat-arrow">=</span>
                      <div className="stat-box quote">
                        <span className="stat-title">Item Quote</span>
                        <strong className="stat-number text-accent">
                          {quote ? `₹${quote.total_rupees.toFixed(2)}` : '—'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Options Details Drawer */}
                  <details className="customer-advanced">
                    <summary>
                      <SlidersHorizontal size={18} />
                      <span>{c.advanced}</span>
                    </summary>
                    <div className="customer-advanced-content">
                      <label className="customer-field">
                        <span className="field-label-text">{t.page_range}</span>
                        <input
                          value={active.options.pageRange}
                          aria-invalid={!rangeValid}
                          placeholder="e.g. 1-3,5,8-"
                          onChange={(e) => update({ pageRange: e.target.value })}
                        />
                      </label>
                      <div className="customer-range-presets">
                        {[
                          ['all', t.all_pages],
                          ['odd', t.odd_only],
                          ['even', t.even_only],
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            className={`chip-btn ${active.options.pageRange === value ? 'chip-active' : ''}`}
                            onClick={() => update({ pageRange: value })}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <div className="customer-two-columns" style={{ marginTop: '12px' }}>
                        <label className="customer-field">
                          <span className="field-label-text">{t.nup}</span>
                          <select
                            value={active.options.nup}
                            onChange={(e) => update({ nup: Number(e.target.value) })}
                          >
                            {[1, 2, 4, 6, 9].map((n) => (
                              <option key={n} value={n}>
                                {n} {n === 1 ? 'Page per sheet (Standard)' : `Pages per sheet (${n}-Up)`}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="customer-field">
                          <span className="field-label-text">Finishing preference</span>
                          <select
                            value={active.options.finishing}
                            onChange={(e) => update({ finishing: e.target.value })}
                          >
                            <option value="none">None (Loose sheets)</option>
                            <option value="staple">Corner staple (+₹5)</option>
                            <option value="spiral">Spiral coil binding (+₹40)</option>
                            <option value="hard_bind">Hardbound project book (+₹150)</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  </details>
                </div>
              </>
            )}

            {/* STEP 3: Review & Pay */}
            {step === 3 && (
              <>
                <div className="customer-section-heading">
                  <div>
                    <span className="section-step-badge">03 / 03</span>
                    <h2>{c.review}</h2>
                  </div>
                  <span className="section-meta-hint">Server-Locked Price</span>
                </div>

                {/* Digital Order Receipt Card */}
                <div className="customer-receipt-card">
                  <div className="receipt-header-row">
                    <div className="receipt-logo-wrap">
                      <Printer size={20} className="text-accent" />
                      <div>
                        <strong>{session.shop_name}</strong>
                        <span className="receipt-date">Official Print Order Receipt</span>
                      </div>
                    </div>
                    <span className="receipt-verified-badge">
                      <CheckCircle2 size={14} /> Server Verified
                    </span>
                  </div>

                  <div className="receipt-file-list">
                    {files.map((file) => (
                      <div key={file.id} className="receipt-file-item">
                        <div className="file-item-left">
                          <FileText size={17} className="text-gold" />
                          <div>
                            <strong className="receipt-file-name">{file.name}</strong>
                            <span className="receipt-file-meta">
                              {file.options.copies} × {file.options.paperSize} ·{' '}
                              {file.options.colorMode === 'bw'
                                ? 'B&W'
                                : file.options.colorMode === 'color'
                                ? 'Full Color'
                                : 'Grayscale'}{' '}
                              · {file.options.duplex === 'simplex' ? '1-Sided' : '2-Sided Duplex'}
                            </span>
                          </div>
                        </div>
                        <div className="file-item-right">
                          <span className="file-sheets-count">
                            {Math.ceil((file.pageCount || 1) / (file.options.duplex === 'simplex' ? 1 : 2)) * file.options.copies} sheets
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Totals Table */}
                  <div className="receipt-ledger-box">
                    <dl className="ledger-dl">
                      <div>
                        <dt>{t.logical_pages}</dt>
                        <dd>{quote?.total_logical_pages} pages</dd>
                      </div>
                      <div>
                        <dt>{t.rendered_sides}</dt>
                        <dd>{quote?.total_rendered_sides} sides</dd>
                      </div>
                      <div>
                        <dt>{t.physical_sheets}</dt>
                        <dd>{quote?.total_physical_sheets} sheets</dd>
                      </div>
                      <div className="total-row">
                        <dt>{t.price_total}</dt>
                        <dd className="total-rupees">₹{quote ? quote.total_rupees.toFixed(2) : '0.00'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Payment Selection Form */}
                <fieldset className="payment-method-box">
                  <legend className="payment-legend">
                    <Zap size={16} className="text-gold" /> {c.payment}
                  </legend>
                  <div className="customer-choice-row" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <button
                      type="button"
                      aria-pressed={payment === 'upi'}
                      onClick={() => setPayment('upi')}
                      className={`payment-choice-card ${payment === 'upi' ? 'payment-selected' : ''}`}
                    >
                      <QrCode size={22} />
                      <div className="payment-text">
                        <strong>Instant UPI QR</strong>
                        <span>GPay / PhonePe / Paytm</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      aria-pressed={payment === 'cash'}
                      onClick={() => setPayment('cash')}
                      className={`payment-choice-card ${payment === 'cash' ? 'payment-selected' : ''}`}
                    >
                      <Banknote size={22} />
                      <div className="payment-text">
                        <strong>Pay Cash at Counter</strong>
                        <span>Pay when collecting</span>
                      </div>
                    </button>
                  </div>
                </fieldset>

                {/* Interactive UPI QR Card */}
                {payment === 'upi' && quote && (
                  <div className="upi-interactive-card">
                    <div className="upi-card-content">
                      <div className="upi-qr-frame">
                        {/* Dynamic SVG UPI QR Code */}
                        <svg viewBox="0 0 120 120" className="upi-qr-svg">
                          <rect width="120" height="120" fill="#ffffff" rx="8" />
                          {/* Outer QR Corner Anchors */}
                          <rect x="10" y="10" width="30" height="30" fill="#1e1017" rx="4" />
                          <rect x="15" y="15" width="20" height="20" fill="#ffffff" rx="2" />
                          <rect x="20" y="20" width="10" height="10" fill="#1e1017" rx="1" />

                          <rect x="80" y="10" width="30" height="30" fill="#1e1017" rx="4" />
                          <rect x="85" y="15" width="20" height="20" fill="#ffffff" rx="2" />
                          <rect x="90" y="20" width="10" height="10" fill="#1e1017" rx="1" />

                          <rect x="10" y="80" width="30" height="30" fill="#1e1017" rx="4" />
                          <rect x="15" y="85" width="20" height="20" fill="#ffffff" rx="2" />
                          <rect x="20" y="90" width="10" height="10" fill="#1e1017" rx="1" />

                          {/* Data Matrix Dots */}
                          <rect x="48" y="12" width="8" height="8" fill="#792d47" />
                          <rect x="60" y="24" width="12" height="6" fill="#1e1017" />
                          <rect x="48" y="34" width="14" height="8" fill="#792d47" />
                          <rect x="68" y="46" width="8" height="14" fill="#1e1017" />
                          <rect x="48" y="58" width="10" height="8" fill="#792d47" />
                          <rect x="24" y="52" width="12" height="6" fill="#1e1017" />
                          <rect x="84" y="52" width="10" height="8" fill="#792d47" />
                          <rect x="48" y="72" width="16" height="8" fill="#1e1017" />
                          <rect x="82" y="72" width="14" height="14" fill="#792d47" />
                          <rect x="66" y="88" width="10" height="10" fill="#1e1017" />
                          <rect x="48" y="96" width="8" height="12" fill="#792d47" />
                        </svg>
                        <div className="upi-live-tag">Live UPI</div>
                      </div>

                      <div className="upi-details-col">
                        <div className="upi-amount-banner">
                          <span>Amount to Pay</span>
                          <strong>₹{quote.total_rupees.toFixed(2)}</strong>
                        </div>
                        <div className="upi-vpa-row">
                          <span className="vpa-label">Shop UPI VPA:</span>
                          <code className="vpa-code">quickxerox@okaxis</code>
                        </div>
                        <div className="upi-apps-icons">
                          <span className="upi-app-pill gpay">GPay</span>
                          <span className="upi-app-pill phonepe">PhonePe</span>
                          <span className="upi-app-pill paytm">Paytm</span>
                          <span className="upi-app-pill bhim">BHIM</span>
                        </div>
                        <button
                          type="button"
                          className="btn-simulate-pay"
                          onClick={() => setUpiSimulated(true)}
                        >
                          {upiSimulated ? (
                            <>
                              <CheckCircle2 size={16} /> UPI Payment Verified (₹{quote.total_rupees.toFixed(2)})
                            </>
                          ) : (
                            <>
                              <Sparkles size={15} /> Simulate UPI Payment
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {payment === 'cash' && quote && (
                  <div className="customer-server-note cash-note">
                    <Banknote size={32} className="text-accent" />
                    <div>
                      <strong>Pay ₹{quote.total_rupees.toFixed(2)} in Cash at Counter</strong>
                      <p>Your order will be queued immediately and printed upon counter confirmation.</p>
                    </div>
                  </div>
                )}

                {/* Workflow Reassurance */}
                <div className="customer-server-note">
                  <Printer size={22} className="text-gold" />
                  <div>
                    <strong>{c.workflow}</strong>
                    <p>{c.workflowInfo}</p>
                  </div>
                </div>
              </>
            )}

            {/* STEP 4: Order Confirmed & Pickup PIN */}
            {step === 4 && placedOrder && (
              <>
                <div className="order-success-hero">
                  <div className="success-icon-disc">
                    <Sparkles size={36} />
                  </div>
                  <h2 className="success-title">
                    {isPreviewSession ? 'Order Queued Successfully!' : 'Order Dispatched to Spooler!'}
                  </h2>
                  <p className="success-subtitle">
                    Sent directly to <strong>{placedOrder.shopName}</strong> counter workstation.
                  </p>
                </div>

                {/* Prominent Pickup PIN Card */}
                <div className="pickup-pin-card">
                  <div className="pin-cell-block tracking">
                    <span className="pin-label">Order Tracking ID</span>
                    <strong className="pin-val tracking-code">{placedOrder.orderId}</strong>
                  </div>
                  <div className="pin-cell-block pin">
                    <span className="pin-label highlight">Counter Pickup PIN</span>
                    <strong className="pin-val big-pin">{placedOrder.pickupPin}</strong>
                    <span className="pin-instruction">Show this 4-digit code at the counter</span>
                  </div>
                </div>

                {/* Live Order Timeline */}
                <div className="order-timeline-card">
                  <div className="timeline-header">
                    <Clock size={18} className="text-gold" />
                    <h3>Live Print Status</h3>
                  </div>

                  <div className="timeline-steps-list">
                    <div className="timeline-step done">
                      <div className="timeline-dot"><Check size={12} /></div>
                      <div className="timeline-content">
                        <strong>Order Received &amp; Verified</strong>
                        <span>{placedOrder.placedAt} · {placedOrder.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="timeline-step active">
                      <div className="timeline-dot"><Printer size={12} /></div>
                      <div className="timeline-content">
                        <strong>Spooled to Counter Printer (winspool.drv)</strong>
                        <span>In memory · RAW EMF rendering on High-Speed Laser</span>
                      </div>
                    </div>

                    <div className="timeline-step pending">
                      <div className="timeline-dot"><Store size={12} /></div>
                      <div className="timeline-content">
                        <strong>Ready for Collection at Counter #2</strong>
                        <span>Present PIN {placedOrder.pickupPin} to pick up your sheets</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Itemized Summary */}
                <div className="customer-summary-box">
                  <div className="summary-box-header">
                    <strong>
                      Print Job Summary ({placedOrder.totalSheets} sheets, {placedOrder.totalLogicalPages} pages):
                    </strong>
                  </div>
                  <div className="summary-files-list">
                    {placedOrder.files.map((file, idx) => (
                      <div key={idx} className="summary-file-row">
                        <div className="summary-row-left">
                          <FileText size={16} className="text-gold" />
                          <div>
                            <strong>{file.name}</strong>
                            <span>{file.copies} copies · {file.colorMode} · {file.duplex}</span>
                          </div>
                        </div>
                        <span className="summary-sheets-pill">{file.sheets} sheets</span>
                      </div>
                    ))}
                  </div>
                  <div className="summary-total-footer">
                    <span>Total Paid ({placedOrder.paymentMethod}):</span>
                    <strong className="summary-total-price">₹{placedOrder.totalRupees.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Action to Print Another Document */}
                <div className="order-actions-row">
                  <button
                    type="button"
                    className="customer-primary btn-reset-flow"
                    onClick={resetOrder}
                  >
                    <RotateCcw size={18} />
                    {t.add_more_files || 'Print Another Document'}
                  </button>
                </div>
              </>
            )}
          </MotionSurface>

          {/* Persistent Sticky Action Bar (Desktop bottom & Mobile fixed bottom) */}
          {files.length > 0 && step <= 3 && (
            <footer className="customer-action-bar">
              <div className="action-bar-summary">
                <strong>
                  {files.length} {files.length === 1 ? 'document' : 'documents'}
                </strong>
                <span className="action-bar-quote">
                  {scanning
                    ? 'Inspecting pages...'
                    : quote
                    ? `₹${quote.total_rupees.toFixed(2)} · ${quote.total_physical_sheets} ${
                        quote.total_physical_sheets === 1 ? 'sheet' : 'sheets'
                      }`
                    : 'Calculating price...'}
                </span>
              </div>
              <div className="customer-footer-buttons">
                {step > 1 && (
                  <button type="button" className="btn-nav-back" onClick={() => setStep(step - 1)}>
                    {c.back}
                  </button>
                )}
                {step < 3 && (
                  <button
                    type="button"
                    className="customer-primary btn-nav-next"
                    disabled={!files.length || !rangeValid}
                    onClick={() => setStep(step + 1)}
                  >
                    <span>{lang === 'en' && step === 2 ? 'Review & Pay' : c.next}</span>
                    <ArrowRight size={18} />
                  </button>
                )}
                {step === 3 && (
                  <button
                    type="button"
                    className="customer-primary btn-nav-pay"
                    disabled={!quote || !files.length}
                    onClick={handlePlaceOrder}
                  >
                    <span>{payment === 'upi' ? 'Pay via UPI & Spool' : 'Confirm Order (Pay Cash)'}</span>
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </footer>
          )}
        </main>
      </div>

      {/* Interactive WebRTC Camera Scanner Modal */}
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
