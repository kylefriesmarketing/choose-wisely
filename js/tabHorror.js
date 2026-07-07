/* ============================================================================
 * tabHorror.js  -  the shop knows you're gone. When you switch away from the
 * tab (or minimise it), the browser title changes to something that should not
 * be able to reach you there — escalating with how well the shop remembers you
 * (haunt), and reaching out to true newcomers only once they've been wiped and
 * come back. Restores the real title the moment you return.
 *
 * Pure browser behaviour (document.title); no story state is touched. Respects
 * reduce-motion by not cycling. CW.GameState.noteVisit() supplies the memory.
 * ========================================================================== */
window.CW = window.CW || {};

CW.TabHorror = (function () {
  const GS = () => CW.GameState;
  let realTitle = document.title;
  let flickerTimer = null;
  let hidden = false;

  function heroName() { const s = GS().getSettings(); return ((s.heroName || "Milo").trim()) || "Milo"; }

  // What the tab says while you are away. null = leave the title alone.
  function awayTitle() {
    const h = GS().hauntLevel();
    const name = heroName();
    if (h <= 0) return GS().wasWiped() ? "come back — I remember you" : null; // spare true newcomers
    if (h === 1) return "come back?";
    if (h === 2) return "come back, " + name;
    if (h === 3) return "the door is still open, " + name;
    const rot = ["come back, " + name, "it's cold in here without you", name + ". " + name + ". " + name + ".", "you left the shop open"];
    return rot[(Date.now() / 2600 | 0) % rot.length];
  }

  function onHide() {
    hidden = true;
    const t = awayTitle();
    if (t) document.title = t;
    // at the deepest haunt the title keeps changing while you are gone
    if (t && GS().hauntLevel() >= 4 && !document.body.classList.contains("reduce-motion")) {
      clearInterval(flickerTimer);
      flickerTimer = setInterval(function () { if (hidden) { const x = awayTitle(); if (x) document.title = x; } }, 2600);
    }
  }
  function onShow() {
    hidden = false;
    clearInterval(flickerTimer); flickerTimer = null;
    document.title = realTitle;
  }

  function init() {
    realTitle = document.title;
    document.addEventListener("visibilitychange", function () { document.hidden ? onHide() : onShow(); });
    window.addEventListener("blur", onHide);
    window.addEventListener("focus", onShow);
  }

  return { init, awayTitle, _onHide: onHide, _onShow: onShow };
})();
