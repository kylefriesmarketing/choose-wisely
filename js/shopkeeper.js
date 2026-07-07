/* ============================================================================
 * shopkeeper.js  -  the shopkeeper wakes up. He stops being a signpost and
 * becomes an antagonist with a voice of his own: a library of barbed ASIDES
 * that he murmurs (or, deeper down, that reach you from behind when he isn't
 * even on screen). Each aside is keyed to what you actually did — your gift,
 * the state of the bracelet, the dark little choices — and to how many times
 * you have been back. The more the shop remembers you, the more his mask slips.
 *
 * Pure content + a selector. CW.Shopkeeper.asideFor(node) returns { line, tone,
 * disembodied } or null. The view (uiController) renders it; nothing here
 * touches the DOM. Lines may contain {HERO}/{FRIEND} tokens — the view fills
 * them. An aside is shown at most once per run (tracked on the run object), so
 * he never repeats himself in a single descent.
 * ========================================================================== */
window.CW = window.CW || {};

CW.Shopkeeper = (function () {
  const GS = () => CW.GameState;

  // Where the shopkeeper is actually drawn on stage (mirrors CW.Cast SHOP_NODES).
  const STAGE_NODES = ["S00_OUTSIDE_SHOP", "S01_ENTER_SHOP", "S02_FOUR_GIFTS", "S03_SHOPKEEPER_WARNING", "S04_CHOOSE_GIFT", "F01_FIFTH_AISLE"];
  // A gift's name in his mouth (short, familiar, a little contemptuous).
  const GIFT = {
    talking_teddy:      "bear",
    wish_candle:        "candle",
    everlasting_balloon:"balloon",
    clockwork_dragon:   "dragon",
  };

  /* Build the context every rule reads. Cheap; recomputed per node. */
  function ctxFor(node) {
    const run = GS().getRun() || {};
    const flags = run.flags || {};
    const meta = GS().getMeta();
    const id = node.id || "";
    return {
      node: node, id: id, theme: node.theme || "",
      onStage: STAGE_NODES.indexOf(id) > -1,
      isCellar: id.indexOf("CELLAR") === 0,
      isMemory: id.indexOf("TM_") === 0,
      isPrologue: id.indexOf("PRE_") === 0,
      dread: GS().dreadLevel(),
      haunt: GS().hauntLevel(),
      visits: GS().getVisits(),
      loops: GS().getLoops(),
      gift: run.chosenGift || null,
      lastGift: meta.lastGift || null,
      giftHistory: meta.giftHistory || [],
      flags: flags,
      snapped: !!flags.braceletSnapped,
      whole: !!flags.braceletWhole,
      bond: run.bond || 0,
      endings: (meta.endingsFound || []).length,
    };
  }

  /* The barb library, richest/rarest first. `where(c)` gates a rule; `lines(c)`
     (or a plain array) supplies one or more candidate lines. The first rule with
     an unseen candidate wins. tone drives the styling; `off` = he isn't on stage,
     so the voice arrives disembodied. */
  const RULES = [
    // --- the mask fully off: the cellar, and the bottom of the descent -------
    { id: "cellar", tone: "slip", off: true,
      where: (c) => c.isCellar,
      lines: [
        "Down here I don't bother with the coat. Or the smile. Or the shop. Down here it is only the inventory — and you are inventory, {HERO}.",
        "You came down the stairs no one else can see. They all do, in the end. The stairs were always the point.",
      ] },
    { id: "dread4", tone: "slip", off: true,
      where: (c) => c.dread >= 4 && !c.onStage,
      lines: [
        "Do you still think this is a shop?",
        "There was never a shopkeeper. There was only the part of you that keeps walking back in.",
      ] },

    // --- reactions to the bracelet (the real gift) ---------------------------
    { id: "snapped", tone: "taunt", off: true,
      where: (c) => c.snapped && !c.onStage,
      lines: [
        "The thread's gone from your wrist. I didn't even have to ask for that one. It's my favourite kind of sale.",
        "No bracelet. No {FRIEND}, not really. Just you, and me, and all these lovely aisles.",
      ] },
    { id: "whole", tone: "bargain", off: true,
      where: (c) => c.whole && !c.onStage,
      lines: [
        "You've been mending that. Thread by thread, the whole way here. How industrious of you. It changes nothing, of course.",
        "Give me the bracelet instead of a toy and I'll make her love you forever — no fraying, no forgetting. No? ...We'll talk again lower down.",
      ] },

    // --- reactions to your darker little choices -----------------------------
    { id: "pushed", tone: "taunt", off: true,
      where: (c) => c.flags.pushedItDown && !c.onStage,
      lines: [
        "There. Push her down. You've had so much practice at it, {HERO}.",
        "Good. Feel less. It's so much easier to shop when you feel a little less.",
      ] },
    { id: "shadow", tone: "slip", off: false,
      where: (c) => c.flags.noticedShadow && c.onStage,
      lines: [
        "You saw it. The second shadow, behind me, doing the opposite of what I do. Pretend you didn't. It's kinder — to both of us.",
      ] },

    // --- deeper-down slip while he isn't even on screen ----------------------
    { id: "dread3", tone: "slip", off: true,
      where: (c) => c.dread >= 3 && !c.onStage,
      lines: [
        "The candlelight's going, isn't it. You're starting to see the shelves for what they really hold.",
        "You can still hear me back here. Interesting. Most of them can't, by now. You must be paying such close attention.",
      ] },

    // --- he remembers the gift you gave LAST time (before you choose again) --
    { id: "lastgift", tone: "taunt", off: false,
      where: (c) => c.onStage && !c.gift && c.lastGift && ["S01_ENTER_SHOP", "S02_FOUR_GIFTS"].indexOf(c.id) > -1,
      lines: (c) => {
        const map = {
          talking_teddy:       "You gave her the bear last time. She held it like it was you. It wasn't.",
          wish_candle:         "The candle, last time. She spent the wish on you, if you can believe it. People are strange about the ones who forget them.",
          everlasting_balloon: "You gave the balloon last time. It drifted off by morning. So, eventually, did she.",
          clockwork_dragon:    "The dragon, last time. Wound all the way down inside a week. Loyalty does that, left alone.",
        };
        return map[c.lastGift] ? [map[c.lastGift]] : [];
      } },

    // --- he knows you are a regular ------------------------------------------
    { id: "regular", tone: "taunt", off: false,
      where: (c) => c.onStage && (c.loops > 0 || c.haunt >= 3) && (c.id === "S00_OUTSIDE_SHOP" || c.id === "S01_ENTER_SHOP"),
      lines: [
        "Ah. You. I'd say welcome, but you never really leave, do you.",
        "Same corner. Same empty hands. Same little sign with your name hiding under the gold.",
      ] },

    // --- he learns your name -------------------------------------------------
    { id: "name", tone: "murmur", off: false,
      where: (c) => c.onStage && c.haunt >= 1,
      lines: [
        "{HERO}. I kept saying it while you were away. {HERO}, {HERO}, {HERO}. It wears so well with use.",
        "Back so soon, {HERO}? The rain hasn't even dried on the step.",
      ] },

    // --- he approves of the gift you just chose (this run) -------------------
    { id: "chose", tone: "murmur", off: false,
      where: (c) => c.gift && (c.id === "S04_CHOOSE_GIFT" || c.isMemory || ["T01","C01","B01","D01"].indexOf(c.id) > -1),
      lines: (c) => {
        const map = {
          talking_teddy:       "The bear. Soft, and full of somebody else's boy. The two of you will get along.",
          wish_candle:         "The candle. One wish in it. Spend it on yourself — they always do — and come tell me how it tasted.",
          everlasting_balloon: "The balloon. It only ever goes the one way, {HERO}. Up. And gone. Rather like you.",
          clockwork_dragon:    "The dragon. It remembers everything. Even the parts of you you'd hoped it wouldn't.",
        };
        return map[c.gift] ? [map[c.gift]] : [];
      } },

    // --- caution he finds funny ----------------------------------------------
    { id: "caution", tone: "murmur", off: false,
      where: (c) => c.onStage && c.flags.sensedWrong && (c.id === "S00_OUTSIDE_SHOP" || c.id === "S01_ENTER_SHOP"),
      lines: [
        "You felt it out on the step, and you came in anyway. They always do. Caution is only a slower way of saying yes.",
      ] },

    // --- the last whisper before you hand your gift over ---------------------
    { id: "reunion", tone: "bargain", off: false,
      where: (c) => c.id === "P02_BIRTHDAY_ROOM",
      lines: [
        "Go on, then. Give it to her. Let's the both of us see whether a toy can buy back a whole lost year.",
      ] },

    // --- ambient shop menace (fallback, only where he's actually standing) ---
    { id: "ambient", tone: "murmur", off: false,
      where: (c) => c.onStage,
      lines: [
        "Take your time. Time is the one thing I keep whole shelves of.",
        "Everything in here is a gift. That's the trick of the word — a gift is a thing you can never quite give back.",
        "Don't mind the small faces at the window. They chose, too. Now they only get to watch.",
      ] },
  ];

  /* Has this exact line already been murmured this run? Tracked on the run so it
     resets automatically each descent (and survives Continue via the save). */
  function seenSet() {
    const run = GS().getRun();
    if (!run) return null;
    if (!run._skSeen) run._skSeen = {};
    return run._skSeen;
  }

  function asideFor(node) {
    if (!node) return null;
    // If the node's own narration is already in his voice, he has the floor —
    // don't stack a second line on top of it.
    if (node.speaker === "Shopkeeper") return null;
    const c = ctxFor(node);
    // He does not exist yet on the warm street, and memory beats are hers, not his.
    if (c.isPrologue) return null;
    const seen = seenSet();
    if (!seen) return null;

    for (let i = 0; i < RULES.length; i++) {
      const r = RULES[i];
      if (!r.where(c)) continue;
      const cand = typeof r.lines === "function" ? r.lines(c) : r.lines;
      if (!cand || !cand.length) continue;
      const fresh = cand.filter((ln) => !seen[ln]);
      const pool = fresh.length ? fresh : null; // once all seen, stay quiet rather than repeat
      if (!pool) continue;
      const line = pool[Math.floor(Math.random() * pool.length)];
      seen[line] = true;
      return { line: line, tone: r.tone, disembodied: !c.onStage, rule: r.id };
    }
    return null;
  }

  return { asideFor };
})();
