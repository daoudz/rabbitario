/* ===================================================
   entities.js  –  Player, Enemies, Items
   =================================================== */
'use strict';

const TILE = 32;
const GRAVITY = 0.55;
const MAX_FALL = 16;

// ─── Helper ──────────────────────────────────────────────────────────────────
function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
        a.y < b.y + b.h && a.y + a.h > b.y;
}

// ─── PLAYER ──────────────────────────────────────────────────────────────────
class Player {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.w = 28; this.h = 30;
        this.vx = 0; this.vy = 0;
        this.onGround = false;
        this.facing = 1;  // 1=right, -1=left
        this.alive = true;
        this.dying = false;
        this.dieTimer = 0;
        this.invincible = 0;    // frames of invincibility after hit
        this.lives = 3;
        this.score = 0;
        this.frame = 'idle';
        this.animTick = 0;
        this.runFrame = 0;
        this.big = false;       // mushroom power-up
    }

    get hitbox() { return { x: this.x + 2, y: this.y, w: this.w - 4, h: this.h }; }

    update(input, tilemap, mapW) {
        if (this.dying) {
            this.dieTimer++;
            this.vy -= 0.4;
            this.y += this.vy;
            return;
        }

        const speed = 3.5;
        // Horizontal
        if (input.left) { this.vx = -speed; this.facing = -1; }
        else if (input.right) { this.vx = speed; this.facing = 1; }
        else { this.vx *= 0.7; }

        // Jump
        if (input.jump && this.onGround) {
            this.vy = -13;
            this.onGround = false;
            Audio8.SFX.jump();
        }
        if (!input.jump && this.vy < -6) this.vy += 1.5; // variable jump

        // Gravity
        this.vy = Math.min(this.vy + GRAVITY, MAX_FALL);

        // Move & collide
        this.x += this.vx;
        this.x = Math.max(0, Math.min(this.x, mapW * TILE - this.w));
        this._collideH(tilemap, mapW);

        this.y += this.vy;
        this.onGround = false;
        this._collideV(tilemap, mapW);

        if (this.invincible > 0) this.invincible--;

        // Animation
        this.animTick++;
        if (!this.onGround) {
            this.frame = 'jump';
        } else if (Math.abs(this.vx) > 0.5) {
            if (this.animTick % 8 === 0) this.runFrame = (this.runFrame + 1) % 2;
            this.frame = this.runFrame === 0 ? 'run1' : 'run2';
        } else {
            this.frame = 'idle';
        }
    }

    _collideH(tilemap, mapW) {
        const tileRows = tilemap.length;
        const col1 = Math.floor(this.x / TILE);
        const col2 = Math.floor((this.x + this.w - 1) / TILE);
        const row1 = Math.floor(this.y / TILE);
        const row2 = Math.floor((this.y + this.h - 1) / TILE);
        for (let r = row1; r <= row2; r++) {
            if (r < 0 || r >= tileRows) continue;
            for (const c of [col1, col2]) {
                if (c < 0 || c >= mapW) continue;
                const t = tilemap[r][c];
                if (t === 1 || t === 2 || t === 3 || t === 4 || t === 5 || t === 6) {
                    if (this.vx > 0) this.x = c * TILE - this.w;
                    else this.x = (c + 1) * TILE;
                    this.vx = 0;
                }
            }
        }
    }

    _collideV(tilemap, mapW) {
        const tileRows = tilemap.length;
        const col1 = Math.floor((this.x + 2) / TILE);
        const col2 = Math.floor((this.x + this.w - 3) / TILE);
        const topRow = Math.floor(this.y / TILE);
        const bottomRow = Math.floor((this.y + this.h - 1) / TILE);

        if (this.vy >= 0) { // falling
            if (bottomRow >= 0 && bottomRow < tileRows) {
                for (const c of [col1, col2]) {
                    if (c < 0 || c >= mapW) continue;
                    const t = tilemap[bottomRow][c];
                    if (t === 1 || t === 2 || t === 3 || t === 4 || t === 5 || t === 6) {
                        this.y = bottomRow * TILE - this.h;
                        this.vy = 0;
                        this.onGround = true;
                    }
                }
            }
        } else { // rising
            if (topRow >= 0 && topRow < tileRows) {
                for (const c of [col1, col2]) {
                    if (c < 0 || c >= mapW) continue;
                    const t = tilemap[topRow][c];
                    if (t === 1 || t === 3 || t === 5) {
                        this.y = (topRow + 1) * TILE;
                        this.vy = 0;
                    } else if (t === 4) {
                        // hit question block
                        this.y = (topRow + 1) * TILE;
                        this.vy = 0;
                        return { hitBlock: true, row: topRow, col: c };
                    }
                }
            }
        }
        return null;
    }

    die() {
        if (this.dying || this.invincible > 0) return;
        this.dying = true;
        this.dieTimer = 0;
        this.vy = -14;
        this.vx = 0;
        this.frame = 'die';
        Audio8.SFX.die();
    }

    getHit() {
        if (this.invincible > 0) return;
        if (this.big) {
            this.big = false;
            this.invincible = 80;
            Audio8.SFX.hit();
        } else {
            this.die();
        }
    }

    draw(ctx, camX) {
        if (this.dying) {
            const sheet = Sprites.RABBIT;
            if (this.invincible % 4 < 2) return; // flash
            ctx.drawImage(sheet.die, this.x - camX - 2, this.y, 34, 34);
            return;
        }
        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;
        const sheet = this.facing >= 0 ? Sprites.RABBIT : Sprites.RABBIT_LEFT;
        const size = this.big ? 44 : 34;
        ctx.drawImage(sheet[this.frame], this.x - camX - 2, this.y - (size - this.h), size, size);
    }
}

