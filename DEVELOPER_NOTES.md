# Developer Notes & Technical History

This document contains a historical record of significant technical challenges and debugging sessions during the development of Dynamic Media Sorter, serving as a reference for future maintainers.

## 1. The Great Slider Freeze (Android WebView Optimization)

**The Issue:**
When loading a large media library (e.g., 2,500+ files), dragging the slider on Android devices caused massive, device-freezing lag.

**The Cause:**
The `updateSliderVisuals()` function, which ran continuously during the slider's `input` event (fires 60 times a second while dragging), was invoking `saveRatingsToStorage()`. Saving the `state.ratings` object via `JSON.stringify()` on a dictionary containing 2,500+ entries takes several milliseconds on mobile processors. Executing this synchronously on the main thread during high-frequency touch events completely locked up the browser UI thread.

**The Solution:**
Decoupled the `localStorage` save from the drag event. The slider visual updates still run continuously, but `saveRatingsToStorage()` is strictly reserved for the slider's `change` event, which only fires once when the user physically releases the thumb.

## 2. The Slider Event Blackhole (Missing Element Crash)

**The Issue:**
After successfully fixing the storage lag and implementing a new "File Information" layout, the slider completely stopped responding to touch events. The slider thumb moved physically, but no scores were updated, and no files advanced. It appeared as though the browser was swallowing the `input` and `change` events.

**The Cause:**
A silent, fatal JavaScript `TypeError` was occurring midway through the `setupEventListeners()` initialization block.
During the development of the top-row navigation layout, the button ID `btn-media-fullscreen` was removed from the HTML, but its definition in the global `elements` object was accidentally deleted. 
Later in `setupEventListeners()`, the code attempted to execute `elements.btnMediaFullscreen.addEventListener(...)`. Because `btnMediaFullscreen` was undefined in the map, this threw an unhandled `TypeError`, instantly crashing the initialization script.
Because the slider event bindings were located *after* the crash point in the code block, the slider's event listeners were never attached to the DOM.

**The Solution:**
Restored `btnMediaFullscreen` to the `elements` map. This allowed `setupEventListeners()` to execute fully and successfully bind the slider events. This highlights the dangers of silent runtime errors in monolithic initialization functions.

## 3. Touch-Action Pan Suppression (Android WebView Quirks)

**The Issue / Concept:**
When building custom range sliders for Android WebViews, omitting the CSS property `touch-action: none;` on the `<input type="range">` element can sometimes cause the browser's scrolling engine to intercept horizontal touch events. The browser assumes the user is attempting to pan the page (even if overflow is hidden) rather than interacting with the input, resulting in `touchcancel` events firing and the `input` event being suppressed.

**The Solution:**
Always maintain `touch-action: none;` on the slider input to explicitly instruct the browser's gesture recognizer that all touch manipulation on this specific element is intended for the input control, not for page scrolling.

## 4. Aggressive Local File Caching (Mobile Chrome)

**The Issue:**
During debugging, hot-fixes deployed to the HTML file appeared to have no effect on the user's Android device.

**The Cause:**
Mobile Chrome caches local `file:///` resources extremely aggressively. A standard pull-to-refresh often ignores filesystem changes and re-renders the cached DOM.

**The Solution:**
When testing local file modifications on Android, opening the file via an Incognito Tab ensures a fresh read from the filesystem, bypassing the aggressive local cache.
