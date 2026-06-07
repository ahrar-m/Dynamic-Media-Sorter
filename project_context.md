# Project Context & Session Progress Log
**Project:** Dynamic Media Sorter
**Date:** Current Session

## 📖 Purpose
This document serves as a persistent brain-dump and architectural history of the project.

---

## 🏗 Key Architectural Shifts & Decisions

### 1. Storage Migration (localStorage -> IndexedDB)
* Migrated the core database entirely to **IndexedDB** to bypass the 5MB localStorage limit. 
* Implemented surgical saving (`saveRatingsToStorage(updatedIds)`) to fix a critical O(N) lag spike when submitting matches in large libraries.

### 2. Matchmaking Algorithm: Elo -> OpenSkill (TrueSkill)
* **Initial State:** Used standard 1v1 Elo algorithms.
* **The Problem:** 1v1 comparisons scale poorly for large media libraries, requiring too many matches to stratify properly.
* **The Fix:** Migrated to `openskill.js`. Features N-way Battle Royale matchmaking (2, 3, or 4 files at once). Media is ranked sequentially and evaluated using `mu` and `sigma`.

### 3. UI Overhaul: Gesture Control -> Sequential Navigation
* **Initial State:** Swipe gestures (swipe up to vote, swipe down to Executioner) and 1v1 side-by-side.
* **The Fix:** Removed all swipe gestures and visual history UI components. Converted to a sequential viewer with `Prev` and `Next` buttons, and `1, 2, 3, 4` checkboxes for explicit ranking.

### 4. Surgical Executioner Swaps
* Clicking the Executioner button explicitly purges *only* the targeted media while dynamically filtering the `searchPool` to retain the remaining media against a fresh opponent.

---

## 🐛 Critical Bugs Patched (Do Not Re-introduce)

### Blob Memory Leaks (`URL.createObjectURL`)
* **Bug:** Calling `createObjectURL` allocates memory. 
* **Rule:** If a variable holds an object URL, it **must** be passed to `URL.revokeObjectURL()`.

### Phantom Video Decoders
* **Bug:** Overwriting `#media-container.innerHTML` leaves Safari/Chrome buffering the video.
* **Rule:** You must query all `<video>` tags, explicitly call `.pause()`, and remove their `.src` attribute.

### Radio Button Invisible Ties
* **Bug:** Standard HTML radio buttons across different elements can cause state de-syncs if `state.currentRankings` isn't updated.
* **Rule:** Explicitly iterate through the rankings object on `onchange` and delete conflicting ranks.
