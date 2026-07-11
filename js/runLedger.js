/* ============================================================================
 * runLedger.js  -  the night's account. When a run ends, the shopkeeper reads
 * the whole descent back as ledger entries before the ending card is shown —
 * each line assembled from what the player actually did this run, written to
 * his three voice laws (shop terms only; never the same address twice; no
 * question he does not already hold the answer to).
 *
 * Pure content: pageFor(run, ending) returns { entries, balance } and touches
 * no DOM — the view (uiController) writes the page in.
 * ========================================================================== */
window.CW = window.CW || {};

CW.RunLedger = (function () {
  // The purchase, as he records it.
  const GIFT_LINES = {
    talking_teddy:       "One bear, secondhand, still warm from its last four owners. Sold as seen.",
    wish_candle:         "One candle, one wish enclosed. No refund once lit.",
    everlasting_balloon: "One balloon, everlasting. Buyer advised: everlasting is not the same as staying.",
    clockwork_dragon:    "One dragon, clockwork, memory included. Wound by the customer's own hand.",
  };

  // The real merchandise, appraised at closing.
  function braceletLine(run) {
    const f = run.flags || {};
    if (f.braceletSnapped) return "One thread, snapped. Disposal free of charge.";
    if (f.braceletWhole) return "One bracelet, rebraided whole. Appraised well above my pricing; item withheld from sale.";
    if ((run.bond || 0) >= 4) return "One bracelet, mended in places. The mending is noted. So is the fraying.";
    return "One bracelet, down to a single thread. Kept at the till, as good as mine.";
  }

  // What else the night put on the account (rarest and warmest first).
  function deedLines(run) {
    const f = run.flags || {}, out = [];
    if (f.rememberedJune || f.clutchedThread) out.push("One warm memory of her, handled. Fingerprints noted.");
    if (f.rehearsedSorry) out.push("One apology, rehearsed the whole way here. Unspent at closing.");
    if (f.wishSpent) out.push("One wish, spent. On whom is recorded elsewhere on this page.");
    if (f.pushedItDown) out.push("Sundry feelings, pushed down. Storage provided at no charge. I keep everything.");
    if (f.sawBackRoom || f.readTheLedger || f.readOwnAccount) out.push("One look at my books, unpaid for. Curiosity is charged at cost.");
    if (f.noticedShadow) out.push("One second shadow, seen and not reported. Discretion appreciated.");
    if (f.sensedWrong) out.push("One warning, felt on the step and ignored. Standard.");
    if ((run.dreadLevel || 0) >= 3) out.push("Assorted dread, accrued on the premises. Non-transferable.");
    return out;
  }

  // He quotes your final choice back to you, verbatim, off the docket.
  function lastWords(run) {
    const h = run.choiceHistory || [];
    if (!h.length) return null;
    let t = (h[h.length - 1].text || "").trim();
    if (!t) return null;
    if (t.length > 64) t = t.slice(0, 63).replace(/\s+\S*$/, "") + "…";
    return "Last item on the docket: “" + t + "” Chosen freely. The register is particular about that word.";
  }

  // The sum at the bottom of the page, by how the night ended.
  const BALANCE = {
    good:      "BALANCE — settled in your favour. A rarity. I have marked the page so I remember the feeling.",
    bad:       "BALANCE — owed. Payable on your next visit. There is always a next visit.",
    cursed:    "BALANCE — carried forward. Some purchases keep paying, little account.",
    nightmare: "BALANCE — settled in full. The item received is you. Welcome to stock.",
    funny:     "BALANCE — written off. Even I cannot price whatever that was.",
    secret:    "BALANCE — this page was never meant to be read. I will pretend you did not open it. You will pretend the same.",
    true:      "BALANCE — closed. The whole account, closed. Go, before I recheck the arithmetic.",
  };

  function pageFor(run, ending) {
    if (!run) return null;
    const entries = [];
    entries.push(GIFT_LINES[run.chosenGift] || "Nothing purchased. The browsing, however, had value. To me.");
    entries.push(braceletLine(run));
    entries.push.apply(entries, deedLines(run).slice(0, 2));
    const lw = lastWords(run);
    if (lw) entries.push(lw);
    const cat = ((ending && ending.category) || "Good").toLowerCase();
    return { entries: entries.slice(0, 5), balance: BALANCE[cat] || BALANCE.good };
  }

  return { pageFor };
})();
