# Minimal Print Configurator Design

**Status:** Approved design; implementation not started
**Date:** 2026-11-17

## Understanding summary

- Simplify the customer print-configuration step to match the supplied compact reference.
- Preserve the existing upload, print options, live pricing, checkout, and tracking behavior.
- Keep the embedded `/today` app and standalone customer app consistent.
- Add a real local preview for PDF and image files, including PDF page navigation.
- Keep unsupported Office formats usable with a clear preview-unavailable fallback.
- Make the layout responsive, accessible, and usable without adding a preview service.

## Assumptions

- The selected local `File` remains the source for preview rendering; no new upload or retention behavior is introduced.
- PDF.js is acceptable as a client-side rendering dependency because the apps do not currently have a document renderer.
- Existing password-unlock behavior remains the path for encrypted PDFs.
- Existing current file-size limits and customer volume remain unchanged.
- Only the active PDF page is rendered; Office-to-PDF conversion and thumbnail generation are out of scope.

## Decision log

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| Add a compact PDF/image preview with page navigation. | Compact settings only; browser-native PDF viewer. | Closest to the reference and gives consistent page controls without relying on browser-specific viewer behavior. |
| Render previews locally with PDF.js; use existing image data for images. | Add a server-side document conversion service. | Avoids new backend, file transfer, and privacy/operational scope. |
| Show a clear preview-unavailable fallback for Office formats. | Add Office conversion or claim unsupported rendering. | Conversion is outside this UI change; a truthful fallback preserves file configuration and checkout. |
| Keep frequently used settings visible and group paper weight, finishing, N-up/photo presets, and page range under “More options.” | Remove less-used settings. | Simplifies the screen without removing existing controls or pricing behavior. |
| Keep live total and Proceed action readily available; use a compact sticky action bar on narrow screens. | Leave the full quote card as the primary layout. | Matches the reference while retaining the current checkout action. |
| Keep both customer app entry points aligned. | Change only the embedded `/today` app. | Avoids inconsistent customer experiences. |

## Design

On larger screens, show print settings alongside a document preview. On phones, stack the content and keep the total and Proceed action easy to reach. Keep the active file name and page count visible. PDF preview uses the existing local file, renders only the current page, and provides previous/next controls. Images display as one-page previews. Office files retain their file details and settings but display a clear preview-unavailable message.

Frequently used controls (color, copies, duplex, paper size, and orientation) remain directly visible. Preserve all other existing controls inside a keyboard-accessible “More options” disclosure. Every option continues updating the live quote and retains its current per-file behavior.

Show loading, parsing, and rendering errors explicitly. A preview failure must not block settings, pricing, or checkout. Password-protected PDFs continue through the existing unlock flow. Clean up temporary browser resources when a file is changed or removed. Do not send file data to a new service.

## Non-goals and risks

- No changes to upload limits, backend APIs, checkout, tracking, or print execution.
- No Office conversion, server-side preview, or new file retention.
- PDF.js adds client bundle weight and PDF rendering can be expensive for large files; render only the active page and report failures clearly.
- Invalid, encrypted, or unsupported files may not render; those states must not be presented as a successful preview.

## Acceptance checks

- A multi-page PDF renders and navigates correctly at the first, middle, and last pages.
- Images preview as a single page; Office files show the fallback.
- File switching/removal updates and cleans up the preview.
- Password-protected and invalid PDFs show appropriate states; preview errors do not affect settings, quote, or checkout.
- Existing print options still update the live quote and retain per-file selections.
- The screen has no horizontal overflow at phone, tablet, and desktop widths; controls work by keyboard with visible focus.
- Root and standalone customer apps pass their build/type-check.