// ─── BASE ENEMY ───────────────────────────────────────────────────────────────
class Enemy {
    constructor(x, y, w, h) {
        this.x = x; this.y = y;
        this.w = w; this.h = h;
        this.vx = 0; this.vy = 0;
        this.alive = true;
        this.dying = false;
        this.dieTimer = 0;
        this.onGround = false;
        this.animTick = 0;
        this.frame = 0;
        this.facingLeft = true;
    }

    get hitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

    baseUpdate(tilemap, mapW) {
        this.vy = Math.min(this.vy + GRAVITY, MAX_FALL);
        this.x += this.vx;
        this._collideH(tilemap, mapW);
        this.y += this.vy;
        this.onGround = false;
        this._collideV(tilemap, mapW);
        this.animTick++;
    }

    _collideH(tilemap, mapW) {
        const col = this.vx > 0 ? Math.floor((this.x + this.w) / TILE) : Math.floor(this.x / TILE);
        const r1 = Math.floor(this.y / TILE), r2 = Math.floor((this.y + this.h - 1) / TILE);
        for (let r = r1; r <= r2; r++) {
            if (r < 0 || r >= tilemap.length || col < 0 || col >= mapW) continue;
            if (tilemap[r][col] > 0) { this.vx = -this.vx; this.facingLeft = !this.facingLeft; break; }
        }
        // Turn at edges
        const edgeCol = this.vx > 0 ? Math.floor((this.x + this.w) / TILE) : Math.floor(this.x / TILE);
        const belowRow = Math.floor((this.y + this.h + 2) / TILE);
        if (belowRow < tilemap.length && edgeCol >= 0 && edgeCol < mapW) {
            if (tilemap[belowRow]?.[edgeCol] === 0) {
                this.vx = -this.vx;
                this.facingLeft = !this.facingLeft;
            }
        }
    }

    _collideV(tilemap, mapW) {
        const c1 = Math.floor(this.x / TILE), c2 = Math.floor((this.x + this.w - 1) / TILE);
        const br = Math.floor((this.y + this.h) / TILE), tr = Math.floor(this.y / TILE);
        if (this.vy >= 0 && br < tilemap.length) {
            for (const c of [c1, c2]) {
                if (c < 0 || c >= mapW) continue;
                if ((tilemap[br]?.[c] ?? 0) > 0) {
                    this.y = br * TILE - this.h; this.vy = 0; this.onGround = true;
                }
            }
        } else if (this.vy < 0 && tr >= 0) {
            for (const c of [c1, c2]) {
                if (c < 0 || c >= mapW) continue;
                if ((tilemap[tr]?.[c] ?? 0) > 0) { this.y = (tr + 1) * TILE; this.vy = 0; }
            }
        }
    }

