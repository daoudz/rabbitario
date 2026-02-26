/* ===================================================
   tiles.js  –  Tile definitions and background renderer
   Tile types: 0=air, 1=ground, 2=platform, 3=brick, 4=qblock, 5=used-block
   =================================================== */
'use strict';

const Tiles = (() => {
    const TILE = 32; // px per tile

    // Draw tile on ctx at grid position (gx, gy) with camera offset
    function drawTile(ctx, type, gx, gy, camX, level) {
        const px = gx * TILE - camX;
        const py = gy * TILE;
        if (px > ctx.canvas.width + TILE || px < -TILE) return;

        // Level-specific palette
        const pal = level === 0 ? PALETTES.grass :
            level === 1 ? PALETTES.cave :
                PALETTES.boss;

        switch (type) {
            case 1: drawGround(ctx, px, py, pal); break;
            case 2: drawPlatform(ctx, px, py, pal); break;
            case 3: ctx.drawImage(Sprites.BRICK, px, py, TILE, TILE); break;
            case 4: ctx.drawImage(Sprites.QBLOCK, px, py, TILE, TILE); break;
            case 5: drawUsedBlock(ctx, px, py); break;
            case 6: drawPipe(ctx, px, py, pal); break;
        }
    }

    const PALETTES = {
        grass: { top: '#55ee55', mid: '#8B5E3C', dark: '#6B3D1C' },
        cave: { top: '#8888ff', mid: '#555577', dark: '#333355' },
        boss: { top: '#cc4444', mid: '#884422', dark: '#442211' },
    };

    function drawGround(ctx, px, py, pal) {
        // Top stripe
        ctx.fillStyle = pal.top;
        ctx.fillRect(px, py, TILE, 6);
        // Main body
        ctx.fillStyle = pal.mid;
        ctx.fillRect(px, py + 6, TILE, TILE - 6);
        // Dark border bottom
        ctx.fillStyle = pal.dark;
        ctx.fillRect(px, py + TILE - 4, TILE, 4);
        // Pixel detail dots
        ctx.fillStyle = pal.dark;
        for (let i = 4; i < TILE; i += 8) {
            ctx.fillRect(px + i, py + 10, 2, 2);
        }
    }

    function drawPlatform(ctx, px, py, pal) {
        ctx.fillStyle = pal.top;
        ctx.fillRect(px, py, TILE, 10);
        ctx.fillStyle = pal.mid;
        ctx.fillRect(px, py + 10, TILE, TILE - 10);
        ctx.fillStyle = pal.dark;
        ctx.fillRect(px, py + TILE - 3, TILE, 3);
    }

    function drawUsedBlock(ctx, px, py) {
        ctx.fillStyle = '#888855';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#666633';
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = '#444422';
        ctx.fillRect(px + 6, py + TILE / 2 - 3, TILE - 12, 6);
    }

    function drawPipe(ctx, px, py, pal) {
        ctx.fillStyle = '#22bb22';
        ctx.fillRect(px + 2, py, TILE - 4, TILE);
        ctx.fillStyle = '#119911';
        ctx.fillRect(px + TILE - 8, py, 6, TILE);
        // Pipe cap
        ctx.fillStyle = '#33cc33';
        ctx.fillRect(px, py, TILE, 10);
        ctx.fillStyle = '#22aa22';
        ctx.fillRect(px, py + 10, 4, TILE - 10);
    }

    // ---- BACKGROUNDS ----
    function drawBackground(ctx, camX, level, W, H) {
        if (level === 0) drawGrassBackground(ctx, camX, W, H);
        else if (level === 1) drawCaveBackground(ctx, camX, W, H);
        else drawBossBackground(ctx, camX, W, H);
    }

    function drawGrassBackground(ctx, camX, W, H) {
        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#1188ff');
        grad.addColorStop(1, '#66ccff');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Parallax clouds (move at 0.2x speed)
        const cx = (camX * 0.2) % W;
        drawCloud(ctx, 80 - cx, 60);
        drawCloud(ctx, 280 - cx, 40);
        drawCloud(ctx, 500 - cx, 80);
        drawCloud(ctx, 720 - cx, 50);
        drawCloud(ctx, W + 80 - cx, 60);
        drawCloud(ctx, W + 350 - cx, 40);

        // Distant hills (0.4x)
        const hx = (camX * 0.4) % W;
        ctx.fillStyle = '#55cc55';
        drawPixelHill(ctx, 60 - hx, H, 80, 40);
        drawPixelHill(ctx, 220 - hx, H, 100, 55);
        drawPixelHill(ctx, 420 - hx, H, 70, 35);
        drawPixelHill(ctx, W + 60 - hx, H, 80, 40);
        drawPixelHill(ctx, W + 280 - hx, H, 100, 55);
    }

    function drawCaveBackground(ctx, camX, W, H) {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#050518');
        grad.addColorStop(1, '#1a1a44');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Stars
        ctx.fillStyle = '#ffffff';
        const stars = [[40, 30], [90, 80], [180, 20], [300, 60], [420, 35], [560, 75], [680, 25]];
        const sx = (camX * 0.1) % W;
        stars.forEach(([x, y]) => { ctx.fillRect((x - sx + W) % W, y, 2, 2); });

        // Cave stalactites
        ctx.fillStyle = '#334';
        const tx = (camX * 0.6) % W;
        for (let i = 0; i < 8; i++) {
            const bx = i * 120 - tx;
            drawStalagtite(ctx, bx, 0, 12 + (i % 3) * 8);
            drawStalagtite(ctx, bx + 60, 0, 8 + (i % 2) * 12);
        }
    }

    function drawBossBackground(ctx, camX, W, H) {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#220011');
        grad.addColorStop(1, '#440022');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Lava glow at bottom
        ctx.fillStyle = 'rgba(255,60,0,0.15)';
        ctx.fillRect(0, H - 60, W, 60);

        // Eerie floating orbs
        const t = Date.now() / 1000;
        const ox = (camX * 0.15) % W;
        [[100, 150], [300, 200], [500, 120], [700, 180]].forEach(([x, y], i) => {
            const bx = (x - ox + W * 2) % W;
            const pulse = Math.sin(t * 2 + i) * 5;
            ctx.fillStyle = `rgba(200,0,100,${0.3 + Math.sin(t + i) * 0.15})`;
            ctx.beginPath();
            ctx.arc(bx, y + pulse, 16, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function drawCloud(ctx, x, y) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(x + 12, y, 24, 12);
        ctx.fillRect(x, y + 8, 48, 12);
        ctx.fillRect(x + 8, y + 4, 32, 10);
    }

    function drawPixelHill(ctx, cx, floorY, w, h) {
        for (let i = 0; i < h; i++) {
            const t = i / h;
            const hw = w * (1 - t * t) * 0.5;
            ctx.fillRect(cx - hw, floorY - h + i - 8, hw * 2, 2);
        }
    }

    function drawStalagtite(ctx, x, y, len) {
        ctx.fillStyle = '#334466';
        ctx.fillRect(x, y, 10, len);
        ctx.fillRect(x + 2, y + len, 6, 6);
        ctx.fillRect(x + 4, y + len + 6, 2, 4);
    }

    return { TILE, drawTile, drawBackground };
})();
