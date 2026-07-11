/* Story-graph QA: run with `node tools/validate.js` (portable node at ~/tools/node).
 * Checks: dangling nextNodeIds, unreachable nodes, untargeted endings,
 * stinger coverage, and required-flags-never-set contracts. */
const fs = require("fs");
const base = "C:/Users/kylef/Downloads/New folder/choose-wisely/js/";
const src = f => fs.readFileSync(base + f, "utf8");
var window = {}; var CW;
eval("CW = window.CW = {};" + src("storyData.js") + src("stingers.js"));
const N = CW.StoryNodes, E = CW.Endings, S = CW.EndingStingers;
let errs = [];
// 1. every nextNodeId resolves
for (const id in N) for (const c of (N[id].choices||[])) {
  if (!N[c.nextNodeId] && !E[c.nextNodeId]) errs.push("dangling: " + id + "/" + c.id + " -> " + c.nextNodeId);
}
// 2. reachability from START (ignore requirements)
const start = CW.START_NODE || "PRE_1";
const seen = new Set([start]); const q = [start];
while (q.length) { const n = N[q.shift()]; if (!n) continue;
  for (const c of (n.choices||[])) { if (N[c.nextNodeId] && !seen.has(c.nextNodeId)) { seen.add(c.nextNodeId); q.push(c.nextNodeId); } } }
const unreachable = Object.keys(N).filter(k => !seen.has(k));
// 3. every ending reachable from some choice
const targeted = new Set();
for (const id in N) for (const c of (N[id].choices||[])) if (E[c.nextNodeId]) targeted.add(c.nextNodeId);
const orphanEndings = Object.keys(E).filter(k => !targeted.has(k));
// 4. stinger coverage
const noSting = Object.keys(E).filter(k => !S[k]);
const orphanSting = Object.keys(S).filter(k => !E[k]);
// 5. new wings present
["T_OWNERS","C_WICKS","B_MOORINGS","D_WINDDOWN"].forEach(k => { if (!N[k]) errs.push("missing wing: " + k); if (!seen.has(k)) errs.push("unreachable wing: " + k); });
console.log("nodes:", Object.keys(N).length, "endings:", Object.keys(E).length);
console.log("errors:", errs.length ? errs : "none");
console.log("unreachable nodes:", unreachable.length ? unreachable : "none");
console.log("endings never targeted by a choice:", orphanEndings.length ? orphanEndings : "none");
console.log("endings w/o stinger:", noSting.length ? noSting : "none", "| stinger orphans:", orphanSting.length ? orphanSting : "none");

// 6. flag contract: every flag required by a choice must be set somewhere
const set = new Set(["chosenGift"]);
const ENGINE = /^(know_|freed_)/; const ENGINE_LIST = ["fifthAisleUnlocked","trueEndingReady","wayBackKnown","allChildrenFreed","braceletSnapped","braceletWhole"];
for (const id in N) { const n = N[id];
  if (n.effects && n.effects.setFlags) Object.keys(n.effects.setFlags).forEach(f => set.add(f));
  for (const c of (n.choices||[])) if (c.setFlags) Object.keys(c.setFlags).forEach(f => set.add(f));
}
const required = new Set();
for (const id in N) for (const c of (N[id].choices||[])) if (c.requirements && c.requirements.flags) Object.keys(c.requirements.flags).forEach(f => required.add(f));
const unset = [...required].filter(f => !set.has(f) && !ENGINE.test(f) && ENGINE_LIST.indexOf(f) === -1);
console.log("required flags never set (excl. engine):", unset.length ? unset : "none");
// 7. flags set but never read anywhere in the codebase is out of scope here (read by js modules)
