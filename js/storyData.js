/* ============================================================================
 * storyData.js  -  ALL CONTENT lives here (data, not code).
 *
 * This game is a standalone, engine-agnostic playable book. There is NO
 * platform-specific code here: nodes, choices, effects and endings are plain
 * data, so a writer can add content without touching the engine, and the data
 * model can be ported to another engine later.
 *
 * -------------------------------------------------------------------------
 * STORY NODE SCHEMA (see brief §9)
 *   ID = {
 *     id, title, location, theme,        // theme drives visuals; location is lore
 *     speaker, text,
 *     imagePrompt: "storybook illustration of ...",  // placeholder-art hook
 *     musicCue: "shop_theme",
 *     effects: { statChanges:{wisdom:1}, setFlags:{x:true}, addInventory:[] },
 *     choices: [ Choice, ... ],
 *     ending: null
 *   }
 *
 * CHOICE SCHEMA (see brief §10)
 *   {
 *     id, text, nextNodeId,
 *     requirements: { stats:{perception:2}, flags:{x:true}, inventoryIncludes:[], chosenGift:"talking_teddy" },
 *     costs:  { wisdom:1 },
 *     gains:  { perception:2 },
 *     setFlags:{...}, removeFlags:{...},
 *     addInventory:[...], removeInventory:[...],
 *     previewText: "Costs 1 Wisdom. Gain 2 Perception.",  // optional; auto-built if omitted
 *     lockedText: "You cannot make out the words.",
 *     hideWhenLocked: true   // hide (not grey) when locked — used for hard branch selectors
 *   }
 *
 * ENDING SCHEMA (see brief §16)
 *   ID = {
 *     number, id, title,
 *     category: "Good|Bad|Funny|Cursed|Secret|True",
 *     route: "teddy|candle|balloon|dragon|shop|meta",
 *     text, imagePrompt,
 *     clue: "one line recorded to the Memory page"
 *   }
 * ========================================================================== */
window.CW = window.CW || {};

CW.START_NODE = "PRE_1";
CW.STATS = ["wisdom", "intelligence", "perception", "strength"];

/* -------------------------------------------------------------------------- */
/* THE TRUTH  -  knowledge gathered ACROSS runs. Collect all five and the way   */
/* back to June opens. Each truth is learned by reaching a certain ending (see  */
/* CW.EndingKnowledge) or the cellar reveal. Order-independent; persists.        */
/* -------------------------------------------------------------------------- */
CW.Truths = {
  truth_trade:  { title: "The shop does not sell gifts.", text: "It trades children for them. Every soft thing on every shelf was once a late child with empty hands, like you." },
  truth_loop:   { title: "It winds you back.", text: "When a run ends badly, the shop turns a small brass key and folds you back to the empty lot, and you forget, and you are late again — forever, if it likes." },
  truth_count:  { title: "It has done this to you many times.", text: "The cellar keeps a tally. You are on your forty-first visit, and counting, and each loop the shop takes a little more and leaves a little less." },
  truth_keeper: { title: "The shopkeeper was a late child too.", text: "He came in from the rain with nothing, once, and the shop offered him the counter instead of the shelf. That is the only other way out he knows. He is not cruel. He is just tired, and kept." },
  truth_june:   { title: "The fraying is not your fault. Not only.", text: "June did not just drift. The shop has been quietly erasing her, loop by loop — the forgotten birthday, the cold year, her fading face. The bracelet is the one thread it could not reach. It is the only proof of her left." },
};
// Which ending teaches which truth.
CW.EndingKnowledge = {
  END_TAKEN: "truth_trade", END_T_BAD: "truth_trade", END_DISPLAY_PRISONER: "truth_trade",
  END_WOUND_BACK: "truth_loop",
  END_FORTY_FIRST: "truth_count", END_FIFTH_GIFT: "truth_count",
  END_THE_REGULAR: "truth_keeper", END_C_SECRET: "truth_keeper",
  END_TRUE: "truth_june",
};

/* -------------------------------------------------------------------------- */
/* The other children — you are not the first to come in late with empty hands.
 * Every soft thing on a shelf was one of them. Their traces are seeded through
 * the shop by CW.Traces (a note behind a toy, a little bracelet, a face at the
 * glass, the toy whispering); on a gift route the trace prefers the child whose
 * toy is now in your hands. `gift` links a child to the toy they became (null =
 * they never got to choose). Strings are the display text for each trace kind. */
CW.OtherChildren = [
  {
    id: "greta", name: "Greta", gift: "wish_candle",
    note: "A crayon note is folded behind the candles: \"i wished to stay little forever. it worked. tell my mum i'm okay. (i'm not okay.)\"",
    bracelet: "A little bracelet braided out of candle-wax, fused to the shelf. A name is scratched under it: GRETA.",
    window: "At the glass: a small girl in a paper birthday crown, mouthing the same silent wish, over and over and over.",
    whisper: "The candle-flame leans all the way to your ear and murmurs in a girl's voice: \"did you come to blow me out? please. i'm so tired of burning.\"",
    fate: "She wished on the candle never to grow up. The shop is very good at granting the exact letter of a wish.",
  },
  {
    id: "tomas", name: "Tomas", gift: "clockwork_dragon",
    note: "A note in careful block letters is taped inside a music box: \"I WAS GOING TO BE BRAVE. IF YOU WIND ME UP I STILL AM.\"",
    bracelet: "A bracelet of bent little watch-springs, still faintly ticking. The tag reads TOMAS.",
    window: "At the glass: a boy standing at perfect attention, saluting an empty street that no one is coming down.",
    whisper: "The dragon's gears whir and it says, in a boy's voice: \"i kept watch the whole time. i said i would. nobody ever came.\"",
    fate: "He chose the dragon so he'd never be scared again. Now he guards a door that only opens inward.",
  },
  {
    id: "odile", name: "Odile", gift: "everlasting_balloon",
    note: "A note in looping cursive: \"if i float high enough, someone at home will see me and remember they forgot me.\"",
    bracelet: "A bracelet that went up like its balloon — only the knot is left, tied to the shelf, labelled ODILE.",
    window: "At the glass: a girl pressed flat against it, drifting a slow inch up off the floor, and another, and another.",
    whisper: "The balloon tugs at your hand and a girl's voice pleads: \"hold my string. please don't let go of me the way they did.\"",
    fate: "She wanted to be impossible to lose. Everlasting is a very long time to be a thing that drifts.",
  },
  {
    id: "sam", name: "Sam", gift: "talking_teddy",
    note: "A note in shaky pencil, half rubbed away: \"im not scared if someones holding my paw. someone was. then the party ended.\"",
    bracelet: "A bracelet chewed soft as thread and gone grey with holding. The tag says SAM.",
    window: "At the glass: a very small boy hugging the dark around himself, waving at you like he's sure he knows you.",
    whisper: "The bear's stitched mouth works and a small boy asks: \"will you be my friend until the party's over? it isn't over yet — is it? is it?\"",
    fate: "He is the boy inside the bear. He only ever wanted someone to stay. The shop lets him ask everyone who walks in.",
  },
  {
    id: "pia", name: "Pia", gift: null,
    note: "A note with no words on it, only a drawing: a child at a counter, a taller shape behind the child, and an arrow pointing from the one to the other.",
    bracelet: "A bare bracelet with every single thread pulled out of it. Only the tag is left: PIA.",
    window: "Nothing at the glass — only a smear at child height, wiped clean from the inside.",
    whisper: "From a low shelf, very quietly: \"i couldn't choose. so it chose for me. don't take too long deciding. please don't take as long as i did.\"",
    fate: "She stood too long trying to choose. The shop does not wait forever, and some children never become a toy at all.",
  },
  {
    id: "wren", name: "Wren", gift: null,
    note: "A note in the margin of a great ledger: \"i said no. i said i only wanted to go to the party. he said — everyone says that.\"",
    bracelet: "A bracelet knotted tight to a second, smaller one. Both tags together read WREN & —.",
    window: "At the glass: a taller child holding a smaller child's hand. Both are watching you. Neither of them waves.",
    whisper: "\"i came in to fetch my little brother — he wandered in first. we're still together, at least. that's something. that's something, isn't it.\"",
    fate: "She came in only to pull a littler kid back out. The shop kept the pair of them, gladly, together.",
  },
];

/* Which endings set which of the other children free — they walk out of the
 * shop for good. Reaching one of these frees that child permanently (tracked in
 * meta.freedChildren); the two children with no gift route (Pia, Wren) are freed
 * by hand at the cellar wall (CELLAR_BRACELETS). Free all six -> the capstone. */
CW.ChildFreedom = {
  END_T_GOOD:        ["sam"],   // the spirit in the bear walks home
  END_T_REUNITED:    ["sam"],   // the child and their bear, out together
  END_C_MELTED_FREE: ["greta"], // a wax child melted back to breathing life
  END_B_FREED_SKY:   ["odile"], // every balloon sets its rider down home
  END_D_TOYMAKER:    ["tomas"], // the broken toys mended and walking free
};

/* THE LEDGER — the book the shop keeps of what you did, across every run. These
 * endings write a sin into it; choices can too (choice.ledger). The tally is
 * read in the tracker's Ledger panel and cited back at you by the shopkeeper.
 * Counters: gave (children taken off the shelf to give away) / hooked (left in
 * the warm room) / passed (bracelets walked past) / stock (made into stock, and
 * once, you) / fled (turned and ran) / pushed (pushed her down to keep moving).
 * "wound" (loops) and "freed" are derived, not stored here. */
CW.LedgerDeeds = {
  END_NEW_STOCK: "stock", END_TAKEN: "stock", END_DISPLAY_PRISONER: "stock",
  END_FED: "stock", END_MOSTLY_HERE: "stock", END_TOOK_IT_BACK: "stock",
  END_ON_LAYAWAY: "stock",
  END_UNDERSTITCH: "hooked",
  END_NO_ESCAPE: "fled",
};

/* -------------------------------------------------------------------------- */
/* THE FOUR GIFTS                                                             */
/* -------------------------------------------------------------------------- */
CW.Gifts = {
  talking_teddy: { id: "talking_teddy", name: "Talking Teddy Bear", icon: "🧸", primary: ["wisdom", "perception"], route: "teddy" },
  wish_candle:   { id: "wish_candle",   name: "Wish Candle",        icon: "🕯️", primary: ["wisdom", "intelligence"], route: "candle" },
  everlasting_balloon: { id: "everlasting_balloon", name: "Everlasting Balloon", icon: "🎈", primary: ["perception", "strength"], route: "balloon" },
  clockwork_dragon: { id: "clockwork_dragon", name: "Clockwork Dragon", icon: "🐉", primary: ["strength", "intelligence"], route: "dragon" },
  bracelet: { id: "bracelet", name: "{FRIEND}'s frayed bracelet", icon: "🧵" }, // carried from the start; the real gift
};

