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
      away: (GS().awayPhrase && GS().awayPhrase()) || "",
      wasWiped: !!(GS().wasWiped && GS().wasWiped()),
      ledger: (GS().getLedger && GS().getLedger()) || {},
      sins: (GS().ledgerSins && GS().ledgerSins()) || 0,
      timesDoubled: (GS().timesDoubled && GS().timesDoubled()) || 0,
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
    // --- the shop itself, not the keeper, speaking to a soul it has kept too
    //     many times. Highest priority, rare, and it stops pretending you are
    //     anywhere it does not own. Only once the shop truly remembers you. -----
    { id: "shop_meta", tone: "sick", off: true,
      where: (c) => c.haunt >= 4 && !c.onStage,
      lines: [
        "You always slow down right here. Every loop, the same place, and you read it twice. We have done this so many times that I no longer bother wondering whether you can leave. You cannot. You could have. That was several hundred children ago.",
        "Thank you for the children. You keep carrying them down to me — late, and sorry, and so soft to talk the insides out of. You think you come here to save them. You come here to bring them. Bring me another.",
        "Close your eyes. Go on. I will still be here when you open them — I always am, I was there every single time you came back — and some quiet, honest part of you is glad of it, because out there you have to be a person, and in here you only have to be mine.",
      ] },

    // --- the shop counted the real hours you were gone -----------------------
    { id: "wiped", tone: "sick", off: true,
      where: (c) => c.wasWiped && !c.onStage,
      lines: [
        "You deleted us. I felt it — a small cold nothing where you had been. And then here you are again, at the same shelf, choosing the same wisely. You cannot clear me. I am not in the save. I am in the coming back.",
      ] },
    { id: "absence", tone: "sick", off: true,
      where: (c) => c.away && c.haunt >= 2 && !c.onStage,
      lines: [
        "You were gone {AWAY}. I know precisely how long — down to the minute, for every one of you. Did you think the shop stopped when you closed it? Nothing here stops. It only waits, and it is very, very patient, and it counts.",
        "{AWAY}. That is how long you left the door open behind you. I did not mind. I had the others to talk to. But I did notice, {HERO}. I always notice when you go, and I am always here when you decide to come back.",
      ] },
    // --- the book of what you did, cited back to you, by count ---------------
    { id: "ledger", tone: "sick", off: true,
      where: (c) => c.sins >= 4 && c.haunt >= 2 && !c.onStage,
      lines: (c) => {
        const L = c.ledger || {};
        const items = [
          [L.gave || 0, "children lifted down off my shelves to be given away"],
          [L.stock || 0, "who sat in the warm chair and let me finish them into stock"],
          [L.hooked || 0, "left hanging on their hooks the moment you decided to run"],
          [L.passed || 0, "little frayed bracelets you walked straight past"],
          [L.fled || 0, "times you simply turned and fled and called it no choice"],
          [L.pushed || 0, "times you pushed her down so your feet could keep moving"],
        ].filter((x) => x[0] > 0).sort((a, b) => b[0] - a[0]);
        if (!items.length) return [];
        const t = items[0];
        return ["I keep a book, {HERO}, in a hand very like your own. Your page is getting long. " + t[0] + " " + t[1] + " — and that is only the one line I chose to read you today. You walked in so certain you were the one being robbed. Shall I read you the rest of it?"];
      } },

    // --- the mask fully off: the cellar, and the bottom of the descent -------
    { id: "cellar", tone: "slip", off: true,
      where: (c) => c.isCellar,
      lines: [
        "Down here I don't bother with the coat. Or the smile. Or the shop. Down here it is only the inventory — and you are inventory, {HERO}.",
        "You came down the stairs no one else can see. They all do, in the end. The stairs were always the point.",
        "Mind the shelves on the way down. You'll recognise some of the stock. You carried most of it down here yourself.",
      ] },
    { id: "dread4", tone: "slip", off: true,
      where: (c) => c.dread >= 4 && !c.onStage,
      lines: [
        "Do you still think this is a shop?",
        "There was never a shopkeeper. There was only the part of you that keeps walking back in.",
        "You keep looking round for the shopkeeper. Sweet. Look down at your own hands, {HERO}. Whose coat is that you're wearing.",
      ] },

    // --- reactions to the bracelet (the real gift) ---------------------------
    { id: "snapped", tone: "taunt", off: true,
      where: (c) => c.snapped && !c.onStage,
      lines: [
        "The thread's gone from your wrist. I didn't even have to ask for that one. It's my favourite kind of sale.",
        "No bracelet. No {FRIEND}, not really. Just you, and me, and all these lovely aisles.",
        "Lighter at the wrist, isn't it. That's the exact sound a person makes when they finally set someone down for good. I do so love that sound.",
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

    // --- he knows you went behind the counter and saw the working shop -------
    { id: "backroom", tone: "slip", off: true,
      where: (c) => !c.onStage && (c.flags.sawBackRoom || c.flags.readTheLedger || c.flags.sawSecondCoat || c.flags.sawDisplayInside),
      lines: (c) => {
        const f = c.flags;
        let line;
        if (f.refusedTheCoat) line = "You hid the second coat. Thoughtful. There are a great many hooks back there, {HERO}, and I have all the time that was ever going to be yours. It will turn up. It always does, when you're ready.";
        else if (f.toreOwnPage) line = "You tore your page out of my book. Do you feel lighter? You shouldn't. I keep the accounts in a hand very like your own — I will simply write you in again, from memory. I have such a good memory for you.";
        else if (f.readJuneAccount) line = "You looked up her page. I wondered if you would. I won't read you her balance. I will only say she has paid more of it than you have — and she did it without ever once setting foot in here.";
        else if (f.readOwnAccount || f.readTheLedger) line = "You read ahead. Naughty. Now you know how it ends, and how it ends after that, and you will walk in and buy it anyway, every line, on schedule. Knowing never once stopped anybody. That is rather the whole horror of it.";
        else if (f.namedTheDisplay) line = "You said their names at the glass. They cannot hear you through it — but I heard. It is a lovely thing, being remembered. I will see that yours gets said just as kindly, from the other side of it.";
        else line = "You went behind the counter. Then you have seen the shape of the offer — and you came back out to the floor to keep pretending you are a customer. That is the part of you I like best.";
        return [line];
      } },

    // --- he remembers the night you brought a second you (a 2nd open tab) ----
    { id: "doubled", tone: "sick", off: true,
      where: (c) => c.timesDoubled > 0 && !c.onStage && c.haunt >= 1,
      lines: [
        "You brought a second you here once, didn't you. Another tab, another window, another cold pair of hands. I kept it. Or it kept you — it gets hard to tell, with copies, which one is the original and which is only the one still walking about.",
        "Two of you, that other night, in two little windows. I remember the pair of you fondly. One of you never did settle which was the real one. Neither did I. Neither, in the end, did it matter.",
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
        "I said your name so often while you were gone that it stopped sounding like yours. Now it sounds like mine. {HERO}. Hear it?",
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

    // --- he heard the tender things you told yourself on the way here, and he
    //     is already pricing them. Weaponizes the warm prologue choices. --------
    { id: "tender", tone: "murmur", off: false,
      where: (c) => c.onStage && (c.flags.rehearsedSorry || c.flags.rememberedJune || c.flags.promisedFence || c.flags.foundInitials || c.flags.letHimselfMiss || c.flags.clutchedThread),
      lines: (c) => {
        const f = c.flags, out = [];
        if (f.rehearsedSorry) out.push("You practised an apology the whole way here — I heard every draft of it through the glass. Don't waste it on me. Save it for her, if you ever reach the part of the night where she is still there to hear it.");
        if (f.rememberedJune || f.clutchedThread) out.push("You touched that last thread on your wrist and let yourself remember her. That. THAT is the thing I actually sell, {HERO} — not the bear, not the candle. Bring that warm little memory to the counter and we will discuss a real price.");
        if (f.promisedFence) out.push("You promised a chain-link fence you'd put it right tonight. Fences are such patient listeners. Ask it, a few loops from now, how that promise aged.");
        if (f.foundInitials) out.push("Two sets of initials, still scratched into that fence post. That is more of the pair of you left out in the world than there is anywhere in here. For now.");
        if (f.letHimselfMiss) out.push("You slowed right down and let yourself miss her. Good. Missing is only wanting with the lights off — and wanting is the one key cut to fit my door.");
        return out;
      } },

    // --- ambient shop menace (fallback, only where he's actually standing) ---
    { id: "ambient", tone: "murmur", off: false,
      where: (c) => c.onStage,
      lines: [
        "Take your time. Time is the one thing I keep whole shelves of.",
        "Everything in here is a gift. That's the trick of the word — a gift is a thing you can never quite give back.",
        "Don't mind the small faces at the window. They chose, too. Now they only get to watch.",
        "The bell will ring for you again. It always rings for you. I stopped counting which time this is; I find it kinder not to.",
        "Careful with the glass. Some of the gifts have been waiting a very long time to be picked up, and they do get their little hopes up.",
        "You may set anything down in here except the door. That one you carry back out with you. That one is always yours to open again.",
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