    stomp() {
        this.dying = true;
        this.dieTimer = 0;
        this.vy = -4;
        this.vx = 0;
        Audio8.SFX.stomp();
    }

    isOnScreen(camX, screenW) {
        return this.x + this.w > camX - 64 && this.x < camX + screenW + 64;
    }
}

// ─── ZOMBIE ───────────────────────────────────────────────────────────────────
class Zombie extends Enemy {
    constructor(x, y) { super(x, y, 24, 30); this.vx = -1.4; }

    update(tilemap, mapW) {
        if (this.dying) {
            this.dieTimer++;
            this.vy += GRAVITY;
            this.y += this.vy;
            return;
        }
        this.baseUpdate(tilemap, mapW);
    }

    draw(ctx, camX) {
        if (!this.alive && !this.dying) return;
        const key = this.dying ? 'die' : (this.animTick % 16 < 8 ? 'walk1' : 'walk2');
        const sp = Sprites.ZOMBIE[key];
        const flip = !this.facingLeft;
        const px = this.x - camX, py = this.y;
        if (flip) {
            ctx.save(); ctx.translate(px + this.w, py); ctx.scale(-1, 1);
            ctx.drawImage(sp, 0, 0, 28, 32);
            ctx.restore();
        } else {
            ctx.drawImage(sp, px, py, 28, 32);
        }
    }
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
class Skeleton extends Enemy {
    constructor(x, y) { super(x, y, 22, 30); this.vx = -1.8; this.boneTimer = 0; }

    update(tilemap, mapW, player) {
        if (this.dying) { this.dieTimer++; this.vy += GRAVITY; this.y += this.vy; return; }
        this.boneTimer++;
        this.baseUpdate(tilemap, mapW);
    }

    draw(ctx, camX) {
        if (!this.alive && !this.dying) return;
        const key = this.dying ? 'die' : (this.animTick % 20 < 10 ? 'walk1' : 'walk2');
        const sp = Sprites.SKELETON[key];
        ctx.drawImage(sp, this.x - camX, this.y, 26, 32);
    }
}

// ─── DRAGON (flying) ──────────────────────────────────────────────────────────
class Dragon extends Enemy {
    constructor(x, y) {
        super(x, y, 36, 22);
        this.vx = -1.5;
        this.baseY = y;
        this.floatTimer = 0;
        this.vy = 0;
    }

    update(tilemap, mapW) {
        if (this.dying) { this.dieTimer++; this.vy += GRAVITY; this.x += this.vx; this.y += this.vy; return; }
        this.floatTimer += 0.06;
        this.y = this.baseY + Math.sin(this.floatTimer) * 28;
        this.x += this.vx;
        if (this.x < 0) { this.x = 0; this.vx = -this.vx; this.facingLeft = !this.facingLeft; }
        this.animTick++;
    }

    draw(ctx, camX) {
        if (!this.alive && !this.dying) return;
        const key = this.animTick % 16 < 8 ? 'fly1' : 'fly2';
        const sp = Sprites.DRAGON[key];
        if (this.facingLeft) {
            ctx.drawImage(sp, this.x - camX, this.y, 40, 24);
        } else {
            ctx.save(); ctx.translate(this.x - camX + 40, this.y); ctx.scale(-1, 1);
            ctx.drawImage(sp, 0, 0, 40, 24);
            ctx.restore();
        }
    }
}

// ─── BOSS (Big Spider) ────────────────────────────────────────────────────────
class Boss extends Enemy {
    constructor(x, y) {
        super(x, y, 60, 44);
        this.hp = 6;
        this.maxHp = 6;
        this.vx = -2;
        this.jumpTimer = 0;
        this.phase = 1;
        this.invincible = 0;
        this.pattern = 0;
        this.patternTimer = 0;
    }

