import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';
import { Sparkles, Printer } from 'lucide-react';

/**
 * Specimen 01: High-Precision A3 CAD Engineering & Architectural Blueprint Specimen
 * Demonstrates 0.1pt hairline vector rendering, dimensional accuracy, and 0% margin clipping.
 */
export function CadBlueprintArtwork() {
  return (
    <motion.svg
      className="print-artwork artwork-blueprint"
      viewBox="0 0 440 540"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="High-precision A3 CAD engineering elevation blueprint specimen"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <defs>
        {/* Metric Grid Pattern */}
        <pattern id="cad-grid-minor" width="10" height="10" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="10" y2="0" stroke="#e4d7c3" strokeWidth="0.5" opacity="0.6" />
          <line x1="0" y1="0" x2="0" y2="10" stroke="#e4d7c3" strokeWidth="0.5" opacity="0.6" />
        </pattern>
        <pattern id="cad-grid-major" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="url(#cad-grid-minor)" />
          <line x1="0" y1="0" x2="40" y2="0" stroke="#d5c3aa" strokeWidth="0.9" opacity="0.75" />
          <line x1="0" y1="0" x2="0" y2="40" stroke="#d5c3aa" strokeWidth="0.9" opacity="0.75" />
        </pattern>
        {/* Foundation & Sub-grade Hatch Pattern */}
        <pattern id="cad-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#a38f75" strokeWidth="0.8" opacity="0.5" />
        </pattern>
      </defs>

      {/* Warm Ivory Bond Paper Base */}
      <rect width="440" height="540" fill="#f4ebd9" />
      <rect width="440" height="540" fill="url(#cad-grid-major)" />

      {/* Sheet Border & Neatline */}
      <rect x="18" y="18" width="404" height="504" fill="none" stroke="#463828" strokeWidth="1.6" />
      <rect x="22" y="22" width="396" height="496" fill="none" stroke="#87745f" strokeWidth="0.6" />

      {/* Printer Registration Marks (Corners) */}
      <g stroke="#685542" strokeWidth="0.75" fill="none">
        {/* Top Left */}
        <circle cx="10" cy="10" r="4" />
        <line x1="4" y1="10" x2="16" y2="10" />
        <line x1="10" y1="4" x2="10" y2="16" />
        {/* Top Right */}
        <circle cx="430" cy="10" r="4" />
        <line x1="424" y1="10" x2="436" y2="10" />
        <line x1="430" y1="4" x2="430" y2="16" />
        {/* Bottom Left */}
        <circle cx="10" cy="530" r="4" />
        <line x1="4" y1="530" x2="16" y2="530" />
        <line x1="10" y1="524" x2="10" y2="536" />
        {/* Bottom Right */}
        <circle cx="430" cy="530" r="4" />
        <line x1="424" y1="530" x2="436" y2="530" />
        <line x1="430" y1="524" x2="430" y2="536" />
      </g>

      {/* Header Banner on Drawing */}
      <text x="32" y="42" fill="#5c4b37" fontSize="8.5" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
        PRINT BOT CALIBRATION SPECIMEN #01 · WIN32 NATIVE EMF
      </text>
      <text x="32" y="55" fill="#88735b" fontSize="7" fontFamily="monospace" letterSpacing="1">
        FORMAT: A3 METRIC · SCALE 1:50 · RES: 1200 DPI VECTOR PASS
      </text>

      {/* Architectural Elevation Drawing Area */}
      <g className="cad-geometry" stroke="#372b1e" strokeWidth="1" fill="none">
        {/* Structural Grid Bubble Markers at Top */}
        <g fontSize="7.5" fontFamily="monospace" textAnchor="middle" fill="#584836" stroke="none">
          <circle cx="65" cy="78" r="8" fill="#ede1cc" stroke="#372b1e" strokeWidth="0.9" />
          <text x="65" y="81">A</text>
          <circle cx="160" cy="78" r="8" fill="#ede1cc" stroke="#372b1e" strokeWidth="0.9" />
          <text x="160" y="81">B</text>
          <circle cx="260" cy="78" r="8" fill="#ede1cc" stroke="#372b1e" strokeWidth="0.9" />
          <text x="260" y="81">C</text>
          <circle cx="355" cy="78" r="8" fill="#ede1cc" stroke="#372b1e" strokeWidth="0.9" />
          <text x="355" y="81">D</text>
        </g>

        {/* Centerline Grid Lines (Dashed) */}
        <g stroke="#9f886d" strokeWidth="0.6" strokeDasharray="6 3 2 3">
          <line x1="65" y1="88" x2="65" y2="340" />
          <line x1="160" y1="88" x2="160" y2="340" />
          <line x1="260" y1="88" x2="260" y2="340" />
          <line x1="355" y1="88" x2="355" y2="340" />
        </g>

        {/* Dimension String - Top */}
        <g stroke="#6e5b47" strokeWidth="0.75" fill="#6e5b47" fontSize="7" fontFamily="monospace" textAnchor="middle">
          <line x1="65" y1="102" x2="355" y2="102" />
          <line x1="65" y1="98" x2="65" y2="106" />
          <line x1="160" y1="98" x2="160" y2="106" />
          <line x1="260" y1="98" x2="260" y2="106" />
          <line x1="355" y1="98" x2="355" y2="106" />
          <text x="112.5" y="99" stroke="none">4,750</text>
          <text x="210" y="99" stroke="none">5,000</text>
          <text x="307.5" y="99" stroke="none">4,750</text>
        </g>

        {/* Roof Truss Structure */}
        <polygon points="50,165 210,120 370,165" stroke="#372b1e" strokeWidth="1.4" fill="none" />
        <line x1="210" y1="120" x2="210" y2="165" stroke="#4a3b2b" strokeWidth="1" />
        <line x1="130" y1="142" x2="130" y2="165" stroke="#4a3b2b" strokeWidth="0.8" />
        <line x1="290" y1="142" x2="290" y2="165" stroke="#4a3b2b" strokeWidth="0.8" />
        <line x1="130" y1="142" x2="210" y2="165" stroke="#4a3b2b" strokeWidth="0.6" strokeDasharray="3 2" />
        <line x1="290" y1="142" x2="210" y2="165" stroke="#4a3b2b" strokeWidth="0.6" strokeDasharray="3 2" />

        {/* Main Floor Slabs */}
        <rect x="46" y="165" width="328" height="10" fill="#e5d5be" stroke="#372b1e" strokeWidth="1.2" />
        <rect x="46" y="235" width="328" height="9" fill="#e5d5be" stroke="#372b1e" strokeWidth="1.2" />
        <rect x="42" y="305" width="336" height="12" fill="#ded0ba" stroke="#372b1e" strokeWidth="1.4" />

        {/* Foundation & Sub-grade Hatch */}
        <rect x="36" y="317" width="348" height="24" fill="url(#cad-hatch)" stroke="#372b1e" strokeWidth="1" />
        <line x1="30" y1="317" x2="390" y2="317" stroke="#251d13" strokeWidth="1.8" />
        <text x="394" y="321" fill="#67533f" stroke="none" fontSize="6.5" fontFamily="monospace">▼ EL ±0.000</text>

        {/* Structural Columns */}
        <rect x="60" y="175" width="10" height="60" fill="#dfcfb8" stroke="#372b1e" strokeWidth="1" />
        <rect x="155" y="175" width="10" height="60" fill="#dfcfb8" stroke="#372b1e" strokeWidth="1" />
        <rect x="255" y="175" width="10" height="60" fill="#dfcfb8" stroke="#372b1e" strokeWidth="1" />
        <rect x="350" y="175" width="10" height="60" fill="#dfcfb8" stroke="#372b1e" strokeWidth="1" />

        <rect x="60" y="244" width="10" height="61" fill="#dfcfb8" stroke="#372b1e" strokeWidth="1" />
        <rect x="155" y="244" width="10" height="61" fill="#dfcfb8" stroke="#372b1e" strokeWidth="1" />
        <rect x="255" y="244" width="10" height="61" fill="#dfcfb8" stroke="#372b1e" strokeWidth="1" />
        <rect x="350" y="244" width="10" height="61" fill="#dfcfb8" stroke="#372b1e" strokeWidth="1" />

        {/* Glazing / Curtain Wall Panels with Louver Lines */}
        <g stroke="#564634" strokeWidth="0.7">
          <rect x="80" y="183" width="65" height="44" fill="#eedfc8" />
          <line x1="112.5" y1="183" x2="112.5" y2="227" strokeWidth="0.6" />
          <line x1="80" y1="198" x2="145" y2="198" strokeWidth="0.5" strokeDasharray="2 2" />

          <rect x="175" y="183" width="70" height="44" fill="#eedfc8" />
          <line x1="210" y1="183" x2="210" y2="227" strokeWidth="0.6" />
          <line x1="175" y1="198" x2="245" y2="198" strokeWidth="0.5" strokeDasharray="2 2" />

          <rect x="275" y="183" width="65" height="44" fill="#eedfc8" />
          <line x1="307.5" y1="183" x2="307.5" y2="227" strokeWidth="0.6" />
          <line x1="275" y1="198" x2="340" y2="198" strokeWidth="0.5" strokeDasharray="2 2" />
        </g>

        {/* Ground Floor Entrance & Double Doors */}
        <g stroke="#564634" strokeWidth="0.7">
          <rect x="80" y="252" width="65" height="53" fill="#eedfc8" />
          <rect x="180" y="252" width="60" height="53" fill="#e7d6be" stroke="#372b1e" strokeWidth="1" />
          <line x1="210" y1="252" x2="210" y2="305" stroke="#372b1e" strokeWidth="0.9" />
          <circle cx="206" cy="280" r="1.5" fill="#372b1e" />
          <circle cx="214" cy="280" r="1.5" fill="#372b1e" />
          <path d="M 180 305 A 30 30 0 0 1 210 275" stroke="#87715b" strokeWidth="0.6" strokeDasharray="2 2" />
          <rect x="275" y="252" width="65" height="53" fill="#eedfc8" />
        </g>
      </g>

      {/* Elevation Height Marker Flags (Left Edge) */}
      <g fontSize="6.5" fontFamily="monospace" fill="#584836" textAnchor="end">
        <path d="M 38 165 L 30 161 L 30 169 Z" fill="#463828" />
        <text x="28" y="167">+10.80m</text>
        <path d="M 38 235 L 30 231 L 30 239 Z" fill="#463828" />
        <text x="28" y="237">+7.20m</text>
        <path d="M 38 305 L 30 301 L 30 309 Z" fill="#463828" />
        <text x="28" y="307">+3.60m</text>
      </g>

      {/* Engineer Approval Red/Burgundy Stamp (Left) */}
      <g transform="translate(80, 395) rotate(-6)">
        <circle cx="0" cy="0" r="28" fill="none" stroke="#8d2938" strokeWidth="1.3" strokeDasharray="4 2" />
        <circle cx="0" cy="0" r="23" fill="none" stroke="#8d2938" strokeWidth="0.75" />
        <text x="0" y="-12" textAnchor="middle" fill="#8d2938" fontSize="5.5" fontFamily="sans-serif" fontWeight="bold" letterSpacing="0.8">
          ★ STRUCTURAL DESIGNS ★
        </text>
        <text x="0" y="-1" textAnchor="middle" fill="#8d2938" fontSize="8" fontFamily="sans-serif" fontWeight="900" letterSpacing="0.5">
          APPROVED
        </text>
        <text x="0" y="9" textAnchor="middle" fill="#8d2938" fontSize="5.5" fontFamily="sans-serif" fontWeight="bold">
          ZERO SPOOL CUT
        </text>
        <text x="0" y="17" textAnchor="middle" fill="#8d2938" fontSize="4.5" fontFamily="monospace">
          PRINT BOT OS v2.4
        </text>
      </g>

      {/* ISO CAD Title Block (Bottom Right) */}
      <g transform="translate(170, 355)">
        <rect x="0" y="0" width="245" height="78" fill="#f7f1e4" stroke="#463828" strokeWidth="1.2" />
        <line x1="0" y1="20" x2="245" y2="20" stroke="#87745f" strokeWidth="0.75" />
        <line x1="0" y1="46" x2="245" y2="46" stroke="#87745f" strokeWidth="0.75" />
        <line x1="0" y1="62" x2="245" y2="62" stroke="#87745f" strokeWidth="0.75" />
        <line x1="140" y1="20" x2="140" y2="62" stroke="#87745f" strokeWidth="0.75" />
        <line x1="70" y1="62" x2="70" y2="78" stroke="#87745f" strokeWidth="0.75" />
        <line x1="160" y1="62" x2="160" y2="78" stroke="#87745f" strokeWidth="0.75" />

        <text x="8" y="10" fill="#7d674f" fontSize="5.5" fontFamily="sans-serif" fontWeight="bold">PROJECT:</text>
        <text x="8" y="17" fill="#2d2217" fontSize="7" fontFamily="sans-serif" fontWeight="bold">METRO TERMINAL SOUTH CONCOURSE</text>

        <text x="8" y="30" fill="#7d674f" fontSize="5.5" fontFamily="sans-serif" fontWeight="bold">DRAWING:</text>
        <text x="8" y="39" fill="#2d2217" fontSize="7" fontFamily="sans-serif" fontWeight="bold">NORTH ELEVATION & GRID B-B</text>

        <text x="148" y="30" fill="#7d674f" fontSize="5.5" fontFamily="sans-serif" fontWeight="bold">RENDER ENGINE:</text>
        <text x="148" y="39" fill="#2d2217" fontSize="6.5" fontFamily="monospace" fontWeight="bold">winspool.drv RAW</text>

        <text x="8" y="54" fill="#7d674f" fontSize="5.5" fontFamily="sans-serif">SCALE: <tspan fill="#2d2217" fontWeight="bold">1:50 @ A3</tspan></text>
        <text x="148" y="54" fill="#7d674f" fontSize="5.5" fontFamily="sans-serif">DWG: <tspan fill="#2d2217" fontWeight="bold">A3-ARC-104</tspan></text>

        <text x="8" y="72" fill="#7d674f" fontSize="5" fontFamily="sans-serif">REV: <tspan fill="#2d2217" fontWeight="bold">04</tspan></text>
        <text x="78" y="72" fill="#7d674f" fontSize="5" fontFamily="sans-serif">DATE: <tspan fill="#2d2217" fontWeight="bold">OCT 2026</tspan></text>
        <text x="168" y="72" fill="#8d2938" fontSize="5.5" fontFamily="monospace" fontWeight="bold">100% SCALE VERIFIED</text>
      </g>

      {/* Main Specimen Title & Subtitle at Bottom */}
      <text x="32" y="474" fill="#241c14" fontSize="33" fontFamily="Georgia,serif">
        A3 CAD & Blueprints.
      </text>
      <text x="34" y="504" fill="#6d5841" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" letterSpacing="1.8">
        0.1PT VECTOR HAIRLINES · ZERO MARGIN CLIPPING
      </text>
    </motion.svg>
  );
}

