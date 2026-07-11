/* ============================================================================
 * bracelet.js  -  the bracelet answers. The shopkeeper murmurs from the dark;
 * for most of the game nobody answers him. This is the other voice: not a
 * ghost, not a speaker — the bracelet going warm against your wrist, and a
 * line of HER surfacing the way remembered people do. It only happens while
 * the bond is strong (bond >= 4): mending the bracelet is what makes her
 * audible. Snap it, and the first time he lands a barb there is only a
 * visible silence where she should have been. That silence plays once.
 *
 * Mirror of CW.Shopkeeper: pure content + a selector, no DOM. answerFor(node,
 * aside) returns { kind: "answer"|"moment"|"silence", line? } or null.
 * Her voice laws: never shop terms, never his cadence. Remembered speech —
 * blunt, funny, warm; quotes her the way you actually keep people.
 * ========================================================================== */
window.CW = window.CW || {};

CW.BraceletVoice = (function () {
  const GS = () => CW.GameState;

  /* Answers keyed to HIS rules — she only chases the barbs worth answering. */
  const ANSWERS = {
    name: [
      "He can wear your name out all he likes. She said it differently. She said it like the start of a dare.",
    ],
    shop_meta: [
      "She never believed in haunted anything. 'It's just a weird little man,' she'd say, 'in a weird little shop.' Your wrist is inclined to agree with her.",
    ],
    wiped: [
      "He isn't in the save. Neither is she. She's in the mending. Check your wrist.",
    ],
    absence: [
      "He counts the days you're gone. She never did. She just left the porch light on.",
    ],
    ledger: [
      "His book has your page. She kept one too — a shoebox, actually: ticket stubs, a photo, half a bracelet. Nobody ever owed anybody in it.",
    ],
    hour: [
      "Three in the morning is when you two used to swear you'd both stay awake. She always lost. Wake her gently, when you get there.",
    ],
    cellar: [
      "Even down here, the thread doesn't fray on its own. Nothing in this place can cut it. Only you can.",
    ],
    dread3: [
      "It's getting dark in here. She was never once afraid of the dark. She was afraid you'd stop showing up. Only that.",
    ],
    dread4: [
      "Don't answer him. Squeeze your own wrist instead. Feel that? Still warm. Still hers. Still yours.",
    ],
    whole: [
      "He wants the bracelet because it's the one thing in this building that was never for sale. She'd tell you to keep your hands in your pockets and smile at him.",
    ],
    bond_high: [
      "Appreciating. She'd snort at that. 'It's string,' she'd say — and then she'd wear it every day for three years.",
    ],
    pushed: [
      "You know what she did when you went quiet like that? Nothing. She just stayed. Staying is allowed here too.",
    ],
    doubled: [
      "Two of you, and she'd have picked you. The original. She always could tell — you laugh a half-second later.",
    ],
    backroom: [
      "She'd have drawn that curtain back too. You two were always the same kind of nosy. It's why it worked.",
    ],
    tender: [
      "That memory he's pricing? It's not for sale. It isn't even all yours. Half of it is hers. He can't afford it.",
    ],
    caution: [
      "You felt it on the step and came in anyway — for her. She'd call that the bravest dumb thing you've ever done. Third bravest, actually.",
    ],
    chose: [
      "Good choice. Wrong question. She never wanted a thing from a shelf. She wanted you at the table.",
    ],
    route_follow: [
      "It's a good gift. It's not the gift. You've known that since the fence.",
    ],
    fifth_aisle: [
      "The thread is pulling. Toward the aisle. She's on the other end of it — and she is pulling back.",
    ],
    reunion: [
      "Last door. She's on the other side of it, older than you remember and exactly the same. Knock.",
    ],
    regular: [
      "A regular. That's his word for it. Hers was 'stubborn' — and she said it the way other people say 'loyal'.",
    ],
    lastgift: [
      "He remembers what you gave. She remembers whether you came. Only one of those was ever the point.",
    ],
    gift_collector: [
      "You've tried every gift but the one she asked for. She asked for you, at the table. The offer stands.",
    ],
    visits_ten: [
      "Double digits. She'd have organised a rescue by visit five — and brought snacks to it.",
    ],
    runner: [
      "You keep running out of here. She never minded the running. She minded the direction.",
    ],
    clean_ledger: [
      "A blank page frightens him. Good. Some things refuse to be written down. You learned that from her.",
    ],
  };

  /* When he says something rotten she has no specific answer for, the wrist
     still warms — these carry the general shape of her. */
  const FALLBACK = [
    "She used to say you walk too fast. You slowed down just now. She'd have noticed.",
    "Somewhere out in the rain, two sets of initials are still scratched into a fence post. His shop can't stock that.",
    "The thread tightens, just a little. Not a warning. A hand squeezing back.",
    "You can't hear her from here. But the bracelet is doing the thing it does when someone laughs at the other end of it. That snorting laugh. You know the one.",
  ];

  /* Her own beats — no barb required. Quiet nodes where the wrist speaks first. */
  const MOMENTS = [
    { match: "TM_", lines: [
      "Hold this one carefully. It's one of the few he never got his hands on. She keeps her copy too — in her version, you trip over the fence.",
      "This is the memory the bracelet is made of. Every knot in it happened. He can't say that about anything on his shelves.",
    ] },
    { match: "P02_BIRTHDAY_ROOM", lines: [
      "Last door. She's on the other side of it, older than you remember and exactly the same. Knock.",
    ] },
    { match: "F01_FIFTH_AISLE", lines: [
      "The thread is pulling. Toward the aisle. She's on the other end of it — and she is pulling back.",
    ] },
    { match: "T_OWNERS", lines: [
      "Four coats, and a fifth hook. She'd already be prying the tags off with her thumbnail. Take the blank one. Give them nothing to write on.",
    ] },
    { match: "C_WICKS", lines: [
      "A drawer full of everyone's stolen days. She never once wished a day shorter — not even the worst ones. Especially not those.",
    ] },
    { match: "B_MOORINGS", lines: [
      "All these strings, still holding on. So is she. That is the entire message. Pull.",
    ] },
    { match: "D_WINDDOWN", lines: [
      "Wind the tin girl. If you can only free one thing tonight, free the cartwheel. She would.",
    ] },
  ];

  function seenSet() {
    const run = GS().getRun();
    if (!run) return null;
    if (!run._brSeen) run._brSeen = {};
    return run._brSeen;
  }
  function pick(pool, s) {
    const fresh = pool.filter((l) => !s[l]);
    if (!fresh.length) return null;
    const l = fresh[Math.floor(Math.random() * fresh.length)];
    s[l] = true;
    return l;
  }

  function answerFor(node, aside) {
    if (!node || (node.id || "").indexOf("PRE_") === 0) return null; // the warm street needs no defending
    const run = GS().getRun();
    const s = seenSet();
    if (!run || !s) return null;

    // Snapped: the first time he lands a barb, there is only the silence
    // where she should have been. Once per run. After that — nothing at all.
    if (run.flags && run.flags.braceletSnapped) {
      if (aside && !run._brSilenced) { run._brSilenced = true; return { kind: "silence" }; }
      return null;
    }
    if ((run.bond || 0) < 4) return null; // mending is what makes her audible

    if (aside) {
      const pool = ANSWERS[aside.rule];
      if (pool) {
        const l = pick(pool, s);
        if (l) return { kind: "answer", line: l };
      }
      // She doesn't chase every barb — only his worst registers get the wrist's warmth back.
      if (aside.tone === "sick" || aside.tone === "slip") {
        const l = pick(FALLBACK, s);
        if (l) return { kind: "answer", line: l };
      }
      return null;
    }

    let haunt = 0;
    try { haunt = GS().hauntLevel(); } catch (e) {}
    if (haunt >= 3) return null; // by then, even the memories are his — her own moments go quiet
    for (const m of MOMENTS) {
      if (node.id.indexOf(m.match) === 0) {
        const l = pick(m.lines, s);
        if (l) return { kind: "moment", line: l };
      }
    }
    return null;
  }

  return { answerFor };
})();
