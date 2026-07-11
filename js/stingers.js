/* ============================================================================
 * stingers.js  -  the shop gets the last word. A few seconds after an ending
 * card settles, one more line inks in beneath the text: the shopkeeper's
 * margin note against your account. Unvoiced on purpose (the recorded ending
 * narration stays verbatim; this arrives after it, in silence, like a stamp).
 *
 * Written to his voice laws: shop terms, no question he can't answer, and no
 * repeated address — most notes address no one at all. Dry. Ledger-final.
 * ========================================================================== */
window.CW = window.CW || {};

CW.EndingStingers = {
  /* Teddy */
  END_T_GOOD: "Returned to sender, after all these years. I do hate a happy customer.",
  END_T_BAD: "New stock: one bear, hardly used. The window has never looked better.",
  END_T_FUNNY: "Sold as seen. Volume is not a defect.",

  /* Candle */
  END_C_GOOD: "One wish, spent on somebody else. I keep trying to stock that. It will not sit on a shelf.",
  END_C_CURSED: "The perfect party, delivered exactly as ordered. Read your receipts, children.",
  END_C_SECRET: "Merchandise returned unlit. Technically within policy. I am rewriting the policy.",

  /* Balloon */
  END_B_GOOD: "Delivered by air, no extra charge. The sky owed me one.",
  END_B_BAD: "All sales are final. So, I'm afraid, is altitude.",
  END_B_FUNNY: "The balloon outsold you at your own party. I could have told you that at the till.",

  /* Dragon */
  END_D_GOOD: "Loyalty: carried, not wound. Discontinued item. Do not ask me to restock it.",
  END_D_BAD: "A warranty voided is such a tidy little sound. Tick. Tick. Tick.",
  END_D_SECRET: "It remembered its first child. Fine. Keep it. Sentimental stock sells poorly anyway.",

  /* Shop / meta */
  END_DISPLAY_PRISONER: "Five in the window now. The waving one draws such crowds.",
  END_FIFTH_GIFT: "Inventory notes one key missing. Inventory is not concerned. Keys come home.",
  END_TRUE: "Every shelf, empty. Every account, void. Somewhere a shop is learning what it is to be owed nothing at all.",

  /* Chapter 2 — teddy */
  END_T_LITTLE_KEEPER: "Given away below cost. And yet the books, impossibly, balance.",
  END_T_HOLLOW_GIFT: "Contents not included. It said so on the tag. Nobody reads the tag.",
  END_T_REUNITED: "Two reunited items walked out through a door I do not stock. Noted, grudgingly, in red.",

  /* Chapter 2 — candle */
  END_C_WAXWORK: "Measurements complete. Fittings are always free.",
  END_C_MELTED_FREE: "One figure melted, one child unshelved. The wax never lies about what it held.",
  END_C_SNUFFED: "Paid nothing, took nothing, owed nothing. The one arithmetic I cannot abide.",

  /* Chapter 2 — balloon */
  END_B_FREED_SKY: "A hundred strings gone slack in one evening. The sky and I are no longer on speaking terms.",
  END_B_ANCHORED: "The ring required an anchor. You volunteered. Volunteers are half price.",
  END_B_QUIET_RETURN: "One string cut, one customer lost to the chimney smoke. The rest of my stock stayed put.",

  /* Chapter 2 — dragon */
  END_D_FOUNDRY_HALT: "The foundry is down indefinitely. The dent, I am told, is admired. Insufferable.",
  END_D_TOYMAKER: "Forty repairs, none authorised. My workshop smells of second chances now. It will not scrub out.",
  END_D_BIGGER: "Upgrades are final. Appetite is not covered by the warranty.",

  /* The cellar */
  END_NO_ESCAPE: "The stair is fixed stock. It only ever carried the one direction.",
  END_TAKEN: "An even exchange: one of you for one of you. The paperwork practically wrote itself.",
  END_SHATTERED: "Breakages must be paid for. You paid from the inside.",
  END_FORTY_FIRST: "Forty accounts closed. One left open, holding my door. I will not pretend I understand the mathematics of that.",
  END_WOUND_BACK: "Wound back to mint condition. Welcome, once again, to my shop. Do choose wisely.",
  END_THE_REGULAR: "Staff at last. The coat was cut for you loops ago; the ledger merely waited for the fitting.",

  /* The bracelet / the door */
  END_JUST_CAME: "He gave her the one item that never crossed my counter. There is no margin in honesty. There is no shelf for it either.",
  END_COLD_FEET: "Undelivered. Unreturned. Un-everything. I have filed you under doorstep.",
  END_LAST_THREAD: "Frayed through off the premises, one small cold choice at a time. I did not even have to charge for that one.",
  END_WHOLE_AGAIN: "Two bracelets, neither of them mine. There is a word for stock like that: kept.",
  END_THE_WAY_BACK: "Paid in full, in the only coin I cannot bank: everything remembered, nothing left behind. Close the ledger. Turn off the sign.",
  END_THE_LONG_WAY: "Item restored; memory not included. He is doing it again the long way, on purpose. I have no price for that.",
  END_SO_CLOSE: "He knew the whole truth and held it in empty hands. Knowledge was never the currency here. Thread was.",
  END_FALSE_VICTORY: "Replayed nightly, on the shelf, to a satisfied customer. My favourite subscription.",
  END_EMPTY_SHELVES: "Nothing left to sell. Sign gone dark. He kept coming back — the one habit I never thought to fear.",

  /* The workroom and the larder */
  END_NEW_STOCK: "Finished by hand, filed under soft. He hoped to be chosen. They always hope. It helps the stitching.",
  END_UNDERSTITCH: "Two stitches of courage, then flight. His hands are clean; my books are not so kind.",
  END_FED: "Absorbed into goodwill. Every shop needs a warm welcome. Mine is homemade.",
  END_NOTHING_LEFT: "Appraised at nothing. The middle was collected years ago. The rest walks, and fetches.",
  END_SALTED_ROOT: "Damages: one root, bitten through. Closed for the winter. I do not write the word brave in this book. I wrote it once.",
  END_HER_MIDDLE: "One jar missing from the larder, half-full and running up a stair. I ought to send someone after him. I find I am counting the stairs instead.",
  END_TOOK_IT_BACK: "Refunded in full, all at once. There is a reason I take the middle out gently. Now he knows it too.",
  END_MOSTLY_HERE: "Reunited with his own inventory. Shelved by request. The quietest sale I ever made.",

  /* The shop wings */
  END_KEPT_WARM: "His own good intentions, sold back to him at full price. My finest recurring item.",
  END_HER_NAME: "One tag, stolen, ink still wet. Run, then. Balances keep. Names, it turns out, can be carried.",
  END_ON_LAYAWAY: "Settled early, unprompted, self-delivered. I have framed the receipt.",
  END_BURNED_BOOK: "Accounts: ash. Futures: ash. My page too. He will never know what he unwrote. Neither, now, will I.",
  END_EMPTY_COAT: "The coat fits. The keeper gives everything away. There was never a rule against it, because none of them ever thought to try.",
  END_YOUR_OWN_FACE: "He tapped back. He always taps back. The window is patient, and the street is never short of you.",
};
