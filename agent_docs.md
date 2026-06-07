# Agent Documentation: Dynamic Media Sorter

This document provides a deep dive into the architecture and state management of the **Dynamic Media Sorter**. The entire application is intentionally encapsulated within a single file (`Dynamic Media Sorter.html`) containing all HTML, CSS, and JavaScript.

## 🏗 Architecture Overview
- **Single-File Structure**: Designed for extreme portability. All scripts and styles are defined inline.
- **Local API**: Relies completely on Web APIs. Files are read via `<input type="file" webkitdirectory>`, converted to in-memory `blob:` URLs via `URL.createObjectURL()`, and ratings persist locally via IndexedDB.

## 🧠 State Management

### The `state` Object
```javascript
const state = {
    images: [],
    videos: [],
    ratings: {},            // Key: File ID -> Rating Object (mu, sigma)
    stagedFilesMap: new Map(), // Executioner staging map
    currentMatchup: [],     // Array of up to 4 files
    currentRankings: {},    // Map of File ID -> Rank (1-4)
    hasSeen: new Set(),     // Tracks which media in the matchup have been viewed
    activeViewIndex: 0,     // Index of currently viewed media in the matchup
    leaderboardType: 'image',
    appMode: 'matchmaking', 
    
    leaderboardQueue: [], 
    leaderboardIndex: 0,
    
    executionerQueue: [],
    executionerIndex: 0,
    
    isAnimating: false,
    infoVisible: false,
    fitMode: 'contain',
    
    undoStack: [],          
};
```

### Storage Mechanisms
- **Ratings DB (`MediaSorterDB`)**: Persisted asynchronously in **IndexedDB**. 
- **Settings DB (`eloSorterSettings`)**: Keeps track of user preferences in `localStorage`.

### Ratings Schema
A single rating entry in `state.ratings` looks like this:
```json
{
  "mu": 25.0,
  "sigma": 8.333,
  "matches": 2
}
```
*Note*: `id` is generated via `${file.name}_${file.size}` to handle browser security contexts where absolute paths are unavailable.

## 🧮 TrueSkill & Matchmaking Logic
- **Initialization**: New files default to OpenSkill defaults (mu: 25, sigma: 8.333).
- **Matchmaking Zone Isolation**: 
  The algorithm groups media by exact match count (`minMatches`). Files exclusively pair against other files in the exact same tier, sizing up to N-way battles based on settings.

## 🖼 UI Rendering & Memory Management

### Render Loop (`renderCurrentMedia`)
- Renders the currently focused item (`state.currentMatchup[state.activeViewIndex]`) into the `#media-container`.
- Explicitly calls `URL.revokeObjectURL(objectUrlA)` before reassignment to prevent memory leaks.

### UI Changes
- **No Swipe Gestures**: Swiping to vote was completely removed. Replaced by explicit Prev/Next and checkbox ranks.
- **Submit Match**: Requires the user to have viewed (`hasSeen`) every file in the matchup and assigned a unique rank to all files.

### The Executioner
An isolated mode (`state.appMode = 'executioner'`). Users stage files beneath a threshold. Once approved, the app generates a Python script (`os.remove()`).
