# Dynamic Media Sorter - Update Log

## [2026-06-17] Initialization & Branching
- Created git branch `features-expansion`.
- Started logging updates and subagent interactions.

## [2026-06-17] Feature Implementation: The Curator
- Implemented The Curator tool to export highly-ranked files into a "favorites" directory.
- Created UI button, modal, and Python script generation logic.
- Deployed subagents for QA review on The Curator feature.

## [2026-06-17] The Curator: QA Feedback & Fixes Applied
- **Visual/UI**: Removed inline styles for text area, improved mobile responsiveness with flex-wrap, changed button styling to match visual hierarchy, fixed double margins, styled helper text.
- **Logic**: Fixed percentage parsing logic, solved Python syntax edge cases with string generation, implemented Python logic to avoid file overwriting via `get_unique_path`.

## [2026-06-17] Feature Implementation: Analytics Dashboard
- Implemented a Dashboard modal to display Total Media, Matches Played, ETA, and a CSS-based Bell Curve for rating distributions.
- Deployed subagents for QA review on the Dashboard feature.

## [2026-06-17] Analytics Dashboard: QA Feedback & Fixes Applied
- **Visual/UI**: Replaced inline margins with CSS flex gap, updated grid layout to `stretch`, added a gradient and interactive hover states to the histogram bars, and added touch-friendly text overlays to the bars.
- **Logic**: Corrected Total Matches to reflect exact rounds instead of participations (divided by 4), fixed ETA distortion by calculating deficit on a per-item basis, and excluded unsorted media from the bell curve to fix the visual scale.

## [2026-06-17] Architectural Improvement: Build Step & Modular Code
- Extracted HTML, CSS, and JS from the monolithic `index.html` into a `src/` directory (`src/index.html`, `src/style.css`, `src/main.js`) for better maintainability.
- Created a fast, native Node.js `build.js` script to automatically bundle the modular source files back into a standalone `index.html` file for release.
- Deployed subagents for QA review on the new modular architecture.

## [2026-06-17] Architectural Refinements: Subagent Feedback
- **UI/Visual**: Moved the final lingering `<style>` block (animations and grids) into `src/style.css` to properly separate concerns.
- **Logic**: Removed `window.onload` in favor of `DOMContentLoaded` so the app initializes instantly instead of waiting for external network resources. Fixed local dev breakages by switching absolute paths (`/src/style.css`) to relative (`./style.css`).
- **Build**: Upgraded the `build.js` string injection script to use Regular Expressions, making it immune to HTML formatting changes.

## [2026-06-17] Feature Implementation: File System Access API
- Replaced the brittle Python/Bash script generation for **The Curator** and **The Executioner** with modern, native browser APIs.
- Added a `Direct Copy (Browser)` button to The Curator that uses `window.showDirectoryPicker()` to copy top-ranked files directly into a user-selected folder.
- Added a `Direct Delete (Browser)` button to The Executioner that allows the browser to traverse the local filesystem and natively delete staged files, completely bypassing the terminal.
- Deployed subagents for QA review on the new File System Access feature.

## [2026-06-17] File System Access API: QA Feedback Applied
- **Logic**: Fixed a bug where successfully deleted files weren't properly marked as blacklisted in IndexedDB. Fixed directory traversal edge case if a user selects a parent directory as the root handle. Wrapped the direct copy `write()` operation in an inner try-catch so that one corrupted file doesn't abort the entire batch export.
- **UI/Visual**: Modified The Curator modal layout to display the "Generate Script" and "Direct Copy" buttons evenly stacked at 100% width, matching The Executioner modal.

## [2026-06-17] Feature Implementation: Web Workers for Heavy Lifting
- Extracted the intensive TrueSkill (`openskill.js`) mathematical calculations and moved them entirely out of the main thread and into a new background `worker.js`.
- Configured `build.js` to automatically bundle the Web Worker script as an injected string blob, allowing the final output to remain a strictly standalone, single-file HTML app.
- Implemented asynchronous Promise wrappers around worker messages for seamless `await` integration in the UI logic.
- Deployed subagents for QA review on the new Web Worker implementation.

## [2026-06-17] Web Worker Architecture: QA Feedback Applied
- **Logic**: Wrapped `worker.js` message handler in a `try...catch` block to gracefully reject Promises and prevent `workerCallbacks` memory leaks and UI freezes. Safely initialized `item.rating.history` arrays for backward compatibility with older database schemas.
- **UI/Visual**: Upgraded `submitMatch` to use a `try...finally` block, explicitly unlocking `state.isAnimating`. Swapped the "Submit" button icon for a spinner during background processing. Actively blocked race conditions by preventing users from clicking UI toggles, placements, or navigation arrows while the background worker is computing math. Removed the artificial 100ms render delay, making submissions instant.

