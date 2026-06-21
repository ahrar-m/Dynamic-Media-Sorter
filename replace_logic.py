import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace CSS
css_pattern = r"\.arena-container \{ display: flex; flex: 1; padding: 10px; gap: 10px; align-items: stretch; justify-content: center; \}.*?@media \(max-width: 768px\) \{ \.vs-divider \{ display: none; \} \}"
css_replacement = """        .arena-grid { padding: 15px; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; flex: 1; align-content: start; overflow-y: auto; }
        .arena-card { 
            position: relative; border-radius: 8px; overflow: hidden; border: 1px solid var(--glass-border); 
            display: flex; flex-direction: column; background: #000; cursor: pointer; aspect-ratio: 1/1;
            transition: opacity 0.2s, transform 0.2s;
        }
        .arena-card img, .arena-card video { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
        .arena-card.ranked { opacity: 0.3; transform: scale(0.95); border-color: var(--primary); }
        .arena-card .rank-badge {
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            font-size: 2.5rem; font-family: 'Orbitron'; font-weight: bold; color: var(--primary);
            text-shadow: 0 0 20px #000, var(--glow); pointer-events: none; z-index: 10;
        }
        .arena-controls { padding: 10px; display: flex; justify-content: center; gap: 15px; background: rgba(0,0,0,0.8); border-top: 1px solid var(--glass-border); flex-shrink: 0; }"""
content = re.sub(css_pattern, css_replacement, content, flags=re.DOTALL)

# Replace HTML Arena
html_pattern = r'<section id="arena-screen" class="hidden">.*?<div class="stats-text" id="stats-text">RANKED: 0 \| TRASHED: 0 \| TOTAL: 0</div>\s*</section>'
html_replacement = """        <section id="arena-screen" class="hidden">
            <div class="grid-header glass" style="justify-content: center; flex-direction: column; padding: 10px;">
                <h3 style="color:var(--primary); text-shadow:var(--glow); font-size: 1rem; margin: 0;">TAP TO RANK (1ST to WORST)</h3>
                <div style="font-size: 0.75rem; color: #94a3b8; text-align: center; width: 100%; margin-top: 5px;">Long-press to view fullscreen</div>
            </div>
            <div class="arena-grid" id="arena-grid"></div>
            <div class="arena-controls">
                <button class="btn danger" id="btn-arena-trash-unranked">TRASH UNRANKED</button>
                <button class="btn success" id="btn-arena-submit" style="flex:1;">SUBMIT RANKINGS</button>
            </div>
            <div class="stats-text" id="stats-text"></div>
        </section>"""
content = re.sub(html_pattern, html_replacement, content, flags=re.DOTALL)

# Insert Fullscreen HTML
fs_insert = """    <!-- Generic Fullscreen View -->
    <div id="fullscreen-view-modal" class="hidden" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh; background: #000; z-index: 2000; display: flex; align-items: center; justify-content: center;">
        <button class="icon-btn" id="btn-close-fullscreen" style="top: 15px; left: 15px; background: rgba(0,0,0,0.5); border: 1px solid var(--glass-border); color: var(--primary); border-radius: 50%; width: 40px; height: 40px; padding: 0;">✕</button>
        <div id="fullscreen-content" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"></div>
    </div>
    
    <!-- Detail Feed Modal -->"""
content = content.replace('    <!-- Detail Feed Modal -->', fs_insert)

# Replace JS state
content = content.replace("let mediaMode = 'image'; let currentScreen = 'home'; let currentPair = null;", "let mediaMode = 'image'; let currentScreen = 'home'; let currentBatchKeys = []; let rankedOrder = [];")

# Refresh hook replacement
content = content.replace("if (currentScreen === 'arena') pickNextPair();", "if (currentScreen === 'arena') pickNextBatch();")

