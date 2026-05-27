# Dynamic Media Sorter

Dynamic Media Sorter is a 100% offline, serverless HTML5 application designed for lightning-fast media triage, sorting, and batch deletion.

## 🔒 Security & Privacy (Zero Data Extraction)
**This application is fully sandboxed.** 
* **Zero Network Requests:** It does not make any API calls, it does not use a backend server, and it does not upload any of your files or metadata to the cloud. You can completely disconnect from the internet (Airplane Mode) and the application will still function flawlessly.
* **Non-Destructive Scanning:** When you load a folder, the browser creates local, temporary memory links (`URL.createObjectURL`) to stream the media straight from your hard drive into the web-player. The source files are never altered, compressed, or moved.
* **Executioner Safety:** Because browsers are sandbox-restricted from deleting local files directly, the "Executioner" tool safely generates a text script (Python, Bash, or Windows CMD). You maintain total control over when and how files are physically deleted by running that script yourself.

## Features
* **Universal Compatibility:** Runs in any modern browser (Chrome, Firefox, Safari) on Windows, Linux, Mac, and Android.
* **Persistent Memory & History:** Ratings are automatically saved to your browser's local memory (`localStorage`) using a fingerprint of the `Filename + FileSize`. It also maintains a complete historical array of every score you assign a file across multiple triage sessions!
* **Auto-Advance:** Slide to assign a score; release the slider to instantly advance to the next file.
* **Staging Queue (The Executioner):** Filter your lowest-rated files, stage them for deletion, preview them with thumbnails (click to fullscreen zoom), uncheck any you want to spare, and export a batch deletion script.
* **Intelligent File Types:** Supports images and common web video formats (MP4, WebM, MKV).
* **Minimalist UI Modals:** All settings, backups, filters, and sorting tools are safely tucked away in clean popup modals.

## How to Use on Desktop
1. Double click `Dynamic Media Sorter.html` to open it in your browser.
2. Click **Load Folder** to scan your media folder.
3. Use the slider to score files. Pressing the left arrow key lets you instantly go back and edit a previous score.
4. Click **The Executioner** (Skull Icon) to stage poorly rated files and generate a deletion script.
5. Export your ratings database using the **Settings** (⚙️) modal to safely backup your data.

## ⚠️ Important Note for Android Users
Android's default "Gallery" file picker masks real filenames with random numbers (e.g., `100004561.jpg`) for privacy reasons. Because the app uses the filename to track your ratings, this will break your history!
**To fix this:** When you click **Load Files** on Android, tap the three-dot menu in the corner and select a dedicated **File Manager** app (like Solid Explorer, CX File Explorer, or My Files) to select your media. This forces Android to pass the real filename to the browser.