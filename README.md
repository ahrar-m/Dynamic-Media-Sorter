# Dynamic Media Sorter

Dynamic Media Sorter is a 100% offline, serverless HTML5 application designed for lightning-fast media triage, sorting, and batch deletion.

## 🔒 Security & Privacy (Zero Data Extraction)
**This application is fully sandboxed.** 
* **Zero Network Requests:** It does not make any API calls, it does not use a backend server, and it does not upload any of your files or metadata to the cloud. You can completely disconnect from the internet (Airplane Mode) and the application will still function flawlessly.
* **Non-Destructive Scanning:** When you load a folder, the browser creates local, temporary memory links (`URL.createObjectURL`) to stream the media straight from your hard drive into the web-player. The source files are never altered, compressed, or moved.
* **Executioner Safety:** Because browsers are sandbox-restricted from deleting local files directly, the "Executioner" tool safely generates a text script (Python, Bash, or Windows CMD). You maintain total control over when and how files are physically deleted by running that script yourself.

## Features
* **Universal Compatibility:** Runs in any modern browser (Chrome, Firefox, Safari) on Windows, Linux, Mac, and Android.
* **Persistent Memory:** Ratings are automatically saved to your browser's local memory (`localStorage`) using a fingerprint of the `Filename + FileSize`.
* **Auto-Advance:** Slide to assign a score; release the slider to instantly advance to the next file.
* **Staging Queue (The Executioner):** Filter your lowest-rated files, stage them for deletion, uncheck any you want to spare, and export a batch deletion script.
* **Intelligent File Types:** Supports images and common web video formats (MP4, WebM, MKV).

## How to Use
1. Double click `Dynamic Media Sorter.html` to open it in your browser.
2. Click **Load Folder** (Desktop) or **Load Files** (Mobile) to scan your media.
3. Use the slider to score files.
4. Click the Skull Icon (The Executioner) to stage poorly rated files and generate a deletion script.
5. Export your ratings database using the **Backup** button to safely move your data between devices.