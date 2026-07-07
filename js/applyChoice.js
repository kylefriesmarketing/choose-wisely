/* ============================================================================
 * applyChoice.js  -  applies a chosen option to the RunState in the exact
 * order the brief expects: costs -> gains -> flags -> inventory -> gift, and
 * records the decision to choiceHistory. Returns the stat changes applied so
 * the UI can show feedback popups. Assumes the choice is already unlocked.
 * ========================================================================== */
window.CW = window.CW || {};

CW.ApplyChoice = (function () {
  const GS = () => CW.GameState;

  function apply(node, choice) {
    // 1. Spend costs.
    const spent = GS().applyStats(choice.costs, -1);
    // 2. Grant gains.
    const gained = GS().applyStats(choice.gains, 1);
    // 3. Flags.
    GS().setFlags(choice.setFlags);
    GS().removeFlags(choice.removeFlags);
    // 4. Inventory + chosen gift.
    GS().addInventory(choice.addInventory);
    GS().removeInventory(choice.removeInventory);
    if (choice.setFlags && choice.setFlags.chosenGift) GS().setGift(choice.setFlags.chosenGift);
    // 5. The bracelet: warm/cold choices mend or fray the bond.
    const bond = GS().applyBond(choice.bond);

    // 5b. Setting the other children free (see CW.Traces / the cellar wall).
    const freed = [];
    if (choice.freeChild) {
      const ids = Array.isArray(choice.freeChild) ? choice.freeChild : [choice.freeChild];
      ids.forEach((id) => { if (GS().freeChild(id).freed) freed.push(GS().childName(id)); });
    }

    // 6. Record what mattered.
    const deltas = spent.concat(gained);
    GS().pushHistory({
      nodeId: node.id,
      choiceId: choice.id,
      text: choice.text,
      deltas: deltas,
      setFlags: choice.setFlags ? Object.keys(choice.setFlags) : [],
    });

    return { deltas: deltas, bond: bond, freed: freed };
  }

  // Node-enter effects (statChanges / setFlags / addInventory / learn).
  function applyNodeEffects(node) {
    const e = node.effects || {};
    const applied = GS().applyStats(e.statChanges, 1);
    GS().setFlags(e.setFlags);
    GS().addInventory(e.addInventory);
    if (e.learn) e.learn.forEach((k) => GS().learnKnowledge(k));
    return applied;
  }

  return { apply, applyNodeEffects };
})();
