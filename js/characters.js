/* ============================================================================
 * characters.js  -  the cast layer. Renders animated SVG characters (the boy,
 * June, the shopkeeper, the chosen gift as a companion, and a few story figures)
 * into a layer above the scene art and behind the dialogue plate. A small
 * director decides who is on stage for each node and highlights who is speaking.
 *
 * The cast ACTS: each builder takes a `pose` and redraws its arms/face to match
 * the beat (the boy is surprised / hopeful / reaching / afraid / sad; June
 * laughs / parties / turns away / rages). Poses come from the node (node.poses)
 * with heuristic fallbacks (dread -> afraid, party -> hopeful). June is staged on
 * the memory beats and the reunion via node.cast; once the haunt scoops a memory
 * clean she turns her back and loses her face.
 *
 * Characters persist between nodes when they stay in the cast (so the boy does
 * not re-pop every line); newcomers animate in, departers animate out, and a
 * character that stays but changes pose re-poses softly in place.
 * Pure vector art — no image files.
 * ========================================================================== */
window.CW = window.CW || {};

CW.Characters = (function () {
  const shadow = (x, w) => `<ellipse cx="${x}" cy="578" rx="${w}" ry="11" fill="rgba(0,0,0,0.33)"/>`;

  /* Each builder returns a <g class="fig ..."> drawn in the 1000x600 space,
     feet around y=575, head high so it reads above the dialogue plate. */

  function boy(opts) {
    const x = 330;
    const pose = (opts && opts.pose) || "idle";
    const hy = pose === "sad" ? 342 : 332;              // head drops when sad
    const lean = pose === "afraid" ? -4 : 0;            // recoil
    const A = "#2b3660"; // arm colour
    const arm = (d) => `<path d="${d}" stroke="${A}" stroke-width="13" stroke-linecap="round" fill="none"/>`;
    let arms;
    if (pose === "surprised") arms = arm(`M${x - 24} 406 q-26 -8 -42 -34`) + arm(`M${x + 24} 406 q26 -8 42 -34`);
    else if (pose === "reach") arms = arm(`M${x - 24} 406 q-6 36 -2 64`) + arm(`M${x + 24} 406 q44 2 74 -12`);
    else if (pose === "afraid") arms = arm(`M${x - 24} 406 q-16 -30 -6 -58`) + arm(`M${x + 24} 406 q16 -30 6 -58`);
    else if (pose === "hopeful") arms = arm(`M${x - 24} 406 q-6 36 -2 64`) + arm(`M${x + 24} 406 q-8 22 -18 32`);
    else arms = arm(`M${x - 24} 406 q-8 38 -4 66`) + arm(`M${x + 24} 406 q8 38 4 66`);
    let face;
    if (pose === "surprised" || pose === "afraid") face = `<circle cx="${x - 9}" cy="${hy}" r="3.4" fill="#2a1c12"/><circle cx="${x + 11}" cy="${hy}" r="3.4" fill="#2a1c12"/><ellipse cx="${x + 3}" cy="${hy + 15}" rx="4" ry="5" fill="#7a4a3a"/>`;
    else if (pose === "sad") face = `<circle cx="${x + 11}" cy="${hy}" r="3" fill="#2a1c12"/><path d="M${x + 2} ${hy + 16} q9 -6 18 0" stroke="#7a4a3a" stroke-width="2" fill="none"/>`;
    else if (pose === "hopeful") face = `<circle cx="${x + 11}" cy="${hy}" r="3" fill="#2a1c12"/><path d="M${x + 3} ${hy + 13} q9 7 17 0" stroke="#7a4a3a" stroke-width="2" fill="none"/>`;
    else face = `<circle cx="${x + 12}" cy="${hy + 1}" r="3.2" fill="#2a1c12"/><path d="M${x + 24} ${hy + 8} q8 4 0 8" stroke="#d8a97f" stroke-width="2" fill="none"/>`;
    return `<g class="fig" style="transform-box:fill-box;transform-origin:bottom center;transform:rotate(${lean / 6}deg)">
      ${shadow(x, 48)}
      <rect x="${x - 14}" y="486" width="13" height="92" rx="6" fill="#1d2338"/>
      <rect x="${x + 1}" y="486" width="13" height="92" rx="6" fill="#232a44"/>
      <path d="M${x - 40} 500 q40 -150 80 0 q-40 22 -80 0z" fill="#2b3660"/>
      <rect x="${x - 26}" y="392" width="52" height="104" rx="18" fill="#34417096"/>
      ${arms}
      <rect x="${x - 26}" y="392" width="52" height="104" rx="18" fill="none" stroke="rgba(255,210,150,0.25)" stroke-width="2"/>
      <rect x="${x - 22}" y="404" width="44" height="14" rx="7" fill="#c0453f"/>
      <circle cx="${x - 26}" cy="398" r="2.8" fill="#20263e"/><circle cx="${x + 26}" cy="398" r="2.8" fill="#20263e"/>
      <line x1="${x}" y1="422" x2="${x}" y2="488" stroke="rgba(18,14,28,0.3)" stroke-width="1.2" stroke-dasharray="2 3"/>
      <rect x="${x - 9}" y="${hy + 34}" width="18" height="26" fill="#e8c4a2"/>
      <circle cx="${x}" cy="${hy}" r="30" fill="#ecc9a6"/>
      <path d="M${x - 30} ${hy - 6} q30 -42 60 0 q-12 -20 -30 -20 q-18 0 -30 20z" fill="#3a2a1c"/>
      ${face}
      <g class="corrupt">
        <ellipse class="detach-shadow" cx="${x - 74}" cy="574" rx="46" ry="10" fill="rgba(0,0,0,0.42)"/>
        <circle cx="${x - 12}" cy="${hy}" r="6.5" fill="#1c120a"/><line x1="${x - 16}" y1="${hy - 4}" x2="${x - 8}" y2="${hy + 4}" stroke="#e8c9a6" stroke-width="1.1"/><line x1="${x - 16}" y1="${hy + 4}" x2="${x - 8}" y2="${hy - 4}" stroke="#e8c9a6" stroke-width="1.1"/>
        <circle cx="${x + 12}" cy="${hy}" r="6.5" fill="#1c120a"/><line x1="${x + 8}" y1="${hy - 4}" x2="${x + 16}" y2="${hy + 4}" stroke="#e8c9a6" stroke-width="1.1"/><line x1="${x + 8}" y1="${hy + 4}" x2="${x + 16}" y2="${hy - 4}" stroke="#e8c9a6" stroke-width="1.1"/>
        <path d="M${x} ${hy - 29} L${x} ${hy + 30}" stroke="#7a5638" stroke-width="1" stroke-dasharray="3 3"/>
      </g>
    </g>`;
  }

  function june(opts) {
    const x = 578;
    const pose = (opts && opts.pose) || "idle";
    const turned = pose === "turned";
    const D = "#3a8f7a"; // dress
    const hy = pose === "laugh" ? 300 : 306;
    const arm = (d) => `<path d="${d}" stroke="${D}" stroke-width="11" stroke-linecap="round" fill="none"/>`;
    let arms;
    if (pose === "laugh") arms = arm(`M${x - 22} 410 q-22 -20 -28 -46`) + arm(`M${x + 22} 410 q22 -20 28 -46`);
    else if (pose === "party") arms = arm(`M${x - 22} 410 q-18 -30 -6 -54`) + arm(`M${x + 22} 410 q18 -30 6 -54`);
    else if (pose === "furious") arms = arm(`M${x - 22} 410 q-30 4 -44 -8`) + arm(`M${x + 22} 410 q30 4 44 -8`);
    else arms = arm(`M${x - 22} 410 q-8 34 -4 60`) + arm(`M${x + 22} 410 q8 34 4 60`);
    let hair, face;
    if (turned) {
      hair = `<path d="M${x - 27} ${hy - 6} q27 -40 54 0 q7 44 -4 68 q-23 12 -46 0 q-11 -24 -4 -68z" fill="#432a18"/>`;
      face = "";
    } else {
      hair = `<path d="M${x - 28} ${hy - 4} q28 -44 56 0 q-10 -22 -28 -22 q-18 0 -28 22z" fill="#432a18"/><path d="M${x - 26} ${hy + 4} q-8 40 4 66" stroke="#432a18" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${x + 26} ${hy + 4} q8 40 -4 66" stroke="#432a18" stroke-width="9" fill="none" stroke-linecap="round"/>`;
      if (pose === "laugh") face = `<path d="M${x - 11} ${hy - 1} q4 -5 8 0" stroke="#2a1c12" stroke-width="2" fill="none"/><path d="M${x + 3} ${hy - 1} q4 -5 8 0" stroke="#2a1c12" stroke-width="2" fill="none"/><path d="M${x - 9} ${hy + 12} q9 12 18 0" stroke="#7a4a3a" stroke-width="2.5" fill="none"/>`;
      else if (pose === "furious") face = `<path d="M${x - 12} ${hy - 4} l8 3 M${x + 12} ${hy - 4} l-8 3" stroke="#2a1c12" stroke-width="2"/><circle cx="${x - 6}" cy="${hy + 1}" r="2.6" fill="#2a1c12"/><circle cx="${x + 6}" cy="${hy + 1}" r="2.6" fill="#2a1c12"/><path d="M${x - 7} ${hy + 15} q7 -4 14 0" stroke="#7a4a3a" stroke-width="2" fill="none"/>`;
      else face = `<circle cx="${x - 6}" cy="${hy + 1}" r="2.8" fill="#2a1c12"/><circle cx="${x + 6}" cy="${hy + 1}" r="2.8" fill="#2a1c12"/><path d="M${x - 7} ${hy + 13} q7 6 14 0" stroke="#7a4a3a" stroke-width="2" fill="none"/>`;
    }
    return `<g class="fig">
      ${shadow(x, 42)}
      <rect x="${x - 11}" y="500" width="10" height="76" rx="5" fill="#2a3038"/>
      <rect x="${x + 1}" y="500" width="10" height="76" rx="5" fill="#2a3038"/>
      <path d="M${x - 34} 512 q34 -122 68 0 z" fill="${D}"/>
      ${arms}
      <rect x="${x - 20}" y="404" width="40" height="72" rx="16" fill="${D}"/>
      <circle cx="${x - 20}" cy="410" r="2.6" fill="#204a40"/><circle cx="${x + 20}" cy="410" r="2.6" fill="#204a40"/>
      <line x1="${x}" y1="416" x2="${x}" y2="470" stroke="rgba(12,30,26,0.32)" stroke-width="1.1" stroke-dasharray="2 3"/>
      <rect x="${x - 7}" y="${hy + 30}" width="14" height="22" fill="#e8c4a2"/>
      <circle cx="${x}" cy="${hy}" r="26" fill="#ecc9a6"/>
      ${hair}${face}
      <g class="corrupt"><circle cx="${x - 6}" cy="${hy + 1}" r="4" fill="#0a0406"/><circle cx="${x + 6}" cy="${hy + 1}" r="4" fill="#0a0406"/></g>
    </g>`;
  }

  function shopkeeper() {
    const x = 715;
    return `<g class="fig loom">
      <ellipse cx="${x}" cy="578" rx="60" ry="12" class="km-shadow" fill="rgba(0,0,0,0.42)"/>
      <path d="M${x - 52} 578 q52 -300 104 0z" fill="#231a2e"/>
      <path d="M${x - 52} 578 q52 -300 104 0z" fill="none" stroke="rgba(255,200,120,0.18)" stroke-width="2"/>
      <rect x="${x - 8}" y="300" width="16" height="60" fill="#2b2038"/>
      <circle cx="${x - 22}" cy="470" r="7" fill="#6a4a86"/><circle cx="${x + 20}" cy="520" r="6" fill="#7a5a2a"/>
      <circle cx="${x}" cy="258" r="30" fill="#d9c2a6"/>
      <path d="M${x - 34} 250 l68 0 l-6 -26 l-56 0z" fill="#1c1428"/>
      <ellipse cx="${x - 40}" cy="250" rx="46" ry="8" fill="#1c1428"/>
      <circle cx="${x - 12}" cy="258" r="3" fill="#2a1c12"/><circle cx="${x + 12}" cy="258" r="3" fill="#2a1c12"/>
      <path d="M${x - 12} 276 q12 8 24 0" stroke="#4a3826" stroke-width="2.5" fill="none"/>
      <g class="corrupt">
        <path class="detach-shadow2" d="M${x - 96} 578 q30 -330 60 0z" fill="rgba(0,0,0,0.5)"/>
        <circle cx="${x - 40}" cy="248" r="2.6" fill="#d05a5a"/><circle cx="${x - 8}" cy="242" r="2.6" fill="#d05a5a"/><circle cx="${x + 22}" cy="246" r="2.6" fill="#d05a5a"/>
        <path d="M${x - 18} 274 q18 16 36 0" stroke="#5a1414" stroke-width="2.5" fill="none"/>
        <path d="M${x - 46} 466 q-28 34 -20 78" stroke="#231a2e" stroke-width="11" stroke-linecap="round" fill="none"/>
      </g>
    </g>`;
  }

  function lostChild() {
    const x = 560;
    return `<g class="fig">
      ${shadow(x, 34)}
      <rect x="${x - 9}" y="500" width="9" height="78" rx="4" fill="#2a2436"/>
      <rect x="${x + 2}" y="500" width="9" height="78" rx="4" fill="#2a2436"/>
      <rect x="${x - 22}" y="440" width="44" height="72" rx="16" fill="#4a4560"/>
      <rect x="${x - 7}" y="420" width="14" height="24" fill="#e0bfa0"/>
      <circle cx="${x}" cy="396" r="24" fill="#e6c6a4"/>
      <path d="M${x - 24} 392 q24 -34 48 0 q-10 -16 -24 -16 q-14 0 -24 16z" fill="#4a3524"/>
      <circle cx="${x - 8}" cy="398" r="2.6" fill="#2a1c12"/><circle cx="${x + 8}" cy="398" r="2.6" fill="#2a1c12"/>
      <path class="km-shadow" d="M${x + 20} 452 q26 -18 40 -8" stroke="#e0bfa0" stroke-width="9" stroke-linecap="round" fill="none"/>
      <g class="corrupt"><circle cx="${x - 8}" cy="398" r="4" fill="#000"/><circle cx="${x + 8}" cy="398" r="4" fill="#000"/><path d="M${x - 8} 410 q8 6 16 0" stroke="#3a2418" stroke-width="1.5" fill="none"/></g>
    </g>`;
  }

  function toySoldier() {
    const x = 650;
    return `<g class="fig march">
      ${shadow(x, 30)}
      <rect x="${x - 20}" y="452" width="40" height="120" rx="8" fill="#7a1e22"/>
      <rect x="${x - 20}" y="452" width="40" height="14" fill="#c9a23a"/>
      <rect x="${x - 20}" y="500" width="40" height="10" fill="#c9a23a"/>
      <circle cx="${x}" cy="424" r="20" fill="#e6c6a4"/>
      <rect x="${x - 22}" y="392" width="44" height="20" rx="4" fill="#1c1830"/>
      <rect x="${x - 8}" y="376" width="16" height="20" rx="4" fill="#c9a23a"/>
      <circle cx="${x - 7}" cy="424" r="2.4" fill="#2a1c12"/><circle cx="${x + 7}" cy="424" r="2.4" fill="#2a1c12"/>
      <rect x="${x + 18}" y="430" width="6" height="80" fill="#8a6a2a"/>
      <g class="corrupt"><circle cx="${x - 7}" cy="424" r="3.2" fill="#000"/><circle cx="${x + 7}" cy="424" r="3.2" fill="#000"/><path d="M${x - 6} 414 l-3 24" stroke="#1a0a0a" stroke-width="1.4"/></g>
    </g>`;
  }

  /* ---- gift companions (float near the boy) ----------------------------- */
  function teddyBuddy() {
    const x = 452, y = 400;
    return `<g class="fig floaty">
      <ellipse cx="${x}" cy="${y}" rx="52" ry="48" fill="url(#glowWarm)" opacity="0.5"/>
      <circle cx="${x}" cy="${y}" r="34" fill="#8a5630"/>
      <circle cx="${x - 24}" cy="${y - 26}" r="15" fill="#8a5630"/><circle cx="${x + 24}" cy="${y - 26}" r="15" fill="#8a5630"/>
      <circle class="km-shadow" cx="${x - 12}" cy="${y - 4}" r="5" fill="rgba(255,225,140,0.98)"/>
      <circle class="km-shadow" cx="${x + 12}" cy="${y - 4}" r="5" fill="rgba(255,225,140,0.98)"/>
      <path d="M${x - 10} ${y + 12} q10 8 20 0" stroke="#3a2212" stroke-width="2.5" fill="none"/>
      <g class="corrupt">
        <path d="M${x - 4} ${y - 28} q4 30 0 56" stroke="#2a160a" stroke-width="2" fill="none"/>
        <ellipse cx="${x}" cy="${y + 4}" rx="7" ry="11" fill="#080406"/>
        <circle cx="${x - 3}" cy="${y}" r="1.8" fill="#e8d0a0"/><circle cx="${x + 3}" cy="${y}" r="1.8" fill="#e8d0a0"/>
      </g>
    </g>`;
  }
  function candleBuddy() {
    const x = 452, y = 420;
    return `<g class="fig floaty">
      <ellipse cx="${x}" cy="${y - 30}" rx="40" ry="52" fill="url(#glowWarm)"/>
      <rect x="${x - 12}" y="${y}" width="24" height="70" rx="6" fill="#efe6d2"/>
      <line x1="${x}" y1="${y}" x2="${x}" y2="${y - 16}" stroke="#20140c" stroke-width="2"/>
      <path class="flame2" d="M${x} ${y - 48} q16 26 0 42 q-16 -18 0 -42z" fill="rgba(255,180,90,0.98)"/>
      <path class="flame2" d="M${x} ${y - 34} q8 14 0 24 q-8 -10 0 -24z" fill="rgba(255,240,190,0.98)"/>
      <g class="corrupt">
        <path d="M${x} ${y - 52} q18 30 0 48 q-18 -20 0 -48z" fill="rgba(24,10,44,0.88)"/>
        <circle cx="${x - 4}" cy="${y - 26}" r="2" fill="#c05a80"/><circle cx="${x + 4}" cy="${y - 26}" r="2" fill="#c05a80"/>
      </g>
    </g>`;
  }
  function balloonBuddy() {
    const x = 470, y = 300;
    return `<g class="fig floaty">
      <ellipse cx="${x}" cy="${y}" rx="66" ry="80" fill="url(#glowCool)" opacity="0.4"/>
      <ellipse cx="${x}" cy="${y}" rx="40" ry="50" fill="#d85454"/>
      <ellipse cx="${x - 14}" cy="${y - 18}" rx="12" ry="20" fill="rgba(255,255,255,0.25)"/>
      <path d="M${x} ${y + 50} l-6 12 l12 0z" fill="#b84545"/>
      <line x1="${x}" y1="${y + 62}" x2="${x - 8}" y2="565" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
      <g class="corrupt">
        <circle cx="${x - 13}" cy="${y - 4}" r="4.5" fill="#140606"/><circle cx="${x + 13}" cy="${y - 4}" r="4.5" fill="#140606"/>
        <path d="M${x - 15} ${y + 16} q15 13 30 0" stroke="#140606" stroke-width="2.5" fill="none"/>
      </g>
    </g>`;
  }
  function dragonBuddy() {
    const x = 456, y = 410;
    return `<g class="fig floaty">
      <ellipse cx="${x}" cy="${y}" rx="56" ry="46" fill="url(#glowWarm)" opacity="0.5"/>
      <path d="M${x - 40} ${y + 20} q-16 -50 34 -60 q26 -30 62 -8 q-20 14 -30 30 q22 20 12 54 q-40 -22 -70 -16z" fill="#8a4326"/>
      <polygon points="${x + 30},${y - 40} ${x + 52},${y - 66} ${x + 54},${y - 34}" fill="#9a4d2c"/>
      <circle class="km-shadow" cx="${x + 40}" cy="${y - 40}" r="5" fill="rgba(255,180,90,0.98)"/>
      <g class="spin2" style="transform-box:fill-box;transform-origin:center"><circle cx="${x - 20}" cy="${y + 6}" r="16" fill="none" stroke="#b8703a" stroke-width="6" stroke-dasharray="8 6"/></g>
      <g class="corrupt">
        <circle cx="${x + 40}" cy="${y - 40}" r="5" fill="#e02020"/>
        <path d="M${x + 18} ${y - 28} l4 9 l4 -9 l4 9 l4 -9 l4 9" stroke="#e8d0a0" stroke-width="1.6" fill="none"/>
      </g>
    </g>`;
  }

  return {
    boy, shopkeeper, june, lostChild, toySoldier,
    teddy_buddy: teddyBuddy, candle_buddy: candleBuddy,
    balloon_buddy: balloonBuddy, dragon_buddy: dragonBuddy,
  };
})();

