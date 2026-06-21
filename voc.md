# Voice of the Customer (VOC)

## User Needs & Goals
- **Scale**: Needs to handle around 50,000 media files (photos and videos).
- **Core Functionality**:
  - Sort and rank media files using the **Openskill ranking system** (1v1 comparisons).
  - **Media Separation**: Images and Videos are matched separately. Images are only compared against images, and videos against videos.
  - **Video Seeking**: Videos have seek controls enabled.
  - **Instant "Trash" Action**: During 1v1 comparisons, instantly mark useless media for deletion so it never appears in future match-ups.
  - Delete the lowest-ranked and "trashed" media by **generating a deletion script** or a text list of bad files for the user to run/use later via PC or file manager.
  - View a leaderboard of the best media with their rankings.
  - Share media directly from the app (using Web Share API).
- **Workflow & State Management**:
  - **Immersive UI**: UI elements are minimized to maximize space for media.
  - **Randomized Comparisons**: The app picks unranked or closely-ranked files of the same type for comparison. Users can stop and resume over multiple sessions to avoid being overwhelmed.
  - **Save/Load State**: Users download a lightweight `.json` save file when stopping. To resume, they upload the `.json` and re-select the media folder.
- **Distribution & Execution**:
  - Packaged as a **single, standalone HTML file** (all CSS/JS inlined) hosted on GitHub.
  - Easily downloadable and fully functional offline.
- **Platform**:
  - Android-optimized HTML file.

## Technical Architecture & Design Decisions
- **File Access**: Use `<input type="file" webkitdirectory multiple>` to load local folder handles into browser memory without uploading.
- **Ranking Engine**: Implement Openskill.js (inlined or bundled into the single HTML file) for fast, robust multiplayer-style Elo ratings adapted for 1v1 media comparisons.
- **Performance**: Virtualize or paginate the leaderboard. Only keep currently compared media in memory/rendered to the DOM to prevent crashing the Android browser when dealing with 50k items.
- **Aesthetics**: Premium, dark-mode focused, glassmorphism UI with smooth micro-animations, adhering to modern design principles.
