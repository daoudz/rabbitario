/* ===================================================
   audio.js  –  8-bit Web Audio API sound engine
   =================================================== */
'use strict';

const Audio8 = (() => {
    let ctx = null;
    let muted = false;
    let bgGainNode = null;
    let bgPlaying = false;
    let bgOscillators = [];
    let currentTrack = -1;

    function init() {
        if (ctx) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        bgGainNode = ctx.createGain();
        bgGainNode.gain.value = 0.18;
        bgGainNode.connect(ctx.destination);
    }

    function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

    function setMuted(v) {
        muted = v;
        if (bgGainNode) bgGainNode.gain.value = muted ? 0 : 0.18;
    }
    function toggleMute() { setMuted(!muted); return muted; }
    function isMuted() { return muted; }

    // ---- SFX helpers ----
    function playTone(freq, type, duration, vol = 0.25, startDelay = 0) {
        if (!ctx || muted) return;
        resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, ctx.currentTime + startDelay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + duration + 0.01);
    }

    function playNoise(duration, vol = 0.15) {
        if (!ctx || muted) return;
        resume();
        const bufSize = ctx.sampleRate * duration;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start();
    }

    // ---- SFX ----
    const SFX = {
        jump() { playTone(300, 'square', 0.08, 0.3); playTone(600, 'square', 0.1, 0.15, 0.05); },
        coin() { [880, 1046, 1318].forEach((f, i) => playTone(f, 'square', 0.08, 0.2, i * 0.06)); },
        stomp() { playNoise(0.06, 0.3); playTone(180, 'square', 0.1, 0.2, 0.05); },
        die() { [440, 392, 349, 262].forEach((f, i) => playTone(f, 'square', 0.12, 0.25, i * 0.1)); },
        hit() { playNoise(0.05, 0.35); },
        block() { playTone(300, 'square', 0.07, 0.3); playTone(200, 'square', 0.07, 0.2, 0.06); },
        boss() { [220, 196, 165, 130].forEach((f, i) => playTone(f, 'sawtooth', 0.15, 0.3, i * 0.12)); },
        levelup() { [262, 330, 392, 524].forEach((f, i) => playTone(f, 'square', 0.15, 0.3, i * 0.1)); },
        gameover() { [330, 262, 220, 165].forEach((f, i) => playTone(f, 'square', 0.18, 0.3, i * 0.14)); },
        power() { [262, 330, 392, 523, 659].forEach((f, i) => playTone(f, 'square', 0.1, 0.25, i * 0.07)); },
    };

    // ---- Background Music patterns ----
    // Each level gets a melody pattern  [note(hz), duration(beats)]
    const TRACKS = [
        // Level 1 – bright, upbeat grassland
        {
            tempo: 160,
            melody: [[523, 1], [587, 1], [659, 1], [523, 1], [659, 2], [784, 2], [523, 1], [659, 1], [784, 1], [880, 1], [784, 2], [659, 2],
            [523, 1], [440, 1], [523, 2], [392, 2], [440, 1], [523, 1], [440, 1], [392, 1], [349, 2], [392, 2]],
            bass: [[130, 2], [165, 2], [196, 2], [130, 2], [165, 2], [196, 2], [130, 2], [196, 2]]
        },
        // Level 2 – dark cave / graveyard
        {
            tempo: 140,
            melody: [[220, 1], [196, 1], [220, 2], [165, 1], [196, 2], [220, 1], [196, 1], [165, 1], [147, 1], [165, 2], [196, 2],
            [220, 2], [246, 1], [262, 1], [246, 2], [220, 2]],
            bass: [[110, 2], [98, 2], [110, 2], [82, 2], [110, 2], [98, 2]]
        },
        // Level 3 – boss intense
        {
            tempo: 180,
            melody: [[440, 0.5], [493, 0.5], [440, 0.5], [415, 0.5], [440, 1], [349, 1], [392, 1], [440, 2],
            [523, 0.5], [587, 0.5], [523, 0.5], [493, 0.5], [523, 1], [440, 1], [392, 1], [349, 2]],
            bass: [[110, 1], [130, 1], [110, 1], [98, 1], [110, 1], [130, 1], [147, 1], [110, 1]]
        },
    ];

    let melodyIdx = 0, bassIdx = 0, melodyTimeout, bassTimeout;

    function stopBG() {
        bgOscillators.forEach(o => { try { o.stop(); } catch (e) { } });
        bgOscillators = [];
        clearTimeout(melodyTimeout);
        clearTimeout(bassTimeout);
        bgPlaying = false;
    }

    function playBG(trackIdx) {
        if (!ctx) return;
        resume();
        if (currentTrack === trackIdx && bgPlaying) return;
        stopBG();
        currentTrack = trackIdx;
        bgPlaying = true;
        melodyIdx = 0;
        bassIdx = 0;
        const track = TRACKS[trackIdx % TRACKS.length];
        const beatMs = 60000 / track.tempo;

        function schedMelody() {
            if (!bgPlaying || muted) return;
            const [freq, beats] = track.melody[melodyIdx % track.melody.length];
            const dur = (beats * beatMs) / 1000 * 0.85;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.07, ctx.currentTime);
            gain.gain.setValueAtTime(0.001, ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(bgGainNode);
            osc.start(); osc.stop(ctx.currentTime + dur + 0.02);
            bgOscillators.push(osc);
            melodyIdx++;
            melodyTimeout = setTimeout(schedMelody, beats * beatMs);
        }

        function schedBass() {
            if (!bgPlaying || muted) return;
            const [freq, beats] = track.bass[bassIdx % track.bass.length];
            const dur = (beats * beatMs) / 1000 * 0.8;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.setValueAtTime(0.001, ctx.currentTime + dur);
            osc.connect(gain);
            gain.connect(bgGainNode);
            osc.start(); osc.stop(ctx.currentTime + dur + 0.02);
            bgOscillators.push(osc);
            bassIdx++;
            bassTimeout = setTimeout(schedBass, beats * beatMs);
        }

        schedMelody();
        schedBass();
    }

    return { init, resume, toggleMute, isMuted, setMuted, SFX, playBG, stopBG };
})();
