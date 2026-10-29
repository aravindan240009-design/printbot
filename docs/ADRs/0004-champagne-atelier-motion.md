# ADR 0004 — Champagne atelier and automatic printer animation

Date: 2026-10-29. Supersedes ADR 0003's palette and static-scene decision at the user's explicit request.

The user requested a more realistic automatically rotating/printing model, luxury colors, more imagery, animated SVGs, text entrances and scroll transitions. Keep the same root React/Vite app and existing product interactions.

Use obsidian, champagne and ivory, existing OFL Playfair Display with Manrope, a generated editorial WebP, and original SVG art. Imagery is labeled concept imagery. Do not represent it as a customer installation. No new runtime packages, remote models, textures, paid SDKs or production API requirements are introduced.

Model distinct plastic shells, glass, reflective metal trim, paper stack, lid hinges, touchscreen, vents, tray, feet and curved output sheet. Use procedural RoomEnvironment reflections and limited directional shadow casters, a 256px shadow map, and a maximum 1.25 pixel ratio. A low-amplitude automatic turntable reveals sides without rotating the output away from the visitor. A repeating print illustration advances by elapsed time. Replay resumes motion. Pause stops animations and leaves all page content readable. Offscreen and hidden scenes stop rendering; resume resets frame timing. Geometry/materials/textures/environment/shadow resources are disposed.

The user explicitly requested continuous visible animation, so demand-only rendering is no longer sufficient. Mobile retains a compositor-animated 2D poster; reduced-motion and Save-Data skip WebGL. CSS handles staggered headlines, image curtains/scale, SVG line drawing/orbiting, signature and section entrances. Native scrolling and existing one-plan/tenant/payment product facts remain unchanged.

Real hardware appearance is an artistic illustration, not a certified model or physical printer simulation. Do not claim measured 60 FPS or production readiness from local browser checks.