/**
 * Specimen 02: High-Prestige Gold Foil Embossed Academic Thesis & Certification Folio
 * Demonstrates metallic foil rendering, high-density CMYK accuracy, and front-to-back duplex calibration.
 */
export function ThesisCertificateArtwork() {
  return (
    <motion.svg
      className="print-artwork artwork-thesis"
      viewBox="0 0 440 540"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="High-prestige gold foil embossed academic thesis and legal bond certification specimen"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <defs>
        <linearGradient id="gold-foil-primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#edd4a3" />
          <stop offset="25%" stopColor="#c59d60" />
          <stop offset="50%" stopColor="#f7e6c4" />
          <stop offset="75%" stopColor="#a88043" />
          <stop offset="100%" stopColor="#ecd3a1" />
        </linearGradient>

        <pattern id="thesis-paper-grain" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.4" fill="#dfc699" opacity="0.18" />
          <circle cx="4" cy="4" r="0.4" fill="#edd6a6" opacity="0.12" />
        </pattern>
      </defs>

      {/* Deep Obsidian Bond / Leatherette Base */}
      <rect width="440" height="540" fill="#181116" />
      <rect width="440" height="540" fill="url(#thesis-paper-grain)" />

      {/* Outer Guilloche & Gold Border */}
      <rect x="18" y="18" width="404" height="504" fill="none" stroke="url(#gold-foil-primary)" strokeWidth="1.8" />
      <rect x="23" y="23" width="394" height="494" fill="none" stroke="url(#gold-foil-primary)" strokeWidth="0.6" strokeDasharray="4 2" />

      {/* 4-Corner Printer Registration Marks (CMYK) */}
      <g strokeWidth="0.75" fill="none">
        {/* Top Left - Cyan */}
        <circle cx="10" cy="10" r="4" stroke="#00aeef" />
        <line x1="4" y1="10" x2="16" y2="10" stroke="#00aeef" />
        <line x1="10" y1="4" x2="10" y2="16" stroke="#00aeef" />
        {/* Top Right - Magenta */}
        <circle cx="430" cy="10" r="4" stroke="#ec008c" />
        <line x1="424" y1="10" x2="436" y2="10" stroke="#ec008c" />
        <line x1="430" y1="4" x2="430" y2="16" stroke="#ec008c" />
        {/* Bottom Left - Yellow */}
        <circle cx="10" cy="530" r="4" stroke="#fff200" />
        <line x1="4" y1="530" x2="16" y2="530" stroke="#fff200" />
        <line x1="10" y1="524" x2="10" y2="536" stroke="#fff200" />
        {/* Bottom Right - Registration Key */}
        <circle cx="430" cy="530" r="4" stroke="#f6efdf" />
        <line x1="424" y1="530" x2="436" y2="530" stroke="#f6efdf" />
        <line x1="430" y1="524" x2="430" y2="536" stroke="#f6efdf" />
      </g>

      {/* CMYK Color Density Bar on Right Edge */}
      <g transform="translate(422, 170)">
        <rect x="0" y="0" width="5" height="18" fill="#00aeef" />
        <rect x="0" y="22" width="5" height="18" fill="#ec008c" />
        <rect x="0" y="44" width="5" height="18" fill="#fff200" />
        <rect x="0" y="66" width="5" height="18" fill="#231f20" stroke="#443" strokeWidth="0.5" />
        <rect x="0" y="88" width="5" height="18" fill="url(#gold-foil-primary)" />
        <text x="-4" y="58" fill="#88735b" fontSize="5" fontFamily="monospace" transform="rotate(-90 -4 58)" textAnchor="middle">
          CMYK+SPOT FOIL
        </text>
      </g>

      {/* Top Header Label */}
      <text x="32" y="42" fill="#d9be8c" fontSize="8.5" fontFamily="monospace" fontWeight="bold" letterSpacing="1.5">
        PRINT BOT CALIBRATION SPECIMEN #02 · FOIL & DUPLEX
      </text>
      <text x="32" y="55" fill="#a48c64" fontSize="7" fontFamily="monospace" letterSpacing="1">
        PAPER: 300 GSM ROYAL OBSIDIAN · CMYK + EMBOSSED METALLIC
      </text>

      {/* University Gold Crest (Top Center) */}
      <g transform="translate(220, 115)" stroke="url(#gold-foil-primary)" fill="none">
        <path d="M -22 -22 L 22 -22 L 22 4 C 22 18 0 30 0 30 C 0 30 -22 18 -22 4 Z" strokeWidth="1.2" fill="rgba(237,212,163,0.06)" />
        <path d="M -13 -6 C -7 -10 0 -8 0 -8 C 0 -8 7 -10 13 -6 L 13 8 C 7 5 0 6 0 6 C 0 6 -7 5 -13 8 Z" strokeWidth="0.9" />
        <line x1="0" y1="-8" x2="0" y2="6" strokeWidth="0.9" />
        <polygon points="0,-18 3,-13 8,-13 4,-10 6,-5 0,-8 -6,-5 -4,-10 -8,-13 -3,-13" strokeWidth="0.8" fill="url(#gold-foil-primary)" />
        <path d="M -26 12 C -34 4 -32 -12 -25 -20" strokeWidth="1" strokeDasharray="3 2" />
        <path d="M 26 12 C 34 4 32 -12 25 -20" strokeWidth="1" strokeDasharray="3 2" />
      </g>

      {/* Academic Institution Hierarchy (Gold Foil Typography) */}
      <g textAnchor="middle" fill="url(#gold-foil-primary)">
        <text x="220" y="166" fontSize="9.5" fontFamily="Georgia,serif" fontWeight="bold" letterSpacing="2.5">
          ANNA UNIVERSITY CHENNAI
        </text>
        <text x="220" y="180" fontSize="7.5" fontFamily="sans-serif" letterSpacing="1.8" fill="#cbb387">
          FACULTY OF ENGINEERING & TECHNOLOGY
        </text>
        <text x="220" y="194" fontSize="7" fontFamily="sans-serif" letterSpacing="1.2" fill="#aa9369">
          DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
        </text>

        {/* Decorative Ornamental Divider */}
        <g stroke="url(#gold-foil-primary)" strokeWidth="0.75" fill="none">
          <line x1="120" y1="206" x2="195" y2="206" />
          <polygon points="220,203 223,206 220,209 217,206" fill="url(#gold-foil-primary)" stroke="none" />
          <line x1="245" y1="206" x2="320" y2="206" />
        </g>

        {/* Project Thesis Title */}
        <text x="220" y="232" fontSize="16" fontFamily="Georgia,serif" fontWeight="bold" letterSpacing="0.8">
          AUTONOMOUS EMBEDDED PRINT PIPELINES
        </text>
        <text x="220" y="252" fontSize="10.5" fontFamily="Georgia,serif" fontStyle="italic" letterSpacing="0.5" fill="#eed5a5">
          Zero-Spool-Cut Hardware Driver Synchronization
        </text>

        {/* Submission Clause */}
        <text x="220" y="282" fontSize="7" fontFamily="sans-serif" letterSpacing="1.2" fill="#aa9369">
          A DISSERTATION SUBMITTED IN PARTIAL FULFILLMENT OF
        </text>
        <text x="220" y="294" fontSize="7.5" fontFamily="sans-serif" fontWeight="bold" letterSpacing="1.4" fill="#d9be8c">
          THE REQUIREMENTS FOR THE DEGREE OF
        </text>
        <text x="220" y="310" fontSize="9" fontFamily="Georgia,serif" fontWeight="bold" letterSpacing="1.5">
          BACHELOR OF ENGINEERING
        </text>

        {/* Candidate Details */}
        <g fontSize="7.5" fontFamily="monospace" fill="#cbb387">
          <text x="220" y="336">SUBMITTED BY: <tspan fontWeight="bold" fill="url(#gold-foil-primary)">R. ARUN KUMAR</tspan></text>
          <text x="220" y="348">REGISTER NUMBER: <tspan fontWeight="bold" fill="url(#gold-foil-primary)">312421104052</tspan></text>
        </g>
      </g>

      {/* Embossed Gold Foil Notary / University Seal (Bottom Center) */}
      <g transform="translate(220, 396)">
        <circle cx="0" cy="0" r="26" fill="rgba(237,212,163,0.08)" stroke="url(#gold-foil-primary)" strokeWidth="1.2" />
        <circle cx="0" cy="0" r="21" fill="none" stroke="url(#gold-foil-primary)" strokeWidth="0.75" strokeDasharray="2 1.5" />
        <circle cx="0" cy="0" r="17" fill="none" stroke="url(#gold-foil-primary)" strokeWidth="0.6" />
        {Array.from({ length: 16 }, (_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2="21"
            y2="0"
            stroke="url(#gold-foil-primary)"
            strokeWidth="0.4"
            opacity="0.4"
            transform={`rotate(${i * 22.5})`}
          />
        ))}
        <text x="0" y="-8" textAnchor="middle" fill="url(#gold-foil-primary)" fontSize="5" fontFamily="sans-serif" fontWeight="bold" letterSpacing="0.8">
          ★ OFFICIAL EMBOSS ★
        </text>
        <text x="0" y="2" textAnchor="middle" fill="#fff" fontSize="7" fontFamily="sans-serif" fontWeight="900" letterSpacing="0.8">
          PRINT BOT
        </text>
        <text x="0" y="10" textAnchor="middle" fill="url(#gold-foil-primary)" fontSize="5" fontFamily="sans-serif" fontWeight="bold">
          CERTIFIED DUPLEX
        </text>
      </g>

      {/* Main Specimen Title & Subtitle at Bottom */}
      <text x="32" y="474" fill="#f8eedc" fontSize="33" fontFamily="Georgia,serif">
        Thesis & Folios.
      </text>
      <text x="34" y="504" fill="#caa46a" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold" letterSpacing="1.8">
        METALLIC FOIL EMBOSSING · TRUE FRONT-TO-BACK REGISTER
      </text>
    </motion.svg>
  );
}