    update(tilemap, mapW, player) {
        if (this.dying) {
            this.dieTimer++;
            this.vy += GRAVITY * 0.5;
            this.x += this.vx;
            this.y += this.vy;
            return;
        }
        if (this.invincible > 0) this.invincible--;

        this.animTick++;
        this.patternTimer++;

        // Phase 2 at half HP
        if (this.hp <= this.maxHp / 2) this.phase = 2;

        // Move toward player
        const px = player.x;
        if (Math.abs(px - this.x) > 60) {
            this.vx = px > this.x ? (this.phase === 2 ? 2.5 : 1.8) : -(this.phase === 2 ? 2.5 : 1.8);
        } else {
            this.vx *= 0.9;
        }
        this.facingLeft = this.vx < 0;

        // Periodic jump
        this.jumpTimer++;
        if (this.jumpTimer > (this.phase === 2 ? 80 : 120) && this.onGround) {
            this.vy = -16;
            this.jumpTimer = 0;
            Audio8.SFX.boss();
        }

        this.baseUpdate(tilemap, mapW);
    }

    stomp() {
        if (this.invincible > 0) return false;
        this.hp--;
        this.invincible = 40;
        Audio8.SFX.stomp();
        if (this.hp <= 0) {
            this.dying = true;
            this.dieTimer = 0;
            this.vy = -8;
            return true;
        }
        return false;
    }

    draw(ctx, camX) {
        if (!this.alive && !this.dying) return;
        // Flash on hit
        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;
        const key = this.dying ? 'idle' : (this.animTick % 20 < 10 ? 'idle' : 'walk');
        const sp = Sprites.BOSS[key];
        ctx.drawImage(sp, this.x - camX - 2, this.y - 4, 64, 48);

        // HP bar
        const barW = 64, barH = 8;
        const bx = this.x - camX - 2, by = this.y - 18;
        ctx.fillStyle = '#330000';
        ctx.fillRect(bx, by, barW, barH);
        ctx.fillStyle = this.phase === 2 ? '#ff4400' : '#ff0000';
        ctx.fillRect(bx, by, barW * (this.hp / this.maxHp), barH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, barW, barH);
    }
}

// ─── COLLECTIBLE ──────────────────────────────────────────────────────────────
class Collectible {
    constructor(x, y, type = 'carrot') {
        this.x = x; this.y = y;
        this.w = 16; this.h = 18;
        this.type = type;
        this.alive = true;
        this.bobTimer = Math.random() * Math.PI * 2;
        this.collected = false;
        this.popVy = -3;
        this.popping = type === 'mushroom';
        this.startY = y;
    }

    get hitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }

    update(tilemap, mapW) {
        this.bobTimer += 0.08;
        if (this.collected) return;
        if (this.popping) {
            this.y += this.popVy;
            this.popVy += 0.3;
            if (this.y >= this.startY) { this.y = this.startY; this.popVy = 0; this.popping = false; }
        }
    }

    draw(ctx, camX) {
        if (!this.alive) return;
        const bob = Math.sin(this.bobTimer) * 3;
        const px = this.x - camX, py = this.y + bob;
        if (this.type === 'carrot') ctx.drawImage(Sprites.CARROT, px, py, 16, 18);
        else if (this.type === 'coin') ctx.drawImage(Sprites.COIN, px, py, 14, 14);
        else if (this.type === 'mushroom') ctx.drawImage(Sprites.MUSHROOM, px, py, 18, 22);
    }
}

// ─── PARTICLE ─────────────────────────────────────────────────────────────────
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = -Math.random() * 5 - 2;
        this.color = color;
        this.life = 30 + Math.random() * 20;
        this.maxLife = this.life;
        this.size = 3 + Math.random() * 4;
    }

    update() { this.vx *= 0.9; this.vy += 0.4; this.x += this.vx; this.y += this.vy; this.life--; }
    isDead() { return this.life <= 0; }
    draw(ctx, camX) {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - camX, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// ─── SCORE POPUP ──────────────────────────────────────────────────────────────
class ScorePopup {
    constructor(x, y, val) {
        this.x = x; this.y = y; this.val = val;
        this.vy = -2; this.life = 50;
    }
    update() { this.y += this.vy; this.vy *= 0.92; this.life--; }
    isDead() { return this.life <= 0; }
    draw(ctx, camX) {
        ctx.globalAlpha = this.life / 50;
        ctx.fillStyle = '#ffff00';
        ctx.font = "bold 12px 'Press Start 2P', monospace";
        ctx.fillText('+' + this.val, this.x - camX, this.y);
        ctx.globalAlpha = 1;
    }
}
