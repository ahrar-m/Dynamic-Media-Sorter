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

### Mode 1: Local Folder (Standalone Mode)
1. **Download**: Clone the repository or simply download [index.html](file:///storage/emulated/0/Documents/Antigravity/Dynamic%20Media%20Sorter/index.html).
2. **Open**: Open [index.html](file:///storage/emulated/0/Documents/Antigravity/Dynamic%20Media%20Sorter/index.html) in any modern mobile or desktop browser.
3. **Select Folder**: Click "Select Media Folder" and point it to the folder containing your media.
4. **Rank**: Drag/Tap items to rank them.
5. **Submit**: Click "Submit Rankings" to calculate TrueSkill ratings and load the next batch.

### Mode 2: Remote Media (Raspberry Pi / Server Mode)
Allows you to rank massive collections on an external hard drive connected to a Raspberry Pi over Wi-Fi, while keeping the ratings database securely in your phone's browser.

#### Step-by-Step Connection Setup

1. **Configure Mobile Hotspot on Phone**:
   - Enable Portable Hotspot / Mobile Hotspot in your phone's network settings.
   - Note the Wi-Fi network name (SSID) and Password.

2. **Connect Raspberry Pi to Phone Hotspot**:
   - Turn on Wi-Fi on your Raspberry Pi 5.
   - Connect the Pi 5 to the phone's hotspot Wi-Fi network.
   - You can connect via the desktop GUI or using the terminal:
     ```bash
     sudo nmcli dev wifi connect "YOUR_HOTSPOT_SSID" password "YOUR_HOTSPOT_PASSWORD"
     ```

3. **Retrieve Raspberry Pi's IP Address**:
   - Run `hostname -I` in a terminal on the Raspberry Pi.
   - Note the active Wi-Fi IP address assigned to the Pi (usually starts with `192.168.43.x` on Android or `172.20.10.x` on iOS).

4. **Launch Backend on Raspberry Pi**:
   - Transfer [server.py](file:///storage/emulated/0/Documents/Antigravity/Dynamic%20Media%20Sorter/server.py) to your Raspberry Pi.
   - Start the server using Python 3, pointing it to your media directory:
     ```bash
     python3 server.py /path/to/external/hdd/media
     ```
   - The server binds to all interfaces and runs on port `8000`.

5. **Open Frontend on Phone**:
   - Transfer [index.html](file:///storage/emulated/0/Documents/Antigravity/Dynamic%20Media%20Sorter/index.html) to your phone.
   - Open [index.html](file:///storage/emulated/0/Documents/Antigravity/Dynamic%20Media%20Sorter/index.html) in your phone's web browser.

6. **Connect Phone to Pi**:
   - In the frontend, under the **Connect Remote Pi** card, enter the Pi's IP address and port (e.g., `http://192.168.43.100:8000`).
   - Click **CONNECT**.

7. **Rank & Sort**:
   - The phone streams media over the local hotspot network connection.
   - JIT hashing is performed directly on the Pi 5 to conserve phone battery and bandwidth.
   - Ratings are calculated dynamically and stored locally in the phone browser's IndexedDB.

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
