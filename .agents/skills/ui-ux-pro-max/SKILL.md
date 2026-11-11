---
name: ui-ux-pro-max
description: 'Front-end UI/UX design intelligence for creating, reviewing, and hardening polished product interfaces across web, mobile, dashboards, SaaS, ecommerce, and content-heavy apps.'
tags: '[ui, ux, design-system, frontend, accessibility, typography, color, responsive-design, ecommerce]'
---

# UI/UX Pro Max

Comprehensive design intelligence for web and mobile UI/UX across React, Next.js, Tailwind CSS, and TypeScript. Provides 50+ design styles, 161 color palettes, 57 font pairings, and 99 UX guidelines with priority-ranked rules for accessibility, touch interaction, performance, and responsive layout.

## Rule Categories by Priority

Follow priority 1 -> 10 to ensure commercial product-grade execution:

| Priority | Category | Impact | Domain | Key Checks (Must Have) | Anti-Patterns (Avoid) |
|---|---|---|---|---|---|
| **1** | **Accessibility** | CRITICAL | UX | Contrast ≥ 4.5:1 for body copy (WCAG AA), Alt text on all images, Keyboard nav (Tab/Enter/Space), Semantic ARIA labels on icon buttons. | Removing focus rings without replacement, Icon-only buttons without `aria-label`, Unlabelled inputs. |
| **2** | **Touch & Interaction** | CRITICAL | UX | Minimum touch target size 44×44px on mobile, ≥ 8px spacing between interactive targets, Immediate visual feedback on press, Loading spinner/skeleton states. | Reliance on hover-only interactions on touchscreens, 0ms instant state snaps, Laggy unresponsive buttons. |
| **3** | **Performance & Asset Loading** | HIGH | UX | Modern image formats (WebP/AVIF), Lazy loading offscreen media, Explicit image dimensions (`width`/`height`) to guarantee Cumulative Layout Shift (CLS) < 0.1. | Layout thrashing, Unoptimized heavy images, Unstyled Flash of Text (FOUT). |
| **4** | **Style Selection & Product Matching** | HIGH | Style | Visual language must strictly reflect the subject domain (e.g. Luxury Editorial Fashion for clothing / Bespoke tailoring). Consistent clean Lucide/Heroicon SVG icons. | Mixing flat and glassmorphism randomly, Using raw emojis as UI icons (`👕`, `👟` inside buttons), Incoherent visual themes. |
| **5** | **Layout & Responsive Architecture** | HIGH | UX | Strict Mobile-first responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`), Fluid container max-widths (`max-w-7xl`, `max-w-screen-xl`), Zero horizontal overflow scroll (`overflow-x-hidden`). | Fixed pixel container widths (e.g. `width: 1200px`), Viewports that pinch-to-zoom break, Hidden text on small screens. |
| **6** | **Typography & Color Hierarchy** | MEDIUM | Design | Base body text ≥ 15px with line-height 1.5–1.6, Semantic CSS variables / Tailwind tokens, High contrast dark slate text (`#0F172A` / `#1C1917`) on light surfaces. | Text < 12px for readable copy, Low-contrast gray-on-gray, Hardcoded arbitrary hex codes scattered in JSX. |
| **7** | **Micro-Interactions & Animation** | MEDIUM | UX | Context-aware timing (150ms–250ms for micro-actions, 300ms for drawers/modals), Easing curves (`cubic-bezier(0.16, 1, 0.3, 1)`), Respect `prefers-reduced-motion`. | One generic transition duration for everything, Animating layout properties (`width`, `height`, `top`), Janky unaccelerated keyframes. |
| **8** | **E-Commerce & Smart Sizing Specifics** | HIGH | Domain | Clear pricing formatting (VND with separators), Prominent size selector pills with clear stock indicators, Dedicated **AI Smart Fit Badge** with percentage match and delta tips, Sticky Add-to-Cart mobile bar. | Hiding garment measurements behind 3 clicks, Ambiguous sizing labels without actual cm measurements, Confusing checkout flows. |

## E-Commerce Luxury Design Principles (Tailored for FitVision 3D)

1. **Light & Airy Canvas:** Use stone-toned off-whites (`#FAFAF9` / `#FFFFFF`) to give garments space to breathe, reflecting high-end European fashion boutiques (Zara Atelier, COS, Jacquemus).
2. **Precision Hairline Borders:** Replace heavy shadows with subtle 1px hairline borders (`border-stone-200 / border-slate-100`).
3. **Product Sizing Clarity:** Every garment variant must link directly to actual anthropometric measurements (chest, waist, hips, length in cm), empowering the AI Sizing Engine to calculate real Fit-Scores.
4. **Mobile Bottom Navigation:** On mobile viewports, pin high-frequency navigation and quick-actions (Camera Scan, Catalog, Cart, Profile) to an ergonomic bottom thumb bar.

