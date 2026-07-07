/* ============================================================================
 * dread.js  -  the descent. As the run goes deeper (and darker), the dread
 * level rises (see GameState.updateDread) and this module warps the whole
 * presentation: a `data-dread` level on <body> drives the CSS (desaturation,
 * red bleed, closing vignette, unstable text, heartbeat) and the audio engine
 * muffles the music under a growing sub-drone and whispers.
 *
 * Dread only ever rises within a run — you cannot climb back out.
 * ========================================================================== */
window.CW = window.CW || {};

CW.Dread = (function () {
  let applied = -1;

  function apply(level) {
    if (level === applied) return;
    applied = level;
    document.body.setAttribute("data-dread", String(level));
    if (CW.Audio && CW.Audio.setDread) CW.Audio.setDread(level);
  }

  function applyHaunt() {
    // Persistent corruption: the shop's memory of you shows on the cast too.
    document.body.setAttribute("data-haunt", String(CW.GameState.hauntLevel()));
  }

  function update(node) {
    const lvl = CW.GameState.updateDread(node);
    apply(lvl);
    applyHaunt();
  }

  function reset() {
    applied = -1;
    apply(0);
    applyHaunt();
  }

  function level() { return applied < 0 ? 0 : applied; }

  return { update, apply, reset, level };
})();
