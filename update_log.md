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
