/* ============================================================================
 * traces.js  -  the other children. You are not the first to come in late with
 * empty hands, and the shop keeps what it takes. This module surfaces the proof:
 *
 *   CW.Traces.traceFor(node) -> { kind, child, text } | null
 *     An escalating ENVIRONMENTAL trace of a child who chose before you — a note
 *     tucked behind a toy, a little frayed bracelet with a name, a face at the
 *     rain-streaked window, or the toy on the shelf whispering in a child's
 *     voice. Content-only + selector; the view renders it. Each surfaces at most
 *     once per run (tracked on the run), and on a gift route the trace prefers
 *     the child whose toy is the one now in your hands.
 *
 *   CW.Faces.render(node) / .clear()
 *     The visual payoff: small pale faces that gather at the edge of the frame —
 *     the window — as the shop remembers you (haunt) and the run darkens (dread).
 *
 * The roster itself lives in storyData.js (CW.OtherChildren) so all content
 * stays in one place.
 * ========================================================================== */
window.CW = window.CW || {};

/* -------------------------------------------------------------------------- */
/* TEXTUAL TRACES                                                             */
/* -------------------------------------------------------------------------- */
CW.Traces = (function () {
  const GS = () => CW.GameState;
  const STAGE_NODES = ["S00_OUTSIDE_SHOP", "S01_ENTER_SHOP", "S02_FOUR_GIFTS", "S03_SHOPKEEPER_WARNING", "S04_CHOOSE_GIFT", "F01_FIFTH_AISLE"];

  function roster() { return CW.OtherChildren || []; }

  function ctxFor(node) {
    const run = GS().getRun() || {};
    const id = node.id || "";
    return {
      id: id,
      isShop: STAGE_NODES.indexOf(id) > -1 || id.indexOf("SHOP_") === 0,
      isCellar: id.indexOf("CELLAR") === 0,
      isMemory: id.indexOf("TM_") === 0,
      isPrologue: id.indexOf("PRE_") === 0,
      isRoute: ["teddy", "candle", "balloon", "dragon"].indexOf(node.theme) > -1 && id.indexOf("TM_") !== 0,
      dread: GS().dreadLevel(),
      haunt: GS().hauntLevel(),
      gift: run.chosenGift || null,
    };
  }

  // Which trace kinds could surface here, strongest (rarest) first?
  function eligibleKinds(c) {
    const kinds = [];
    if ((c.isRoute || c.isCellar) && c.dread >= 3) kinds.push("whisper"); // the toy speaks
    if (!c.isCellar && (c.haunt >= 1 || c.dread >= 2)) kinds.push("window"); // a face at the glass
    if ((c.isShop || c.isRoute) && c.dread >= 1) kinds.push("bracelet"); // a little frayed bracelet
    if (c.isShop) kinds.push("note"); // a note behind a toy
    return kinds;
  }

  function seenSet() {
    const run = GS().getRun();
    if (!run) return null;
    if (!run._traceSeen) run._traceSeen = {};
    return run._traceSeen;
  }

  // Prefer the child whose toy you are carrying; otherwise the next unseen child.
  function pickChild(kind, c, seen) {
    const list = roster();
    const key = (ch) => kind + ":" + ch.id;
    const has = (ch) => ch[kind] && !seen[key(ch)];
    if (c.gift) {
      const mine = list.find((ch) => ch.gift === c.gift && has(ch));
      if (mine) return mine;
    }
    return list.find((ch) => has(ch)) || null;
  }

  function traceFor(node) {
    if (!node) return null;
    const c = ctxFor(node);
    if (c.isPrologue || c.isMemory) return null; // the warm street and her memories are not the shop's
    const seen = seenSet();
    if (!seen) return null;

    const kinds = eligibleKinds(c);
    for (let i = 0; i < kinds.length; i++) {
      const kind = kinds[i];
      const child = pickChild(kind, c, seen);
      if (!child) continue;
      seen[kind + ":" + child.id] = true;
      // A kind may carry one line or several (replays get a different one).
      const t = child[kind];
      const text = Array.isArray(t) ? t[Math.floor(Math.random() * t.length)] : t;
      return { kind: kind, child: child, text: text };
    }
    return null;
  }

  return { traceFor };
})();

/* -------------------------------------------------------------------------- */
/* FACES AT THE WINDOW (visual)                                              */
/* -------------------------------------------------------------------------- */
CW.Faces = (function () {
  const GS = () => CW.GameState;
  // Where small faces gather along the top edge — the dark beyond the glass.
  const SPOTS = [
    { x: 150, y: 96 }, { x: 300, y: 74 }, { x: 470, y: 104 },
    { x: 640, y: 78 }, { x: 812, y: 100 }, { x: 905, y: 128 },
  ];

  function host() { return document.getElementById("faces"); }

  function eligible(node) {
    const id = (node && node.id) || "";
    if (id.indexOf("PRE_") === 0 || id.indexOf("TM_") === 0) return false; // not the warm street, not her memories
    if (id.indexOf("CELLAR") === 0) return false; // down here they are behind the doors, not the glass
    return true;
  }

  function face(spot, i) {
    const x = spot.x, y = spot.y;
    return '<g class="face" style="animation-delay:' + (i * 0.7) + 's">' +
      '<ellipse cx="' + x + '" cy="' + y + '" rx="15" ry="19" fill="#cfc7ba"/>' +
      '<ellipse cx="' + x + '" cy="' + y + '" rx="15" ry="19" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>' +
      '<ellipse class="eye" cx="' + (x - 5) + '" cy="' + (y - 2) + '" rx="2.6" ry="4" fill="#0a0608"/>' +
      '<ellipse class="eye" cx="' + (x + 5) + '" cy="' + (y - 2) + '" rx="2.6" ry="4" fill="#0a0608"/>' +
      // a mouth, closed to nothing until the very bottom of the descent, when it gapes
      '<ellipse class="mouth" cx="' + x + '" cy="' + (y + 9) + '" rx="4" ry="6" fill="#060305"/>' +
      '</g>';
  }

  function render(node) {
    const h = host();
    if (!h) return;
    // How many are watching: grows with the shop's memory of you and the dark.
    const level = eligible(node) ? Math.max(GS().hauntLevel(), GS().dreadLevel()) : 0;
    const n = level >= 2 ? Math.min(level, SPOTS.length) : 0; // 0, then 2..4 faces
    if (!n) { clear(); return; }
    let inner = "";
    for (let i = 0; i < n; i++) inner += face(SPOTS[i], i);
    h.innerHTML = '<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMin slice" width="100%" height="100%">' + inner + "</svg>";
    h.classList.add("on");
  }

  function clear() {
    const h = host();
    if (!h) return;
    h.innerHTML = "";
    h.classList.remove("on");
  }

  return { render, clear };
})();
