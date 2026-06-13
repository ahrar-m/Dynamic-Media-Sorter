# Dynamic Media Sorter

A powerful, entirely local media ranking tool built in a single HTML file. Stop struggling with manual sorting—let mathematical matchmaking figure out your favorite images and videos!

## 🔒 Security & Privacy (100% Local & Safe)

This application is fully sandboxed and verified to be entirely safe for hosting on platforms like GitHub Pages. 

- **Zero Data Extraction:** An audit of the source code confirms there are absolutely no data-uploading functions (e.g., `fetch`, `XMLHttpRequest`, `axios`, `postMessage`). Your media, ratings, and filenames are never packaged or sent anywhere.
- **Local Storage Only:** The application relies exclusively on your browser's local sandbox to save data. Settings are saved using `localStorage`, and all media ratings/history are saved using an `IndexedDB` database directly on your device.
- **Minimal Network Fingerprint:** As a standalone HTML file, the app only makes four standard `GET` requests to public CDNs strictly to load aesthetics and the math library:
  - `fonts.googleapis.com` & `fonts.gstatic.com` (Google Fonts: Inter)
  - `cdnjs.cloudflare.com` (FontAwesome Icons)
  - `cdn.jsdelivr.net` (OpenSkill TrueSkill math module)
  
  None of these requests transmit any personal data; they only pull static files into your browser so the UI renders correctly and the matchmaking math functions.

## ✨ Key Features

- **TrueSkill Matchmaking**: Ranks your media using the `openskill` ES module algorithm (mu and sigma). The system natively supports N-way Battle Royale match-ups (sizing up to 4 items at once) to get through your media significantly faster than 1v1 duels!
- **Privacy First & Fully Local**: No server required. The tool runs directly in your browser. All media logic uses local `blob:` URLs, and your ratings database is saved directly to a limitless `IndexedDB` backend.
- **Mobile-Friendly UI**: Clean, mobile-friendly interface with native video playback controls, `autoplay`, `loop`, and a customizable "Start Muted" toggle. The footer features sequential navigation (`Prev` and `Next`) and checkbox ranking for active media.
- **Undo Stack**: Made a mistake? Use the **Undo** button to revert the last match seamlessly.
- **Dynamic Leaderboards**: View your absolute best and worst media. The leaderboard display is explicitly clamped to prevent UI lag.
- **The Executioner**: Time to clean house. Set a rating threshold, stage the worst-rated files, and perform an immersive review. Once finalized, generate a simple Python script to automatically delete the losing files from your hard drive!

## 🚀 How to Use

1. **Load Media**: Click the **Folder+** button in the top left to load a folder or specific files. Background loading ensures the app stays responsive even with thousands of items.
2. **Toggle Modes**: Switch between Image and Video modes using the top-left toggle icons.
3. **Rank**: The app will present up to 4 pieces of media in a match. 
   - Use the **Prev** and **Next** buttons to cycle through the media in the current matchup.
   - Use the **Checkboxes (1, 2, 3, 4)** to assign a rank to the currently visible media.
   - Once all media have a rank, click **Submit Match** to apply the TrueSkill updates. (You can also enable **"Auto-submit match once fully ranked"** in Settings to skip this click).
4. **Manage Your Library**: Open the **Leaderboard** to review the best files. Use **The Executioner** (skull icon) to stage files for deletion. Click the "Executioner" icon during a match to instantly send the active media to The Executioner and pull a new opponent into the match!

## 💾 Backup & Restore

Your data is safely stored in a limitless `IndexedDB` database, but it's always good to have a hard copy.
Go to **Settings** (gear icon) to export your ratings to a JSON file.