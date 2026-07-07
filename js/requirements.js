/* ============================================================================
 * requirements.js  -  decides whether a choice is available, and builds the
 * labels the UI shows (requirement / cost / gain / preview / locked reason).
 * Pure, data-driven: it reads the choice + current RunState, decides nothing
 * about presentation.
 * ========================================================================== */
window.CW = window.CW || {};

CW.Requirements = (function () {
  const GS = () => CW.GameState;
  const NAMES = { wisdom: "Wisdom", intelligence: "Intelligence", perception: "Perception", strength: "Strength" };

  function cap(k) { return NAMES[k] || k; }

  function fmt(map, sign) {
    if (!map) return "";
    return Object.keys(map).map((k) => (sign ? (map[k] > 0 ? "+" : "") + map[k] : map[k]) + " " + cap(k)).join(", ");
  }

  // Reasons a choice is locked, in priority order. Returns "" if unlocked.
  function lockReason(choice) {
    const req = choice.requirements || {};

    // chosenGift is a hard branch gate.
    if (req.chosenGift && GS().getRun().chosenGift !== req.chosenGift) return "gift";

    // minDread: a choice/door that only reveals itself once the descent is deep enough.
    if (req.minDread && GS().dreadLevel() < req.minDread) return "dread";

    // minHaunt: something the shop only offers once it remembers you (across runs).
    if (req.minHaunt && GS().hauntLevel() < req.minHaunt) return "haunt";

    if (req.stats) {
      for (const k of Object.keys(req.stats)) {
        if (GS().statValue(k) < req.stats[k]) return "stats";
      }
    }
    if (req.flags) {
      for (const k of Object.keys(req.flags)) {
        if (!!GS().hasFlag(k) !== !!req.flags[k]) return "flags";
      }
    }
    if (req.inventoryIncludes) {
      for (const item of req.inventoryIncludes) {
        if (!GS().hasInventory(item)) return "inventory";
      }
    }
    // Must be able to pay costs.
    if (choice.costs) {
      for (const k of Object.keys(choice.costs)) {
        if (GS().statValue(k) < choice.costs[k]) return "cost";
      }
    }
    return "";
  }

  function isLocked(choice) { return lockReason(choice) !== ""; }

  // Everything the UI needs to draw the button.
  function describe(choice) {
    const req = choice.requirements || {};
    const reqLabel = req.stats ? "Requires " + fmt(req.stats) : "";
    const costLabel = choice.costs ? "Costs " + fmt(choice.costs) : "";
    const gainLabel = choice.gains ? fmt(choice.gains, true) : "";
    const reason = lockReason(choice);
    const locked = reason !== "";

    let lockedText = "";
    if (locked) {
      if (choice.lockedText) lockedText = choice.lockedText;
      else if (reason === "stats") lockedText = "You don't meet: " + reqLabel + ".";
      else if (reason === "cost") lockedText = "You can't afford: " + costLabel + ".";
      else lockedText = "You cannot choose this yet.";
    }

    return {
      text: choice.text,
      preview: choice.previewText || [reqLabel, costLabel, gainLabel].filter(Boolean).join("  ·  "),
      reqLabel, costLabel, gainLabel,
      locked,
      lockReason: reason,
      lockedText,
      hideWhenLocked: !!choice.hideWhenLocked,
    };
  }

  return { isLocked, lockReason, describe, fmt, cap };
})();
