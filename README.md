# Dynamic Media Sorter

A lightning-fast, privacy-first, local web application designed to sort and rank massive collections of images and videos using an advanced Bayesian TrueSkill matchmaking engine.

## Features

- **Local-First & Privacy Focused**: The entire application is a single HTML file. It runs entirely inside your browser using the local file system. Your media is never uploaded to any server.
- **TrueSkill Matchmaking Engine**: Employs an intelligent N-Way matchmaking algorithm powered by `openskill`. Items are presented in dynamic batches (balanced 30% Discovery / 70% Ranked) to find their true ranking quickly and efficiently.
- **Zero-Friction Offline Access**: Download the `index.html` file and open it. No backend, no dependencies, no installation.
- **Persistent State & Progress**: Uses your browser's IndexedDB to silently and automatically save your exact progress. Safely export and resume your ranking sessions as `.json` files to move between devices.
- **Deep Media Support**: Handles both images (`jpg`, `png`, `webp`, `gif`) and videos (`mp4`, `webm`, `mov`) natively with optimized memory management.
- **Sleek, Responsive UI**: A beautiful, modern "glassmorphism" dark mode interface designed for extreme efficiency on both desktop and mobile/touch devices. Features full gesture support.

## Usage

1. **Download**: Clone the repository or simply download the `index.html` file.
2. **Open**: Double click the `index.html` file to open it in any modern browser (Chrome, Edge, Firefox, Safari).
3. **Select Folder**: Click "Select Media Folder" to point the app to the folder containing your unorganized media.
4. **Rank**: Reorder the media on the screen from Best (top-left) to Worst (bottom-right).
5. **Submit**: Click "Submit Rankings" to feed the results into the TrueSkill math engine. The app will immediately load the next intelligent batch for you to rank.

### Matchmaking Modes
- **Discovery**: Unranked or new items are pulled in to establish baseline scores.
- **Ranked**: Items with established scores are matched against closely-rated peers to fine-tune the global leaderboard.

### Controls
- Drag and drop to reorder items.
- Tap any item to view it in full screen.
- Trash items that don't belong (they are excluded from the Leaderboard but can be restored later).
- Export your progress to JSON at any time using the Header Menu.

## Technical Details

- **Architecture**: Monolithic vanilla HTML/CSS/JS.
- **Mathematics**: Uses `openskill` (via JSDelivr ESM) for TrueSkill Bayesian rating calculations (`μ` and `σ`).
- **Memory**: Implements JIT (Just-In-Time) hashing and strict `URL.revokeObjectURL()` memory management to prevent memory leaks during long ranking sessions.
- **Compatibility**: Android WebView optimized. Bypasses restrictive file storage limits by using `webkitdirectory` permissions and IndexedDB graceful fallbacks.

## License
MIT
