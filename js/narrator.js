/* ============================================================================
 * narrator.js  -  read-aloud narration. Off by default; a Settings toggle turns
 * it on. For most text it uses the browser's built-in speech (Web Speech API) —
 * free, offline, and it reads the real on-screen words including your name, the
 * absence count, everything. It is horror-tuned: the voice slows and drops as
 * the dread deepens.
 *
 * For a handful of SIGNATURE lines (keyed by node/ending id in CW.VoiceClips) it
 * plays a real recorded voice clip instead — assets/voice/<file>. If a clip is
 * missing it simply falls back to the browser voice, so the game never breaks
 * for want of an audio file.
 * ========================================================================== */
window.CW = window.CW || {};

/* Signature lines with a real recorded voice, keyed by node/ending id (files in
 * assets/voice/). Anything not listed here is read by the browser voice. */
CW.VoiceClips = {
  S03_SHOPKEEPER_WARNING: "s03_warning.wav",   // the shopkeeper's rule
  UNMAKING_ROOM:          "unmaking_room.wav",  // the warm room where the work is done
  END_NEW_STOCK:          "end_new_stock.wav",  // becoming stock
  END_EMPTY_SHELVES:      "end_empty_shelves.wav", // the capstone
};

CW.Narrator = (function () {
  const GS = () => CW.GameState;
  let clipEl = null;     // <audio> for AI voice clips
  let picked = null;     // chosen browser voice
  const hasTTS = typeof window !== "undefined" && "speechSynthesis" in window;

  function enabled() { return !!GS().getSettings().narration; }

  function pickVoice() {
    if (!hasTTS) return null;
    const list = speechSynthesis.getVoices() || [];
    if (!list.length) return null;
    // Prefer a deeper English voice for the storybook narrator; fall back sanely.
    picked =
      list.find((v) => /^en/i.test(v.lang) && /(daniel|david|george|fred|arthur|male|thomas|oliver)/i.test(v.name)) ||
      list.find((v) => /^en(-|_)?(GB|AU)/i.test(v.lang)) ||
      list.find((v) => /^en/i.test(v.lang)) ||
      list[0];
    return picked;
  }

  function ttsSpeak(text) {
    if (!hasTTS || !text) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = picked || pickVoice();
      if (v) u.voice = v;
      const dread = (CW.Dread && CW.Dread.level && CW.Dread.level()) || 0;
      u.rate = Math.max(0.62, 0.96 - dread * 0.08);  // slows as it darkens
      u.pitch = Math.max(0.5, 1.0 - dread * 0.1);     // and lowers
      u.volume = 0.92;
      speechSynthesis.speak(u);
    } catch (e) { /* speech not available */ }
  }

  function clipSrc(key) {
    return (key && CW.VoiceClips && CW.VoiceClips[key]) ? "assets/voice/" + CW.VoiceClips[key] : null;
  }
  function playClip(src) {
    stopClip();
    try {
      clipEl = new Audio(src);
      clipEl.volume = 0.95;
      const p = clipEl.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) { /* autoplay blocked or missing */ }
  }
  function stopClip() { if (clipEl) { try { clipEl.pause(); } catch (e) {} clipEl = null; } }

  // Read `text` aloud; if a signature clip exists for `key`, play that instead.
  function speak(text, key) {
    stop();
    if (!enabled()) return;
    const src = clipSrc(key);
    if (src) playClip(src);
    else ttsSpeak(text);
  }
  function stop() {
    if (hasTTS) { try { speechSynthesis.cancel(); } catch (e) {} }
    stopClip();
  }

  function init() {
    if (hasTTS) {
      pickVoice();
      speechSynthesis.onvoiceschanged = pickVoice; // voices load async
    }
  }

  return { init, speak, stop, enabled, pickVoice, hasTTS: hasTTS };
})();
