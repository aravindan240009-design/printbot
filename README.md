# Print Bot — Official Desktop Printing Landing Page

The official, production-ready, responsive marketing and download landing page for **Print Bot**, a multi-tenant print-shop SaaS platform designed for high-traffic photocopy centers. Print Bot connects walk-in smartphone customers directly to a local shop Windows print workstation without requiring customer app installations or manual counter file transfers.

Built strictly according to the **Print Bot Master Technical Architecture Specification** and styled with a crisp, modern **White Theme** inspired by leading Indian print shop SaaS platforms (like ApnaPrinter), passing all Taste Skill audits.

---

## 1. Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript 5
- **Styling**: Vanilla CSS with strict design tokens, fluid typography clamp scales, and zero generic CSS frameworks (no Tailwind)
- **Quality Assurance**: Automated linter (`lint.mjs`) and automated browser visual inspector (`inspect.mjs`)

---

## 2. Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or later (v20+ or v22+ recommended)
- **Package Manager**: `npm` (included with Node.js)

### Installation

Clone or open the repository in your terminal and install dependencies:

```bash
npm install
```

### Running Locally (Development Server)

Start the Vite development server with hot-module replacement (HMR):

```bash
npm run dev
```

By default, Vite will start at `http://localhost:5173/`. Open this URL in your web browser.

---

## 3. Building for Production

To perform a clean TypeScript type check and compile an optimized production static bundle into `dist/`:

```bash
npm run build
```

To preview the built static bundle locally:

```bash
npm run preview
```

---

## 4. Quality & Art Direction Audits

The project includes strict automated scripts under `.agents/skills/design-taste-frontend/scripts/`:

```bash
# 1. Type check without emitting files
npm run typecheck

# 2. Taste-Skill Static Linter (enforces no generic gradients, no static box-shadows, no hairline borders outside tables/UI)
npm run lint

# 3. Taste-Skill Visual Inspector (launches headless browser to verify 1440px desktop, 768px tablet, 390px mobile viewports, zero side-scrolling, motion count, and headline wrapping)
npm run inspect
```

Both tests currently pass with **0 FAIL and 0 WARN**.

---

## 5. Configuring the Real Windows Installer URL

Print Bot uses an environment variable to connect the download buttons to the authentic, signed Windows installer executable (`.exe`).

### Setup Instructions

1. Copy the provided `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and set `VITE_WINDOWS_INSTALLER_URL` to the public HTTPS URL of your signed `.exe` release:
   ```env
   VITE_WINDOWS_INSTALLER_URL=https://releases.printbot.app/v1.0.0/PrintBot-Setup-x64.exe
   ```
3. Rebuild the application for production (`npm run build`) or restart the dev server.

### Safety & Fallback Behavior

- **When `VITE_WINDOWS_INSTALLER_URL` is configured with a valid HTTPS `.exe` URL**: Clicking any "Download for Windows" button will navigate directly to the trusted release binary.
- **When `VITE_WINDOWS_INSTALLER_URL` is empty, unset, or invalid**: The download buttons will display "Windows Installer (Pilot)". Clicking the button opens an accessible, informative dialog explaining that the public Windows installer is currently in a closed commercial pilot and outlines the 4-step setup instructions.
- **Malformed / Unsafe URLs**: Any URL that does not begin with `https://` or does not end with `.exe` is rejected by `src/utils/installer.ts`, preventing unverified protocols or unsafe third-party redirects.

---

## 6. What is Required Before Publishing

1. **Host the Signed Windows Installer**: Upload the verified Tauri 2 / Rust installer executable (`PrintBot-Setup-x64.exe`) to a CDN or release repository (e.g., GitHub Releases, AWS S3, or Cloudflare R2).
2. **Set the Environment Variable**: In your deployment host settings (e.g. Cloudflare Pages, Vercel, Netlify), add the environment variable `VITE_WINDOWS_INSTALLER_URL`.
3. **Verify Domain & DNS**: Point your custom domain (e.g. `printbot.app`) to your static hosting provider.
4. **Final Smoke Test**: Verify that clicking the download button initiates the download of the authentic `.exe` installer.

---

## 7. Deployment Guide

Because the project builds into standard static HTML, CSS, and JS files in the `dist/` folder, it can be deployed to any static host:

### Cloudflare Pages
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Environment variables**: Add `VITE_WINDOWS_INSTALLER_URL` under Settings -> Environment Variables.

### Vercel / Netlify
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Environment variables**: Add `VITE_WINDOWS_INSTALLER_URL` in the Project Dashboard.

### AWS S3 + CloudFront / GitHub Pages
- Run `npm run build` with `VITE_WINDOWS_INSTALLER_URL` set during the CI/CD pipeline step, then sync the `dist/` folder to the target bucket.

---

## 8. Project Structure

```
d:/print bot/
├── .agents/skills/design-taste-frontend/  # Anti-slop frontend skill & automated audit scripts
├── public/
│   ├── assets/
│   │   ├── print_shop_counter.jpg       # Authentic documentary photography of photocopy center
│   │   ├── printer_hardware_fleet.jpg   # Fleet photo showing commercial printer hardware
│   │   └── printing_press.webm          # Looping industrial printing press video footage
│   └── favicon.svg                      # Custom monochrome Print Bot brand mark
├── src/
│   ├── components/
│   │   ├── Navbar.tsx                   # Semantic header with accessible keyboard-nav mobile drawer
│   │   ├── Hero.tsx                     # 2-line headline, CTAs, and interactive [data-ui] simulator
│   │   ├── Intro.tsx                    # 4 architectural pillars and commercial counter proof
│   │   ├── HowItWorks.tsx               # 4-stage interactive workflow switcher with live previews
│   │   ├── Features.tsx                 # Full-Auto/Manual modes, TPM pairing, Win32 spooler, video
│   │   ├── DownloadSection.tsx          # Windows download card, 4-step setup instructions, pilot status
│   │   ├── Requirements.tsx             # System requirements table from master spec
│   │   ├── Faq.tsx                      # Accessible <details> accordion with sticky sidebar
│   │   ├── CtaSection.tsx               # Closing headline and download action
│   │   ├── Footer.tsx                   # Single baseline with brand, links, and architecture v1.0
│   │   └── InstallerModal.tsx           # Accessible pilot status dialog for unconfigured installer
│   ├── utils/
│   │   └── installer.ts                 # Safe HTTPS .exe validator and environment reader
│   ├── App.tsx                          # Root layout with IntersectionObserver reveals
│   ├── index.css                        # Design tokens, reset, typography clamp scales, [data-ui]
│   ├── main.tsx                         # React 18 DOM mount
│   └── vite-env.d.ts                    # Vite TypeScript environment definitions
├── .env.example                         # Template for Windows installer URL configuration
├── index.html                           # SEO meta tags, OpenGraph tags, Google Archivo font
├── package.json                         # Dependencies and npm scripts
├── tsconfig.json                        # Strict TypeScript compiler options
└── vite.config.ts                       # Vite build configuration with relative assets base
```
