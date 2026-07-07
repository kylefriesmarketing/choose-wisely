# Choose Wisely

*One shop. Four gifts. Hundreds of endings.*

A standalone, **engine-agnostic** playable book: part interactive fiction, part
stat-driven adventure, part ending-collection game.

**The heart:** **Milo** is running through the rain, late to **June's** birthday —
his best friend, who he drifted from after he forgot her birthday *last* year. He
has no gift, and on his wrist is the friendship bracelet she braided him the
summer they met, worn down to a single thread he never replaced. A short warm
prologue establishes all of it before a shop that shouldn't exist appears on the
corner, offering four magical gifts as a shortcut to buy back something that was
never for sale. Every choice moves four attributes — **Wisdom, Intelligence,
Perception, Strength** — which unlock paths, close others, set hidden flags, and
steer you to collectible endings. The good endings are about *mending June*; the
nightmares are about *losing her* — and at high haunt, the prologue itself decays
until you can't remember her face. (Names are authored but renameable in
Settings; the story fills `{HERO}`/`{FRIEND}` tokens live.)

This is **not** a Roblox game and uses no platform-specific systems. It is built
data-first: a reusable branching-story engine that loads all content from data,
so new nodes, choices, and endings are added by editing data — never the engine.
The web prototype can later be ported to Unity, Godot, Ren'Py, or a custom
engine because the data model is plain and portable.

**Illustrated scenes:** the game uses a visual-novel layout — a full illustrated
scene sits behind a bottom dialogue plate, with animated dust, the dread overlay,
and the character cast layered on top. Twelve painterly storybook illustrations
(the rainy shop street, the shop interior, the four gifts, the breathing alley,
floating over rooftops, the candle, the dragon workshop, the party gate, the
birthday room, the secret aisle) live in `assets/images/<scene>.png`. Each node
maps to a scene via `sceneManager.js` (by `theme`, with per-node overrides); if a
scene has no illustration it **falls back to the animated SVG art** in
`scenes.js`, so the game degrades gracefully. Illustrations also desaturate and
bleed red under dread, same as the vector art.

**Every ending is illustrated too.** All 37 endings have their own painterly card
art in `assets/endings/<END_ID>.png`, shown on the ending screen and as thumbnails
in the ending tracker — which is now an illustrated **gallery**: discovered endings
reveal their art, undiscovered ones stay silhouetted. Any ending without art falls
back to its `imagePrompt` text (`ENDING_IMG` manifest in `uiController.js`).

**Living characters:** an animated cast stands in the scene above the dialogue
plate. A director (`characters.js`, `CW.Cast`) stages who is present for each
node — the boy is always there, the shopkeeper looms in the shop, your chosen
gift appears as a floating companion (bear / candle / balloon / dragon), and
story figures (the lost child, the toy soldiers) show up on their nodes.
Characters persist between nodes and animate in/out, and whoever is speaking is
highlighted with a glow and a talk bob. Also pure SVG. **The cast acts, not just
idles:** each figure carries a **pose** that changes with the beat. The boy is
*surprised* at the impossible shop, *hopeful* at the party, *reaching* as the
balloon-friend drifts away, and *flinching* once dread takes hold — his arms and
face redraw per pose. The **shopkeeper leans in and looms taller** whenever he is
the one speaking. And **June finally appears on screen**: instead of being only
described, she now stands in the memory flashbacks (laughing at the fence, silent
over the cake you missed, drifting away on the balloon with her back turned,
small and *furious* as she stands up for you) and in the present at the birthday
reunion. Poses are data — nodes carry `cast`/`poses`, with sensible fallbacks so
new content just works. As **dread** and **haunt** rise, the cast **corrupts** —
the boy sprouts button eyes and face-stitches (becoming the shelf-doll), the
shopkeeper's shadow detaches and rears up on its own, the gift companions grow
faces, teeth, and dead eyes, and — cruelest of all — once the haunt has scooped a
memory clean, **June turns her back and loses her face** even where the beat
still plays. At the bottom of the descent the whole cast twitches wrong.
Reduce-motion tones it down.

