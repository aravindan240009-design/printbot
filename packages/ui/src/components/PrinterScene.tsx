'use client';
import type { Material, Mesh, MeshStandardMaterial, MeshBasicMaterial } from 'three';
import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Camera, RotateCw, Volume2, VolumeX, Sparkles } from 'lucide-react';

export function PrinterScene({ compact = false }: { compact?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const control = useRef<(action: string, param?: any) => void>(() => {});
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const [mono, setMono] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<'studio' | 'scanner' | 'tray'>('studio');
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};

    import('three').then(async T => {
      const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
      const { RoundedBoxGeometry } = await import('three/examples/jsm/geometries/RoundedBoxGeometry.js');

      if (cancelled || !host.current) return;
      const container = host.current;

      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.02;
      container.appendChild(renderer.domElement);

      const scene = new T.Scene();
      const pmrem = new T.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const environment = pmrem.fromScene(room, 0.04);
      scene.environment = environment.texture;
      room.dispose();
      pmrem.dispose();

      const camera = new T.PerspectiveCamera(35, 1, 0.1, 50);
      const model = new T.Group();
      scene.add(model);

      const shell = new T.MeshPhysicalMaterial({ color: '#eee8df', roughness: 0.32, metalness: 0.04, clearcoat: 0.28 });
      const dark = new T.MeshStandardMaterial({ color: '#292325', roughness: 0.45, metalness: 0.25 });
      const trim = new T.MeshStandardMaterial({ color: '#a67c45', roughness: 0.22, metalness: 0.72 });
      const brass = new T.MeshStandardMaterial({ color: '#d4af37', roughness: 0.18, metalness: 0.88 });
      const paperMaterial = new T.MeshStandardMaterial({ color: '#fffdfa', roughness: 0.85 });

      const box = (w: number, h: number, d: number, x: number, y: number, z: number, material: Material, radius = 0.04) => {
        const mesh = new T.Mesh(new RoundedBoxGeometry(w, h, d, 3, radius), material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        model.add(mesh);
        return mesh;
      };

      // Main printer chassis
      box(2.3, 1.05, 1.7, 0, 0.9, 0, shell, 0.12);
      box(2.24, 0.12, 1.67, 0, 1.49, 0, dark);
      box(2.35, 0.16, 1.75, 0, 1.61, 0, shell, 0.07);

      // Glass scanner bed & platen
      const glassBed = new T.Mesh(
        new T.BoxGeometry(1.5, 0.02, 1.1),
        new T.MeshPhysicalMaterial({ color: '#a5f3fc', transmission: 0.65, opacity: 0.9, transparent: true, roughness: 0.08, ior: 1.5 })
      );
      glassBed.position.set(0, 1.71, -0.1);
      model.add(glassBed);

      // Cyan laser scan bar
      const scanBar = new T.Mesh(
        new T.BoxGeometry(1.48, 0.03, 0.04),
        new T.MeshBasicMaterial({ color: '#0ea5e9' })
      );
      scanBar.position.set(0, 1.705, -0.1);
      scanBar.visible = false;
      model.add(scanBar);

      const lid = box(1.62, 0.06, 1.2, 0, 1.77, -0.1, shell);
      for (const x of [-0.62, 0.62]) box(0.18, 0.09, 0.12, x, 1.68, -0.69, dark);
      for (let i = 0; i < 12; i++) box(0.016, 0.16, 0.02, 1.154, 0.85, -0.55 + i * 0.085, dark, 0.003);

      const rollers: Mesh[] = [];
      for (const x of [-0.55, 0.55]) {
        const roller = new T.Mesh(new T.CylinderGeometry(0.065, 0.065, 0.3, 24), dark);
        roller.rotation.z = Math.PI / 2;
        roller.position.set(x, 1.07, 0.86);
        model.add(roller);
        rollers.push(roller);
      }

      box(0.24, 0.018, 0.035, -0.67, 1.705, 0.64, trim, 0.005);
      box(2, 0.22, 0.08, 0, 1.13, 0.87, dark);
      box(1.82, 0.035, 0.75, 0, 0.97, 1.15, dark);
      box(2.08, 0.28, 0.08, 0, 0.61, 0.85, shell);
      box(0.58, 0.025, 0.045, 0, 0.65, 0.91, trim);
      box(0.55, 0.1, 0.33, 0.63, 1.69, 0.58, dark);

      // Interactive touchscreen LCD console
      const screen = new T.MeshStandardMaterial({ color: '#385e59', emissive: '#1d4844', emissiveIntensity: 0.6, roughness: 0.2 });
      box(0.35, 0.014, 0.2, 0.59, 1.75, 0.58, screen, 0.01);
      box(0.07, 0.025, 0.07, 1, 1.75, 0.56, trim, 0.02);

      // Status LED indicators
      const readyLed = new T.Mesh(new T.SphereGeometry(0.014, 16, 16), new T.MeshBasicMaterial({ color: '#22c55e' }));
      readyLed.position.set(0.85, 1.755, 0.56);
      model.add(readyLed);

      const activeLed = new T.Mesh(new T.SphereGeometry(0.014, 16, 16), new T.MeshBasicMaterial({ color: '#475569' }));
      activeLed.position.set(0.9, 1.755, 0.56);
      model.add(activeLed);

      for (let i = 0; i < 9; i++) box(0.025, 0.25, 0.016, -0.95 + i * 0.065, 0.91, 0.86, dark, 0.005);
      for (const x of [-0.86, 0.86]) for (const z of [-0.53, 0.53]) box(0.24, 0.15, 0.25, x, 0.31, z, dark);

      // Output paper sheet
      const sheet = box(1.5, 0.012, 1.3, 0, 1.01, 0.7, paperMaterial, 0.005);
      const marks: Mesh[] = [];
      for (let i = 0; i < 3; i++) {
        const mark = box(0.3, 0.008, 0.21, -0.42 + i * 0.4, 1.025, 0.98, new T.MeshStandardMaterial({ color: ['#4e1c31', '#a67c45', '#4f6b58'][i] }), 0.005);
        marks.push(mark);
        sheet.attach(mark);
      }
      for (let i = 0; i < 4; i++) sheet.attach(box(1.15 - i * 0.1, 0.007, 0.02, -i * 0.05, 1.025, 1.2 + i * 0.07, dark, 0.002));
      for (let i = 0; i < 5; i++) box(1.45, 0.014, 1.2, 1.75, 0.3 + i * 0.018, 0.1, paperMaterial, 0.005);

      // Studio pedestal ground with brass luxury chamfer ring
      const ground = new T.Mesh(new T.CylinderGeometry(2.65, 2.7, 0.14, 80), new T.MeshStandardMaterial({ color: '#cfc4b3', roughness: 0.55, metalness: 0.15 }));
      ground.position.y = 0.15;
      ground.receiveShadow = true;
      scene.add(ground);

      const brassRing = new T.Mesh(new T.TorusGeometry(2.66, 0.018, 16, 80), brass);
      brassRing.rotation.x = Math.PI / 2;
      brassRing.position.y = 0.22;
      scene.add(brassRing);

      // Atmospheric floating particles
      const particleGeo = new T.BufferGeometry();
      const pCount = 42;
      const pCoords = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount * 3; i += 3) {
        pCoords[i] = (Math.random() - 0.5) * 4.8;
        pCoords[i + 1] = 0.5 + Math.random() * 3.2;
        pCoords[i + 2] = (Math.random() - 0.5) * 4.8;
      }
      particleGeo.setAttribute('position', new T.BufferAttribute(pCoords, 3));
      const particleMat = new T.PointsMaterial({ size: 0.035, color: '#f5ebd9', transparent: true, opacity: 0.55 });
      const particles = new T.Points(particleGeo, particleMat);
      scene.add(particles);

      // Studio lighting
      scene.add(new T.HemisphereLight('#fff7ed', '#675c54', 0.75));
      const key = new T.DirectionalLight('#fff2dd', 2.8);
      key.position.set(-3, 6, 4);
      key.castShadow = true;
      key.shadow.mapSize.set(2048, 2048);
      key.shadow.normalBias = 0.025;
      key.shadow.bias = -0.0002;
      key.shadow.radius = 4;
      scene.add(key);

      const rim = new T.DirectionalLight('#c3d4ff', 0.95);
      rim.position.set(4, 3, -3);
      scene.add(rim);

      let angle = 0.55;
      let target = 0.55;
      let elevation = 4.3;
      let targetElevation = 4.3;
      let distance = 7;
      let targetDistance = 7;
      let frame = 0;
      let start = 0;
      let printing = false;
      let isDragging = false;
      let prevPointerX = 0;
      let prevPointerY = 0;

      const playClickSound = () => {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(680, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.06);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.06);
        } catch {}
      };

      const render = () => {
        camera.position.set(Math.sin(angle) * distance, elevation, Math.cos(angle) * distance);
        camera.lookAt(0, 0.9, 0);
        renderer.render(scene, camera);
      };

      const tick = (time: number) => {
        frame = 0;
        if (document.hidden) return;

        angle += (target - angle) * 0.1;
        elevation += (targetElevation - elevation) * 0.1;
        distance += (targetDistance - distance) * 0.1;
        particles.rotation.y = time * 0.00012;

        if (printing) {
          scanBar.visible = true;
          (activeLed.material as MeshBasicMaterial).color.set(Math.sin(time * 0.015) > 0 ? '#f59e0b' : '#334155');
          screen.emissiveIntensity = 0.75 + Math.sin(time * 0.008) * 0.25;
          rollers.forEach(r => r.rotation.x = time * 0.006);
          const t = Math.min((time - start) / 2200, 1);
          sheet.position.z = 0.45 + (0.5 - 0.5 * Math.cos(t * Math.PI)) * 0.8;
          lid.position.y = 1.77 + Math.sin(t * Math.PI) * 0.01;
          scanBar.position.z = -0.6 + Math.sin(t * Math.PI * 2) * 0.45;

          if (t === 1) {
            printing = false;
            scanBar.visible = false;
            (activeLed.material as MeshBasicMaterial).color.set('#475569');
            screen.emissiveIntensity = 0.6;
            setPlaying(false);
          }
        }

        render();
        if (printing || isDragging || Math.abs(target - angle) > 0.0005 || Math.abs(targetElevation - elevation) > 0.005 || Math.abs(targetDistance - distance) > 0.005) {
          frame = requestAnimationFrame(tick);
        }
      };

      const wake = () => {
        if (!frame) frame = requestAnimationFrame(tick);
      };

      // Pointer drag orbital interaction
      const onPointerDown = (e: PointerEvent) => {
        isDragging = true;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
        container.setPointerCapture?.(e.pointerId);
        container.style.cursor = 'grabbing';
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        const deltaX = e.clientX - prevPointerX;
        const deltaY = e.clientY - prevPointerY;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;

        target += deltaX * 0.008;
        targetElevation = Math.max(1.8, Math.min(6.5, targetElevation - deltaY * 0.01));
        wake();
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!isDragging) return;
        isDragging = false;
        container.releasePointerCapture?.(e.pointerId);
        container.style.cursor = 'grab';
      };

      container.style.cursor = 'grab';
      container.addEventListener('pointerdown', onPointerDown);
      container.addEventListener('pointermove', onPointerMove);
      container.addEventListener('pointerup', onPointerUp);
      container.addEventListener('pointercancel', onPointerUp);

      const resize = new ResizeObserver(() => {
        if (!container.clientWidth) return;
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        render();
      });
      resize.observe(container);

      control.current = (action: string, param?: any) => {
        if (action === 'rotate') {
          target += Math.PI / 3;
          if (reduced) angle = target;
          wake();
        }
        if (action === 'camera') {
          if (param === 'studio') {
            target = 0.55;
            targetElevation = 4.3;
            targetDistance = 7;
          } else if (param === 'scanner') {
            target = 0.05;
            targetElevation = 6.2;
            targetDistance = 6.2;
          } else if (param === 'tray') {
            target = 0;
            targetElevation = 2.4;
            targetDistance = 5.2;
          }
          if (reduced) {
            angle = target;
            elevation = targetElevation;
            distance = targetDistance;
          }
          wake();
        }
        if (action === 'print') {
          if (reduced) {
            sheet.position.z = 1.25;
            render();
            return;
          }
          printing = true;
          start = performance.now();
          setPlaying(true);
          playClickSound();
          wake();
        }
        if (action === 'color' || action === 'mono') {
          marks.forEach((mark, i) =>
            (mark.material as MeshStandardMaterial).color.set(
              action === 'mono' ? '#555555' : ['#4e1c31', '#a67c45', '#4f6b58'][i]
            )
          );
          render();
        }
      };

      const visibility = () => {
        if (!document.hidden) wake();
      };
      document.addEventListener('visibilitychange', visibility);

      const lost = (event: Event) => {
        event.preventDefault();
        setFailed(true);
      };
      renderer.domElement.addEventListener('webglcontextlost', lost);

      render();

      cleanup = () => {
        cancelAnimationFrame(frame);
        resize.disconnect();
        container.removeEventListener('pointerdown', onPointerDown);
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('pointerup', onPointerUp);
        container.removeEventListener('pointercancel', onPointerUp);
        document.removeEventListener('visibilitychange', visibility);
        renderer.domElement.removeEventListener('webglcontextlost', lost);

        scene.traverse(object => {
          if (object instanceof T.Mesh) {
            object.geometry.dispose();
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach(material => material.dispose());
          }
        });
        particleGeo.dispose();
        particleMat.dispose();
        environment.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        control.current = () => {};
      };
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [reduced]);

  return (
    <section className={`pb-real-scene ${compact ? 'pb-real-compact' : ''}`} aria-label="Interactive 3D printer model">
      <div className="pb-scene-toolbar">
        <div className="flex items-center gap-1">
          <button
            aria-pressed={cameraPreset === 'studio'}
            onClick={() => {
              setCameraPreset('studio');
              control.current('camera', 'studio');
            }}
            title="Studio Perspective"
          >
            <Camera size={13} className="inline mr-1" />
            Studio
          </button>
          <button
            aria-pressed={cameraPreset === 'scanner'}
            onClick={() => {
              setCameraPreset('scanner');
              control.current('camera', 'scanner');
            }}
            title="Top Scanner Bed"
          >
            Platen
          </button>
          <button
            aria-pressed={cameraPreset === 'tray'}
            onClick={() => {
              setCameraPreset('tray');
              control.current('camera', 'tray');
            }}
            title="Output Paper Tray"
          >
            Tray
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button aria-pressed={!mono} onClick={() => { setMono(false); control.current('color'); }}>
            Color
          </button>
          <button aria-pressed={mono} onClick={() => { setMono(true); control.current('mono'); }}>
            Mono
          </button>
          <button onClick={() => control.current('rotate')} title="Rotate 60°">
            <RotateCw size={13} />
          </button>
        </div>
      </div>
      <div ref={host} className="pb-render-host" aria-hidden="true" title="Drag to orbit 3D view" />
      {failed && (
        <div className="pb-render-fallback">
          <span aria-hidden="true">▤</span>
          <strong>Print studio</strong>
          <p>3D view unavailable on this device.</p>
        </div>
      )}
      <div className="pb-render-footer">
        <span className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-600" />
          Drag to orbit · WebGL2 PBR
        </span>
        <button disabled={failed || playing} onClick={() => control.current('print')}>
          {playing ? 'Feeding paper…' : 'Play paper feed'}
        </button>
      </div>
    </section>
  );
}