/* -------------------------------------------------------------------------- */
/* STORY NODES                                                               */
/* -------------------------------------------------------------------------- */
CW.StoryNodes = {
  /* ---- PROLOGUE: BEFORE THE SHOP (the fraying friendship) --------------- */
  PRE_1: {
    id: "PRE_1", title: "Late, Again", location: "Rain, on Maple Street", theme: "street", scene: "street",
    speaker: "Narrator", musicCue: "street_theme",
    effects: { addInventory: ["bracelet"] },
    text: "You are running in the rain, late to {FRIEND}'s birthday, and your hands are empty. No card. No gift. Nothing. Last year you forgot her birthday completely — that was the year the two of you went quiet — and this year the invitation came late and folded small, like she wasn't sure she wanted to send it at all. On your wrist, the friendship bracelet {FRIEND} braided you the summer you met has worn down to a single fuzzed thread. You never once made her one back. You keep meaning to. You would give anything, you think — the way anyone thinks it, running late in the rain — to walk in tonight with something warm in your hands instead of nothing. Anything at all. It is only ever a way of speaking, that. Right up until the moment something takes you at your word.",
    haunt: {
      2: { text: "You are running in the rain, late to {FRIEND}'s birthday, hands empty — again. You've done this before. You are almost sure you've run this exact street before, down to the shape of the puddles. The bracelet on your wrist is down to a single thread. You keep meaning to fix it. You never do. You never do." },
      4: { text: "You are running through the rain toward a birthday, and you cannot quite remember whose. {FRIEND} — yes, {FRIEND}, your best friend, your — the name is right there but her face has gone soft and wrong, like a photograph left too long in the sun. There is no bracelet on your wrist anymore. You are not certain there ever was one. You are not certain there was ever a {FRIEND} at all. But your feet know the way, and your feet do not need you to remember." },
    },
    imagePrompt: "storybook illustration of a boy running through rain-slicked streets at dusk, clutching his wrist, no gift in hand",
    choices: [
      { id: "PRE1_SORRY", text: "Rehearse the apology you've owed her for a year.", nextNodeId: "PRE_2", gains: { wisdom: 1 }, setFlags: { rehearsedSorry: true }, bond: 1 },
      { id: "PRE1_LIE", text: "Tell yourself she probably won't even notice you're late.", nextNodeId: "PRE_2", gains: { strength: 1 }, setFlags: { pushedItDown: true }, bond: -1 },
      { id: "PRE1_RUN", text: "Stop thinking about it. Just run faster.", nextNodeId: "PRE_2", gains: { strength: 1 }, setFlags: { ranHard: true } },
      { id: "PRE1_THREAD", text: "Touch the last thread of the bracelet and remember the day she tied it on.", nextNodeId: "PRE_2", gains: { perception: 1 }, setFlags: { rememberedJune: true }, bond: 1 },
    ],
  },
  PRE_2: {
    id: "PRE_2", title: "The Fence", location: "The Old Chain-Link Fence", theme: "street", scene: "street",
    cast: ["june"], poses: { june: "laugh", boy: "sad" },
    speaker: "Narrator", musicCue: "street_theme", effects: {},
    text: "You cut past the chain-link fence where you and {FRIEND} used to sit after school, backs against the wire, talking until the streetlights buzzed on. She told the worst jokes in the world and laughed so hard at them she'd snort, and she never once minded that you weren't funny — you just had to be there. You just had to show up. You haven't sat at this fence in a long, long time. The last time you two really talked, it ended cold, and neither of you ever went back and fixed it. And running past it now, you notice the small cruel thing: you can see her there so clearly, backs against the wire — but when you reach for the actual jokes, the exact words, they come up soft at the center, just out of reach, as if someone has been very gently helping you forget. That's only what a year does to a thing you let go cold. You tell yourself that. You tell yourself that.",
    haunt: {
      3: { text: "You cut past a fence where you and {FRIEND} used to — used to do something. Sit? Talk? The shape of the memory is there but the middle of it has been scooped clean out. You know it was good. You know you let it go cold. You cannot remember a single one of her terrible jokes, and that, somehow, is the part that frightens you most." },
    },
    imagePrompt: "storybook illustration of an old chain-link fence at dusk, two faint ghostly kids sitting against it in memory",
    choices: [
      { id: "PRE2_MISS", text: "Slow down, just for a second, and let yourself miss her.", nextNodeId: "PRE_3", gains: { wisdom: 1 }, setFlags: { letHimselfMiss: true }, bond: 1 },
      { id: "PRE2_INITIALS", text: "Look for the initials you both scratched into the fence post.", nextNodeId: "PRE_3", gains: { perception: 1 }, setFlags: { foundInitials: true }, bond: 1 },
      { id: "PRE2_PUSH", text: "Push the memory down. It hurts too much to hold and still run.", nextNodeId: "PRE_3", setFlags: { pushedItDown: true }, bond: -1 },
      { id: "PRE2_PROMISE", text: "Promise the empty fence you'll make it right tonight.", nextNodeId: "PRE_3", gains: { wisdom: 1 }, setFlags: { promisedFence: true }, bond: 1 },
    ],
  },
  PRE_3: {
    id: "PRE_3", title: "Nothing in Your Hands", location: "The Last Corner", theme: "street", scene: "street",
    speaker: "Narrator", musicCue: "street_theme", effects: {},
    text: "You round the last corner and it hits you all at once: you have nothing to give her. Not a card, not a thing. And the old fear climbs your throat — you're always late, you always forget, and forgetting is the exact thing that lost her the first time. You cannot walk in empty-handed. Not again. Not tonight. You want, with your whole chest, for there to be some way to fix this — and on the word tonight, as if the wanting were a key turning in a lock, you see it: on the corner where the empty lot has sat your whole life, a little shop, glowing warm in the rain, that absolutely was not there a breath ago. The gold letters above the door settle as you read them, the way rain-lit things do, into two words: CHOOSE WISELY. For just a second they feel like they were waiting to be read by you, specifically. Then the second passes, the way such seconds do.",
    imagePrompt: "storybook illustration of a boy stopping short before a warm glowing shop that has appeared in an empty lot in the rain",
    choices: [
      { id: "PRE3_GO", text: "A gift — right there. Go in.", nextNodeId: "S00_OUTSIDE_SHOP" },
      { id: "PRE3_HESITATE", text: "Hesitate. Shops do not simply appear.", nextNodeId: "S00_OUTSIDE_SHOP", gains: { perception: 1 }, setFlags: { sensedWrong: true } },
      { id: "PRE3_TIME", text: "Check the time — how late are you, really?", nextNodeId: "S00_OUTSIDE_SHOP", gains: { intelligence: 1 } },
      { id: "PRE3_THREAD", text: "Look down at the one thread left on your wrist, and decide.", nextNodeId: "S00_OUTSIDE_SHOP", gains: { wisdom: 1 }, setFlags: { clutchedThread: true }, bond: 1 },
    ],
  },

  /* ---- TRUNK ------------------------------------------------------------ */
  S00_OUTSIDE_SHOP: {
    id: "S00_OUTSIDE_SHOP",
    dread: 1, // the impossible shop appears: the first wrongness, and it never fully lifts after
    title: "The Last-Minute Gift Shop",
    location: "A quiet side street",
    theme: "street",
    speaker: "Narrator",
    text: "The shop has no business existing, and yet here it is: warm light spilling under a door that was not a door a minute ago. The light is the exact colour of being forgiven. A skinny stray cat sits on the step, not asking to be let in, which is its own kind of warning. It has watched a hundred late children stop on this spot, in this rain, with these empty hands. It watches you take your place.",
    haunt: {
      1: { text: "You are late to your best friend's birthday party, and you forgot the gift. On the corner, the little shop is glowing warm — the way it was last time. You are fairly sure you have stood on this exact spot before. The cat on the step blinks at you like it knows you." },
      2: { text: "The shop is on the corner again. Of course it is. You are late again, you forgot the gift again, the sign says CHOOSE WISELY again — and some tired part of you thinks, quite clearly: haven't I already done this?" },
      3: { text: "There is no surprise left in it. The empty lot, the sudden shop, the warm glow — you have done this so many times the street barely bothers to pretend. The door is already open. It knows you are coming in." },
      4: { text: "There is no empty lot. There was never an empty lot. There is only the shop, and the rain, and you, standing where you always stand, late for a party you will never quite reach — and a sign that, if you are honest, only ever spelled your name." },
    },
    imagePrompt: "storybook illustration of a boy in the rain discovering a glowing magical shop that appeared between two buildings, a stray cat on the step, twilight",
    musicCue: "street_theme",
    effects: {},
    choices: [
      { id: "S00_ENTER", text: "Go inside. You were always going to.", nextNodeId: "S01_ENTER_SHOP" },
      { id: "S00_CAT", text: "Feed the stray cat that has watched you do this before.", nextNodeId: "S01_ENTER_SHOP", gains: { wisdom: 1 }, setFlags: { cat_friend: true } },
      { id: "S00_REGULAR", text: "Stop pretending you don't know this place. Walk in like the regular you are.", nextNodeId: "END_THE_REGULAR", requirements: { minHaunt: 3 }, hideWhenLocked: true },
      { id: "S00_SIGN", text: "Read the sign slowly, in case it spells something else.", nextNodeId: "S01_ENTER_SHOP", gains: { perception: 1 }, setFlags: { readSign: true } },
      { id: "S00_PEER", text: "Peer through the glowing window before it notices you.", nextNodeId: "S01_ENTER_SHOP", gains: { intelligence: 1 } },
      { id: "S00_STEEL", text: "Square your shoulders. Pretend this was your idea.", nextNodeId: "S01_ENTER_SHOP", gains: { strength: 1 } },
    ],
  },

  S01_ENTER_SHOP: {
    id: "S01_ENTER_SHOP",
    dread: 1,
    title: "The Bell That Rings Itself",
    location: "Magic Shop",
    theme: "shop",
    poses: { boy: "surprised" },
    speaker: "Narrator",
    text: "The bell above the door rings once, twice — then a third time, after your hand has already left the handle. Somewhere under the floorboards, something rings back. Candlelight pools over shelves of toys that were arranged, you would swear, a moment before you came in. The tall shopkeeper in the patched coat is already smiling. He has been smiling since before the door opened. It is a good smile. It fits him like something bought secondhand.",
    haunt: {
      2: { text: "The bell rings three times, and the shopkeeper is smiling before you are through the door. \"Back again,\" he says warmly, like you are an old friend. \"I kept your spot on the shelf. I mean — your spot at the counter. Come in.\"" },
      4: { text: "The bell does not bother to ring. The shopkeeper is already holding the gift you will choose, wrapped, your name on the tag. \"Welcome back,\" he says, not looking up. \"You know where everything is by now.\"" },
    },
    imagePrompt: "storybook illustration of a mysterious gift shop interior, shelves of strange toys, warm candlelight, tall shopkeeper in a patched coat",
    musicCue: "shop_theme",
    effects: { setFlags: { enteredShop: true } },
    choices: [
      { id: "S01_INSPECT", text: "Look closely at the four gifts. See which looks back.", nextNodeId: "S02_FOUR_GIFTS", gains: { perception: 1 } },
      { id: "S01_GREET", text: "Greet the shopkeeper politely, as if you have a choice.", nextNodeId: "S02_FOUR_GIFTS", gains: { wisdom: 1 } },
      { id: "S01_WANDER", text: "Read the labels on the high shelves — they are all names.", nextNodeId: "S02_FOUR_GIFTS", gains: { intelligence: 1 } },
      { id: "S01_STEADY", text: "Breathe slow. The air tastes faintly of other children.", nextNodeId: "S02_FOUR_GIFTS", gains: { strength: 1 } },
      { id: "S01_LOSTFOUND", text: "A dusty bin in the corner, marked LOST & FOUND. Go to it, the way you'd go to something of hers.", nextNodeId: "SHOP_LOSTFOUND", requirements: { flags: { rememberedJune: true } }, gains: { perception: 1 }, hideWhenLocked: true },
    ],
  },

  S02_FOUR_GIFTS: {
    id: "S02_FOUR_GIFTS",
    dread: 1,
    title: "Four Kinds of Magic",
    location: "Magic Shop",
    theme: "shop",
    speaker: "Narrator",
    text: "Four gifts wait under glass. A Talking Teddy Bear whose button eyes have already chosen you back. A Wish Candle whose flame bends toward your ear like a listener at a keyhole. An Everlasting Balloon straining at its string the way a dog strains at the end of a walk it does not intend to finish. And a Clockwork Dragon, ticking — not like a heart. Like something counting.",
    imagePrompt: "storybook illustration of four magical gifts under glass: a teddy bear, a candle, a balloon, and a clockwork dragon",
    musicCue: "shop_theme",
    effects: {},
    choices: [
      { id: "S02_SHADOW", text: "Count the shadows behind the counter. There is one too many.", nextNodeId: "S03_SHOPKEEPER_WARNING", requirements: { stats: { perception: 4 } }, gains: { intelligence: 1 }, setFlags: { noticedShadow: true }, lockedText: "Something is off behind the counter, but you cannot say what." },
      { id: "S02_ASK", text: "Step to the counter and ask what the gifts cost.", nextNodeId: "S03_SHOPKEEPER_WARNING" },
      { id: "S02_TOUCH", text: "Press your palm to the glass. Feel which one is warm.", nextNodeId: "S03_SHOPKEEPER_WARNING", gains: { perception: 1 }, setFlags: { touchedGlass: true } },
      { id: "S02_LISTEN", text: "Lean in — is that the gifts breathing, or only you?", nextNodeId: "S03_SHOPKEEPER_WARNING", gains: { intelligence: 1 }, setFlags: { heardGifts: true } },
      { id: "S02_LOSTFOUND", text: "In the corner, half in shadow, an old bin marked LOST & FOUND. Go and look.", nextNodeId: "SHOP_LOSTFOUND", requirements: { stats: { perception: 3 } }, gains: { perception: 1 }, lockedText: "There is a bin in the corner you can't quite make out from here." },
    ],
  },

  /* ---- OPTIONAL SHOP SIDE-THREAD ----------------------------------------
     The Lost & Found and the Layaway shelf. Reachable from S01 (if you
     remembered {FRIEND} back in the prologue) or S02 (if you're observant).
     Deepens the shop's guilt, teaches truth_trade, and offers another hidden
     way down to the cellar — but adds NO new endings, so nothing needs new
     art or voice. Routes only back into existing nodes. -------------------- */
  SHOP_LOSTFOUND: {
    id: "SHOP_LOSTFOUND",
    dread: 1,
    title: "The Lost and Found",
    location: "Magic Shop",
    theme: "shop", scene: "shop",
    speaker: "Narrator",
    text: "The bin is oak, and old, and heaped with the small things late children leave behind: a single wool mitten, a house key on a red ribbon, a party hat gone soft, a birthday candle burned halfway and never wished on. And near the top, coiled neat as if it had been set there for you to find, a friendship bracelet — the same pattern as the frayed one on your wrist, the very same, except this one is whole, unbroken, bright, with two sets of initials worked into the weave. Yours. And {FRIEND}'s.",
    imagePrompt: "storybook illustration of an old oak lost-and-found bin heaped with children's small lost things, a whole friendship bracelet resting on top",
    musicCue: "shop_theme",
    effects: { setFlags: { sawLostFound: true } },
    choices: [
      { id: "LF_TAGS", text: "Read the paper tags knotted to each lost thing.", nextNodeId: "SHOP_LAYAWAY", gains: { perception: 1 }, setFlags: { readLostTags: true } },
      { id: "LF_TAKE", text: "Lift the whole, unfrayed bracelet out of the bin.", nextNodeId: "S02_FOUR_GIFTS", gains: { perception: 1 }, setFlags: { sawWholeBracelet: true } },
      { id: "LF_WEAR", text: "Put the whole bracelet on your own wrist.", nextNodeId: "END_KEPT_WARM" },
      { id: "LF_LEAVE", text: "Leave it. None of it was ever yours to take.", nextNodeId: "S02_FOUR_GIFTS", gains: { wisdom: 1 }, bond: 1, setFlags: { leftLostFound: true } },
      { id: "LF_ASK", text: "Carry the bin to the counter and ask whose all this is.", nextNodeId: "S03_SHOPKEEPER_WARNING", gains: { intelligence: 1 }, setFlags: { askedLostFound: true } },
      { id: "LF_DESCEND", text: "A single thread trails from the bin, over the lip, and down into the dark. Follow it.", nextNodeId: "CELLAR_1", requirements: { minDread: 3 }, hideWhenLocked: true },
    ],
  },

  SHOP_LAYAWAY: {
    id: "SHOP_LAYAWAY",
    dread: 2,
    title: "On Layaway",
    location: "The Back Shelf",
    theme: "shop", scene: "shop",
    speaker: "Narrator",
    text: "Behind the lost and found, where the candlelight does not quite reach, there is a second shelf — and on it sit toys that are not finished yet: a bear with only one button eye, a dragon with no key, a candle not yet lit. Each wears a paper tag on a string. A name. A date, back by. And a balance. Some read PAID IN FULL, in a neat old hand. The rest still owe. Greta. Tomas. Odile. Sam. And near the front, its ink not yet dry, a newer tag, in a hand very like the shopkeeper's — and the name inked on it is {HERO}. Beneath it, smaller, in the same hand: {FRIEND}. Where the balance should be, it says only: soon.",
    imagePrompt: "storybook illustration of a dim back shelf of half-finished toys, each with a small paper name tag, one tag newer than the rest",
    musicCue: "shop_theme",
    effects: { learn: ["truth_trade"], setFlags: { sawLayaway: true } },
    choices: [
      { id: "LA_JUNE", text: "Take the tag with {FRIEND}'s name and close your fist around it.", nextNodeId: "S02_FOUR_GIFTS", gains: { perception: 1 }, bond: 1, setFlags: { tookJuneTag: true } },
      { id: "LA_RUN", text: "Take {FRIEND}'s tag and run for the door now, before the ink dries.", nextNodeId: "END_HER_NAME" },
      { id: "LA_SETTLE", text: "Climb onto the shelf and settle your own balance early.", nextNodeId: "END_ON_LAYAWAY" },
      { id: "LA_DEBT", text: "Read what the shop is still owed for the other children.", nextNodeId: "S02_FOUR_GIFTS", gains: { intelligence: 1 }, setFlags: { readTheDebt: true } },
      { id: "LA_BACK", text: "Put every tag back exactly as you found it, and step away.", nextNodeId: "S02_FOUR_GIFTS", gains: { wisdom: 1 } },
      { id: "LA_CONFRONT", text: "Go and find the shopkeeper. You have different questions now.", nextNodeId: "S03_SHOPKEEPER_WARNING", gains: { wisdom: 1 }, setFlags: { confrontedLayaway: true } },
      { id: "LA_BACKROOM", text: "There is a door past the shelf, marked STAFF ONLY, and it is ajar. Go through.", nextNodeId: "SHOP_BACKROOM", gains: { perception: 1 }, setFlags: { foundBackRoom: true } },
    ],
  },

  /* ---- BEHIND THE COUNTER: the staff-only back of the shop ----------------
     A hub (SHOP_BACKROOM) off the Layaway shelf (or slipped into from S03),
     with three rooms that show the machinery. Teaches truth_loop (the office
     ledger) and truth_keeper (the second coat) in-fiction, and opens NEW paths
     into two EXISTING endings (END_DISPLAY_PRISONER, END_THE_REGULAR) — so it
     adds real weight with no new endings, art, or voice. All shop scene. ----- */
  SHOP_BACKROOM: {
    id: "SHOP_BACKROOM",
    dread: 2,
    title: "Behind the Counter",
    location: "Staff Only",
    theme: "shop", scene: "shop",
    speaker: "Narrator",
    text: "Past the shelf, the door marked STAFF ONLY opens on a room that has no business being here — cramped, and low, and somehow far larger than the shop that holds it. This is the working shop, the real one, with the pretty part kept out front for children. A great ledger lies open on a desk. A velvet curtain hides the back of the display window, and small shapes shift behind it. A hatch is set into the floor. And on the wall, two coats hang from two hooks: the shopkeeper's, patched all over — and a second, new and clean and exactly your size.",
    imagePrompt: "storybook illustration of a cramped impossible back room of a magic shop, a great ledger on a desk, a curtained window, two coats on hooks",
    musicCue: "shop_theme",
    effects: { setFlags: { sawBackRoom: true } },
    choices: [
      { id: "BR_LEDGER", text: "Go to the great ledger lying open on the desk.", nextNodeId: "SHOP_OFFICE", gains: { intelligence: 1 } },
      { id: "BR_CURTAIN", text: "Draw back the velvet curtain over the window.", nextNodeId: "SHOP_DISPLAY", gains: { perception: 1 } },
      { id: "BR_COATS", text: "Look at the two coats on their hooks — one of them your size.", nextNodeId: "SHOP_COATHOOK", gains: { perception: 1 } },
      { id: "BR_OUT", text: "Slip back out to the shop floor before you're missed.", nextNodeId: "S02_FOUR_GIFTS", gains: { wisdom: 1 } },
      { id: "BR_HATCH", text: "Lift the hatch in the floor and go down the stairs beneath it.", nextNodeId: "CELLAR_1", requirements: { minDread: 3 }, hideWhenLocked: true },
    ],
  },

  SHOP_OFFICE: {
    id: "SHOP_OFFICE",
    dread: 2,
    title: "The Accounts",
    location: "Staff Only",
    theme: "shop", scene: "shop",
    speaker: "Narrator",
    text: "The ledger is bigger than you are, and every page is a child, and every line is a thing they took down off a shelf and the price they paid for it, set out in a small neat hand. You turn to the most recent pages, and there are names you almost know. And then you find a page with your own name at the top — and the columns are already filled in, in that same hand, for visits you have not made yet, gifts you have not chosen, a whole tidy future of you priced out to the last thread. In the margin, a child has written, pressing so hard the paper tore: i said no. he said everyone says that.",
    imagePrompt: "storybook illustration of an enormous open ledger, columns of names and prices in old handwriting, a child's frightened note scrawled in the margin",
    musicCue: "shop_theme",
    effects: { learn: ["truth_loop"], setFlags: { readTheLedger: true } },
    choices: [
      { id: "OF_MINE", text: "Read your own page — the future already inked in.", nextNodeId: "SHOP_BACKROOM", gains: { intelligence: 1 }, setFlags: { readOwnAccount: true } },
      { id: "OF_JUNE", text: "Turn the pages until you find {FRIEND}'s.", nextNodeId: "SHOP_BACKROOM", gains: { perception: 1 }, setFlags: { readJuneAccount: true } },
      { id: "OF_TEAR", text: "Tear your own page clean out of the book.", nextNodeId: "SHOP_BACKROOM", gains: { strength: 1 }, bond: 1, setFlags: { toreOwnPage: true } },
      { id: "OF_BURN", text: "Tip the desk candle onto the open ledger and let the accounts burn.", nextNodeId: "END_BURNED_BOOK" },
      { id: "OF_CLOSE", text: "Close the great cover, gently, and step back.", nextNodeId: "SHOP_BACKROOM", gains: { wisdom: 1 } },
    ],
  },

  SHOP_DISPLAY: {
    id: "SHOP_DISPLAY",
    dread: 2,
    title: "The Window, From Inside",
    location: "Staff Only",
    theme: "shop", scene: "shop",
    speaker: "Narrator",
    text: "Behind the curtain is the back of the display window, and pressed to the glass — facing out, into the rain, into the street — are the children. A small girl in a paper crown, mouthing a wish. A boy at attention, saluting no one. A girl drifting a slow inch up off the floor. A very small boy who waves at you the instant he feels you there, sure he knows you. None of them turn round. They are watching the street, all of them, for the next late child to stop on the corner with empty hands. There is a gap in the display, between them, swept clean and waiting. It is exactly your size.",
    imagePrompt: "storybook illustration seen from behind a shop display window, children pressed to the glass facing out at a rainy street, one empty child-sized gap",
    musicCue: "shop_theme",
    effects: { setFlags: { sawDisplayInside: true } },
    choices: [
      { id: "DI_TAP", text: "Tap the glass and try to make just one of them turn round.", nextNodeId: "SHOP_BACKROOM", gains: { perception: 1 }, setFlags: { tappedGlass: true } },
      { id: "DI_NAMES", text: "Say their names out loud — Greta, Tomas, Odile, Sam.", nextNodeId: "SHOP_BACKROOM", gains: { wisdom: 1 }, bond: 1, setFlags: { namedTheDisplay: true } },
      { id: "DI_STEP", text: "Step into the gap in the display. Just to see out. Just for a moment.", nextNodeId: "END_DISPLAY_PRISONER" },
      { id: "DI_TURN", text: "Keep tapping until one of them finally turns round.", nextNodeId: "END_YOUR_OWN_FACE" },
      { id: "DI_BACK", text: "Let the curtain fall and back away from the glass.", nextNodeId: "SHOP_BACKROOM", gains: { wisdom: 1 } },
    ],
  },

  SHOP_COATHOOK: {
    id: "SHOP_COATHOOK",
    dread: 2,
    title: "The Second Coat",
    location: "Staff Only",
    theme: "shop", scene: "shop",
    speaker: "Narrator",
    text: "Up close, the shopkeeper's patched coat is not patched at all. Every patch is a label, and every label is a name, sewn on in thread — hundreds of them, layered until there is no coat left underneath, only the names of everyone he ever rang up. He was a late child once. You understand it, looking at the coat: he came in from the rain with nothing, and the shop offered him the counter instead of the shelf, and he took it, because it was the only other way out, and he has been ringing up children ever since. The second coat is new. Unpatched. Clean. Exactly your size. A paper tag hangs from its collar, in his careful hand: FOR WHEN YOU'RE READY.",
    imagePrompt: "storybook illustration of two coats on hooks, one covered entirely in small sewn-on name labels, the other new and clean and child-sized",
    musicCue: "shop_theme",
    effects: { learn: ["truth_keeper"], setFlags: { sawSecondCoat: true } },
    choices: [
      { id: "CO_TRY", text: "Take the new coat down and put your arms in — just to see how it hangs.", nextNodeId: "END_THE_REGULAR" },
      { id: "CO_EMPTY", text: "Put on the coat, step behind the counter — and start giving everything back.", nextNodeId: "END_EMPTY_COAT" },
      { id: "CO_READ", text: "Read the names sewn into his coat, one by one.", nextNodeId: "SHOP_BACKROOM", gains: { intelligence: 1 }, setFlags: { readTheNames: true } },
      { id: "CO_REFUSE", text: "Take the new coat off its hook and hide it where he won't find it.", nextNodeId: "SHOP_BACKROOM", gains: { wisdom: 1 }, bond: 1, setFlags: { refusedTheCoat: true } },
      { id: "CO_LEAVE", text: "Leave both coats hanging and step away.", nextNodeId: "SHOP_BACKROOM", gains: { wisdom: 1 } },
    ],
  },

  S03_SHOPKEEPER_WARNING: {
    id: "S03_SHOPKEEPER_WARNING",
    dread: 1,
    title: "The Rule of the Shop",
    location: "Magic Shop",
    theme: "shop",
    speaker: "Shopkeeper",
    text: "\"You may take only one,\" the shopkeeper says. His eyes flick to the frayed thread on your wrist, and something like a smile passes over him. \"Though I see you already wear a gift — a truer one than anything on my shelf. A pity you've let it come so undone.\" He spreads his hands over the glass. \"Still. A bear, a candle, a balloon, a dragon. Every gift gives something, and every gift also takes something. Choose wisely — you were always going to.\"",
    haunt: {
      2: { text: "\"Every gift gives something, and every gift also takes something,\" the shopkeeper recites, then winks. \"But you know the rule by now, don't you? You've heard me say it — oh, more than a few times.\"" },
      3: { text: "\"The rule, the rule,\" the shopkeeper sighs, waving a hand. \"You could say it in your sleep. You HAVE said it in your sleep — on the shelf, in the dark, with those little button eyes. Go on. Choose. You always do.\"" },
    },
    imagePrompt: "storybook illustration of a tall smiling shopkeeper leaning over a counter, one finger raised in warning, candlelight",
    musicCue: "shop_theme",
    effects: {},
    choices: [
      { id: "S03_RESPECT", text: "Thank him and ask what each gift takes.", nextNodeId: "S04_CHOOSE_GIFT", gains: { wisdom: 1 }, bond: 1 },
      { id: "S03_MOCK", text: "Scoff at the old warning.", nextNodeId: "S04_CHOOSE_GIFT", gains: { strength: 1 }, costs: { wisdom: 1 }, bond: -1 },
      { id: "S03_HAGGLE", text: "Try to talk him into letting you take two.", nextNodeId: "S04_CHOOSE_GIFT", gains: { intelligence: 1 }, setFlags: { triedHaggle: true } },
      { id: "S03_STUDY", text: "Say nothing, and study his face for a lie.", nextNodeId: "S04_CHOOSE_GIFT", requirements: { stats: { perception: 3 } }, gains: { perception: 1 }, setFlags: { studiedKeeper: true }, lockedText: "His smile gives away nothing you can read." },
      { id: "S03_SLIP", text: "While he recites the rule, slip behind the counter through the door marked STAFF.", nextNodeId: "SHOP_BACKROOM", requirements: { stats: { perception: 4 } }, gains: { perception: 1 }, setFlags: { slippedBehind: true }, hideWhenLocked: true },
    ],
  },

  S04_CHOOSE_GIFT: {
    id: "S04_CHOOSE_GIFT",
    dread: 1,
    title: "Choose Wisely",
    location: "Magic Shop",
    theme: "shop",
    speaker: "Shopkeeper",
    text: "The four gifts glint under the glass. Whichever you choose, the others will remember being left behind.",
    imagePrompt: "storybook illustration of a boy reaching a decision over four glowing magical gifts",
    musicCue: "shop_theme",
    effects: {},
    choices: [
      { id: "S04_TEDDY", text: "Take the Talking Teddy Bear.", nextNodeId: "TM_TEDDY", gains: { wisdom: 1 }, setFlags: { chosenGift: "talking_teddy" }, addInventory: ["talking_teddy"], ledger: "gave" },
      { id: "S04_CANDLE", text: "Take the Wish Candle.", nextNodeId: "TM_CANDLE", gains: { intelligence: 1 }, setFlags: { chosenGift: "wish_candle" }, addInventory: ["wish_candle"], ledger: "gave" },
      { id: "S04_BALLOON", text: "Take the Everlasting Balloon.", nextNodeId: "TM_BALLOON", gains: { perception: 1 }, setFlags: { chosenGift: "everlasting_balloon" }, addInventory: ["everlasting_balloon"], ledger: "gave" },
      { id: "S04_DRAGON", text: "Take the Clockwork Dragon.", nextNodeId: "TM_DRAGON", gains: { strength: 1 }, setFlags: { chosenGift: "clockwork_dragon" }, addInventory: ["clockwork_dragon"], ledger: "gave" },
      { id: "S04_FIFTH", text: "Follow the cat toward a fifth aisle you never noticed.", nextNodeId: "F01_FIFTH_AISLE", requirements: { flags: { cat_friend: true, fifthAisleUnlocked: true } }, hideWhenLocked: true },
      { id: "S04_STEAL", text: "Grab all four gifts and run.", nextNodeId: "END_DISPLAY_PRISONER", bond: -2 },
    ],
  },

  /* ---- MEMORY BEATS: the gift triggers a memory of the friend ----------- */
  TM_TEDDY: {
    id: "TM_TEDDY", title: "A Rabbit Made of Thread", location: "A Memory", theme: "teddy",
    cast: ["june"], poses: { june: "idle", boy: "sad" },
    speaker: "A Memory of {FRIEND}", musicCue: "teddy_theme", effects: {},
    text: "The bear's button eyes catch the light and all at once you are eight years old again, and it is {FRIEND}'s stuffed rabbit — the one she carried until it was more thread than rabbit — and she is making you pinky-swear never, ever to tell anyone she still sleeps with it. You never told. You told her everything and she told you everything; that was the whole deal, the two of you against the quiet. You are not sure when you stopped keeping up your end.",
    haunt: {
      3: { text: "The bear's button eyes catch the light and you wait for the memory to rise — there was a rabbit, wasn't there, a pinky-swear, a her — but the light just slides off the buttons and nothing comes. You are holding a stranger's toy on a street you don't remember choosing. Whatever this used to remind you of has gone somewhere you can't follow." },
      4: { text: "The bear's button eyes catch the light and the memory comes, warm and perfect — the threadbare rabbit, the pinky-swear, her snorting laugh — except you can see the seams in it now, the small neat stitches where the shop sewed this memory into you, because it is not yours. There was a her, once. This soft, bought, button-eyed copy of the feeling of her is all the shop left you to keep loving, so that you would keep coming back to the only place it still plays. You pinky-swear, in the dark, with a girl the shop is wearing like a glove. And somewhere on a low shelf below your feet, the real thing — what is left of her — turns its stitched face toward the sound of you and tries, and fails, to remember your name." },
    },
    imagePrompt: "storybook illustration of two small kids pinky-swearing over a threadbare stuffed rabbit, warm nostalgic light",
    choices: [
      { id: "TMT_HOLD", text: "Hold onto that — the pinky-swear, the trust.", nextNodeId: "T01", gains: { wisdom: 1 }, bond: 1 },
      { id: "TMT_FACE", text: "Make yourself remember the last secret she told you — and how you brushed it off.", nextNodeId: "T01", gains: { wisdom: 1 }, bond: 1 },
      { id: "TMT_WONDER", text: "Wonder what she's afraid of now that you'll never get to hear.", nextNodeId: "T01", gains: { perception: 1 } },
      { id: "TMT_PUSH", text: "Push it away. You've got a gift to buy.", nextNodeId: "T01", setFlags: { pushedItDown: true }, bond: -1 },
    ],
  },
  TM_CANDLE: {
    id: "TM_CANDLE", title: "The Cake You Missed", location: "A Memory", theme: "candle",
    cast: ["june"], poses: { june: "sad", boy: "sad" },
    speaker: "A Memory of {FRIEND}", musicCue: "candle_theme", effects: {},
    text: "The flame leans toward you and for a second it is the candles on {FRIEND}'s cake last year — the cake you never saw, because you forgot, because you were busy with something you cannot even name now. She never said one word about it. That was so much worse than if she'd shouted. That silence was the day the quiet between you started, and neither of you has found the bottom of it since.",
    haunt: {
      3: { text: "The flame leans toward you and there was a cake, a birthday, a year you missed — you know the shape of the guilt but the girl at the center of it has blurred to a smudge of candlelight. You cannot picture her face over the cake. You cannot picture her face at all. Only the guilt is still sharp: guilt with no one left inside it." },
      4: { text: "The flame leans toward you and the memory comes back mended: the cake, the little flames, her face gold in the light of them — and you, there, in the chair beside her, on time, singing. It is perfect. It never happened. You can feel the fresh stitching where the shop unpicked the year you missed and sewed in this kinder one, because guilt wears a customer out eventually, and love keeps one coming back. She smiles at you across the manufactured candlelight, this bought-and-paid-for her, and never once mentions the empty chair. She can't. The shop built her out of your wishing, and your wishing never could face it. And somewhere under the floor, on a shelf of things too spent to sell, a real candle with her real name on it burns all the way down without one word from you." },
    },
    imagePrompt: "storybook illustration of a lonely birthday cake with unblown candles and one empty chair, a sad memory",
    choices: [
      { id: "TMC_FEEL", text: "Let yourself feel exactly what that day cost.", nextNodeId: "C01", gains: { wisdom: 1 }, bond: 1 },
      { id: "TMC_TAKEBACK", text: "Wish, with everything you have, that you could take it back.", nextNodeId: "C01", gains: { wisdom: 1 }, bond: 1 },
      { id: "TMC_SHRUG", text: "Tell yourself it really wasn't that big a deal.", nextNodeId: "C01", setFlags: { pushedItDown: true }, bond: -1 },
      { id: "TMC_FIX", text: "Decide a better gift this year simply fixes it.", nextNodeId: "C01", gains: { strength: 1 } },
    ],
  },
  TM_BALLOON: {
    id: "TM_BALLOON", title: "The Slow Drift", location: "A Memory", theme: "balloon",
    cast: ["june"], poses: { june: "turned", boy: "reach" },
    speaker: "A Memory of {FRIEND}", musicCue: "balloon_theme", effects: {},
    text: "The balloon pulls at your hand, wanting up and away, and you think of how it happened with {FRIEND} — not a fight, not even a moment, just a slow drift, the two of you floating in different directions a little more each week until one day the string between you was simply, quietly, gone. You keep promising yourself you'll reach up and pull it back. You never do reach up.",
    haunt: {
      3: { text: "The balloon pulls at your hand, wanting up and away, and you think of how it happened with — with someone. There was a string between you and someone, and it went slack, and then it went gone. You can feel the shape of the loss without the person in it, like reaching for a hand that was never actually there." },
      4: { text: "The balloon pulls at your hand and the memory arrives repaired: there was no drift. There was never a drift. There is only the two of you, ten years old forever, one string held in both your fists, and neither of you ever looked away or grew up or let go. It is the sweetest thing the shop has ever sold you, and you can see every seam of it — because when you follow the string in the memory, it does not go up to any balloon. It goes down. Through the floorboards, pulled taut, to the low shelf where the shop keeps the things that used to hold on. Tug it, and something below tugs back: twice, softly. The old signal. The one only she knew." },
    },
    imagePrompt: "storybook illustration of two children drifting apart on separate balloons over a town, a snapped string between them",
    choices: [
      { id: "TMB_GRIP", text: "Grip the string tight. Not this time.", nextNodeId: "B01", gains: { strength: 1 }, bond: 1 },
      { id: "TMB_OWN", text: "Admit, to yourself, that you were the one who let go first.", nextNodeId: "B01", gains: { wisdom: 1 }, bond: 1 },
      { id: "TMB_BLAME", text: "Blame the drift on her, on time, on anything but you.", nextNodeId: "B01", bond: -1 },
      { id: "TMB_RISE", text: "Let the balloon pull you up and away from the thought.", nextNodeId: "B01", gains: { perception: 1 }, setFlags: { pushedItDown: true }, bond: -1 },
    ],
  },
  TM_DRAGON: {
    id: "TM_DRAGON", title: "The Time She Stood Up", location: "A Memory", theme: "dragon",
    cast: ["june"], poses: { june: "furious", boy: "sad" },
    speaker: "A Memory of {FRIEND}", musicCue: "dragon_theme", effects: {},
    text: "The little dragon sets its gears and plants itself between you and nothing at all — just practicing, just in case — and you remember {FRIEND} in the fourth grade, small and absolutely furious, standing between you and the older kids who'd taken your shoes. Not because she could win. Because you were hers to defend, and that was that. She always showed up for you. Every single time. It is a hard thing to hold tonight, with your empty hands.",
    haunt: {
      3: { text: "The little dragon plants itself in front of you, guarding, loyal, and it stirs something — someone stood up for you once, someone small and furious and yours, but her name and her face have worn away to a warmth with no shape. Somebody loved you enough to fight for you. You cannot remember who. You cannot remember letting them down — but you know that you did." },
      4: { text: "The little dragon sets its gears and the memory comes back complete: fourth grade, the older kids, her planted in front of you like a struck match, small and furious and absolutely certain. It is perfect. It is too perfect — it runs on rails now, the same seven seconds, wound and released, wound and released, and you understand, with a cold turning of gears, that the shop has made a toy of it: your finest memory of her, cased in brass, performing loyalty on demand for an audience of one. And stitched into the loop, so quick you nearly miss it, is the part that was never yours to remember — that she did it again, years later, one last time. Planted herself between you and a thing with a bell on its door. You were not there to see it. You were the reason. Wind it again, and watch her win, this once, forever. The shop is not unkind. It simply keeps the originals." },
    },
    imagePrompt: "storybook illustration of a small furious girl standing protectively in front of a boy against bigger kids",
    choices: [
      { id: "TMD_SWEAR", text: "Swear you'll show up for her the way she always showed up for you.", nextNodeId: "D01", gains: { wisdom: 1 }, bond: 1 },
      { id: "TMD_GENTLE", text: "Wind the dragon gently — the way she'd want you to.", nextNodeId: "D01", gains: { wisdom: 1 }, bond: 1 },
      { id: "TMD_SHARP", text: "Feel the shame of it, and let it sharpen you.", nextNodeId: "D01", gains: { strength: 1 } },
      { id: "TMD_SHRUG", text: "Decide loyalty is overrated and she'll get over it.", nextNodeId: "D01", setFlags: { pushedItDown: true }, bond: -1 },
    ],
  },

  /* ---- TEDDY ROUTE (§12) ------------------------------------------------ */
  T01: {
    id: "T01", title: "The Whisper in the Wrapping", location: "Shop Doorway", theme: "teddy",
    speaker: "Teddy Bear",
    text: "Before you reach the door the bear turns its head — you feel the little grind of it against your collarbone — and speaks so only you can hear. \"Don't trust him. He wraps children in soft shapes and sells them to other children. Listen only to me.\" Its voice is warm and small and certain, and that is the trouble with it: you want, very badly, to listen only to it.",
    imagePrompt: "storybook illustration of a teddy bear whispering to a boy, button eyes gleaming, warm uneasy shadows",
    musicCue: "teddy_theme",
    effects: {},
    choices: [
      { id: "T01_ASK", text: "Ask the bear what it truly wants from you.", nextNodeId: "T02", gains: { wisdom: 1 } },
      { id: "T01_SHAKE", text: "Shake it until the small voice stops.", nextNodeId: "T02", gains: { strength: 1 }, costs: { wisdom: 1 }, setFlags: { shookBear: true }, bond: -1 },
      { id: "T01_HOLD", text: "Hold it close and let the stitched heartbeat win you over.", nextNodeId: "T02", gains: { perception: 1 }, setFlags: { comfortedBear: true }, bond: 1 },
      { id: "T01_DOUBT", text: "Tell it plainly you don't believe a word it says.", nextNodeId: "T02", gains: { intelligence: 1 }, setFlags: { doubtedBear: true } },
    ],
  },
  T02: {
    id: "T02", title: "The Hungry Alley", location: "Night Street", theme: "teddy",
    speaker: "Teddy Bear",
    text: "The bear steers you — you did not decide to turn here — toward an alley too narrow for the two buildings that make it. \"A shortcut,\" it hums, pleased. The brick walls swell and sink, slow and even, warm to be near. It is not the wind. Walls do not do this. You know a chest breathing when you are pressed against one, and you are pressed against one now, on both sides, walking down the throat of it.",
    imagePrompt: "storybook illustration of a dark narrow alley that looks like it is breathing, a boy hesitating with a teddy bear",
    musicCue: "teddy_theme",
    effects: {},
    choices: [
      { id: "T02_NOTICE", text: "Feel the walls breathe, and refuse the alley.", nextNodeId: "T03", requirements: { stats: { perception: 3 } }, gains: { perception: 1 }, lockedText: "The alley is only shadows and brick, surely." },
      { id: "T02_MAIN", text: "Keep to the main road, where the walls stay walls.", nextNodeId: "T03" },
      { id: "T02_ALLEY", text: "Take the hungry alley anyway — fast, before it wakes.", nextNodeId: "T03", gains: { strength: 1 }, setFlags: { tookAlley: true } },
      { id: "T02_ASK", text: "Ask the bear how it knows the alley gets hungry.", nextNodeId: "T03", gains: { intelligence: 1 }, setFlags: { askedAlley: true } },
    ],
  },
  T03: {
    id: "T03", title: "A Small Pair of Hands", location: "Main Road", theme: "teddy",
    speaker: "Lost Child",
    text: "A small child with no shoes steps out of a doorway that has no house behind it and reaches up with both hands. \"Can I hold him? Just for a moment. He looks so lonely.\" Rain is falling on the whole street except on the child, who is dry, and pale, and patient in a way children never are — and the bear against your chest has gone very stiff and very silent, the way you go silent when someone you know walks into the room wearing your face.",
    imagePrompt: "storybook illustration of a barefoot lost child reaching for a teddy bear on a dim street",
    musicCue: "teddy_theme",
    effects: {},
    choices: [
      { id: "T03_SHARE", text: "Give the dry, waiting child the bear to hold.", nextNodeId: "T04", gains: { wisdom: 2 }, setFlags: { child_helped: true }, bond: 1 },
      { id: "T03_REFUSE", text: "Refuse, and hold the bear where it can't reach.", nextNodeId: "T04", gains: { perception: 1 }, costs: { wisdom: 1 } },
      { id: "T03_FOLLOW", text: "Ask the child to show you where the other bears are kept.", nextNodeId: "T2_A", requirements: { stats: { perception: 3 } }, setFlags: { sawHollow: true }, lockedText: "You don't notice the longing in the child's glance toward the alley." },
      { id: "T03_QUESTION", text: "Ask the child where its parents are — and why it's dry.", nextNodeId: "T04", gains: { intelligence: 1 }, setFlags: { askedChild: true } },
    ],
  },
  T04: {
    id: "T04", title: "What the Bear Remembers", location: "Near the Party", theme: "teddy",
    speaker: "Teddy Bear",
    text: "\"I remember this shop,\" the bear says, quieter now, \"from the inside of the shelf. It is dark in there, and you can hear the bell every time the door opens, and every time you think: this one. This one will pick me up and carry me out. I was a boy once. Late to a party. Empty hands.\" It pauses. \"I don't remember the party. I don't remember the friend. That's the part they take first, so you'll stop trying to leave.\"",
    imagePrompt: "storybook illustration of a teddy bear glowing faintly as it confesses a secret, a boy listening in the dark",
    musicCue: "teddy_theme",
    effects: {},
    choices: [
      { id: "T04_BELIEVE", text: "Believe it, and let the boy inside go free.", nextNodeId: "P01_PARTY_GATE", requirements: { stats: { wisdom: 4 } }, setFlags: { teddyResolved: true, freedTeddy: true }, lockedText: "You want to believe it, but you are not sure enough to act." },
      { id: "T04_QUESTION", text: "Test the memory for seams before you trust it.", nextNodeId: "P01_PARTY_GATE", requirements: { stats: { intelligence: 3 } }, setFlags: { teddyResolved: true }, lockedText: "You cannot untangle whether the bear is lying." },
      { id: "T04_OBEY", text: "Do whatever the bear says. Stop deciding things.", nextNodeId: "END_T_BAD" },
      { id: "T04_WRAP", text: "Wrap the bear as the gift and call it just a toy.", nextNodeId: "END_T_FUNNY" },
      { id: "T04_DESCEND", text: "A small door has opened in the floor by the bear's feet. Go down, instead of on.", nextNodeId: "CELLAR_1", requirements: { minDread: 3 }, hideWhenLocked: true },
    ],
  },

  /* ---- CANDLE ROUTE (§13) ----------------------------------------------- */
  C01: {
    id: "C01", title: "Make It Quick", location: "Shop Doorway", theme: "candle",
    speaker: "Wish Candle",
    text: "The candle lights itself the moment you are alone with it, and the flame lies down flat, reaching, pointing at you like a finger. \"Make it quick,\" it crackles, kind as a nurse. \"You're late, and I can shorten anything. The walk. The waiting. The wanting.\" The wax has already begun to run, though nothing is burning it. \"A whole year of missing her — I could take that down to nothing. You wouldn't even feel where it used to be.\"",
    imagePrompt: "storybook illustration of a candle whose flame bends into a small grinning face, amber light",
    musicCue: "candle_theme",
    effects: {},
    choices: [
      { id: "C01_SPEED", text: "Wish the last of the walk away.", nextNodeId: "C02", gains: { strength: 1 }, costs: { wisdom: 1 }, setFlags: { wishSpent: true, carelessWish: true }, bond: -1 },
      { id: "C01_RULES", text: "Ask the price of a wish before you spend one.", nextNodeId: "C02", gains: { intelligence: 2 } },
      { id: "C01_REFUSE", text: "Refuse to spend a single wish.", nextNodeId: "C02", gains: { wisdom: 1 }, setFlags: { refusedFirst: true } },
      { id: "C01_WARM", text: "Warm your cold hands on the flame and stall.", nextNodeId: "C02", gains: { perception: 1 } },
    ],
  },
  C02: {
    id: "C02", title: "The Road That Grows", location: "Long Road", theme: "candle",
    speaker: "Narrator",
    text: "The road to the party grows a little longer each time you look up from your feet — a house you passed is ahead of you again; a lamp you left behind is throwing your shadow forward. The candle is not testing you. The candle is waiting, the way a patient thing waits, for you to get tired enough to spend it. That is all the road is for. It is the length of your own resolve, laid out in wet cobblestone, so you can watch it run out.",
    imagePrompt: "storybook illustration of a road that stretches impossibly long under a strange orange sky",
    musicCue: "candle_theme",
    effects: {},
    choices: [
      { id: "C02_WISH", text: "Wish the party closer and the road shorter.", nextNodeId: "C03", costs: { wisdom: 1 }, setFlags: { wishSpent: true, partyShifted: true } },
      { id: "C02_WALK", text: "Walk it out. Spend nothing, however long it grows.", nextNodeId: "C03", gains: { wisdom: 1 }, bond: 1 },
      { id: "C02_RUN", text: "Run the growing road until your chest burns.", nextNodeId: "C03", gains: { strength: 1 }, setFlags: { ranRoad: true } },
      { id: "C02_MEASURE", text: "Measure the trick with your eyes and beat it.", nextNodeId: "C03", requirements: { stats: { intelligence: 3 } }, gains: { intelligence: 1 }, lockedText: "The perspective keeps sliding; you can't hold the trick in your head." },
    ],
  },
  C03: {
    id: "C03", title: "A Tempting Offer", location: "Long Road", theme: "candle",
    speaker: "Wish Candle",
    text: "\"I can make her adore whatever you bring,\" the flame whispers, right at your ear now, close enough to warm it. \"A handful of ash. An empty box. Nothing at all. She'll throw her arms around it and mean it — really mean it, all the way down.\" The offer is so gentle. That is how you know the size of it. \"It isn't lying,\" the candle adds, reading your face. \"Not exactly. You'd be changing her instead of the gift. Isn't that easier? Just say yes.\"",
    imagePrompt: "storybook illustration of a candle flame whispering a tempting offer, wax dripping like a grin",
    musicCue: "candle_theme",
    effects: {},
    choices: [
      { id: "C03_ACCEPT", text: "Say yes. Let it change her instead of the gift.", nextNodeId: "END_C_CURSED", gains: { strength: 2 }, costs: { wisdom: 2 }, bond: -2 },
      { id: "C03_REFUSE", text: "Refuse. She should love the real thing or nothing.", nextNodeId: "C04", gains: { wisdom: 2 }, bond: 1 },
      { id: "C03_PRICE", text: "Ask what the candle takes for a bargain like that.", nextNodeId: "C04", requirements: { stats: { intelligence: 3 } }, gains: { intelligence: 1 }, setFlags: { learnedPrice: true }, lockedText: "The flame just grins; you're not sharp enough to pin it down." },
      { id: "C03_SNUFF", text: "Try to pinch the listening flame out, here and now.", nextNodeId: "C04", gains: { strength: 1 }, setFlags: { triedSnuff: true } },
    ],
  },
  C04: {
    id: "C04", title: "The Riddle in the Wax", location: "Party Street", theme: "candle",
    speaker: "Narrator",
    text: "The candle weeps wax onto the cobblestones and the wax crawls into letters, and the letters make a riddle, and you understand, watching them form, that the riddle is easy on purpose — that the whole thing is built so you'll take the shortcut instead, so you'll spend the wish rather than think. Solve it with your own head and you keep your last wish. Everything down here is like this: a hard right door, held open beside a soft wrong one, to see which you'll walk through when you're tired.",
    imagePrompt: "storybook illustration of dripping wax forming a glowing riddle across cobblestones at night",
    musicCue: "candle_theme",
    effects: {},
    choices: [
      { id: "C04_SOLVE", text: "Solve the easy riddle the hard way — with your own head.", nextNodeId: "P01_PARTY_GATE", requirements: { stats: { intelligence: 4 } }, gains: { intelligence: 1 }, lockedText: "The letters swim; the answer stays just out of reach." },
      { id: "C04_WISH", text: "Burn your last wish just to skip it.", nextNodeId: "P01_PARTY_GATE", setFlags: { wishSpent: true } },
      { id: "C04_TRAIL", text: "Leave the riddle; follow the wax deeper down.", nextNodeId: "C2_A", setFlags: { followedWax: true } },
      { id: "C04_DESCEND", text: "The wax runs off the lip of a stair you never saw. Follow it down.", nextNodeId: "CELLAR_1", requirements: { minDread: 3 }, hideWhenLocked: true },
      { id: "C04_ASK", text: "Read it aloud and ask a passing stranger to help.", nextNodeId: "P01_PARTY_GATE", gains: { wisdom: 1 }, setFlags: { askedHelp: true } },
    ],
  },

  /* ---- BALLOON ROUTE (§14) ---------------------------------------------- */
  B01: {
    id: "B01", title: "The Pull of the String", location: "Outside the Shop", theme: "balloon",
    speaker: "Narrator",
    text: "The balloon tugs upward the instant the door shuts behind you — onto your toes, then off them, then past the point where letting go would only mean falling. The string does not feel tied to the balloon. It feels tied to you, threaded in at the wrist and pulling, and the town drops away underneath your dangling shoes, small and warm and already too far to shout to.",
    imagePrompt: "storybook illustration of a boy lifted off his feet by a glowing balloon over rooftops, blue-purple sky",
    musicCue: "balloon_theme",
    effects: {},
    choices: [
      { id: "B01_HOLD", text: "Hold tight as the ground lets go of you.", nextNodeId: "B02", gains: { strength: 1 } },
      { id: "B01_KNOTS", text: "Study the knots — they were tied around a wrist.", nextNodeId: "B02", gains: { intelligence: 1 }, setFlags: { studiedKnots: true } },
      { id: "B01_TEST", text: "Loosen your grip, just to feel how much it wants you.", nextNodeId: "B02", gains: { perception: 1 }, setFlags: { testedGrip: true } },
      { id: "B01_SING", text: "Sing to yourself as the town shrinks below.", nextNodeId: "B02", gains: { wisdom: 1 } },
    ],
  },
  B02: {
    id: "B02", title: "Three Roofs, One Party", location: "Above the Town", theme: "balloon",
    speaker: "Narrator",
    text: "From up here three houses glow with birthday lights, and they are the same house — the same lit windows, the same paper lanterns, the same small shape at the same gate looking up. Only one is really hers. The other two are for you: baited, patient, wearing her party like a coat. Choose wrong and you'll come down into a birthday that was never anyone's, and the door will lock sweetly behind you, and you will be a very long time realizing.",
    imagePrompt: "storybook illustration of a boy floating above three lantern-lit rooftops, choosing which is the real party",
    musicCue: "balloon_theme",
    effects: {},
    choices: [
      { id: "B02_SPOT", text: "Find the one real party among the baited two.", nextNodeId: "B03", requirements: { stats: { perception: 3 } }, setFlags: { rightRoof: true }, lockedText: "From this height the three roofs blur together." },
      { id: "B02_GUESS", text: "Guess, and drift toward the nearest lie.", nextNodeId: "B03", setFlags: { lostPath: true } },
      { id: "B02_CIRCLE", text: "Fight the wind down for a closer, colder look.", nextNodeId: "B03", gains: { perception: 1 }, costs: { strength: 1 }, setFlags: { circled: true } },
      { id: "B02_CALL", text: "Call her name into the wind and listen for her.", nextNodeId: "B03", requirements: { stats: { wisdom: 3 } }, gains: { wisdom: 1 }, setFlags: { rightRoof: true }, lockedText: "The wind snatches your voice away before it carries." },
    ],
  },
  B03: {
    id: "B03", title: "Paper Birds", location: "The Clouds", theme: "balloon",
    speaker: "Narrator",
    text: "A flock of folded paper birds boils up out of the cloud and swarms the string, pecking at the knots — and they are not trying to cut you loose. They are trying to keep you. Each one is a page, you see as they wheel: a page torn from somewhere, creased into wings, and written over every wing in a child's careful hand is a name, and a date, and the words BACK BY DARK. None of them made it back by dark. They flew instead. They are still flying.",
    imagePrompt: "storybook illustration of origami paper birds attacking a balloon string in the clouds",
    musicCue: "balloon_theme",
    effects: {},
    choices: [
      { id: "B03_FIGHT", text: "Beat the paper children away from the string.", nextNodeId: "B04", costs: { strength: 1 }, gains: { perception: 1 } },
      { id: "B03_HIDE", text: "Go still inside a cloud until the flock passes.", nextNodeId: "B04", costs: { strength: 1 }, gains: { wisdom: 1 }, setFlags: { gentleSky: true } },
      { id: "B03_TALK", text: "Ask the paper birds what they are still waiting for.", nextNodeId: "B04", gains: { intelligence: 1 }, setFlags: { talkedBirds: true } },
      { id: "B03_DIVE", text: "Dive through the flock and outfly the names.", nextNodeId: "B04", requirements: { stats: { strength: 3 } }, gains: { strength: 1 }, lockedText: "You haven't the strength to wrench the balloon into a dive." },
    ],
  },
  B04: {
    id: "B04", title: "The Balloon's Request", location: "The Clouds", theme: "balloon",
    speaker: "Everlasting Balloon",
    text: "The balloon slows and turns, so the seam of it faces you like a face. \"Untie me,\" it says, softly, \"and trust where I take you.\" It is the first thing all night that has asked instead of pulled — and that is exactly why you cannot tell if it is the one honest voice up here or the most patient liar of them all. Below your shoes the town is a scatter of embers. Somewhere in it is a gate, and a friend, and a door still open. For now.",
    imagePrompt: "storybook illustration of a balloon speaking to a boy high above a glowing town at night",
    musicCue: "balloon_theme",
    effects: {},
    choices: [
      { id: "B04_TRUST", text: "Untie it and trust where it takes you.", nextNodeId: "P01_PARTY_GATE", requirements: { flags: { gentleSky: true } }, gains: { wisdom: 2 }, lockedText: "After how roughly you have flown, you dare not let go.", bond: 1 },
      { id: "B04_CUT", text: "Cut the string and drop before it decides for you.", nextNodeId: "END_B_BAD" },
      { id: "B04_STAR", text: "Ride it down into the party like a prize.", nextNodeId: "END_B_FUNNY" },
      { id: "B04_DOWN", text: "Climb the string down to whatever holds it.", nextNodeId: "B2_A", requirements: { stats: { intelligence: 3 } }, setFlags: { followedString: true }, lockedText: "The knots are too tangled to climb without understanding them." },
      { id: "B04_DESCEND", text: "Let the balloon pull you DOWN — through the roof, below the shop, into the dark.", nextNodeId: "CELLAR_1", requirements: { minDread: 3 }, hideWhenLocked: true },
    ],
  },

  /* ---- DRAGON ROUTE (§15) ----------------------------------------------- */
  D01: {
    id: "D01", title: "The Waking Gears", location: "Outside the Shop", theme: "dragon",
    speaker: "Narrator",
    text: "The clockwork dragon wakes in your hands with a shiver of tin and clicks its wings open, and its little glass eyes find your face and hold it, and it waits — not to learn what it is, but to learn what you are. Whether you wind gently or wind cruel. Whether you are the kind that keeps a thing or the kind that uses it up. It has met both. You can tell by the way it flinches, very slightly, when your thumb moves toward the key.",
    imagePrompt: "storybook illustration of a small brass clockwork dragon spreading metal wings, ember sparks",
    musicCue: "dragon_theme",
    effects: {},
    choices: [
      { id: "D01_GENTLE", text: "Wind it gently, the way it hopes for.", nextNodeId: "D02", gains: { wisdom: 1 }, setFlags: { gentleDragon: true }, bond: 1 },
      { id: "D01_OVER", text: "Overwind it hard, past what it can hold.", nextNodeId: "D02", gains: { strength: 1 }, costs: { intelligence: 1 }, bond: -1 },
      { id: "D01_INSPECT", text: "Open it up and read its gears before you wind.", nextNodeId: "D02", gains: { intelligence: 1 }, setFlags: { inspectedDragon: true } },
      { id: "D01_NAME", text: "Look it in the eye and give it a name to keep.", nextNodeId: "D02", gains: { perception: 1 }, setFlags: { namedDragon: true } },
    ],
  },
  D02: {
    id: "D02", title: "The Locked Bridge", location: "River Bridge", theme: "dragon",
    speaker: "Narrator",
    text: "A toy bridge blocks the route, gears jammed shut across a river that is too black and too quiet to be water. Things turn over in it, slow, just under the surface — pale, jointed, patient. One of them has a face. It is not looking at you. It is waiting its turn, the way you wait a turn you know is coming, and the bridge stays locked, and the dragon in your hands ticks faster, which is the only way it has to scream.",
    imagePrompt: "storybook illustration of a jammed clockwork toy bridge over a small river, gears and levers",
    musicCue: "dragon_theme",
    effects: {},
    choices: [
      { id: "D02_SOLVE", text: "Solve the gears while the black river watches.", nextNodeId: "D03", requirements: { stats: { intelligence: 3 } }, gains: { intelligence: 1 }, lockedText: "The gear pattern is beyond you right now." },
      { id: "D02_FORCE", text: "Force the bridge before the river takes its turn.", nextNodeId: "D03", requirements: { stats: { strength: 4 } }, lockedText: "The bridge will not budge by strength alone." },
      { id: "D02_SCOUT", text: "Send the dragon under, into the dark, to scout.", nextNodeId: "D03", gains: { perception: 1 }, setFlags: { dragonScouted: true } },
      { id: "D02_WAIT", text: "Wait out the mechanism, and don't look down.", nextNodeId: "D03", requirements: { stats: { wisdom: 3 } }, gains: { wisdom: 1 }, lockedText: "You haven't the patience to wait the mechanism out." },
    ],
  },
  D03: {
    id: "D03", title: "Toy Soldiers", location: "The Gutter", theme: "dragon",
    speaker: "Narrator",
    text: "Wind-up soldiers march up out of the gutter in a neat tin line, swords drawn, and halt — and every painted face is the same face, and it is a child's, worn smooth at the cheeks the way a coin wears smooth, from being handled. They do not want to hurt you. You can see that. They want you to stop, and stay, and be counted, and fall in — because whoever winds them keys them tighter for every child they turn back, and looser, they have learned, for every one they let past into the dark.",
    imagePrompt: "storybook illustration of wind-up tin toy soldiers marching from a gutter, a clockwork dragon facing them",
    musicCue: "dragon_theme",
    effects: {},
    choices: [
      { id: "D03_SCARE", text: "Set the dragon on the little worn-faced soldiers.", nextNodeId: "D04", costs: { strength: 1 } },
      { id: "D03_ASK", text: "Ask the soldiers why they turn children back.", nextNodeId: "D04", gains: { wisdom: 1 } },
      { id: "D03_WINDER", text: "Ask the soldiers who winds THEM up.", nextNodeId: "D2_A", requirements: { stats: { wisdom: 3 } }, setFlags: { foundFoundry: true }, lockedText: "You are too busy bracing for a fight to think to ask." },
      { id: "D03_MARCH", text: "Fall in and march a while with the counted.", nextNodeId: "D04", gains: { intelligence: 1 }, setFlags: { marchedSoldiers: true } },
    ],
  },
  D04: {
    id: "D04", title: "The Cost of Loyalty", location: "Near the Party", theme: "dragon",
    speaker: "Narrator",
    text: "The cannon comes loose above you — you never see who tips it — and the dragon does not decide to move, it simply is between you and the falling thing, the way it was built to be, and it takes the blow and lands at your feet dented and sparking and trying, still, to stand. It cost itself for you without weighing it. That is the terrible thing the shop makes and sells: love with no brake on it. Love wound too tight to stop. It is looking up at you now to see if it was worth it. You get to decide the answer.",
    imagePrompt: "storybook illustration of a small clockwork dragon dented and sparking after protecting a boy",
    musicCue: "dragon_theme",
    effects: {},
    choices: [
      { id: "D04_REPAIR", text: "Mend every piece and reach the memory inside.", nextNodeId: "P01_PARTY_GATE", requirements: { stats: { intelligence: 4 }, flags: { gentleDragon: true } }, setFlags: { dragonMemory: true }, lockedText: "You lack the skill, or the trust, to reach what is inside it." },
      { id: "D04_CARRY", text: "Carry the broken thing the rest of the way.", nextNodeId: "P01_PARTY_GATE", requirements: { stats: { strength: 3 } }, gains: { wisdom: 1 }, lockedText: "It is heavier than it looks; you cannot lift it safely." },
      { id: "D04_COMMAND", text: "Order it to keep fighting on a broken spring.", nextNodeId: "END_D_BAD", bond: -1 },
      { id: "D04_DESCEND", text: "A hatch in the gutter yawns open beside the dragon. Climb down.", nextNodeId: "CELLAR_1", requirements: { minDread: 3 }, hideWhenLocked: true },
      { id: "D04_REST", text: "Sit with it, let it cool, and cost it nothing more.", nextNodeId: "P01_PARTY_GATE", gains: { wisdom: 1 }, setFlags: { restedDragon: true }, bond: 1 },
    ],
  },

  /* ---- CONVERGING LATE-GAME (§11) --------------------------------------- */
  P01_PARTY_GATE: {
    id: "P01_PARTY_GATE", title: "The Iron Party Gate", location: "Party Gate", theme: "party",
    speaker: "Narrator",
    text: "You reach the tall iron gate around the party garden. It is locked, and the music is already playing inside.",
    imagePrompt: "storybook illustration of a tall locked iron garden gate with a birthday party glowing warmly beyond it",
    musicCue: "party_theme",
    effects: {},
    choices: [
      { id: "P01_FORCE", text: "Force the iron gate open.", nextNodeId: "P02_BIRTHDAY_ROOM", costs: { strength: 2 }, lockedText: "You are not strong enough to force it." },
      { id: "P01_PICK", text: "Pick the old lock.", nextNodeId: "P02_BIRTHDAY_ROOM", requirements: { stats: { intelligence: 3 } }, lockedText: "The lock's workings escape you." },
      { id: "P01_SIDE", text: "Find the hidden side entrance.", nextNodeId: "P02_BIRTHDAY_ROOM", requirements: { stats: { perception: 4 } }, gains: { perception: 1 }, lockedText: "You cannot spot another way in." },
      { id: "P01_KNOCK", text: "Simply knock and wait to be let in.", nextNodeId: "P02_BIRTHDAY_ROOM", gains: { wisdom: 1 } },
      { id: "P01_DESCEND", text: "Beside the gate stands a cellar door no one else seems to see. Go down.", nextNodeId: "CELLAR_1", requirements: { minDread: 3 }, hideWhenLocked: true },
    ],
  },

  P02_BIRTHDAY_ROOM: {
    id: "P02_BIRTHDAY_ROOM", title: "The Birthday Room", location: "Party", theme: "party",
    cast: ["june"], poses: { june: "party", boy: "hopeful" },
    speaker: "Narrator",
    text: "Inside, warm and loud, your friend turns and sees you. It is time to give your gift.",
    imagePrompt: "storybook illustration of a cozy birthday party room, a friend turning to greet the arriving boy",
    musicCue: "party_theme",
    effects: {},
    // Hard branch selector: only the choice matching your gift + flags is shown.
    choices: [
      { id: "P02_TEDDY", text: "Give the bear — and the boy inside it — a way home.", nextNodeId: "END_T_GOOD", requirements: { chosenGift: "talking_teddy", flags: { teddyResolved: true } }, hideWhenLocked: true },
      { id: "P02_CANDLE_SECRET", text: "Give your gift with the candle's wish still unburned.", nextNodeId: "END_C_SECRET", requirements: { chosenGift: "wish_candle", flags: { wishSpent: false } }, hideWhenLocked: true },
      { id: "P02_CANDLE_GOOD", text: "Spend the last wish on your friend, not yourself.", nextNodeId: "END_C_GOOD", requirements: { chosenGift: "wish_candle", flags: { wishSpent: true } }, hideWhenLocked: true },
      { id: "P02_BALLOON", text: "Present the balloon that carried you here.", nextNodeId: "END_B_GOOD", requirements: { chosenGift: "everlasting_balloon" }, hideWhenLocked: true },
      { id: "P02_DRAGON_SECRET", text: "Set the remembering dragon beside your friend.", nextNodeId: "END_D_SECRET", requirements: { chosenGift: "clockwork_dragon", flags: { dragonMemory: true } }, hideWhenLocked: true },
      { id: "P02_DRAGON_GOOD", text: "Give the loyal little dragon.", nextNodeId: "END_D_GOOD", requirements: { chosenGift: "clockwork_dragon", flags: { dragonMemory: false } }, hideWhenLocked: true },
      { id: "P02_WHOLE", text: "Tie the bracelet around her wrist — you rebraided it the whole way here, thread by thread.", nextNodeId: "END_WHOLE_AGAIN", requirements: { flags: { braceletWhole: true } }, hideWhenLocked: true },
      { id: "P02_HUG", text: "Work the bracelet's last thread off your wrist and give her that instead.", nextNodeId: "END_JUST_CAME", requirements: { flags: { braceletSnapped: false, braceletWhole: false } }, gains: { wisdom: 1 }, setFlags: { gaveBracelet: true }, bond: 1, hideWhenLocked: true },
      { id: "P02_BARE", text: "Show her the bare wrist where the thread used to be.", nextNodeId: "END_LAST_THREAD", requirements: { flags: { braceletSnapped: true } }, hideWhenLocked: true },
      { id: "P02_SORRY", text: "Apologize, truly, for being so late — and mean it this time.", nextNodeId: "END_JUST_CAME", requirements: { stats: { wisdom: 3 }, flags: { braceletSnapped: false } }, lockedText: "The words stick, or the thread is already gone — either way, you can't." },
      { id: "P02_BOLT", text: "Panic at the door and bolt back into the night.", nextNodeId: "END_COLD_FEET", bond: -1 },
      { id: "P02_PERFECT", text: "Give her the gift. Everything is perfect. Everything is fine.", nextNodeId: "END_FALSE_VICTORY", requirements: { minHaunt: 4 }, hideWhenLocked: true },
    ],
  },

  /* ---- SECRET FIFTH AISLE (§17 meta) ------------------------------------ */
  F01_FIFTH_AISLE: {
    id: "F01_FIFTH_AISLE", title: "The Fifth Aisle", location: "Behind the Shelves", theme: "shop",
    speaker: "Narrator",
    text: "The cat slips between two shelves that were solid a moment ago. Beyond them stretches a fifth aisle, and at its end a fifth gift no one is meant to see: a small brass key.",
    imagePrompt: "storybook illustration of a hidden fifth aisle behind the shelves, a cat leading to a glowing brass key",
    musicCue: "secret_theme",
    effects: {},
    choices: [
      { id: "F01_TAKE", text: "Take the fifth gift.", nextNodeId: "END_FIFTH_GIFT" },
      { id: "F01_FREE", text: "Use the key to unlock every shelf and free what the shop is keeping.", nextNodeId: "END_TRUE", requirements: { flags: { trueEndingReady: true } }, hideWhenLocked: true },
      { id: "F01_POCKET", text: "Pocket the key quietly and slip away.", nextNodeId: "END_FIFTH_GIFT" },
      { id: "F01_STUDY", text: "Study the strange teeth of the key.", nextNodeId: "END_FIFTH_GIFT", gains: { intelligence: 1 } },
      { id: "F01_ASKCAT", text: "Ask the cat what, exactly, you are.", nextNodeId: "END_FIFTH_GIFT", requirements: { stats: { wisdom: 4 } }, gains: { wisdom: 1 }, lockedText: "The cat only stares, and you find you don't want to know badly enough." },
      { id: "F01_WAYBACK", text: "You know the way back to her now. Take it.", nextNodeId: "F02_WAY_BACK", requirements: { flags: { wayBackKnown: true } }, hideWhenLocked: true },
    ],
  },

  /* ====================================================================== */
  /* CHAPTER 2 — deeper branches off each route (content-only expansion)     */
  /* ====================================================================== */

  /* Teddy chapter 2 — the hollow room (reached from T03) */
  T2_A: {
    id: "T2_A", title: "The Hollow Room", location: "Under the Alley", theme: "teddy", cast: ["lostChild"],
    speaker: "Narrator",
    text: "The child leads you down a stair that was not there until it wanted you, into a low room where hollow bears hang from hooks like coats in a cloakroom — rows of them, more than a shop could ever sell, each with a small door open in its back, each one empty, each one still faintly warm. This is where the softness comes from. Not a factory. A wardrobe. They keep the shapes here, on hooks, until a child comes in from the rain cold enough to want putting on.",
    imagePrompt: "storybook illustration of a dim cellar full of hollow teddy bears hanging on hooks, each with a little open door",
    musicCue: "teddy_theme",
    effects: {},
    choices: [
      { id: "T2A_SEARCH", text: "Search the hooks for the child's own missing shape.", nextNodeId: "T2_B", requirements: { stats: { perception: 4 } }, gains: { perception: 1 }, lockedText: "The hollow faces all blur together; you cannot tell them apart." },
      { id: "T2A_GIVE", text: "Give the child your bear, so it isn't the only empty one.", nextNodeId: "END_T_LITTLE_KEEPER", bond: 1 },
      { id: "T2A_WRAP", text: "Wrap one hollow bear to give at the party anyway.", nextNodeId: "END_T_HOLLOW_GIFT" },
      { id: "T2A_BACK", text: "Back out of the cloakroom and find the road again.", nextNodeId: "T04", gains: { perception: 1 } },
    ],
  },
  T2_B: {
    id: "T2_B", title: "The Blue Bear", location: "Under the Alley", theme: "teddy", cast: ["lostChild"],
    speaker: "Lost Child",
    text: "On the lowest hook, where a small child could reach it, hangs a small patched blue bear — and the child beside you makes a sound you have not heard all night, a real one, a laugh with a wet edge. \"That's mine,\" they whisper. \"That's really mine.\" And you understand, all at once and too late to unfeel it, that the child is not leading you to be cruel. The child is down here looking for the rest of themselves. They have been looking a long time. They are so happy they found a piece.",
    imagePrompt: "storybook illustration of a small patched blue teddy bear on a hook, a barefoot child reaching for it with joy",
    musicCue: "teddy_theme",
    effects: {},
    choices: [
      { id: "T2B_RETURN", text: "Lift the blue bear down and give the child back a piece.", nextNodeId: "END_T_REUNITED", gains: { wisdom: 1 } },
      { id: "T2B_LEAVE", text: "Leave them to it and rejoin the road to the party.", nextNodeId: "T04" },
      { id: "T2B_ASK", text: "Ask the blue bear what the shop is afraid of.", nextNodeId: "T04", requirements: { stats: { wisdom: 4 } }, gains: { wisdom: 1 }, setFlags: { learnedFear: true }, lockedText: "It only trembles; it will not tell someone who might still use the shop." },
      { id: "T2B_POCKET", text: "Take the blue bear for yourself and hurry on.", nextNodeId: "T04", costs: { wisdom: 1 }, setFlags: { stoleBlueBear: true }, bond: -1 },
    ],
  },

  /* Candle chapter 2 — the wax museum (reached from C04) */
  C2_A: {
    id: "C2_A", title: "The Wax Museum", location: "Behind the Wax", theme: "candle",
    speaker: "Narrator",
    text: "The wax trail opens into a warm gallery lined with figures on pedestals, and every figure is a child mid-wish — hands lifted, mouth just opening, face lit from within with wanting — caught and cooled in the one instant before the price arrived. The wax is very good. It has eyelashes. It has the little chapped place on the lip. Whoever poured these loved them, in the way a collector loves a thing: completely, and only, and forever exactly as it is. There is an empty pedestal near the back. It is your height.",
    imagePrompt: "storybook illustration of a candlelit gallery of wax figures of children frozen mid-wish",
    musicCue: "candle_theme",
    effects: {},
    choices: [
      { id: "C2A_LOOK", text: "Find the wax figure wearing your face.", nextNodeId: "END_C_WAXWORK", requirements: { stats: { perception: 4 } }, lockedText: "You are too afraid to look that closely." },
      { id: "C2A_MELT", text: "Melt one child free and spend the wish on them.", nextNodeId: "END_C_MELTED_FREE", setFlags: { wishSpent: true } },
      { id: "C2A_SNUFF", text: "Snuff the flame for good and walk away from the bargain.", nextNodeId: "END_C_SNUFFED", requirements: { stats: { wisdom: 4 } }, lockedText: "Your fingers hover, but you cannot yet give up the wish." },
      { id: "C2A_FLEE", text: "Flee the gallery before it pours you a pedestal.", nextNodeId: "C04", gains: { perception: 1 }, setFlags: { fledMuseum: true } },
    ],
  },

  /* Balloon chapter 2 — the ring in the clouds (reached from B04) */
  B2_A: {
    id: "B2_A", title: "The Ring in the Clouds", location: "The High Anchor", theme: "balloon", scene: "sky",
    speaker: "Narrator",
    text: "You climb down your own string to a cold iron ring set into the floor of the clouds, and knotted to it are a hundred more strings, a hundred more, rising away into the dark, each one taut, each one ending in a small far balloon, each balloon a child who stepped outside a shop one evening and went up and was patient and was good and waited to be brought down. No one came. No one was ever going to come. That is the trick of everlasting: it is only the waiting that lasts. You are standing in the anchor of it now, holding the knot that holds them all.",
    imagePrompt: "storybook illustration of an iron ring in the clouds with a hundred balloon strings tied to it, tiny figures far above",
    musicCue: "balloon_theme",
    effects: {},
    choices: [
      { id: "B2A_FREE", text: "Loose every knot and let all of them fall home.", nextNodeId: "END_B_FREED_SKY", requirements: { stats: { strength: 3 } }, lockedText: "The knots are iron-tight; you haven't the strength to loose them all." },
      { id: "B2A_STAY", text: "Tie your own wrist to the ring and wait with them.", nextNodeId: "END_B_ANCHORED" },
      { id: "B2A_CUT", text: "Cut only your own string and leave the rest hanging.", nextNodeId: "END_B_QUIET_RETURN", costs: { strength: 2 }, lockedText: "Your arms are too tired to saw through the cord." },
      { id: "B2A_READ", text: "Read every knotted name, then set every one free.", nextNodeId: "END_B_FREED_SKY", requirements: { stats: { perception: 4 } }, gains: { intelligence: 1 }, setFlags: { readNames: true }, lockedText: "The names blur; you cannot make out whose is whose." },
    ],
  },

  /* Dragon chapter 2 — the toy foundry (reached from D03) */
  D2_A: {
    id: "D2_A", title: "The Toy Foundry", location: "The Foundry", theme: "dragon", cast: ["toySoldier"],
    speaker: "Narrator",
    text: "The soldiers march you into the heat, into a foundry that roars under the whole street, where the shop feeds its old stock — the loved-out, the wound-down, the ones no child came back for — into the fire, and stamps the softened metal into shining new gifts to set under the glass upstairs. Nothing here is wasted. Nothing here is thrown away. It is only melted, and renamed, and sold again, and the ladle that pours the bright new dragons is dark with the old ones, and your dragon presses itself against your chest and growls low, because it can smell, in the smoke, exactly what it is made of.",
    imagePrompt: "storybook illustration of a fiery toy foundry melting old toys into new ones, a clockwork dragon watching",
    musicCue: "dragon_theme",
    effects: {},
    choices: [
      { id: "D2A_JAM", text: "Jam the foundry that melts the loved-out into stock.", nextNodeId: "END_D_FOUNDRY_HALT", requirements: { stats: { strength: 4 } }, lockedText: "The great gears are too heavy to jam by force." },
      { id: "D2A_REBUILD", text: "Rebuild the broken toys instead of feeding the fire.", nextNodeId: "END_D_TOYMAKER", requirements: { stats: { intelligence: 4 } }, lockedText: "The mechanisms are beyond your skill to mend." },
      { id: "D2A_FEED", text: "Feed your dragon into the fire to forge a bigger one anyway.", nextNodeId: "END_D_BIGGER" },
      { id: "D2A_WALKOUT", text: "Say nothing. Slip back out toward the party.", nextNodeId: "D04", gains: { perception: 1 } },
    ],
  },

  /* ====================================================================== */
  /* THE CELLAR BELOW — only opens once the descent is deep (minDread 3+).    */
  /* dread: 4 forces the darkest presentation. Scene reuses the fifth aisle.  */
  /* ====================================================================== */
  CELLAR_1: {
    id: "CELLAR_1", title: "The Cellar Below", location: "Down the Stair", theme: "secret", scene: "fifth", dread: 4,
    speaker: "Narrator",
    text: "The stair goes down much further than the shop is tall. At the bottom the birthday music still plays somewhere above you — thin, and slowing, like a recording of a party you already left. Small doors line the walls, hundreds of them, each the size of a shoebox, and each one, very softly, is breathing.",
    imagePrompt: "storybook illustration of a deep cellar wall covered in hundreds of tiny breathing doors, dim red light",
    musicCue: "secret_theme",
    effects: { setFlags: { inCellar: true } },
    choices: [
      { id: "CE1_OPEN", text: "Open the nearest little door.", nextNodeId: "CELLAR_2" },
      { id: "CE1_CALL", text: "Call out, to see if anything answers.", nextNodeId: "CELLAR_2", requirements: { stats: { wisdom: 4 } }, setFlags: { theyAnswered: true }, lockedText: "Your voice dries up in your throat before it leaves." },
      { id: "CE1_CLIMB", text: "Turn around and climb back toward the party.", nextNodeId: "END_NO_ESCAPE" },
      { id: "CE1_COUNT", text: "Count the little doors as you pass them.", nextNodeId: "CELLAR_2", requirements: { stats: { intelligence: 3 } }, gains: { intelligence: 1 }, setFlags: { countedDoors: true }, lockedText: "You lose count somewhere past a hundred, and start again, and lose it again." },
      { id: "CE1_WALL", text: "A side passage glitters, low down, with something small and frayed. Go to it.", nextNodeId: "CELLAR_BRACELETS", gains: { perception: 1 } },
      { id: "CE1_WORK", text: "One door is larger than the rest, and warm, and leaking a wet and patient sound — a needle drawn slow through cloth, and drawn again. Open that one.", nextNodeId: "UNMAKING_ROOM", requirements: { stats: { perception: 3 } }, lockedText: "You do not want to know what makes that sound. Some mercy in you refuses to reach for the handle." },
    ],
  },
  UNMAKING_ROOM: {
    id: "UNMAKING_ROOM", title: "Where the Work Is Done", location: "The Warm Room", theme: "secret", scene: "fifth", dread: 4,
    speaker: "Narrator",
    text: "The door gives on a low warm room that smells of cut cloth and, underneath the cloth, of something that used to be warm a different way. This is where the shop does its work. A girl sits very still in a good chair while hands you cannot quite see draw waxed thread through her lips, careful stitch over careful stitch — and she keeps trying to finish a sentence around them, \"...but I only wanted to go to the—\", until the thread pulls the last of it shut. The boy beside her is cotton to the elbows already, watching his own hands quietly stop being hands. On hooks along every wall the half-made children hang patient and nearly done, and the worst of it — the part you will not get to un-know — is how gently it is all done, and how each of them was told, first, that it was a gift.",
    imagePrompt: "storybook illustration of a dim warm workroom where children sit very still being sewn into toys, unseen hands, hooks of half-made toys",
    musicCue: "secret_theme",
    effects: { setFlags: { sawTheWork: true } },
    choices: [
      { id: "UNM_FREE", text: "Pull the thread out of her mouth with your fingers, and to hell with what it costs you.", nextNodeId: "END_UNDERSTITCH", requirements: { stats: { strength: 3 } }, lockedText: "Your hands will not obey. Some animal part of you already knows how this ends and refuses to start it." },
      { id: "UNM_SIT", text: "Sit down in the one empty chair. You are so tired, and it all looks so gentle.", nextNodeId: "END_NEW_STOCK" },
      { id: "UNM_NAME", text: "Say the children's names aloud, all of them, so that at least it is witnessed.", nextNodeId: "CELLAR_2", gains: { wisdom: 1 }, setFlags: { witnessedWork: true }, bond: 1 },
      { id: "UNM_DEEPER", text: "There is a drain set into the warm-room floor, wide as a child, and it is where the sound of the work goes to. It does not smell of drains. Go down into it.", nextNodeId: "THE_LARDER", requirements: { stats: { perception: 4 } }, lockedText: "You look at the drain, and the drain, somehow, looks back, and you find you cannot make your feet carry you any nearer to it." },
      { id: "UNM_BACK", text: "Back out. Pull the door shut. Pretend, for as long as you can, that you never opened it.", nextNodeId: "CELLAR_2", setFlags: { pushedItDown: true }, bond: -1, ledger: "hooked" },
    ],
  },
  THE_LARDER: {
    id: "THE_LARDER", title: "The Larder", location: "Inside the Shop", theme: "secret", scene: "fifth", dread: 4,
    speaker: "Narrator",
    text: "You go down into the drain and the walls stop being walls. They go soft. Wet. Working. And you understand it all at once, the way you understand a bad thing in a dream the half-second before it happens: the shop is alive, and it is not a shop, and the toys upstairs were never what it wanted. The toys are the peel. THIS is the larder — the shop's true insides — and this is where it keeps what it actually takes from a late child: not the body, not even the soul, but the warm middle of them. The years. The summers. The laughing. Scooped out gently under the waxed thread and carried down here to be kept, and kept, and kept. Shelves of jars breathe in the pink dark. A whole wall of small mouths, set into the meat of the place, goes on quietly finishing the sentences they were saying the moment the thread pulled shut.",
    imagePrompt: "storybook illustration of a wet organic cavern inside a living shop, shelves of glowing jars, a wall of small mouths in the flesh, sickly pink dark",
    musicCue: "secret_theme",
    effects: { setFlags: { sawTheLarder: true } },
    choices: [
      { id: "LAR_JARS", text: "Go to the shelves. Find the jar with your name on it.", nextNodeId: "THE_MIDDLE", gains: { perception: 1 } },
      { id: "LAR_FEED", text: "It has your middle already; this is only the rest. Open your mouth and let it have you. There is a relief in it, and you are so tired.", nextNodeId: "END_FED" },
      { id: "LAR_GIVE", text: "Try to give it something back — to be sick, to bleed, to offer up any small warm thing it has not already taken.", nextNodeId: "END_NOTHING_LEFT" },
      { id: "LAR_ROOT", text: "Deeper still, the larder narrows to a wet pale root, thick as your leg, pulsing — the cord the whole shop feeds through. Set your teeth to it and bite.", nextNodeId: "END_SALTED_ROOT", requirements: { stats: { strength: 4 } }, lockedText: "You are not strong enough — or not yet ruined enough — to do a thing that final." },
      { id: "LAR_CLIMB", text: "Turn and climb back up the drain toward the warm room. Unsee it. (You cannot. Climb anyway.)", nextNodeId: "CELLAR_2", setFlags: { pushedItDown: true }, ledger: "fled" },
    ],
  },
  THE_MIDDLE: {
    id: "THE_MIDDLE", title: "What It Keeps", location: "Inside the Shop", theme: "secret", scene: "fifth", dread: 4,
    speaker: "Narrator",
    text: "The jars have names. Crayon, or careful cursive, or a small shaking hand — a name on every one, and a slow warm cloud turning inside each where a whole child used to be kept. You find yours. It is emptier than you would like. And beside it, close, because the shop is tidy and it likes to keep friends together — {FRIEND}'s. Half gone. The warmth in it turned the colour of weak tea, and clouding further even as you watch, a laughing girl going out like breath off glass.",
    imagePrompt: "storybook illustration of shelves of glowing jars each holding a child's warmth, two jars side by side going cloudy, sickly light",
    musicCue: "secret_theme",
    effects: {},
    choices: [
      { id: "MID_HER", text: "Take {FRIEND}'s jar and run — carry what is left of her up into the light, and pray there is enough in it to pour back into a girl.", nextNodeId: "END_HER_MIDDLE", gains: { wisdom: 1 }, bond: 1 },
      { id: "MID_MINE", text: "Unscrew your own jar and drink. Take back every warm year it scooped out of you, all at once.", nextNodeId: "END_TOOK_IT_BACK" },
      { id: "MID_BREAK", text: "Break every jar on the shelf at once — free all the stolen years, and to hell with the shop and what the flood does to you.", nextNodeId: "END_SHATTERED", requirements: { stats: { strength: 4 } }, lockedText: "The shelves go on further than your arms or your nerve will reach." },
      { id: "MID_SIT", text: "Sit down among the jars. You are mostly here already; most of your warmth is on these shelves, labelled, cooling.", nextNodeId: "END_MOSTLY_HERE" },
    ],
  },
  CELLAR_BRACELETS: {
    id: "CELLAR_BRACELETS", title: "The Wall of Bracelets", location: "Behind the Little Door", theme: "secret", scene: "fifth", dread: 4,
    speaker: "Narrator",
    text: "The side passage opens onto a wall — floor to ceiling, further than your light reaches — of little bracelets. Hundreds of them, each one frayed, each hung on its own small nail with a paper tag. GRETA, braided from candle-wax. TOMAS, wound out of bent watch-springs. ODILE, gone up to a single knot. SAM, chewed soft as thread. PIA, with every thread pulled out. WREN, knotted tight to a smaller one. On, and on, names you will never learn — a whole childhood of them. Every soft thing on every warm shelf upstairs began down here, as one of these. And there, at the very end, on a fresh bright nail, hangs a blank paper tag, and a bracelet exactly like the frayed one on your own wrist — and the tag is slowly, letter by letter, filling in with your name.",
    imagePrompt: "storybook illustration of a vast dim wall of hundreds of little frayed children's friendship bracelets on nails with paper name tags, one blank tag at the end",
    musicCue: "secret_theme",
    effects: { learn: ["truth_trade"], setFlags: { sawTheWall: true } },
    choices: [
      { id: "CW_READ", text: "Read every single name, slowly, so that at least once someone did.", nextNodeId: "CELLAR_2", gains: { wisdom: 1 }, setFlags: { readTheNames: true }, bond: 1 },
      { id: "CW_JUNE", text: "Search the whole wall for {FRIEND}'s bracelet.", nextNodeId: "CELLAR_2", gains: { perception: 1 }, setFlags: { lookedForHer: true } },
      { id: "CW_TAKE", text: "Take one child's bracelet down, so that one of them leaves here with you.", nextNodeId: "CELLAR_2", requirements: { stats: { wisdom: 3 } }, setFlags: { tookABracelet: true }, bond: 1, lockedText: "To lift one down is to choose one, and to leave all the rest — and you cannot make your hand do it." },
      { id: "CW_FREE_WALL", text: "The two with no toy and nowhere to go — Pia, all her threads pulled out; Wren, knotted to her little brother. Lift them from their nails and carry them out yourself.", nextNodeId: "CELLAR_2", gains: { wisdom: 1 }, bond: 1, freeChild: ["pia", "wren"] },
      { id: "CW_EMPTY", text: "The wall is bare now. Every nail empty but one — yours. Take your own bracelet down too, and let the whole shop end.", nextNodeId: "END_EMPTY_SHELVES", requirements: { flags: { allChildrenFreed: true } }, hideWhenLocked: true },
      { id: "CW_BACK", text: "Back away from the wall and climb, fast, toward the party.", nextNodeId: "END_NO_ESCAPE", ledger: "passed" },
    ],
  },
  CELLAR_2: {
    id: "CELLAR_2", title: "The Shelf of You", location: "Behind the Little Door", theme: "secret", scene: "fifth", dread: 4,
    speaker: "Narrator",
    text: "Behind the little door is a shelf, and on the shelf is you. A small stitched you, button-eyed, in your coat, holding the gift you never bought. Its chest rises and falls. When you lean close it opens its eyes — and they are your eyes — and it whispers, in your voice: \"You came back for me. You always come back.\"",
    imagePrompt: "storybook illustration of a small stitched doll of the boy on a shelf, opening button eyes, dim red glow",
    musicCue: "secret_theme",
    effects: {},
    choices: [
      { id: "CE2_TAKE", text: "Lift the little you down off the shelf.", nextNodeId: "END_TAKEN" },
      { id: "CE2_COUNT", text: "Ask it how many times you have done this.", nextNodeId: "CELLAR_3", requirements: { stats: { intelligence: 4 } }, setFlags: { counted: true }, lockedText: "You are not sure you want the answer, and it can tell." },
      { id: "CE2_SMASH", text: "Smash the shelf and everything on it.", nextNodeId: "END_SHATTERED", requirements: { stats: { strength: 4 } }, lockedText: "Your arm won't obey; some part of you refuses to break it." },
      { id: "CE2_SPEAK", text: "Whisper to it: 'Which one of us is the real one?'", nextNodeId: "CELLAR_3", requirements: { stats: { wisdom: 3 } }, gains: { perception: 1 }, setFlags: { askedReal: true }, lockedText: "You cannot make yourself ask a question you might get answered." },
    ],
  },
  CELLAR_3: {
    id: "CELLAR_3", title: "How Many", location: "Behind the Little Door", theme: "secret", scene: "fifth", dread: 4,
    speaker: "The Little You",
    text: "\"How many?\" The doll smiles with your mouth. \"This is the {CELLAR_COUNT} time you have found the cellar. You free us, or you join us, or you break us — and then the shop tidies up, and winds you back to the empty lot, and you forget, and you are late for the party again.\" Down every door along the wall, the others are listening for what you pick.",
    imagePrompt: "storybook illustration of a wall of tiny doors each with a small stitched boy inside listening, red dark",
    musicCue: "secret_theme",
    effects: {},
    choices: [
      { id: "CE3_FREE", text: "Open every door and free all forty of them — for real, this time.", nextNodeId: "END_FORTY_FIRST", requirements: { stats: { wisdom: 4 } }, lockedText: "There are too many doors, and you are so tired, and it would be so easy to just forget." },
      { id: "CE3_WIND", text: "Let the shop wind you back. It's easier to forget.", nextNodeId: "END_WOUND_BACK" },
      { id: "CE3_TRADE", text: "Offer to take the doll's place, so it can go up in your stead.", nextNodeId: "END_TAKEN" },
      { id: "CE3_SMASHALL", text: "Smash every door, every you, all at once.", nextNodeId: "END_SHATTERED", requirements: { stats: { strength: 4 } }, lockedText: "There are too many, and every one of them is you, and your arms will not." },
      { id: "CE3_JUNE", text: "Ask the doll what really happened to {FRIEND}.", nextNodeId: "CELLAR_4_JUNE", requirements: { flags: { know_truth_trade: true, know_truth_loop: true, know_truth_count: true } }, hideWhenLocked: true },
    ],
  },
  CELLAR_4_JUNE: {
    id: "CELLAR_4_JUNE", title: "What Happened to Her", location: "Behind the Little Door", theme: "secret", scene: "fifth", dread: 4,
    speaker: "The Little You",
    text: "The doll stops smiling. For the first time it looks like you actually feel. \"{FRIEND},\" it says softly. \"You keep her thread on your wrist but you don't know why, do you. She was never just drifting away from you. The shop has been taking her — a birthday here, a year there, her face, her name — a little more each loop, and giving you the forgetting so you wouldn't fight it. The bracelet is the only piece of her it never reached. It's the only proof left that she was ever real. Braid it whole, and you'll have enough of her to pull her back. Let it snap, and there'll be nothing left to pull.\"",
    imagePrompt: "storybook illustration of a stitched doll of a boy gently telling a truth in a dim cellar, a single bright thread glowing",
    musicCue: "secret_theme",
    effects: { learn: ["truth_june"] },
    choices: [
      { id: "CE4_VOW", text: "Swear you'll find the way back to her.", nextNodeId: "END_FORTY_FIRST", requirements: { stats: { wisdom: 4 } }, gains: { wisdom: 1 }, lockedText: "You want to swear it, but you are so tired, and the doors are so many." },
      { id: "CE4_WIND", text: "It's too much. Let the shop wind you back.", nextNodeId: "END_WOUND_BACK" },
      { id: "CE4_TAKE", text: "Take the little you off the shelf and give up.", nextNodeId: "END_TAKEN" },
    ],
  },

  /* ---- THE WAY BACK (true-ending questline capstone) -------------------- */
  F02_WAY_BACK: {
    id: "F02_WAY_BACK", title: "The Way Back", location: "The Fifth Aisle", theme: "secret", scene: "fifth",
    speaker: "Narrator",
    text: "You know all of it now — the trade, the loop, the count, the tired shopkeeper, and the truth about {FRIEND}. You are not here for a gift. You never were. The cat sits on the master shelf where every taken child hangs waiting, and beside them, faint and flickering, is {FRIEND} — half-erased, barely a shape, going out like a held breath. What you have left of her is on your wrist. It will have to be enough.",
    imagePrompt: "storybook illustration of a boy facing a shelf of fading children, one of them a barely-there girl, a bright bracelet on his wrist",
    musicCue: "secret_theme",
    effects: {},
    choices: [
      { id: "WB_WHOLE", text: "Tie the whole, rebraided bracelet around her fading wrist and pull her back with you.", nextNodeId: "END_THE_WAY_BACK", requirements: { flags: { braceletWhole: true } }, hideWhenLocked: true },
      { id: "WB_THREAD", text: "Loop the last thread you have around her wrist and pull, and hope it holds.", nextNodeId: "END_THE_LONG_WAY", requirements: { flags: { braceletSnapped: false, braceletWhole: false } }, hideWhenLocked: true },
      { id: "WB_BARE", text: "Reach for her with your bare, empty hands.", nextNodeId: "END_SO_CLOSE", requirements: { flags: { braceletSnapped: true } }, hideWhenLocked: true },
      { id: "WB_WAIT", text: "You're not ready. Not this run. Step back and keep it whole for next time.", nextNodeId: "F01_FIFTH_AISLE" },
    ],
  },
};

