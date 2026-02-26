/* ===================================================
   levels.js  –  Level definitions
   
   Tile codes:
     0 = air
     1 = solid ground
     2 = platform (passable from below)
     3 = brick block
     4 = question block
     5 = used block (after Q-block hit)
     6 = pipe
   
   Enemy codes (in enemy list):
     { type, tx, ty }  –  tile-grid position
   
   Map is 20 rows × N cols
   =================================================== */
'use strict';

const LEVELS = [
    // ══════════════════════════════════════════════════
    // LEVEL 1 – Grassland  (zombies + skeletons)
    // ══════════════════════════════════════════════════
    {
        name: 'GRASSLAND',
        bgMusic: 0,
        width: 80, // tiles wide
        spawnX: 2, spawnY: 14,
        goalX: 77,  // tile col of goal flag
        tilemap: buildLevel1(),
        enemies: [
            { type: 'zombie', tx: 16, ty: 14 },
            { type: 'zombie', tx: 24, ty: 14 },
            { type: 'skeleton', tx: 30, ty: 14 },
            { type: 'zombie', tx: 38, ty: 10 },
            { type: 'skeleton', tx: 44, ty: 14 },
            { type: 'zombie', tx: 52, ty: 14 },
            { type: 'skeleton', tx: 58, ty: 14 },
            { type: 'zombie', tx: 64, ty: 8 },
            { type: 'skeleton', tx: 70, ty: 14 },
            { type: 'zombie', tx: 74, ty: 14 },
        ],
        collectibles: [
            { type: 'carrot', tx: 8, ty: 13 },
            { type: 'carrot', tx: 9, ty: 13 },
            { type: 'coin', tx: 20, ty: 12 },
            { type: 'coin', tx: 21, ty: 12 },
            { type: 'coin', tx: 22, ty: 12 },
            { type: 'carrot', tx: 35, ty: 12 },
            { type: 'mushroom', tx: 40, ty: 10 },
            { type: 'coin', tx: 55, ty: 11 },
            { type: 'coin', tx: 56, ty: 11 },
            { type: 'carrot', tx: 68, ty: 12 },
        ],
    },

    // ══════════════════════════════════════════════════
    // LEVEL 2 – Dark Cave  (skeletons + flying dragons)
    // ══════════════════════════════════════════════════
    {
        name: 'DARK CAVE',
        bgMusic: 1,
        width: 90,
        spawnX: 2, spawnY: 14,
        goalX: 87,
        tilemap: buildLevel2(),
        enemies: [
            { type: 'skeleton', tx: 12, ty: 14 },
            { type: 'dragon', tx: 18, ty: 7 },
            { type: 'skeleton', tx: 26, ty: 14 },
            { type: 'dragon', tx: 34, ty: 5 },
            { type: 'skeleton', tx: 40, ty: 14 },
            { type: 'dragon', tx: 48, ty: 8 },
            { type: 'skeleton', tx: 54, ty: 10 },
            { type: 'dragon', tx: 62, ty: 6 },
            { type: 'skeleton', tx: 70, ty: 14 },
            { type: 'dragon', tx: 78, ty: 7 },
            { type: 'skeleton', tx: 84, ty: 14 },
        ],
        collectibles: [
            { type: 'coin', tx: 10, ty: 12 },
            { type: 'coin', tx: 11, ty: 12 },
            { type: 'carrot', tx: 22, ty: 6 },
            { type: 'carrot', tx: 30, ty: 12 },
            { type: 'mushroom', tx: 36, ty: 8 },
            { type: 'coin', tx: 45, ty: 11 },
            { type: 'coin', tx: 46, ty: 11 },
            { type: 'carrot', tx: 58, ty: 8 },
            { type: 'coin', tx: 65, ty: 12 },
            { type: 'coin', tx: 66, ty: 12 },
            { type: 'carrot', tx: 75, ty: 12 },
        ],
    },

    // ══════════════════════════════════════════════════
    // LEVEL 3 – Boss Lair  (all enemies + Boss)
    // ══════════════════════════════════════════════════
    {
        name: 'BOSS LAIR',
        bgMusic: 2,
        isBossLevel: true,
        width: 60,
        spawnX: 2, spawnY: 14,
        goalX: null, // no flag – defeat boss
        tilemap: buildLevel3(),
        enemies: [
            { type: 'zombie', tx: 10, ty: 14 },
            { type: 'skeleton', tx: 16, ty: 14 },
            { type: 'dragon', tx: 22, ty: 6 },
            { type: 'zombie', tx: 28, ty: 14 },
            { type: 'boss', tx: 44, ty: 11 },
        ],
        collectibles: [
            { type: 'carrot', tx: 6, ty: 12 },
            { type: 'coin', tx: 14, ty: 12 },
            { type: 'coin', tx: 15, ty: 12 },
            { type: 'mushroom', tx: 20, ty: 8 },
            { type: 'carrot', tx: 35, ty: 12 },
            { type: 'coin', tx: 40, ty: 12 },
        ],
    },
];

