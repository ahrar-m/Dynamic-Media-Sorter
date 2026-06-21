# Voice of the Customer (VOC)

## User Needs & Goals
- **Scale**: Needs to handle around 50,000 media files (photos and videos).
- **Core Functionality**:
  - Sort and rank media files using the **Openskill ranking system** (1v1 comparisons).
  - **Media Separation**: Images and Videos are sorted entirely separately. The user can toggle between "Image Mode" and "Video Mode" on any screen.
  - **Tinder-like Swiping**: Swipe right on a media to select it as the winner (which automatically swipes the other left/reject). Swipe left to reject it (which selects the other as winner).
  - **Video Seeking**: Videos have native controls.
  - **Trash Action & Partial Refresh**: Trashing a media instantly removes it and loads a single new replacement in its place, preserving the other media for a continued matchup.
  - **Undo Feature**: A simple "Undo" button allows reversing the very last match or trash action in case of an accidental tap.
  - **Leaderboard**: View top media with their rankings, paginated 16 items at a time (infinite scroll or load more). Includes an option to toggle advanced scoring details (mu, sigma).
  - **Export Deletion**: Export a script of the trashed media to easily delete them via a PC.
  - Share media directly from the app (using Web Share API).

## Technical Architecture & Design Decisions
- **UI & Navigation**: 
  - **Bottom Navigation Bar**: Modern, app-like navigation with icons for Arena, Leaderboard, and Trash.
  - **Full Screen Mode**: Added a dedicated full-screen button to the top bar for an uninterrupted sorting experience.
  - **Clean Layout**: UI elements are compact. Absolutely no overlays on top of the images/videos in the arena.
  - **Scrollable & Responsive**: The app allows natural vertical scrolling where necessary, using `100dvh` to prevent mobile browser cutoff.
- **File Access**: `<input type="file" webkitdirectory multiple>`
- **Ranking Engine**: Openskill.js (ES Module import).
- **Performance**: Lazy load grid items 16 at a time to prevent DOM bloat and crashing.
- **Aesthetics**: Premium, dark-mode focused, glassmorphism UI with smooth micro-animations.