/* -------------------------------------------------------------------------- */
/* ENDINGS                                                                   */
/* -------------------------------------------------------------------------- */
CW.Endings = {
  /* Teddy */
  END_T_GOOD: { number: 1, id: "END_T_GOOD", title: "The Gift That Came Home", category: "Good", route: "teddy",
    text: "You free the spirit stitched into the bear, and a boy who was late to a party long ago finally walks home. You reach {FRIEND}'s door empty-handed and breathless, and you tell her everything — the shop, the bear, the year you went quiet, the bracelet you never finished. She doesn't quite believe the shop part. She believes the sorry part. \"You're the worst at birthdays,\" she says, and pulls you inside, and it is, at last, warm.",
    imagePrompt: "storybook illustration of a spirit boy stepping out of a teddy bear into warm light as a friend opens her door",
    clue: "The bears in that shop were once children who were also late." },
  END_T_BAD: { number: 2, id: "END_T_BAD", title: "Stuffed on the Shelf", category: "Bad", route: "teddy",
    text: "You obey every whisper until the last one asks you to sit very still on the shelf, 'just for a moment.' The shop dims. There is a new bear in the window with your button eyes.",
    imagePrompt: "storybook illustration of a boy turning into a teddy bear on a shop shelf",
    clue: "Obeying the bear blindly leads onto the shelf." },
  END_T_FUNNY: { number: 3, id: "END_T_FUNNY", title: "Birthday Bear Boss", category: "Funny", route: "teddy",
    text: "You wrap the bear and hand it over. Your friend adores it — and so does everyone, because it will not stop talking, ever, about anything, forever. By dessert it is running the party.",
    imagePrompt: "storybook illustration of a teddy bear bossing around a birthday party from atop a cake",
    clue: "The bear makes a loud, unforgettable gift." },

  /* Candle */
  END_C_GOOD: { number: 4, id: "END_C_GOOD", title: "A Wish Well Spent", category: "Good", route: "candle",
    text: "You spend the final wish not on yourself, not on a shortcut, but on {FRIEND} — not that she'd forgive you, but that she'd know, right down to her shoes, how sorry you are and how much the years with her meant. The flame goes out, satisfied. You still have to say it yourself, out loud, at her door. But the wish made you brave enough to. The party glows brighter than any magic could make it.",
    imagePrompt: "storybook illustration of a candle flame going out gently as a boy stands at a friend's glowing door",
    clue: "A wish spent on someone else — and then said aloud — burns brightest." },
  END_C_CURSED: { number: 5, id: "END_C_CURSED", title: "Perfect Party, Empty Chair", category: "Cursed", route: "candle",
    text: "You wish for the perfect party — and get it. Everything is flawless, endless, gleaming. Only later do you notice the birthday chair is empty, and no one remembers whose party it was.",
    imagePrompt: "storybook illustration of a perfect eerie birthday party with one empty chair",
    clue: "Wishing for perfection erases what mattered." },
  END_C_SECRET: { number: 6, id: "END_C_SECRET", title: "The Unburned Wish", category: "Secret", route: "candle",
    text: "You reach the party without spending a single wish. You give your friend the candle, still whole, its one wish waiting. 'Save it,' you tell them, 'for a day you truly need it.' The flame nods.",
    imagePrompt: "storybook illustration of a whole unlit wish candle handed over as a gift",
    clue: "The candle can be given whole, never burned." },

  /* Balloon */
  END_B_GOOD: { number: 7, id: "END_B_GOOD", title: "Sky Delivery", category: "Good", route: "balloon",
    text: "Trusting the balloon, you drift down through the chimney smoke and land in {FRIEND}'s garden exactly as her candles are lit. The whole party gasps, then cheers — but you only have eyes for her, and the way her surprise cracks open into the grin you'd been missing for a year. \"You came out of the SKY,\" she says. \"Show-off.\" You'll take show-off. You'll take anything, as long as she's talking to you again.",
    imagePrompt: "storybook illustration of a boy landing softly from a balloon into a friend's garden party as candles are lit",
    clue: "Trusting the balloon gently carries you home — to her." },
  END_B_BAD: { number: 8, id: "END_B_BAD", title: "Birthday From the Moon", category: "Bad", route: "balloon",
    text: "You cut the string too soon. The balloon keeps rising without you — no, with you — up past the rooftops, the clouds, the birds. You wave at the party far below and wish it a happy birthday from somewhere near the moon.",
    imagePrompt: "storybook illustration of a boy floating away toward the moon on a balloon, tiny party far below",
    clue: "Cutting the string too soon sends you skyward." },
  END_B_FUNNY: { number: 9, id: "END_B_FUNNY", title: "Everyone Loves the Balloon", category: "Funny", route: "balloon",
    text: "You let the balloon float in as the guest of honor. It is, frankly, a better party guest than you — it does tricks, it bumps heads, it never argues. You are politely asked to fetch more snacks.",
    imagePrompt: "storybook illustration of a balloon being celebrated as the star of a birthday party",
    clue: "The balloon can upstage everyone, including you." },

  /* Dragon */
  END_D_GOOD: { number: 10, id: "END_D_GOOD", title: "The Little Guardian", category: "Good", route: "dragon",
    text: "You carry the wounded dragon the rest of the way, and at {FRIEND}'s party it mends itself just enough to curl at her feet, guarding her without ever being told to. She looks from the dragon to you — you, who forgot her last year, who is somehow always late — and something in her face softens. \"You carried this whole way?\" she asks. For me, is the part she doesn't say. You nod. Loyalty, it turns out, cannot be wound up. Only carried. Only earned.",
    imagePrompt: "storybook illustration of a small mended clockwork dragon curled loyally at a girl's feet as she looks up at a boy",
    clue: "Carry the dragon the whole way and it guards without command — the way you should have." },
  END_D_BAD: { number: 11, id: "END_D_BAD", title: "Clockwork Birthday", category: "Bad", route: "dragon",
    text: "You command it to keep fighting and it overheats, throwing sparks that turn the cake, the guests, and finally the whole party into slow, ticking gears. Happy birthday, wound tight.",
    imagePrompt: "storybook illustration of a birthday party frozen into ticking clockwork gears",
    clue: "Commanding the damaged dragon turns the party to gears." },
  END_D_SECRET: { number: 12, id: "END_D_SECRET", title: "The Dragon Who Remembered", category: "Secret", route: "dragon",
    text: "You repair every piece with a gentle hand, and deep in its gears you find a memory: it, too, was made in that shop, to guard a child who never came back. Now it will guard yours. Its ticking finally sounds like a heart.",
    imagePrompt: "storybook illustration of a clockwork dragon waking to a true memory, heart-like glow in its chest",
    clue: "A gently repaired dragon remembers who it was made to guard." },

  /* Shop / meta */
  END_DISPLAY_PRISONER: { number: 13, id: "END_DISPLAY_PRISONER", title: "Display Window Prisoner", category: "Bad", route: "shop",
    text: "You grab all four gifts and bolt for the door — which is no longer there. The shopkeeper only smiles. By morning there are five things in the display window instead of four, and one of them keeps trying to wave.",
    imagePrompt: "storybook illustration of a boy trapped in a shop display window among magical toys",
    clue: "Taking everything makes you part of the display." },
  END_FIFTH_GIFT: { number: 14, id: "END_FIFTH_GIFT", title: "The Fifth Gift", category: "Secret", route: "meta",
    text: "The cat leads you to the gift the shop keeps for itself: a small brass key that fits no door you know. You pocket it and leave. Somewhere, a lock you have not found yet is already waiting.",
    imagePrompt: "storybook illustration of a boy holding a mysterious brass key beside a knowing cat",
    clue: "The fifth aisle holds a key to a lock you have not found." },
  END_TRUE: { number: 15, id: "END_TRUE", title: "Break the Store's Curse", category: "True", route: "meta",
    text: "You understand it now: the shop was never selling gifts. It trades children for them, and has for a very long time. You turn the brass key in the master shelf, and every soft shape on every shelf stands up and walks out into the morning — dozens of lost children, blinking, free. You walk out last, into a grey dawn where the party ended hours ago. {FRIEND} is asleep on her own porch, still in her paper hat, having waited up for a boy who never came. You sit down beside her and, with clumsy fingers, begin to braid her a new bracelet from the shop's last unravelled thread. When she wakes, you will be there. This time, you will be there.",
    imagePrompt: "storybook illustration of a boy braiding a bracelet beside his sleeping friend on a porch at grey dawn, freed children behind",
    clue: "The shop trades children for gifts — the key ends it, and you finally get to stay." },

  /* ---- Chapter 2 endings ------------------------------------------------ */
  /* Teddy */
  END_T_LITTLE_KEEPER: { number: 16, id: "END_T_LITTLE_KEEPER", title: "The Little Keeper", category: "Good", route: "teddy",
    text: "You press your bear into the child's arms. They hold it the way you should have held them, and something in the hollow room warms. You reach the party with nothing to give but the story — and it turns out to be the best gift of the night.",
    imagePrompt: "storybook illustration of a barefoot child hugging a teddy bear in a warm cellar",
    clue: "A bear given to the one who needs it warms the whole room." },
  END_T_HOLLOW_GIFT: { number: 17, id: "END_T_HOLLOW_GIFT", title: "The Hollow Gift", category: "Funny", route: "teddy",
    text: "You wrap a hollow bear in bright paper and present it proudly. Your friend hugs it — and it slowly, quietly deflates in their arms over the course of the party like a sad little balloon. Everyone pretends not to notice. You will never live it down.",
    imagePrompt: "storybook illustration of a slowly deflating empty teddy bear at a birthday party",
    clue: "An empty bear makes an unforgettable, deflating gift." },
  END_T_REUNITED: { number: 18, id: "END_T_REUNITED", title: "The Blue Bear", category: "Secret", route: "teddy",
    text: "The child and their bear, together again, lead you up a stair that lets out one street from the party — no shop in sight. \"We remember the way,\" they say, \"for anyone who comes back for us.\" You are never late again.",
    imagePrompt: "storybook illustration of a child holding a blue bear leading a boy up a glowing stair out of a cellar",
    clue: "Reuniting a child with its bear opens a way out of the shop." },

  /* Candle */
  END_C_WAXWORK: { number: 19, id: "END_C_WAXWORK", title: "Waxwork", category: "Cursed", route: "candle",
    text: "You find the figure that looks like you — half-finished, one hand still soft, waiting to be filled. The candle has not been granting your wishes. It has been taking your measurements. The flame leans close and, gently, begins to pour.",
    imagePrompt: "storybook illustration of a half-finished wax figure of a boy in a candlelit gallery",
    clue: "The candle measures you for a wax figure of your own." },
  END_C_MELTED_FREE: { number: 20, id: "END_C_MELTED_FREE", title: "Melted Free", category: "Good", route: "candle",
    text: "You spend your last wish not on the party but on a stranger, melting one wax child back to warm and breathing life. They blink, and run, and are gone into the night — free. You arrive late and empty-handed and lighter than you have ever been.",
    imagePrompt: "storybook illustration of a wax figure melting into a real child who runs free, warm light",
    clue: "The last wish can melt a trapped child back to life." },
  END_C_SNUFFED: { number: 21, id: "END_C_SNUFFED", title: "The Snuffed Wish", category: "Secret", route: "candle",
    text: "You pinch the flame out between two fingers. It hurts, and then it is simply dark, and the whole museum sags into cooling wax. No wish, no bargain, no price. You walk out of the melting shop having given it exactly nothing — which is the one thing it cannot abide.",
    imagePrompt: "storybook illustration of fingers snuffing a candle flame as a wax museum melts into darkness",
    clue: "Snuffing the candle refuses the bargain entirely." },

  /* Balloon */
  END_B_FREED_SKY: { number: 22, id: "END_B_FREED_SKY", title: "The Freed Sky", category: "Secret", route: "balloon",
    text: "You loose every knot on the ring, and a hundred balloons let go at once — but instead of drifting off, they drift DOWN, gently, each setting a lost someone back on their own rooftop. The sky empties. You are the last one up, and you cut yourself free too, and land at the party as the stars come out.",
    imagePrompt: "storybook illustration of a hundred balloons gently lowering lost people back onto rooftops at dusk",
    clue: "Untying the ring lets every lost balloon set its rider down home." },
  END_B_ANCHORED: { number: 23, id: "END_B_ANCHORED", title: "The New Anchor", category: "Cursed", route: "balloon",
    text: "You tie your wrist to the iron ring so the others will hold steady, just for a moment, just to help. The moment does not end. The clouds close over. Somewhere far below a party goes on without you, and a hundred strings, now steadier, keep you company.",
    imagePrompt: "storybook illustration of a boy tied to an iron ring in the clouds, a hundred balloon strings around him",
    clue: "Tying yourself to the ring makes you its next anchor." },
  END_B_QUIET_RETURN: { number: 24, id: "END_B_QUIET_RETURN", title: "The Quiet Return", category: "Good", route: "balloon",
    text: "You cut only your own string and drift down through the chimney smoke, alone, arriving quietly at the back of the party with grass-stained shoes and a story you will never quite be able to prove. Your friend believes you anyway.",
    imagePrompt: "storybook illustration of a boy landing quietly in a backyard party at dusk, a cut balloon string in hand",
    clue: "Cutting only your own string brings a quiet way home." },

  /* Dragon */
  END_D_FOUNDRY_HALT: { number: 25, id: "END_D_FOUNDRY_HALT", title: "The Halted Foundry", category: "Secret", route: "dragon",
    text: "Your dragon throws itself into the great gears and holds. The stamps stop. The fires gutter. The shop will make no new toys tonight, or ever, from the melted-down old ones. You carry your brave, bent dragon to the party, and it is admired most of all for the dent.",
    imagePrompt: "storybook illustration of a clockwork dragon jamming enormous foundry gears to a stop",
    clue: "Jamming the foundry stops the shop from making more toys." },
  END_D_TOYMAKER: { number: 26, id: "END_D_TOYMAKER", title: "The Toymaker", category: "Good", route: "dragon",
    text: "Instead of scrapping the broken toys, you mend them — a soldier's arm, a bear's seam, a bird's wing — until the whole foundry is a workshop and the toys are lining up to help. You are very, very late to the party. You bring forty friends.",
    imagePrompt: "storybook illustration of a boy repairing broken toys in a foundry turned workshop, mended toys helping",
    clue: "Mending the broken toys turns the foundry into a workshop." },
  END_D_BIGGER: { number: 27, id: "END_D_BIGGER", title: "Bigger", category: "Bad", route: "dragon",
    text: "You feed your loyal dragon into the fire to forge a bigger one, and you get exactly what you asked for: something huge, and gleaming, and utterly cold, that does not know you at all. It follows you to the party out of habit, and eats the cake, and then the table, and then it is still hungry.",
    imagePrompt: "storybook illustration of a huge cold clockwork dragon looming over a birthday party, a small one gone",
    clue: "Trading your dragon for a bigger one leaves you a stranger's monster." },

  /* ---- The Cellar Below (Nightmare endings) ----------------------------- */
  END_NO_ESCAPE: { number: 28, id: "END_NO_ESCAPE", title: "The Stair Only Goes Down", category: "Nightmare", route: "cellar",
    text: "You turn to climb back to the party. You climb. You climb. The music never gets any louder, and the little doors never end, and each step takes you further down than the last. Somewhere above you a boy who is not quite you arrives at the party, on time for once, smiling with your face.",
    imagePrompt: "storybook illustration of a boy climbing an endless downward stair lined with tiny doors, red gloom",
    clue: "From the cellar there is no climbing back up." },
  END_TAKEN: { number: 29, id: "END_TAKEN", title: "You Always Come Back", category: "Nightmare", route: "cellar",
    text: "You lift the little you off the shelf, and the moment your hands close around it, you are the one on the shelf — button-eyed, soft, watching your own coat walk away up the stair. It will go to {FRIEND}'s party wearing your face. It will hand her something wrapped and smile with your mouth, and she will never once know it isn't you — because, if you're honest, you'd been halfway gone from her for a year before you ever found this cellar. The little door swings shut. It is very quiet here, and very small, and you will wait, patient and stuffed, until the next boy comes back for himself.",
    imagePrompt: "storybook illustration from inside a shelf looking out a closing door as a button-eyed boy walks away toward a party",
    clue: "Taking the little you puts you on the shelf — and sends a hollow thing to her in your place." },
  END_SHATTERED: { number: 30, id: "END_SHATTERED", title: "You Felt That", category: "Nightmare", route: "cellar",
    text: "You bring your fist down and the shelf splinters, the little you bursting in a puff of old stuffing — and something behind your own ribs goes out, like a candle, like a held breath let go. You finish the night hollow in a way you cannot name, laughing a little too long at the party, wondering why the cake tastes of dust.",
    imagePrompt: "storybook illustration of a smashed shelf and burst stitched doll, a boy clutching his own chest",
    clue: "Smashing the doll breaks something inside you too." },
  END_FORTY_FIRST: { number: 31, id: "END_FORTY_FIRST", title: "The Forty-First", category: "Nightmare", route: "cellar",
    text: "You open every door. Forty small yous blink, and stand, and climb the stair one after another into the morning — forty birthdays finally kept. Someone has to hold the last door so the shop cannot close it again. You sit down against it, and smile, and wave the last of yourselves up into the light. You are not late anymore. You are simply staying.",
    imagePrompt: "storybook illustration of forty small boys climbing into morning light while one stays to hold a door in the dark",
    clue: "Freeing all forty means one of you must stay to hold the door." },
  END_WOUND_BACK: { number: 32, id: "END_WOUND_BACK", title: "Late Again", category: "Nightmare", route: "cellar",
    text: "\"It's easier,\" you agree, and the doll nods, and the shop reaches in with a small brass key and winds you gently backward — the cellar, the stair, the fence, {FRIEND}'s snorting laugh, her face, all of it folding quietly away — until you are standing on a wet street in the rain, late to a birthday, having forgotten the gift, having forgotten the cold year, having forgotten, already, the name of the girl you were running to. On the corner, a little shop glows warm. The sign reads: CHOOSE WISELY. You have a good feeling about this one.",
    imagePrompt: "storybook illustration of a boy back on the rainy street facing the glowing shop, a girl's face dissolving from memory",
    clue: "Let the shop wind you back and it takes her too — you forget she ever existed." },
  END_JUST_CAME: { number: 34, id: "END_JUST_CAME", title: "You Came Anyway", category: "Good", route: "shop",
    text: "You set the wrapped gift down, unopened, and instead you work the last frayed thread off your wrist and press it into {FRIEND}'s hand. \"I never made you one back,\" you say. \"I'm going to. And I'm sorry — about being late, about last year, about all of it.\" For a moment she just looks at the thread, and then at you, and then she is laughing that awful, snorting laugh you would have known anywhere, and it is as if the cold year never happened at all. You came. You finally, actually came. That was the whole gift.",
    imagePrompt: "storybook illustration of a boy pressing a frayed friendship bracelet thread into his laughing friend's hand at a party",
    clue: "The realest gift was never on the shelf — it was the thread on your wrist." },
  END_COLD_FEET: { number: 35, id: "END_COLD_FEET", title: "Cold Feet", category: "Funny", route: "shop",
    text: "At the very last second, gift in hand, you lose your nerve entirely and bolt back out into the night. You spend {FRIEND}'s whole party standing across the street, clutching a magical present, working up the courage to knock. You never quite do. It becomes a family legend: the year you got all the way to the doorstep.",
    imagePrompt: "storybook illustration of a boy standing across a street clutching a gift, staring at a glowing party he won't enter",
    clue: "You can get all the way to the door and still not knock." },
  END_THE_WAY_BACK: { number: 38, id: "END_THE_WAY_BACK", title: "Both of Us Home", category: "True", route: "meta",
    text: "You tie the whole bracelet — every knot a warm choice, more colors than it ever had — around the fading place where {FRIEND}'s wrist should be. And it holds. It holds. Colour floods back into her, and weight, and her terrible snorting laugh, and she grips your hand hard enough to hurt. You walk out of the fifth aisle together, and behind you every other held breath on every other shelf lets go and follows — forty freed children into a morning that finally, finally comes. The empty lot is just an empty lot. There is no shop. There was a shop, and you beat it, and you remember everything, and {FRIEND} is late to her own party for once, laughing, because she stopped to walk you home. You are not late anymore. Neither of you ever has to be again.",
    imagePrompt: "storybook illustration of a boy and a fully-restored girl walking hand in hand into morning light, freed children behind them, bracelet glowing",
    clue: "Gather the whole truth, keep the bracelet whole, and you bring her all the way back." },
  END_THE_LONG_WAY: { number: 39, id: "END_THE_LONG_WAY", title: "The Long Way Back", category: "Good", route: "meta",
    text: "You loop the one thread you have left around her fading wrist and pull with everything in you. It holds — barely, fraying, but it holds — and {FRIEND} comes back into the world, whole and breathing and free. She just doesn't quite remember you. The thread wasn't enough to carry all of it. She looks at you kindly, a stranger who cried when he saw her, and says, \"Do I know you?\" And you smile, and your voice only shakes a little, and you say, \"Not yet. But you will. I'll do it right this time — the long way, from the start.\" You saved her. You'll have to earn the rest.",
    imagePrompt: "storybook illustration of a boy and a restored girl meeting again as strangers in morning light, a thin thread between their wrists",
    clue: "One thread is enough to save her — but not enough to bring the two of you back." },
  END_SO_CLOSE: { number: 40, id: "END_SO_CLOSE", title: "So Close", category: "Bad", route: "meta",
    text: "You reach for her with your bare hands. You know everything now — the trade, the loop, the whole terrible truth — you know exactly how to save her, and you have nothing to do it with, because somewhere across all those cold small choices you let the last thread of her fray through and fall. Your fingers close on empty air where {FRIEND} used to be, and the last flicker of her goes out, and the shop, very gently, so gently, reaches for the little brass key to wind you back to a street where you will not even remember there was ever anyone to save.",
    imagePrompt: "storybook illustration of a boy reaching with empty hands toward a girl-shaped absence, a brass key gleaming behind him",
    clue: "You can learn every truth and still lose her, if you let the bracelet snap." },
  END_FALSE_VICTORY: { number: 41, id: "END_FALSE_VICTORY", title: "Happily Ever After", category: "Nightmare", route: "meta",
    text: "You give {FRIEND} the gift and she gasps and throws her arms around you, and it is perfect — the party, the cake, the warm gold light, the two of you laughing like the cold year never happened. It is exactly, precisely what you always wanted, down to the very last detail, because it was built from the very last details you can still remember, here in the soft dark of the shelf where you have been for such a long time now. {FRIEND} pulls back to beam at you, and her eyes catch the light, and they are buttons — and you already knew that, and you decide, the way you decide every single time, not to look too closely. Happily ever after. Again. Somewhere above you, gently, the shop turns the page.",
    imagePrompt: "storybook illustration of a warm perfect birthday hug where the friend's eyes are subtly buttons, seen from inside a shelf",
    clue: "Some happy endings are only the shop turning the page for you, on the shelf, in the dark." },
  END_WHOLE_AGAIN: { number: 37, id: "END_WHOLE_AGAIN", title: "Whole Again", category: "Secret", route: "shop",
    text: "You don't give her the shop's gift at all. On the long way here you re-braided the bracelet, thread by thread — every warm choice a new knot — until it was whole again, more colors in it than it started with. You tie it around {FRIEND}'s wrist yourself. \"I kept it,\" you say, which isn't quite true, but \"I made it again\" is, and that's better. She looks at it a long moment. Then she holds up her other wrist — where a frayed thread you never noticed has been hanging on this whole time, too. \"I kept mine,\" she says. It turns out neither of you ever really let go.",
    imagePrompt: "storybook illustration of a boy tying a rebraided colorful bracelet on a girl's wrist while she shows him her own frayed one",
    clue: "Mend the bracelet all the way whole and you find out she kept hers too." },
  END_LAST_THREAD: { number: 36, id: "END_LAST_THREAD", title: "The Last Thread", category: "Bad", route: "shop",
    text: "You reach for the bracelet to give her the last of it — and there is nothing there. It frayed through somewhere back in the shop, in the dark, across a hundred small cold choices you made without noticing: the exact way you lost her the first time. Not all at once. Thread by thread, until there was nothing left to hold. You show {FRIEND} your bare wrist. She doesn't understand — how could she — and you don't have the words either. So you give her the magic gift instead. It is lovely. It is not the point. You both feel the difference, and neither of you says so.",
    imagePrompt: "storybook illustration of a boy showing a girl his bare wrist at a party, an unspoken sadness between them",
    clue: "Fray the bracelet all the way through and there is nothing left to give her." },
  END_THE_REGULAR: { number: 33, id: "END_THE_REGULAR", title: "The Regular", category: "Nightmare", route: "cellar",
    text: "The shopkeeper does not pretend either, not for a regular. He lifts the hinged counter and holds it open for you like a doorman. \"We've been shorthanded,\" he says. \"You know the rule, you know the gifts, you know the stair and everyone on it. Honestly — at this point you practically run the place.\" You step behind the counter. It fits you like a coat you have worn many times. A bell rings. Outside, in the rain, a boy who forgot a present is staring at an empty lot where a shop has just appeared. You smile, and you lean forward, and you already know exactly what you are going to say to him.",
    imagePrompt: "storybook illustration of a boy stepping behind a magic shop counter in a patched coat as a new child arrives in the rain outside",
    clue: "Come back to the shop often enough and it offers you the counter." },
  END_EMPTY_SHELVES: { number: 42, id: "END_EMPTY_SHELVES", title: "The Empty Shelves", category: "True", route: "meta",
    text: "You lift your own bracelet down from the last nail, and the wall is bare. Every shelf in the shop above — the bears, the candles, the balloons, the little wound-down dragons — sits empty, because you came back, and came back, and came back, and carried every stolen child up out of the dark and home. Greta, Tomas, Odile, Sam, Pia, Wren, and all the ones whose names you never learned: gone, out into a rain that feels, for once, like morning. The shop has nothing left to sell. The gold sign gutters, and goes out. And somewhere not far above, at a party you are only a little late to, {FRIEND} turns toward a door — and this time when it opens it is only you, and your two empty hands, and everything you finally understand about staying. It is enough. It was always going to have to be enough. It is.",
    imagePrompt: "storybook illustration of a boy before a wall of empty nails and bare shelves, the gold shop sign gone dark, cold dawn light spilling in",
    clue: "Set free every child the shop ever took, and there is nothing left for it to be." },
  END_NEW_STOCK: { number: 43, id: "END_NEW_STOCK", title: "New Stock", category: "Nightmare", route: "cellar",
    text: "You sit down. The chair is warm from the last one. The hands find your shoulders, kind as anything, and a voice you have heard your whole life leans close and says, pleased, that you were always going to end up in this chair — that of all of them you were the easiest, that you brought yourself, that you saved everyone the trouble of the door. The first stitch does not hurt. That is the trick of it, the mercy of it: none of it hurts. {FRIEND}'s name goes somewhere around the fourth stitch, lifted out clean, and you do not miss it, because missing is a thing that needs a mouth. By the time your lips are a neat closed seam you are only glad — glad to be finished, glad to be soft, glad most of all to be, at last, for sale. A child comes in from the rain with empty hands. You would love to be chosen. You hope it is you.",
    imagePrompt: "storybook illustration from inside: a child in a chair being gently sewn soft, their eyes becoming buttons, warm lamplight",
    clue: "Sit in the warm chair in the workroom and the shop finishes you into stock." },
  END_UNDERSTITCH: { number: 44, id: "END_UNDERSTITCH", title: "Run", category: "Nightmare", route: "cellar",
    text: "You get two stitches out — two — before the warm room decides it has been patient long enough. The girl looks at you through her half-freed mouth, and what she says is not thank you. What she says, wet and urgent around the thread still in her, is run — and you do. You run, and you leave her there on her hook with your two stitches undone and the rest of her still to go, because that is the last thing the shop needs you to understand about yourself: that when it is you or the ones on the hooks, you will save yourself, every time, in every loop, and call it having no choice. You reach the party. Your hands are clean. You are perfectly, permanently fine — and that, and not the room, is the punishment it built for you.",
    imagePrompt: "storybook illustration of a boy fleeing a warm workroom doorway, looking back at a half-sewn girl reaching after him",
    clue: "Try to free the girl in the workroom, fail, and flee — and learn what you always do." },
  END_FED: { number: 45, id: "END_FED", title: "Fed", category: "Nightmare", route: "cellar",
    text: "You open your mouth, because it has the middle of you already and this is only the rest, and the shop drinks the last of you the way a child drinks the dregs of a cup — tilted all the way back, so as not to waste a drop. It is not painful. It is not anything. You go down warm and slow and grateful into the long pink dark, and you become part of the walls that breathe, and the next late child who steps into the warm room upstairs will feel, without ever knowing why, that the place is somehow glad to see them. That gladness is you now. That gladness is all the you there is, or ever will be again.",
    imagePrompt: "storybook illustration of a child dissolving warmly into the pink breathing walls of a living shop's insides",
    clue: "In the larder, let the shop drink the rest of you, and you become the gladness in its walls." },
  END_NOTHING_LEFT: { number: 46, id: "END_NOTHING_LEFT", title: "Nothing Left to Give", category: "Nightmare", route: "cellar",
    text: "You try to give it something back — to be sick, to weep, to bleed, to offer up any small warm thing it has not already taken and jarred and shelved. But you reach down inside yourself and your hand closes on nothing at all. There is no middle left to give. It took that first, gently, years ago, on your very first visit, and everything since has just been the peel of you walking around being late to parties. The shop does not even bother to finish you; there is nothing here worth the thread. It lets you climb back up, hollow and tidy and free, to keep bringing it the ones who are still full.",
    imagePrompt: "storybook illustration of a hollow child-shaped peel standing empty in a wet cavern, a living shop uninterested",
    clue: "Try to give the larder something back and learn it emptied you out long ago." },
  END_SALTED_ROOT: { number: 47, id: "END_SALTED_ROOT", title: "The Root", category: "Secret", route: "cellar",
    text: "Where the larder narrows there is a root: a wet pale cord, thick as your leg, pulsing, the thing the whole shop feeds through. You put your mouth to it, the way it once put its mouth to you, and you bite — and you do not stop biting, through a screaming that is not yours, through the dark going darker, until it parts. The shop shudders from its cellar to its gold sign. It will be a long, long time healing, and it will take fewer children while it does. You will never see the outside of it again; biting the root was the end of you. But somewhere up in the rain, on a corner, a little shop flickers and gutters, and for one whole winter it does not appear at all — and some children simply got to be late, and go home, and grow up. Because of you. It is the only good thing you will ever be certain you did, and you did it with your teeth, in the dark, alone.",
    imagePrompt: "storybook illustration of a child biting through a pale pulsing root deep inside a living shop, the whole structure shuddering",
    clue: "Deep in the larder, bite through the shop's root — you end, but so, for a while, does it." },
  END_HER_MIDDLE: { number: 48, id: "END_HER_MIDDLE", title: "What's Left of Her", category: "Secret", route: "cellar",
    text: "On the shelf of jars you find hers. {FRIEND}'s. Half-empty, the warmth in it gone the colour of weak tea, a slow cloud turning where a whole laughing girl used to be. You take it down. You hold what is left of your best friend in your two hands, and you run — up through the warm room, up the breathing stair, up toward a party and a door and a rain that might, if you are very fast and very lucky, still turn out to be morning. You do not know — you cannot know — whether there is enough of her left in the jar to pour back into a girl. But you are going to carry her up into the light and try. That is the whole of the plan. It is not much of a plan. It is everything you have, and you are running.",
    imagePrompt: "storybook illustration of a boy running up a dark breathing stair cradling a cloudy glowing jar to his chest, faint dawn above",
    clue: "Find {FRIEND}'s jar in the larder and carry what's left of her up toward the light." },
  END_TOOK_IT_BACK: { number: 49, id: "END_TOOK_IT_BACK", title: "Took It Back", category: "Nightmare", route: "cellar",
    text: "You find your own jar and you unscrew it and you drink. You take back every warm year the shop scooped out of you — the fence, the terrible jokes, the pinky-swears, all of it flooding at once into a body that has been peel so long it has forgotten how to hold anything. It is too much. It was always going to be too much. You remember everything now, all of it, all at once, forever, with no way ever to put any of it down again. You walk back up into the rain remembering, and remembering, and remembering, and you never do reach the party, because you keep stopping to remember — and that, the shop could have told you, is exactly why it takes the middle out in the first place. It takes it out to be kind.",
    imagePrompt: "storybook illustration of a child overwhelmed by a flood of glowing memories pouring out of a jar into their chest, drowning in light",
    clue: "Drink your own jar back down and take on every year at once, forever." },
  END_MOSTLY_HERE: { number: 50, id: "END_MOSTLY_HERE", title: "Mostly Here Already", category: "Nightmare", route: "cellar",
    text: "You sit down among the jars. It is quiet here, and warm, and honestly you are most of the way here already — most of your warmth is on these shelves now, labelled, cooling — so it is less like dying and more like finally lying down beside the rest of yourself. You pull a jar of some other child's summer over you like a blanket. You stop being late. You stop being anything at all with a clock in it. Upstairs, after a while, a bell rings for somebody new, and you do not so much as lift your head, because heads are for the ones who still have a middle left to hold them up.",
    imagePrompt: "storybook illustration of a child lying down peacefully among shelves of glowing jars deep in a warm dark cavern",
    clue: "Sit down among the jars in the larder, where most of you already is." },

  /* ---- Endings for the shop wings (Lost & Found, Layaway, Behind the Counter) */
  END_KEPT_WARM: { number: 51, id: "END_KEPT_WARM", title: "Kept Warm", category: "Cursed", route: "shop",
    text: "You lift the whole bracelet out of the bin and put it on, and it settles around your wrist and closes, and it does not come off — because it was always yours. Both your initials and hers, already bright in the weave. You did make her one back. You make her one every single time, and leave it here, in the bin, warm, for the next you to find. The shop has been keeping your good intentions on a shelf for longer than you have been alive. You walk it out into the rain almost happy, and you do not notice that your own wrist has stopped fraying — because there is nothing left inside it to fray.",
    imagePrompt: "storybook illustration of a child's wrist wearing a whole bright friendship bracelet that will not come off, glowing faintly in the rain outside a little shop, Coraline stop-motion felt-and-thread style",
    clue: "The whole, unfrayed bracelet in the bin was always yours — from a loop you don't remember." },
  END_HER_NAME: { number: 52, id: "END_HER_NAME", title: "Her Name in Your Fist", category: "Good", route: "shop",
    text: "You take the tag with her name on it — ink still wet, the balance still only soon — and you run: past the shelves, past the bin, past the counter and the smiling man who does not stop you, because he does not need to. Up, and out, into the rain, with her name shut safe in your fist. It is not much. A scrap of paper, a girl's name, a debt not yet come due. But you got it out. You got something of her out of that place tonight, and you are running with it toward a party where she is still, for now, entirely herself — and you will get there, and you will not be able to explain why you are crying, and she will forgive you before you have finished trying to.",
    imagePrompt: "storybook illustration of a child running out of a shop into the rain clutching a small paper name tag to their chest, warm light spilling behind them, Coraline stop-motion felt-and-thread style",
    clue: "Take {FRIEND}'s layaway tag and run before the shop can fill in the balance." },
  END_ON_LAYAWAY: { number: 53, id: "END_ON_LAYAWAY", title: "Paid in Advance", category: "Nightmare", route: "cellar",
    text: "The tag with your name says soon. You decide to make it now. You climb up onto the shelf among the half-finished toys, and you lie down in the gap that is exactly your size, and you feel the shop's relief go through the whole building like a held breath let out at last. No more waiting. No more late. You settle your account in full, early, of your own accord — and that, the of-your-own-accord, is the part he will tell the next child about, proudly, the way you'd boast of a customer who paid up before the bill even came. You were always the easy one. You brought yourself. You even climbed up.",
    imagePrompt: "storybook illustration of a child lying very still among half-finished toys on a dim back shelf, a paper price tag tied to their wrist, Coraline stop-motion felt-and-thread style",
    clue: "Climb onto the layaway shelf and settle your own balance before it comes due." },
  END_BURNED_BOOK: { number: 54, id: "END_BURNED_BOOK", title: "The Book Closed", category: "Secret", route: "meta",
    text: "You tip the little desk candle onto the open ledger, and the shop's whole memory catches at once — every name, every price, every tidy pre-written future going up in a light warmer than the shop has ever managed on purpose. The shopkeeper does not run for water. He watches it burn with a face you will think about for a long time: not anger — relief, almost, and under it a terrible envy, because he is written in there too, and the fire is at your hands and not his. The book that knew exactly how you end is ash. The shop cannot collect a debt it can no longer remember it is owed. You do not know if it worked. You will find out the only way anyone ever does: by whether you are ever late again.",
    imagePrompt: "storybook illustration of a great ledger ablaze on a desk, a child stepping back into the warm firelight, a tall shopkeeper watching without moving, Coraline stop-motion felt-and-thread style",
    clue: "Burn the great ledger in the back office, and the shop forgets the future it wrote for you." },
  END_EMPTY_COAT: { number: 55, id: "END_EMPTY_COAT", title: "The Keeper Who Emptied the Shop", category: "Good", route: "shop",
    text: "You put on the new coat. It fits, of course it fits, it was cut for you. You step behind the counter, and the shop settles around you satisfied, certain it has won another late child who chose the counter over the shelf. And then you start giving things back. You lift the bear down and open its little door and let the boy inside walk out into the rain. You untie the balloons. You melt the wax children free with your own warm breath. You empty the shelves one small prisoner at a time, and the shop cannot stop you, because you are the keeper now, and the keeper's hands are the only ones it cannot refuse. It will fill again. Shops like this always fill again. But not tonight. Tonight the shelves are bare, and the rain is full of children going home, and you stay, in your coat, behind the counter, holding the door for every last one of them.",
    imagePrompt: "storybook illustration of a child wearing a shopkeeper's coat behind a counter, empty shelves all around, children walking out into rainy dawn light, Coraline stop-motion felt-and-thread style",
    clue: "Take the counter — not to keep the shop, but to empty it, one child at a time." },
  END_YOUR_OWN_FACE: { number: 56, id: "END_YOUR_OWN_FACE", title: "Whose Face", category: "Nightmare", route: "cellar",
    text: "You keep tapping. You are patient. You have, it turns out, all the time in the world. And at last one of them turns round from the glass — the small one who was so sure he knew you — and it is your face. Older, or younger, it is hard to say through the rain-streaked glass, but it is yours, worn smooth the way a coin wears smooth, from being handled, from being here, from doing this exact thing on some other loop until you became the thing on the far side of the window. He lifts one hand and taps back, once, gently, from the inside. He is not asking to be let out. He is showing you where you go. Then he turns round again to watch the street, for the next late child — the way you will, the way you always have, the way you are, if you are honest, already beginning to.",
    imagePrompt: "storybook illustration of a child at a shop display window meeting their own small face pressed to the glass from the inside, rainy street reflected, Coraline stop-motion felt-and-thread style",
    clue: "Make one of the children at the display glass turn around, and see whose face it is." },
};
