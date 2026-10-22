---
name: threejs-r3f-engineering
description: Guidelines for high-performance Three.js, React Three Fiber (R3F), Drei, shader optimization, asset compression, and frameloop management.
---

# Three.js & React Three Fiber (R3F) Engineering Skill

## Core Principles
1. **Demand-Driven Rendering**:
   - For dashboards and interactive product previews, set `<Canvas frameloop="demand">`.
   - Never run a 60fps continuous requestAnimationFrame loop if the scene is static. Only invalidate frames on user interaction or state change (`invalidate()`).
2. **Asset Optimization**:
   - Use `.glb` format compressed with Draco or Meshopt (`gltf-transform`).
   - Limit texture resolutions (1024x1024 or 2048x2048 maximum).
   - Use WebP or KTX2 texture formats.
3. **Memory & Cleanup Management**:
   - Explicitly dispose geometries, materials, and textures when 3D components unmount:
     ```tsx
     useEffect(() => {
       return () => {
         geometry.dispose();
         material.dispose();
       };
     }, []);
     ```
4. **Lighting & Shaders**:
   - Prefer baking ambient occlusion into textures over expensive dynamic point lights.
   - Limit real-time shadow-casting lights to 1 directional light with tuned shadow maps.
5. **Fallback & Accessibility**:
   - Always render an accessible 2D poster / static render fallback for mobile low-power devices and clients without WebGL2.
