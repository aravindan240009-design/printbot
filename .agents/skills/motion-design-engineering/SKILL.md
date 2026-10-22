---
name: motion-design-engineering
description: Standards for Motion for React, GSAP timeline engineering, layout animations, spring physics, and accessible reduced-motion fallbacks.
---

# Motion Design & Animation Engineering Skill

## Animation Architecture
1. **Tool Selection Hierarchy**:
   - **CSS Transitions**: Micro-interactions, button hover states, focus rings, border-color shifts.
   - **Motion for React (`motion/react`)**: Component enters/exits (`AnimatePresence`), layout animations (`layoutId`), gesture springs, interactive modals, tabs.
   - **GSAP / ScrollTrigger**: Multi-stage cinematic timelines, complex SVG path morphing, pinned scroll-driven storytelling.
2. **Motion AI Kit Directives**:
   - Leverage free Motion React capabilities: spring physics, layout animations, gesture handling (`whileHover`, `whileTap`).
   - Reserve paid Motion+ features for advanced commercial extensions requiring explicit authorization.
3. **Accessibility Mandate**:
   - Always query `useReducedMotion()`.
   - When `prefers-reduced-motion` is active:
     - Replace position/scale slides with instantaneous transitions or gentle opacity fades.
     - Never disable functionality when animation is reduced.
4. **Performance Rules**:
   - Animate ONLY composite properties: `transform` (translate, scale, rotate) and `opacity`.
   - NEVER animate layout-triggering properties (`width`, `height`, `top`, `margin`, `padding`).
   - Apply `will-change: transform` sparingly and clean up after animations complete.
