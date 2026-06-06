# Project Context & Session Progress Log
**Project:** Dynamic Media Sorter
**Date:** Current Session

## 📖 Purpose
This document serves as a persistent brain-dump and architectural history of the project. Its primary goal is to provide future agents and developers with deep context into the *why* and *how* behind architectural decisions, specifically to prevent repeating past mistakes and re-introducing patched bugs.

---

## 🏗 Key Architectural Shifts & Decisions

### 1. The Great Storage Migration (localStorage -> IndexedDB)
* **Initial State:** The app originally used synchronous `localStorage` (`eloSorterRatings`) to store every single match history entry.
* **The Problem:** A file's history grew indefinitely. For a user with 5000 files, the JSON payload quickly exceeded the browser's hard 5MB `localStorage` limit, resulting in a fatal `QuotaExceededError` that crashed the app upon voting.
* **Explored Solutions:** 
  - *Hard Caps:* Capping history at 50 items (rejected: user wanted complete history).
  - *Compression/Tuples:* Minifying the JSON structure and dynamically pruning 10% on quota hit (rejected: user wanted zero data loss).
* **The Final Decision:** Migrated the core database entirely to **IndexedDB**. 
* **Why:** IndexedDB supports Gigabytes of async storage natively in the browser without a server. 
* **Warning for Future Agents:** Do **NOT** attempt to use `localStorage` for the rating/history database ever again. It must remain asynchronous (`async/await`) using the `MediaSorterDB` IndexedDB store. `localStorage` is now strictly reserved for lightweight UI settings.

### 2. Matchmaking & The "First-Item Bias"
* **Initial State:** `pickNextPair()` iterated sequentially over an alphabetized array.
* **The Problem:** The app repeatedly paired the *very first file* (`IMG_001.jpg`) against every other file sequentially. Users were stuck rating the same left-side image 50 times in a row. 
* **The Fix:** We implemented a pre-shuffle (`Math.random() - 0.5`) of the `searchPool` *before* sorting it ascending by match count. 
* **Warning:** Never iterate deterministically over the file list for matchmaking. Always shuffle first to maintain visual diversity.

### 3. Elo Math Stabilization
* **Initial State:** Calibration matches used an asymmetrical K-factor (`kA = 128` for new files, `kB = 32` for established files).
* **The Problem:** If A won, A gained 64 Elo but B only lost 16. This violates Elo's zero-sum nature and causes massive rating inflation over thousands of matches. Furthermore, `128` was too volatile.
* **The Fix:** Reduced calibration K-factor to `64`. Implemented a shared `matchK = (kA + kB) / 2` so points gained *always* exactly equal points lost.

---

### 4. Advanced UX & Leaderboard Evolution
* **Continuous Leaderboard Viewer:** Added an immersive timeline mode (`appMode = 'leaderboard_viewer'`) to cycle through the top/bottom tier media linearly, decoupling the standard gesture controls and providing integrated shortcuts to the Executioner or chronological Match History.
* **Surgical Swipe-Down Replacements:** Previously, swiping down skipped the entire match. This was upgraded to explicitly purge *only* the targeted media while dynamically filtering the `searchPool` to retain the remaining media against a fresh opponent, avoiding redundant re-evaluations.
* **UI/Padding Polish:** Shrank the header and `.btn` padding for maximum real-estate, and shifted the primary gesture controls (A/B buttons) physically above the secondary row in the footer to improve mobile thumb ergonomics and prevent screen-edge misfires.

---

## 🐛 Critical Bugs Patched (Do Not Re-introduce)

### Blob Memory Leaks (`URL.createObjectURL`)
* **Bug:** Calling `createObjectURL` allocates memory that the garbage collector cannot touch until explicitly revoked. 
* **Mistakes Made:** 
  - Executioner mode revoked `objectUrlA` but forgot `objectUrlB`. 
  - The "Empty Matchups" screen bypassed revocation entirely.
* **Rule:** If a variable holds an object URL, it **must** be passed to `URL.revokeObjectURL()` before it is reassigned or when the UI is cleared.

### Phantom Video Decoders
* **Bug:** Overwriting `#media-container.innerHTML` with new media deletes the `<video>` element from the DOM, but Safari/Chrome often continue buffering and decoding the old video source in the background, causing massive CPU/memory leaks over time.
* **Rule:** Before modifying the media container's innerHTML, you must query all `<video>` tags, explicitly call `.pause()`, and remove their `.src` attribute.

### Touch Event Misfires
* **Bug:** The swipe-to-vote listener compared `startY - endY > 30`. Diagonal scrolling triggered accidental votes.
* **Rule:** Mobile swipe gestures must mathematically confirm intent: `Math.abs(diffY) > Math.abs(diffX)` ensures the vertical swipe was deliberate and not a horizontal scroll.

### Global Variable Leaks
* **Bug:** `itemA`, `itemB`, and `ratingA` were used without `let` or `const` declarations in `pickNextPair()`. In strict mode, this crashes the app.
* **Rule:** All variables must be strictly scoped.

---

## 🚀 Future Roadmap & Considerations
- **Data Export:** The export JSON string can get massive. We moved it to a `Blob` URL download, but if the stringification itself ever exceeds memory, we may need a streaming JSON builder.
- **UI Architecture:** The app is a massive single file (nearly 70KB). While portable, CSS grid squishing on mobile requires exact `min-height: 0` rules. Be careful modifying `.modal-grid-2` or `#media-container` flex properties as they easily break on iOS Safari.
