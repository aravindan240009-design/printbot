import { useEffect, useState } from 'react';
import { Upload, Camera, FileText, Trash2, ArrowUp, ArrowDown, ArrowRight, ShieldCheck, SlidersHorizontal, LockKeyhole, Printer } from 'lucide-react';
import { MotionSurface, PaperScene, PrinterScene, StudioHeader, useGsapStagger } from '@xerox/ui';
import { translations, Language } from './locales';
import { openShopSession, quoteFiles, scanFile, ServerQuote, ShopSession } from './api';


interface Options { copies: number; colorMode: 'bw' | 'color' | 'grayscale'; finishing: string; paperSize: string; duplex: string; pageRange: string; nup: number; photoPreset: string }
interface DocumentSelection { id: string; name: string; size: string; format: string; options: Options; source: File; assetId?: string; pageCount?: number }
const defaults: Options = { copies: 1, finishing: 'none', colorMode: 'bw', paperSize: 'A4', duplex: 'simplex', pageRange: 'all', nup: 1, photoPreset: 'standard' };
const copy = {
 en: { welcome: 'A little less waiting. A lot more doing.', intro: 'Your documents, your way. Choose a file, set the details, and get ready for your next print.', preview: 'Interactive preview', notice: 'Files stay in this tab. Upload, server preview, pricing, payment and printing are not connected.', select: 'Choose your documents', selected: 'Selected files', configure: 'Make it yours.', review: 'Review your choices.', advanced: 'More print options', next: 'Continue', back: 'Back', pending: 'Awaiting a server quote', unavailable: 'Checkout unavailable', pendingInfo: 'A connected shop session must validate your files and options, return a preview and lock a price before checkout.', workflow: 'What happens next', workflowInfo: 'After a verified order, status updates will appear here. No order has been created.', options: 'Print preferences', payment: 'Preferred payment method', empty: 'No files selected yet', fileInfo: 'PDF, PNG, JPG, DOCX, XLSX, PPTX · 100 MB per file', unknown: 'Page count needs server validation', rangeHelp: 'Use all, odd, even or a range such as 1-3,5,8-. The server must validate page bounds.', example: 'Example shop · Anna Xerox, Guindy', privacy: 'No account needed for the customer flow', clear: 'Clear selection', estimate: 'Price and sheet count pending', illustration: 'Illustration only. This is not a preview of your file.' },
 ta: { welcome: 'காத்திருப்பது குறைவு. செய்வது அதிகம்.', intro: 'உங்கள் ஆவணங்கள், உங்கள் விருப்பம். கோப்பைத் தேர்ந்தெடுத்து அச்சிடும் அமைப்புகளை மாற்றவும்.', preview: 'ஊடாடும் முன்னோட்டம்', notice: 'கோப்புகள் இந்தத் தாவலில் மட்டுமே உள்ளன. பதிவேற்றம், விலை, கட்டணம் மற்றும் அச்சிடுதல் இணைக்கப்படவில்லை.', select: 'உங்கள் ஆவணங்களைத் தேர்ந்தெடுக்கவும்', selected: 'தேர்ந்தெடுத்த கோப்புகள்', configure: 'உங்கள் விருப்பப்படி.', review: 'விருப்பங்களைச் சரிபார்க்கவும்.', advanced: 'கூடுதல் அச்சிடும் விருப்பங்கள்', next: 'தொடரவும்', back: 'பின்செல்', pending: 'சேவையக விலை நிலுவையில்', unavailable: 'கட்டணம் இப்போது கிடைக்கவில்லை', pendingInfo: 'இணைக்கப்பட்ட கடை அமர்வு கோப்புகளைச் சரிபார்த்து முன்னோட்டம் மற்றும் உறுதியான விலையை வழங்க வேண்டும்.', workflow: 'அடுத்து என்ன நடக்கும்', workflowInfo: 'உறுதிசெய்த ஆர்டருக்குப் பிறகு நிலை இங்கே தெரியும். ஆர்டர் உருவாக்கப்படவில்லை.', options: 'அச்சிடும் விருப்பங்கள்', payment: 'விருப்பமான கட்டண முறை', empty: 'கோப்புகள் தேர்ந்தெடுக்கப்படவில்லை', fileInfo: 'PDF, PNG, JPG, DOCX, XLSX, PPTX · கோப்புக்கு 100 MB', unknown: 'பக்க எண்ணிக்கைக்கு சேவையகச் சரிபார்ப்பு தேவை', rangeHelp: 'all, odd, even அல்லது 1-3,5,8- போன்ற வரம்பைப் பயன்படுத்தவும். சேவையகம் சரிபார்க்க வேண்டும்.', example: 'மாதிரிக் கடை · அண்ணா ஜெராக்ஸ், கிண்டி', privacy: 'வாடிக்கையாளருக்குக் கணக்கு தேவையில்லை', clear: 'தேர்வை அழிக்கவும்', estimate: 'விலையும் தாள் எண்ணிக்கையும் நிலுவையில்', illustration: 'விளக்கப்படம் மட்டுமே. உங்கள் கோப்பின் முன்னோட்டம் அல்ல.' },
 hi: { welcome: 'कम इंतज़ार। ज़्यादा काम।', intro: 'आपके दस्तावेज़, आपकी पसंद। फ़ाइल चुनें और प्रिंट विकल्प तय करें।', preview: 'इंटरैक्टिव पूर्वावलोकन', notice: 'फ़ाइलें केवल इस टैब में हैं। अपलोड, कीमत, भुगतान और प्रिंटिंग जुड़े नहीं हैं।', select: 'अपने दस्तावेज़ चुनें', selected: 'चुनी गई फ़ाइलें', configure: 'अपनी पसंद चुनें।', review: 'अपने विकल्प देखें।', advanced: 'और प्रिंट विकल्प', next: 'आगे बढ़ें', back: 'वापस', pending: 'सर्वर की कीमत का इंतज़ार', unavailable: 'चेकआउट उपलब्ध नहीं', pendingInfo: 'जुड़े हुए दुकान सत्र को फ़ाइलें जाँचकर पूर्वावलोकन और तय कीमत देनी होगी।', workflow: 'आगे क्या होगा', workflowInfo: 'सत्यापित ऑर्डर के बाद स्थिति यहाँ दिखेगी। कोई ऑर्डर नहीं बना है।', options: 'प्रिंट प्राथमिकताएँ', payment: 'पसंदीदा भुगतान तरीका', empty: 'अभी कोई फ़ाइल नहीं चुनी गई', fileInfo: 'PDF, PNG, JPG, DOCX, XLSX, PPTX · प्रति फ़ाइल 100 MB', unknown: 'पृष्ठों की संख्या सर्वर जाँच के बाद मिलेगी', rangeHelp: 'all, odd, even या 1-3,5,8- जैसी रेंज चुनें। सर्वर पृष्ठ सीमा जाँचेगा।', example: 'उदाहरण दुकान · अन्ना ज़ेरॉक्स, गिंडी', privacy: 'ग्राहक को खाते की ज़रूरत नहीं', clear: 'चयन हटाएँ', estimate: 'कीमत और शीट संख्या बाकी हैं', illustration: 'केवल चित्रण। यह आपकी फ़ाइल का पूर्वावलोकन नहीं है।' },
};

