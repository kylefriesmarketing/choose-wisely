/* ============================================================================
 * narrator.js  -  voiced narration. Off by default; a Settings toggle turns it
 * on. It plays a REAL recorded voice (Sterling, one signature reader) over the
 * game's key moments. Everything else stays silent on purpose: a machine reading
 * the text aloud killed the atmosphere, so there is no browser text-to-speech
 * fallback — only the real voice.
 *
 * Coverage:
 *   - EVERY ending is voiced. An ending id (e.g. END_FED) resolves to
 *     assets/voice/END_<ID>.mp3 automatically — no per-ending bookkeeping.
 *   - A handful of signature NODES get their own clip via CW.VoiceClips below.
 *
 * Voice clips respect the master mute (the 🔊 button / CW.Audio).
 * ========================================================================== */
window.CW = window.CW || {};

/* Signature NODE lines with a real recorded voice (files in assets/voice/).
 * Endings are handled separately (see clipSrc) and do NOT belong here. */
CW.VoiceClips = {
  S03_SHOPKEEPER_WARNING: "s03_warning.wav",   // the shopkeeper's rule
  UNMAKING_ROOM:          "unmaking_room.wav",  // the warm room where the work is done
  // Voiced lines for the player-medium horror mechanics (fixed lines only).
  OY_ARRIVAL:  "OY_ARRIVAL.mp3",  OY_NEWCOMER: "OY_NEWCOMER.mp3", OY_THREE: "OY_THREE.mp3", // The Other You
  SKIM_1:      "SKIM_1.mp3",      SKIM_2:      "SKIM_2.mp3",      SKIM_3:   "SKIM_3.mp3",    // skimming
  HOUR_3AM:    "HOUR_3AM.mp3",    HOUR_LATE:   "HOUR_LATE.mp3",   // the hour
};

CW.Narrator = (function () {
  const GS = () => CW.GameState;
  let clipEl = null; // <audio> for the current voice clip

  function enabled() { return !!GS().getSettings().narration; }
  function muted() { return !!(CW.Audio && CW.Audio.isMuted && CW.Audio.isMuted()); }
  function clipSrc(key) {
    if (!key) return null;
    // Signature node clips (mapped explicitly).
    if (CW.VoiceClips && CW.VoiceClips[key]) return "assets/voice/" + CW.VoiceClips[key];
    // Every ending is voiced: assets/voice/END_<ID>.mp3.
    if (CW.Endings && CW.Endings[key]) return "assets/voice/" + key + ".mp3";
    return null;
  }
  function isVoiced(key) { return !!clipSrc(key); }

  function stop() { if (clipEl) { try { clipEl.pause(); } catch (e) {} clipEl = null; } }

  // Speak this beat if it has a recorded clip; otherwise stay silent.
  // (`text` is accepted for a stable call signature but is not read by a machine.)
  function speak(text, key) {
    stop();
    if (!enabled() || muted()) return;
    const src = clipSrc(key);
    if (!src) return;
    try {
      clipEl = new Audio(src);
      clipEl.volume = 0.95;
      const p = clipEl.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) { /* autoplay blocked or missing file */ }
  }

  function init() { /* nothing to warm up */ }

  return { init, speak, stop, enabled, isVoiced };
})();
