/* ============================================================================
 * debug.js  -  developer tools. Node jump, stat editor, flag viewer, ending
 * tester, and a content validator. Toggle with the 🛠 button or `~`.
 * ========================================================================== */
window.CW = window.CW || {};

CW.Debug = (function () {
  const GS = () => CW.GameState;
  let panel = null;
  let open = false;

  function init() {
    panel = document.getElementById("debug-panel");
    document.getElementById("btn-debug").addEventListener("click", toggle);
    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if ((e.key === "`" || e.key === "~") && tag !== "input" && tag !== "select") toggle();
    });
    build();
  }

  function toggle() { open = !open; panel.classList.toggle("open", open); if (open) refresh(); }

  function build() {
    panel.innerHTML = `
      <div class="dbg-head">🛠 Developer Tools <button id="dbg-close">✕</button></div>
      <div class="dbg-section">
        <label>Node Jump</label>
        <div class="dbg-row">
          <input id="dbg-node" list="dbg-nodelist" placeholder="e.g. T04" />
          <datalist id="dbg-nodelist"></datalist>
          <button id="dbg-go">Go</button>
        </div>
      </div>
      <div class="dbg-section">
        <label>Stat Editor</label>
        <div id="dbg-stats" class="dbg-stats"></div>
        <button id="dbg-apply-stats">Apply stats</button>
      </div>
      <div class="dbg-section">
        <label>Flag Viewer</label>
        <div id="dbg-flags" class="dbg-flags"></div>
      </div>
      <div class="dbg-section">
        <label>Ending Tester</label>
        <div class="dbg-row">
          <select id="dbg-ending"></select>
          <button id="dbg-trigger">Trigger</button>
        </div>
      </div>
      <div class="dbg-section">
        <label>Choice Validator</label>
        <div class="dbg-row"><button id="dbg-validate">Scan all nodes</button></div>
        <div id="dbg-report" class="dbg-report"></div>
      </div>
      <div class="dbg-section dbg-row">
        <button id="dbg-reset">New run</button>
        <button id="dbg-wipe" class="danger">Wipe save</button>
      </div>
    `;

    const dl = panel.querySelector("#dbg-nodelist");
    Object.keys(CW.StoryNodes).forEach((id) => { const o = document.createElement("option"); o.value = id; dl.appendChild(o); });

    const sel = panel.querySelector("#dbg-ending");
    Object.keys(CW.Endings).forEach((id) => { const o = document.createElement("option"); o.value = id; o.textContent = "#" + CW.Endings[id].number + " " + CW.Endings[id].title; sel.appendChild(o); });

    const statBox = panel.querySelector("#dbg-stats");
    CW.STATS.forEach((k) => { const w = document.createElement("label"); w.className = "dbg-stat"; w.innerHTML = k + ' <input type="number" min="0" max="10" data-stat="' + k + '" />'; statBox.appendChild(w); });

    panel.querySelector("#dbg-close").addEventListener("click", toggle);
    panel.querySelector("#dbg-go").addEventListener("click", () => {
      const id = panel.querySelector("#dbg-node").value.trim();
      if (!CW.StoryEngine.jumpTo(id)) CW.UIController.toast("No node/ending: " + id);
      refresh();
    });
    panel.querySelector("#dbg-apply-stats").addEventListener("click", () => {
      panel.querySelectorAll("#dbg-stats input").forEach((inp) => {
        const k = inp.getAttribute("data-stat");
        const target = Math.max(0, Math.min(10, parseInt(inp.value, 10) || 0));
        const delta = {}; delta[k] = target - GS().statValue(k);
        GS().applyStats(delta, 1);
      });
      CW.StoryEngine.rerenderCurrent(); refresh();
    });
    panel.querySelector("#dbg-trigger").addEventListener("click", () => CW.StoryEngine.reachEnding(panel.querySelector("#dbg-ending").value));
    panel.querySelector("#dbg-validate").addEventListener("click", validate);
    panel.querySelector("#dbg-reset").addEventListener("click", () => { CW.StoryEngine.startNewRun(); refresh(); });
    panel.querySelector("#dbg-wipe").addEventListener("click", () => { GS().wipe(); CW.UIController.renderStats(); CW.UIController.toast("Save wiped."); refresh(); });
  }

  function refresh() {
    if (!GS().getRun()) return;
    panel.querySelectorAll("#dbg-stats input").forEach((inp) => { inp.value = GS().statValue(inp.getAttribute("data-stat")); });
    const flags = GS().getRun().flags;
    const keys = Object.keys(flags);
    panel.querySelector("#dbg-flags").textContent = keys.length ? keys.map((k) => k + "=" + flags[k]).join("  ") : "(none set)";
  }

  /* ---- validator -------------------------------------------------------- */
  function validate() {
    const report = [];
    const nodes = CW.StoryNodes, endings = CW.Endings;
    const referenced = new Set();
    const MAX = GS().STAT_MAX;

    function checkStats(map, nodeId, kind, ci) {
      if (!map) return;
      for (const k of Object.keys(map)) {
        if (!CW.STATS.includes(k)) report.push({ level: "error", msg: nodeId + " choice " + ci + ": unknown stat '" + k + "' in " + kind });
        else if (kind === "requires" && map[k] > MAX) report.push({ level: "error", msg: nodeId + " choice " + ci + ": impossible requirement " + k + " " + map[k] + " > " + MAX });
      }
    }

    Object.keys(nodes).forEach((nodeId) => {
      const node = nodes[nodeId];
      if (!node.choices || !node.choices.length) { report.push({ level: "warn", msg: nodeId + ": no choices" }); return; }
      node.choices.forEach((c, i) => {
        if (!c.nextNodeId) report.push({ level: "error", msg: nodeId + " choice " + i + ": missing nextNodeId" });
        else if (!nodes[c.nextNodeId] && !endings[c.nextNodeId]) report.push({ level: "error", msg: nodeId + " choice " + i + ": nextNodeId '" + c.nextNodeId + "' does not exist" });
        else referenced.add(c.nextNodeId);
        if (c.requirements) checkStats(c.requirements.stats, nodeId, "requires", i);
        checkStats(c.costs, nodeId, "costs", i);
        checkStats(c.gains, nodeId, "gains", i);
      });
    });

    Object.keys(endings).forEach((id) => { if (!referenced.has(id)) report.push({ level: "warn", msg: "Ending '" + id + "' is never reachable from any choice" }); });
    Object.keys(nodes).forEach((id) => { if (id !== CW.START_NODE && !referenced.has(id)) report.push({ level: "warn", msg: "Node '" + id + "' is never referenced (orphan)" }); });

    const box = panel.querySelector("#dbg-report");
    box.innerHTML = report.length
      ? report.map((r) => '<div class="' + r.level + '">' + (r.level === "error" ? "✕ " : "! ") + r.msg + "</div>").join("")
      : '<div class="ok">✓ ' + Object.keys(nodes).length + " nodes and " + Object.keys(endings).length + " endings check out.</div>";
    console.log("[Choose Wisely] Validator:", report.length ? report : "clean");
    return report;
  }

  return { init, validate };
})();