// ─── Level Builders ───────────────────────────────────────────────────────────
function buildLevel1() {
    const W = 80, H = 20;
    const m = emptyMap(H, W);
    // Ground row (16)
    fillRow(m, 16, 0, W, 1);
    fillRow(m, 17, 0, W, 1);
    fillRow(m, 18, 0, W, 1);
    fillRow(m, 19, 0, W, 1);

    // Platforms
    fillRow(m, 13, 4, 7, 2);     // early platform
    fillRow(m, 11, 12, 16, 2);   // mid platform
    fillRow(m, 10, 18, 22, 2);   // raised section
    fillRow(m, 12, 25, 29, 2);
    fillRow(m, 9, 32, 36, 2);
    fillRow(m, 13, 40, 44, 2);   // lower platform
    fillRow(m, 10, 47, 51, 2);
    fillRow(m, 8, 55, 59, 2);   // high bridge
    fillRow(m, 12, 62, 67, 2);
    fillRow(m, 11, 70, 74, 2);

    // Brick rows
    fillRow(m, 12, 8, 10, 3);
    fillRow(m, 10, 14, 16, 4);  // Q-blocks
    m[10][15] = 4;
    fillRow(m, 8, 22, 24, 3);
    m[11][27] = 4;
    m[11][28] = 4;
    fillRow(m, 7, 33, 35, 3);
    m[9][48] = 4;
    fillRow(m, 7, 56, 58, 3);
    m[9][64] = 4;
    m[9][65] = 4;
    fillRow(m, 9, 71, 73, 3);

    // Pipes
    m[15][6] = 6; m[14][6] = 6;
    m[15][20] = 6; m[14][20] = 6; m[13][20] = 6;
    m[15][45] = 6; m[14][45] = 6;
    m[15][60] = 6; m[14][60] = 6; m[13][60] = 6;
    m[15][75] = 6; m[14][75] = 6;

    return m;
}

function buildLevel2() {
    const W = 90, H = 20;
    const m = emptyMap(H, W);
    fillRow(m, 16, 0, W, 1);
    fillRow(m, 17, 0, W, 1);
    fillRow(m, 18, 0, W, 1);
    fillRow(m, 19, 0, W, 1);

    // Ceiling (cave feel)
    fillRow(m, 0, 0, W, 1);
    fillRow(m, 1, 0, W, 1);

    // Platforms
    fillRow(m, 12, 5, 9, 2);
    fillRow(m, 10, 14, 18, 2);
    fillRow(m, 8, 20, 24, 2);
    fillRow(m, 12, 27, 31, 2);
    fillRow(m, 9, 35, 39, 2);
    fillRow(m, 12, 42, 46, 2);
    fillRow(m, 8, 50, 54, 2);
    fillRow(m, 11, 58, 62, 2);
    fillRow(m, 9, 66, 70, 2);
    fillRow(m, 12, 74, 78, 2);
    fillRow(m, 10, 82, 86, 2);

    // Bricks and Q-blocks
    fillRow(m, 11, 8, 10, 3);
    m[9][15] = 4; m[9][16] = 4;
    fillRow(m, 7, 21, 23, 3);
    m[11][29] = 4;
    fillRow(m, 8, 36, 38, 3);
    m[11][44] = 4; m[11][45] = 4;
    fillRow(m, 7, 51, 53, 3);
    m[10][60] = 4;
    fillRow(m, 8, 67, 69, 3);
    m[11][76] = 4;
    m[9][83] = 4; m[9][84] = 4;

    // Gaps in ground (pits!)
    clearRow(m, 16, 11, 13);
    clearRow(m, 17, 11, 13);
    clearRow(m, 18, 11, 13);
    clearRow(m, 16, 31, 34);
    clearRow(m, 17, 31, 34);
    clearRow(m, 18, 31, 34);
    clearRow(m, 16, 55, 57);
    clearRow(m, 17, 55, 57);
    clearRow(m, 18, 55, 57);
    clearRow(m, 16, 72, 74);
    clearRow(m, 17, 72, 74);
    clearRow(m, 18, 72, 74);

    return m;
}

function buildLevel3() {
    const W = 60, H = 20;
    const m = emptyMap(H, W);
    fillRow(m, 16, 0, W, 1);
    fillRow(m, 17, 0, W, 1);
    fillRow(m, 18, 0, W, 1);
    fillRow(m, 19, 0, W, 1);

    // Boss arena – wider open area
    fillRow(m, 13, 4, 8, 2);
    fillRow(m, 11, 10, 14, 2);
    fillRow(m, 9, 16, 20, 2);  // higher platform for boss jumping
    fillRow(m, 13, 22, 26, 2);
    fillRow(m, 11, 30, 35, 2);  // center platform
    fillRow(m, 13, 38, 42, 2);
    fillRow(m, 10, 44, 48, 2);  // boss landing zone
    fillRow(m, 12, 52, 56, 2);

    // Q blocks
    m[12][6] = 4;
    m[12][11] = 4; m[12][12] = 4;
    m[10][18] = 4;
    m[12][31] = 4; m[12][32] = 4;
    m[12][40] = 4;

    // Bricks
    fillRow(m, 12, 24, 26, 3);
    fillRow(m, 9, 46, 48, 3);
    fillRow(m, 11, 53, 55, 3);

    // Lava pits!
    clearRow(m, 16, 8, 10);
    clearRow(m, 17, 8, 10);
    clearRow(m, 18, 8, 10);
    clearRow(m, 16, 26, 29);
    clearRow(m, 17, 26, 29);
    clearRow(m, 18, 26, 29);
    clearRow(m, 16, 49, 52);
    clearRow(m, 17, 49, 52);
    clearRow(m, 18, 49, 52);

    return m;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function emptyMap(H, W) {
    return Array.from({ length: H }, () => new Array(W).fill(0));
}
function fillRow(m, row, c1, c2, val) {
    for (let c = c1; c < c2; c++) m[row][c] = val;
}
function clearRow(m, row, c1, c2) {
    for (let c = c1; c < c2; c++) m[row][c] = 0;
}
