import { rate, rating, ordinal } from 'https://cdn.jsdelivr.net/npm/openskill@4.1.1/+esm';

window.onerror = function(msg, url, lineNo, columnNo, error) {
    showErrorToast(`Error: ${msg}`);
    return false;
};
window.onunhandledrejection = function(event) {
    showErrorToast(`Unhandled Rejection: ${event.reason}`);
};

function showErrorToast(message) {
    const errDiv = document.createElement('div');
    errDiv.style.position = 'fixed';
    errDiv.style.top = '20px';
    errDiv.style.left = '50%';
    errDiv.style.transform = 'translateX(-50%)';
    errDiv.style.backgroundColor = '#ff0844';
    errDiv.style.color = 'white';
    errDiv.style.padding = '12px 24px';
    errDiv.style.borderRadius = '8px';
    errDiv.style.zIndex = '9999';
    errDiv.style.fontWeight = 'bold';
    errDiv.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
    errDiv.style.cursor = 'pointer';
    errDiv.style.maxWidth = '80%';
    errDiv.style.wordWrap = 'break-word';
    errDiv.innerText = message;
    
    errDiv.onclick = () => errDiv.remove();
    document.body.appendChild(errDiv);
    
    setTimeout(() => {
        if (errDiv.parentElement) errDiv.remove();
    }, 8000);
}

const state = {
    images: [],
    videos: [],
    ratings: {}, // key: id -> { mu: 25.0, sigma: 8.333, matches: 0, history: [] }
    stagedFilesMap: new Map(), // id -> file object
    currentMatchup: [], // Array of file objects
    leaderboardType: 'image', // 'image' or 'video'
    filter: 'all',
    activeViewIndex: 0, // integer index
    appMode: 'matchmaking', // 'matchmaking', 'executioner'
    
    // Executioner Review State
    executionerQueue: [], // Array of staged file objects
    executionerIndex: 0,

    // Leaderboard Viewer State
    leaderboardQueue: [],
    leaderboardIndex: 0,

    isAnimating: false,
    infoVisible: false,
    fitMode: 'contain',
    hasSeen: new Set(),
    currentRankings: {}, // id -> rank
    undoStack: [], // { matchup: [...files], prevStats: {id: {mu, sigma, matches}} }
    loadedIds: new Set(),
    userRanking: [], // Array of active matchup file IDs, ordered from best to worst
    matchupUrls: {} // Cache for UI thumbnails
};

function getOrdinal(rating) {
    return rating.mu - 3 * rating.sigma;
}


let appSettings = {
    autoBackupInterval: 0,
    defaultFitMode: 'contain',
    startMuted: true,
    autoSubmitMatch: false,
    backupPrefix: 'dms_elo',
    skipUnmatched: true
};

let elements = {};

let objectUrlA = null;

async function init() {
    try {
        bindElements();
        await loadRatingsFromStorage();
        loadSettingsFromStorage();
        setupEventListeners();
        window.lastAutoBackupTime = Date.now();
    } catch (e) {
        alert("Failed to initialize database: " + e.message);
    }
}

function bindElements() {
    elements = {
        folderInput: document.getElementById('folder-input'),
        fileInput: document.getElementById('file-input'),
        mediaContainer: document.getElementById('media-container'),
        fileInfoOverlay: document.getElementById('file-info-overlay'),
        displayFilename: document.getElementById('display-filename'),
        btnOpenSettings: document.getElementById('btn-open-settings'),
        settingsModal: document.getElementById('settings-modal'),
        closeSettingsModal: document.getElementById('close-settings-modal'),
        
        btnPrevMedia: document.getElementById('btn-prev-media'),
        btnNextMedia: document.getElementById('btn-next-media'),
        placementStrip: document.getElementById('placement-strip'),
        btnSubmitMatch: document.getElementById('btn-submit-match'),
        btnUndo: document.getElementById('btn-undo'),
        btnInfo: document.getElementById('btn-info'),
        btnStageCurrent: document.getElementById('btn-stage-current'),
        btnToggleFit: document.getElementById('btn-toggle-fit'),
        toolsModal: document.getElementById('tools-modal'),
        btnOpenToolsMenu: document.getElementById('btn-open-tools-menu'),
        closeToolsModal: document.getElementById('close-tools-modal'),

        matchStatusIndicator: document.getElementById('match-status-indicator'),
        
        matchupControls: document.getElementById('matchup-controls'),
        timelineControls: document.getElementById('timeline-controls'),
        btnPrevMatch: document.getElementById('btn-prev-match'),
        btnNextMatch: document.getElementById('btn-next-match'),
        btnExitReview: document.getElementById('btn-exit-review'),
        
        executionerCheckContainer: document.getElementById('executioner-check-container'),
        executionerCheckbox: document.getElementById('executioner-checkbox'),
        
        toast: document.getElementById('toast'),
        purgeModal: document.getElementById('purge-modal-overlay'),
        curatorModal: document.getElementById('curator-modal-overlay'),
        btnCurator: document.getElementById('btn-curator'),
        closeCuratorModal: document.getElementById('close-curator-modal'),
        curatorThreshold: document.getElementById('curator-threshold'),
        btnGenerateCurator: document.getElementById('btn-generate-curator'),
        btnCuratorDirect: document.getElementById('btn-curator-direct'),
        curatorScriptContainer: document.getElementById('curator-script-container'),
        curatorScriptOutput: document.getElementById('curator-script-output'),
        btnCopyCuratorScript: document.getElementById('btn-copy-curator-script'),
        btnPurge: document.getElementById('btn-purge'),
        closePurgeModal: document.getElementById('close-purge-modal'),
        btnStageFiles: document.getElementById('btn-stage-files'),
        btnClearStaged: document.getElementById('btn-clear-staged'),
        btnReviewStaged: document.getElementById('btn-review-staged'),
        btnPurgeDirect: document.getElementById('btn-purge-direct'),
        scriptContainer: document.getElementById('script-container'),
        scriptOutput: document.getElementById('script-output'),
        btnCopyScript: document.getElementById('btn-copy-script'),
        purgeThreshold: document.getElementById('purge-threshold'),
        purgeStats: document.getElementById('purge-stats'),
        btnExport: document.getElementById('btn-export'),
        importInput: document.getElementById('import-input'),
        btnHardReset: document.getElementById('btn-hard-reset'),
        btnShareCurrent: document.getElementById('btn-share-current'),
        btnAppFullscreen: document.getElementById('btn-app-fullscreen'),
        
        dashboardModal: document.getElementById('dashboard-modal-overlay'),
        btnOpenDashboard: document.getElementById('btn-open-dashboard'),
        closeDashboardModal: document.getElementById('close-dashboard-modal'),
        dashTotalMedia: document.getElementById('dash-total-media'),
        dashTotalMatches: document.getElementById('dash-total-matches'),
        dashEta: document.getElementById('dash-eta'),
        dashBellCurve: document.getElementById('dash-bell-curve'),
        leaderboardModal: document.getElementById('leaderboard-modal'),
        closeLeaderboardModal: document.getElementById('close-leaderboard-modal'),
        btnOpenLeaderboard: document.getElementById('btn-open-leaderboard'),
        leaderboardTopList: document.getElementById('leaderboard-top-list'),
        leaderboardBottomList: document.getElementById('leaderboard-bottom-list'),
        btnViewTopCont: document.getElementById('btn-view-top-cont'),
        btnViewBottomCont: document.getElementById('btn-view-bottom-cont'),
        
        toggleImage: document.getElementById('toggle-image'),
        toggleVideo: document.getElementById('toggle-video'),
        
        loadingProgress: document.getElementById('loading-progress'),
        loadingPercent: document.getElementById('loading-percent')
    };
}

function getFileId(file) { return `${file.name}_${file.size}`; }
function showToast(msg) {
    if(!elements.toast) return;
    elements.toast.innerHTML = msg;
    elements.toast.classList.add('show');
    setTimeout(() => elements.toast.classList.remove('show'), 3000);
}

