---
name: mobile-ux-standards
description: Apple Maps/Citymapper-tier ergonomics, tactile micro-interactions, responsive sheets, and typography guidelines for MARSHGO.
---

# Mobile UX Standards Skill

## Overview
Standards for world-class, premium tactile mobile interfaces in MARSHGO. Ensures thumb-friendly zones, haptic feedback hooks, high-contrast typography, and fluid sheet transitions.

## Design Systems & Ergonomics
1. **Visual Hierarchy & Typography**:
   - Use dynamic font scaling with font weights `font-black` (800/900) for ETAs and route numbers, `font-bold` for stops, and `font-medium` for ancillary telemetry.
   - Distinctive route badge contrasts (e.g. Electric Blue `#2563EB` for Bus, Vibrant Emerald `#059669` for Tram, Purple `#7C3AED` for Trolleybus, Amber `#D97706` for Marshrutka).
2. **Bottom Sheet Dynamics**:
   - Smooth gesture-driven spring transitions (`transition-all duration-300 ease-out`).
   - Sticky drag handles (`w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600`).
   - Clean snap points: Peek (80px), Half-sheet (360px), Full-sheet (85vh).
3. **Accessibility & WCAG 2.1 AA**:
   - Minimum tap target of 44x44 points for all interactive buttons and chips.
   - Explicit wheelchair accessibility badges (`♿`) and low-floor bus indicators.
   - Real-time GPS status indicators with color-coded confidence (Emerald for live GPS, Slate for scheduled timetable).