function CustomerFlow() {
 const [lang, setLang] = useState<Language>('en');
 const [step, setStep] = useState(1);
 const [files, setFiles] = useState<DocumentSelection[]>([]);
 const [activeId, setActiveId] = useState('');
 const [applyAll, setApplyAll] = useState(true);
 const [payment, setPayment] = useState('upi');
 const [error, setError] = useState('');
 const [session, setSession] = useState<ShopSession | null>(null);
 const [quote, setQuote] = useState<ServerQuote | null>(null);
 const [scanning, setScanning] = useState(false);
 const fileListRef = useGsapStagger<HTMLUListElement>({ selector: 'li', stagger: 0.05, y: 10 });
 const t = translations[lang]; const c = copy[lang];
 const active = files.find(f => f.id === activeId) || files[0];
 useEffect(() => { document.documentElement.lang = lang; }, [lang]);
 useEffect(() => {
  const qrCode = new URLSearchParams(window.location.search).get('qr');
  if (!qrCode) return;
  openShopSession(qrCode).then(setSession).catch(e => setError(e instanceof Error ? e.message : 'Unable to open this shop session.'));
 }, []);
 const selectFiles = async (selected: FileList | null) => {
  if (!selected) return;
  const accepted: DocumentSelection[] = []; const rejected: string[] = [];
  Array.from(selected).forEach(file => {
   if (!/\.(pdf|png|jpe?g|docx|xlsx|pptx)$/i.test(file.name) || file.size > 100 * 1024 * 1024 || file.size === 0) { rejected.push(file.name); return; }
   accepted.push({ id: crypto.randomUUID(), name: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)} MB`, format: file.name.split('.').pop()!.toUpperCase(), options: { ...(applyAll && active ? active.options : defaults) }, source: file });
  });
  setFiles(previous => [...previous, ...accepted]);
  setQuote(null);
  if (rejected.length) setError(`Unsupported, empty or over 100 MB: ${rejected.join(', ')}`);
  if (accepted.length && session) {
   setScanning(true);
   try {
    const scanned = await Promise.all(accepted.map(file => scanFile(file.source, session.session_token)));
    setFiles(previous => previous.map(file => { const index = accepted.findIndex(candidate => candidate.id === file.id); const result = index >= 0 ? scanned[index] : undefined; return result ? { ...file, assetId: result.asset_id, pageCount: result.page_count } : file; }));
   } catch (e) { setError(e instanceof Error ? e.message : 'The server could not inspect the files.'); }
   finally { setScanning(false); }
  } else if (accepted.length && !session) {
   setError('Scan the shop QR code to connect this order to a shop before uploading.');
  }
 };
 const update = (patch: Partial<Options>) => { setQuote(null); setFiles(previous => previous.map(file => applyAll || file.id === active?.id ? { ...file, options: { ...file.options, ...patch } } : file)); };
 const remove = (id: string) => { setFiles(previous => previous.filter(f => f.id !== id)); if (files.length === 1) setStep(1); };
 const move = (index: number, direction: number) => setFiles(previous => { const result = [...previous]; [result[index], result[index + direction]] = [result[index + direction], result[index]]; return result; });
 const rangeValid = files.every(file => /^(all|odd|even|[1-9]\d*(?:-(?:[1-9]\d*)?)?(?:\s*,\s*[1-9]\d*(?:-(?:[1-9]\d*)?)?)*)$/.test(file.options.pageRange));
 const createQuote = async () => {
  if (!session || !files.length || files.some(file => !file.assetId || !file.pageCount)) return;
  setError(''); setScanning(true);
  try { setQuote(await quoteFiles(files.map(file => ({ fileId: file.assetId!, fileName: file.name, pageCount: file.pageCount!, options: { copies: file.options.copies, color_mode: file.options.colorMode, paper_size: file.options.paperSize, duplex_mode: file.options.duplex, binding: file.options.finishing, page_range: file.options.pageRange, pages_per_sheet: file.options.nup, photo_layout: file.options.photoPreset } })), session.session_token)); }
  catch (e) { setError(e instanceof Error ? e.message : 'The server could not calculate a quote.'); }
  finally { setScanning(false); }
 };
 return <div className="customer-app">
  <StudioHeader title={t.title} subtitle={c.example}>
   <label className="customer-language"><span className="sr-only">Language</span><select value={lang} onChange={e => setLang(e.target.value as Language)}><option value="en">English</option><option value="ta">தமிழ்</option><option value="hi">हिन्दी</option></select></label>
  </StudioHeader>
  <div className="customer-layout">
   <aside className="customer-welcome"><span className="customer-eyebrow"><Printer size={16}/> YOUR NEIGHBOURHOOD PRINT STUDIO</span><h1>{c.welcome}</h1><p>{c.intro}</p><PrinterScene compact /><div className="customer-trust"><ShieldCheck size={20}/><span>{c.privacy}</span></div><div className="customer-side-note"><strong>01 — 02 — 03</strong><p>{t.step1_upload} → {t.step2_config} → {t.step3_pay}</p></div></aside>
   <main className="customer-main" id="main">
    
    <nav className="customer-steps" aria-label="Order steps">{[t.step1_upload, t.step2_config, t.step3_pay].map((label, i) => <button key={i} disabled={i > 0 && (!files.length || (i === 2 && !rangeValid))} aria-current={step === i + 1 ? 'step' : undefined} onClick={() => setStep(i + 1)}><span>{String(i + 1).padStart(2, '0')}</span>{label.replace(/^\d\.\s*/, '')}</button>)}</nav>
    <MotionSurface transitionKey={step} className="customer-step">
     <div className="customer-section-heading"><h2>{step === 1 ? c.select : step === 2 ? c.configure : c.review}</h2></div>
     {step === 1 && <>
      <label className="customer-upload"><input aria-label={t.upload_cta} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.pptx" onChange={e => { selectFiles(e.target.files); e.target.value = ''; }}/><span className="customer-upload-icon"><Upload size={30}/></span><strong>{t.upload_cta}</strong><span>{c.fileInfo}</span></label>
      <label className="customer-camera"><Camera size={20}/>{t.camera_cta}<input aria-label={t.camera_cta} type="file" accept="image/png,image/jpeg" capture="environment" onChange={e => { selectFiles(e.target.files); e.target.value = ''; }}/></label>
      {error && <p role="alert" className="customer-error">{error}</p>}
      <div className="customer-files-heading"><h3>{c.selected} <span>{files.length.toString().padStart(2, '0')}</span></h3>{files.length > 0 && <button onClick={() => setFiles([])}>{c.clear}</button>}</div>
      {!files.length && <p className="customer-empty"><FileText size={24}/>{c.empty}</p>}
      <ul ref={fileListRef} className="customer-file-list">{files.map((file, index) => <li key={file.id}><FileText size={24}/><div><strong>{file.name}</strong><span>{file.format} · {file.size}</span></div><div className="customer-file-actions"><button aria-label={`Move ${file.name} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={17}/></button><button aria-label={`Move ${file.name} down`} disabled={index === files.length - 1} onClick={() => move(index, 1)}><ArrowDown size={17}/></button><button aria-label={`Remove ${file.name}`} onClick={() => remove(file.id)}><Trash2 size={18}/></button></div></li>)}</ul>
     </>}
     {step === 2 && active && <>
      <label className="customer-field">{c.selected}<select value={active.id} onChange={e => setActiveId(e.target.value)}>{files.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
      {files.length > 1 && <label className="customer-check"><input type="checkbox" checked={applyAll} onChange={e => { const checked = e.target.checked; setApplyAll(checked); if (checked) setFiles(previous => previous.map(file => ({ ...file, options: { ...active.options } }))); }}/>{t.apply_to_all}</label>}
      <div className="customer-configuration">
       <fieldset><legend>{t.color_mode}</legend><div className="customer-choice-row">{(['bw', 'color', 'grayscale'] as const).map(mode => <button aria-pressed={active.options.colorMode === mode} key={mode} onClick={() => update({ colorMode: mode })}><span className={`customer-color-dot ${mode}`}/>{mode === 'grayscale' ? (lang === 'ta' ? 'சாம்பல் நிறம்' : lang === 'hi' ? 'ग्रेस्केल' : 'Grayscale') : t[mode].replace(/\s*\(₹[^)]*\)/, '')}</button>)}</div></fieldset>
       <label className="customer-field">{t.duplex}<select value={active.options.duplex} onChange={e => update({ duplex: e.target.value })}><option value="simplex">{t.single_sided}</option><option value="duplex_long">{t.double_sided_long}</option><option value="duplex_short">{t.double_sided_short}</option></select></label>
       <div className="customer-two-columns"><label className="customer-field">{t.copies}<input type="number" min={1} max={999} value={active.options.copies} onChange={e => update({ copies: Math.max(1, Math.min(999, Number(e.target.value) || 1)) })}/></label><label className="customer-field">{t.paper_size}<select value={active.options.paperSize} onChange={e => update({ paperSize: e.target.value })}>{['A4', 'A3', 'A5', 'Legal', 'Letter'].map(size => <option key={size}>{size}</option>)}</select></label></div>
       <details className="customer-advanced"><summary><SlidersHorizontal size={19}/>{c.advanced}</summary><div className="customer-advanced-content">
        <label className="customer-field">{t.page_range}<input value={active.options.pageRange} aria-invalid={!rangeValid} aria-describedby="range-help" onChange={e => update({ pageRange: e.target.value })}/></label><p id="range-help" className={rangeValid ? 'customer-hint' : 'customer-error'}>{c.rangeHelp}</p>
        <div className="customer-range-presets">{[['all', t.all_pages], ['odd', t.odd_only], ['even', t.even_only]].map(([value, label]) => <button key={value} aria-pressed={active.options.pageRange === value} onClick={() => update({ pageRange: value })}>{label}</button>)}</div>
        <label className="customer-field">{t.nup}<select value={active.options.nup} onChange={e => update({ nup: Number(e.target.value) })}>{[1, 2, 4, 6, 9, 16].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
        <label className="customer-field">{lang === 'ta' ? 'பைண்டிங் விருப்பம்' : lang === 'hi' ? 'बाइंडिंग प्राथमिकता' : 'Finishing preference'}<select value={active.options.finishing} onChange={e => update({ finishing: e.target.value })}><option value="none">{lang === 'ta' ? 'இல்லை' : lang === 'hi' ? 'नहीं' : 'None'}</option><option value="staple">{lang === 'ta' ? 'ஸ்டேப்ளர்' : lang === 'hi' ? 'स्टेपल' : 'Corner staple'}</option><option value="spiral">{lang === 'ta' ? 'ஸ்பைரல் பைண்டிங்' : lang === 'hi' ? 'स्पाइरल' : 'Spiral coil'}</option><option value="hard_bind">{lang === 'ta' ? 'ஹார்ட் பைண்ட்' : lang === 'hi' ? 'हार्ड बाइंड' : 'Hard bound'}</option></select></label><label className="customer-field">{t.photo_preset}<select value={active.options.photoPreset} onChange={e => update({ photoPreset: e.target.value })}><option value="standard">{t.standard_layout}</option><option value="passport_8up">{t.passport_8up}</option><option value="id_front_back">{t.id_front_back}</option></select></label>
       </div></details>
      </div><div className="customer-server-note"><FileText size={22}/><div><strong>{c.unknown}</strong><p>{c.pendingInfo}</p></div></div>
     </>}
     {step === 3 && <>
      <div className="customer-summary">{files.map(file => <div key={file.id}><FileText size={21}/><div><strong>{file.name}</strong><p>{file.options.copies} × {file.options.paperSize} · {file.options.colorMode === 'grayscale' ? (lang === 'ta' ? 'சாம்பல் நிறம்' : lang === 'hi' ? 'ग्रेस्केल' : 'Grayscale') : file.options.colorMode === 'bw' ? t.bw.replace(/\s*\(₹[^)]*\)/, '') : t.color.replace(/\s*\(₹[^)]*\)/, '')} · {file.options.pageRange}</p></div></div>)}</div>
      <div className="customer-quote"><LockKeyhole size={25}/><h3>{quote ? 'Server quote ready' : c.pending}</h3><p>{quote ? 'Your files were inspected and the price was calculated by the shop server.' : c.pendingInfo}</p><dl>{[[t.logical_pages, quote?.total_logical_pages], [t.rendered_sides, quote?.total_rendered_sides], [t.physical_sheets, quote?.total_physical_sheets], [t.price_total, quote ? `₹${quote.total_rupees.toFixed(2)}` : '—']].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>{!quote && <button className="customer-secondary-action" disabled={scanning || !session || files.some(file => !file.assetId)} onClick={createQuote}>{scanning ? 'Inspecting files…' : 'Get server quote'}</button>}</div>
      <fieldset><legend>{c.payment}</legend><div className="customer-choice-row"><button aria-pressed={payment === 'upi'} onClick={() => setPayment('upi')}>{t.pay_upi}</button><button aria-pressed={payment === 'cash'} onClick={() => setPayment('cash')}>{t.pay_cash}</button></div></fieldset>
      <div className="customer-server-note"><Printer size={24}/><div><strong>{c.workflow}</strong><p>{c.workflowInfo}</p></div></div>
     </>}
    </MotionSurface>
    {files.length > 0 && <footer className="customer-action-bar"><div><strong>{files.length} {c.selected.toLowerCase()}</strong><span>{scanning ? 'Server inspection in progress' : quote ? `₹${quote.total_rupees.toFixed(2)} · ${quote.total_physical_sheets} sheets` : c.estimate}</span></div><div className="customer-footer-buttons">{step > 1 && <button onClick={() => setStep(step - 1)}>{c.back}</button>}<button className="customer-primary" disabled={step === 3 || !rangeValid || (step === 2 && (!session || scanning || files.some(file => !file.assetId)))} onClick={() => { if (step === 2 && !quote) createQuote(); setStep(step + 1); }}>{step === 3 ? c.unavailable : c.next}{step < 3 && <ArrowRight size={18}/>}</button></div></footer>}
   </main>
  </div>
 </div>;
}
export default CustomerFlow;



