/* ============================================================================
 * titleSequence.js  -  CW.TitleSequence. Directs the title screen as one beat.
 *
 * The title film plays in two movements (see sceneManager SCENE_VIDEOS):
 *   INTRO (cover_door.mp4, once per page load): the child walks up, the door
 *   opens, they step through into the light...
 *   LOOP  (cover_entrance.mp4, forever): ...and the world blinks — and the
 *   same child is walking toward the shop again. The loop is the trap.
 *
 * Beats ride the film's own timeupdate clock (never wall-clock, so staging
 * survives streaming stalls), tagged per-film so the right ladder fires:
 *   intro:  title (~0.8s) -> tagline (~2.4s) -> doorbell as the door opens ->
 *           Begin appears (~9s) -> THE OMEN exactly at the loop handoff (the
 *           'ended' event): the frame blinks wrong, the title flashes CHOSEN
 *           ALREADY, the bell rings again detuned — they went in, and they
 *           are walking up again.
 *   loop (menu revisits): title/tagline quick, distant bell (~6s), omen
 *           (~8.4s, once per visit), reveal (~9.2s).
 *
 * The full staging plays once per page load; returning to the menu shows
 * everything instantly. Any tap/keypress skips. If the video can't play
 * (reduce-motion, autoplay blocked, failure) the menu just appears — the
 * sequence can never hold the player hostage.
 * ========================================================================== */
window.CW = window.CW || {};

CW.TitleSequence = (function () {
  let coldOpenDone = false;  // full staging only on the first menu of a page load
  let bound = false;
  let beats = [];
  let omenThisVisit = false; // the shop only notices you once per menu visit
  let failsafe = null, autoplayCheck = null;

  // Door-film beat times; tuned from extracted frames of cover_door.mp4.
  const DOOR_OPEN_T = 6.2;   // the door swings open — the bell, far away
  const DOOR_REVEAL_T = 9.0; // Begin appears as they cross the threshold

  const $ = (id) => document.getElementById(id);
  const menu = () => $("main-menu");
  const video = () => $("scene-video");
  const reduceMotion = () => document.body.classList.contains("reduce-motion");

  function sfx(name) { if (CW.Audio && CW.Audio.entrance) CW.Audio.entrance(name); }

  /* ---- the omen: the shop notices you ----------------------------------- */
  function omen() {
    if (omenThisVisit) return;
    omenThisVisit = true;
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

  /* Both ladders, tagged by film; only beats matching the playing clip fire. */
  function makeBeats() {
    return [
      // the door film — the once-per-load intro
      { film: "cover_door", t: 0.8, fn: () => { stage("show-title"); sfx("swell"); } },
      { film: "cover_door", t: 2.4, fn: () => stage("show-tagline") },
      { film: "cover_door", t: DOOR_OPEN_T, fn: () => sfx("bell") },
      { film: "cover_door", t: DOOR_REVEAL_T, fn: revealAll },
      // the eternal approach — menu revisits (and the intro's fallback)
      { film: "cover_entrance", t: 0.8, fn: () => { stage("show-title"); sfx("swell"); } },
      { film: "cover_entrance", t: 2.4, fn: () => stage("show-tagline") },
      { film: "cover_entrance", t: 6.0, fn: () => sfx("bell") },
      { film: "cover_entrance", t: 8.4, fn: omen },
      { film: "cover_entrance", t: 9.2, fn: revealAll },
    ].map((b) => ({ ...b, done: false }));
  }

  function stage(cls) { const m = menu(); if (m) m.classList.add(cls); }

  function revealAll() {
    const m = menu(); if (!m) return;
    m.classList.add("show-title", "show-tagline", "show-actions");
    clearTimeout(failsafe); clearTimeout(autoplayCheck);
  }

  function onTime() {
    const v = video(); if (!v) return;
    const src = v.getAttribute("data-src") || "";
    const t = v.currentTime;
    for (const b of beats) {
      if (!b.done && src.indexOf(b.film) !== -1 && t >= b.t && t < b.t + 4) { b.done = true; b.fn(); }
    }
  }

  // The handoff: the intro ends, the loop begins — the world blinks and the
  // child is walking up again. THE moment the wrongness lands.
  function onIntroEnded() { omen(); }

  /* Called by showMenu each time the menu opens. */
  function begin() {
    const m = menu(), v = video();
    beats = makeBeats();
    omenThisVisit = false;
    if (v && !bound) { bound = true; v.addEventListener("timeupdate", onTime); }

    const introComing = !!(CW.SceneManager && CW.SceneManager.introPending && CW.SceneManager.introPending());
    if (v && introComing) v.addEventListener("ended", onIntroEnded, { once: true });

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
