# Agent Documentation: Dynamic Media Sorter

This document provides a deep dive into the architecture and state management of the **Dynamic Media Sorter**. The entire application is intentionally encapsulated within a single file (`Dynamic Media Sorter.html`) containing all HTML, CSS, and JavaScript.

## 🏗 Architecture Overview
- **Single-File Structure**: Designed for extreme portability. All scripts and styles are defined inline.
- **Local API**: Relies completely on Web APIs. Files are read via `<input type="file" webkitdirectory>`, converted to in-memory `blob:` URLs via `URL.createObjectURL()`, and ratings persist locally via `localStorage`.
- **CSS Architecture**: Flexbox and CSS Grid based. Recent mobile flexbox squishing fixes rely on `min-height: 0; min-width: 0;` on `#media-container` and `flex-shrink: 0` on the footer to ensure proper rendering without overflowing viewports.

## 🧠 State Management

All critical application state is centralized in the `state` object. 

### The `state` Object
```javascript
const state = {
    images: [],             // Array of File objects (Images)
    videos: [],             // Array of File objects (Videos)
    ratings: {},            // Core DB. Key: File ID -> Rating Object
    stagedFilesMap: new Map(), // Executioner staging map
    currentPair: null,      // { a: File, b: File }
    leaderboardType: 'image', // 'image' or 'video'
    filter: 'all',          // 'all', 'unrated', 'rated', 'positive', 'negative'
    activeView: 'A',        // 'A' or 'B' focuses the active media
    appMode: 'matchmaking', // Modes: 'matchmaking', 'history', 'executioner'
    
    // History & Timelines
    historyQueue: [], 
    historyIndex: 0,
    historyFile: null,
    
    // The Executioner
    executionerQueue: [],
    executionerIndex: 0,
    
    // UI Flags & Modifiers
    isAnimating: false,
    infoVisible: false,
    fitMode: 'contain',
    hasSeenA: false,
    hasSeenB: false,
    
    // Core Stack/Queues
    undoStack: [],          // Stores previous state for complete reverts
    priorityQueue: []       // Array of File IDs that were Skipped and need urgent rematching
};
```

### Storage Mechanisms
- **Ratings DB (`eloSorterRatings`)**: Persisted as a stringified JSON object in `localStorage`.
- **Settings DB (`eloSorterSettings`)**: Keeps track of user preferences like Heatmap configuration, Auto-backup intervals, Start Muted preferences, and Default Fit mode.

### Ratings Schema
A single rating entry in `state.ratings` looks like this:
```json
{
  "elo": 850,
  "matches": 2,
  "history": [
    {
      "opponentId": "IMG_123.jpg_4096",
      "opponentName": "IMG_123.jpg",
      "result": "won", // 'won', 'lost', or 'skip'
      "eloChange": "+25",
      "historicalEloA": 825,
      "historicalEloB": 800,
      "timestamp": 1690000000000
    }
  ]
}
```
*Note*: `id` is generated via `${file.name}_${file.size}` to handle browser security contexts where absolute paths are unavailable.

## 🧮 Elo & Matchmaking Logic
- **Initialization**: New files default to `800` Elo.
- **K-Factor**: Uses a dynamic K-factor to handle variance. Files with `< 5` matches have `K = 128` to quickly stratify them. Once they reach `5` matches, `K = 32` for stable tweaking.
- **Pairing Algorithm**:
  1. Checks the `priorityQueue` first (populated when a user hits "Skip").
  2. If the priority queue is empty, shuffles the candidate pool and prioritizes files with the lowest match counts.
  3. Finds an opponent that it hasn't fought before. If `matches < 5`, opponent is purely random. If `matches >= 5`, it picks from a group of opponents with the closest Elo scores to keep matchups competitive.

## 🖼 UI Rendering & Memory Management

### Render Loop (`renderCurrentMedia`)
- Renders the currently focused item (`state.activeView`) into the `#media-container`.
- **Memory Leak Patch**: Calling `URL.createObjectURL()` allocates memory. The latest patch ensures `URL.revokeObjectURL(objectUrlA)` and `objectUrlB` are explicitly called before reassignment.

### UI Changes
- **No Top-Bar Voting**: The old A/B voting UI in the header has been removed. All voting happens via the large A/B buttons in the footer gesture controls (`#gesture-controls`).
- **Swipe Gestures**: The A/B buttons detect touch events. Swiping up > 30px casts a vote. Tapping without swiping just changes the `activeView` (toggles preview).
- **Video Elements**: Videos are now spawned with `controls`, `autoplay`, and `loop`. Pointer events are set to `auto` allowing users to scrub the timeline or adjust native volume independently.

### Undo Mechanics
When a vote is cast, a complete snapshot of the state (Elo scores, matches, exact priorityQueue array, and history array length) is pushed to `state.undoStack`. When `Undo` is clicked, this data is popped and exactly restored, dropping the most recent history entries.

### The Executioner
An isolated mode (`state.appMode = 'executioner'`). Users stage files beneath an Elo threshold. They can review them in a timeline interface. Once approved, the app generates a Python script (`os.remove()`) since browser sandboxing prevents direct local file deletion.
