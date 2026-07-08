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
 * CRAFT: the puppets are drawn to match the game's own stop-motion art — a felt
 * grain filter fuzzes the fabric, seams are stitched, faces carry the signature
 * ONE button eye + one stitched eye (the cast portraits' look; the haunt turns
 * both to buttons via .corrupt), volume comes from soft skin/highlight gradients,
 * hair is layered yarn strands, and a warm rim + blurred contact shadow sit them
 * in the candlelight. Pure vector art — no image files.
 * ========================================================================== */
window.CW = window.CW || {};

CW.Characters = (function () {
  const shadow = (x, w) => `<ellipse cx="${x}" cy="576" rx="${w}" ry="12" fill="rgba(0,0,0,0.34)" filter="url(#kmSoftBlur)"/>`;

  /* ---- shared craft helpers -------------------------------------------- */
  // The game's signature: a sewn-on button for one eye. Dark disc, brass ring,
  // crossed thread, a pin of catch-light so it reads as glossy.
  function buttonEye(cx, cy, r) {
    r = r || 6; const h = r * 0.5;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#15100b"/>`
      + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,207,122,0.6)" stroke-width="1.1"/>`
      + `<path d="M${cx - h} ${cy - h} L${cx + h} ${cy + h} M${cx + h} ${cy - h} L${cx - h} ${cy + h}" stroke="rgba(255,216,150,0.92)" stroke-width="1.1" fill="none"/>`
      + `<circle cx="${cx - r * 0.34}" cy="${cy - r * 0.42}" r="${r * 0.2}" fill="rgba(255,255,255,0.4)"/>`;
  }
  // The eye that is still a child's — a dark stitched almond with a brow stitch.
  function stitchEye(cx, cy) {
    return `<ellipse cx="${cx}" cy="${cy}" rx="3.2" ry="3.6" fill="#241812"/>`
      + `<circle cx="${cx - 1}" cy="${cy - 1.2}" r="1" fill="rgba(255,255,255,0.55)"/>`
      + `<path d="M${cx - 4} ${cy - 5} q4 -2 8 0" stroke="#4a3524" stroke-width="1" fill="none"/>`;
  }
  function freckles(cx, cy) {
    return `<g opacity="0.65" fill="#c98a6a"><circle cx="${cx - 14}" cy="${cy}" r="0.9"/><circle cx="${cx + 14}" cy="${cy}" r="0.9"/><circle cx="${cx - 11}" cy="${cy + 3}" r="0.8"/><circle cx="${cx + 11}" cy="${cy + 3}" r="0.8"/></g>`;
  }
  // Layered yarn strands over a base hair shape.
  function yarnStrands(paths, cols) {
    cols = cols || ["#4a3320", "#5a3f26"];
    return paths.map((d, i) => `<path d="${d}" stroke="${cols[i % cols.length]}" stroke-width="3" stroke-linecap="round" fill="none"/>`).join("");
  }
  // A yarn pigtail that hangs down beside the face (a felt bunch + strands).
  function pigtail(px, py, dir) {
    return `<path d="M${px} ${py - 4} q${dir * 13} 6 ${dir * 9} 32 q${dir * -1} 26 ${dir * -7} 42 q${dir * -11} -4 ${dir * -8} -34 q${dir * 2} -30 ${dir * 6} -46z" fill="#432a18"/>`
      + yarnStrands([`M${px + dir * 2} ${py} q${dir * 9} 22 ${dir * 2} 60`, `M${px + dir * 6} ${py + 2} q${dir * 5} 22 ${dir * -1} 54`], ["#3a2616", "#4a3018"]).replace(/stroke-width="3"/g, 'stroke-width="4"');
  }

  /* Each builder returns a <g class="fig ..."> drawn in the 1000x600 space,
     feet around y=575, head high so it reads above the dialogue plate. */

  function boy(opts) {
    const x = 330;
    const pose = (opts && opts.pose) || "idle";
    const hy = pose === "sad" ? 348 : 340;              // head drops when sad
    const lean = pose === "afraid" ? -4 : 0;            // recoil
    const A = "#2b3660";
    const arm = (d) => `<path d="${d}" stroke="${A}" stroke-width="13" stroke-linecap="round" fill="none"/>` +
      `<path d="${d}" stroke="rgba(255,222,175,0.16)" stroke-width="4" stroke-linecap="round" fill="none"/>`;
    let ap;
    if (pose === "surprised") ap = [`M${x - 24} 406 q-26 -8 -42 -34`, `M${x + 24} 406 q26 -8 42 -34`];
    else if (pose === "reach") ap = [`M${x - 24} 406 q-6 36 -2 64`, `M${x + 24} 406 q44 2 74 -12`];
    else if (pose === "afraid") ap = [`M${x - 24} 406 q-16 -30 -6 -58`, `M${x + 24} 406 q16 -30 6 -58`];
    else if (pose === "hopeful") ap = [`M${x - 24} 406 q-6 36 -2 64`, `M${x + 24} 406 q-8 22 -18 32`];
    else ap = [`M${x - 24} 406 q-8 38 -4 66`, `M${x + 24} 406 q8 38 4 66`];
    const arms = arm(ap[0]) + arm(ap[1]);
    let mouth;
    if (pose === "surprised" || pose === "afraid") mouth = `<ellipse cx="${x + 1}" cy="${hy + 15}" rx="4" ry="5.4" fill="#6f4234"/>`;
    else if (pose === "sad") mouth = `<path d="M${x - 8} ${hy + 16} q9 -6 18 0" stroke="#7a4a3a" stroke-width="2.2" fill="none"/>`;
    else if (pose === "hopeful") mouth = `<path d="M${x - 7} ${hy + 13} q9 7 17 0" stroke="#7a4a3a" stroke-width="2.2" fill="none"/>`;
    else mouth = `<path d="M${x - 6} ${hy + 14} q7 4 14 0" stroke="#8a5a48" stroke-width="2" fill="none"/>`;
    const hair = `<path d="M${x - 30} ${hy - 4} q30 -46 60 0 q-12 -22 -30 -22 q-18 0 -30 22z" fill="#3a2a1c"/>` +
      yarnStrands([`M${x - 24} ${hy - 8} q6 -22 16 -26`, `M${x - 8} ${hy - 14} q2 -20 10 -24`, `M${x + 6} ${hy - 15} q4 -18 12 -20`, `M${x + 19} ${hy - 11} q6 -16 10 -20`, `M${x - 30} ${hy - 2} q-2 -16 6 -24`]);
    return `<g class="fig" style="transform-box:fill-box;transform-origin:bottom center;transform:rotate(${lean / 6}deg)">
      ${shadow(x, 48)}
      <g filter="url(#kmFelt)">
        <rect x="${x - 14}" y="486" width="13" height="92" rx="6" fill="#1d2338"/>
        <rect x="${x + 1}" y="486" width="13" height="92" rx="6" fill="#232a44"/>
        <path d="M${x - 40} 500 q40 -150 80 0 q-40 22 -80 0z" fill="#2b3660"/>
        <rect x="${x - 26}" y="392" width="52" height="104" rx="18" fill="#34417d"/>
        <ellipse cx="${x - 8}" cy="416" rx="19" ry="26" fill="url(#kmHi)"/>
        ${arms}
        <rect x="${x - 22}" y="404" width="44" height="14" rx="7" fill="#c0453f"/>
        <rect x="${x - 22}" y="404" width="44" height="5" rx="2.5" fill="#d76a5f"/>
        <rect x="${x + 3}" y="452" width="16" height="15" rx="3" fill="#3d4a86"/>
        <rect x="${x - 9}" y="${hy + 28}" width="18" height="34" fill="url(#kmSkin)"/>
        <circle cx="${x}" cy="${hy}" r="30" fill="url(#kmSkin)"/>
        <ellipse cx="${x - 9}" cy="${hy - 9}" rx="13" ry="11" fill="url(#kmHi)"/>
        ${hair}
      </g>
      <path d="M${x} 420 L${x} 490" stroke="#e8c07a" stroke-width="1" stroke-dasharray="2 4" opacity="0.45" fill="none"/>
      <path d="M${x + 3} 452 l16 0 M${x + 3} 467 l16 0 M${x + 3} 452 l0 15 M${x + 19} 452 l0 15" stroke="rgba(120,140,210,0.5)" stroke-width="0.9" stroke-dasharray="1.5 2.5" fill="none"/>
      <path d="M${x + 19} ${hy - 22} q15 18 6 40" stroke="rgba(255,226,172,0.4)" stroke-width="2" fill="none"/>
      ${buttonEye(x - 10, hy, 6)}${stitchEye(x + 11, hy)}${mouth}${freckles(x, hy + 6)}
      <g class="corrupt">
        <ellipse class="detach-shadow" cx="${x - 74}" cy="574" rx="46" ry="10" fill="rgba(0,0,0,0.42)"/>
        ${buttonEye(x - 10, hy, 6.5)}${buttonEye(x + 11, hy, 6.5)}
        <path d="M${x} ${hy - 29} L${x} ${hy + 30}" stroke="#7a5638" stroke-width="1" stroke-dasharray="3 3"/>
      </g>
    </g>`;
  }

  function june(opts) {
    const x = 578;
    const pose = (opts && opts.pose) || "idle";
    const turned = pose === "turned";
    const D = "#3a8f7a"; // dress
    const hy = pose === "laugh" ? 310 : 316;
    const AY = 396, TY = 366;               // arm anchor + torso top (kept up to the neck)
    const arm = (d) => `<path d="${d}" stroke="${D}" stroke-width="11" stroke-linecap="round" fill="none"/>` +
      `<path d="${d}" stroke="rgba(255,240,220,0.16)" stroke-width="3.5" stroke-linecap="round" fill="none"/>`;
    let ap;
    if (pose === "laugh") ap = [`M${x - 22} ${AY} q-22 -20 -28 -46`, `M${x + 22} ${AY} q22 -20 28 -46`];
    else if (pose === "party") ap = [`M${x - 22} ${AY} q-18 -30 -6 -54`, `M${x + 22} ${AY} q18 -30 6 -54`];
    else if (pose === "furious") ap = [`M${x - 22} ${AY} q-30 4 -44 -8`, `M${x + 22} ${AY} q30 4 44 -8`];
    else ap = [`M${x - 22} ${AY} q-8 34 -4 60`, `M${x + 22} ${AY} q8 34 4 60`];
    const arms = arm(ap[0]) + arm(ap[1]);
    let hair, face;
    if (turned) {
      hair = `<path d="M${x - 27} ${hy - 6} q27 -40 54 0 q7 44 -4 68 q-23 12 -46 0 q-11 -24 -4 -68z" fill="#432a18"/>` +
        yarnStrands([`M${x - 18} ${hy + 8} q-6 34 2 58`, `M${x} ${hy + 10} q0 34 0 56`, `M${x + 18} ${hy + 8} q6 34 -2 58`], ["#3a2616", "#4a3018"]);
      face = "";
    } else {
      hair = pigtail(x - 23, hy - 2, -1) + pigtail(x + 23, hy - 2, 1) +
        `<path d="M${x - 28} ${hy - 4} q28 -46 56 0 q-10 -22 -28 -22 q-18 0 -28 22z" fill="#432a18"/>` +
        yarnStrands([`M${x - 20} ${hy - 8} q4 -18 12 -22`, `M${x - 4} ${hy - 12} q2 -16 8 -20`, `M${x + 12} ${hy - 10} q4 -14 8 -18`], ["#5a3a1e", "#6a4726"]).replace(/stroke-width="3"/g, 'stroke-width="2.6"');
      let mouth;
      if (pose === "laugh") mouth = `<path d="M${x - 11} ${hy - 1} q4 -5 8 0" stroke="#2a1c12" stroke-width="2" fill="none"/><path d="M${x + 3} ${hy - 1} q4 -5 8 0" stroke="#2a1c12" stroke-width="2" fill="none"/><path d="M${x - 9} ${hy + 12} q9 12 18 0" stroke="#7a4a3a" stroke-width="2.5" fill="none"/>`;
      else if (pose === "furious") mouth = `<path d="M${x - 7} ${hy + 15} q7 -4 14 0" stroke="#7a4a3a" stroke-width="2" fill="none"/>`;
      else mouth = `<path d="M${x - 7} ${hy + 13} q7 6 14 0" stroke="#7a4a3a" stroke-width="2" fill="none"/>`;
      const brow = pose === "furious" ? `<path d="M${x - 12} ${hy - 5} l7 3 M${x + 12} ${hy - 5} l-7 3" stroke="#2a1c12" stroke-width="1.6"/>` : "";
      face = `${buttonEye(x - 6, hy + 1, 5)}${stitchEye(x + 7, hy + 1)}${brow}${mouth}${freckles(x, hy + 5)}`;
    }
    return `<g class="fig">
      ${shadow(x, 42)}
      <g filter="url(#kmFelt)">
        <rect x="${x - 11}" y="500" width="10" height="76" rx="5" fill="#2a3038"/>
        <rect x="${x + 1}" y="500" width="10" height="76" rx="5" fill="#2a3038"/>
        <path d="M${x - 34} 516 q34 -160 68 0 z" fill="${D}"/>
        ${arms}
        <rect x="${x - 20}" y="${TY}" width="40" height="106" rx="16" fill="${D}"/>
        <path d="M${x - 20} ${TY + 6} q20 -14 40 0" fill="none" stroke="#2c6d5d" stroke-width="1.4"/>
        <ellipse cx="${x - 7}" cy="${TY + 36}" rx="14" ry="22" fill="url(#kmHi)"/>
        <rect x="${x - 7}" y="${hy + 24}" width="14" height="${TY - hy - 16}" fill="url(#kmSkin)"/>
        <circle cx="${x}" cy="${hy}" r="26" fill="url(#kmSkin)"/>
        <ellipse cx="${x - 8}" cy="${hy - 8}" rx="11" ry="9" fill="url(#kmHi)"/>
        ${hair}
      </g>
      <path d="M${x} ${TY + 10} L${x} ${TY + 74}" stroke="#7fe0c8" stroke-width="1" stroke-dasharray="2 4" opacity="0.4" fill="none"/>
      ${turned ? "" : `<path d="M${x + 16} ${hy - 18} q13 15 5 34" stroke="rgba(255,238,205,0.4)" stroke-width="1.8" fill="none"/>`}
      ${face}
      <g class="corrupt"><circle cx="${x - 6}" cy="${hy + 1}" r="4" fill="#0a0406"/><circle cx="${x + 6}" cy="${hy + 1}" r="4" fill="#0a0406"/></g>
    </g>`;
  }

  function shopkeeper() {
    const x = 715, hk = 262; // head y
    // A tall stooped figure: a hooded head on narrow shoulders that flare into a
    // long ragged cloak. Shoulders sit right under the neck so nothing floats.
    const cloak = `M${x} 344 C ${x - 34} 348 ${x - 46} 384 ${x - 52} 460 L ${x - 56} 578 L ${x + 56} 578 L ${x + 52} 460 C ${x + 46} 384 ${x + 34} 348 ${x} 344 Z`;
    return `<g class="fig loom">
      <ellipse cx="${x}" cy="578" rx="60" ry="13" class="km-shadow" fill="rgba(0,0,0,0.44)" filter="url(#kmSoftBlur)"/>
      <g filter="url(#kmFelt)">
        <path d="${cloak}" fill="#231a2e"/>
        <path d="${cloak}" fill="none" stroke="rgba(255,200,120,0.15)" stroke-width="1.5"/>
        <path d="M${x} 356 L${x} 560" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="2" stroke-dasharray="3 5"/>
        <ellipse cx="${x - 14}" cy="430" rx="20" ry="80" fill="url(#kmHi)" opacity="0.35"/>
        <rect x="${x - 9}" y="${hk + 22}" width="18" height="40" fill="#2a2038"/>
        <circle cx="${x - 22}" cy="450" r="7" fill="#6a4a86"/><circle cx="${x + 20}" cy="500" r="6" fill="#7a5a2a"/>
        <circle cx="${x}" cy="${hk}" r="30" fill="url(#kmSkinPale)"/>
        <ellipse cx="${x - 10}" cy="${hk - 9}" rx="12" ry="10" fill="url(#kmHi)"/>
        <path d="M${x - 34} ${hk - 2} q34 -54 68 0 q-3 -32 -34 -32 q-31 0 -34 32z" fill="#1a1226"/>
      </g>
      <path d="M${x + 21} ${hk - 16} q14 16 6 36" stroke="rgba(255,214,150,0.3)" stroke-width="2" fill="none"/>
      ${buttonEye(x - 11, hk, 4.6)}${stitchEye(x + 12, hk)}
      <path d="M${x - 14} ${hk + 17} q14 11 28 0" stroke="#4a3826" stroke-width="2.5" fill="none"/>
      <path d="M${x - 14} ${hk + 17} q14 11 28 0" stroke="rgba(90,60,40,0.5)" stroke-width="1" stroke-dasharray="2 2" fill="none"/>
      <g class="corrupt">
        <path class="detach-shadow2" d="M${x - 96} 578 q34 -330 68 0z" fill="rgba(0,0,0,0.5)"/>
        ${buttonEye(x - 11, hk, 5)}${buttonEye(x + 12, hk, 5)}
        <circle cx="${x - 40}" cy="${hk - 10}" r="2.6" fill="#d05a5a"/><circle cx="${x - 8}" cy="${hk - 16}" r="2.6" fill="#d05a5a"/><circle cx="${x + 22}" cy="${hk - 12}" r="2.6" fill="#d05a5a"/>
        <path d="M${x - 18} ${hk + 16} q18 16 36 0" stroke="#5a1414" stroke-width="2.5" fill="none"/>
        <path d="M${x + 48} 430 q30 30 22 74" stroke="#231a2e" stroke-width="11" stroke-linecap="round" fill="none"/>
      </g>
    </g>`;
  }

  function lostChild() {
    const x = 560;
    return `<g class="fig">
      ${shadow(x, 34)}
      <g filter="url(#kmFelt)">
        <rect x="${x - 9}" y="500" width="9" height="78" rx="4" fill="#2a2436"/>
        <rect x="${x + 2}" y="500" width="9" height="78" rx="4" fill="#2a2436"/>
        <rect x="${x - 22}" y="440" width="44" height="72" rx="16" fill="#4a4560"/>
        <ellipse cx="${x - 8}" cy="462" rx="14" ry="20" fill="url(#kmHi)"/>
        <rect x="${x - 7}" y="420" width="14" height="24" fill="url(#kmSkin)"/>
        <circle cx="${x}" cy="396" r="24" fill="url(#kmSkin)"/>
        <ellipse cx="${x - 8}" cy="388" rx="10" ry="8" fill="url(#kmHi)"/>
        <path d="M${x - 24} 392 q24 -34 48 0 q-10 -16 -24 -16 q-14 0 -24 16z" fill="#4a3524"/>
      </g>
      <path class="km-shadow" d="M${x + 20} 452 q26 -18 40 -8" stroke="url(#kmSkin)" stroke-width="9" stroke-linecap="round" fill="none"/>
      ${buttonEye(x - 8, 398, 5)}${stitchEye(x + 8, 398)}
      <g class="corrupt"><circle cx="${x - 8}" cy="398" r="4" fill="#000"/><circle cx="${x + 8}" cy="398" r="4" fill="#000"/><path d="M${x - 8} 410 q8 6 16 0" stroke="#3a2418" stroke-width="1.5" fill="none"/></g>
    </g>`;
  }

  function toySoldier() {
    const x = 650;
    return `<g class="fig march">
      ${shadow(x, 30)}
      <g filter="url(#kmFelt)">
        <rect x="${x - 20}" y="452" width="40" height="120" rx="8" fill="#7a1e22"/>
        <rect x="${x - 20}" y="452" width="40" height="14" fill="#c9a23a"/>
        <rect x="${x - 20}" y="500" width="40" height="10" fill="#c9a23a"/>
        <ellipse cx="${x - 7}" cy="480" rx="12" ry="30" fill="url(#kmHi)" opacity="0.6"/>
        <circle cx="${x}" cy="424" r="20" fill="url(#kmSkin)"/>
        <rect x="${x - 22}" y="392" width="44" height="20" rx="4" fill="#1c1830"/>
        <rect x="${x - 8}" y="376" width="16" height="20" rx="4" fill="#c9a23a"/>
      </g>
      <rect x="${x + 18}" y="430" width="6" height="80" fill="#8a6a2a"/>
      ${buttonEye(x - 7, 424, 4)}${stitchEye(x + 7, 424)}
      <g class="corrupt"><circle cx="${x - 7}" cy="424" r="3.2" fill="#000"/><circle cx="${x + 7}" cy="424" r="3.2" fill="#000"/><path d="M${x - 6} 414 l-3 24" stroke="#1a0a0a" stroke-width="1.4"/></g>
    </g>`;
  }

  /* ---- gift companions (float near the boy) ----------------------------- */
  function teddyBuddy() {
    const x = 452, y = 400;
    return `<g class="fig floaty">
      <ellipse cx="${x}" cy="${y}" rx="52" ry="48" fill="url(#glowWarm)" opacity="0.5"/>
      <g filter="url(#kmFelt)">
        <circle cx="${x}" cy="${y}" r="34" fill="#8a5630"/>
        <circle cx="${x - 24}" cy="${y - 26}" r="15" fill="#8a5630"/><circle cx="${x + 24}" cy="${y - 26}" r="15" fill="#8a5630"/>
        <ellipse cx="${x - 11}" cy="${y - 10}" rx="15" ry="17" fill="url(#kmHi)"/>
        <ellipse cx="${x}" cy="${y + 8}" rx="18" ry="14" fill="#9a6640"/>
      </g>
      ${buttonEye(x - 12, y - 4, 5)}${buttonEye(x + 12, y - 4, 5)}
      <ellipse cx="${x}" cy="${y + 6}" rx="4" ry="3" fill="#3a2212"/>
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
      <g filter="url(#kmFelt)">
        <rect x="${x - 12}" y="${y}" width="24" height="70" rx="6" fill="#efe6d2"/>
        <rect x="${x - 12}" y="${y}" width="9" height="70" rx="4" fill="url(#kmHi)"/>
      </g>
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
      <g filter="url(#kmFelt)">
        <ellipse cx="${x}" cy="${y}" rx="40" ry="50" fill="#d85454"/>
        <ellipse cx="${x - 14}" cy="${y - 18}" rx="12" ry="20" fill="rgba(255,255,255,0.28)"/>
      </g>
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
      <g filter="url(#kmFelt)">
        <path d="M${x - 40} ${y + 20} q-16 -50 34 -60 q26 -30 62 -8 q-20 14 -30 30 q22 20 12 54 q-40 -22 -70 -16z" fill="#8a4326"/>
        <ellipse cx="${x - 4}" cy="${y - 14}" rx="20" ry="16" fill="url(#kmHi)"/>
        <polygon points="${x + 30},${y - 40} ${x + 52},${y - 66} ${x + 54},${y - 34}" fill="#9a4d2c"/>
      </g>
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
      // Shared craft defs: glow gradients (mirror sceneManager), a felt-grain
      // filter, a soft contact-shadow blur, skin + highlight volume gradients.
      svg.innerHTML = `<defs>
        <radialGradient id="glowWarm" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(255,200,120,0.55)"/><stop offset="70%" stop-color="rgba(255,170,90,0.08)"/><stop offset="100%" stop-color="rgba(255,170,90,0)"/></radialGradient>
        <radialGradient id="glowCool" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(200,220,255,0.5)"/><stop offset="70%" stop-color="rgba(160,190,255,0.08)"/><stop offset="100%" stop-color="rgba(160,190,255,0)"/></radialGradient>
        <radialGradient id="kmSkin" cx="40%" cy="34%" r="78%"><stop offset="0%" stop-color="#f2d4b0"/><stop offset="66%" stop-color="#e4bd96"/><stop offset="100%" stop-color="#c69b73"/></radialGradient>
        <radialGradient id="kmSkinPale" cx="42%" cy="34%" r="78%"><stop offset="0%" stop-color="#e6d3ba"/><stop offset="70%" stop-color="#d3bd9f"/><stop offset="100%" stop-color="#b7a184"/></radialGradient>
        <radialGradient id="kmHi" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(255,246,228,0.5)"/><stop offset="60%" stop-color="rgba(255,246,228,0)"/></radialGradient>
        <filter id="kmSoftBlur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.4"/></filter>
        <filter id="kmFelt" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8" result="n"/>
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.4 0" result="d"/>
          <feComposite in="d" in2="SourceAlpha" operator="in" result="dg"/>
          <feTurbulence type="fractalNoise" baseFrequency="1.05" numOctaves="2" seed="21" result="n2"/>
          <feColorMatrix in="n2" type="matrix" values="0 0 0 0 1  0 0 0 0 0.96  0 0 0 0 0.86  0 0 0 0.24 0" result="l"/>
          <feComposite in="l" in2="SourceAlpha" operator="in" result="lg"/>
          <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="dg"/><feMergeNode in="lg"/></feMerge>
        </filter>
      </defs>`;
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
