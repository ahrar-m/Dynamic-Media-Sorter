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
    appMode: 'matchmaking', // Modes: 'matchmaking', 'history', 'executioner', 'leaderboard_viewer'
    
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
- **Ratings DB (`eloSorterRatings`)**: Persisted asynchronously in **IndexedDB** to support unlimited history and remove the strict 5MB quota limits. This guarantees zero data loss for 5000+ files.
- **Settings DB (`eloSorterSettings`)**: Keeps track of user preferences like Heatmap configuration, Auto-backup intervals, Start Muted preferences, and Default Fit mode. This remains in `localStorage` as it is lightweight.

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
- **K-Factor**: Uses a universal constant of `K = 64` for all files regardless of match count, ensuring consistent rating volatility across the entire ecosystem. The conditional logic checking if matches are `< 5` was removed from `calculateElo()`. The actual applied K-Factor is a balanced average `(kA + kB) / 2` to maintain a zero-sum system.
- **Matchmaking Zone Isolation (`pickNextPair()`)**:
  The pairing algorithm now enforces strict tier isolation to eliminate cross-tier contamination:
  1. Identifies the absolute minimum number of matches across the active pool (`minMatches`).
  2. Filters the active list to only those items where `matches === minMatches`.
  3. Pairs items exclusively within this sub-pool, guaranteeing all files graduate from N matches to N+1 matches together.
  4. If there is an odd number of items (1 item left in the sub-pool), it is allowed to pair against an item from the `minMatches + 1` pool to unblock tier progression.

## 🖼 UI Rendering & Memory Management

### Render Loop (`renderCurrentMedia`)
- Renders the currently focused item (`state.activeView`) into the `#media-container`.
- **Memory Leak Patch**: Calling `URL.createObjectURL()` allocates memory. The latest patch ensures `URL.revokeObjectURL(objectUrlA)` and `objectUrlB` are explicitly called before reassignment. Additionally, empty matchmaking states explicitly revoke blobs. Before rendering, existing `<video>` tags are explicitly paused and their `src` attributes are cleared so browsers stop buffering them in the background.

### UI Changes
- **No Top-Bar Voting**: The old A/B voting UI in the header has been removed. All voting happens via the large A/B buttons in the footer gesture controls (`#gesture-controls`). When a vote is cast, a `.voted` class is applied to the button, shifting the text to the bottom and fading in the Elo score difference above it.
- **Swipe Gestures**: The A/B buttons detect touch events. 
  - **Swipe Up**: Swiping up > 30px casts a vote. 
  - **Swipe Down**: Swiping down stages that specific media into the Executioner and calls `replaceSingleMedia(btnId)` to find a new opponent for the remaining media. If no valid opponent exists, it falls back to a standard pair skip.
  - **Tap**: Tapping without swiping changes the `activeView` (toggles preview).
- **Video Elements**: Videos are now spawned with `controls`, `autoplay`, and `loop`. Pointer events are set to `auto` allowing users to scrub the timeline or adjust native volume independently.
- **Skip Button Toggle**: Added a "Hide Skip Button" option to the Settings. When active, it completely hides the skip functionality to force voting.

### Continuous Leaderboard Viewer
An immersive mode (`state.appMode = 'leaderboard_viewer'`) that allows users to seamlessly iterate through the leaderboard array. In this mode, standard A/B buttons are hidden and replaced with specialized footer controls. 
- **Icon-Based Navigation**: The text labels for footer controls (Previous, Next, View Match History, Stage to Executioner) are replaced with purely icon-based buttons to prevent text overflow on mobile viewports.
- **Matches Count Display**: The status indicator explicitly shows the number of matches alongside the Elo and Rank (e.g., `Elo: 800 (Rank X of Y) | Matches: 5`).
Jumping into match history smoothly transitions into chronological review mode.

### Undo Mechanics
When a vote is cast, a complete snapshot of the state (Elo scores, matches, exact priorityQueue array, and history array length) is pushed to `state.undoStack`. When `Undo` is clicked, this data is popped and exactly restored, dropping the most recent history entries.

### The Executioner
An isolated mode (`state.appMode = 'executioner'`). Users stage files beneath an Elo threshold. They can review them in a timeline interface. Once approved, the app generates a Python script (`os.remove()`) since browser sandboxing prevents direct local file deletion.
