/* ===================================================
   sprites.js  –  8-bit pixel art via canvas drawing
   Sprites are hand-coded pixel arrays (8x8 or 16x16 cells)
   =================================================== */
'use strict';

const Sprites = (() => {
    // Colour palette
    const C = {
        _: null,        // transparent
        W: '#ffffff',   // white
        G: '#c8c8c8',   // light grey
        D: '#888888',   // dark grey
        K: '#2b2b2b',   // near black
        B: '#4499ff',   // sky blue
        P: '#ffaacc',   // pink
        R: '#ff3333',   // red
        O: '#ff9900',   // orange
        Y: '#ffee44',   // yellow
        N: '#aa6622',   // brown
        n: '#774400',   // dark brown
        T: '#22aa44',   // green
        t: '#116622',   // dark green
        U: '#8855ff',   // purple
        u: '#551188',   // dark purple
        L: '#55ddff',   // light blue
        S: '#ff55ff',   // magenta
    };

    // ----  createSprite  helpers ----
    function makeCanvas(w, h, rows, palette) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        const sw = w / rows[0].length;
        const sh = h / rows.length;
        for (let r = 0; r < rows.length; r++) {
            for (let col = 0; col < rows[r].length; col++) {
                const key = rows[r][col];
                const color = palette[key];
                if (!color) continue;
                ctx.fillStyle = color;
                ctx.fillRect(col * sw, r * sh, sw, sh);
            }
        }
        return c;
    }

    // --- RABBIT frames ---
    // 16×16 pixel grid per frame, 2px per pixel → 32×32 canvas
    const RABBIT = {
        idle: makeCanvas(32, 32, [
            '_WWWWWWWWWWWWWW__',
            'WWWWWWWWWWWWWWWW_',
            'WWPWWWWWWWWWWPWW_',
            'WWPPWWWWWWWPPWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWWPPPPPWWWWWW_',
            'WWWWWPWWWPWWWWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWNNWWWNNWWWWW_',
            'WWWNNWWWWWWNWWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WNnnNWWWWWNnnNW__',
            'NnnnnNWWWNnnnnN__',
            'WWWWWWWWWWWWWWW__',
            'WWWWWWWWWWWWWWW__',
        ], { ...C, W: '#fafafa', P: '#ff99bb' }),

        run1: makeCanvas(32, 32, [
            '_WWWWWWWWWWWWWW__',
            'WWWWWWWWWWWWWWWW_',
            'WWPWWWWWWWWWWPWW_',
            'WWPPWWWWWWWPPWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWWPPPPPWWWWWW_',
            'WWWWWPWWWPWWWWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWNNWWWNNWWWWW_',
            'WWWNNWWWWWWNWWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WNnnNWWWWWWWWWW__',
            'NnnnnNWWNnnNWWW__',
            'WWWWWWNNNNNWWWW__',
            'WWWWWWWWWWWWWWW__',
        ], { ...C, W: '#fafafa', P: '#ff99bb' }),

        run2: makeCanvas(32, 32, [
            '_WWWWWWWWWWWWWW__',
            'WWWWWWWWWWWWWWWW_',
            'WWPWWWWWWWWWWPWW_',
            'WWPPWWWWWWWPPWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWWPPPPPWWWWWW_',
            'WWWWWPWWWPWWWWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWNNWWWNNWWWWW_',
            'WWWNNWWWWWWNWWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WNnnNWWWWWNnnNW__',
            'WWWWWWWWNNNNNWW__',
            'WWWWNNNNNWWWWWW__',
            'WWWWWWWWWWWWWWW__',
        ], { ...C, W: '#fafafa', P: '#ff99bb' }),

        jump: makeCanvas(32, 32, [
            '_WWWWWWWWWWWWWW__',
            'WWWWWWWWWWWWWWWW_',
            'WWPWWWWWWWWWWPWW_',
            'WWPPWWWWWWWPPWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWWPPPPPWWWWWW_',
            'WWWWWPWWWPWWWWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWWNNWWNNWWWWW_',
            'WWWNNNWWWWWNNNWW_',
            'WWWNNNNNNNNNNNWW_',
            'WWWNNWWWWWWWNNWW_',
            'WWWnnwwwwwwwnnWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWWWWWWWWWWWWW_',
        ], { ...C, W: '#fafafa', P: '#ff99bb' }),

        die: makeCanvas(32, 32, [
            'WWWWWWWWWWWWWWWW_',
            'WPWWWWWWWWWWWPWW_',
            'WPPWWWWWWWWWPPWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWWPPPPPWWWWWW_',
            'WWWWWPWWWPWWWWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWWWWWWWWWWWWW_',
            'NNNWWWWWWWWWWWWW_',
            'WWNNNwwwwwwwwwww_',
            'WWWNNNNnnnnnwwww_',
            'WWWnnnnwwwwwwwww_',
            'WWWWWWwwwwwwwwww_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWWWWWWWWWWWWW_',
            'WWWWWWWWWWWWWWWW_',
        ], { ...C, W: '#fafafa', P: '#ff99bb' }),
    };

    // --- ZOMBIE (12×16 grid → 24×32 canvas) ---
    const ZOMBIE_FRAMES = {
        walk1: makeCanvas(24, 32, [
            '__GGGGGGGG___',
            '_GGGGGGGGGGG_',
            '_GtGGGGGGtGG_',
            '_GttGGGGttGG_',
            '_GGGGttGGGGG_', // mouth
            '_GGGGGGGGGGG_',
            'TTTTTTTTTTTTT',
            'TtTTTTTTTtTTT',
            'TTTTTTTTTTTTT',
            '_TTTTTTTTTTT_',
            '_TTTTTTTTTTT_',
            '__TTTTTTTTTT_',
            '__NNTTTTTNN__',
            '__NNn___nNN__',
            '__NNN___NNN__',
            '_________________',
        ], C),
        walk2: makeCanvas(24, 32, [
            '__GGGGGGGG___',
            '_GGGGGGGGGGG_',
            '_GtGGGGGGtGG_',
            '_GttGGGGttGG_',
            '_GGGGttGGGGG_',
            '_GGGGGGGGGGG_',
            'TTTTTTTTTTTTT',
            'TtTTTTTTTtTTT',
            'TTTTTTTTTTTTT',
            '_TTTTTTTTTTT_',
            '_TTTTTTTTTTT_',
            '__TTTTTTTTTT_',
            '__NNTTTTTNN__',
            '__NNn___NNN__',
            '__NNN___nNN__',
            '_________________',
        ], C),
        die: makeCanvas(24, 32, [
            '_____________',
            '_____________',
            '_____________',
            '_____________',
            '__GGGGGGGG___',
            '_GGGGGGGGGGG_',
            '_GtGGGGGGtGG_',
            '_GttGGGGttGG_',
            '_GGGGttGGGGG_',
            'NNTTTTTTTTTNN',
            'NNtTTTTTTtTNN',
            'NNNNNNNNNNNNN',
            '_NNNNNNNNNNN_',
            '_____________',
            '_____________',
            '_____________',
        ], C),
    };

    // --- SKELETON ---
    const SKELETON_FRAMES = {
        walk1: makeCanvas(24, 32, [
            '__WWWWWWWW___',
            '_WWWWWWWWWWW_',
            '_WDWWWWWWDWW_',
            '_WWWWWWWWWWW_',
            '_WWWWDDWWWWW_',
            '_WWWWWWWWWWW_',
            '_DDDDDDDDDDD_',
            '_DWWWWWWWWWD_',
            '_DDDDDDDDDDD_',
            '__DDDDDDDDDD_',
            '__DDDDDDDDD__',
            '__DDDDDDDDD__',
            '__DDWWWWWDD__',
            '__DWW___WWD__',
            '__DWW___WWD__',
            '_________________',
        ], C),
        walk2: makeCanvas(24, 32, [
            '__WWWWWWWW___',
            '_WWWWWWWWWWW_',
            '_WDWWWWWWDWW_',
            '_WWWWWWWWWWW_',
            '_WWWWDDWWWWW_',
            '_WWWWWWWWWWW_',
            '_DDDDDDDDDDD_',
            '_DWWWWWWWWWD_',
            '_DDDDDDDDDDD_',
            '__DDDDDDDDDD_',
            '__DDDDDDDDD__',
            '__DDDDDDDDD__',
            '__DDWWWWWDD__',
            '__DWW___WDD__',
            '__DDD___WWD__',
            '_________________',
        ], C),
        die: makeCanvas(24, 32, [
            '_____________',
            '_____________',
            '_____________',
            '_____________',
            '__WWWWWWWW___',
            '_WWWWWWWWWWW_',
            '_WDWWWWWWDWW_',
            '_WWWWWWWWWWW_',
            '_DDDDDDDDDDD_',
            '_DWWWWWWWWWD_',
            '_DDDDDDDDDDD_',
            '__DDDDDDDDD__',
            '_____________',
            '_____________',
            '_____________',
            '_____________',
        ], C),
    };

    // --- DRAGON (flying) ---
    const DRAGON_FRAMES = {
        fly1: makeCanvas(40, 24, [
            'RRRR____RRRR____RRRR____RRRR____RRRR',
            'RRRRRR__RRRRRR__RRRRRR__RRRRRR__RRRR',
            'RuRRRRRRRRRRRRRRRRRRRRRRRRRRuRRRRRRR',
            'RuuRRRRRRRRRRRRRRRRRRRRRRRuuRRRRRRRR',
            'RRRRRYYYRRRRRRRRRRRRRYYYRRRRRRRRRRRR',
            'RRRRRYYYYRRRRRRRRRRRRYYYRRRRRRRRRRRRR',
            'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
        ], C),
        fly2: makeCanvas(40, 24, [
            '____________RRRRRRRRRRRR____________',
            '___________RRRRRRRRRRRRRR___________',
            'RuRRRRRRRRRRRRRRRRRRRRRRRRRRRuRRRRR',
            'RuuRRRRRRRRRRRRRRRRRRRRRRRRRuuRRRRR',
            'RRRRRYYYRRRRRRRRRRRRRYYYRRRRRRRRRR_',
            'RRRRRYYYYRRRRRRRRRRRRYYYRRRRRRRRRRR_',
            'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR_',
        ], C),
    };

    // --- BIG SPIDER BOSS (32×32) ---
    const BOSS_FRAMES = {
        idle: makeCanvas(64, 48, [
            '________________________________',
            '____KKKKKKKKKKKKKKKKKKKKKK______',
            '___KuuuuuuuuuuuuuuuuuuuuuuK_____',
            '___KuuRRuuuuuuuuuuuuRRuuuuK_____',
            '___KuuRRuuuuuuuuuuuuRRuuuuK_____',
            '___KuuuuuuuWWWWWuuuuuuuuuuK_____',
            '___KuuuuuuuWKKKWuuuuuuuuuuK_____',
            '___KKKKKKKKKKKKKKKKKKKKKKkK_____',
            'KKKKUUUUUUUUUUUUUUUUUUUUUUKKKK__',
            'KuKKUUUUUUUUUUUUUUUUUUUUUUKKuK__',
            'KuuKKUUUUUUUUUUUUUUUUUUUUKKuuK__',
            'KKuuKKKKKKKKKKKKKKKKKKKKKKuuKK__',
            '__KKKuuuuuuuuuuuuuuuuuuuuKKK____',
            '____KKKuuuuuuuuuuuuuuuuKKK______',
            '__________________________________',
            '__________________________________',
        ], { ...C, u: '#6600cc', U: '#440088', K: '#110022', R: '#ff0000' }),
        walk: makeCanvas(64, 48, [
            '________________________________',
            '____KKKKKKKKKKKKKKKKKKKKKK______',
            '___KuuuuuuuuuuuuuuuuuuuuuuK_____',
            '___KuuRRuuuuuuuuuuuuRRuuuuK_____',
            '___KuuRRuuuuuuuuuuuuRRuuuuK_____',
            '___KuuuuuuuWWWWWuuuuuuuuuuK_____',
            '___KuuuuuuuWKKKWuuuuuuuuuuK_____',
            '___KKKKKKKKKKKKKKKKKKKKKKkK_____',
            'KKKKUUUUUUUUUUUUUUUUUUUUUUKKKK__',
            'KuKKUUUUUUUUUUUUUUUUUUUUUUKKuK__',
            'KuuKKUUUUUUUUUUUUUUUUUUUUKKuuK__',
            'KKuuKKKKKKKKKKKKKKKKKKKKKKuuKK__',
            '__KKKuuuuuuuuuuuuuuuuuuuuKKK____',
            '____KKKuuuuuuuuuuuuuuuuKKK______',
            '___KKuuKKKuuKKKuuKKuuKKuuKK_____',
            '__KKuuuKKuuuKuuuuKuuuKuuuuKK____',
        ], { ...C, u: '#6600cc', U: '#440088', K: '#110022', R: '#ff0000' }),
    };

    // --- CARROT collectible ---
    const CARROT = makeCanvas(16, 20, [
        '___TTT___',
        '__TtTtT__',
        '__TtTtT__',
        '___TTT___',
        '___OOO___',
        '__OOOOO__',
        '_OOOOOOO_',
        '_OOOOOOO_',
        '__OOOOO__',
        '__OOOOO__',
        '___OOO___',
    ], C);

    // --- COIN ---
    const COIN = makeCanvas(16, 16, [
        '__YYYY___',
        '_YYYYYY__',
        '_YNYNYYY_',
        'YYYYNYYYY',
        'YYYNYYYY_',
        '_YYYYYYY_',
        '__YYYY___',
    ], { ...C, N: '#aa8800' });

    // --- HEART (life) ---
    const HEART = makeCanvas(16, 14, [
        '_RR__RR__',
        'RRRRRRRRR',
        'RRRRRRRRR',
        '_RRRRRRR_',
        '__RRRRRR_',
        '___RRRR__',
        '____RR___',
        '_________',
    ], C);

    // --- QUESTION BLOCK (16×16) ---
    const QBLOCK = makeCanvas(16, 16, [
        'OOOOOOOOO',
        'OWWWWWWWO',
        'OWWnnnWWO',
        'OWWnWWnWO', // ?
        'OWWWWnWWO',
        'OWWWnnWWO',
        'OWWWnnWWO',
        'OWWWWWnWO',
        'OWWWnnWWO',
        'OWWWWWWWO',
        'OOOnnOOOO',
        'OWWWWWWWO',
        'OWWWWWWWO',
        'OOOOOOOOO',
        '_________',
        '_________',
    ], C);

    // --- BRICK BLOCK ---
    const BRICK = makeCanvas(16, 16, [
        'NNNNNNNNNN',
        'NnNNNNNnNN',
        'NnNNNNNnNN',
        'NNNNNNNNNN',
        'NNNNNNNNN_',
        'NNnNNNnNN_',
        'NNnNNNnNN_',
        'NNNNNNNNN_',
        'NNNNNNNNNN',
        'NnNNNNNnNN',
        'NnNNNNNnNN',
        'NNNNNNNNNN',
        '_________',
        '_________',
        '_________',
        '_________',
    ], C);

    // --- MUSHROOM power-up ---
    const MUSHROOM = makeCanvas(16, 18, [
        '__RRRR___',
        '_RRRRRRR_',
        'RRWRRRWRR',
        'RRWRRRWRR',
        'RRRRRRRRR',
        '_RRRRRRR_',
        '__RRRR___',
        '_NNNNNNN_',
        '_NWWWWWN_',
        '_NNNNNNN_',
    ], C);

    // flip helper (mirror horizontally)
    function flipH(src) {
        const c = document.createElement('canvas');
        c.width = src.width; c.height = src.height;
        const ctx = c.getContext('2d');
        ctx.translate(c.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(src, 0, 0);
        return c;
    }

    // Build flipped versions
    const RABBIT_LEFT = {};
    for (const k of Object.keys(RABBIT)) RABBIT_LEFT[k] = flipH(RABBIT[k]);

    return {
        RABBIT, RABBIT_LEFT,
        ZOMBIE: ZOMBIE_FRAMES,
        SKELETON: SKELETON_FRAMES,
        DRAGON: DRAGON_FRAMES,
        BOSS: BOSS_FRAMES,
        CARROT, COIN, HEART, QBLOCK, BRICK, MUSHROOM,
    };
})();
