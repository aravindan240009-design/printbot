---
name: frontend-design
description: Guidelines and procedures for creating responsive, accessible, mobile-first web and desktop interfaces with modern React, Tailwind CSS, and Radix UI.
---

# Frontend Design Skill

## Core Principles
1. **Mobile-First Responsiveness**: Design interfaces starting from 360px up to 4K displays.
2. **Design Tokens**: Standardize colors, spacing, typography, and elevation across both Web and Desktop applications.
3. **Motion & Feedback**: Micro-interactions with Framer Motion / Motion. Respect `prefers-reduced-motion`.
4. **State Clarity**: Distinct, polished UI states for loading, error, empty, active, and disabled scenarios.

## Execution Checklist
- [ ] Viewport testing at 375px (mobile), 768px (tablet), 1280px (desktop), 1920px (workstation).
- [ ] Accessible color contrast ratio (minimum 4.5:1 for standard text, 3:1 for large text).
- [ ] Full keyboard navigation with visible focus rings (`focus-visible:ring-2`).
- [ ] Dynamic optimistic updates for print job configurations and price totals.