**The Shopkeeper Wakes Up:** he is no longer a signpost. A reactive barb engine
(`shopkeeper.js`, `CW.Shopkeeper`) gives him a voice of his own — short **asides**
that surface *under* the narration, keyed to what you actually did. He throws your
**last run's gift** back at you (*"You gave the balloon last time. It drifted off
by morning. So, eventually, did she."*), reacts to the state of the **bracelet**
(pleased when it snaps, quietly threatened when you've mended it whole and offering
to *buy* it off your wrist), needles your darker little choices (*"Push her down.
You've had so much practice at it, Milo."*), and — once the shop **remembers you**
— starts using your **name**. When he's on stage he **leans in** to murmur it;
when he isn't, the voice arrives **disembodied**, *"from somewhere behind you"* —
and the deeper the **dread**, the more his mask slips (*"Do you still think this is
a shop?"*). Each barb fires at most once per run, so he never repeats himself in a
single descent. He stays silent on the warm street and inside the memory beats
(those are hers), and never talks over a line he's already narrating.

**The Other Children:** you are not the first to come in late with empty hands,
and the shop keeps what it takes — *every soft thing on every shelf was once a
child like you.* A roster (`storyData.js`, `CW.OtherChildren`) of the kids who
chose before you seeds their traces through the shop (`traces.js`, `CW.Traces`):
a **crayon note tucked behind a toy**, a **little frayed bracelet with a name**,
a **face at the rain-streaked window**, and — deepest down — **the toy on the
shelf whispering in a child's voice**. The traces *escalate* with the descent
(a note at the door, a bracelet once dread stirs, faces once the shop remembers
you, whispers at the bottom), each surfaces at most once per run, and on a gift
route the trace prefers **the child whose toy is the one now in your hands** —
so the balloon you're carrying was Odile, the bear was Sam, the dragon was Tomas.
They defer to the shopkeeper when he's speaking (his voice *or* the environment,
never both at once). The **faces at the window** are also literal now (`CW.Faces`):
pale little watchers that gather at the top of the frame — two of them, then
three, then four — as haunt and dread rise, finally paying off the shopkeeper's
*"don't mind the small faces at the window."* And in the cellar, the reveal
lands whole: **The Wall of Bracelets** (`CELLAR_BRACELETS`), floor to ceiling
with hundreds of little frayed bracelets on named nails — Greta, Tomas, Odile,
Sam, Pia, Wren — one blank tag at the end slowly filling in with *your* name.
Reading it teaches the truth that the shop trades children (feeding the
true-ending questline), the same horror you'd otherwise only be *told*.

**The Descent:** the deeper (and darker) a run goes, the worse it gets. A
**dread level** (0–4) rises with depth, dark choices, and node `dread:` floors
(`gameState.js` / `dread.js`). It warps the whole experience: the scene
desaturates and bleeds red, a vignette closes in, the text destabilises, and the
music muffles under a growing sub-drone with whispers and a heartbeat at the
bottom. Once dread is deep enough, hidden `minDread` doors reveal the **Cellar
Below** — a wall of little breathing doors, a stitched copy of you on a shelf,
and five **Nightmare** endings (the shop has done this to you forty times
before). Dread only ever rises within a run; reduce-motion tones the effects
down.

**The Shop Remembers You:** progress persists across runs *and sessions*, and
the more you've seen, the more the shop acknowledges you. A **haunt level** (0–4)
is derived from how many runs you've played, Nightmare endings you've found, and
times you've been *wound back* (`gameState.js`). Higher haunt means: the opening
street and the shopkeeper get **alternate, escalating dialogue** (data-driven
`haunt:` node variants — *"Back again. I kept your spot."*), returning players
**start each run already partway into the dread**, the cellar's count is **live**
(*"the 42nd time you have found the cellar"* — it climbs with your real loops via
a `{CELLAR_COUNT}` token), the main menu murmurs *"You always come back,"* and a
haunt-gated ending — **The Regular** — opens for those who keep returning. The
Ending Tracker shows what the shop remembers about you.

**A living soundtrack:** everything is synthesized with WebAudio in `audio.js` —
no audio files. Instead of random notes, each route now has a **composed
leitmotif** played by a look-ahead scheduler over a soft pad, with a warm
**"June's theme"** carrying the prologue and menu. The music is *living*: every
note reads the current dread level and the bracelet (bond), so as the friendship
frays and the run sinks, the melody **slows, detunes, drops notes, and comes
apart** (clean at whole/calm; ~1.5× slower, 56¢ out of tune, and ~half the notes
failing at snapped-and-deepest). Each scene also has an ambience texture (rain,
wind, clockwork tick, party murmur, candle crackle, …) and **composed ending
stings** — with June's theme resolving warm for the bracelet-mend endings. The 🔊
button is a master mute; Settings "Ambient music" turns just the music off. Every
node's `musicCue` selects its theme.

## Run it

- **Just open it:** double-click `index.html`. Plain HTML/CSS/JS, no build step,
  no dependencies — it runs straight from the file system.
- **Or serve it:** `node server.js`, then open `http://localhost:8531`.

Progress (discovered endings, memory clues, unlocks, settings) saves to
`localStorage` and persists between sessions. The current run auto-saves, so
**Continue** resumes exactly where you left off.

## Architecture

```
choose-wisely/
  index.html
  server.js                 zero-dependency static server (for local preview)
  css/styles.css
  js/
    storyData.js            ALL content: gifts, story nodes, endings (data only)
    gameState.js            RunState + MetaProgress + save/load  (§8, §17)
    requirements.js         is a choice available? + button labels  (§10)
    applyChoice.js          apply costs/gains/flags/inventory, record history
    storyEngine.js          the reusable engine: walk nodes, resolve choices
    scenes.js               animated SVG scene art (12 scenes, no image files)
    characters.js           animated cast (boy, June, shopkeeper, gift companions,
                            story figures) with per-beat poses + a director that
                            stages them and re-poses them per node
    shopkeeper.js           the shopkeeper's reactive barb engine: state-keyed
                            asides he murmurs (or intrudes with) — CW.Shopkeeper
    traces.js               the other children: escalating environmental traces
                            (CW.Traces) + faces at the window (CW.Faces)
    sceneManager.js         picks + renders the scene for each node  (§18.1)
    audio.js                full synth engine: SFX + per-route ambient music +
                            scene ambience textures + ending stingers  (§18.2)
    uiController.js         menu, story view, stat/choice/inventory panels,
                            settings, history, ending screen, ending tracker
    debug.js                developer tools + content validator  (§20)
    main.js                 bootstrap / wiring
```

- **RunState** (`gameState.js`): `currentNodeId, stats, inventory, flags,
  chosenGift, visitedNodes, choiceHistory`.
- **MetaProgress**: `endingsFound, totalRuns, unlockedSecrets, gallery
  (memory clues), settings {showLockedChoices, reduceMotion, textSpeed}`.
- **Choice flow** (`storyEngine.js`): check requirements → if locked, explain and
  don't advance → apply costs → gains → flags → inventory → record → load next
  node/ending → update UI.

## Adding content (no engine changes)

Everything lives in `js/storyData.js`.

### A story node (brief §9)

```js
T05: {
  id: "T05", title: "Scene Title", location: "Where", theme: "teddy",
  speaker: "Teddy Bear",
  text: "The bear leans close...",
  imagePrompt: "storybook illustration of ...",   // placeholder-art hook
  musicCue: "teddy_theme",
  effects: { statChanges: { wisdom: 1 }, setFlags: { heardSecret: true }, addInventory: [] },
  choices: [ /* Choice objects */ ]
}
```

`theme` picks the visual mood: `street | shop | teddy | candle | balloon | dragon | party | secret`.

### A choice (brief §10)

```js
{
  id: "C_LOOK",
  text: "Look closer.",
  nextNodeId: "T06",                       // a node ID or an ending ID
  requirements: {
    stats: { perception: 3 },
    flags: { trustedBear: true },
    inventoryIncludes: ["talking_teddy"],
    chosenGift: "talking_teddy"
  },
  costs: { wisdom: 1 },                     // spent when chosen
  gains: { perception: 2 },                 // rewarded when chosen
  setFlags: { noticed: true }, removeFlags: {},
  addInventory: [], removeInventory: [],
  previewText: "Costs 1 Wisdom. Gain 2 Perception.",  // optional; auto-built if omitted
  lockedText: "You can't quite see it yet.",
  hideWhenLocked: true    // hide (vs grey) when locked — for hard gift/branch gates
}
```

### An ending (brief §16)

```js
END_T_NEW: {
  number: 16, id: "END_T_NEW", title: "A New Ending",
  category: "Good",     // Good | Bad | Funny | Cursed | Secret | True
  route: "teddy",       // teddy | candle | balloon | dragon | shop | meta
  text: "...",
  imagePrompt: "storybook illustration of ...",
  clue: "One line recorded to the Memory page."
}
```

Point any choice's `nextNodeId` at the new node or ending. That's it.

### Verify your content

In-game, press **`~`** (or 🛠) to open Developer Tools → **Scan all nodes**. The
validator reports missing/dangling `nextNodeId`, impossible requirements,
unreachable endings, and orphan nodes. Other tools: jump to any node, set stats,
view flags, trigger any ending.

## MVP content

- Trunk `S00`–`S04`, converging late-game `P01_PARTY_GATE` / `P02_BIRTHDAY_ROOM`.
- Four gift routes — **Teddy** (Wisdom/Perception), **Candle** (Wisdom/
  Intelligence), **Balloon** (Perception/Strength), **Dragon** (Strength/
  Intelligence). Each has a first chapter plus a **second-chapter branch** that
  forks off mid-route (the hollow room, the wax museum, the ring in the clouds,
  the toy foundry).
- **The Bracelet:** June's frayed friendship bracelet is a **visible bond meter**
  in the HUD, starting as a single thread. Warm, honest, June-remembering choices
  **mend** it (weaving threads back in); cold, selfish, forgetting choices **fray**
  it. Rebraid it *whole* and the mend-ending lands harder; **snap** the last thread
  and it's gone for good — a quiet, devastating ending (*The Last Thread*). The
  friendship is literally on screen, gaining and losing threads, all run long.
- **June through the middle:** the moment you take each gift, it triggers a
  specific memory of June that echoes that gift's theme — the teddy is her
  threadbare childhood rabbit and a pinky-swear; the candle is her birthday cake
  you *forgot* last year; the balloon is the slow drift you two never pulled back;
  the dragon is the time she stood up for you. Each memory's choices mend or fray
  the bracelet, and at high haunt the memories themselves decay until you can't
  picture her face. Rebraid the bracelet fully and the secret ending *Whole Again*
  reveals she kept her half of it too.
- The menu itself **decays as the shop remembers you**: at high haunt the title
  screen reddens and pulses, "CHOOSE WISELY" glitches, and the buttons begin to
  lie — *New Run* → *"Come In Out of the Rain.",* *Continue* → *"You Never Left,"*
  *Endings* → *"There Is No Ending."* Deeply haunted players can also stumble on a
  **false-victory** ending at the party that looks like a perfect reunion and is
  quietly, horribly wrong (her eyes are buttons).
- **41 endings** across Good / Bad / Funny / Cursed / Secret / True / **Nightmare**,
  including the hidden **Fifth Aisle**, the **Cellar Below** (see The Descent),
  *The Regular* (see The Shop Remembers), and the **true-ending questline** (below).

**The true-ending questline:** across many runs you gather **the Truth** — five
persistent facts about the shop and about June (it trades children; it winds you
back; the count; the tired shopkeeper; and the real reason the friendship frayed).
Each is learned by reaching a particular ending, or the cellar's June reveal.
Gather all five and **The Way Back** opens deep in the fifth aisle. There, the
climax converges the two core systems into a three-tier ending based on the
bracelet: keep it **whole** and you bring June *all the way back* (*Both of Us
Home*); hold a **single thread** and you save her but she doesn't remember you
(*The Long Way Back*); let it **snap** and you know exactly how to save her with
nothing left to do it (*So Close*). The ending tracker's **The Truth** panel shows
your progress toward it.
- **Every node offers at least four choices** (avg ~4.5). Many converge down the
  same path, but each option carries a different stat, cost, flag, or bit of
  character — so builds and roleplay diverge even where the story doesn't.
- An **illustrated title screen** over the cover art, a short skippable
  **atmospheric intro** before the first run, an **About / credits** screen, the
  stat panel, inventory, choice history, settings, and an illustrated **ending
  gallery** — filter by route and tap any discovered ending to see its full
  illustration, text, and clue. (New Run / Continue / Endings / Settings / About.)

## Meta-progression

- The **Fifth Aisle** unlocks after you discover one ending from each of the four
  gift routes; then feeding the stray cat on the opening street reveals a fifth
  choice.
- The **true ending** readies after you find all four "good" endings.
- Meta unlocks knowledge (hints, memory clues, secret routes) — never permanent
  stat boosts — so choices always keep their consequences.

## Expanding after the MVP

Grow horizontally without rewriting the engine: add nodes, choices, endings,
`imagePrompt` art, and secret branches through data. Each route can grow to 3–5
chapters; endings can grow from 15 to 40 to 100+.