// Backward-compatibility wrapper for any other component imports
export function PrintArtwork({ variant = 'arch' }: { variant?: 'arch' | 'orbit' }) {
  return variant === 'arch' ? <CadBlueprintArtwork /> : <ThesisCertificateArtwork />;
}

export function LuxuryEditorial() {
  const photoRef = useRef<HTMLDivElement>(null);
  const [isPhotoHovered, setIsPhotoHovered] = useState(false);

  // 3D Perspective Tilt on Mouse Movement
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateXSpring = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), { stiffness: 250, damping: 25 });
  const rotateYSpring = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), { stiffness: 250, damping: 25 });
  const glareX = useSpring(useTransform(x, [-0.5, 0.5], [0, 100]), { stiffness: 250, damping: 25 });
  const glareY = useSpring(useTransform(y, [-0.5, 0.5], [0, 100]), { stiffness: 250, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!photoRef.current) return;
    const rect = photoRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsPhotoHovered(false);
  };

  return (
    <section className="editorial-section shell section-space" aria-labelledby="editorial-title">
      {/* Section Heading with Staggered Word Reveal */}
      <motion.div
        className="section-heading"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 id="editorial-title">
          <span className="editorial-line-mask">
            <motion.span
              initial={{ y: '100%', opacity: 0 }}
              whileInView={{ y: '0%', opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'inline-block' }}
            >
              Digital precision.
            </motion.span>
          </span>
          <br />
          <span className="serif-note">
            <motion.span
              initial={{ y: '100%', opacity: 0 }}
              whileInView={{ y: '0%', opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'inline-block' }}
            >
              A tangible feeling.
            </motion.span>
          </span>
        </h2>
        <motion.p
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          For the things worth holding.
          <br />
          And the people who bring them to life.
        </motion.p>
      </motion.div>

      {/* Main Editorial Layout */}
      <div className="editorial-layout">
        {/* Left: 3D Interactive Parallax Photo Frame */}
        <motion.figure
          className="editorial-photo"
          ref={photoRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsPhotoHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            perspective: 1200,
            transformStyle: 'preserve-3d',
          }}
          initial={{ opacity: 0, scale: 0.94, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            className="photo-window"
            style={{
              rotateX: rotateXSpring,
              rotateY: rotateYSpring,
              transformStyle: 'preserve-3d',
              position: 'relative',
              boxShadow: isPhotoHovered
                ? '0 35px 80px -15px rgba(121, 45, 71, 0.28), 0 0 0 1px rgba(226, 193, 139, 0.4)'
                : '0 25px 60px -20px rgba(0, 0, 0, 0.18)',
              transition: 'box-shadow 0.4s ease',
            }}
          >
            {/* Specular Glare Overlay */}
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 3,
                pointerEvents: 'none',
                opacity: isPhotoHovered ? 0.35 : 0,
                transition: 'opacity 0.4s ease',
                background: useTransform(
                  [glareX, glareY],
                  ([gx, gy]) =>
                    `radial-gradient(circle at ${gx}% ${gy}%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 65%)`
                ),
              }}
            />

            {/* High-Resolution Architectural Print Studio Image */}
            <picture>
              <source srcSet="/assets/editorial-tangible-craft.jpg" type="image/jpeg" />
              <img
                src="/assets/editorial-tangible-craft.jpg"
                alt="Bespoke architectural design and print studio table with freshly printed folios, thesis prints, and business cards"
                loading="lazy"
                decoding="async"
                width="1536"
                height="1024"
                style={{
                  transform: isPhotoHovered ? 'scale(1.06)' : 'scale(1.02)',
                  transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                }}
              />
            </picture>

            {/* Floating 3D Stamp Badge */}
            <motion.div
              style={{
                position: 'absolute',
                bottom: '18px',
                right: '18px',
                zIndex: 4,
                transform: 'translateZ(30px)',
                background: 'rgba(33, 18, 25, 0.88)',
                color: '#edd5a6',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(226, 193, 139, 0.35)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              }}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles size={14} style={{ color: '#e2c18b' }} />
              <span>Architectural Print Studio · 1200 DPI Native</span>
            </motion.div>
          </motion.div>

          <figcaption style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '11px', color: 'var(--muted)' }}>
            <span style={{ fontWeight: 600 }}>Beautiful in the details.</span>
            <span>Concept imagery · Print Bot studio</span>
          </figcaption>
        </motion.figure>

        {/* Right: Editorial Typography & Micro-Interactions */}
        <motion.div
          className="editorial-copy"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Animated 3D Floating Monogram */}
          <motion.span
            className="studio-mark"
            aria-hidden="true"
            whileHover={{ scale: 1.1, rotateZ: 5, color: '#f3e1b8' }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            style={{ display: 'inline-block', cursor: 'pointer' }}
          >
            pb.
          </motion.span>

          <h3>
            Not just another page.
            <br />
            Someone’s next big thing.
          </h3>

          <p>
            A college thesis. An A3 engineering blueprint. The legal agreement that seals a family home. Every print at your counter begins with someone’s ambition. Give it the precision it deserves.
          </p>

          <motion.a
            className="text-link"
            href="#experience"
            whileHover={{ x: 6 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 650, marginTop: '20px' }}
          >
            <span>Explore counter-grade precision</span>
            <span style={{ transition: 'transform 0.2s ease' }}>↗</span>
          </motion.a>
        </motion.div>
      </div>

      {/* Bottom Production Specimen Gallery */}
      <div className="art-gallery">
        {/* Specimen 01: CAD & Blueprint */}
        <motion.figure
          className="art-print print-ivory"
          initial={{ opacity: 0, y: 50, rotate: -8 }}
          whileInView={{ opacity: 1, y: 0, rotate: -4 }}
          viewport={{ once: true, margin: '-40px' }}
          whileHover={{ rotate: 0, y: -12, scale: 1.03 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <CadBlueprintArtwork />
          <figcaption>
            <span style={{ fontWeight: 600 }}>A3 Architectural & Engineering Blueprints</span>
            <span>100 GSM Bond · 0.1pt hairline vector · Zero edge shrinkage</span>
          </figcaption>
        </motion.figure>

        {/* Center: Domain Benchmark Statement */}
        <motion.div
          className="gallery-statement"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <div className="specimen-badge">
            <Printer size={13} />
            <span>Counter Benchmark</span>
          </div>

          <p>
            Engineered for what
            <br />
            <em>your counter delivers every day.</em>
          </p>

          {/* Interactive CMYK Printer Calibration Crosshair */}
          <div className="specimen-calibration-target" aria-hidden="true">
            <motion.svg
              viewBox="0 0 80 80"
              width="80"
              height="80"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
            >
              {/* Outer CMYK quadrant ring */}
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
              <path d="M 40 6 A 34 34 0 0 1 74 40" fill="none" stroke="#00aeef" strokeWidth="2.5" opacity="0.9" />
              <path d="M 74 40 A 34 34 0 0 1 40 74" fill="none" stroke="#ec008c" strokeWidth="2.5" opacity="0.9" />
              <path d="M 40 74 A 34 34 0 0 1 6 40" fill="none" stroke="#fff200" strokeWidth="2.5" opacity="0.9" />
              <path d="M 6 40 A 34 34 0 0 1 40 6" fill="none" stroke="#231f20" strokeWidth="2.5" opacity="0.9" />

              {/* Inner alignment crosshairs */}
              <circle cx="40" cy="40" r="16" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <circle cx="40" cy="40" r="3" fill="currentColor" />
              <line x1="40" y1="10" x2="40" y2="70" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
              <line x1="10" y1="40" x2="70" y2="40" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            </motion.svg>
          </div>

          <div className="specimen-features">
            <div className="feature-item">
              <strong>1200 DPI</strong>
              <span>Vector Hairlines</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-item">
              <strong>0% Cut</strong>
              <span>Zero Spool Clip</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-item">
              <strong>100% Raw</strong>
              <span>winspool.drv Pass</span>
            </div>
          </div>

          <span className="specimen-footer-note">
            From single-page Xerox copies to 400-page engineering folios.
          </span>
        </motion.div>

        {/* Specimen 02: Thesis & Certification */}
        <motion.figure
          className="art-print print-obsidian"
          initial={{ opacity: 0, y: 50, rotate: 8 }}
          whileInView={{ opacity: 1, y: 20, rotate: 4 }}
          viewport={{ once: true, margin: '-40px' }}
          whileHover={{ rotate: 0, y: -12, scale: 1.03 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <ThesisCertificateArtwork />
          <figcaption>
            <span style={{ fontWeight: 600 }}>Hardbound Thesis & Academic Folios</span>
            <span>300 GSM Royal Matte · Gold foil embossing · Dual-sided duplex</span>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}
