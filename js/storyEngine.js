/* ============================================================================
 * storyEngine.js  -  the reusable branching-story engine. Contains no story
 * content: it walks StoryNodes / Endings from storyData.js. Add content there,
 * never here.
 *
 * Choice flow (brief §20): check requirements -> if locked, explain, don't
 * advance -> apply costs/gains/flags/inventory -> record -> load next node or
 * ending -> update UI. The run auto-saves on every node so "Continue" works.
 * ========================================================================== */
window.CW = window.CW || {};

CW.StoryEngine = (function () {
  const GS = () => CW.GameState;

  function startNewRun() {
    GS().newRun();
    enterNode(CW.START_NODE, { silent: true });
  }

  function continueRun() {
    const run = GS().loadRun();
    if (!run) { startNewRun(); return false; }
    // Render the saved node without re-applying its enter effects.
    enterNode(run.currentNodeId, { silent: true, replay: true });
    return true;
  }

  function enterNode(nodeId, opts) {
    opts = opts || {};
    if (!CW.StoryNodes[nodeId]) {
      if (CW.Endings[nodeId]) return reachEnding(nodeId);
      console.error("Unknown nextNodeId:", nodeId);
      return;
    }
    const node = CW.StoryNodes[nodeId];
    GS().getRun().currentNodeId = nodeId;
    GS().visit(nodeId);

    let applied = [];
    if (!opts.replay) applied = CW.ApplyChoice.applyNodeEffects(node);

    CW.SceneManager.showScene(node);
    if (CW.Cast) CW.Cast.render(node);
    if (CW.Faces) CW.Faces.render(node);
    if (CW.Audio && CW.Audio.playCue) CW.Audio.playCue(node.musicCue);
    if (CW.Dread) CW.Dread.update(node);
    CW.UIController.renderNode(node);
    CW.UIController.renderStats();
    CW.UIController.renderInventory();
    GS().saveRun();

    if (!opts.silent && applied.length) CW.UIController.showStatPopups(applied);
  }

  function chooseChoice(node, choice) {
    if (CW.Requirements.isLocked(choice)) {
      const d = CW.Requirements.describe(choice);
      CW.Audio.play("locked");
      CW.UIController.flashLocked(d.lockedText);
      return;
    }
    CW.Audio.play("choose");
    const res = CW.ApplyChoice.apply(node, choice);
    const deltas = res.deltas;
    if (deltas.length) {
      CW.UIController.showStatPopups(deltas);
      if (deltas.some((d) => d.amount > 0)) CW.Audio.play("gain");
      if (deltas.some((d) => d.amount < 0)) CW.Audio.play("lose");
    }
    if (res.bond) {
      CW.UIController.showBondChange(res.bond);
      CW.Audio.play(res.bond > 0 ? "mend" : "fray");
    }
    if (res.freed && res.freed.length) {
      const n = GS().freedCount(), t = GS().childrenTotal();
      CW.UIController.toast("You set " + res.freed.join(" and ") + " free.  (" + n + " of " + t + " children)");
      CW.Audio.play("mend");
    }
    CW.UIController.renderStats();
    CW.UIController.renderInventory();
    enterNode(choice.nextNodeId);
  }

  function reachEnding(endingId) {
    const result = GS().recordEnding(endingId);
    const cat = result.ending ? result.ending.category : "Good";
    CW.Audio.playEndSting(cat, endingId);
    CW.UIController.showEnding(result);
  }

  /* ---- debug / accessors ------------------------------------------------ */
  function currentNode() {
    const run = GS().getRun();
    return run ? CW.StoryNodes[run.currentNodeId] : null;
  }
  function jumpTo(nodeId) {
    if (CW.StoryNodes[nodeId]) { enterNode(nodeId, { silent: true, replay: true }); return true; }
    if (CW.Endings[nodeId]) { reachEnding(nodeId); return true; }
    return false;
  }
  function rerenderCurrent() {
    const node = currentNode();
    if (node) { CW.UIController.renderNode(node); CW.UIController.renderStats(); CW.UIController.renderInventory(); }
  }

  return { startNewRun, continueRun, enterNode, chooseChoice, reachEnding, currentNode, jumpTo, rerenderCurrent };
})();
