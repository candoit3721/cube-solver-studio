# Site Redesign Design — Rubik's Cube Solver

**Date:** 2026-02-19
**Scope:** 3x3 only
**Goal:** Transform the current single-page tool into a modern, full-featured cube solving site with equal weight on solving and learning.

---

## Overview

The current codebase is a rich single-page app with a 3D Three.js cube, two solvers (Kociemba optimal + 7-phase beginner LBL), camera scanning (fixed + free), a manual color editor, and step-by-step solution playback. It has no navigation, no landing page, and no dedicated educational content — it's a powerful tool with no "site" around it.

This redesign wraps the existing tool in a proper site structure using **React Router v6**, adding a landing page, a beginner guide, and an algorithm reference — while leaving all existing functionality intact.

---

## Architecture

### Routing

```
/            → Home (landing page)
/solve       → Solver (existing app)
/learn       → Beginner Guide (7-chapter LBL walkthrough)
/algorithms  → Algorithm Reference (notation + LBL algorithms)
```

### What gets reused (unchanged)

- `CubeCanvas`, `TopBar`, `BottomBar`, `SidePanel`
- All modals: `CameraModal`, `FreeScanModal`, `CalibrationModal`, `EditorModal`, `NotationModal`
- All engine logic: `cubeEngine`, `animator`, `cubeState`, `layeredSolver`, `solver`
- All scanner logic: `colorClassifier`, `colorCalibration`, `cvBridge`, `faceDetector`, `faceTracker`, `faceOrienter`
- Backend API (`server/`) — unchanged
- `useCubeState` hook — unchanged

### What gets added

| File | Purpose |
|------|---------|
| `src/router.jsx` | React Router v6 route definitions |
| `src/components/NavHeader.jsx` | Persistent sticky nav (logo + links + mobile drawer) |
| `src/pages/Home.jsx` | Landing page |
| `src/pages/SolvePage.jsx` | Thin wrapper mounting existing `AppInner` |
| `src/pages/LearnPage.jsx` | Chapter-based beginner guide |
| `src/pages/AlgorithmsPage.jsx` | Notation guide + LBL algorithm reference |
| `src/styles/NavHeader.css` | Nav styles |
| `src/styles/Home.css` | Landing page styles |
| `src/styles/LearnPage.css` | Learn page styles |
| `src/styles/AlgorithmsPage.css` | Algorithms page styles |

### Dependencies to add

- `react-router-dom` v6

---

## Page Designs

### NavHeader (persistent across all pages)

- Height: ~56px, dark background (`#0a0a14`) matching cube canvas
- Left: logo/wordmark
- Center: nav links — **Home · Solve · Learn · Algorithms**
- Right: (reserved for future icons)
- Active link highlighted
- Mobile: hamburger → slide-down drawer
- Implemented as a layout wrapper component wrapping all routes

---

### Home (`/`)

**Hero section** (full viewport height)
- Background: `CubeCanvas` in read-only, auto-rotate demo mode (scrambled cube, no controls, no solve UI)
- Headline: *"Solve any Rubik's Cube — step by step."*
- Subtext: *"Scan your cube, get a solution, and learn the method."*
- Three CTAs:
  - `Scan & Solve` → `/solve`
  - `Learn the Method` → `/learn`
  - `Algorithm Reference` → `/algorithms`

**Feature strip** (three cards below hero)
- **Solver** — "Point your camera or paint the stickers. Get an optimal or beginner solution in seconds."
- **Learn** — "Master the Layer-by-Layer method with 7 guided steps and algorithm explanations."
- **Algorithms** — "Every move explained. The notation guide and all key LBL algorithms in one place."

**How it works** (three numbered steps)
1. Scan your cube with the camera or enter it manually
2. Choose Optimal (shortest path) or Beginner (layer-by-layer) mode
3. Follow the step-by-step animated solution

---

### Solver (`/solve`)

The existing `AppInner` component, mounted inside `SolvePage`. `TopBar` is hidden (NavHeader replaces it). All functionality preserved:
- 3D canvas
- BottomBar (all controls)
- SidePanel (solution steps + phase explanations)
- All modals
- Keyboard shortcuts
- Backend health polling

**One addition:** "New here? Learn the method →" link in `SidePanel` footer (only shown when beginner mode is active), navigating to `/learn`.

---

### Learn (`/learn`)

**Layout:** Two-column on desktop (sticky chapter sidebar left, content right). Single column on mobile (horizontal pill nav above content).

**Chapter sidebar:** Lists all 7 steps with names. Clicking scrolls to the anchor section.

**Chapter content structure** (repeated for each of 7 chapters):

```
[Step N: Phase Name]
Goal: [one-line goal statement]

[Why this step — paragraph]

Algorithm:
  [move sequence — color-coded tokens]

Hold the cube: [orientation note]

[Practice in Solver →] button
```

**Content source:** The `PHASE_INFO` object in `SidePanel.jsx` already has `why`, `goal`, and `alg` for all 7 phases. The Learn page expands this into full sections with better formatting.

**7 Chapters:**
1. White Cross
2. White Corners
3. Middle Layer
4. Yellow Cross
5. Yellow Edge Permutation
6. Yellow Corner Permutation
7. Yellow Corner Orientation

---

### Algorithms (`/algorithms`)

**Section 1 — Notation Guide**
- Promotes the existing `NotationModal` content to a full page section
- 18 standard moves (U/D/R/L/F/B + primes + doubles)
- Each move shown as a card: move name + description + visual indicator
- Interactive: clicking a move card shows it applied to a small embedded cube (reuses engine)

**Section 2 — LBL Algorithm Reference**
- 7 algorithm cards, one per LBL phase
- Each card: phase name, algorithm move sequence (styled tokens), what it does
- "Try it in Solver →" link on each card

---

## State Management

No shared state needed across pages. Each page manages its own state:
- `CubeProvider` scoped to `SolvePage` only
- Home page cube is a separate read-only `CubeCanvas` instance
- Learn and Algorithms pages are static content (no cube state)

---

## Mobile Considerations

- NavHeader collapses to hamburger on narrow viewports
- Home hero CTAs stack vertically on mobile
- Learn page: sticky sidebar becomes a horizontal pill-nav
- Solver page: existing mobile layout unchanged

---

## Non-Goals (out of scope for this phase)

- No timer / speedcubing mode
- No CFOP / advanced methods (learn page covers LBL only)
- No user accounts / progress persistence
- No OLL/PLL full case tables (algorithms page covers LBL only)
- No community features
