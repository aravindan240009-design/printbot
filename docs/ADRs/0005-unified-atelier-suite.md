# ADR 0005 — One atelier system across all Print Bot interfaces

Date: 2026-10-29

The user explicitly extended the visual scope from the root marketing website to all existing web applications and Windows installer UI. Preserve the monorepo, operational workflows and preexisting uncommitted work. Apply the same design language rather than rebuild each application with unrelated component stacks.

Use local Manrope for controls and body text, local Playfair Display for editorial headings, original folded-paper SVG branding, and consistent 1.65px Lucide strokes. Dark mode uses obsidian, champagne and warm white; light mode uses ivory, bronze and charcoal. Use private static generated concept imagery and subtle architectural linework as theme-specific atmosphere. No external font request or new runtime package is necessary.

Centralize colors, typography, focus/disabled states, buttons/cards/badges, header and appearance controls in packages/ui. Honor an explicit URL theme, then a saved appearance preference, then system appearance. Theme storage contains only appearance. Existing app-local preview persistence is not promoted to authentication or an audit log.

Use existing Motion for restrained depth transitions, GSAP for short staggers, and CSS for hover/entry effects. Reduced motion presents content immediately; queue interfaces do not gain continuous 3D or particle render loops. Existing landing 3D remains isolated. Brand artwork is supplied as SVG to all web apps and PNG/ICO to Tauri so the Windows app and installer share the same identity.

Separate dev ports: landing 5173, customer 5174, desktop 5175, shop 5176, admin 5177, Next platform 3000 (production QA uses 3003 to avoid an existing process). Do not terminate unrelated services. Native build remains the existing bundled GNU/LLVM + Tauri route.

Correct unsupported preview claims without changing API/payment/native behavior. Sample estimates/orders cannot be presented as verified payments or dispatch; unverified hardware/TPM states are explicit. Release blockers remain: production identity/entitlement integration, real hardware, signing, complete license clearance and clean-machine validation. Rebuilt unsigned installers are test artifacts, not production authorization.
