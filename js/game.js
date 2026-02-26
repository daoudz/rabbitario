/* ===================================================
   game.js  –  Main game loop, HUD, input, screens
   =================================================== */
'use strict';

(function () {
    // ─── State ────────────────────────────────────────
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('game-container');

    let W = 0, H = 0;
    let player, enemies, collectibles, particles, scorePopups;
    let tilemap, mapW;
    let camX = 0, camXTarget = 0;
    let currentLevel = 0;
    let gameState = 'title'; // title | playing | paused | dying | levelclear | gameover | win
    let totalScore = 0;
    let bossDefeated = false;
    let goalReached = false;
    let levelClearTimer = 0;
    let blockAnims = [];   // { x, y, vy, frame }
    let lavaParticles = [];
    let raf = null;
    let lastTime = 0;

    // ─── Input ────────────────────────────────────────
    const keys = {};
    const input = { left: false, right: false, jump: false, jumpHeld: false };

    // Jump buffer: remember jump presses for up to JUMP_BUFFER frames
    // Coyote time: allow jump for up to COYOTE_FRAMES after leaving ground
    const JUMP_BUFFER = 10;  // frames
    const COYOTE_TIME = 6;   // frames
    let jumpBufferFrames = 0; // counts down from JUMP_BUFFER when jump pressed

    document.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (['ArrowUp', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
        // Register jump press immediately into buffer (even mid-air)
        if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') {
            jumpBufferFrames = JUMP_BUFFER;
        }
        if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
        if (e.code === 'KeyM') toggleMuteUI();
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });

    function readInput() {
        input.left = !!(keys['ArrowLeft'] || keys['KeyA']);
        input.right = !!(keys['ArrowRight'] || keys['KeyD']);
        // jump fires when buffer has frames remaining (consumed in player.update)
        input.jump = jumpBufferFrames > 0;
        input.jumpHeld = !!(keys['ArrowUp'] || keys['Space'] || keys['KeyW']);
        // Tick down buffer every frame
        if (jumpBufferFrames > 0) jumpBufferFrames--;
    }

    // Mobile controls
    function setupMobile() {
        const mLeft = document.getElementById('m-left');
        const mRight = document.getElementById('m-right');
        const mJump = document.getElementById('m-jump');

        // Left / Right: simple key toggle
        mLeft.addEventListener('touchstart', e => { e.preventDefault(); keys['ArrowLeft'] = true; mLeft.classList.add('pressed'); }, { passive: false });
        mLeft.addEventListener('touchend', e => { e.preventDefault(); keys['ArrowLeft'] = false; mLeft.classList.remove('pressed'); }, { passive: false });
        mRight.addEventListener('touchstart', e => { e.preventDefault(); keys['ArrowRight'] = true; mRight.classList.add('pressed'); }, { passive: false });
        mRight.addEventListener('touchend', e => { e.preventDefault(); keys['ArrowRight'] = false; mRight.classList.remove('pressed'); }, { passive: false });

        // Jump button: set buffer AND hold-key (for variable-height)
        mJump.addEventListener('touchstart', e => {
            e.preventDefault();
            keys['Space'] = true;
            jumpBufferFrames = JUMP_BUFFER;  // instant buffer fill on tap
            mJump.classList.add('pressed');
        }, { passive: false });
        mJump.addEventListener('touchend', e => {
            e.preventDefault();
            keys['Space'] = false;
            mJump.classList.remove('pressed');
        }, { passive: false });
    }
    setupMobile();

    // ─── Resize ───────────────────────────────────────
    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
        ctx.imageSmoothingEnabled = false;
    }
    window.addEventListener('resize', resize);
    resize();

    // ─── Screen helpers ───────────────────────────────
    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active'); s.style.display = ''; });
        document.getElementById('game-container').style.display = 'none';
        if (id === 'game') {
            document.getElementById('game-container').style.display = 'block';
        } else {
            const el = document.getElementById(id + '-screen');
            if (el) { el.classList.add('active'); el.style.display = 'flex'; }
        }
    }

    // ─── UI Buttons ───────────────────────────────────
    document.getElementById('btn-start').addEventListener('click', startGame);
    document.getElementById('btn-controls').addEventListener('click', () => {
        const p = document.getElementById('controls-panel');
        p.style.display = p.style.display === 'none' ? 'flex' : 'none';
    });
    document.getElementById('btn-sound-toggle').addEventListener('click', toggleMuteUI);
    document.getElementById('btn-retry').addEventListener('click', () => { currentLevel = 0; startGame(); });
    document.getElementById('btn-title').addEventListener('click', () => { showScreen('title'); Audio8.stopBG(); gameState = 'title'; });
    document.getElementById('btn-next-level').addEventListener('click', () => { currentLevel++; loadLevel(currentLevel); showScreen('game'); });
    document.getElementById('btn-play-again').addEventListener('click', () => { currentLevel = 0; startGame(); });

    function toggleMuteUI() {
        Audio8.init();
        const muted = Audio8.toggleMute();
        document.getElementById('btn-sound-toggle').textContent = muted ? '♪ SOUND: OFF' : '♪ SOUND: ON';
    }

    // ─── Game Start ───────────────────────────────────
    function startGame() {
        Audio8.init();
        Audio8.resume();
        currentLevel = 0;
        totalScore = 0;
        loadLevel(0);
        showScreen('game');
        if (raf) cancelAnimationFrame(raf);
        gameState = 'playing';
        lastTime = performance.now();
        raf = requestAnimationFrame(loop);
    }

    // ─── Load Level ───────────────────────────────────
    function loadLevel(idx) {
        const lvlDef = LEVELS[idx];
        if (!lvlDef) { showWin(); return; }
        tilemap = lvlDef.tilemap;
        mapW = lvlDef.width;
        bossDefeated = false;
        goalReached = false;
        levelClearTimer = 0;
        blockAnims = [];
        lavaParticles = [];
        particles = [];
        scorePopups = [];

        // Player
        player = new Player(lvlDef.spawnX * TILE, (lvlDef.spawnY - 1) * TILE);
        if (idx > 0) player.score = totalScore;  // preserve score

        // Enemies
        enemies = lvlDef.enemies.map(e => {
            switch (e.type) {
                case 'zombie': return new Zombie(e.tx * TILE, (e.ty - 1) * TILE);
                case 'skeleton': return new Skeleton(e.tx * TILE, (e.ty - 1) * TILE);
                case 'dragon': return new Dragon(e.tx * TILE, e.ty * TILE);
                case 'boss': return new Boss(e.tx * TILE, (e.ty - 1) * TILE);
                default: return null;
            }
        }).filter(Boolean);

        // Collectibles
        collectibles = lvlDef.collectibles.map(c =>
            new Collectible(c.tx * TILE, (c.ty - 1) * TILE, c.type)
        );

        // Camera
        camX = 0; camXTarget = 0;
        gameState = 'playing';
        Audio8.playBG(lvlDef.bgMusic);
    }

    const TILE = 32;

    // ─── Main Loop ────────────────────────────────────
    function loop(timestamp) {
        const dt = Math.min((timestamp - lastTime) / (1000 / 60), 3);
        lastTime = timestamp;
        update(dt);
        render();
        raf = requestAnimationFrame(loop);
    }

    // ─── Update ───────────────────────────────────────
    function update(dt) {
        if (gameState === 'paused') return;

        if (gameState === 'dying') {
            // Player death animation then respawn/game over
            player.update(input, tilemap, mapW);
            if (player.dieTimer > 90) {
                player.lives--;
                if (player.lives <= 0) {
                    showGameOver();
                } else {
                    reloadPlayerAtSpawn();
                }
            }
            return;
        }

        if (gameState === 'levelclear') {
            levelClearTimer++;
            player.vx = 2; player.x += 2;
            updateCamera();
            if (levelClearTimer > 120) {
                if (currentLevel >= LEVELS.length - 1) { showWin(); }
                else {
                    document.getElementById('lc-score-val').textContent = player.score;
                    nextLevelScreen();
                }
            }
            return;
        }

        if (gameState !== 'playing') return;

        readInput();

        // Player update
        player.update(input, tilemap, mapW);

        // Check if player fell into pit (below map bottom)
        if (player.y > tilemap.length * TILE + 64) {
            player.dying = true;
            player.dieTimer = 0;
            Audio8.SFX.die();
            gameState = 'dying';
            return;
        }

        // Check player death animation started
        if (player.dying) { gameState = 'dying'; return; }

        // Block collision (Q blocks hit from below)
        checkBlockHits();

        // Enemies
        const lvlDef = LEVELS[currentLevel];
        enemies.forEach(e => {
            if (!e.alive) return;
            if (e instanceof Boss) e.update(tilemap, mapW, player);
            else if (e instanceof Skeleton) e.update(tilemap, mapW, player);
            else e.update(tilemap, mapW);

            // Enemy died and fell off screen
            if (e.dying && e.y > tilemap.length * TILE + 200) e.alive = false;

            if (!e.alive || e.dying) return;
            if (!e.isOnScreen(camX, W)) return;

            // ── Player stomps enemy ──
            const ph = player.hitbox, eh = e.hitbox;
            if (rectsOverlap(ph, eh)) {
                const playerBottom = player.y + player.h;
                const enemyTop = e.y;
                const stompThresh = 14;
                if (playerBottom - enemyTop < stompThresh && player.vy > 0) {
                    // STOMP!
                    if (e instanceof Boss) {
                        const dead = e.stomp();
                        if (dead) { e.alive = false; bossDefeated = true; }
                    } else {
                        e.stomp();
                        e.alive = false;
                    }
                    player.vy = -10;  // bounce
                    const pts = e instanceof Boss ? 500 : (e instanceof Dragon ? 300 : e instanceof Skeleton ? 200 : 100);
                    player.score += pts;
                    scorePopups.push(new ScorePopup(player.x, player.y - 20, pts));
                    spawnParticles(e.x + e.w / 2, e.y + e.h / 2, e instanceof Zombie ? '#55ee55' : e instanceof Skeleton ? '#ffffff' : e instanceof Dragon ? '#ff4400' : '#9900ff', 10);
                } else {
                    // Player gets hit
                    player.getHit();
                    if (player.dying) gameState = 'dying';
                }
            }
        });

        // Collectibles
        collectibles.forEach(c => {
            if (!c.alive || c.collected) return;
            c.update(tilemap, mapW);
            if (rectsOverlap(player.hitbox, c.hitbox)) {
                c.alive = false;
                c.collected = true;
                switch (c.type) {
                    case 'carrot': player.score += 50; Audio8.SFX.coin(); spawnParticles(c.x, c.y, '#ff9900', 5); break;
                    case 'coin': player.score += 100; Audio8.SFX.coin(); spawnParticles(c.x, c.y, '#ffee44', 5); break;
                    case 'mushroom': player.score += 200; Audio8.SFX.power(); player.big = true; spawnParticles(c.x, c.y, '#ff3333', 6); break;
                }
                scorePopups.push(new ScorePopup(player.x, player.y - 20, c.type === 'mushroom' ? 200 : c.type === 'coin' ? 100 : 50));
            }
        });

        // Block animations
        blockAnims.forEach(b => { b.y += b.vy; b.vy += 1.5; b.frame++; });
        blockAnims = blockAnims.filter(b => b.frame < 20);

        // Particles
        particles.forEach(p => p.update());
        particles = particles.filter(p => !p.isDead());
        scorePopups.forEach(p => p.update());
        scorePopups = scorePopups.filter(p => !p.isDead());

        // Lava particles in boss level
        if (currentLevel === 2 && Math.random() < 0.3) {
            const lavaX = 8 * TILE + Math.random() * 2 * TILE;
            lavaParticles.push({ x: lavaX, y: tilemap.length * TILE - 20, vy: -Math.random() * 4 - 1, vx: (Math.random() - 0.5) * 2, life: 30 });
        }
        lavaParticles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--; });
        lavaParticles = lavaParticles.filter(p => p.life > 0);

        // Camera
        updateCamera();

        // Level end check
        checkLevelEnd();
    }

    function checkBlockHits() {
        // When player is rising & hits Q-block from below (handled in entities.py _collideV)
        // We replicate it here more explicitly
        if (player.vy >= 0) return;
        const hb = player.hitbox;
        const topRow = Math.floor(player.y / TILE);
        const c1 = Math.floor((hb.x + 2) / TILE);
        const c2 = Math.floor((hb.x + hb.w - 3) / TILE);
        if (topRow < 0 || topRow >= tilemap.length) return;
        for (const c of [c1, c2]) {
            if (c < 0 || c >= mapW) continue;
            if (tilemap[topRow][c] === 4) {
                // Activate Q-block
                tilemap[topRow][c] = 5;
                Audio8.SFX.block();
                blockAnims.push({ x: c * TILE, y: topRow * TILE, vy: -4, frame: 0 });
                // Spawn collectible above
                const has = collectibles.some(col => col.alive && Math.abs(col.x - c * TILE) < TILE && Math.abs(col.y - (topRow - 1) * TILE) < TILE);
                if (!has) {
                    const nc = new Collectible(c * TILE + 8, (topRow - 1) * TILE, 'coin');
                    nc.popping = true;
                    nc.popVy = -6;
                    nc.startY = nc.y;
                    collectibles.push(nc);
                }
                break;
            } else if (tilemap[topRow][c] === 3) {
                // Brick – if big, break it
                if (player.big) {
                    tilemap[topRow][c] = 0;
                    Audio8.SFX.block();
                    spawnParticles(c * TILE + 16, topRow * TILE + 8, '#aa6622', 8);
                } else {
                    Audio8.SFX.block();
                    blockAnims.push({ x: c * TILE, y: topRow * TILE, vy: -3, frame: 0 });
                }
                break;
            }
        }
    }

    function updateCamera() {
        const targetX = player.x - W * 0.35;
        camXTarget = Math.max(0, Math.min(targetX, mapW * TILE - W));
        camX += (camXTarget - camX) * 0.12;
    }

    function checkLevelEnd() {
        const lvlDef = LEVELS[currentLevel];
        if (lvlDef.isBossLevel) {
            if (bossDefeated && !goalReached) {
                goalReached = true;
                gameState = 'levelclear';
                Audio8.SFX.levelup();
            }
        } else if (lvlDef.goalX) {
            if (player.x >= lvlDef.goalX * TILE && !goalReached) {
                goalReached = true;
                gameState = 'levelclear';
                Audio8.SFX.levelup();
            }
        }
    }

    function reloadPlayerAtSpawn() {
        const lvlDef = LEVELS[currentLevel];
        player = new Player(lvlDef.spawnX * TILE, (lvlDef.spawnY - 1) * TILE);
        player.lives = Math.max(0, player.lives); // already decremented
        // restore score
        player.score = totalScore;
        player.invincible = 60;
        gameState = 'playing';
        camX = 0; camXTarget = 0;
        // Respawn dead enemies
        const lvl = LEVELS[currentLevel];
        enemies = lvl.enemies.filter(e => e.type !== 'boss' || !bossDefeated).map(e => {
            let en;
            switch (e.type) {
                case 'zombie': en = new Zombie(e.tx * TILE, (e.ty - 1) * TILE); break;
                case 'skeleton': en = new Skeleton(e.tx * TILE, (e.ty - 1) * TILE); break;
                case 'dragon': en = new Dragon(e.tx * TILE, e.ty * TILE); break;
                case 'boss': en = new Boss(e.tx * TILE, (e.ty - 1) * TILE); break;
                default: return null;
            }
            return en;
        }).filter(Boolean);
    }

    function spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
    }

    function togglePause() {
        if (gameState === 'playing') {
            gameState = 'paused';
        } else if (gameState === 'paused') {
            gameState = 'playing';
        }
    }

    function showGameOver() {
        totalScore = player ? player.score : 0;
        gameState = 'gameover';
        Audio8.stopBG();
        Audio8.SFX.gameover();
        document.getElementById('go-score-val').textContent = totalScore;
        setTimeout(() => showScreen('gameover'), 500);
    }

    function nextLevelScreen() {
        totalScore = player.score;
        gameState = 'levelclear';
        document.getElementById('lc-score-val').textContent = totalScore;
        Audio8.stopBG();
        setTimeout(() => showScreen('levelclear'), 400);
    }

    function showWin() {
        totalScore = player ? player.score : 0;
        Audio8.stopBG();
        Audio8.SFX.levelup();
        document.getElementById('win-score-val').textContent = totalScore;
        gameState = 'win';
        setTimeout(() => showScreen('win'), 600);
    }

    document.getElementById('btn-next-level').addEventListener('click', () => {
        currentLevel++;
        loadLevel(currentLevel);
        showScreen('game');
        gameState = 'playing';
    });

    // ─── Render ───────────────────────────────────────
    function render() {
        if (gameState === 'title' || gameState === 'gameover' || gameState === 'win' || gameState === 'levelclear') return;

        ctx.clearRect(0, 0, W, H);
        const lvlIdx = currentLevel;

        // Background
        Tiles.drawBackground(ctx, camX, lvlIdx, W, H);

        // Draw lava pits in level 2 & 3
        if (lvlIdx >= 1) {
            ctx.fillStyle = lvlIdx === 2 ? '#ff3300' : '#44aaff';
            const groundRow = 16;
            for (let c = 0; c < mapW; c++) {
                if (tilemap[groundRow]?.[c] === 0 && tilemap[groundRow - 1]?.[c] === 0) {
                    ctx.fillRect(c * TILE - camX, groundRow * TILE, TILE, H - groundRow * TILE);
                }
            }
            // Lava particles (level 3)
            lavaParticles.forEach(p => {
                ctx.fillStyle = `rgba(255,${Math.floor(p.life * 3)},0,${p.life / 30})`;
                ctx.fillRect(p.x - camX, p.y, 4, 4);
            });
        }

        // Draw water/pit fill on level 1
        if (lvlIdx === 0) {
            ctx.fillStyle = '#2255aa';
            for (let c = 0; c < mapW; c++) {
                if (tilemap[16]?.[c] === 0) {
                    ctx.fillRect(c * TILE - camX, 16 * TILE, TILE, H - 16 * TILE);
                }
            }
        }

        // Tiles
        for (let r = 0; r < tilemap.length; r++) {
            for (let c = 0; c < mapW; c++) {
                if (tilemap[r][c] > 0) Tiles.drawTile(ctx, tilemap[r][c], c, r, camX, lvlIdx);
            }
        }

        // Block hit animations
        blockAnims.forEach(b => {
            ctx.drawImage(Sprites.QBLOCK, b.x - camX, b.y + b.y * 0 + (b.vy > 0 ? 0 : b.vy), TILE, TILE);
        });

        // Goal flag
        const lvlDef = LEVELS[currentLevel];
        if (lvlDef.goalX) {
            const gx = lvlDef.goalX * TILE - camX;
            // Flag pole
            ctx.fillStyle = '#888';
            ctx.fillRect(gx + 14, tilemap.length * TILE - H - 60, 4, 160);
            // Flag
            const flagY = (tilemap.length * TILE - H - 20) + Math.sin(Date.now() / 300) * 4;
            ctx.fillStyle = '#ff3733';
            ctx.fillRect(gx + 18, flagY, 24, 16);
        }
        // Boss warning sign
        if (lvlDef.isBossLevel && !bossDefeated) {
            const boss = enemies.find(e => e instanceof Boss && e.alive && !e.dying);
            if (boss) {
                const bx = boss.x - camX + boss.w / 2;
                if (bx > W - 120) {
                    ctx.fillStyle = '#ff0000';
                    ctx.font = "10px 'Press Start 2P', monospace";
                    ctx.fillText('⚠ BOSS', W - 110, 30);
                }
            }
        }

        // Collectibles
        collectibles.forEach(c => c.draw(ctx, camX));

        // Enemies
        enemies.forEach(e => { if (e.isOnScreen(camX, W)) e.draw(ctx, camX); });

        // Particles
        particles.forEach(p => p.draw(ctx, camX));

        // Player
        player.draw(ctx, camX);

        // Score popups
        scorePopups.forEach(p => p.draw(ctx, camX));

        // HUD
        drawHUD();

        // Pause overlay
        if (gameState === 'paused') {
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ffee44';
            ctx.font = "24px 'Press Start 2P', monospace";
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', W / 2, H / 2);
            ctx.font = "12px 'Press Start 2P', monospace";
            ctx.fillStyle = '#fff';
            ctx.fillText('[P] to Resume', W / 2, H / 2 + 36);
            ctx.textAlign = 'left';
        }

        // Level clear overlay
        if (gameState === 'levelclear') {
            ctx.fillStyle = 'rgba(0,200,80,0.2)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#00ff66';
            ctx.font = "28px 'Press Start 2P', monospace";
            ctx.textAlign = 'center';
            ctx.fillText('STAGE CLEAR!', W / 2, H / 2 - 20);
            ctx.textAlign = 'left';
        }

        // Dying overlay flash
        if (gameState === 'dying' && player.dieTimer > 60) {
            ctx.fillStyle = `rgba(255,0,0,${(player.dieTimer - 60) / 30 * 0.4})`;
            ctx.fillRect(0, 0, W, H);
        }
    }

    function drawHUD() {
        const hud_y = 18;
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, W, 36);

        // Lives
        ctx.drawImage(Sprites.HEART, 10, 6, 18, 14);
        ctx.fillStyle = '#ff5555';
        ctx.font = "12px 'Press Start 2P', monospace";
        ctx.fillText(`× ${player.lives}`, 32, hud_y);

        // Score
        ctx.fillStyle = '#ffee44';
        ctx.font = "12px 'Press Start 2P', monospace";
        ctx.fillText(`SCORE: ${player.score}`, W / 2 - 60, hud_y);

        // Level name
        const lvlDef = LEVELS[currentLevel];
        ctx.fillStyle = '#aaddff';
        ctx.font = "9px 'Press Start 2P', monospace";
        ctx.textAlign = 'right';
        ctx.fillText(lvlDef.name + ' – LVL ' + (currentLevel + 1), W - 10, hud_y);
        ctx.textAlign = 'left';

        // Big indicator
        if (player.big) {
            ctx.fillStyle = '#ff9900';
            ctx.font = "9px 'Press Start 2P', monospace";
            ctx.fillText('★ BIG', 10, H - 10);
        }
    }

    // ─── Init ─────────────────────────────────────────
    showScreen('title');

    // Keyboard shortcut to start from title
    document.addEventListener('keydown', e => {
        if (gameState === 'title' && (e.code === 'Enter' || e.code === 'Space')) {
            e.preventDefault();
            startGame();
        }
    });

    // Animate title rabbit pixel art
    const titleRabbit = document.querySelector('.title-rabbit');
    if (titleRabbit) {
        const tr = document.createElement('canvas');
        tr.width = 64; tr.height = 64;
        tr.getContext('2d').drawImage(Sprites.RABBIT.idle, 0, 0, 64, 64);
        titleRabbit.innerHTML = '';
        titleRabbit.appendChild(tr);
        let titleFrame = 0;
        setInterval(() => {
            titleFrame++;
            const f = titleFrame % 3 === 0 ? 'idle' : titleFrame % 3 === 1 ? 'run1' : 'run2';
            const c = titleRabbit.querySelector('canvas');
            if (c) {
                c.getContext('2d').clearRect(0, 0, 64, 64);
                c.getContext('2d').drawImage(Sprites.RABBIT[f], 0, 0, 64, 64);
            }
        }, 150);
    }

    // Also start the loop even before playing so backgrounds animate
    gameState = 'title';

})();