function loadSettingsFromStorage() {
    try {
        const stored = localStorage.getItem('eloSorterSettings');
        if (stored) appSettings = { ...appSettings, ...JSON.parse(stored) };
        
        document.getElementById('setting-auto-backup').value = appSettings.autoBackupInterval || 0;
        document.getElementById('setting-leaderboard-size').value = appSettings.leaderboardSize || 32;
        document.getElementById('setting-backup-prefix').value = appSettings.backupPrefix || 'dms_elo';
        document.getElementById('setting-default-fit').value = appSettings.defaultFitMode || 'contain';
        document.getElementById('setting-start-muted').checked = appSettings.startMuted !== false;
        document.getElementById('setting-auto-submit').checked = appSettings.autoSubmitMatch === true;
        document.getElementById('setting-skip-unmatched').checked = appSettings.skipUnmatched !== false;
        
        state.fitMode = appSettings.defaultFitMode || 'contain';
        const icons = { 'contain': 'fa-compress', 'cover': 'fa-crop-simple', 'stretch': 'fa-expand', 'original': 'fa-maximize' };
        elements.btnToggleFit.innerHTML = `<i class="fa-solid ${icons[state.fitMode] || 'fa-compress'}"></i>`;
        
    } catch (e) { console.error(e); }
}

function saveSettingsToStorage(skipRender = false) {
    try {
        const parseSetting = (id, fallback) => {
            const val = parseInt(document.getElementById(id).value, 10);
            return isNaN(val) ? fallback : val;
        };
        appSettings.autoBackupInterval = parseSetting('setting-auto-backup', 0);
        appSettings.leaderboardSize = parseSetting('setting-leaderboard-size', 32);
        appSettings.backupPrefix = document.getElementById('setting-backup-prefix').value || 'dms_elo';
        appSettings.defaultFitMode = document.getElementById('setting-default-fit').value;
        appSettings.startMuted = document.getElementById('setting-start-muted').checked;
        appSettings.autoSubmitMatch = document.getElementById('setting-auto-submit').checked;
        appSettings.skipUnmatched = document.getElementById('setting-skip-unmatched').checked;
        localStorage.setItem('eloSorterSettings', JSON.stringify(appSettings));
        
        state.fitMode = appSettings.defaultFitMode;
        const icons = { 'contain': 'fa-compress', 'cover': 'fa-crop-simple', 'stretch': 'fa-expand', 'original': 'fa-maximize' };
        elements.btnToggleFit.innerHTML = `<i class="fa-solid ${icons[state.fitMode] || 'fa-compress'}"></i>`;
        if (!skipRender && state.currentMatchup.length > 0) {
            if (state.appMode === 'executioner') renderExecutionerMedia();
            else if (state.appMode === 'leaderboard_viewer') renderLeaderboardViewerMedia();
            else renderCurrentMedia();
        }
        
        showToast("Settings saved.");
    } catch (e) {
        alert("Error saving settings: " + e.message + "\n" + e.stack);
        console.error(e);
    }
}

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MediaSorterDB', 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('ratings')) {
                db.createObjectStore('ratings', { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function loadRatingsFromStorage() {
    try {
        const db = await openDB();
        const tx = db.transaction('ratings', 'readonly');
        const store = tx.objectStore('ratings');
        const request = store.getAll();
        
        return new Promise((resolve) => {
            request.onsuccess = () => {
                state.ratings = {};
                const result = request.result;
                if (result && Array.isArray(result)) {
                    result.forEach(item => {
                        if (item && item.id && item.data && typeof item.data.mu === 'number') {
                            state.ratings[item.id] = item.data;
                        }
                    });
                }
                resolve();
            };
            request.onerror = () => resolve();
        });
    } catch (e) {
        console.error("IndexedDB load error:", e);
    }
}

async function saveRatingsToStorage(updatedIds = null) {
    try {
        const db = await openDB();
        const tx = db.transaction('ratings', 'readwrite');
        const store = tx.objectStore('ratings');
        
        if (updatedIds) {
            for (const id of updatedIds) {
                if (state.ratings[id]) store.put({ id, data: state.ratings[id] });
            }
        } else {
            for (const [id, data] of Object.entries(state.ratings)) {
                store.put({ id, data });
            }
        }
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("IndexedDB save error:", e);
    }
}

// Background Loading Logic
let loadingQueue = [];
let totalLoading = 0;
let loadedCount = 0;
let loadingStartTime = 0;
let isProcessRunning = false;

function handleFilesSelected(event) {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    
    elements.loadingProgress.classList.remove('hidden');
    elements.loadingPercent.textContent = "Processing...";
    elements.loadingProgress.style.background = `conic-gradient(var(--accent-green) 0%, rgba(255,255,255,0.1) 0%)`;
    
    setTimeout(() => {
        const files = Array.from(fileList);
        for (let i = files.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [files[i], files[j]] = [files[j], files[i]];
        }
        
        if (isProcessRunning) {
            for (let i = 0; i < files.length; i++) {
                loadingQueue.push(files[i]);
            }
            totalLoading += files.length;
            return;
        }
        
        isProcessRunning = true;
        loadingQueue = files;
        totalLoading = files.length;
        loadedCount = 0;
        loadingStartTime = Date.now();
        
        processLoadingQueue();
    }, 50);
}

async function processLoadingQueue() {
    if (loadingQueue.length === 0) {
        isProcessRunning = false;
        elements.loadingProgress.classList.add('hidden');
        await saveRatingsToStorage();
        
        const totalSecs = Math.round((Date.now() - loadingStartTime) / 1000);
        const mm = String(Math.floor(totalSecs / 60)).padStart(2, '0');
        const ss = String(totalSecs % 60).padStart(2, '0');
        showToast(`Loaded ${totalLoading} files in ${mm}:${ss}.`);
        return;
    }

    const batchStart = Date.now();
    let loadedThisBatch = 0;
    let didAdd = false;
    let statsUpdated = false;
    try {
        while (loadingQueue.length > 0 && (Date.now() - batchStart < 16)) {
            const f = loadingQueue.pop();
            let isImage = false, isVideo = false;
            if (f.type) {
                isImage = f.type.startsWith('image/');
                isVideo = f.type.startsWith('video/');
            } else {
                isImage = /\.(jpe?g|png|gif|webp)$/i.test(f.name);
                isVideo = /\.(mp4|webm|mkv|mov|avi)$/i.test(f.name);
            }

            const id = getFileId(f);
            if (state.ratings[id] && state.ratings[id].blacklisted) {
                if (!state.stagedFilesMap.has(id)) {
                    state.stagedFilesMap.set(id, f);
                    statsUpdated = true;
                }
                loadedThisBatch++;
                continue;
            }

            let localDidAdd = false;
            if (isImage) {
                if(!state.loadedIds.has(id)) { state.loadedIds.add(id); state.images.push(f); didAdd = true; localDidAdd = true; }
            } else if (isVideo) {
                if(!state.loadedIds.has(id)) { state.loadedIds.add(id); state.videos.push(f); didAdd = true; localDidAdd = true; }
            }

            if (localDidAdd && !state.ratings[id]) {
                state.ratings[id] = { mu: 25.0, sigma: 8.333, matches: 0, history: [] };
            }
            loadedThisBatch++;
        }
    } catch (e) {
        console.error("Batch processing error:", e);
    }

    if (statsUpdated && elements.purgeStats) {
        elements.purgeStats.textContent = `${state.stagedFilesMap.size} files staged.`;
    }

    loadedCount += loadedThisBatch;
    const pct = Math.floor((loadedCount / totalLoading) * 100);
    elements.loadingPercent.textContent = `${pct}%`;
    elements.loadingProgress.style.background = `conic-gradient(var(--accent-green) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;

    if ((didAdd || loadedCount === totalLoading) && state.currentMatchup.length === 0 && state.appMode === 'matchmaking') {
        const baseList = state.leaderboardType === 'image' ? state.images : state.videos;
        if ((baseList.length >= 4) || (baseList.length >= 2 && loadedCount === totalLoading)) {
            const list = getActiveList();
            if ((list.length >= 4) || (list.length >= 2 && loadedCount === totalLoading)) pickNextMatchup();
        }
    }
    
    setTimeout(processLoadingQueue, 0);
}

function getActiveList() {
    let baseList = state.leaderboardType === 'image' ? state.images : state.videos;
    return baseList.filter(file => !state.stagedFilesMap.has(getFileId(file)));
}


function pickNextMatchup() {
    const list = getActiveList();
    if (list.length < 2) {
        state.currentMatchup = [];
        renderCurrentMedia();
        updateMatchupProgress();
        return;
    }

    const matchupSize = Math.min(4, list.length);
    const selectedIndices = new Set();
    while (selectedIndices.size < matchupSize) {
        selectedIndices.add(Math.floor(Math.random() * list.length));
    }
    state.currentMatchup = Array.from(selectedIndices).map(idx => list[idx]);
    
    state.activeViewIndex = 0;
    state.hasSeen.clear();
    state.currentRankings = {};
    state.userRanking = [];
    if (state.matchupUrls) {
        Object.values(state.matchupUrls).forEach(url => URL.revokeObjectURL(url));
    }
    state.matchupUrls = {};
    
    renderCurrentMedia();
    elements.mediaContainer.style.transition = 'opacity 0.2s ease';
    elements.mediaContainer.style.opacity = '1';
    updateMatchupProgress();
}

function updateMatchupProgress() {
    const list = getActiveList();
    const container = document.getElementById('matchup-progress-container');
    if (list.length === 0 || state.appMode !== 'matchmaking') {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');

    if (state.currentMatchup.length === 0 || list.length < 2) {
        document.getElementById('matchup-percent').textContent = `100%`;
        document.getElementById('matchup-circle').setAttribute('stroke-dasharray', `100, 100`);
        return;
    }

    let minMatches = Infinity;
    for (const f of list) {
        const m = state.ratings[getFileId(f)]?.matches ?? 0;
        if (m < minMatches) minMatches = m;
    }
    
    let countMin = 0;
    for (const f of list) {
        const m = state.ratings[getFileId(f)]?.matches ?? 0;
        if (m === minMatches) countMin++;
    }
    
    const total = list.length;
    const completed = total - countMin;
    const percentage = Math.round((completed / total) * 100);
    
    document.getElementById('matchup-pool-level').textContent = `P ${minMatches}`;
    document.getElementById('matchup-percent').textContent = `${percentage}%`;
    document.getElementById('matchup-circle').setAttribute('stroke-dasharray', `${percentage}, 100`);
}

async function submitMatch() {
    if (state.currentMatchup.length === 0 || state.appMode !== 'matchmaking' || state.isAnimating) return;
    
    if (state.hasSeen.size < state.currentMatchup.length || Object.keys(state.currentRankings).length < state.currentMatchup.length) {
        showToast("Please view all media and rank them before submitting!");
        return;
    }
    
    state.isAnimating = true;
    const oldBtnHTML = elements.btnSubmitMatch.innerHTML;
    elements.btnSubmitMatch.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    elements.btnSubmitMatch.disabled = true;
    elements.mediaContainer.style.opacity = '0.3';
    elements.mediaContainer.style.transition = 'opacity 0.1s ease';
    
    try {
        let teamIds = [];
        let fileRanks = [];
        
        state.currentMatchup.forEach(f => {
            const id = getFileId(f);
            const rank = parseInt(state.currentRankings[id]);
            fileRanks.push({file: f, id: id, rank: rank, rating: state.ratings[id]});
        });
        
        fileRanks.sort((a,b) => a.rank - b.rank);
        
        let ranksForOpenskill = [];
        fileRanks.forEach(item => {
            teamIds.push(item.id);
            ranksForOpenskill.push(item.rank);
        });
        
        const currentRatings = {};
        state.currentMatchup.forEach(f => {
            const id = getFileId(f);
            currentRatings[id] = state.ratings[id];
        });

        const teams = teamIds.map(fileId => {
            const r = currentRatings[fileId] || { mu: 25.0, sigma: 8.333 };
            return [ rating({ mu: r.mu, sigma: r.sigma }) ];
        });

        const newTeams = rate(teams, { rank: ranksForOpenskill });
        
        const newRatingsMap = {};
        teamIds.forEach((fileId, i) => {
            newRatingsMap[fileId] = {
                mu: newTeams[i][0].mu,
                sigma: newTeams[i][0].sigma
            };
        });

        let prevStats = {};
        state.currentMatchup.forEach(f => {
            const id = getFileId(f);
            prevStats[id] = JSON.parse(JSON.stringify(state.ratings[id]));
        });
        state.undoStack.push({
            matchup: [...state.currentMatchup],
            prevStats: prevStats
        });
        if (state.undoStack.length > 50) state.undoStack.shift();

        const t = Date.now();
        fileRanks.forEach((item, idx) => {
            const newRating = newRatingsMap[item.id];
            const oldOrdinal = getOrdinal(item.rating);
            const newOrdinal = getOrdinal(newRating);
            const diff = newOrdinal - oldOrdinal;
            
            item.rating.mu = newRating.mu;
            item.rating.sigma = newRating.sigma;
            item.rating.matches++;
            
            let oppIds = teamIds.filter(id => id !== item.id);
            if (!item.rating.history) item.rating.history = [];
            item.rating.history.unshift({ 
                opponentIds: oppIds, 
                rank: item.rank,
                ordinalChange: diff,
                timestamp: t 
            });
        });
        
        await saveRatingsToStorage(fileRanks.map(item => item.id));
        state.isAnimating = false;
        pickNextMatchup();
    } catch (err) {
        console.error("Submit match failed:", err);
        showToast("Error processing match.");
    } finally {
        elements.btnSubmitMatch.innerHTML = oldBtnHTML;
        elements.btnSubmitMatch.disabled = false;
        state.isAnimating = false;
    }
}

function checkSubmitUnlock() {
    if (elements.btnSubmitMatch) {
        const allSeen = state.currentMatchup.every(f => state.hasSeen.has(getFileId(f)));
        const allRanked = state.currentMatchup.every(f => state.currentRankings.hasOwnProperty(getFileId(f)));
        if (allSeen && allRanked) {
            elements.btnSubmitMatch.disabled = false;
            if (appSettings.autoSubmitMatch && !state.isAnimating) {
                submitMatch();
            }
        } else {
            elements.btnSubmitMatch.disabled = true;
        }
    }
}
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function destroyPanzoomAndWheel() {
    if (window.currentPanzoom) {
        if (window.panzoomWheelListener) {
            elements.mediaContainer.removeEventListener('wheel', window.panzoomWheelListener);
            window.panzoomWheelListener = null;
        }
        window.currentPanzoom.destroy();
        window.currentPanzoom = null;
    }
}

function renderCurrentMedia() {
    if (state.isAnimating) return;
    elements.btnUndo.disabled = state.undoStack.length === 0;
    if (objectUrlA) { URL.revokeObjectURL(objectUrlA); objectUrlA = null; }
    elements.mediaContainer.querySelectorAll('video').forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); });
    destroyPanzoomAndWheel();
    elements.mediaContainer.innerHTML = '';
    if (elements.executionerCheckContainer) elements.executionerCheckContainer.classList.add('hidden');
    elements.matchStatusIndicator.classList.add('hidden');
    
    if (state.appMode === 'executioner') {
        renderExecutionerMedia();
        return;
    }

    if (state.currentMatchup.length === 0) {
        elements.mediaContainer.innerHTML = `<div class="empty-state glass-panel" style="padding: 40px;"><i class="fa-solid fa-circle-check"></i><h2>Queue Empty</h2><p>No valid matches found.</p></div>`;
        elements.fileInfoOverlay.classList.add('hidden');
        if (elements.matchupControls) elements.matchupControls.classList.add('hidden');
        return;
    }

    if (elements.matchupControls) elements.matchupControls.classList.remove('hidden');

    const activeFile = state.currentMatchup[state.activeViewIndex];
    const activeId = getFileId(activeFile);
    
    state.hasSeen.add(activeId);
    checkSubmitUnlock();

    objectUrlA = URL.createObjectURL(activeFile);

    let fitClass = '';
    if (state.fitMode === 'contain') fitClass = 'media-fit-contain';
    else if (state.fitMode === 'cover') fitClass = 'media-fit-cover';
    else if (state.fitMode === 'stretch') fitClass = 'media-fit-stretch';
    else if (state.fitMode === 'original') fitClass = 'media-fit-original';

    if (activeFile.type.startsWith('video/') || activeFile.name.match(/\.(mp4|webm|mkv|avi|mov|m4v)$/i)) {
        const mutedAttr = appSettings.startMuted ? 'muted' : '';
        elements.mediaContainer.innerHTML = `<video src="${objectUrlA}" class="${fitClass}" autoplay loop controls playsinline ${mutedAttr} onerror="handleMediaError()"></video>`;
    } else {
        elements.mediaContainer.innerHTML = `<img src="${objectUrlA}" class="${fitClass}" onerror="handleMediaError()">`;
        const imgEl = elements.mediaContainer.querySelector('img');
        if (typeof Panzoom !== 'undefined') {
            window.currentPanzoom = Panzoom(imgEl, { maxScale: 5, canvas: true, contain: 'outside' });
            window.panzoomWheelListener = window.currentPanzoom.zoomWithWheel;
            elements.mediaContainer.addEventListener('wheel', window.panzoomWheelListener);
        }
    }
    
    elements.displayFilename.textContent = `${activeFile.name} (${formatSize(activeFile.size)}) [${state.activeViewIndex + 1}/${state.currentMatchup.length}]`;
    if (state.infoVisible) {
        elements.fileInfoOverlay.classList.remove('hidden');
    } else {
        elements.fileInfoOverlay.classList.add('hidden');
    }
    
    if (elements.btnShareCurrent) {
        if (navigator.canShare && navigator.canShare({ files: [activeFile] })) {
            elements.btnShareCurrent.style.display = 'flex';
        } else {
            elements.btnShareCurrent.style.display = 'none';
        }
    }
    
    renderPlacementStrip();
}

function updateUserRankingState() {
    state.currentRankings = {};
    state.userRanking.forEach((id, idx) => {
        state.currentRankings[id] = idx + 1;
    });
    checkSubmitUnlock();
    renderPlacementStrip();
}

function renderPlacementStrip() {
    if (!elements.placementStrip) return;
    elements.placementStrip.querySelectorAll('video').forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); });
    elements.placementStrip.innerHTML = '';
    elements.placementStrip.style.justifyContent = state.userRanking.length === 0 ? 'center' : 'flex-start';
    const activeFile = state.currentMatchup[state.activeViewIndex];
    const activeId = getFileId(activeFile);
    
    const isRanked = state.userRanking.includes(activeId);
    
    const createInsertBtn = (index) => {
        const btn = document.createElement('button');
        btn.className = 'placement-insert-btn';
        btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        btn.title = "Insert Here";
        btn.onclick = () => {
            if (state.isAnimating) return;
            const currentIndex = state.userRanking.indexOf(activeId);
            const wasRanked = currentIndex !== -1;
            if (wasRanked) {
                state.userRanking.splice(currentIndex, 1);
                if (currentIndex < index) index--;
            }
            state.userRanking.splice(index, 0, activeId);
            updateUserRankingState();
            
            // Auto-advance to the next media if this was the first time ranking it
            if (!wasRanked) {
                elements.btnNextMedia.click();
            }
        };
        return btn;
    };

    elements.placementStrip.appendChild(createInsertBtn(0));
    
    state.userRanking.forEach((id, idx) => {
        const file = state.currentMatchup.find(f => getFileId(f) === id);
        if (!file) return;
        
        const thumb = document.createElement('div');
        thumb.style.position = 'relative';
        thumb.style.flexShrink = '0';
        
        if (!state.matchupUrls) state.matchupUrls = {};
        if (!state.matchupUrls[id]) state.matchupUrls[id] = URL.createObjectURL(file);
        
        let mediaEl;
        if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mkv|avi|mov|m4v)$/i)) {
            mediaEl = document.createElement('video');
        } else {
            mediaEl = document.createElement('img');
        }
        mediaEl.src = state.matchupUrls[id];
        mediaEl.className = 'placement-thumbnail';
        mediaEl.title = `Rank ${idx + 1}: ${file.name}`;
        
        if (id === activeId) mediaEl.classList.add('active-rank');
        
        mediaEl.onclick = () => {
            state.activeViewIndex = state.currentMatchup.indexOf(file);
            renderCurrentMedia();
        };
        
        thumb.appendChild(mediaEl);
        
        if (id === activeId) {
            const unrankBtn = document.createElement('button');
            unrankBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
            unrankBtn.title = "Remove Rank";
            unrankBtn.style.cssText = 'position: absolute; top: -5px; right: -5px; width: 16px; height: 16px; border-radius: 50%; background: #ff0844; color: white; border: none; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; box-shadow: 0 0 5px rgba(0,0,0,0.5);';
            unrankBtn.onclick = (e) => {
                if (state.isAnimating) return;
                e.stopPropagation();
                const idxToRemove = state.userRanking.indexOf(id);
                if (idxToRemove !== -1) {
                    state.userRanking.splice(idxToRemove, 1);
                    updateUserRankingState();
                }
            };
            thumb.appendChild(unrankBtn);
        }
        
        elements.placementStrip.appendChild(thumb);
        
        elements.placementStrip.appendChild(createInsertBtn(idx + 1));
    });
}


// --- Leaderboard & History ---

function renderLeaderboard() {
    if (state.appMode !== 'matchmaking') return;
    const list = getActiveList();
    const sorted = [...list].sort((a, b) => getOrdinal(state.ratings[getFileId(b)]) - getOrdinal(state.ratings[getFileId(a)]));
    const size = appSettings.leaderboardSize || 32;
    
    elements.leaderboardTopList.innerHTML = '';
    elements.leaderboardBottomList.innerHTML = '';
    
    if (sorted.length === 0) {
        elements.leaderboardTopList.innerHTML = 'No data.';
        elements.leaderboardBottomList.innerHTML = 'No data.';
        return;
    }
    
    const topItems = sorted.slice(0, size);
    const bottomItems = sorted.slice(-size).reverse(); // Worst at the top of the bottom list
    
    const createItemHTML = (file, rank) => {
        const r = state.ratings[getFileId(file)];
        const row = document.createElement('div');
        row.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--panel-border);";
        row.innerHTML = `
            <div style="flex: 1; display: flex; align-items: center; gap: 15px; overflow: hidden;">
                <div style="font-weight:bold; width: 30px; color: var(--accent-blue);">${rank}.</div>
                <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer;" class="leaderboard-item-name" title="${file.name}">${file.name}</div>
            </div>
            <div style="font-size:0.8rem; color:var(--text-primary); opacity:0.7; margin-right:10px;">(μ: ${r.mu.toFixed(1)}, σ: ${r.sigma.toFixed(1)})</div>
            <div style="font-family:monospace; font-weight:bold; width:60px; text-align:right; color:var(--accent-blue);">${Math.round(getOrdinal(r))}</div>
        `;
        return row;
    };
    
    topItems.forEach((f, i) => elements.leaderboardTopList.appendChild(createItemHTML(f, i+1)));
    bottomItems.forEach((f, i) => elements.leaderboardBottomList.appendChild(createItemHTML(f, sorted.length - i)));
}

function startExecutionerReview() {
    if (state.stagedFilesMap.size === 0) {
        showToast("No files staged.");
        return;
    }
    state.appMode = 'executioner';
    state.executionerQueue = Array.from(state.stagedFilesMap.values());
    state.executionerIndex = 0;
    
    elements.purgeModal.classList.remove('active');
    if (elements.matchupControls) elements.matchupControls.classList.add('hidden');
    elements.timelineControls.classList.remove('hidden');
    elements.btnExitReview.title = 'Generate Script & Exit';
    
    renderCurrentMedia();
}

function renderExecutionerMedia() {
    elements.mediaContainer.querySelectorAll('video').forEach(v => { v.pause(); v.removeAttribute('src'); });
    if (objectUrlA) URL.revokeObjectURL(objectUrlA);
    elements.mediaContainer.innerHTML = '';
    const file = state.executionerQueue[state.executionerIndex];
    const id = getFileId(file);
    objectUrlA = URL.createObjectURL(file);
    
    elements.matchStatusIndicator.classList.remove('hidden');
    elements.matchStatusIndicator.textContent = `Staged File ${state.executionerIndex + 1} of ${state.executionerQueue.length}`;
    elements.matchStatusIndicator.className = 'executioner';
    
    elements.executionerCheckContainer.classList.remove('hidden');
    elements.executionerCheckbox.checked = state.stagedFilesMap.has(id);
    let fitClass = '';
    if (state.fitMode === 'contain') fitClass = 'media-fit-contain';
    else if (state.fitMode === 'cover') fitClass = 'media-fit-cover';
    else if (state.fitMode === 'stretch') fitClass = 'media-fit-stretch';
    else if (state.fitMode === 'original') fitClass = 'media-fit-original';

    const mutedAttr = appSettings.startMuted ? 'muted' : '';
    destroyPanzoomAndWheel();
    if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mkv|avi|mov|m4v)$/i)) {
        elements.mediaContainer.innerHTML = `<video src="${objectUrlA}" class="${fitClass}" autoplay loop controls playsinline ${mutedAttr} onerror="handleMediaError()"></video>`;
    } else {
        elements.mediaContainer.innerHTML = `<img src="${objectUrlA}" class="${fitClass}" onerror="handleMediaError()">`;
        const imgEl = elements.mediaContainer.querySelector('img');
        if (typeof Panzoom !== 'undefined') {
            window.currentPanzoom = Panzoom(imgEl, { maxScale: 5, canvas: true, contain: 'outside' });
            window.panzoomWheelListener = window.currentPanzoom.zoomWithWheel;
            elements.mediaContainer.addEventListener('wheel', window.panzoomWheelListener);
        }
    }
    
    elements.displayFilename.textContent = `${file.name} (${formatSize(file.size)})`;
    elements.fileInfoOverlay.classList.remove('hidden');
    if (elements.btnShareCurrent) {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            elements.btnShareCurrent.style.display = 'flex';
        } else {
            elements.btnShareCurrent.style.display = 'none';
        }
    }
    
    elements.executionerCheckbox.onchange = (e) => {
        if (e.target.checked) state.stagedFilesMap.set(id, file);
        else state.stagedFilesMap.delete(id);
    };
}

// --- Continuous Leaderboard Viewer ---
function startLeaderboardViewer(reverse) {
    const list = state.leaderboardType === 'image' ? state.images : state.videos;
    const sorted = [...list].filter(f => !state.ratings[getFileId(f)]?.blacklisted && (!appSettings.skipUnmatched || state.ratings[getFileId(f)]?.matches > 0)).sort((a,b) => (getOrdinal(state.ratings[getFileId(b)]) || 0) - (getOrdinal(state.ratings[getFileId(a)]) || 0));
    
    state.leaderboardReverse = reverse;

    if (reverse) {
        state.leaderboardQueue = sorted.reverse();
    } else {
        state.leaderboardQueue = sorted;
    }
    
    if (state.leaderboardQueue.length === 0) {
        showToast("No media to view.");
        return;
    }
    
    state.leaderboardIndex = 0;
    state.appMode = 'leaderboard_viewer';
    elements.leaderboardModal.classList.remove('active');
    
    if (elements.matchupControls) elements.matchupControls.classList.add('hidden');
    elements.timelineControls.classList.remove('hidden');
    

    elements.btnExitReview.title = 'Exit Viewer';
    
    renderLeaderboardViewerMedia();
}

function renderLeaderboardViewerMedia() {
    if (objectUrlA) URL.revokeObjectURL(objectUrlA);
    
    const file = state.leaderboardQueue[state.leaderboardIndex];
    const id = getFileId(file);
    const rating = state.ratings[id];
    objectUrlA = URL.createObjectURL(file);
    
    let rank = state.leaderboardReverse ? state.leaderboardQueue.length - state.leaderboardIndex : state.leaderboardIndex + 1;
    
    elements.matchStatusIndicator.classList.remove('hidden');
    elements.matchStatusIndicator.textContent = `Ordinal: ${Math.round(getOrdinal(rating))} (Rank ${rank} of ${state.leaderboardQueue.length}) | Matches: ${rating.matches}`;
    elements.matchStatusIndicator.className = 'placement';
    
    elements.executionerCheckContainer.classList.add('hidden');
    
    elements.mediaContainer.querySelectorAll('video').forEach(v => { v.pause(); v.removeAttribute('src'); });
    
    let fitClass = '';
    if (state.fitMode === 'contain') fitClass = 'media-fit-contain';
    else if (state.fitMode === 'cover') fitClass = 'media-fit-cover';
    else if (state.fitMode === 'stretch') fitClass = 'media-fit-stretch';
    else if (state.fitMode === 'original') fitClass = 'media-fit-original';
    
    destroyPanzoomAndWheel();
    if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mkv|avi|mov|m4v)$/i)) {
        const mutedAttr = appSettings.startMuted ? 'muted' : '';
        elements.mediaContainer.innerHTML = `<video src="${objectUrlA}" class="${fitClass}" autoplay loop controls playsinline ${mutedAttr} onerror="handleMediaError()"></video>`;
    } else {
        elements.mediaContainer.innerHTML = `<img src="${objectUrlA}" class="${fitClass}" onerror="handleMediaError()">`;
        const imgEl = elements.mediaContainer.querySelector('img');
        if (typeof Panzoom !== 'undefined') {
            window.currentPanzoom = Panzoom(imgEl, { maxScale: 5, canvas: true, contain: 'outside' });
            window.panzoomWheelListener = window.currentPanzoom.zoomWithWheel;
            elements.mediaContainer.addEventListener('wheel', window.panzoomWheelListener);
        }
    }
    
    elements.displayFilename.textContent = `${file.name} (${formatSize(file.size)})`;
    if (state.infoVisible) {
        elements.fileInfoOverlay.classList.remove('hidden');
    } else {
        elements.fileInfoOverlay.classList.add('hidden');
    }
    if (elements.btnShareCurrent) {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            elements.btnShareCurrent.style.display = 'flex';
        } else {
            elements.btnShareCurrent.style.display = 'none';
        }
    }
}


// --- Setup & Listeners ---

function setupEventListeners() {
    document.body.addEventListener('click', () => {
        if (appSettings.autoBackupInterval > 0) {
            if (!window.lastAutoBackupTime) window.lastAutoBackupTime = Date.now();
            if (Date.now() - window.lastAutoBackupTime >= appSettings.autoBackupInterval * 60 * 1000) {
                if (Object.keys(state.ratings).length > 0) {
                    window.lastAutoBackupTime = Date.now();
                    exportRatings(true);
                }
            }
        }
    });
    document.getElementById('matchup-progress-container').addEventListener('click', () => {
        const list = getActiveList();
        if(list.length === 0) return;
        
        const poolCounts = {};
        for (const file of list) {
            const id = getFileId(file);
            const m = state.ratings[id]?.matches || 0;
            poolCounts[m] = (poolCounts[m] || 0) + 1;
        }
        
        const sortedPools = Object.keys(poolCounts).map(Number).sort((a,b) => a - b);
        let message = sortedPools.map(p => `Pool ${p}: ${poolCounts[p]} files`).join('<br>');
        
        showToast(message);
    });

    elements.folderInput.addEventListener('change', handleFilesSelected);
    elements.fileInput.addEventListener('change', handleFilesSelected);
    
    // Toggle Media Type
    const applyToggle = () => {
        elements.toggleImage.style.background = state.leaderboardType === 'image' ? 'rgba(79, 172, 254, 0.4)' : 'transparent';
        elements.toggleVideo.style.background = state.leaderboardType === 'video' ? 'rgba(79, 172, 254, 0.4)' : 'transparent';
        const list = getActiveList();
        showToast(`Switched to ${state.leaderboardType}s (Pool: ${list.length})`);
        pickNextMatchup();
    };
    elements.toggleImage.addEventListener('click', () => { if(state.isAnimating) return; state.appMode = 'matchmaking'; state.leaderboardType = 'image'; applyToggle(); });
    elements.toggleVideo.addEventListener('click', () => { if(state.isAnimating) return; state.appMode = 'matchmaking'; state.leaderboardType = 'video'; applyToggle(); });

    if (elements.btnPrevMedia) elements.btnPrevMedia.addEventListener('click', () => {
        if (state.isAnimating) return;
        if (state.currentMatchup.length > 0) {
            state.activeViewIndex = (state.activeViewIndex - 1 + state.currentMatchup.length) % state.currentMatchup.length;
            renderCurrentMedia();
        }
    });
    
    if (elements.btnNextMedia) elements.btnNextMedia.addEventListener('click', () => {
        if (state.isAnimating) return;
        if (state.currentMatchup.length > 0) {
            state.activeViewIndex = (state.activeViewIndex + 1) % state.currentMatchup.length;
            renderCurrentMedia();
        }
    });

    if (elements.btnSubmitMatch) elements.btnSubmitMatch.addEventListener('click', submitMatch);

    elements.btnUndo.addEventListener('click', async () => {
        if (state.isAnimating) return;
        if (state.undoStack.length === 0) { showToast("Nothing to undo."); return; }
        const last = state.undoStack.pop();
        
        state.currentMatchup = last.matchup;
        for (const id in last.prevStats) {
            state.ratings[id] = last.prevStats[id];
        }
        
        await saveRatingsToStorage();
        state.activeViewIndex = 0;
        state.hasSeen.clear();
        state.currentRankings = {};
        state.userRanking = [];
        renderCurrentMedia();
        updateMatchupProgress();
        showToast("Match reverted!");
    });
    
    if (elements.btnShareCurrent) elements.btnShareCurrent.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (btn) btn.blur();
        let file;
        if (state.appMode === 'executioner') file = state.executionerQueue[state.executionerIndex];
        else if (state.appMode === 'leaderboard_viewer') file = state.leaderboardQueue[state.leaderboardIndex];
        else if (state.currentMatchup.length > 0) file = state.currentMatchup[state.activeViewIndex];
        if (!file) return;
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: file.name });
            } catch (err) {
                if (err.name !== 'AbortError') showToast('Failed to share.');
            }
        } else {
            showToast('Sharing not supported on this browser/device.');
        }
    });
    
    elements.btnStageCurrent.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) btn.blur();

        if (state.appMode === 'executioner') {
            showToast("File is already staged for execution.");
            return;
        }

        if (state.appMode === 'leaderboard_viewer') {
            const currentMedia = state.leaderboardQueue[state.leaderboardIndex];
            state.stagedFilesMap.set(getFileId(currentMedia), currentMedia);
            if(elements.purgeStats) elements.purgeStats.textContent = `${state.stagedFilesMap.size} files staged.`;
            showToast(`Staged for execution: ${currentMedia.name}`);
            return;
        }

        if(state.currentMatchup.length === 0 || state.appMode !== 'matchmaking') return;
        const activeId = getFileId(state.currentMatchup[state.activeViewIndex]);
        
        state.stagedFilesMap.set(activeId, state.currentMatchup[state.activeViewIndex]);
        elements.purgeStats.textContent = `${state.stagedFilesMap.size} files staged.`;
        showToast("Staged Current Media to Executioner");
        
        const list = getActiveList();
        const pool = state.currentMatchup.map(f => getFileId(f));
        const currentMatches = state.ratings[activeId].matches;
        
        let candidates = list.filter(f => !pool.includes(getFileId(f)) && state.ratings[getFileId(f)].matches === currentMatches);
        if (candidates.length === 0) candidates = list.filter(f => !pool.includes(getFileId(f)));
        
        let replacement = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : undefined;
        
        if (replacement) {
            if (state.matchupUrls && state.matchupUrls[state.activeViewIndex]) {
                URL.revokeObjectURL(state.matchupUrls[state.activeViewIndex]);
                state.matchupUrls[state.activeViewIndex] = null;
            }
            state.currentMatchup[state.activeViewIndex] = replacement;
            delete state.currentRankings[activeId];
            const urIdx = state.userRanking.indexOf(activeId);
            if (urIdx !== -1) {
                state.userRanking.splice(urIdx, 1);
                updateUserRankingState();
            }
            state.hasSeen.delete(activeId);
            checkSubmitUnlock();
            renderCurrentMedia();
        } else {
            showToast("No replacement found, skipping match.");
            pickNextMatchup();
        }
    });

    elements.btnInfo.addEventListener('click', () => {
        state.infoVisible = !state.infoVisible;
        if (state.infoVisible) elements.fileInfoOverlay.classList.remove('hidden');
        else elements.fileInfoOverlay.classList.add('hidden');
    });

    elements.btnToggleFit.addEventListener('click', () => {
        const modes = ['contain', 'cover', 'stretch', 'original'];
        const icons = { 'contain': 'fa-compress', 'cover': 'fa-crop-simple', 'stretch': 'fa-expand', 'original': 'fa-maximize' };
        let idx = modes.indexOf(state.fitMode);
        state.fitMode = modes[(idx + 1) % modes.length];
        appSettings.defaultFitMode = state.fitMode;
        const fitSelect = document.getElementById('setting-default-fit');
        if (fitSelect) fitSelect.value = state.fitMode;
        saveSettingsToStorage(true);
        showToast(`Fit Mode: ${state.fitMode.charAt(0).toUpperCase() + state.fitMode.slice(1)}`);
        elements.btnToggleFit.innerHTML = `<i class="fa-solid ${icons[state.fitMode]}"></i>`;
        
        if (state.appMode === 'executioner') renderExecutionerMedia();
        else if (state.appMode === 'leaderboard_viewer') renderLeaderboardViewerMedia();
        else renderCurrentMedia();
    });
    
    // Timeline / Nav Buttons
    elements.btnPrevMatch.addEventListener('click', () => {
        if (state.appMode === 'executioner') {
            if (state.executionerQueue.length > 0) {
                state.executionerIndex = (state.executionerIndex - 1 + state.executionerQueue.length) % state.executionerQueue.length;
                renderCurrentMedia();
            }
        } else if (state.appMode === 'leaderboard_viewer') {
            if (state.leaderboardIndex > 0) { state.leaderboardIndex--; renderLeaderboardViewerMedia(); }
        }
    });
    elements.btnNextMatch.addEventListener('click', () => {
        if (state.appMode === 'executioner') {
            if (state.executionerQueue.length > 0) {
                state.executionerIndex = (state.executionerIndex + 1) % state.executionerQueue.length;
                renderCurrentMedia();
            }
        } else if (state.appMode === 'leaderboard_viewer') {
            if (state.leaderboardIndex < state.leaderboardQueue.length - 1) { state.leaderboardIndex++; renderLeaderboardViewerMedia(); }
        }
    });
    elements.btnExitReview.addEventListener('click', () => {
        if (state.appMode === 'executioner') {
            generateScripts();
        }
        state.appMode = 'matchmaking';
        elements.timelineControls.classList.add('hidden');
        if (elements.matchupControls) elements.matchupControls.classList.remove('hidden');
        if (elements.executionerCheckContainer) elements.executionerCheckContainer.classList.add('hidden');
        pickNextMatchup();
    });


    // Modals
    const closeTools = () => elements.toolsModal.classList.remove('active');
    elements.btnOpenSettings.addEventListener('click', () => { closeTools(); loadSettingsFromStorage(); elements.settingsModal.classList.add('active'); });
    elements.closeSettingsModal.addEventListener('click', () => { saveSettingsToStorage(); elements.settingsModal.classList.remove('active'); });


    elements.btnCurator.addEventListener('click', () => { closeTools(); elements.curatorModal.classList.add('active'); });
    elements.closeCuratorModal.addEventListener('click', () => {
        elements.curatorModal.classList.remove('active');
    });
    elements.btnGenerateCurator.addEventListener('click', generateCuratorScripts);
    if (elements.btnCuratorDirect) elements.btnCuratorDirect.addEventListener('click', copyFavoritesDirectly);
    elements.btnCopyCuratorScript.addEventListener('click', () => { elements.curatorScriptOutput.select(); document.execCommand('copy'); showToast("Copied!"); });

    elements.btnPurge.addEventListener('click', () => { closeTools(); 
        elements.purgeModal.classList.add('active'); 
        elements.purgeStats.textContent = `${state.stagedFilesMap.size} files staged.`;
    });
    elements.closePurgeModal.addEventListener('click', () => elements.purgeModal.classList.remove('active'));
    
    elements.btnStageFiles.addEventListener('click', () => {
        const threshold = parseInt(elements.purgeThreshold.value);
        let added = 0;
        const listToStage = state.leaderboardType === 'image' ? state.images : state.videos;
        listToStage.forEach(f => {
            const id = getFileId(f);
            if (state.ratings[id] && state.ratings[id].matches > 0 && getOrdinal(state.ratings[id]) < threshold) {
                if (!state.stagedFilesMap.has(id)) { state.stagedFilesMap.set(id, f); added++; }
            }
        });
        showToast(`Staged ${added} files.`);
        elements.purgeStats.textContent = `${state.stagedFilesMap.size} files staged.`;
    });
    elements.btnClearStaged.addEventListener('click', () => { state.stagedFilesMap.clear(); elements.purgeStats.textContent = `0 files staged.`; });
    elements.btnReviewStaged.addEventListener('click', startExecutionerReview);
    if (elements.btnPurgeDirect) elements.btnPurgeDirect.addEventListener('click', deleteStagedFilesDirectly);

    elements.btnCopyScript.addEventListener('click', () => { elements.scriptOutput.select(); document.execCommand('copy'); showToast("Copied!"); });

    elements.btnHardReset.addEventListener('click', async () => {
        if (!confirm("Are you sure? This will wipe all ratings completely!")) return;
        state.appMode = 'matchmaking';
        localStorage.removeItem('eloSorterRatings');
        try {
            const db = await openDB();
            const tx = db.transaction('ratings', 'readwrite');
            tx.objectStore('ratings').clear();
        } catch (e) { console.error("Error clearing IndexedDB", e); }
        state.ratings = {}; state.images = []; state.videos = [];
        state.stagedFilesMap.clear();
        state.loadedIds.clear(); loadingQueue = []; totalLoading = 0; loadedCount = 0;
        pickNextMatchup(); elements.settingsModal.classList.remove('active');
    });
    
    elements.btnExport.addEventListener('click', () => exportRatings(false));
    elements.importInput.addEventListener('change', importRatings);

    elements.btnAppFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else if (document.exitFullscreen) document.exitFullscreen();
    });
    
    elements.btnOpenToolsMenu.addEventListener('click', () => elements.toolsModal.classList.add('active'));
    elements.closeToolsModal.addEventListener('click', closeTools);

    elements.btnOpenLeaderboard.addEventListener('click', () => { closeTools(); renderLeaderboard(); elements.leaderboardModal.classList.add('active'); });
    elements.closeLeaderboardModal.addEventListener('click', () => elements.leaderboardModal.classList.remove('active'));
    
    elements.btnOpenDashboard.addEventListener('click', () => { closeTools(); renderDashboard(); elements.dashboardModal.classList.add('active'); });
    elements.closeDashboardModal.addEventListener('click', () => elements.dashboardModal.classList.remove('active'));
    
    elements.btnViewTopCont.addEventListener('click', () => startLeaderboardViewer(false));
    elements.btnViewBottomCont.addEventListener('click', () => startLeaderboardViewer(true));
    
    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (state.appMode === 'matchmaking') {
            if (e.key === 'ArrowLeft') { elements.btnPrevMedia?.click(); }
            if (e.key === 'ArrowRight') { elements.btnNextMedia?.click(); }
            if (e.key === 'Enter') submitMatch();
            if (e.key === 'ArrowDown') elements.btnUndo.click();
        } else if (state.appMode === 'executioner' || state.appMode === 'leaderboard_viewer') {
            if (e.key === 'ArrowLeft') elements.btnPrevMatch.click();
            if (e.key === 'ArrowRight') elements.btnNextMatch.click();
        }
    });
}
function exportRatings(isAuto = false) {
    const exportData = {
        ratings: state.ratings,
        stagedFiles: Array.from(state.stagedFilesMap.keys())
    };
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const node = document.createElement('a');
    node.setAttribute("href", url);
    const dt = new Date().toISOString().replace(/[:.]/g, '-');
    const prefix = appSettings.backupPrefix || 'dms_elo';
    node.setAttribute("download", `${prefix}_${isAuto?'autobackup':'backup'}_${dt}.json`);
    document.body.appendChild(node); node.click(); node.remove();
    URL.revokeObjectURL(url);
    showToast(isAuto ? "Auto-backup successful!" : "Exported Backup!");
}
async function importRatings(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    let processedFiles = 0;
    
    for (const file of files) {
        await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const parsed = JSON.parse(e.target.result);
                    
                    const mergeRatings = (newRatings) => {
                        for (const key in newRatings) {
                            const id = key.split('/').pop();
                            const rating = newRatings[key];
                            if (state.ratings[id]) {
                                const m1 = rating.matches || 0;
                                const m2 = state.ratings[id].matches || 0;
                                if (m1 > m2) {
                                    state.ratings[id] = rating;
                                } else if (m1 === m2) {
                                    if (getOrdinal(rating) > getOrdinal(state.ratings[id])) {
                                        state.ratings[id] = rating;
                                    }
                                }
                            } else {
                                state.ratings[id] = rating;
                            }
                        }
                    };

                    if (parsed.ratings) {
                        // New schema with staged files
                        mergeRatings(parsed.ratings);
                        if (parsed.stagedFiles && Array.isArray(parsed.stagedFiles)) {
                            const migratedStaged = parsed.stagedFiles.map(id => id.split('/').pop());
                            const allFiles = [...state.images, ...state.videos];
                            for (const f of allFiles) {
                                const id = getFileId(f);
                                if (migratedStaged.includes(id)) {
                                    state.stagedFilesMap.set(id, f);
                                }
                            }
                        }
                    } else {
                        // Legacy schema fallback
                        const firstKey = Object.keys(parsed)[0];
                        if (firstKey && typeof parsed[firstKey].mu !== 'number') throw new Error("Invalid schema");
                        mergeRatings(parsed);
                    }
                    processedFiles++;
                    resolve();
                } catch (err) {
                    showToast(`Invalid JSON in ${file.name}.`);
                    resolve();
                }
            };
            reader.readAsText(file);
        });
    }
    
    if (processedFiles > 0) {
        if (elements.purgeStats) elements.purgeStats.textContent = `${state.stagedFilesMap.size} files staged.`;
        await saveRatingsToStorage(); 
        showToast(`Restored ${processedFiles} backup(s)!`);
        event.target.value = '';
        renderLeaderboard();
        pickNextMatchup();
    }
}

function renderDashboard() {
    const listToStage = state.leaderboardType === 'image' ? state.images : state.videos;
    elements.dashTotalMedia.textContent = listToStage.length;
    
    let totalMatches = 0;
    let totalDeficit = 0;
    const ordinals = [];
    listToStage.forEach(f => {
        const id = getFileId(f);
        const matches = state.ratings[id]?.matches || 0;
        totalMatches += matches;
        totalDeficit += Math.max(0, 3 - matches);
        
        if (matches > 0) {
            ordinals.push(getOrdinal(state.ratings[id]));
        }
    });
    
    elements.dashTotalMatches.textContent = Math.ceil(totalMatches / 4);

    const remainingMatches = totalDeficit / 4; 
    const remainingSeconds = remainingMatches * 3; 
    if (listToStage.length === 0) {
        elements.dashEta.textContent = "Load media to estimate";
    } else if (remainingSeconds <= 0) {
        elements.dashEta.textContent = "Fully Sorted! 🎉";
    } else if (remainingSeconds < 60) {
        elements.dashEta.textContent = `< 1 minute`;
    } else if (remainingSeconds < 3600) {
        elements.dashEta.textContent = `~${Math.ceil(remainingSeconds / 60)} minutes`;
    } else {
        elements.dashEta.textContent = `~${(remainingSeconds / 3600).toFixed(1)} hours`;
    }

    if (ordinals.length > 0) {
        const min = Math.min(...ordinals);
        const max = Math.max(...ordinals);
        const buckets = new Array(10).fill(0);
        const range = Math.max(0.1, max - min);
        
        ordinals.forEach(val => {
            let idx = Math.floor(((val - min) / range) * 10);
            if (idx === 10) idx = 9;
            buckets[idx]++;
        });

        const maxBucket = Math.max(...buckets);
        elements.dashBellCurve.innerHTML = buckets.map(count => {
            const height = maxBucket > 0 ? (count / maxBucket) * 100 : 0;
            return `<div class="dash-bar" style="height: ${height}%;" title="${count} items">${count > 0 ? count : ''}</div>`;
        }).join('');
    } else {
        elements.dashBellCurve.innerHTML = '';
    }
}

function generateCuratorScripts() {
    const listToStage = state.leaderboardType === 'image' ? state.images : state.videos;
    if (listToStage.length === 0) {
        showToast("No media available.");
        return;
    }
    const sortedList = [...listToStage].sort((a, b) => {
        const idA = getFileId(a);
        const idB = getFileId(b);
        const oA = state.ratings[idA] ? getOrdinal(state.ratings[idA]) : 0;
        const oB = state.ratings[idB] ? getOrdinal(state.ratings[idB]) : 0;
        return oB - oA; // highest first
    });

    let thresholdPercent = parseInt(elements.curatorThreshold.value, 10);
    if (isNaN(thresholdPercent) || thresholdPercent < 0) thresholdPercent = 10;
    const numFiles = Math.max(1, Math.floor(sortedList.length * (thresholdPercent / 100)));
    const topFiles = sortedList.slice(0, numFiles);

    const names = topFiles.map(f => {
        if (f.webkitRelativePath) {
            const parts = f.webkitRelativePath.split('/');
            if (parts.length > 1) return parts.slice(1).join('/');
        }
        return f.name;
    });

    const py = `import os
import shutil

# WARNING: If file paths lack directories, you MUST run this script inside the target folder!
copied_count = 0
favorites_dir = "favorites"

if not os.path.exists(favorites_dir):
    os.makedirs(favorites_dir)

files = [
${names.map(n => '  ' + JSON.stringify(n) + ',').join('\\n')}
]

def get_unique_path(dest):
    if not os.path.exists(dest): return dest
    base, ext = os.path.splitext(dest)
    counter = 1
    while os.path.exists(f"{base}_{counter}{ext}"):
        counter += 1
    return f"{base}_{counter}{ext}"

for f in files:
  if os.path.exists(f):
    try:
      base_dest = os.path.join(favorites_dir, os.path.basename(f))
      dest = get_unique_path(base_dest)
      shutil.copy2(f, dest)
      copied_count += 1
    except Exception as e:
      print(f"Error copying {f}: {e}")

print(f"Successfully copied {copied_count} files to '{favorites_dir}'.")`;

    elements.curatorScriptOutput.value = py;
    elements.curatorScriptContainer.classList.remove('hidden');
    showToast(`Curator script generated for top ${numFiles} files!`);
}

function generateScripts() {
    if(state.stagedFilesMap.size === 0) {
        showToast("No files left to delete.");
        return;
    }
    elements.purgeModal.classList.add('active');
    const names = Array.from(state.stagedFilesMap.values()).map(f => {
        if (f.webkitRelativePath) {
            const parts = f.webkitRelativePath.split('/');
            if (parts.length > 1) return parts.slice(1).join('/');
        }
        return f.name;
    });
    const py = `import os
# WARNING: If file paths lack directories, you MUST run this script inside the target folder!
deleted_count = 0
freed_bytes = 0
files = [
${names.map(n=>`  ${JSON.stringify(n)},`).join('\n')}
]
for f in files:
  if os.path.exists(f):
    try:
      size = os.path.getsize(f)
      os.remove(f)
      freed_bytes += size
      deleted_count += 1
    except Exception as e:
      print(f"Error deleting {f}: {e}")
print(f"Successfully deleted {deleted_count} files, freeing {freed_bytes / (1024*1024):.2f} MB.")`;
    elements.scriptOutput.value = py;
    elements.scriptContainer.classList.remove('hidden');
    elements.purgeStats.textContent = `Script ready for ${state.stagedFilesMap.size} files.`;
    
    const stagedIds = Array.from(state.stagedFilesMap.keys());
    for (const id of stagedIds) {
        if (!state.ratings[id]) state.ratings[id] = { mu: 25.0, sigma: 8.333, matches: 0 };
        state.ratings[id].blacklisted = true;
    }
    saveRatingsToStorage(stagedIds);
}

async function copyFavoritesDirectly() {
    if (!window.showDirectoryPicker) {
        showToast("File System Access API not supported by your browser.");
        return;
    }
    const listToStage = state.leaderboardType === 'image' ? state.images : state.videos;
    if (listToStage.length === 0) {
        showToast("No media available.");
        return;
    }
    const sortedList = [...listToStage].sort((a, b) => {
        const idA = getFileId(a);
        const idB = getFileId(b);
        const oA = state.ratings[idA] ? getOrdinal(state.ratings[idA]) : 0;
        const oB = state.ratings[idB] ? getOrdinal(state.ratings[idB]) : 0;
        return oB - oA;
    });

    let thresholdPercent = parseInt(elements.curatorThreshold.value, 10);
    if (isNaN(thresholdPercent) || thresholdPercent < 0) thresholdPercent = 10;
    const numFiles = Math.max(1, Math.floor(sortedList.length * (thresholdPercent / 100)));
    const topFiles = sortedList.slice(0, numFiles);

    try {
        const destDirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        elements.curatorModal.classList.remove('active');
        showToast("Copying " + numFiles + " files...");
        let copied = 0;
        
        for (const f of topFiles) {
            try {
                let finalName = f.name;
                let counter = 1;
                while (true) {
                    try {
                        await destDirHandle.getFileHandle(finalName);
                        const dotIndex = f.name.lastIndexOf('.');
                        const base = dotIndex !== -1 ? f.name.substring(0, dotIndex) : f.name;
                        const ext = dotIndex !== -1 ? f.name.substring(dotIndex) : '';
                        finalName = `${base}_${counter}${ext}`;
                        counter++;
                    } catch (e) {
                        break;
                    }
                }
                const newFileHandle = await destDirHandle.getFileHandle(finalName, { create: true });
                const writable = await newFileHandle.createWritable();
                await writable.write(f);
                await writable.close();
                copied++;
            } catch (err) {
                console.error(`Failed to copy ${f.name}:`, err);
            }
        }
        showToast(`Successfully copied ${copied} files!`);
    } catch (err) {
        console.error(err);
        showToast("Copy cancelled or failed.");
    }
}

async function deleteStagedFilesDirectly() {
    if (!window.showDirectoryPicker) {
        showToast("File System Access API not supported by your browser.");
        return;
    }
    if(state.stagedFilesMap.size === 0) {
        showToast("No files left to delete.");
        return;
    }
    try {
        showToast("Please select the root directory containing your media to allow deletion.");
        const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        let deletedCount = 0;
        let freedBytes = 0;
        let processedIds = [];
        elements.purgeModal.classList.remove('active');

        for (const [id, f] of state.stagedFilesMap.entries()) {
            const parts = f.webkitRelativePath ? f.webkitRelativePath.split('/') : [f.name];
            let currentHandle = dirHandle;
            try {
                if (parts.length > 1) {
                    const startIndex = (dirHandle.name === parts[0]) ? 1 : 0;
                    for (let i = startIndex; i < parts.length - 1; i++) {
                        currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
                    }
                }
                const filename = parts[parts.length - 1];
                await currentHandle.removeEntry(filename);
                freedBytes += f.size || 0;
                deletedCount++;
                processedIds.push(id);
                state.stagedFilesMap.delete(id);
                if (!state.ratings[id]) state.ratings[id] = { mu: 25.0, sigma: 8.333, matches: 0 };
                state.ratings[id].blacklisted = true;
            } catch (err) {
                console.error("Failed to delete", f.name, err);
            }
        }
        if (processedIds.length > 0) saveRatingsToStorage(processedIds);
        showToast(`Successfully deleted ${deletedCount} files, freeing ${(freedBytes / (1024*1024)).toFixed(2)} MB.`);
    } catch (err) {
        console.error(err);
        showToast("Deletion cancelled or failed.");
    }
}



window.handleMediaError = function() {
    destroyPanzoomAndWheel();
    elements.mediaContainer.innerHTML = `
        <div class="empty-state glass-panel" style="padding: 40px; border: 2px dashed rgba(255, 71, 87, 0.5);">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 48px; margin-bottom: 15px; color: var(--accent-red);"></i>
            <h2 style="color: var(--accent-red);">Corrupted Media</h2>
            <p>This file is corrupted or its format is unsupported by your browser.</p>
            <p style="margin-top: 15px; font-size: 0.9em; opacity: 0.8;">Tip: You can use the Executioner tool to safely queue this broken file for deletion.</p>
        </div>
    `;
};

document.addEventListener('DOMContentLoaded', init);

// Resize Handle Logic
let isResizing = false;
let startY = 0;
let startSize = 60;
const resizeHandle = document.getElementById('footer-resize-handle');
resizeHandle.addEventListener('pointerdown', (e) => {
    isResizing = true;
    startY = e.clientY;
    const rootStyles = getComputedStyle(document.documentElement);
    startSize = parseInt(rootStyles.getPropertyValue('--thumb-size')) || 60;
    document.body.style.userSelect = 'none';
    resizeHandle.setPointerCapture(e.pointerId);
});
resizeHandle.addEventListener('pointermove', (e) => {
    if (!isResizing) return;
    const dy = startY - e.clientY;
    let newSize = startSize + dy;
    if (newSize < 40) newSize = 40;
    if (newSize > window.innerHeight * 0.5) newSize = window.innerHeight * 0.5;
    document.documentElement.style.setProperty('--thumb-size', `${newSize}px`);
});
resizeHandle.addEventListener('pointerup', (e) => {
    isResizing = false;
    document.body.style.userSelect = '';
});
resizeHandle.addEventListener('pointercancel', (e) => {
    isResizing = false;
    document.body.style.userSelect = '';
});