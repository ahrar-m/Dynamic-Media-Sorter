# Dynamic Media Sorter

A powerful, entirely local, Elo-based media ranking tool built in a single HTML file. Stop struggling with manual sorting—let mathematical matchmaking figure out your favorite images and videos!

## ✨ Key Features

- **Elo-Based Matchmaking & Strict Isolation**: Ranks your media using a chess-style Elo algorithm. Files start at an Elo of 800 and adjust based on face-offs. Uses a universal K-factor of 64 for consistent rating volatility. The system strictly isolates matchmaking zones, ensuring files only match with others that have the exact same number of matches, completely eliminating cross-tier contamination.
- **Privacy First & Fully Local**: No server required. The tool runs directly in your browser. All media logic uses local `blob:` URLs, and your ratings database is saved directly to a limitless `IndexedDB` backend (replacing the 5MB `localStorage` limit). It also features new on-screen error diagnostics to immediately catch and alert you of any issues.
- **Gesture Controls & Native Video**: Clean, mobile-friendly interface with improved memory management and robust mobile gesture handling. Tap "A" or "B" to preview, and **swipe up** to cast your vote! Video media comes with native playback controls, `autoplay`, `loop`, and a customizable "Start Muted" toggle.
- **Priority Queue & Skip**: Can't decide? Hit **Skip**. Skipped items are immediately pushed to a background *Priority Queue* so they get re-matched quickly, ensuring no file is left behind. Prefer forced choices? You can toggle the Skip button off in Settings.
- **Undo & Match History**: Made a mistake? Use the **Undo** button to revert the last match. You can also view a file's complete head-to-head match history in an immersive timeline replay.
- **Dynamic Leaderboards & Heatmaps**: View your absolute best (Top Tier) and worst (Bottom Tier) media. The settings menu features a dynamic heatmap visualizing your Elo distribution.
- **Continuous Leaderboard Viewer**: Dive into your top or bottom ranked media with an immersive continuous viewer. Seamlessly iterate through the leaderboard, review match histories on the fly, and stage items for deletion without leaving the view. The UI features clean, icon-based controls and clearly displays both the Elo and total matches played for each item.
- **Swipe Down Single Swap**: Don't like one side of the match? **Swipe down** on a media button to instantly stage that specific file to The Executioner and immediately replace it with a new opponent, leaving the other media in place!
- **The Executioner**: Time to clean house. Set an Elo threshold, stage the worst-rated files, and perform an immersive review. Once finalized, generate a simple Python script to automatically delete the losing files from your hard drive!

## 🚀 How to Use

1. **Load Media**: Click the **Folder+** button in the top left to load a folder or specific files. Background loading ensures the app stays responsive even with thousands of items.
2. **Toggle Modes**: Switch between Image and Video modes using the top-left toggle icons.
3. **Vote**: The app will present two pieces of media. 
   - Tap **A** or **B** to focus on that media.
   - Click/Tap the buttons, or **swipe up** on mobile, to cast your vote for the winner!
   - **Swipe down** on mobile to stage that specific media and instantly swap it out for a new opponent!
   - Use the **Skip** button to pass on the current matchup (they will be queued up again shortly).
   - Use the **Undo** button if you accidentally selected the wrong winner.
4. **Filters**: Click the **Filter** icon to sort your matching pool. Filter by Unrated, Rated, or use dynamic percentiles (Top 25% or Bottom 25%).
5. **Manage Your Library**: Open the **Leaderboard** to review the best and worst files. Or use **The Executioner** (skull icon) to purge the files that didn't make the cut.

## 💾 Backup & Restore

Your data is safely stored in a limitless `IndexedDB` database, but it's always good to have a hard copy.
Go to **Settings** (gear icon) to export your ratings to a JSON file. You can also set an **Auto Backup** interval to periodically download backups automatically while you sort.