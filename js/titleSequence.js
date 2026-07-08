/* ============================================================================
 * titleSequence.js  -  CW.TitleSequence. Directs the title screen as one beat:
 * the menu reveals itself against the title film (the child's eternal walk
 * toward the shop, looping, never arriving).
 *
 * Choreography (times are VIDEO time, read off #scene-video's timeupdate, so
 * the staging stays in sync even if the clip stalls while streaming):
 *   ~0.8s  kicker + title + rule fade in (with a gust of rain)
 *   ~2.4s  tagline + haunt line
 *   ~6.0s  the shop's doorbell, far away — an invitation
 *   ~8.4s  THE OMEN: the frame blinks wrong, the title flashes CHOSEN ALREADY,
 *          and the bell rings again, detuned — though no door ever opened
 *   ~9.2s  Begin / Continue / chips appear: your turn to walk in
 *
 * The full staging plays once per page load; returning to the menu shows
 * everything instantly (the beats still fire once per visit, quietly). Any
 * tap/keypress skips straight to the full menu. If the video can't play
 * (reduce-motion, autoplay blocked, failure) the menu just appears — the
 * sequence can never hold the player hostage.
 * ========================================================================== */
window.CW = window.CW || {};

CW.TitleSequence = (function () {
  let coldOpenDone = false;  // full staging only on the first menu of a page load
  let bound = false;
  let beats = [];
  let failsafe = null, autoplayCheck = null;

  const $ = (id) => document.getElementById(id);
  const menu = () => $("main-menu");
  const video = () => $("scene-video");
  const reduceMotion = () => document.body.classList.contains("reduce-motion");

  function sfx(name) { if (CW.Audio && CW.Audio.entrance) CW.Audio.entrance(name); }

  /* ---- the omen: the shop notices you ----------------------------------- */
  function omen() {
    const scene = $("scene");
    if (scene && !reduceMotion()) {
      scene.classList.add("omen");
      setTimeout(() => scene.classList.remove("omen"), 700);
    }
    const title = document.querySelector(".menu-title");
    if (title && menu() && menu().classList.contains("open")) {
      const real = title.textContent;
      title.textContent = "CHOSEN ALREADY";
      title.classList.add("glitch-flash");
      setTimeout(() => { title.textContent = real === "CHOSEN ALREADY" ? "CHOOSE WISELY" : real; title.classList.remove("glitch-flash"); }, 150);
    }
    sfx("wrong");
  }

  function makeBeats() {
    return [
      { t: 0.8, fn: () => { stage("show-title"); sfx("swell"); } },
      { t: 2.4, fn: () => stage("show-tagline") },
      { t: 6.0, fn: () => sfx("bell") },
      { t: 8.4, fn: omen },
      { t: 9.2, fn: revealAll },
    ].map((b) => ({ t: b.t, fn: b.fn, done: false }));
  }

  function stage(cls) { const m = menu(); if (m) m.classList.add(cls); }

  function revealAll() {
    const m = menu(); if (!m) return;
    m.classList.add("show-title", "show-tagline", "show-actions");
    clearTimeout(failsafe); clearTimeout(autoplayCheck);
  }

  function onTime() {
    const v = video(); if (!v) return;
    const t = v.currentTime;
    for (const b of beats) if (!b.done && t >= b.t && t < b.t + 4) { b.done = true; b.fn(); }
  }

  /* Called by showMenu each time the menu opens. */
  function begin() {
    const m = menu(), v = video();
    beats = makeBeats();
    if (v && !bound) { bound = true; v.addEventListener("timeupdate", onTime); }

    // No film to conduct (reduce-motion / no clip) or a return visit:
    // everything at once. Beats still fire against the film where it plays.
    if (coldOpenDone || reduceMotion() || !v || !v.getAttribute("data-src")) {
      if (m) m.classList.add("cold-open");
      revealAll();
      return;
    }

    coldOpenDone = true;
    m.classList.add("cold-open");
    // A tap or key skips straight to the menu (the film keeps playing behind).
    m.addEventListener("pointerdown", revealAll, { once: true });
    document.addEventListener("keydown", revealAll, { once: true });
    // Autoplay blocked? Never gate the menu on a film that isn't running.
    autoplayCheck = setTimeout(() => { const vv = video(); if (!vv || vv.currentTime < 0.2) revealAll(); }, 1800);
    failsafe = setTimeout(revealAll, 12000);
  }

  return { begin, revealAll, _omen: omen };
})();
