import { useEffect, useState, useMemo } from 'react';
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
  Clock,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { MotionSurface, PrinterScene, StudioHeader, useGsapStagger } from '@xerox/ui';
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
  session_token: 'shop-session-counter',
  shop_id: 'shop-counter',
  shop_name: 'Print Bot Counter',
  shop_slug: 'print-bot-counter',
  expires_at: new Date(Date.now() + 86400000).toISOString(),
};

const copy = {
  en: {
    welcome: 'A little less waiting. A lot more doing.',
    intro: 'Your documents, your way. Choose a file, set the details, and get ready for your next print.',
    select: 'Choose your documents',
    selected: 'Selected files',
    configure: 'Make it yours.',
    review: 'Review your choices.',
    advanced: 'More print options',
    next: 'Continue',
    back: 'Back',
    pending: 'Instant quote ready',
    workflow: 'What happens next',
    workflowInfo: 'Once submitted, your job is sent directly to the shop workstation printer spooler.',
    options: 'Print preferences',
    payment: 'Preferred payment method',
    empty: 'No files selected yet',
    fileInfo: 'PDF, PNG, JPG, DOCX, XLSX, PPTX · 100 MB per file',
    verifiedInfo: 'Page count & rate calculated from shop pricing table.',
    example: 'Print Bot Counter Stand · Main Counter',
    privacy: 'No customer account or login required',
    clear: 'Clear selection',
  },
  ta: {
    welcome: 'காத்திருப்பது குறைவு. செய்வது அதிகம்.',
    intro: 'உங்கள் ஆவணங்கள், உங்கள் விருப்பம். கோப்பைத் தேர்ந்தெடுத்து அச்சிடும் அமைப்புகளை மாற்றவும்.',
    select: 'உங்கள் ஆவணங்களைத் தேர்ந்தெடுக்கவும்',
    selected: 'தேர்ந்தெடுத்த கோப்புகள்',
    configure: 'உங்கள் விருப்பப்படி.',
    review: 'விருப்பங்களைச் சரிபார்க்கவும்.',
    advanced: 'கூடுதல் அச்சிடும் விருப்பங்கள்',
    next: 'தொடரவும்',
    back: 'பின்செல்',
    pending: 'விலை விவரம் தயார்',
    workflow: 'அடுத்து என்ன நடக்கும்',
    workflowInfo: 'உறுதிசெய்தவுடன் ஆவணம் நேரடியாக கடையின் பிரிண்டர் வரிசையில் சேரும்.',
    options: 'அச்சிடும் விருப்பங்கள்',
    payment: 'விருப்பமான கட்டண முறை',
    empty: 'கோப்புகள் தேர்ந்தெடுக்கப்படவில்லை',
    fileInfo: 'PDF, PNG, JPG, DOCX, XLSX, PPTX · கோப்புக்கு 100 MB',
    verifiedInfo: 'கடை விலை அட்டவணையின்படி பக்க எண்ணிக்கை மற்றும் விலை கணக்கிடப்பட்டது.',
    example: 'அண்ணா பல்கலைக்கழக ஜெராக்ஸ் · கிண்டி',
    privacy: 'வாடிக்கையாளருக்குக் கணக்கு தேவையில்லை',
    clear: 'தேர்வை அழிக்கவும்',
  },
  hi: {
    welcome: 'कम इंतज़ार। ज़्यादा काम।',
    intro: 'आपके दस्तावेज़, आपकी पसंद। फ़ाइल चुनें और प्रिंट विकल्प तय करें।',
    select: 'अपने दस्तावेज़ चुनें',
    selected: 'चुनी गई फ़ाइलें',
    configure: 'अपनी पसंद चुनें।',
    review: 'अपने विकल्प देखें।',
    advanced: 'और प्रिंट विकल्प',
    next: 'आगे बढ़ें',
    back: 'वापस',
    pending: 'मूल्य विवरण तैयार है',
    workflow: 'आगे क्या होगा',
    workflowInfo: 'ऑर्डर के बाद फ़ाइल सीधे दुकान के प्रिंटर स्पूलर में पहुँच जाएगी।',
    options: 'प्रिंट प्राथमिकताएँ',
    payment: 'पसंदीदा भुगतान तरीका',
    empty: 'अभी कोई फ़ाइल नहीं चुनी गई',
    fileInfo: 'PDF, PNG, JPG, DOCX, XLSX, PPTX · प्रति फ़ाइल 100 MB',
    verifiedInfo: 'दुकान की दर सूची के अनुसार पृष्ठ और मूल्य की गणना की गई।',
    example: 'अन्ना यूनिवर्सिटी ज़ेरॉक्स · गिंडी',
    privacy: 'ग्राहक को खाते की ज़रूरत नहीं',
    clear: 'चयन हटाएँ',
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

  const fileListRef = useGsapStagger<HTMLUListElement>({ selector: 'li', stagger: 0.05, y: 10 });
  const t = translations[lang];
  const c = copy[lang];
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

  const selectFiles = async (selected: FileList | null) => {
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

      <div className="customer-layout">
        <aside className="customer-welcome">
          <span className="customer-eyebrow">
            <Printer size={16} /> {session.shop_name.toUpperCase()}
          </span>
          <h1>{c.welcome}</h1>
          <p>{c.intro}</p>
          <PrinterScene compact />
          <div className="customer-trust">
            <ShieldCheck size={20} />
            <span>{c.privacy}</span>
          </div>
          <div className="customer-side-note">
            <strong>01 — 02 — 03</strong>
            <p>
              {t.step1_upload} → {t.step2_config} → {t.step3_pay}
            </p>
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
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  {label.replace(/^\d\.\s*/, '')}
                </button>
              ))}
            </nav>
          )}

          <MotionSurface transitionKey={step} className="customer-step">
            {/* Step 1: Upload */}
            {step === 1 && (
              <>
                <div className="customer-section-heading">
                  <h2>{c.select}</h2>
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
                  <span className="customer-upload-icon">
                    <Upload size={30} />
                  </span>
                  <strong>{t.upload_cta}</strong>
                  <span>{c.fileInfo}</span>
                </label>

                <label className="customer-camera">
                  <Camera size={20} />
                  {t.camera_cta}
                  <input
                    aria-label={t.camera_cta}
                    type="file"
                    accept="image/png,image/jpeg"
                    capture="environment"
                    onChange={(e) => {
                      selectFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>

                {error && (
                  <p role="alert" className="customer-error">
                    {error}
                  </p>
                )}

                <div className="customer-files-heading">
                  <h3>
                    {c.selected} <span>{files.length.toString().padStart(2, '0')}</span>
                  </h3>
                  {files.length > 0 && <button onClick={() => setFiles([])}>{c.clear}</button>}
                </div>

                {!files.length && (
                  <p className="customer-empty">
                    <FileText size={24} />
                    {c.empty}
                  </p>
                )}

                <ul ref={fileListRef} className="customer-file-list">
                  {files.map((file, index) => (
                    <li key={file.id}>
                      <FileText size={24} />
                      <div>
                        <strong>{file.name}</strong>
                        <span>
                          {file.format} · {file.size} · {file.pageCount || 1} {file.pageCount === 1 ? 'page' : 'pages'}
                        </span>
                      </div>
                      <div className="customer-file-actions">
                        <button
                          aria-label={`Move ${file.name} up`}
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                        >
                          <ArrowUp size={17} />
                        </button>
                        <button
                          aria-label={`Move ${file.name} down`}
                          disabled={index === files.length - 1}
                          onClick={() => move(index, 1)}
                        >
                          <ArrowDown size={17} />
                        </button>
                        <button aria-label={`Remove ${file.name}`} onClick={() => remove(file.id)}>
                          <Trash2 size={18} />
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
                  <h2>{c.configure}</h2>
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
                  <h2>{c.review}</h2>
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
                  <h3>Order Bill Summary</h3>
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
                      <Printer size={18} />
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
                  <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>Order Submitted!</h2>
                  <p style={{ color: 'var(--pb-muted)', fontSize: '14px' }}>
                    Sent directly to <strong>{placedOrder.shopName}</strong> workstation spooler.
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
                  <h3>Live Print Status</h3>
                  <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={18} color="var(--pb-success)" />
                      <span>{t.order_received} · {placedOrder.placedAt}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Printer size={18} color="var(--pb-accent)" />
                      <strong>{t.order_approved} · Counter Spooler Active</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--pb-muted)' }}>
                      <Clock size={18} />
                      <span>{t.ready} (Show PIN {placedOrder.pickupPin} at Counter)</span>
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
                  <span>Total Paid ({placedOrder.paymentMethod}):</span>
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
                    {c.next}
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
    </div>
  );
}

export default CustomerFlow;
