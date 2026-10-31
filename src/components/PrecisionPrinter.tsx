import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

type Props = {
  printing?: boolean;
  paused: boolean;
  soundEnabled?: boolean;
  onFailure: () => void;
};

// Web Audio API engine for realistic printer mechanical sound synthesis
function createPrinterAudio() {
  let ctx: AudioContext | null = null;
  const getCtx = () => {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
      const Cls =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Cls) ctx = new Cls();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  };

  return {
    playFeedClick() {
      try {
        const c = getCtx();
        if (!c) return;
        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.035);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } catch {
        // audio fail-safe
      }
    },
    playMotorStep() {
      try {
        const c = getCtx();
        if (!c) return;
        const now = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260 + Math.random() * 40, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.018);
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.022);
      } catch {
        // audio fail-safe
      }
    },
    playTrayLanding() {
      try {
        const c = getCtx();
        if (!c) return;
        const now = c.currentTime;
        const bufSize = Math.floor(c.sampleRate * 0.05);
        const buf = c.createBuffer(1, bufSize, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.35));
        }
        const src = c.createBufferSource();
        src.buffer = buf;
        const filter = c.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(750, now);
        filter.Q.setValueAtTime(1.5, now);
        const gain = c.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        src.start(now);
        src.stop(now + 0.055);
      } catch {
        // audio fail-safe
      }
    },
  };
}

