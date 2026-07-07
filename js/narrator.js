/* ============================================================================
 * narrator.js  -  voiced narration. Off by default; a Settings toggle turns it
 * on. It plays a REAL recorded voice on the game's signature moments (keyed by
 * node/ending id in CW.VoiceClips -> assets/voice/<file>). Everything else stays
 * silent on purpose: a machine reading the text aloud killed the atmosphere, so
 * there is no browser text-to-speech fallback — only the real voice, where we
 * have it. More moments get a voice over time.
 *
 * Voice clips respect the master mute (the 🔊 button / CW.Audio).
 * ========================================================================== */
window.CW = window.CW || {};

/* Signature lines with a real recorded voice, keyed by node/ending id (files in
 * assets/voice/). Unlisted moments are simply not spoken. */
CW.VoiceClips = {
  S03_SHOPKEEPER_WARNING: "s03_warning.wav",       // the shopkeeper's rule
  UNMAKING_ROOM:          "unmaking_room.wav",      // the warm room where the work is done
  END_NEW_STOCK:          "end_new_stock.wav",      // becoming stock
  END_EMPTY_SHELVES:      "end_empty_shelves.wav",  // the capstone
};

CW.Narrator = (function () {
  const GS = () => CW.GameState;
  let clipEl = null; // <audio> for the current voice clip

  function enabled() { return !!GS().getSettings().narration; }
  function muted() { return !!(CW.Audio && CW.Audio.isMuted && CW.Audio.isMuted()); }
  function clipSrc(key) {
    return (key && CW.VoiceClips && CW.VoiceClips[key]) ? "assets/voice/" + CW.VoiceClips[key] : null;
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
