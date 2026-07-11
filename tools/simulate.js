/* Playthrough simulator: runs the REAL game modules headless (portable node)
 * and plays scripted routes through each Route Wing to an ending, asserting
 * truths, flags, ledger output, stingers, and the counter-voices fire.
 * Usage: node tools/simulate.js  (from the choose-wisely folder) */
const fs = require("fs");
const read = f => fs.readFileSync(__dirname + "/../js/" + f, "utf8");
// shims
var store = {};
var localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
var window = { addEventListener: () => {}, location: {} };
var document = { addEventListener: () => {}, hidden: false, body: { classList: { contains: () => false } }, getElementById: () => null };
var CW;
eval("CW = window.CW = {};" +
  read("storyData.js") + read("gameState.js") + read("requirements.js") + read("applyChoice.js") +
  read("stingers.js") + read("runLedger.js") + read("shopkeeper.js") + read("bracelet.js"));

const GS = CW.GameState, N = CW.StoryNodes;
let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log("  FAIL:", msg); } };

function walk(path, label, boostStats) {
  store = {}; // fresh save space
  GS.newRun();
  const run = GS.getRun();
  Object.assign(run.stats, boostStats || {});
  let cur = N[path[0]];
  CW.ApplyChoice.applyNodeEffects(cur);
  for (let i = 1; i < path.length; i++) {
    const want = path[i];
    const choice = (cur.choices || []).find(c => c.nextNodeId === want && !CW.Requirements.isLocked(c));
    if (!choice) {
      fails++;
      console.log("  FAIL: no unlocked edge " + cur.id + " -> " + want + " (targets: " + (cur.choices || []).map(c => c.nextNodeId).join(",") + ")");
      return null;
    }
    CW.ApplyChoice.apply(cur, choice);
    if (CW.Endings[want]) { console.log("  reached ending " + want); return { run: run, ending: CW.Endings[want] }; }
    cur = N[want];
    CW.ApplyChoice.applyNodeEffects(cur);
  }
  return { run: run, node: cur };
}

const BOOST = { wisdom: 4, perception: 4, intelligence: 4, strength: 4 };
const RUNS = [
  { label: "teddy/T_OWNERS", truth: "truth_count", flag: "sawFourOwners",
    path: ["PRE_1","PRE_2","PRE_3","S00_OUTSIDE_SHOP","S01_ENTER_SHOP","S02_FOUR_GIFTS","S03_SHOPKEEPER_WARNING","S04_CHOOSE_GIFT","TM_TEDDY","T01","T02","T_OWNERS","END_T_BAD"] },
  { label: "candle/C_WICKS", truth: "truth_trade", flag: "sawWickDrawer",
    path: ["PRE_1","PRE_2","PRE_3","S00_OUTSIDE_SHOP","S01_ENTER_SHOP","S02_FOUR_GIFTS","S03_SHOPKEEPER_WARNING","S04_CHOOSE_GIFT","TM_CANDLE","C01","C02","C_WICKS","END_C_SNUFFED"] },
  { label: "balloon/B_MOORINGS", truth: "truth_loop", flag: "sawMoorings",
    path: ["PRE_1","PRE_2","PRE_3","S00_OUTSIDE_SHOP","S01_ENTER_SHOP","S02_FOUR_GIFTS","S03_SHOPKEEPER_WARNING","S04_CHOOSE_GIFT","TM_BALLOON","B01","B02","B_MOORINGS","END_B_ANCHORED"] },
  { label: "dragon/D_WINDDOWN", truth: "truth_keeper", flag: "sawWindDown",
    path: ["PRE_1","PRE_2","PRE_3","S00_OUTSIDE_SHOP","S01_ENTER_SHOP","S02_FOUR_GIFTS","S03_SHOPKEEPER_WARNING","S04_CHOOSE_GIFT","TM_DRAGON","D01","D02","D_WINDDOWN","END_D_BAD"] },
];

for (const r of RUNS) {
  console.log("RUN " + r.label);
  const res = walk(r.path, r.label, BOOST);
  if (!res) continue;
  const run = GS.getRun(), meta = GS.getMeta();
  ok(meta.knowledge.indexOf(r.truth) > -1, r.truth + " not learned (have: " + meta.knowledge.join(",") + ")");
  ok(run.flags[r.flag], r.flag + " not set");
  ok(!!res.ending, "no ending object");
  if (res.ending) {
    ok(!!CW.EndingStingers[res.ending.id], "no stinger for " + res.ending.id);
    const page = CW.RunLedger.pageFor(run, res.ending);
    ok(page && page.entries.length >= 2 && page.balance, "ledger page malformed");
  }
  // counter-voices on the wing node (aside first, with neutral bond, so the
  // bracelet rules don't legitimately outrank route_follow)
  const wing = r.path[r.path.length - 2];
  run.dreadLevel = 2; run.bond = 0; run.flags.braceletWhole = false;
  const aside = CW.Shopkeeper.asideFor({ id: wing + "_X", theme: N[wing].theme });
  ok(aside && aside.rule === "route_follow" && aside.voiceKey === "SK_ROUTE_" + N[wing].theme.toUpperCase(), "route_follow aside/voice wrong in " + wing + " (got " + (aside && aside.rule) + ")");
  run.bond = 5;
  const moment = CW.BraceletVoice.answerFor(N[wing], null);
  ok(moment && moment.kind === "moment", "no bracelet moment in " + wing);
}
console.log(fails ? "FAILURES: " + fails : "ALL PASS");
process.exit(fails ? 1 : 0);
