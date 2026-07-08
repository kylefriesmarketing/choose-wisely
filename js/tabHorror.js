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

  /* --- The favicon watches you. While the tab is in the background the little
   * icon becomes a button-eye that slowly blinks — the shop looking back out of
   * the browser chrome. Restored the instant you return. Drawn on a canvas so it
   * costs nothing and ships no files. --- */
  let iconLink = null, origIconHref = null, origIconType = null;
  let favOpen = null, favShut = null, blinkTimer = null;

  function drawEye(shut) {
    const c = document.createElement("canvas"); c.width = 64; c.height = 64;
    const g = c.getContext("2d");
    // aubergine rounded tile (matches the real favicon's mood)
    g.fillStyle = "#160d1c";
    if (g.roundRect) { g.beginPath(); g.roundRect(2, 2, 60, 60, 14); g.fill(); }
    else g.fillRect(2, 2, 60, 60);
    // the button disc
    g.fillStyle = "#181019"; g.beginPath(); g.arc(32, 32, 19, 0, 7); g.fill();
    g.strokeStyle = "rgba(255,207,122,0.55)"; g.lineWidth = 2.4; g.stroke();
    if (shut) {
      // eye closed — a stitched lid curving shut over the button
      g.strokeStyle = "rgba(255,207,122,0.9)"; g.lineWidth = 3;
      g.beginPath(); g.moveTo(19, 33); g.quadraticCurveTo(32, 40, 45, 33); g.stroke();
    } else {
      // eye open — the four thread-holes and the crossed thread (the emblem)
      g.fillStyle = "#050409";
      [[26, 26], [38, 26], [26, 38], [38, 38]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 2.7, 0, 7); g.fill(); });
      g.strokeStyle = "rgba(255,207,122,0.95)"; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(26, 26); g.lineTo(38, 38); g.moveTo(38, 26); g.lineTo(26, 38); g.stroke();
    }
    return c.toDataURL("image/png");
  }
  function setIcon(href, type) { if (!iconLink) return; iconLink.type = type || "image/png"; iconLink.href = href; }
  function initFavicon() {
    iconLink = document.querySelector('link[rel="icon"]');
    if (iconLink) { origIconHref = iconLink.href; origIconType = iconLink.getAttribute("type") || "image/svg+xml"; }
    try { favOpen = drawEye(false); favShut = drawEye(true); } catch (e) { favOpen = favShut = null; }
  }
  function blink() {
    if (!hidden) return;
    setIcon(favShut);
    blinkTimer = setTimeout(function () {
      if (!hidden) return;
      setIcon(favOpen);
      blinkTimer = setTimeout(blink, 2600 + Math.random() * 2200);
    }, 160);
  }
  function watchFavicon() {
    if (!iconLink || !favOpen) return;
    setIcon(favOpen); // an open eye the moment you look away
    if (document.body.classList.contains("reduce-motion")) return; // hold it still, don't blink
    clearTimeout(blinkTimer); blinkTimer = setTimeout(blink, 2000);
  }
  function unwatchFavicon() {
    clearTimeout(blinkTimer); blinkTimer = null;
    if (origIconHref) setIcon(origIconHref, origIconType);
  }

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
    watchFavicon(); // the button-eye opens in the tab
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
    unwatchFavicon(); // it closes; the real icon returns
    document.title = realTitle;
  }

  function init() {
    realTitle = document.title;
    initFavicon();
    document.addEventListener("visibilitychange", function () { document.hidden ? onHide() : onShow(); });
    window.addEventListener("blur", onHide);
    window.addEventListener("focus", onShow);
  }

  return { init, awayTitle, _onHide: onHide, _onShow: onShow };
})();
