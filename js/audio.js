/* ============================================================================
 * audio.js  -  the sound engine. Everything is synthesized with WebAudio, so
 * there are zero audio files. Layers, all through one master gain (the mute
 * button silences everything):
 *   - SFX        short UI/feedback tones + composed ending stings
 *   - Music      a soft pad + a COMPOSED melodic leitmotif per route/scene,
 *                played by a look-ahead scheduler. A warm "June's theme" carries
 *                the prologue/menu.
 *   - Ambience   filtered-noise texture per scene
 *   - Dread      a growing sub-drone + whispers + heartbeat as the descent deepens
 *
 * The music is LIVING: every note reads the current dread level and the bracelet
 * (bond), so as the friendship frays and the run sinks, the melody slows,
 * detunes, drops notes, and comes apart.
 * ========================================================================== */
window.CW = window.CW || {};

CW.Audio = (function () {
  let ctx = null, master = null, sfxBus = null, musicBus = null;
  let dreadFilter = null, dreadDroneGain = null, dreadOscs = null;
  let dreadLevelState = 0, whisperTimer = null, heartTimer = null;
  let noiseBuf = null, muted = false;
  const MASTER_VOL = 0.6;
  const BASE_BEAT = 0.42; // seconds per beat at rest

  function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  /* ---- leitmotifs: [midiNote, beats] ------------------------------------ */
  const THEMES = {
    june:    [[67,1],[69,1],[72,2],[69,1],[67,1],[64,2],[62,1],[60,1],[62,1],[64,3]],
    shop:    [[69,1],[74,1],[77,1],[76,1],[74,1],[69,2],[72,1],[74,3]],
    teddy:   [[69,1],[72,1],[71,1],[69,1],[67,1],[64,1],[69,3]],
    candle:  [[74,1],[75,1],[74,1],[77,1],[76,2],[74,2],[72,1],[74,2]],
    balloon: [[74,1],[79,1],[81,1],[83,1],[81,1],[79,1],[74,2],[76,2]],
    dragon:  [[64,0.5],[64,0.5],[67,1],[64,1],[71,1],[69,0.5],[67,0.5],[64,2]],
    party:   [[72,1],[74,1],[76,1],[79,1],[76,1],[72,1],[74,1],[72,3]],
    secret:  [[72,1.5],[74,1.5],[76,1.5],[78,1.5],[80,2],[76,3]],
  };
  const CUES = {
    street_theme:  { theme: "june",    chord: [130.81, 196.00, 261.63], amb: "rain",    vol: 0.5 },
    shop_theme:    { theme: "shop",    chord: [146.83, 220.00, 293.66], amb: "room",    vol: 0.55 },
    teddy_theme:   { theme: "teddy",   chord: [110.00, 164.81, 220.00], amb: "room",    vol: 0.5 },
    candle_theme:  { theme: "candle",  chord: [146.83, 220.00, 293.66], amb: "crackle", vol: 0.5 },
    balloon_theme: { theme: "balloon", chord: [196.00, 293.66, 392.00], amb: "wind",    vol: 0.5 },
    dragon_theme:  { theme: "dragon",  chord: [82.41, 123.47, 164.81],  amb: "tick",    vol: 0.5 },
    party_theme:   { theme: "party",   chord: [130.81, 196.00, 261.63], amb: "murmur",  vol: 0.55 },
    secret_theme:  { theme: "secret",  chord: [138.59, 207.65, 277.18], amb: "shimmer", vol: 0.45 },
    menu_theme:    { theme: "june",    chord: [130.81, 196.00, 261.63], amb: "room",    vol: 0.5 },
  };

  /* ---- how dread + a frayed bracelet warp the music --------------------- */
  const DREAD_BEAT = [1.0, 1.04, 1.12, 1.24, 1.42];   // slower as it deepens
  const DREAD_DETUNE = [0, 3, 9, 18, 34];             // cents
  const DREAD_DROP = [0, 0, 0.06, 0.16, 0.34];        // chance a note fails to sound
  const DREAD_JITTER = [0, 1, 3, 8, 18];              // pitch instability
  function computeWarp(dread, bond) {
    dread = Math.max(0, Math.min(4, dread | 0));
    const fray = Math.max(0, Math.min(1, (6 - bond) / 6)); // 0 whole .. 1 snapped
    return {
      beatMul: DREAD_BEAT[dread] + fray * 0.14,
      detune: DREAD_DETUNE[dread] + fray * 22,
      dropout: Math.min(0.5, DREAD_DROP[dread] + fray * 0.12),
      jitter: DREAD_JITTER[dread] + fray * 10,
    };
  }
  function currentBond() {
    try { return CW.GameState.getRun() ? CW.GameState.bondValue() : 6; } catch (e) { return 6; }
  }

  /* ---- context / buses -------------------------------------------------- */
  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = null; return null; }
      master = ctx.createGain(); master.gain.value = muted ? 0 : MASTER_VOL; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
      dreadFilter = ctx.createBiquadFilter(); dreadFilter.type = "lowpass"; dreadFilter.frequency.value = 20000; dreadFilter.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.5; musicBus.connect(dreadFilter);
      dreadDroneGain = ctx.createGain(); dreadDroneGain.gain.value = 0.0001; dreadDroneGain.connect(master);
      dreadOscs = [55, 55.4].map(function (f) { const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f; o.connect(dreadDroneGain); o.start(); return o; });
      applyDreadAudio();
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function noise() {
    if (noiseBuf) return noiseBuf;
    const a = ac(); if (!a) return null;
    noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  function musicOn() {
    try { return CW.GameState.getSettings().musicOn !== false; } catch (e) { return true; }
  }

  /* ---- SFX + stings ----------------------------------------------------- */
  function tone(opts) {
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = opts.type || "sine";
    const t0 = a.currentTime;
    o.frequency.setValueAtTime(opts.freq, t0);
    if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + opts.dur);
    const peak = opts.gain == null ? 0.15 : opts.gain;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    o.connect(g).connect(sfxBus);
    o.start(t0); o.stop(t0 + opts.dur + 0.02);
  }
  function seq(notes) { let d = 0; for (const n of notes) { setTimeout(() => tone(n), d); d += n.step || 90; } }
  const SFX = {
    click:  () => tone({ freq: 520, dur: 0.06, type: "triangle", gain: 0.08 }),
    hover:  () => tone({ freq: 660, dur: 0.03, type: "sine", gain: 0.04 }),
    choose: () => seq([{ freq: 440, dur: 0.08, type: "triangle", step: 70 }, { freq: 660, dur: 0.1, type: "triangle" }]),
    gain:   () => seq([{ freq: 880, dur: 0.08, type: "sine", step: 60 }, { freq: 1320, dur: 0.12, type: "sine" }]),
    lose:   () => tone({ freq: 200, dur: 0.18, type: "square", gain: 0.09, slideTo: 90 }),
    mend:   () => seq([{ freq: 587, dur: 0.1, type: "sine", gain: 0.07, step: 80 }, { freq: 880, dur: 0.16, type: "sine", gain: 0.07 }]),
    fray:   () => tone({ freq: 330, dur: 0.16, type: "triangle", gain: 0.08, slideTo: 160 }),
    locked: () => tone({ freq: 150, dur: 0.12, type: "sawtooth", gain: 0.06, slideTo: 110 }),
    secret: () => seq([{ freq: 300, dur: 0.5, type: "sine", gain: 0.06, slideTo: 900, step: 120 }, { freq: 1200, dur: 0.6, type: "sine", gain: 0.05, slideTo: 400 }]),
  };
  function play(name) { const fn = SFX[name]; if (fn) fn(); }

  // Composed ending stings ([midi, beats, type?]).
  const STINGS = {
    june:      [[67,1],[72,1],[76,2],[79,3]],
    good:      [[60,1],[64,1],[67,1],[72,2]],
    bad:       [[62,1,"sawtooth"],[59,1,"sawtooth"],[55,2,"sawtooth"],[50,3,"sawtooth"]],
    funny:     [[72,0.5,"square"],[76,0.5,"square"],[74,0.5,"square"],[79,0.5,"square"],[67,1,"square"]],
    nightmare: [[48,2,"sawtooth"],[49,1,"sawtooth"],[47,4,"sawtooth"]],
    true:      [[60,1],[67,1],[72,1],[76,1],[79,3]],
    secret:    [[62,0.5],[69,0.5],[76,0.5],[83,2]],
  };
  const WARM_ENDINGS = { END_WHOLE_AGAIN: 1, END_JUST_CAME: 1, END_TRUE: 1, END_T_GOOD: 1, END_C_GOOD: 1, END_B_GOOD: 1, END_D_GOOD: 1 };
  function stingNote(f, dur, when, type) {
    const a = ctx; const o = a.createOscillator(), g = a.createGain();
    o.type = type || "triangle"; o.frequency.setValueAtTime(f, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.13, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(sfxBus); o.start(when); o.stop(when + dur + 0.05);
  }
  function playEndSting(category, endId) {
    const a = ac(); if (!a || muted) return;
    let s;
    if (WARM_ENDINGS[endId]) s = STINGS.june;
    else if (category === "Bad" || category === "Cursed") s = STINGS.bad;
    else if (category === "Funny" || category === "Action") s = STINGS.funny;
    else if (category === "Nightmare") s = STINGS.nightmare;
    else if (category === "True") s = STINGS.true;
    else if (category === "Secret") s = STINGS.secret;
    else s = STINGS.good;
    if (musicBus) musicBus.gain.setTargetAtTime(0.1, a.currentTime, 0.3); // duck the bed
    let t = a.currentTime + 0.05; const beat = 0.3;
    s.forEach(function (n) { stingNote(freq(n[0]), n[1] * beat * 0.95, t, n[2]); t += n[1] * beat; });
    setTimeout(function () { if (musicBus) musicBus.gain.setTargetAtTime(0.5, ctx.currentTime, 1.5); }, 2500);
  }

  /* ---- pad + melody scheduler ------------------------------------------- */
  let padGain = null, padOscs = [], currentCue = null, currentTheme = "june";
  let running = false, schedulerTimer = null, nextNoteTime = 0, beatIndex = 0;
  const LOOKAHEAD = 0.12, TICK = 25;

  function setPadChord(chord, vol) {
    const a = ac(); if (!a) return;
    if (!padGain) {
      padGain = a.createGain(); padGain.gain.value = 0.0001;
      const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 850;
      padGain.connect(lp).connect(musicBus);
    }
    const t = a.currentTime;
    padOscs.forEach(function (o) { try { o.stop(t + 1.3); } catch (e) {} });
    padGain.gain.cancelScheduledValues(t);
    padGain.gain.setTargetAtTime(musicOn() ? vol * 0.16 : 0.0001, t, 0.6);
    padOscs = [];
    chord.forEach(function (f) {
      const o = a.createOscillator(); o.type = "sine"; o.frequency.value = f;
      const d = a.createOscillator(); d.type = "sine"; d.frequency.value = f * 1.004;
      o.connect(padGain); d.connect(padGain); o.start(); d.start();
      padOscs.push(o, d);
    });
  }

  function melodyNote(f, dur, when) {
    const a = ctx;
    const o = a.createOscillator(), g = a.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(f, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.1, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(musicBus); o.start(when); o.stop(when + dur + 0.05);
    const o2 = a.createOscillator(), g2 = a.createGain();
    o2.type = "sine"; o2.frequency.setValueAtTime(f * 2, when);
    g2.gain.setValueAtTime(0.0001, when);
    g2.gain.exponentialRampToValueAtTime(0.035, when + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, when + dur * 0.7);
    o2.connect(g2).connect(musicBus); o2.start(when); o2.stop(when + dur + 0.05);
  }

  function scheduleNote(when) {
    const theme = THEMES[currentTheme] || THEMES.june;
    const step = theme[beatIndex % theme.length];
    const w = computeWarp(dreadLevelState, currentBond());
    const beatDur = BASE_BEAT * w.beatMul;
    const dur = step[1] * beatDur;
    if (musicOn() && Math.random() >= w.dropout) {
      const cents = w.detune + (Math.random() * 2 - 1) * w.jitter;
      melodyNote(freq(step[0]) * Math.pow(2, cents / 1200), dur * 0.92, when);
    }
    nextNoteTime = when + dur;
    beatIndex = (beatIndex + 1) % theme.length;
  }
  function schedulerLoop() {
    if (!running) return;
    const a = ac();
    if (a) { while (nextNoteTime < a.currentTime + LOOKAHEAD) scheduleNote(nextNoteTime); }
    schedulerTimer = setTimeout(schedulerLoop, TICK);
  }
  function startScheduler() {
    const a = ac(); if (!a || running) return;
    running = true; nextNoteTime = a.currentTime + 0.15; schedulerLoop();
  }
  function stopScheduler() { running = false; clearTimeout(schedulerTimer); schedulerTimer = null; }

  /* ---- ambience --------------------------------------------------------- */
  let currentAmb = null, ambType = null;
  function setAmbience(type) {
    if (type === ambType) return;
    ambType = type;
    if (currentAmb) { currentAmb.stop(); currentAmb = null; }
    currentAmb = makeAmbience(type, musicBus);
  }
  function makeAmbience(type, out) {
    const a = ac(); if (!a) return null;
    const nodes = [];
    function src() { const s = a.createBufferSource(); s.buffer = noise(); s.loop = true; return s; }
    if (type === "rain" || type === "shimmer") {
      const s = src(), f = a.createBiquadFilter(), g = a.createGain();
      f.type = "highpass"; f.frequency.value = type === "rain" ? 1400 : 3000;
      g.gain.value = musicOn() ? (type === "rain" ? 0.05 : 0.03) : 0;
      s.connect(f).connect(g).connect(out); s.start(); nodes.push(s, f, g);
    } else if (type === "wind") {
      const s = src(), f = a.createBiquadFilter(), g = a.createGain(), lfo = a.createOscillator(), lg = a.createGain();
      f.type = "lowpass"; f.frequency.value = 500; g.gain.value = musicOn() ? 0.045 : 0;
      lfo.frequency.value = 0.12; lg.gain.value = 0.03; lfo.connect(lg).connect(g.gain);
      s.connect(f).connect(g).connect(out); s.start(); lfo.start(); nodes.push(s, f, g, lfo, lg);
    } else if (type === "murmur" || type === "room") {
      const s = src(), f = a.createBiquadFilter(), g = a.createGain();
      f.type = "bandpass"; f.frequency.value = type === "murmur" ? 500 : 250; f.Q.value = 0.6;
      g.gain.value = musicOn() ? (type === "murmur" ? 0.035 : 0.02) : 0;
      s.connect(f).connect(g).connect(out); s.start(); nodes.push(s, f, g);
    } else if (type === "tick" || type === "crackle") {
      const g = a.createGain(); g.gain.value = 0.5; g.connect(out); nodes.push(g);
      const state = { on: true, timer: null };
      const tickIt = () => {
        if (!state.on) return;
        if (musicOn() && !muted) {
          const o = a.createOscillator(), eg = a.createGain(), t = a.currentTime;
          o.type = type === "tick" ? "square" : "triangle";
          o.frequency.value = type === "tick" ? 2000 : 320 + Math.random() * 400;
          eg.gain.setValueAtTime(type === "tick" ? 0.05 : 0.04, t);
          eg.gain.exponentialRampToValueAtTime(0.0001, t + (type === "tick" ? 0.04 : 0.08));
          o.connect(eg).connect(g); o.start(t); o.stop(t + 0.1);
        }
        state.timer = setTimeout(tickIt, type === "tick" ? 620 : 300 + Math.random() * 900);
      };
      tickIt();
      return { nodes, stop: () => { state.on = false; clearTimeout(state.timer); } };
    }
    return { nodes, stop: () => nodes.forEach((n) => { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} }) };
  }

  /* ---- dread audio ------------------------------------------------------ */
  function whisper() {
    if (!ac() || muted || !musicOn()) return;
    const a = ctx, t = a.currentTime;
    const s = a.createBufferSource(); s.buffer = noise();
    const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 700 + Math.random() * 900; f.Q.value = 4;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + 1.8);
  }
  function heartbeat() {
    if (!ac() || muted || !musicOn()) return;
    const a = ctx;
    [0, 0.28].forEach(function (off) {
      const t = a.currentTime + off, o = a.createOscillator(), g = a.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.18);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(off ? 0.09 : 0.13, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.3);
    });
  }
  function applyDreadAudio() {
    if (!dreadFilter || !ctx) return;
    const t = ctx.currentTime, on = musicOn(), lvl = dreadLevelState;
    dreadFilter.frequency.setTargetAtTime([20000, 9000, 4500, 2200, 1300][lvl] || 20000, t, 0.5);
    const dg = on ? ([0, 0.02, 0.045, 0.08, 0.13][lvl] || 0) : 0;
    if (dreadDroneGain) dreadDroneGain.gain.setTargetAtTime(Math.max(0.0001, dg), t, 0.6);
    clearInterval(whisperTimer); whisperTimer = null;
    clearInterval(heartTimer); heartTimer = null;
    if (on && lvl >= 3) whisperTimer = setInterval(whisper, lvl >= 4 ? 3800 : 6000);
    if (on && lvl >= 4) heartTimer = setInterval(heartbeat, 1500);
  }
  function setDread(level) { dreadLevelState = level; if (ac()) applyDreadAudio(); }

  /* ---- public music control -------------------------------------------- */
  function playCue(cue) {
    if (!cue) return;
    ac();
    const same = cue === currentCue;
    currentCue = cue;
    const p = CUES[cue] || CUES.shop_theme;
    currentTheme = p.theme;
    if (!same) beatIndex = 0;
    setPadChord(p.chord, p.vol);
    setAmbience(p.amb);
    if (musicOn()) startScheduler(); else stopMusic();
    applyDreadAudio();
  }
  function stopMusic() {
    stopScheduler();
    if (padGain && ctx) padGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    if (currentAmb) { currentAmb.stop(); currentAmb = null; ambType = null; }
  }
  function refreshMusic() {
    if (!musicOn()) { stopMusic(); applyDreadAudio(); return; }
    let cue = currentCue;
    if (!cue) { try { const n = CW.StoryEngine.currentNode(); cue = n ? n.musicCue : "menu_theme"; } catch (e) { cue = "menu_theme"; } }
    playCue(cue);
    applyDreadAudio();
  }

  /* ---- master mute + state --------------------------------------------- */
  function setMuted(m) { muted = m; if (master && ctx) master.gain.setTargetAtTime(m ? 0 : MASTER_VOL, ctx.currentTime, 0.02); }
  function isMuted() { return muted; }
  function state() {
    return {
      hasCtx: !!ctx, ctxState: ctx ? ctx.state : null, currentCue: currentCue, theme: currentTheme,
      running: running, muted: muted, musicOn: musicOn(), dread: dreadLevelState, bond: currentBond(),
      warp: computeWarp(dreadLevelState, currentBond()),
    };
  }

  return { play, playCue, stopMusic, refreshMusic, setDread, playEndSting, setMuted, isMuted, state, _themes: THEMES, _cues: CUES, _warp: computeWarp };
})();