export default function PrecisionPrinter({
  printing,
  paused,
  soundEnabled = true,
  onFailure,
}: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const controls = useRef({ paused, restart: 0, soundEnabled });
  const invalidate = useRef<() => void>(() => {});
  const audioEngine = useRef<ReturnType<typeof createPrinterAudio> | null>(null);

  useEffect(() => {
    controls.current.paused = paused;
    controls.current.soundEnabled = soundEnabled;
    invalidate.current();
  }, [paused, soundEnabled]);

  useEffect(() => {
    controls.current.restart++;
    if (controls.current.soundEnabled && audioEngine.current) {
      audioEngine.current.playFeedClick();
    }
    invalidate.current();
  }, [printing]);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    audioEngine.current = createPrinterAudio();

    let renderer: THREE.WebGLRenderer;
    let environment: THREE.WebGLRenderTarget | null = null;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    camera.position.set(6.4, 4.6, 9.0);
    camera.lookAt(0, 0.05, 0.2);

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
      renderer.shadowMap.enabled = false; // Shadows removed per user request for ultra-clean rendering
      renderer.localClippingEnabled = true; // Enables realistic internal paper clipping without rubber stretching

      // Immediate sizing to prevent 0x0 or 300x150 flash on launch/reload
      const initialRect = el.getBoundingClientRect();
      const initW = initialRect.width || el.clientWidth || 550;
      const initH = initialRect.height || el.clientHeight || 480;
      renderer.setSize(initW, initH, false);
      camera.aspect = initW / initH;
      camera.updateProjectionMatrix();

      el.appendChild(renderer.domElement);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      environment = pmrem.fromScene(room, 0.04);
      scene.environment = environment.texture;
      room.dispose();
      pmrem.dispose();
    } catch (err) {
      console.warn('[PrecisionPrinter] WebGL initialization failed, falling back:', err);
      onFailure();
      return;
    }

    const group = new THREE.Group();
    scene.add(group);

    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    const standard = (params: THREE.MeshStandardMaterialParameters) => {
      const m = new THREE.MeshStandardMaterial(params);
      materials.push(m);
      return m;
    };

    // Realistic PBR Materials
    const ceramic = standard({ color: 0xedeae3, roughness: 0.26, metalness: 0.12 });
    const side = standard({ color: 0x222426, roughness: 0.35, metalness: 0.32 });
    const dark = standard({ color: 0x121314, roughness: 0.42, metalness: 0.22 });
    const trayMat = standard({ color: 0x181a1c, roughness: 0.5, metalness: 0.18 });
    const rubber = standard({ color: 0x0c0d0d, roughness: 0.95 });
    const gold = standard({ color: 0xc8a872, metalness: 0.88, roughness: 0.22 });
    const scannerGlass = new THREE.MeshPhysicalMaterial({
      color: 0x253b3b,
      metalness: 0.18,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transmission: 0.65,
      ior: 1.52,
    });
    materials.push(scannerGlass);

    const ledActive = standard({
      color: 0x64d2ff,
      emissive: 0x0a84ff,
      emissiveIntensity: 1.6,
    });
    const ledReady = standard({
      color: 0x30d158,
      emissive: 0x30d158,
      emissiveIntensity: 1.2,
    });
    const slotLed = standard({
      color: 0xffd60a,
      emissive: 0xff9f0a,
      emissiveIntensity: 0.8,
    });

    function box(
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      material: THREE.Material,
      radius = 0.035
    ) {
      const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, radius), material);
      mesh.position.set(x, y, z);
      group.add(mesh);
      return mesh;
    }

    // ==============================================================
    // 1. MAIN CHASSIS & BASE
    // ==============================================================
    // Lower body (graphite)
    box(3.6, 1.18, 2.65, 0, -0.16, 0, side, 0.12);
    // Upper housing (ivory ceramic)
    box(3.63, 0.44, 2.68, 0, 0.61, -0.02, ceramic, 0.08);
    // Gold metallic accent divider strip
    box(3.58, 0.065, 2.62, 0, 0.864, -0.02, gold, 0.02);
    // Scanner bed rim
    box(3.56, 0.10, 2.59, 0, 0.95, -0.02, dark, 0.035);
    // Scanner glass platen
    box(3.26, 0.035, 2.26, 0, 1.022, -0.04, scannerGlass, 0.015);
    // Top ADF (Automatic Document Feeder) lid
    box(3.43, 0.11, 2.40, 0, 1.12, -0.10, ceramic, 0.04);
    box(2.8, 0.025, 1.85, 0, 1.19, -0.12, side, 0.018);
    // Lid hinges
    box(0.38, 0.16, 0.18, -1.12, 1.02, -1.21, dark, 0.02);
    box(0.38, 0.16, 0.18, 1.12, 1.02, -1.21, dark, 0.02);
    // ADF document tray guide
    box(2.4, 0.015, 0.9, 0, 1.21, -0.42, ceramic, 0.01);
    box(0.02, 0.06, 0.8, -1.1, 1.23, -0.42, dark, 0.005);
    box(0.02, 0.06, 0.8, 1.1, 1.23, -0.42, dark, 0.005);

    // ==============================================================
    // 2. LOWER PAPER CASSETTE DRAWER
    // ==============================================================
    box(3.30, 0.36, 0.055, 0, -0.49, 1.346, ceramic, 0.02);
    box(1.12, 0.075, 0.045, 0, -0.43, 1.386, dark, 0.015); // drawer pull handle
    // Blue paper level indicator window
    box(0.24, 0.03, 0.02, 0, -0.56, 1.38, ledActive, 0.008);
    box(3.44, 0.07, 2.51, 0, -0.82, 0.03, dark, 0.025);

    // Rubber anti-vibration feet
    for (const x of [-1.38, 1.38]) {
      for (const z of [-0.95, 0.95]) {
        box(0.35, 0.13, 0.36, x, -0.91, z, rubber, 0.04);
      }
    }

    // Cooling louvers / vents on side
    for (let i = 0; i < 11; i++) {
      box(0.012, 0.28, 0.055, 1.51 - i * 0.041, -0.12, 1.341, dark, 0.004);
    }
    for (let i = 0; i < 10; i++) {
      box(0.025, 0.32, 0.075, 1.805, -0.25, -0.55 + i * 0.11, dark, 0.005);
    }

    // ==============================================================
    // 3. INTERNAL PRINT SLOT & SWEEPING CARRIAGE HEAD
    // ==============================================================
    // Internal cavity recess
    box(2.94, 0.16, 0.25, 0, 0.09, 1.32, dark, 0.02);
    // Sweeping carriage printhead
    const carriage = box(0.32, 0.10, 0.14, 0, 0.09, 1.28, gold, 0.01);
    // Internal illumination LED strip
    box(2.6, 0.02, 0.02, 0, 0.16, 1.35, slotLed, 0.005);

    // ==============================================================
    // 4. REALISTIC ANGLED OUTPUT CATCH TRAY
    // ==============================================================
    const trayGroup = new THREE.Group();
    trayGroup.position.set(0, -0.12, 1.35);
    trayGroup.rotation.x = 0.075; // subtle ~4.3 degree upward angle to hold paper
    group.add(trayGroup);

    // Main tray bed
    const trayBed = new THREE.Mesh(
      new RoundedBoxGeometry(2.64, 0.04, 1.62, 2, 0.02),
      trayMat
    );
    trayBed.position.set(0, 0, 0.81);
    trayBed.castShadow = true;
    trayBed.receiveShadow = true;
    trayGroup.add(trayBed);

    // Front retention stop lip
    const trayStop = new THREE.Mesh(
      new RoundedBoxGeometry(2.64, 0.10, 0.06, 2, 0.015),
      dark
    );
    trayStop.position.set(0, 0.05, 1.62);
    trayGroup.add(trayStop);

    // Left and right side guide rails
    const railLeft = new THREE.Mesh(
      new RoundedBoxGeometry(0.04, 0.06, 1.62, 2, 0.01),
      dark
    );
    railLeft.position.set(-1.30, 0.03, 0.81);
    trayGroup.add(railLeft);

    const railRight = new THREE.Mesh(
      new RoundedBoxGeometry(0.04, 0.06, 1.62, 2, 0.01),
      dark
    );
    railRight.position.set(1.30, 0.03, 0.81);
    trayGroup.add(railRight);

    // Helper for crisp CanvasTextures
    function canvasTexture(
      width: number,
      height: number,
      draw: (ctx: CanvasRenderingContext2D) => void
    ) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) draw(ctx);
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      textures.push(t);
      return { texture: t, canvas, ctx };
    }

    // ==============================================================
    // 5. HIGH-RESOLUTION OLED CONTROL DISPLAY
    // ==============================================================
    let screenCtx: CanvasRenderingContext2D | null = null;
    let screenTex: THREE.CanvasTexture | null = null;

    const screenData = canvasTexture(512, 256, (ctx) => {
      screenCtx = ctx;
      ctx.fillStyle = '#0a1012';
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = '#c8a872';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('PRINT BOT PRO', 28, 42);
      ctx.fillStyle = '#30d158';
      ctx.beginPath();
      ctx.arc(474, 34, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText('Ready to impress', 28, 108);
      ctx.fillStyle = '#223838';
      ctx.fillRect(28, 142, 456, 8);
      ctx.fillStyle = '#30d158';
      ctx.fillRect(28, 142, 456, 8);
      ctx.fillStyle = '#9cb3a8';
      ctx.font = '18px monospace';
      ctx.fillText('A4 · DUPLEX · 300 DPI · winspool.drv OK', 28, 208);
    });
    screenTex = screenData.texture;

    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
    materials.push(screenMat);

    // Bezel housing
    box(1.24, 0.42, 0.05, -0.78, 0.59, 1.355, dark, 0.03);
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.34), screenMat);
    screenMesh.position.set(-0.78, 0.59, 1.386);
    group.add(screenMesh);

    // Gold power button & LED indicator
    const power = new THREE.Mesh(new THREE.TorusGeometry(0.049, 0.009, 6, 24), gold);
    power.position.set(1.47, 0.59, 1.354);
    group.add(power);
    box(0.012, 0.049, 0.012, 1.47, 0.62, 1.366, ledActive, 0.004);

    // Main status light pill (turns cyan/amber while printing, green when ready)
    const statusMesh = box(0.18, 0.028, 0.018, 1.03, 0.49, 1.36, ledReady, 0.008);

    // Brand logo on front bevel
    const labelData = canvasTexture(256, 64, (ctx) => {
      ctx.fillStyle = '#383633';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('printbot', 12, 44);
    });
    const labelMat = new THREE.MeshBasicMaterial({ map: labelData.texture, transparent: true });
    materials.push(labelMat);
    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.16), labelMat);
    labelMesh.position.set(0.73, 0.65, 1.356);
    group.add(labelMesh);

    // ==============================================================
    // 6. HIGH-PRECISION 100% RIGID PRINTED DOCUMENT (NO UNROLLING)
    // ==============================================================
    const artData = canvasTexture(2172, 1536, (ctx) => {
      // True 2x Retina super-sampling for crystal clear text and line art
      ctx.scale(2, 2);

      // 1. Premium High-Contrast Pure White Paper Stock (1086 x 768 logical space)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1086, 768);

      // Outer & Inner Security Guilloche Border
      ctx.strokeStyle = '#c8a872';
      ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, 1054, 736);

      ctx.strokeStyle = '#67283f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(24, 24, 1038, 720);

      // Top Header Banner Pill
      ctx.fillStyle = '#67283f';
      ctx.fillRect(40, 36, 1006, 46);
      ctx.fillStyle = '#edd5ae';
      ctx.font = 'bold 17px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PRINT BOT OS · OFFICIAL SUBSCRIBER PROPOSAL · UNLIMITED PRINTERS', 543, 66);

      // Main High-Impact Hero Headline
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1c1218';
      ctx.font = 'bold 48px Georgia, serif';
      ctx.fillText('Double Your Counter Speed.', 543, 138);

      ctx.fillStyle = '#8b2046';
      ctx.font = 'bold 46px Georgia, serif';
      ctx.fillText('Keep 100% Of Your Profit.', 543, 192);

      // Gold Accent Divider
      ctx.strokeStyle = '#c8a872';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(180, 214);
      ctx.lineTo(906, 214);
      ctx.stroke();

      // Pitch Sentence (Clear, Legible, High-Contrast)
      ctx.fillStyle = '#22191f';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('0% Per-Page Commission · Unlimited Connected Printers', 543, 248);

      ctx.fillStyle = '#4a3b43';
      ctx.font = '16px sans-serif';
      ctx.fillText('One flat monthly subscription for your entire Xerox shop · Customers scan QR & pay UPI in 30 seconds', 543, 276);

      // 3 Highlight Feature Cards
      const features = [
        { title: '₹0 Commission', desc: '100% UPI & cash stays yours' },
        { title: 'Unlimited Fleet', desc: 'Connect 1 to 20 printers freely' },
        { title: 'winspool.drv', desc: '100% raw driver, zero margin cut' },
      ];

      features.forEach((feat, idx) => {
        const fx = 48 + idx * 342;
        ctx.fillStyle = '#f8f4ec';
        ctx.fillRect(fx, 302, 306, 88);
        ctx.strokeStyle = '#d9c7af';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(fx, 302, 306, 88);

        ctx.fillStyle = '#8b2046';
        ctx.font = 'bold 22px Georgia, serif';
        ctx.fillText(feat.title, fx + 153, 338);

        ctx.fillStyle = '#4f4035';
        ctx.font = '14px sans-serif';
        ctx.fillText(feat.desc, fx + 153, 368);
      });

      // Highlighted Subscription Pricing Box
      ctx.fillStyle = '#26101d';
      ctx.fillRect(48, 408, 990, 185);
      ctx.strokeStyle = '#c8a872';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(48, 408, 990, 185);

      ctx.fillStyle = '#edd5ae';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('★ ALL-INCLUSIVE UNLIMITED SHOP PLAN ★', 543, 442);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px Georgia, serif';
      ctx.fillText('₹199', 543, 508);

      ctx.fillStyle = '#fce881';
      ctx.font = 'bold 21px sans-serif';
      ctx.fillText('per month  (or ₹1,999 / year)', 543, 542);

      ctx.fillStyle = '#ecd6ce';
      ctx.font = '15px sans-serif';
      ctx.fillText('Zero setup fee · 14-day free trial · Instant 5-min Windows setup', 543, 574);

      // CTA Banner Button
      ctx.fillStyle = '#e2c18b';
      ctx.fillRect(243, 610, 600, 56);
      ctx.strokeStyle = '#f5e4bd';
      ctx.lineWidth = 2;
      ctx.strokeRect(243, 610, 600, 56);

      ctx.fillStyle = '#211219';
      ctx.font = 'bold 23px sans-serif';
      ctx.fillText('SUBSCRIBE TODAY ↗ · ₹199/MO', 543, 646);

      // Official Starburst Certified Stamp (Right Side)
      const cx = 950;
      const cy = 690;
      ctx.save();
      ctx.strokeStyle = '#c8a872';
      ctx.lineWidth = 1.8;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, 36, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#792d47';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('PRINT BOT OS', cx, cy - 6);
      ctx.fillText('VERIFIED 2026', cx, cy + 8);
      ctx.restore();

      // Barcode & Footer (Left/Center)
      ctx.fillStyle = '#1c1712';
      for (let x = 60; x < 480; x += 6) {
        if (Math.sin(x * 123.4) > -0.2) {
          ctx.fillRect(x, 680, x % 3 === 0 ? 4 : 2, 34);
        }
      }

      ctx.fillStyle = '#7a6d5d';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('* PB-SUBSCRIBE-OFFICIAL-₹199 *', 60, 734);
    });

    const artTexture = artData.texture;
    artTexture.wrapS = THREE.ClampToEdgeWrapping;
    artTexture.wrapT = THREE.ClampToEdgeWrapping;
    artTexture.generateMipmaps = true;
    artTexture.minFilter = THREE.LinearMipmapLinearFilter;
    artTexture.magFilter = THREE.LinearFilter;
    artTexture.anisotropy = 16;
    artTexture.needsUpdate = true;

    // Slot exit aperture boundary: plane locked to printer slot aperture
    // Only paper that has physically emerged past the slot aperture is visible
    const slotClipPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.35);

    const sheetMaterial = standard({
      map: artTexture,
      roughness: 0.82,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    sheetMaterial.clippingPlanes = [slotClipPlane];

    // 100% Rigid, flat physical paper dimensions (Laser Flat — Zero Unrolling)
    const SHEET_W = 2.18;
    const SHEET_L = 1.54;
    const sheetGeo = new THREE.PlaneGeometry(SHEET_W, SHEET_L);
    const sheet = new THREE.Mesh(sheetGeo, sheetMaterial);
    sheet.rotation.x = -Math.PI / 2;
    sheet.position.set(0, 0.034, 0.81);
    trayGroup.add(sheet);

    // Realistic stacked printed sheets already resting neatly inside output tray
    const stackMat = standard({
      color: 0xf8f6f2,
      roughness: 0.88,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    stackMat.clippingPlanes = [slotClipPlane];
    const stack1 = new THREE.Mesh(new THREE.PlaneGeometry(SHEET_W, SHEET_L), stackMat);
    stack1.rotation.x = -Math.PI / 2;
    stack1.position.set(0.015, 0.022, 0.80);
    trayGroup.add(stack1);

    const stack2 = new THREE.Mesh(new THREE.PlaneGeometry(SHEET_W, SHEET_L), stackMat);
    stack2.rotation.x = -Math.PI / 2;
    stack2.rotation.z = -0.012;
    stack2.position.set(-0.012, 0.025, 0.81);
    trayGroup.add(stack2);

    // ==============================================================
    // 7. ULTRA-CLEAN FLOATING HARDWARE (SHADOWS & PLATFORM REMOVED)
    // ==============================================================
    // Pedestal completely removed per user request for ultra-clean, floating presentation.

    // ==============================================================
    // 8. LUXURY STUDIO LIGHTING (SHADOW MAPS DISABLED FOR CLEAN AESTHETIC)
    // ==============================================================
    scene.add(new THREE.HemisphereLight(0xfff8ed, 0x241d24, 2.4));

    const key = new THREE.DirectionalLight(0xfff3e2, 3.8);
    key.position.set(-3.5, 7.5, 5.5);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xd4e2f5, 2.2);
    rim.position.set(4.5, 2.5, -4.5);
    scene.add(rim);

    const frontFill = new THREE.DirectionalLight(0xffe8cf, 1.5);
    frontFill.position.set(0, 1.5, 6.0);
    scene.add(frontFill);

    // ==============================================================
    // 9. ANIMATION LOOP, MOUSE ROTATION & AUDIO COORDINATION
    // ==============================================================
    let frame = 0;
    let visible = true;
    let disposed = false;
    let last = 0;
    let elapsed = 0;
    let cycle = 2.0;
    let restart = controls.current.restart;
    let lastMotorTick = 0;
    let hasPlayedDrop = false;

    // Interactive 360° mouse & touch drag rotation state
    let currentRotY = 0;
    let currentRotX = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let velY = 0;
    let velX = 0;
    let isDragging = false;
    let activePointerId = -1;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastInteractionTime = performance.now();

    function request() {
      if (!frame && !disposed && visible && !document.hidden) {
        frame = requestAnimationFrame(render);
      }
    }

    function render(now: number) {
      frame = 0;
      if (disposed || !visible || document.hidden) {
        last = 0;
        return;
      }
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;

      // Handle user-initiated impression restarts
      if (restart !== controls.current.restart) {
        restart = controls.current.restart;
        cycle = 0;
        hasPlayedDrop = false;
      }

      if (!controls.current.paused) {
        elapsed += dt;
        cycle = (cycle + dt) % 10.0;
      }

      // Smooth 360° mouse & touch drag rotation with inertia
      if (isDragging) {
        currentRotY += (targetRotY - currentRotY) * 0.45;
        currentRotX += (targetRotX - currentRotX) * 0.45;
        group.rotation.y = currentRotY;
        group.rotation.x = currentRotX;
      } else {
        if (Math.abs(velY) > 0.0001) {
          targetRotY += velY;
          velY *= 0.92;
        }
        if (Math.abs(velX) > 0.0001) {
          targetRotX = THREE.MathUtils.clamp(targetRotX + velX, -0.65, 0.70);
          velX *= 0.92;
        }
        currentRotY += (targetRotY - currentRotY) * 0.18;
        currentRotX += (targetRotX - currentRotX) * 0.18;

        const idleSecs = (performance.now() - lastInteractionTime) / 1000;
        if (idleSecs > 2.5 && !controls.current.paused) {
          const blend = Math.min((idleSecs - 2.5) / 2.0, 1.0);
          const ambientSway = Math.sin(elapsed * 0.22) * 0.35 * blend;
          group.rotation.y = currentRotY + ambientSway;
        } else {
          group.rotation.y = currentRotY;
        }
        group.rotation.x = currentRotX;
      }

      // Dynamic clipping plane orientation sync:
      // Keep clipping plane mathematically locked to slot aperture even when 360° rotated
      const slotWorldPos = new THREE.Vector3();
      const slotWorldQuat = new THREE.Quaternion();
      const slotWorldNorm = new THREE.Vector3(0, 0, 1);
      trayGroup.getWorldPosition(slotWorldPos);
      trayGroup.getWorldQuaternion(slotWorldQuat);
      slotWorldNorm.applyQuaternion(slotWorldQuat);
      slotClipPlane.setFromNormalAndCoplanarPoint(slotWorldNorm, slotWorldPos);

      // 100% physically authentic rigid laser sheet feed kinematics:
      // Flat, rigid sheet advances millimeter-by-millimeter out of slot rollers with micro-stepper pulses
      const isPrintingActive = cycle >= 0.4 && cycle < 5.8;
      let printProgress = 0;

      if (isPrintingActive) {
        const rawP = THREE.MathUtils.clamp((cycle - 0.4) / 5.2, 0, 1);
        printProgress = rawP;

        // Stepper cadence: paper feeds in realistic stepped intervals synchronized with printhead passes
        const numPasses = 32;
        const passIndex = Math.floor(rawP * numPasses);
        const passFrac = (rawP * numPasses) % 1;
        const feedStroke = Math.min(passFrac / 0.45, 1.0);
        const smoothFeed = 0.5 - 0.5 * Math.cos(feedStroke * Math.PI);
        const steppedP = (passIndex + smoothFeed) / numPasses;

        // Advance rigid sheet smoothly along tray bed from throat to front stop
        sheet.position.x = 0;
        sheet.position.z = THREE.MathUtils.lerp(-0.76, 0.81, steppedP);
        sheet.position.y = 0.036;

        // Sweeping carriage head inside throat
        carriage.position.x = Math.sin(cycle * 18.0) * 0.95;
        statusMesh.material = ledActive;
        statusMesh.scale.x = 1.0 + Math.sin(elapsed * 9) * 0.25;

        // Stepper motor ticking in rhythm
        if (
          controls.current.soundEnabled &&
          audioEngine.current &&
          now - lastMotorTick > 120
        ) {
          audioEngine.current.playMotorStep();
          lastMotorTick = now;
        }
      } else if (cycle >= 5.8) {
        // Fully printed & resting on the tray stack
        printProgress = 1.0;
        sheet.position.x = 0;
        sheet.position.z = 0.81;
        sheet.position.y = 0.028; // settled onto stack
        carriage.position.x = 0;
        statusMesh.material = ledReady;
        statusMesh.scale.x = 1.0;

        if (!hasPlayedDrop && controls.current.soundEnabled) {
          audioEngine.current?.playTrayLanding();
          hasPlayedDrop = true;
        }
      } else {
        // Pre-print / standby state inside rollers
        printProgress = 0;
        sheet.position.x = 0;
        sheet.position.z = -0.76;
        sheet.position.y = 0.036;
        carriage.position.x = 0;
        statusMesh.material = ledReady;
        statusMesh.scale.x = 1.0;
      }

      // Update interactive screen canvas
      if (screenCtx && screenTex && Math.floor(elapsed * 4) % 2 === 0) {
        screenCtx.fillStyle = '#0a1012';
        screenCtx.fillRect(0, 0, 512, 256);
        screenCtx.fillStyle = '#c8a872';
        screenCtx.font = 'bold 22px sans-serif';
        screenCtx.fillText('PRINT BOT PRO', 28, 42);

        if (isPrintingActive) {
          screenCtx.fillStyle = '#0a84ff';
          screenCtx.beginPath();
          screenCtx.arc(474, 34, 7, 0, Math.PI * 2);
          screenCtx.fill();
          screenCtx.fillStyle = '#ffffff';
          screenCtx.font = 'bold 28px Georgia, serif';
          screenCtx.fillText(`Printing Proposal: ${Math.round(printProgress * 100)}%`, 28, 108);

          // Progress bar track & fill
          screenCtx.fillStyle = '#1c2830';
          screenCtx.fillRect(28, 142, 456, 10);
          screenCtx.fillStyle = '#0a84ff';
          screenCtx.fillRect(28, 142, 456 * printProgress, 10);

          screenCtx.fillStyle = '#8ca8b8';
          screenCtx.font = '18px monospace';
          screenCtx.fillText('₹199/mo Plan · Unlimited Printers · Instant Spool', 28, 208);
        } else {
          screenCtx.fillStyle = '#30d158';
          screenCtx.beginPath();
          screenCtx.arc(474, 34, 7, 0, Math.PI * 2);
          screenCtx.fill();
          screenCtx.fillStyle = '#ffffff';
          screenCtx.font = 'bold 28px Georgia, serif';
          screenCtx.fillText('Subscribe to Print Bot', 28, 108);

          screenCtx.fillStyle = '#30d158';
          screenCtx.fillRect(28, 142, 456, 8);

          screenCtx.fillStyle = '#9cb3a8';
          screenCtx.font = '18px monospace';
          screenCtx.fillText('0% Commission · winspool.drv Ready', 28, 208);
        }
        screenTex.needsUpdate = true;
      }

      renderer.render(scene, camera);

      if (
        !controls.current.paused ||
        isDragging ||
        Math.abs(velY) > 0.0001 ||
        Math.abs(velX) > 0.0001 ||
        Math.abs(targetRotY - currentRotY) > 0.001 ||
        Math.abs(targetRotX - currentRotX) > 0.001
      ) {
        request();
      }
    }

    invalidate.current = () => {
      last = 0;
      request();
    };

    const resize = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      request();
    });
    resize.observe(el);

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      last = 0;
      if (!visible) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        request();
      }
    });
    observer.observe(el);

    // Interactive 360° mouse & touch drag rotation with inertia & wheel zoom
    const dom = renderer.domElement;
    dom.style.touchAction = 'none';
    dom.style.cursor = 'grab';

    const onPointerDown = (event: PointerEvent) => {
      isDragging = true;
      activePointerId = event.pointerId;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      velY = 0;
      velX = 0;
      lastInteractionTime = performance.now();
      dom.style.cursor = 'grabbing';
      document.body.style.cursor = 'grabbing';
      try {
        dom.setPointerCapture(event.pointerId);
      } catch {}
      el.classList.add('is-dragging');
      request();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (isDragging && (activePointerId === -1 || event.pointerId === activePointerId)) {
        const dx = event.clientX - lastPointerX;
        const dy = event.clientY - lastPointerY;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;

        targetRotY += dx * 0.012;
        targetRotX = THREE.MathUtils.clamp(targetRotX + dy * 0.007, -0.65, 0.70);

        velY = dx * 0.012;
        velX = dy * 0.007;
        lastInteractionTime = performance.now();
        request();
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (isDragging && (activePointerId === -1 || event.pointerId === activePointerId)) {
        isDragging = false;
        activePointerId = -1;
        dom.style.cursor = 'grab';
        document.body.style.cursor = '';
        try {
          dom.releasePointerCapture(event.pointerId);
        } catch {}
        el.classList.remove('is-dragging');
        lastInteractionTime = performance.now();
        request();
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.006, 5.5, 13.0);
      camera.position.y = (camera.position.z / 9.0) * 4.6;
      camera.lookAt(0, 0.05, 0.2);
      lastInteractionTime = performance.now();
      request();
    };

    const onDblClick = () => {
      targetRotY = 0;
      targetRotX = 0;
      velY = 0;
      velX = 0;
      camera.position.set(6.4, 4.6, 9.0);
      camera.lookAt(0, 0.05, 0.2);
      lastInteractionTime = performance.now();
      request();
    };

    const visibility = () => {
      last = 0;
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        request();
      }
    };

    const lost = (event: Event) => {
      event.preventDefault();
      if (!disposed) {
        console.warn('[PrecisionPrinter] WebGL context lost during active session');
        onFailure();
      }
    };

    const restored = () => {
      if (!disposed) {
        request();
      }
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('dblclick', onDblClick);
    document.addEventListener('visibilitychange', visibility);
    renderer.domElement.addEventListener('webglcontextlost', lost);
    renderer.domElement.addEventListener('webglcontextrestored', restored);
    request();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      invalidate.current = () => {};
      resize.disconnect();
      observer.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('dblclick', onDblClick);
      document.body.style.cursor = '';
      document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      renderer.domElement.removeEventListener('webglcontextrestored', restored);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) obj.geometry.dispose();
      });
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      if (environment) environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onFailure]);

  return (
    <div
      className="webgl-scene"
      ref={mount}
      role="img"
      aria-label="High-precision photorealistic Xerox & digital printer with champagne trim, OLED touchscreen, and automated thesis sheet feeding into output tray"
    />
  );
}
