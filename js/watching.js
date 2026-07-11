/* ============================================================================
 * watching.js  -  the shop notices two more things a story is not supposed to
 * notice about its reader:
 *
 *   1. When you go still. Leave the tab open but stop touching it and, after a
 *      while, the shop speaks into the quiet — escalating the longer you're gone.
 *      (Only while the tab is actually in front of you; if you switch away, that
 *      is TabHorror's job, not this one.)
 *
 *   2. When you try to take it with you. Right-click, or copy text out of the
 *      page, and the shop catches you doing it. It never blocks the action — it
 *      just... comments.
 *
 * Both reach you through CW.UIController.shopWhisper (a disembodied line that can
 * appear over anything). No story state is touched. Silent if the UI isn't up.
 * ========================================================================== */
window.CW = window.CW || {};

CW.Watching = (function () {
  let last = Date.now();
  let fired = {};          // which idle thresholds have spoken this quiet spell
  let lastCatch = 0;       // rate-limit for the right-click / copy line
  let checkTimer = null;

  // How deep the night is decides which register the whispers use:
  //   tier 0 (calm)  — almost kind; shop patter.
  //   tier 1 (wrong) — the fourth wall creaks.
  //   tier 2 (named) — it starts using the names. Hers, then yours.
  function tier() {
    try {
      const d = CW.GameState.dreadLevel(), h = CW.GameState.hauntLevel();
      if (d >= 4 || h >= 3) return 2;
      if (d >= 2 || h >= 2) return 1;
    } catch (e) {}
    return 0;
  }

  // The quiet grows teeth the longer it lasts — and sharper ones the deeper you are.
  // Each threshold carries one line per tier (index = tier, clamped).
  const IDLE = [
    { t: 80000, lines: [
      "Still there? Take your time. I have nothing but time — and, in the end, all of yours as well.",
      "Still there. Neither of us has moved. Only one of us is pretending that's strange.",
      "Still there, {HERO}. Don't be embarrassed. {FRIEND} used to go quiet like this too, near the end of things.",
    ] },
    { t: 190000, lines: [
      "You've gone so quiet on me. Wandered off, have you, and left a thing half-finished. They do that, the ones who think they can simply walk away. The shop waits. The shop is so very good at waiting.",
      "The quiet has a shape, you know. Yours. It sits exactly where you sit, and it doesn't blink either.",
      "You've gone quiet the way she went quiet. {FRIEND} could hold a silence for a whole year. You taught her how.",
    ] },
    { t: 380000, lines: [
      "You're not coming back for a while, are you. That's all right, little one. I'll keep your place warm. I have kept places warm for years, and years, and years.",
      "Away so long, and the door still open. I've started stocking the time you leave behind. It sells, you know. To the ones who ran out of it.",
      "If you're not coming back, only say so. I'll wrap the rest of the night and put it under your name. We hold layaway for years here. Ask {FRIEND} — well. You can't.",
    ] },
  ];
  // Caught-you pools, keyed by tier (falls back down a tier when unwritten).
  const RCLICK = {
    0: [
      "Poking at the seams, are you — right-clicking, looking for the trick of me. There is nothing behind the curtain but more curtain. And behind that, only you.",
      "Trying to see how I work. There is no how. There is only the door, and the rule, and the coming back.",
    ],
    1: ["Under the page there is only shelf. Under the shelf, floor. Under the floor — inventory. You would know the sound it makes by now."],
    2: ["Looking under the page again. {FRIEND} looked under things too. Once. It is how the shop learned her name."],
  };
  const COPY = {
    0: [
      "Copying it down? To remember me by, later? Sweet. You'll copy it, and lose the copy, and come back, and I will tell it to you again like it's the very first time. It is always the first time.",
      "Taking notes on the shop. Good. Bring them next visit — I do so love to watch you not recognise your own handwriting.",
    ],
    1: ["Yes — take it down, word for word. The words won't stay put in a pocket. They keep the shop's hours."],
    2: ["Copy her name too, while you're at it. Spell it exactly the way you remember. Now check it against the way {FRIEND} spelled it. One of you has been misremembering — and it was never me."],
  };

  function whisper(line) {
    if (CW.UIController && CW.UIController.shopWhisper) CW.UIController.shopWhisper(line);
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function activity() { last = Date.now(); fired = {}; }

  function checkIdle() {
    // If the tab isn't in front of them, absence belongs to TabHorror; don't count it.
    if (document.hidden) { last = Date.now(); return; }
    const idle = Date.now() - last;
    for (let i = IDLE.length - 1; i >= 0; i--) {
      if (idle >= IDLE[i].t && !fired[i]) {
        fired[i] = true;
        const lines = IDLE[i].lines;
        whisper(lines[Math.min(tier(), lines.length - 1)]);
        break;
      }
    }
  }

  function caught(pools) {
    const now = Date.now();
    if (now - lastCatch < 30000) return; // one comment at a time; don't nag
    lastCatch = now;
    // Use the deepest register written for this depth; fall back toward calm.
    for (let k = tier(); k >= 0; k--) {
      if (pools[k] && pools[k].length) { whisper(pick(pools[k])); return; }
    }
  }

  function init() {
    ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"].forEach(function (ev) {
      window.addEventListener(ev, activity, { passive: true });
    });
    checkTimer = setInterval(checkIdle, 10000);
    // Watch, but never interfere — the browser's own menu still opens.
    document.addEventListener("contextmenu", function () { caught(RCLICK); });
    document.addEventListener("copy", function () { caught(COPY); });
  }

  return { init, _idle: checkIdle };
})();
