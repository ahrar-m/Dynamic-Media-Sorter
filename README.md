# Dynamic Media Sorter

A powerful, entirely local media ranking tool built in a single HTML file. Stop struggling with manual sorting—let mathematical matchmaking figure out your favorite images and videos!

## 🚀 Quick Start / How to Use

1. **Load Media**: Click the **Folder+** button in the top left to load a folder or specific files. Background loading ensures the app stays responsive even with thousands of items.
2. **Toggle Modes**: Switch between Image and Video modes using the top-left toggle icons.
3. **Rank**: The app will present up to 4 pieces of media in a match. 
   - Use the **Prev** and **Next** buttons to cycle through the media in the current matchup.
   - Use the **Placement Strip (+ buttons)** to insert the currently visible media relative to the ones you've already placed. You are required to place the media as better or worse relative to the first added media in the match.
   - Once all media have a rank, click **Submit Match** to apply the updates. (You can also enable **"Auto-submit match once fully ranked"** in Settings to skip this click).
4. **Manage Your Library**: Open the **Leaderboard** to review the best files. 
5. **Delete Bad Files**: Use **The Executioner** (skull icon) to manage files you want to delete. 
   - Click the **Executioner icon** during a match to instantly send the active media to The Executioner and pull a new opponent into the match. **Note:** Only use this if the media is *absolutely not needed*. If a file has even slight positivity, retain it! The matchmaking math will naturally sort it to the bottom of your rankings over a few matches.
   - You can also stage poorly rated files in bulk directly from the Executioner menu by setting a rating threshold.
   - Once staged, start the **Executioner Review** to verify your condemned files. You can uncheck any files you want to save.
   - Finally, click **Generate Script & Exit** to download a standalone Python or Bash script. Running this script locally on your computer will permanently delete the staged files from your hard drive.

## ✨ Key Features

- **TrueSkill Matchmaking**: Ranks your media using the algorithm behind competitive gaming (mu and sigma). The system natively supports N-way Battle Royale match-ups (sizing up to 4 items at once) with completely random, chaotic matchmaking to get through your media significantly faster than 1v1 duels! Tap the circular **Pool Icon** at any time to see a breakdown of how many files have been matched at each tier.
- **Privacy First & Fully Local**: No server required. The tool runs directly in your browser. All media logic uses local `blob:` URLs, and your ratings database is saved directly to a limitless local database.
- **Mobile-Friendly UI**: Clean, mobile-friendly interface with native video playback controls, `autoplay`, `loop`, and a customizable "Start Muted" toggle. The footer features sequential navigation (`Prev` and `Next`) and checkbox ranking for active media.
- **Undo Stack**: Made a mistake? Use the **Undo** button to revert the last match seamlessly.
- **Dynamic Leaderboards**: View your absolute best and worst media. The leaderboard display is explicitly clamped to prevent UI lag. You can also toggle "Skip unmatched files" in Settings to keep unranked media off the leaderboard.
- **Native File Sharing**: Share your favorite media directly to other apps using the native Web Share API (on supported browsers/devices).
- **Import Randomization**: Folder imports are completely randomized up-front, and matchmaking instantly begins as soon as 4 items are loaded.

## 💾 Backup & Restore

Your data is safely stored in your browser's database, but it's always good to have a hard copy.
Go to **Settings** (gear icon) to export your ratings to a JSON file. You can also configure a **Custom Backup Prefix** to label your exports exactly how you want them.

**Smart Merge:** You can select multiple backup `.json` files when clicking "Restore Backup". The system will intelligently merge them. If there is a conflict (the same file rated differently in multiple backups), the system will preserve the history with the most matches played. If the match counts are tied, it keeps the highest rating score.

---

## 🛠️ Technical Details & Architecture

### Security & Privacy (100% Local & Safe)

This application is fully sandboxed and verified to be entirely safe for hosting on platforms like GitHub Pages. 

- **Zero Data Extraction:** An audit of the source code confirms there are absolutely no data-uploading functions (e.g., `fetch`, `XMLHttpRequest`, `axios`, `postMessage`). Your media, ratings, and filenames are never packaged or sent anywhere.
- **Minimal Network Fingerprint:** As a standalone HTML file, the app only makes four standard `GET` requests to public CDNs strictly to load aesthetics and the math library:
  - `fonts.googleapis.com` & `fonts.gstatic.com` (Google Fonts: Inter)
  - `cdnjs.cloudflare.com` (FontAwesome Icons)
  - `cdn.jsdelivr.net` (OpenSkill TrueSkill math module)

### Logic & Features Overview

- **Matchmaking Algorithm**: Uses the `openskill.js` library (an implementation of TrueSkill) to calculate a `mu` (skill) and `sigma` (uncertainty) for each media file. Matches are completely randomized across all loaded files to ensure chaotic, unbiased match-ups. Matches can be N-way (e.g., 1v1v1v1) which accelerates the sorting process.
- **File Management & Rendering**: The app uses the `FileReader` API and `URL.createObjectURL()` to display local files instantly via temporary `blob:` URLs without uploading them anywhere. 
- **Storage System**:
  - **IndexedDB**: Used for storing the extensive media ratings database. This bypasses the 5MB limit of standard `localStorage`, allowing you to rank tens of thousands of files without issues.
  - **localStorage**: Used solely for lightweight user preferences (match size, auto-submit, start muted, etc.).
- **The Executioner (File Deletion)**: Browsers cannot delete local files directly. Instead, the app stages your poorly rated files and generates a standalone Python or Bash script containing the paths of the "condemned" files. Running this script locally executes the deletion.
- **Asynchronous Loading**: File loading utilizes a chunked queue system to ensure the browser remains responsive even when importing thousands of files at once.

### Code Structure (Navigating `index.html`)

The entire application is bundled into a single `index.html` file to maximize portability. Here is a guide to help you navigate the source code:

1. **HTML Skeleton & CSS (Lines 1-496)**
   - Contains the CSS `<style>` block configuring the dark-mode glassmorphism UI.
   - Defines the modal structures (Settings, Leaderboard, Executioner) and the main media viewer area.
2. **Global State & Initialization (Lines 497-650)**
   - Defines the global variables (`files`, `ratings`, `settings`, `currentMatchup`).
   - The `init()` function sets up the database and loads preferences.
3. **Storage & Database (Lines 651-780)**
   - `openDB()`, `loadRatingsFromStorage()`, and `saveRatingsToStorage()` handle IndexedDB interactions.
   - Functions for `localStorage` manage UI settings.
4. **File Handling & Queuing (Lines 781-860)**
   - `handleFilesSelected()` and `processLoadingQueue()` manage parsing files and converting them to `blob:` URLs.
5. **Matchmaking Engine (Lines 861-1040)**
   - `pickNextMatchup()` selects media for the next round.
   - `submitMatch()` interfaces with the `openskill` module to calculate new `mu` and `sigma` values based on user rankings.
6. **UI Rendering (Lines 1041-1360)**
   - `renderCurrentMedia()` handles displaying images/videos.
   - `renderPlacementStrip()` creates the 1, 2, 3, 4 ranking buttons.
   - `renderLeaderboard()` and `renderExecutionerMedia()` populate their respective modals.
7. **Event Listeners & Script Generation (Lines 1361-1732)**
   - `setupEventListeners()` binds all clicks and keyboard shortcuts.
   - `exportRatings()` and `importRatings()` handle JSON backups.
   - `generateScripts()` creates the Python/Bash deletion scripts.