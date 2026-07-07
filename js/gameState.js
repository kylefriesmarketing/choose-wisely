/* ============================================================================
 * gameState.js  -  RunState (one run) + MetaProgress (across runs) + save/load.
 * See brief §8 and §17. Persistence uses localStorage (no platform APIs).
 * ========================================================================== */
window.CW = window.CW || {};

CW.GameState = (function () {
  const META_KEY = "chooseWisely.meta.v2";
  const RUN_KEY = "chooseWisely.run.v2";
  const STAT_MIN = 0, STAT_MAX = 10;
  const ROUTES = ["teddy", "candle", "balloon", "dragon"];
  // Flags that mean the player made a dark/greedy/reckless choice — they push
  // the descent faster. Dread only ever rises within a run.
  const DARK_FLAGS = ["shookBear", "carelessWish", "partyShifted", "lostPath", "followedWax", "sawHollow", "followedString", "foundFoundry"];
  const DREAD_THRESHOLDS = [4, 8, 12, 17]; // dread points -> level 1..4. The 3-screen street prologue stays warm (dread 0); the shop itself is floored at dread 1 (see node.dread), so the wrongness starts the moment you step through the door and ramps to full by mid-route.
  // Haunt is PERSISTENT dread — how much the shop remembers you across runs.
  const HAUNT_THRESHOLDS = [2, 5, 9, 14]; // haunt points -> level 1..4
  const ROUTE_GOOD = { teddy: "END_T_GOOD", candle: "END_C_GOOD", balloon: "END_B_GOOD", dragon: "END_D_GOOD" };

  let meta = defaultMeta();
  let run = null;

  function defaultMeta() {
    return {
      endingsFound: [],
      totalRuns: 0,
      visits: 0,              // times the shop has been entered (runs started)
      loops: 0,              // times the shop has wound you back (END_WOUND_BACK)
      unlockedSecrets: [],
      gallery: [],            // { route, clue }
      knowledge: [],          // truths gathered across runs (see CW.Truths)
      lastGift: null,         // the gift given at the end of the previous run (the shopkeeper remembers it)
      giftHistory: [],        // every gift ever given, oldest first
      seenIntro: false,       // has the atmospheric intro played once
      settings: { showLockedChoices: true, reduceMotion: false, textSpeed: "instant", musicOn: true, heroName: "Milo", friendName: "June" },
    };
  }

  /* ---- meta persistence ------------------------------------------------- */
  function loadMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        meta = Object.assign(defaultMeta(), p);
        meta.settings = Object.assign(defaultMeta().settings, p.settings || {});
      }
    } catch (e) { /* fresh */ }
    return meta;
  }
  function saveMeta() {
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
  }
  function getMeta() { return meta; }
  function getSettings() { return meta.settings; }
  function introSeen() { return !!meta.seenIntro; }
  function markIntroSeen() { meta.seenIntro = true; saveMeta(); }
  function setSetting(key, value) {
    meta.settings[key] = value;
    saveMeta();
  }

  /* ---- run lifecycle ---------------------------------------------------- */
  function newRun() {
    run = {
      currentNodeId: CW.START_NODE,
      stats: { wisdom: 1, intelligence: 1, perception: 1, strength: 1 },
      inventory: [],
      flags: {},
      chosenGift: null,
      visitedNodes: [],
      choiceHistory: [],       // { nodeId, choiceId, text, deltas:[{stat,amount}], setFlags:[] }
      dreadPoints: 0,
      dreadLevel: 0,           // 0..4, monotonic within a run
      bond: 1,                 // the bracelet: 0 (snapped) .. 6 (rebraided whole); starts as one frayed thread
    };
    // Bridge meta unlocks into run flags so data requirements can gate on them.
    if (meta.unlockedSecrets.includes("fifthAisle")) run.flags.fifthAisleUnlocked = true;
    if (meta.unlockedSecrets.includes("trueEnding")) run.flags.trueEndingReady = true;
    if (meta.unlockedSecrets.includes("theWayBack")) run.flags.wayBackKnown = true;
    // Bridge gathered truths so cellar reveals can gate on them.
    meta.knowledge.forEach((t) => { run.flags["know_" + t] = true; });
    // The shop remembers you: entering counts as a visit, and haunted players
    // start a run already partway into the dread (the shop is wrong for them).
    meta.visits = (meta.visits || 0) + 1;
    run.dreadLevel = baselineDread();
    saveMeta();
    clearSavedRun();
    return run;
  }
  function getRun() { return run; }

  function saveRun() {
    if (!run) return;
    try { localStorage.setItem(RUN_KEY, JSON.stringify(run)); } catch (e) {}
  }
  function hasSavedRun() {
    try { return !!localStorage.getItem(RUN_KEY); } catch (e) { return false; }
  }
  function loadRun() {
    try {
      const raw = localStorage.getItem(RUN_KEY);
      if (!raw) return null;
      run = JSON.parse(raw);
      return run;
    } catch (e) { return null; }
  }
  function clearSavedRun() {
    try { localStorage.removeItem(RUN_KEY); } catch (e) {}
  }

  /* ---- run mutations ---------------------------------------------------- */
  function statValue(k) { return run ? (run.stats[k] || 0) : 0; }

  // Apply a delta map {wisdom:1}. sign -1 = spend. Returns applied changes.
  function applyStats(map, sign) {
    const applied = [];
    if (!map || !run) return applied;
    const s = sign || 1;
    for (const k of Object.keys(map)) {
      if (run.stats[k] === undefined) continue;
      const before = run.stats[k];
      run.stats[k] = Math.max(STAT_MIN, Math.min(STAT_MAX, before + map[k] * s));
      const change = run.stats[k] - before;
      if (change !== 0) applied.push({ stat: k, amount: change });
    }
    return applied;
  }
  function setFlags(map) { if (map && run) for (const k of Object.keys(map)) run.flags[k] = map[k]; }
  function removeFlags(map) { if (map && run) for (const k of Object.keys(map)) delete run.flags[k]; }
  function hasFlag(k) { return run ? !!run.flags[k] : false; }
  function addInventory(items) { if (items && run) items.forEach((i) => { if (!run.inventory.includes(i)) run.inventory.push(i); }); }
  function removeInventory(items) { if (items && run) run.inventory = run.inventory.filter((i) => !items.includes(i)); }
  function hasInventory(i) { return run ? run.inventory.includes(i) : false; }
  function setGift(g) { if (run) run.chosenGift = g; }
  function pushHistory(entry) { if (run) run.choiceHistory.push(entry); }
  function visit(nodeId) { if (run) run.visitedNodes.push(nodeId); }

  /* ---- dread / the descent --------------------------------------------- */
  // Recompute how deep+dark this run has gotten. Rises with depth (nodes seen),
  // dark choices, and a node's own `dread` floor. Never decreases in a run.
  function updateDread(node) {
    if (!run) return 0;
    let pts = run.visitedNodes.length;
    for (const f of DARK_FLAGS) if (run.flags[f]) pts += 2;
    run.dreadPoints = Math.max(run.dreadPoints || 0, pts);
    let lvl = 0;
    for (let i = 0; i < DREAD_THRESHOLDS.length; i++) if (run.dreadPoints >= DREAD_THRESHOLDS[i]) lvl = i + 1;
    if (node && node.dread) lvl = Math.max(lvl, node.dread);
    run.dreadLevel = Math.max(run.dreadLevel || 0, lvl);
    return run.dreadLevel;
  }
  function dreadLevel() { return run ? (run.dreadLevel || 0) : 0; }

  /* ---- the bracelet (bond with the friend) ----------------------------- */
  const BOND_MAX = 6;
  function applyBond(delta) {
    if (!run || !delta) return 0;
    if (run.flags.braceletSnapped) return 0; // once the last thread is gone, it's gone
    const before = run.bond;
    run.bond = Math.max(0, Math.min(BOND_MAX, before + delta));
    if (run.bond <= 0) run.flags.braceletSnapped = true;
    if (run.bond >= BOND_MAX) run.flags.braceletWhole = true;
    return run.bond - before;
  }
  function bondValue() { return run ? (run.bond || 0) : 0; }
  function bondMax() { return BOND_MAX; }

  /* ---- haunt: what the shop remembers across runs ---------------------- */
  function nightmareCount() {
    return meta.endingsFound.filter((id) => CW.Endings[id] && CW.Endings[id].category === "Nightmare").length;
  }
  function hauntLevel() {
    const pts = (meta.totalRuns || 0) + 2 * nightmareCount() + 3 * (meta.loops || 0);
    let lvl = 0;
    for (let i = 0; i < HAUNT_THRESHOLDS.length; i++) if (pts >= HAUNT_THRESHOLDS[i]) lvl = i + 1;
    return lvl;
  }
  function baselineDread() { return Math.max(0, Math.min(2, hauntLevel() - 1)); }
  function getVisits() { return meta.visits || 0; }
  function getLoops() { return meta.loops || 0; }
  function cellarCount() { return 41 + (meta.loops || 0); } // the shop's count of you

  /* ---- the truth (knowledge gathered across runs) ---------------------- */
  function allTruths() { return CW.Truths ? Object.keys(CW.Truths) : []; }
  function hasKnowledge(k) { return meta.knowledge.indexOf(k) > -1; }
  function knowledgeCount() { return meta.knowledge.length; }
  function truthsTotal() { return allTruths().length; }
  // Returns { learned, completed } — learned = new to this run's meta,
  // completed = this was the truth that finished the set.
  function learnKnowledge(k) {
    if (!k || !CW.Truths || !CW.Truths[k] || hasKnowledge(k)) return { learned: false, completed: false };
    meta.knowledge.push(k);
    let completed = false;
    if (!meta.unlockedSecrets.includes("theWayBack") && allTruths().every((t) => hasKnowledge(t))) {
      meta.unlockedSecrets.push("theWayBack");
      completed = true;
    }
    saveMeta();
    return { learned: true, completed: completed };
  }

  /* ---- endings / meta-progression (§17) --------------------------------- */
  function recordEnding(endingId) {
    const ending = CW.Endings[endingId];
    if (!ending) return { isNew: false, ending: null, newlyUnlocked: [] };

    const isNew = !meta.endingsFound.includes(endingId);
    const newlyUnlocked = [];
    if (isNew) {
      meta.endingsFound.push(endingId);
      if (ending.clue) meta.gallery.push({ route: ending.route, clue: ending.clue });
    }
    meta.totalRuns += 1;
    if (endingId === "END_WOUND_BACK") meta.loops = (meta.loops || 0) + 1;

    // The shopkeeper remembers what you handed over: keep this run's gift so he
    // can throw it back at you next time (see CW.Shopkeeper).
    if (run && run.chosenGift) {
      meta.lastGift = run.chosenGift;
      meta.giftHistory = (meta.giftHistory || []).concat(run.chosenGift);
    }

    // Some endings teach a truth toward the way back to June.
    const truthId = CW.EndingKnowledge && CW.EndingKnowledge[endingId];
    if (truthId) {
      const k = learnKnowledge(truthId);
      if (k.learned) newlyUnlocked.push('You learned something true: "' + CW.Truths[truthId].title + '"');
      if (k.completed) newlyUnlocked.push("You know the whole truth now. A way back to June has opened, deep in the fifth aisle.");
    }

    // The fifth aisle unlocks after one ending from each gift route.
    if (!meta.unlockedSecrets.includes("fifthAisle") && ROUTES.every(routeHasEnding)) {
      meta.unlockedSecrets.push("fifthAisle");
      newlyUnlocked.push("The Fifth Aisle is now open. A cat may lead you there.");
    }
    // The true ending readies after all four route "good" endings are found.
    if (!meta.unlockedSecrets.includes("trueEnding") &&
        Object.values(ROUTE_GOOD).every((id) => meta.endingsFound.includes(id))) {
      meta.unlockedSecrets.push("trueEnding");
      newlyUnlocked.push("You now know enough to break the store's curse.");
    }

    clearSavedRun(); // the run is over
    saveMeta();
    return { isNew, ending, newlyUnlocked };
  }

  function routeHasEnding(route) {
    return meta.endingsFound.some((id) => CW.Endings[id] && CW.Endings[id].route === route);
  }
  function isFound(id) { return meta.endingsFound.includes(id); }
  function foundCount() { return meta.endingsFound.length; }
  function totalEndings() { return Object.keys(CW.Endings).length; }

  function wipe() {
    meta = defaultMeta();
    saveMeta();
    clearSavedRun();
  }

  return {
    STAT_MAX, ROUTES,
    loadMeta, saveMeta, getMeta, getSettings, setSetting, introSeen, markIntroSeen,
    newRun, getRun, saveRun, hasSavedRun, loadRun, clearSavedRun,
    statValue, applyStats, setFlags, removeFlags, hasFlag,
    addInventory, removeInventory, hasInventory, setGift, pushHistory, visit,
    updateDread, dreadLevel, applyBond, bondValue, bondMax,
    hauntLevel, baselineDread, getVisits, getLoops, cellarCount, nightmareCount,
    hasKnowledge, knowledgeCount, truthsTotal, learnKnowledge, allTruths,
    recordEnding, isFound, foundCount, totalEndings, wipe,
  };
})();