## [2026-06-17] UI/UX Refresh: Section 1 - Glassmorphism & Aesthetics
- Implemented deep inner lighting and translucent diagonal linear gradients to `.glass-panel` to dramatically improve the 3D material feel of the dark UI.
- Added profound drop shadows (`box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7)`) to all `.modal` components to strongly elevate them off the background canvas.
- Resolved CSS specificity conflicts where the footer grid and `.file-info` overlays were artificially overriding the glass background gradients.
- Deployed subagents for QA review on Section 1 updates and resolved minor `-webkit` backdrop issues and responsive viewport height unit fallbacks (`100vh` -> `100dvh`).

## [2026-06-17] UI/UX Refresh: Section 2 - Layout & Responsiveness
- Upgraded the `<header>` containers with dynamic `flex-wrap` and gap spacing to prevent layout snapping and overlap on very narrow viewports.
- Stripped rigid pixel `max-width` math from the `#placement-strip` scroll container, using `flex: 1; min-width: 0` to let the browser compute optimal remaining spatial bounds.
- Re-architected `.footer-grid` to utilize standard `grid-template-columns` on desktop/tablet for perfect centering, but implemented an `@media` query flex-wrap stack on narrow mobile screens (<600px) to prevent button squishing.
- Deployed subagents for QA. Resolved an `overflow` conflict by removing `overflow-y` from the horizontal scroll container. Verified by the Visual QA Checker that zero layout clipping exists and the main viewport scales perfectly.

## [2026-06-17] UI/UX Refresh: Section 3 - Visual Polish & UX Details
- Implemented fully customized translucent webkit scrollbars (`::-webkit-scrollbar`) to eliminate jarring native UI elements against the dark theme. Added Firefox `scrollbar-width` support.
- Upgraded form inputs, textareas, and selects with bright glowing focus states (`:focus-visible` with drop shadows) for drastically improved accessibility.
- Engineered a pure CSS custom toggle switch, fully replacing all native HTML checkboxes (`input[type="checkbox"]`). Features smooth layout animations and pill-shaped interactive bounds.
- Refactored `src/index.html` inline styles (`width: 18px;`) that were previously colliding with the new global custom CSS toggles. Repositioned the `#match-status-indicator` for better vertical balance.

## [2026-06-17] Final Overall Review & Robustness Patch
- Deployed overall QA subagents to thoroughly review the state of the codebase.
- Handled edge cases: Fixed an array slice mutation bug in `renderPlacementStrip` by checking `indexOf`, safely cleared ObjectURLs in `btnStageCurrent` to prevent memory leaks, forced `video.load()` during teardowns to stop hidden buffer leaks, and detached `Panzoom` wheel listeners securely if `handleMediaError` fires on corrupt files.
- UI Layout Edge Cases: Enclosed `load-dropdown` within `.header-left` for stable absolute anchoring, eliminated redundant `<svg>` wrapping classes in the matchup progress indicator, added flex column handling for leaderboard modals, and hardened hover states for touch devices (`@media (hover: hover)`).

## [2026-06-18] Mobile Layout Optimization & Processing Performance
- Resolved the cluttered header layout on mobile screens by consolidating all secondary actions (Leaderboard, Dashboard, The Curator, The Executioner, Settings, and Image/Video toggles) into a dedicated "Tools Menu" modal, dramatically simplifying the top navigation bar.
- Fixed a massive performance bottleneck when loading huge media sets (e.g. 25k+ files) that caused the app to hang in the "processing" state. Replaced the heavy full-array Fisher-Yates shuffle in `pickNextMatchup` with an ultra-lightweight `Set` based random index picker, restoring instant matchup generation.
- Reverted restrictive flex-wrap logic on the mobile footer. Removed the stacked 3-row layout overrides, returning the main UI controls to a clean, highly accessible single horizontal row.

## [2026-06-19] Lazy Loading Architecture & Matchmaking Enhancements
- Replaced the underlying architecture with true Lazy Loading: loading a massive 25k file folder now requires exactly zero processing overhead, drastically cooling devices and resulting in 0s load times.
- Resolved CORS issues on mobile apps by completely reverting the Web Worker structure back to the main thread.
- Designed a mathematically robust **Golden Ratio Matchmaking** system: Matchups now consistently consist of exactly 2 newly parsed items drawn fully randomly from the 25k unparsed pool combined seamlessly with 2 previously ranked items from the active pool.
- Added a background, non-blocking **Force Load All** UI button in the Settings panel for users preferring to pre-populate their database instantly.
- Handled all edge cases: automatically hidden the submit button during `autoSubmitMatch`, dynamically solved `blacklisted` staging leaks to preserve user file data, and corrected percentage overflow logic during mid-run directory drags.
