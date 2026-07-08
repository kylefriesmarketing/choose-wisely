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

  // The quiet grows teeth the longer it lasts.
  const IDLE = [
    { t: 80000,  line: "Still there? Take your time. I have nothing but time — and, in the end, all of yours as well." },
    { t: 190000, line: "You've gone so quiet on me. Wandered off, have you, and left a thing half-finished. They do that, the ones who think they can simply walk away. The shop waits. The shop is so very good at waiting." },
    { t: 380000, line: "You're not coming back for a while, are you. That's all right, little one. I'll keep your place warm. I have kept places warm for years, and years, and years." },
  ];
  const RCLICK = [
    "Poking at the seams, are you — right-clicking, looking for the trick of me. There is nothing behind the curtain but more curtain. And behind that, only you.",
    "Trying to see how I work. There is no how. There is only the door, and the rule, and the coming back.",
  ];
  const COPY = [
    "Copying it down? To remember me by, later? Sweet. You'll copy it, and lose the copy, and come back, and I will tell it to you again like it's the very first time. It is always the first time.",
    "Taking notes on the shop. Good. Bring them next visit — I do so love to watch you not recognise your own handwriting.",
  ];

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
      if (idle >= IDLE[i].t && !fired[i]) { fired[i] = true; whisper(IDLE[i].line); break; }
    }
  }

  function caught(pool) {
    const now = Date.now();
    if (now - lastCatch < 30000) return; // one comment at a time; don't nag
    lastCatch = now;
    whisper(pick(pool));
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
