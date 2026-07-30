# Design System

## Direction

Exam-day clarity with a small pulse of campus energy: precise, dependable, and fast to scan. This is a product interface, so familiar controls and consistent information hierarchy take priority over decorative novelty.

## Color

Use OKLCH tokens only. The restrained indigo anchor is reserved for primary actions, focus, selection, and meaningful chart emphasis; it is not a decorative wash.

### Light

- Background: `oklch(1 0 0)`
- Surface: `oklch(0.97 0.006 280)`
- Elevated surface: `oklch(0.94 0.010 280)`
- Ink: `oklch(0.20 0.025 280)`
- Muted ink: `oklch(0.43 0.030 280)`
- Primary: `oklch(0.50 0.160 280)`
- Accent: `oklch(0.57 0.120 190)`

### Dark

- Background: `oklch(0.11 0 0)`
- Surface: `oklch(0.16 0.012 280)`
- Elevated surface: `oklch(0.21 0.018 280)`
- Ink: `oklch(0.94 0.010 280)`
- Muted ink: `oklch(0.72 0.025 280)`
- Primary: `oklch(0.72 0.145 280)`
- Accent: `oklch(0.78 0.110 190)`

Success, warning, error, and information states use both an icon/label and color. Filled mid-luminance colors always use near-white text. Validate final combinations with automated and visual contrast checks.

## Typography

Use locally bundled Inter Variable for all UI text with a system-sans fallback. Use a compact 1.15 type scale, tabular numerals for registrations and grade points, balanced headings, and 65-75ch maximum prose width. Avoid display fonts and oversized dashboard metrics.

## Layout

- Center content in a 1180px shell with 20-32px responsive gutters.
- Use a compact sticky top navigation, not a permanent sidebar.
- Use split layouts for search/summary and analytics, semantic tables for comparable rows, and bands/dividers instead of endless card grids.
- At narrow widths, preserve labels and transform wide result rows into readable stacked records without changing source order.

## Components

Controls share one 10px radius vocabulary; panels stay at 12-16px. Every interactive state includes hover, focus, active, disabled, loading, and error behavior. Use skeletons only for genuinely asynchronous route loading. Empty states explain what to do next.

## Motion

Use 150-250ms ease-out transitions only for navigation state, disclosure, theme changes, and feedback. No page-load choreography. Under `prefers-reduced-motion`, remove transforms and shorten transitions to near-instant changes.