# The big logic replacement
logic_pattern = r'        function pickNextPair\(\) \{.*?\n        \}\); // End of JS Logic loop?'
logic_pattern = r'        function pickNextPair\(\) \{.*?\n        \}\);\n        \}\);'
logic_replacement = """        function pickNextBatch() {
            if(isAnimating) return;
            const active = getActiveKeys();
            if (active.length < 2) { document.getElementById('arena-grid').innerHTML = `<div style="margin:auto; text-align:center; padding:50px; grid-column: 1 / -1;"><h3 style="color:var(--primary); text-shadow:var(--glow);">NO MORE ${mediaMode.toUpperCase()}S LEFT</h3></div>`; return; }
            
            // Prioritize lowest match count
            active.sort((a,b) => mediaData[a].matches - mediaData[b].matches);
            
            // Slice the top 50 least-seen items, and randomly pick up to 10 from them.
            const poolSize = Math.min(active.length, 50);
            const pool = active.slice(0, poolSize);
            
            currentBatchKeys = [];
            const numToPick = Math.min(10, active.length);
            for(let i=0; i<numToPick; i++) {
                const rIdx = Math.floor(Math.random() * pool.length);
                currentBatchKeys.push(pool.splice(rIdx, 1)[0]);
            }
            
            rankedOrder = [];
            renderArenaGrid();
            updateHeaderActions(); 
        }

        function renderArenaGrid() {
            const container = document.getElementById('arena-grid');
            container.innerHTML = '';
            
            currentBatchKeys.forEach((key) => {
                const item = mediaData[key];
                const card = document.createElement('div');
                card.className = 'arena-card glass';
                card.dataset.key = key;
                
                const mediaEl = createMediaElement(item.file);
                if(mediaEl.tagName === 'VIDEO') mediaEl.removeAttribute('controls');
                card.appendChild(mediaEl);
                
                let pressTimer;
                let isDragging = false;
                card.addEventListener('touchstart', (e) => {
                    isDragging = false;
                    pressTimer = setTimeout(() => {
                        openFullscreen(item.file);
                        isDragging = true;
                    }, 500);
                }, {passive: true});
                card.addEventListener('touchmove', () => { isDragging = true; clearTimeout(pressTimer); }, {passive: true});
                card.addEventListener('touchend', (e) => {
                    clearTimeout(pressTimer);
                    if(!isDragging) {
                        e.preventDefault();
                        handleArenaTap(key, card);
                    }
                });
                card.addEventListener('mousedown', (e) => {
                    isDragging = false;
                    pressTimer = setTimeout(() => {
                        openFullscreen(item.file);
                        isDragging = true;
                    }, 500);
                });
                card.addEventListener('mousemove', () => { isDragging = true; clearTimeout(pressTimer); });
                card.addEventListener('mouseup', (e) => {
                    clearTimeout(pressTimer);
                    if(!isDragging) handleArenaTap(key, card);
                });
                
                container.appendChild(card);
            });
        }

        function handleArenaTap(key, cardEl) {
            const rankIdx = rankedOrder.indexOf(key);
            if (rankIdx > -1) {
                if (rankIdx === rankedOrder.length - 1) {
                    rankedOrder.pop();
                    cardEl.classList.remove('ranked');
                    const badge = cardEl.querySelector('.rank-badge');
                    if (badge) badge.remove();
                }
            } else {
                rankedOrder.push(key);
                cardEl.classList.add('ranked');
                const badge = document.createElement('div');
                badge.className = 'rank-badge';
                badge.textContent = `#${rankedOrder.length}`;
                cardEl.appendChild(badge);
            }
        }

        function openFullscreen(file) {
            const modal = document.getElementById('fullscreen-view-modal');
            const content = document.getElementById('fullscreen-content');
            content.innerHTML = '';
            const el = createMediaElement(file);
            el.style.width = '100%'; el.style.height = '100%'; el.style.objectFit = 'contain';
            if(el.tagName === 'VIDEO') { el.controls = true; el.play().catch(()=>{}); }
            content.appendChild(el);
            modal.classList.remove('hidden');
            history.pushState({ fullscreen: true }, '');
        }
        
        function closeFullscreen() {
            const modal = document.getElementById('fullscreen-view-modal');
            modal.classList.add('hidden');
            const content = document.getElementById('fullscreen-content');
            if(content.firstChild && content.firstChild.tagName === 'VIDEO') content.firstChild.pause();
            content.innerHTML = '';
        }

        window.addEventListener('popstate', (e) => {
            if (!document.getElementById('fullscreen-view-modal').classList.contains('hidden')) {
                closeFullscreen();
            }
        });
        
        document.getElementById('btn-close-fullscreen').addEventListener('click', () => {
            if (history.state && history.state.fullscreen) { history.back(); } else { closeFullscreen(); }
        });

        document.getElementById('btn-arena-submit').addEventListener('click', () => submitBatch(false));
        document.getElementById('btn-arena-trash-unranked').addEventListener('click', () => submitBatch(true));

        function submitBatch(trashUnranked) {
            if (currentBatchKeys.length < 2) return;
            if (rankedOrder.length === 0 && !trashUnranked) {
                alert("Tap at least one item to rank it!");
                return;
            }
            if (rankedOrder.length === 0 && trashUnranked) {
                // Trash all of them
                currentBatchKeys.forEach(k => mediaData[k].trashed = true);
                pickNextBatch();
                updateStats();
                return;
            }
            
            isAnimating = true;
            saveHistory();
            
            const untappeds = currentBatchKeys.filter(k => !rankedOrder.includes(k));
            let teams = [];
            let ranks = [];
            
            rankedOrder.forEach((k, idx) => {
                teams.push([{ mu: mediaData[k].mu, sigma: mediaData[k].sigma, key: k }]);
                ranks.push(idx + 1);
            });
            
            const lastRank = rankedOrder.length + 1;
            untappeds.forEach(k => {
                if (trashUnranked) {
                    mediaData[k].trashed = true;
                } else {
                    teams.push([{ mu: mediaData[k].mu, sigma: mediaData[k].sigma, key: k }]);
                    ranks.push(lastRank);
                }
            });
            
            if (teams.length > 1) {
                const newRatings = rate(teams, { rank: ranks });
                teams.forEach((team, teamIdx) => {
                    const key = team[0].key;
                    mediaData[key].mu = newRatings[teamIdx][0].mu;
                    mediaData[key].sigma = newRatings[teamIdx][0].sigma;
                    mediaData[key].matches++;
                });
            } else if (teams.length === 1) {
                // Only 1 ranked, others trashed. Still increase match count
                mediaData[teams[0][0].key].matches++;
            }
            
            isAnimating = false;
            pickNextBatch();
            updateStats();
        }

        function saveHistory() {
            if(currentBatchKeys.length === 0) return;
            previousState = {
                keys: [...currentBatchKeys],
                data: currentBatchKeys.reduce((acc, k) => { acc[k] = {...mediaData[k]}; return acc; }, {})
            };
            updateHeaderActions();
        }

        function undoAction() {
            if(!previousState || isAnimating) return;
            const {keys, data} = previousState;
            keys.forEach(k => { Object.assign(mediaData[k], data[k]); });
            currentBatchKeys = keys;
            rankedOrder = [];
            previousState = null; 
            renderArenaGrid(); 
            updateHeaderActions(); 
            updateStats();
        }"""
content = re.sub(logic_pattern, logic_replacement, content, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