/* -------------------------------------------------------------------------- */
/* CAST DIRECTOR  -  decides who is on stage and who is speaking.            */
/* -------------------------------------------------------------------------- */
CW.Cast = (function () {
  const SVGNS = "http://www.w3.org/2000/svg";
  const GS = () => CW.GameState;
  const COMPANION = {
    talking_teddy: "teddy_buddy", wish_candle: "candle_buddy",
    everlasting_balloon: "balloon_buddy", clockwork_dragon: "dragon_buddy",
  };
  const SPEAKER_CHAR = {
    "Shopkeeper": "shopkeeper", "Teddy Bear": "teddy_buddy", "Wish Candle": "candle_buddy",
    "Everlasting Balloon": "balloon_buddy", "Clockwork Dragon": "dragon_buddy",
    "Lost Child": "lostChild", "Toy Soldier": "toySoldier",
  };
  const SHOP_NODES = ["S01_ENTER_SHOP", "S02_FOUR_GIFTS", "S03_SHOPKEEPER_WARNING", "S04_CHOOSE_GIFT", "F01_FIFTH_AISLE"];
  const ROUTE_THEMES = ["teddy", "candle", "balloon", "dragon", "party"];

  let svg = null;

  function ensure() {
    const host = document.getElementById("characters");
    if (!host) return null;
    if (!svg) {
      svg = document.createElementNS(SVGNS, "svg");
      svg.setAttribute("id", "char-svg");
      svg.setAttribute("viewBox", "0 0 1000 600");
      svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
      // shared glow gradients (mirrors sceneManager DEFS) so companions glow too
      svg.innerHTML = `<defs>
        <radialGradient id="glowWarm" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(255,200,120,0.55)"/><stop offset="70%" stop-color="rgba(255,170,90,0.08)"/><stop offset="100%" stop-color="rgba(255,170,90,0)"/></radialGradient>
        <radialGradient id="glowCool" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(200,220,255,0.5)"/><stop offset="70%" stop-color="rgba(160,190,255,0.08)"/><stop offset="100%" stop-color="rgba(160,190,255,0)"/></radialGradient></defs>`;
      host.appendChild(svg);
    }
    return svg;
  }

  // Memory-beat nodes replay the past: the gift companion doesn't belong there.
  function isMemory(node) { return !!node.id && node.id.indexOf("TM_") === 0; }

  // What is a character *doing* right now? Explicit node.poses wins; otherwise
  // the boy reacts to the moment (dread makes him flinch, a party lifts him).
  function poseFor(id, node) {
    // Once the haunt has scooped a memory clean, June turns her back — the
    // face is gone even where the beat still plays. This overrides authored pose.
    if (id === "june" && Array.isArray(node.cast) && node.cast.indexOf("june") > -1) {
      let hl = 0; try { hl = GS().hauntLevel(); } catch (e) { hl = 0; }
      if (hl >= 3) return "turned";
    }
    if (node.poses && node.poses[id]) return node.poses[id];
    if (id === "boy") {
      let dl = 0; try { dl = GS().dreadLevel(); } catch (e) { dl = 0; }
      if (dl >= 3) return "afraid";
      if (node.theme === "party") return "hopeful";
    }
    return "idle";
  }

  function castFor(node) {
    const run = GS().getRun();
    const speaker = node.speaker;
    const cast = [{ id: "boy", speaking: false }];

    // (At S03 the painted shopkeeper-reveal background IS him — don't double him up.)
    if ((speaker === "Shopkeeper" || SHOP_NODES.indexOf(node.id) > -1) && node.id !== "S03_SHOPKEEPER_WARNING") {
      cast.push({ id: "shopkeeper", speaking: speaker === "Shopkeeper" });
    }
    const gift = run && run.chosenGift;
    if (gift && COMPANION[gift] && ROUTE_THEMES.indexOf(node.theme) > -1 && !isMemory(node)) {
      cast.push({ id: COMPANION[gift], speaking: SPEAKER_CHAR[speaker] === COMPANION[gift] });
    }
    if (node.id === "T03") cast.push({ id: "lostChild", speaking: speaker === "Lost Child" });
    if (node.id === "D03") cast.push({ id: "toySoldier", speaking: false });
    // A node may name extra cast members directly in data (node.cast).
    if (Array.isArray(node.cast)) {
      node.cast.forEach(function (id) {
        if (CW.Characters[id] && !cast.some(function (c) { return c.id === id; })) {
          cast.push({ id: id, speaking: SPEAKER_CHAR[speaker] === id });
        }
      });
    }
    cast.forEach(function (c) { c.pose = poseFor(c.id, node); });
    return cast;
  }

  function render(node) {
    const s = ensure();
    if (!s) return;
    const cast = castFor(node);
    const want = {};
    cast.forEach((c) => (want[c.id] = c));

    // remove departed
    Array.prototype.slice.call(s.querySelectorAll("[data-char]")).forEach((g) => {
      if (!want[g.getAttribute("data-char")]) {
        g.classList.add("out");
        setTimeout(() => g.remove(), 380);
      }
    });

    // add / update
    cast.forEach((c) => {
      const pose = c.pose || "idle";
      let g = s.querySelector('[data-char="' + c.id + '"].char:not(.out)');
      const build = CW.Characters[c.id];
      if (!g) {
        g = document.createElementNS(SVGNS, "g");
        g.setAttribute("data-char", c.id);
        g.setAttribute("class", "char in");
        g.setAttribute("data-pose", pose);
        if (build) g.innerHTML = build({ pose: pose, speaking: c.speaking });
        s.appendChild(g);
      } else if (g.getAttribute("data-pose") !== pose) {
        // same actor, new beat: re-pose in place (a quick swap, not a re-entry)
        g.setAttribute("data-pose", pose);
        g.classList.add("reposed");
        if (build) g.innerHTML = build({ pose: pose, speaking: c.speaking });
        setTimeout(() => g.classList.remove("reposed"), 420);
      }
      g.classList.toggle("speaking", !!c.speaking);
    });
  }

  function clear() {
    if (svg) svg.querySelectorAll("[data-char]").forEach((g) => g.remove());
  }

  // Let another layer (e.g. the shopkeeper's asides) make an on-stage character
  // lean in and "speak" even when the node's narrator, not they, holds the line.
  function setSpeaking(id, on) {
    if (!svg) return;
    const g = svg.querySelector('[data-char="' + id + '"].char:not(.out)');
    if (g) g.classList.toggle("speaking", !!on);
  }

  return { render, clear, castFor, setSpeaking };
})();
