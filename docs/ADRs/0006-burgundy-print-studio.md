# ADR 0006 — Visible print-studio imagery and cream/burgundy palette

Date: 2026-10-29. Supersedes ADR 0005's background imagery and neutral surface palette at the user's request.

The user found the abstract architectural backgrounds too faint and unrelated to Print Bot. Replace them with two original generated concept photographs of a professional printer producing a burgundy/gold sample print beside paper stock in a print studio. Use a warm cream daytime image for light mode and a burgundy evening image for dark mode. They are illustrations, not certified hardware or customer photographs.

Move imagery into the page-introduction banners, customer welcome and workstation login. Keep form, queue and policy surfaces opaque and readable. Remove the decorative architectural backdrop. On phones, separate banner text above the product-photo strip to avoid text crossing machinery/paper details. The secondary Next site replaces its placeholder hardware telemetry graphic with product imagery.

Use cream #f6efdf, burgundy #792d47 and warm gold; dark surfaces use deep wine #211219. The persistent sidebar is burgundy in both themes, with cream/gold foreground. Use bronze #79551e for small gold-like text on cream: the earlier #a27a3e against #edddc5 measured only 2.92:1. This is a bounded token contrast check, not WCAG certification.

Reuse current framework, fonts, motion and controls. No new dependency/API/converter/authentication behavior. Generate matching SVG/PNG/ICO brand colors and rebuild unsigned installers separately as Burgundy artifacts, preserving prior Atelier builds. Existing signing, hardware, live authorization/payment and license gates remain open.
