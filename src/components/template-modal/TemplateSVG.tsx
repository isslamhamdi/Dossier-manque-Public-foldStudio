'use client'

import type { TemplateType } from '@/lib/types'

export function TemplateSVG({ id }: { id: TemplateType }) {
  const s = { stroke: '#e91e8c', fill: 'none', strokeWidth: 1 }
  const f = { stroke: '#4488ff', fill: 'none', strokeWidth: 0.8, strokeDasharray: '3 2' }

  switch (id) {
    case 'box':
      return (
        <svg viewBox="0 0 60 50" width="60" height="50">
          <rect x="10" y="12" width="12" height="26" {...s} />
          <rect x="22" y="12" width="16" height="26" {...s} />
          <rect x="38" y="12" width="12" height="26" {...s} />
          <rect x="22" y="4" width="16" height="8" {...s} />
          <rect x="22" y="38" width="16" height="8" {...s} />
          <line x1="22" y1="4" x2="22" y2="46" {...f} />
          <line x1="38" y1="4" x2="38" y2="46" {...f} />
          <line x1="10" y1="12" x2="50" y2="12" {...f} />
          <line x1="10" y1="38" x2="50" y2="38" {...f} />
          <rect x="50" y="12" width="5" height="26" stroke="#999" fill="#f0f0f0" strokeWidth={0.8} />
        </svg>
      )
    case 'mailer':
      return (
        <svg viewBox="0 0 60 56" width="60" height="56">
          <rect x="10" y="14" width="12" height="28" {...s} />
          <rect x="22" y="14" width="16" height="28" {...s} />
          <rect x="38" y="14" width="12" height="28" {...s} />
          <rect x="22" y="0" width="16" height="14" {...s} />
          <rect x="22" y="42" width="16" height="14" {...s} />
          <line x1="22" y1="0" x2="22" y2="56" {...f} />
          <line x1="38" y1="0" x2="38" y2="56" {...f} />
          <line x1="10" y1="14" x2="50" y2="14" {...f} />
          <line x1="10" y1="42" x2="50" y2="42" {...f} />
          <line x1="22" y1="4" x2="38" y2="4" stroke="#e91e8c" strokeWidth={0.6} strokeDasharray="2 2" />
          <line x1="22" y1="52" x2="38" y2="52" stroke="#e91e8c" strokeWidth={0.6} strokeDasharray="2 2" />
          <rect x="50" y="14" width="5" height="28" stroke="#999" fill="#f0f0f0" strokeWidth={0.8} />
        </svg>
      )
    case 'tuck-end':
      return (
        <svg viewBox="0 0 60 50" width="60" height="50">
          <rect x="8" y="14" width="12" height="22" {...s} />
          <rect x="20" y="14" width="16" height="22" {...s} />
          <rect x="36" y="14" width="12" height="22" {...s} />
          <path d="M20 14 Q28 6 36 14" {...s} />
          <path d="M20 36 Q28 44 36 36" {...s} />
          <line x1="20" y1="6" x2="20" y2="44" {...f} />
          <line x1="36" y1="6" x2="36" y2="44" {...f} />
          <line x1="8" y1="14" x2="48" y2="14" {...f} />
          <line x1="8" y1="36" x2="48" y2="36" {...f} />
        </svg>
      )
    case 'display':
      return (
        <svg viewBox="0 0 60 50" width="60" height="50">
          <rect x="10" y="8" width="12" height="34" {...s} />
          <rect x="22" y="8" width="16" height="34" {...s} />
          <rect x="38" y="8" width="12" height="34" {...s} />
          <rect x="22" y="38" width="16" height="8" {...s} />
          <line x1="22" y1="8" x2="22" y2="46" {...f} />
          <line x1="38" y1="8" x2="38" y2="46" {...f} />
          <line x1="10" y1="38" x2="50" y2="38" {...f} />
        </svg>
      )
    case 'flip-top':
      return (
        <svg viewBox="0 0 60 50" width="60" height="50">
          <rect x="12" y="10" width="14" height="30" {...s} />
          <rect x="26" y="10" width="16" height="30" {...s} />
          <rect x="26" y="2" width="16" height="8" stroke="#e91e8c" fill="none" strokeWidth={1} />
          <rect x="26" y="40" width="16" height="8" {...s} />
          <line x1="26" y1="2" x2="26" y2="48" {...f} />
          <line x1="42" y1="2" x2="42" y2="48" {...f} />
          <line x1="12" y1="10" x2="42" y2="10" {...f} />
          <line x1="12" y1="40" x2="42" y2="40" {...f} />
        </svg>
      )
    case 'gable':
      return (
        <svg viewBox="0 0 60 56" width="60" height="56">
          <rect x="12" y="18" width="12" height="26" {...s} />
          <rect x="24" y="18" width="14" height="26" {...s} />
          <rect x="38" y="18" width="12" height="26" {...s} />
          <path d="M12 18 L18 6 L30 4 L42 6 L50 18" {...s} />
          <rect x="24" y="44" width="14" height="8" {...s} />
          <line x1="24" y1="4" x2="24" y2="52" {...f} />
          <line x1="38" y1="4" x2="38" y2="52" {...f} />
          <line x1="12" y1="44" x2="50" y2="44" {...f} />
        </svg>
      )
    case 'seal-end':
      return (
        <svg viewBox="0 0 60 50" width="60" height="50">
          <rect x="10" y="12" width="12" height="26" {...s} />
          <rect x="22" y="12" width="16" height="26" {...s} />
          <rect x="38" y="12" width="12" height="26" {...s} />
          <rect x="16" y="4" width="22" height="8" {...s} />
          <rect x="16" y="38" width="22" height="8" {...s} />
          <line x1="22" y1="4" x2="22" y2="46" {...f} />
          <line x1="38" y1="4" x2="38" y2="46" {...f} />
          <line x1="10" y1="12" x2="50" y2="12" {...f} />
          <line x1="10" y1="38" x2="50" y2="38" {...f} />
        </svg>
      )
    case 'snap-lock':
      return (
        <svg viewBox="0 0 60 50" width="60" height="50">
          <rect x="10" y="8" width="12" height="20" {...s} />
          <rect x="22" y="8" width="16" height="20" {...s} />
          <rect x="38" y="8" width="12" height="20" {...s} />
          <rect x="22" y="28" width="16" height="14" {...s} />
          <path d="M26 28 L26 42 M34 28 L34 42" {...f} />
          <path d="M22 35 Q30 38 38 35" stroke="#e91e8c" fill="none" strokeWidth={0.8} />
          <line x1="22" y1="8" x2="22" y2="28" {...f} />
          <line x1="38" y1="8" x2="38" y2="28" {...f} />
          <line x1="10" y1="28" x2="50" y2="28" {...f} />
        </svg>
      )
    case 'auto-bottom':
      return (
        <svg viewBox="0 0 60 50" width="60" height="50">
          <rect x="10" y="10" width="12" height="26" {...s} />
          <rect x="22" y="10" width="16" height="26" {...s} />
          <rect x="38" y="10" width="12" height="26" {...s} />
          <rect x="22" y="4" width="16" height="6" {...s} />
          <path d="M22 36 L30 44 L38 36" {...s} />
          <path d="M26 36 L26 44 M34 36 L34 44" {...f} />
          <line x1="22" y1="4" x2="22" y2="36" {...f} />
          <line x1="38" y1="4" x2="38" y2="36" {...f} />
          <line x1="10" y1="10" x2="50" y2="10" {...f} />
          <line x1="10" y1="36" x2="50" y2="36" {...f} />
        </svg>
      )
    case 'lid-box':
      return (
        <svg viewBox="0 0 60 52" width="60" height="52">
          {/* Body tray */}
          <rect x="12" y="28" width="36" height="20" {...s} />
          {/* Lid — slightly wider, lifted above body */}
          <rect x="10" y="6" width="40" height="18" {...s} />
          {/* Gap line between lid and body */}
          <line x1="12" y1="28" x2="48" y2="28" {...f} />
          <line x1="10" y1="24" x2="50" y2="24" {...f} />
          {/* Fold lines on lid */}
          <line x1="10" y1="12" x2="50" y2="12" {...f} />
        </svg>
      )
    case 'pillow-box':
      return (
        <svg viewBox="0 0 60 52" width="60" height="52">
          {/* Left curved side */}
          <path d="M22 4 C8 14 8 38 22 48" {...s} />
          {/* Right curved side */}
          <path d="M38 4 C52 14 52 38 38 48" {...s} />
          {/* Top seam */}
          <line x1="22" y1="4" x2="38" y2="4" {...s} />
          {/* Bottom seam */}
          <line x1="22" y1="48" x2="38" y2="48" {...s} />
          {/* Center fold line */}
          <line x1="30" y1="4" x2="30" y2="48" {...f} />
          {/* Width reference lines */}
          <line x1="22" y1="26" x2="38" y2="26" stroke="#e91e8c" strokeWidth={0.6} strokeDasharray="2 2" />
        </svg>
      )
    case 'hexagonal-box':
      return (
        <svg viewBox="0 0 60 52" width="60" height="52">
          {/* Top lid hexagon */}
          <polygon points="30,4 42,10 42,24 30,30 18,24 18,10" {...s} />
          {/* Body sides (unfolded flaps below) */}
          <rect x="18" y="30" width="24" height="14" {...s} />
          {/* Side panels left and right */}
          <rect x="6" y="30" width="12" height="14" {...s} />
          <rect x="42" y="30" width="12" height="14" {...s} />
          {/* Fold lines */}
          <line x1="18" y1="30" x2="42" y2="30" {...f} />
          <line x1="18" y1="10" x2="18" y2="44" {...f} />
          <line x1="42" y1="10" x2="42" y2="44" {...f} />
          <line x1="6" y1="37" x2="54" y2="37" stroke="#e91e8c" strokeWidth={0.5} strokeDasharray="2 2" />
        </svg>
      )
    case 'cylinder-box':
      return (
        <svg viewBox="0 0 60 52" width="60" height="52">
          {/* Cylinder body (rectangle representing unrolled tube) */}
          <rect x="10" y="14" width="40" height="30" {...s} />
          {/* Top ellipse (lid) */}
          <ellipse cx="30" cy="14" rx="20" ry="6" {...s} />
          {/* Bottom ellipse (base) */}
          <ellipse cx="30" cy="44" rx="20" ry="6" stroke="#e91e8c" fill="none" strokeWidth={1} strokeDasharray="3 2" />
          {/* Fold lines */}
          <line x1="10" y1="14" x2="50" y2="14" {...f} />
          <line x1="10" y1="44" x2="50" y2="44" {...f} />
          {/* Overlap seam */}
          <line x1="10" y1="14" x2="10" y2="44" stroke="#e91e8c" strokeWidth={1.5} />
        </svg>
      )
    case 'drawer-box':
      return (
        <svg viewBox="0 0 60 50" width="60" height="50">
          {/* Outer sleeve */}
          <rect x="10" y="10" width="40" height="30" {...s} />
          {/* Drawer panel (inner) */}
          <rect x="14" y="14" width="28" height="22" {...s} />
          {/* Sleeve opening edge */}
          <line x1="50" y1="10" x2="50" y2="40" stroke="#e91e8c" strokeWidth={1.5} />
          {/* Fold/guide lines */}
          <line x1="10" y1="17" x2="50" y2="17" {...f} />
          <line x1="10" y1="33" x2="50" y2="33" {...f} />
          <line x1="14" y1="10" x2="14" y2="40" {...f} />
          <line x1="46" y1="10" x2="46" y2="40" {...f} />
          {/* Pull-out arrow hint */}
          <path d="M50 25 L55 25 M53 23 L55 25 L53 27" stroke="#e91e8c" fill="none" strokeWidth={0.8} />
        </svg>
      )
    case 'tray-box':
      return (
        <svg viewBox="0 0 60 50" width="60" height="50">
          {/* Bottom panel */}
          <rect x="14" y="20" width="32" height="20" {...s} />
          {/* Front wall */}
          <rect x="14" y="10" width="32" height="10" {...s} />
          {/* Left flap */}
          <rect x="6" y="20" width="8" height="20" {...s} />
          {/* Right flap */}
          <rect x="46" y="20" width="8" height="20" {...s} />
          {/* Corner lock tabs */}
          <rect x="6" y="10" width="8" height="10" stroke="#999" fill="#f0f0f0" strokeWidth={0.8} />
          <rect x="46" y="10" width="8" height="10" stroke="#999" fill="#f0f0f0" strokeWidth={0.8} />
          {/* Fold lines */}
          <line x1="14" y1="10" x2="14" y2="40" {...f} />
          <line x1="46" y1="10" x2="46" y2="40" {...f} />
          <line x1="6" y1="20" x2="54" y2="20" {...f} />
        </svg>
      )
    case 'reverse-tuck':
      return (
        <svg viewBox="0 0 60 50" width="60" height="50">
          <rect x="10" y="10" width="12" height="30" {...s} />
          <rect x="22" y="10" width="16" height="30" {...s} />
          <rect x="38" y="10" width="12" height="30" {...s} />
          {/* Top tuck flap — into front (-z) */}
          <path d="M22 10 L38 10 L38 4 L22 4 Z" {...s} />
          {/* Bottom tuck flap — into back (+z), reversed */}
          <path d="M22 40 L38 40 L38 46 L22 46 Z" stroke="#e91e8c" fill="none" strokeWidth={1} strokeDasharray="3 2" />
          <line x1="22" y1="4" x2="22" y2="46" {...f} />
          <line x1="38" y1="4" x2="38" y2="46" {...f} />
          <line x1="10" y1="10" x2="50" y2="10" {...f} />
          <line x1="10" y1="40" x2="50" y2="40" {...f} />
          <rect x="50" y="10" width="5" height="30" stroke="#999" fill="#f0f0f0" strokeWidth={0.8} />
        </svg>
      )
    case 'crash-lock-bottom':
      return (
        <svg viewBox="0 0 60 52" width="60" height="52">
          {/* Body */}
          <rect x="10" y="14" width="12" height="24" {...s} />
          <rect x="22" y="14" width="16" height="24" {...s} />
          <rect x="38" y="14" width="12" height="24" {...s} />
          {/* Top tuck flap */}
          <rect x="22" y="6" width="16" height="8" {...s} />
          {/* Crash lock bottom — interlocking panels */}
          <path d="M22 38 L22 46 L38 46 L38 38" {...s} />
          <path d="M10 38 L10 44 L18 38" stroke="#e91e8c" fill="none" strokeWidth={1} />
          <path d="M50 38 L50 44 L42 38" stroke="#e91e8c" fill="none" strokeWidth={1} />
          <path d="M26 46 L30 50 L34 46" stroke="#e91e8c" fill="none" strokeWidth={0.8} />
          {/* Fold lines */}
          <line x1="22" y1="6" x2="22" y2="46" {...f} />
          <line x1="38" y1="6" x2="38" y2="46" {...f} />
          <line x1="10" y1="14" x2="50" y2="14" {...f} />
          <line x1="10" y1="38" x2="50" y2="38" {...f} />
          <rect x="50" y="14" width="4" height="24" stroke="#999" fill="#f0f0f0" strokeWidth={0.8} />
        </svg>
      )
    case 'window-box':
      return (
        <svg viewBox="0 0 60 50" width="60" height="50">
          <rect x="10" y="10" width="12" height="30" {...s} />
          <rect x="22" y="10" width="16" height="30" {...s} />
          <rect x="38" y="10" width="12" height="30" {...s} />
          {/* Window cutout with rounded corners */}
          <rect x="25" y="15" width="10" height="16" rx="2" stroke="#e91e8c" fill="rgba(100,180,255,0.15)" strokeWidth={1} strokeDasharray="2 1.5" />
          {/* Top tuck */}
          <path d="M22 10 Q28 4 38 10" {...s} />
          {/* Bottom tuck */}
          <path d="M22 40 Q28 46 38 40" {...s} />
          <line x1="22" y1="4" x2="22" y2="46" {...f} />
          <line x1="38" y1="4" x2="38" y2="46" {...f} />
          <line x1="10" y1="10" x2="50" y2="10" {...f} />
          <line x1="10" y1="40" x2="50" y2="40" {...f} />
          <rect x="50" y="10" width="4" height="30" stroke="#999" fill="#f0f0f0" strokeWidth={0.8} />
        </svg>
      )
    case 'sleeve-insert':
      return (
        <svg viewBox="0 0 60 52" width="60" height="52">
          {/* Sleeve — open both ends */}
          <rect x="8" y="4" width="10" height="22" {...s} />
          <rect x="18" y="4" width="14" height="22" {...s} />
          <rect x="32" y="4" width="10" height="22" {...s} />
          <rect x="42" y="4" width="4" height="22" stroke="#999" fill="#f0f0f0" strokeWidth={0.8} />
          <line x1="18" y1="4" x2="18" y2="26" {...f} />
          <line x1="32" y1="4" x2="32" y2="26" {...f} />
          {/* Sleeve open-end indicators */}
          <line x1="8" y1="4" x2="46" y2="4" stroke="#e91e8c" strokeWidth={1.2} />
          <line x1="8" y1="26" x2="46" y2="26" stroke="#e91e8c" strokeWidth={1.2} />
          {/* Insert tray below */}
          <rect x="10" y="32" width="8" height="14" {...s} />
          <rect x="18" y="32" width="12" height="14" {...s} />
          <rect x="30" y="32" width="8" height="14" {...s} />
          <line x1="18" y1="32" x2="18" y2="46" {...f} />
          <line x1="30" y1="32" x2="30" y2="46" {...f} />
          <line x1="10" y1="36" x2="38" y2="36" {...f} />
          <line x1="10" y1="42" x2="38" y2="42" {...f} />
        </svg>
      )
    case 'stand-up-pouch':
      return (
        <svg viewBox="0 0 60 56" width="60" height="56">
          {/* Front panel */}
          <rect x="14" y="6" width="32" height="38" {...s} />
          {/* Bottom gusset fold line */}
          <line x1="14" y1="44" x2="46" y2="44" {...f} />
          {/* Bottom gusset semicircle below */}
          <path d="M14 44 Q14 52 30 52 Q46 52 46 44" stroke="#e91e8c" fill="none" strokeWidth={1} />
          {/* Side seals (left & right hatching) */}
          <rect x="10" y="6" width="4" height="38" stroke="#999" fill="#e0e0e0" strokeWidth={0.6} />
          <rect x="46" y="6" width="4" height="38" stroke="#999" fill="#e0e0e0" strokeWidth={0.6} />
          {/* Zipper line */}
          <line x1="14" y1="38" x2="46" y2="38" stroke="#4488ff" strokeWidth={1.2} strokeDasharray="2 1.5" />
          {/* Top seal */}
          <rect x="14" y="4" width="32" height="2" stroke="#e91e8c" fill="none" strokeWidth={0.8} />
          {/* Tear notch hint */}
          <path d="M11 10 L14 13" stroke="#e91e8c" fill="none" strokeWidth={1} />
        </svg>
      )
    case 'book-box':
      return (
        <svg viewBox="0 0 60 52" width="60" height="52">
          {/* Base tray (bottom half) */}
          <rect x="8" y="28" width="28" height="20" {...s} />
          {/* Lid tray (top half, hinged open) */}
          <rect x="8" y="6" width="28" height="18" {...s} />
          {/* Spine hinge on left */}
          <rect x="4" y="6" width="4" height="42" stroke="#e91e8c" fill="none" strokeWidth={1.2} />
          {/* Hinge fold line */}
          <line x1="8" y1="6" x2="8" y2="48" {...f} />
          {/* Gap line between base and lid */}
          <line x1="8" y1="28" x2="36" y2="28" {...f} />
          {/* Lid angle indicator */}
          <path d="M36 24 L46 18 L46 6 L36 6" stroke="#e91e8c" fill="none" strokeWidth={0.6} strokeDasharray="2 2" />
        </svg>
      )
    case 'osc-box':
      return (
        <svg viewBox="0 0 60 56" width="60" height="56">
          {/* OSC — rabats qui se chevauchent (plus hauts que RSC) */}
          <rect x="10" y="16" width="12" height="22" {...s} />
          <rect x="22" y="16" width="16" height="22" {...s} />
          <rect x="38" y="16" width="12" height="22" {...s} />
          {/* Outer flaps — taller, overlap past center */}
          <rect x="22" y="2" width="16" height="14" {...s} />
          <rect x="22" y="38" width="16" height="14" {...s} />
          {/* Center reference line (where RSC would close) */}
          <line x1="22" y1="9" x2="38" y2="9" stroke="#e91e8c" strokeWidth={0.5} strokeDasharray="2 1.5" />
          <line x1="22" y1="45" x2="38" y2="45" stroke="#e91e8c" strokeWidth={0.5} strokeDasharray="2 1.5" />
          <line x1="22" y1="2" x2="22" y2="52" {...f} />
          <line x1="38" y1="2" x2="38" y2="52" {...f} />
          <line x1="10" y1="16" x2="50" y2="16" {...f} />
          <line x1="10" y1="38" x2="50" y2="38" {...f} />
          <rect x="50" y="16" width="5" height="22" stroke="#999" fill="#f0f0f0" strokeWidth={0.8} />
        </svg>
      )
    case 'fol-box':
      return (
        <svg viewBox="0 0 60 64" width="60" height="64">
          {/* FOL — rabats pleine profondeur (2× RSC) */}
          <rect x="10" y="20" width="12" height="22" {...s} />
          <rect x="22" y="20" width="16" height="22" {...s} />
          <rect x="38" y="20" width="12" height="22" {...s} />
          {/* Full-depth flaps */}
          <rect x="22" y="0" width="16" height="20" {...s} />
          <rect x="22" y="42" width="16" height="20" {...s} />
          {/* D/2 reference (inner flap level) */}
          <line x1="22" y1="10" x2="38" y2="10" stroke="#4488ff" strokeWidth={0.6} strokeDasharray="2 1.5" />
          <line x1="22" y1="52" x2="38" y2="52" stroke="#4488ff" strokeWidth={0.6} strokeDasharray="2 1.5" />
          <line x1="22" y1="0" x2="22" y2="62" {...f} />
          <line x1="38" y1="0" x2="38" y2="62" {...f} />
          <line x1="10" y1="20" x2="50" y2="20" {...f} />
          <line x1="10" y1="42" x2="50" y2="42" {...f} />
          <rect x="50" y="20" width="5" height="22" stroke="#999" fill="#f0f0f0" strokeWidth={0.8} />
        </svg>
      )
    case 'hsc-box': {
      // Half Slotted Container: flat open top, 4-flap bottom with slits
      const D = 12, W = 20, H = 22, G = 4, hf = D / 2
      const x0=0, x1=D, x2=D+W, x3=2*D+W, x4=2*D+2*W, x5=x4+G
      const y0=0, y1=H, y2=H+hf
      const ox = (60 - x5) / 2, oy = (50 - y2) / 2 + 2
      return (
        <svg viewBox="0 0 60 50" width="60" height="50">
          {/* Body rectangle (flat top) */}
          <rect x={x0+ox} y={y0+oy} width={x4} height={H} {...s} />
          {/* Glue tab */}
          <rect x={x4+ox} y={y0+oy} width={G} height={H} stroke="#999" fill="#f0f0f0" strokeWidth={0.8} />
          {/* Bottom flaps rectangle */}
          <rect x={x0+ox} y={y1+oy} width={x4} height={hf} {...s} />
          {/* Slits at x1, x2, x3 (bottom) */}
          <line x1={x1+ox} y1={y1+oy} x2={x1+ox} y2={y2+oy} {...s} />
          <line x1={x2+ox} y1={y1+oy} x2={x2+ox} y2={y2+oy} {...s} />
          <line x1={x3+ox} y1={y1+oy} x2={x3+ox} y2={y2+oy} {...s} />
          {/* Body fold lines */}
          <line x1={x1+ox} y1={y0+oy} x2={x1+ox} y2={y1+oy} {...f} />
          <line x1={x2+ox} y1={y0+oy} x2={x2+ox} y2={y1+oy} {...f} />
          <line x1={x3+ox} y1={y0+oy} x2={x3+ox} y2={y1+oy} {...f} />
          <line x1={x4+ox} y1={y0+oy} x2={x4+ox} y2={y1+oy} {...f} />
          <line x1={x0+ox} y1={y1+oy} x2={x5+ox} y2={y1+oy} {...f} />
          {/* Open top indicator */}
          <text x={x0+ox + (x4/2)} y={y0+oy - 2} textAnchor="middle" fontSize="4" fill="#e91e8c" fontFamily="sans-serif">OPEN</text>
        </svg>
      )
    }
    case 'envelope': {
      // Envelope: front panel + triangular seal + trapezoidal sides + triangular bottom
      const W = 22, H = 30, sf = 10, bf = 7, lf = 9, tp = 3
      const cx = lf, cx2 = lf + W
      const y0=0, y1=sf, y2=sf+H, y3=sf+H+bf
      const ox = (60 - (lf+W+lf)) / 2, oy = (56 - y3) / 2
      const pts = [
        `${cx-tp+ox},${y1+oy}`,
        `${cx+W/2+ox},${y0+oy}`,
        `${cx2+tp+ox},${y1+oy}`,
        `${cx2+ox},${y1+oy}`,
        `${cx2+lf+ox},${y1+tp+oy}`,
        `${cx2+lf+ox},${y2-tp+oy}`,
        `${cx2+ox},${y2+oy}`,
        `${cx2+tp+ox},${y2+oy}`,
        `${cx+W/2+ox},${y3+oy}`,
        `${cx-tp+ox},${y2+oy}`,
        `${cx+ox},${y2+oy}`,
        `${cx-lf+ox},${y2-tp+oy}`,
        `${cx-lf+ox},${y1+tp+oy}`,
        `${cx+ox},${y1+oy}`,
      ].join(' ')
      return (
        <svg viewBox="0 0 60 56" width="60" height="56">
          <polygon points={pts} {...s} />
          <line x1={cx+ox} y1={y1+oy} x2={cx2+ox} y2={y1+oy} {...f} />
          <line x1={cx+ox} y1={y2+oy} x2={cx2+ox} y2={y2+oy} {...f} />
          <line x1={cx+ox} y1={y1+oy} x2={cx+ox} y2={y2+oy} {...f} />
          <line x1={cx2+ox} y1={y1+oy} x2={cx2+ox} y2={y2+oy} {...f} />
        </svg>
      )
    }
    case 'shallow-box': {
      // Simple cross tray with square corners (no corner flaps)
      const H = 10, D = 32, W = 24
      const x0=0, x1=H, x2=H+D, x3=2*H+D
      const y0=0, y1=H, y2=H+W, y3=2*H+W
      const ox = (60 - x3) / 2, oy = (56 - y3) / 2
      const pts = [
        `${x1+ox},${y0+oy}`, `${x2+ox},${y0+oy}`,
        `${x2+ox},${y1+oy}`, `${x3+ox},${y1+oy}`,
        `${x3+ox},${y2+oy}`, `${x2+ox},${y2+oy}`,
        `${x2+ox},${y3+oy}`, `${x1+ox},${y3+oy}`,
        `${x1+ox},${y2+oy}`, `${x0+ox},${y2+oy}`,
        `${x0+ox},${y1+oy}`, `${x1+ox},${y1+oy}`,
      ].join(' ')
      return (
        <svg viewBox="0 0 60 56" width="60" height="56">
          <polygon points={pts} {...s} />
          <line x1={x1+ox} y1={y1+oy} x2={x2+ox} y2={y1+oy} {...f} />
          <line x1={x1+ox} y1={y2+oy} x2={x2+ox} y2={y2+oy} {...f} />
          <line x1={x1+ox} y1={y1+oy} x2={x1+ox} y2={y2+oy} {...f} />
          <line x1={x2+ox} y1={y1+oy} x2={x2+ox} y2={y2+oy} {...f} />
        </svg>
      )
    }
    case 'fefco-0713': {
      // Tuck-End Carton: D|W|D|W|G body + dust flaps on D + cover+tuck on last W
      const D = 10, W = 18, H = 24, dust = 4, cover = W, tuck = 7
      const xa = D, xb = D+W, xc = 2*D+W, xd = 2*D+2*W, xe = xd+4
      const topH = cover + tuck
      const y1 = topH, y2 = topH+H, y3 = topH+H+topH
      const ox = (60 - xe) / 2, oy = (80 - y3) / 2
      return (
        <svg viewBox="0 0 60 80" width="60" height="80">
          {/* Outer shape */}
          <polygon
            points={[
              `${0+ox},${y1-dust+oy}`,
              `${xa+ox},${y1-dust+oy}`, `${xa+ox},${y1+oy}`,
              `${xb+ox},${y1+oy}`, `${xb+ox},${y1-dust+oy}`,
              `${xc+ox},${y1-dust+oy}`, `${xc+ox},${y1-cover-tuck+oy}`,
              `${xd+ox},${y1-cover-tuck+oy}`, `${xd+ox},${y1-cover+oy}`,
              `${xd+ox},${y1+oy}`,
              `${xe+ox},${y1+oy}`, `${xe+ox},${y2+oy}`, `${xd+ox},${y2+oy}`,
              `${xd+ox},${y2+cover+oy}`, `${xd+ox},${y2+cover+tuck+oy}`,
              `${xc+ox},${y2+cover+tuck+oy}`, `${xc+ox},${y2+dust+oy}`,
              `${xb+ox},${y2+dust+oy}`, `${xb+ox},${y2+oy}`,
              `${xa+ox},${y2+oy}`, `${xa+ox},${y2+dust+oy}`,
              `${0+ox},${y2+dust+oy}`,
            ].join(' ')}
            {...s}
          />
          {/* Cover fold lines */}
          <line x1={xc+ox} y1={y1-cover+oy} x2={xd+ox} y2={y1-cover+oy} {...f} />
          <line x1={xc+ox} y1={y2+cover+oy} x2={xd+ox} y2={y2+cover+oy} {...f} />
          {/* Body fold lines */}
          <line x1={xa+ox} y1={y1+oy} x2={xa+ox} y2={y2+oy} {...f} />
          <line x1={xb+ox} y1={y1+oy} x2={xb+ox} y2={y2+oy} {...f} />
          <line x1={xc+ox} y1={y1+oy} x2={xc+ox} y2={y2+oy} {...f} />
          <line x1={xd+ox} y1={y1+oy} x2={xd+ox} y2={y2+oy} {...f} />
          <line x1={0+ox} y1={y1+oy} x2={xe+ox} y2={y1+oy} {...f} />
          <line x1={0+ox} y1={y2+oy} x2={xe+ox} y2={y2+oy} {...f} />
          {/* Glue tab */}
          <rect x={xd+ox} y={y1+oy} width={4} height={H} stroke="#999" fill="#f0f0f0" strokeWidth={0.6} />
        </svg>
      )
    }
    case 'fefco-rsc': {
      // Full 4-flap RSC: all flaps visible with slits at x1/x2/x3
      const D = 12, W = 20, H = 22, G = 4, hf = D / 2
      const x0 = 0, x1 = D, x2 = D + W, x3 = 2*D + W, x4 = 2*D + 2*W, x5 = x4 + G
      const y0 = 0, y1 = hf, y2 = hf + H, y3 = 2*hf + H
      const ox = (60 - x5) / 2, oy = (56 - y3) / 2
      return (
        <svg viewBox="0 0 60 56" width="60" height="56">
          {/* Outer rectangle: all 4 flap pairs */}
          <rect x={x0+ox} y={y0+oy} width={x4} height={y3} {...s} />
          {/* Glue tab */}
          <rect x={x4+ox} y={y1+oy} width={G} height={H} stroke="#999" fill="#f0f0f0" strokeWidth={0.8} />
          {/* Slits — top */}
          <line x1={x1+ox} y1={y0+oy} x2={x1+ox} y2={y1+oy} {...s} />
          <line x1={x2+ox} y1={y0+oy} x2={x2+ox} y2={y1+oy} {...s} />
          <line x1={x3+ox} y1={y0+oy} x2={x3+ox} y2={y1+oy} {...s} />
          {/* Slits — bottom */}
          <line x1={x1+ox} y1={y2+oy} x2={x1+ox} y2={y3+oy} {...s} />
          <line x1={x2+ox} y1={y2+oy} x2={x2+ox} y2={y3+oy} {...s} />
          <line x1={x3+ox} y1={y2+oy} x2={x3+ox} y2={y3+oy} {...s} />
          {/* Fold lines */}
          <line x1={x1+ox} y1={y0+oy} x2={x1+ox} y2={y3+oy} {...f} />
          <line x1={x2+ox} y1={y1+oy} x2={x2+ox} y2={y2+oy} {...f} />
          <line x1={x3+ox} y1={y1+oy} x2={x3+ox} y2={y2+oy} {...f} />
          <line x1={x4+ox} y1={y1+oy} x2={x4+ox} y2={y2+oy} {...f} />
          <line x1={x0+ox} y1={y1+oy} x2={x5+ox} y2={y1+oy} {...f} />
          <line x1={x0+ox} y1={y2+oy} x2={x5+ox} y2={y2+oy} {...f} />
        </svg>
      )
    }
    case 'fefco-tray': {
      // Cross-shaped tray blank: bottom + 4 walls + 4 corner flaps on N/S walls
      const H = 14, D = 32, W = 24, cf = 5
      const xe1 = 2 * H + D, ys1 = 2 * H + W
      const xfl = H - cf, xfr = H + D + cf
      const ox = (60 - xe1) / 2, oy = (56 - ys1) / 2
      const pts = [
        `${xfl + ox},${0 + oy}`,     `${xfr + ox},${0 + oy}`,
        `${xfr + ox},${H + oy}`,     `${xe1 + ox},${H + oy}`,
        `${xe1 + ox},${H + W + oy}`, `${xfr + ox},${H + W + oy}`,
        `${xfr + ox},${ys1 + oy}`,   `${xfl + ox},${ys1 + oy}`,
        `${xfl + ox},${H + W + oy}`, `${0 + ox},${H + W + oy}`,
        `${0 + ox},${H + oy}`,       `${xfl + ox},${H + oy}`,
      ].join(' ')
      return (
        <svg viewBox="0 0 60 56" width="60" height="56">
          <polygon points={pts} {...s} />
          {/* Bottom panel fold lines */}
          <line x1={H + ox} y1={H + oy} x2={H + D + ox} y2={H + oy} {...f} />
          <line x1={H + ox} y1={H + W + oy} x2={H + D + ox} y2={H + W + oy} {...f} />
          <line x1={H + ox} y1={H + oy} x2={H + ox} y2={H + W + oy} {...f} />
          <line x1={H + D + ox} y1={H + oy} x2={H + D + ox} y2={H + W + oy} {...f} />
          {/* Corner flap fold lines */}
          <line x1={H + ox} y1={0 + oy} x2={H + ox} y2={H + oy} {...f} />
          <line x1={H + D + ox} y1={0 + oy} x2={H + D + ox} y2={H + oy} {...f} />
          <line x1={H + ox} y1={H + W + oy} x2={H + ox} y2={ys1 + oy} {...f} />
          <line x1={H + D + ox} y1={H + W + oy} x2={H + D + ox} y2={ys1 + oy} {...f} />
        </svg>
      )
    }
    default:
      return (
        <svg viewBox="0 0 60 50" width="60" height="50">
          <rect x="10" y="10" width="40" height="30" {...s} />
        </svg>
      )
  }
}
