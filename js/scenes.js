/* ============================================================================
 * scenes.js  -  animated SVG scene backgrounds. Each function returns SVG inner
 * markup (no <svg> wrapper) drawn over the theme gradient sky. Motion is driven
 * by CSS classes (see styles.css: .rain, .flame, .float, .spin, .twinkle, ...).
 * No image files: every scene is vector art, so it ships with the code.
 * ========================================================================== */
window.CW = window.CW || {};

CW.Scenes = (function () {
  const DARK = "rgba(9,6,14,0.72)";
  const DARKER = "rgba(6,4,10,0.88)";

  /* ---- shared builders -------------------------------------------------- */
  function rain(count, op) {
    // Build one 600-tall tile of drops, then render it twice, stacked one tile
    // apart. The .rain group translates down exactly one tile (600u) and loops,
    // so the lower tile lands precisely where the upper one was — seamless,
    // full-height rainfall with no synchronized snap.
    let drops = "";
    for (let i = 0; i < count; i++) {
      const x = Math.round(Math.random() * 1000);
      const y = Math.round(Math.random() * 600);
      const len = 12 + Math.round(Math.random() * 14);
      const o = ((op || 0.28) * (0.6 + Math.random() * 0.6)).toFixed(2);
      drops += `<line x1="${x}" y1="${y}" x2="${x - 3}" y2="${y + len}" stroke="rgba(200,220,255,${o})" stroke-width="1.4"/>`;
    }
    return `<g class="rain"><g transform="translate(0,-600)">${drops}</g><g>${drops}</g></g>`;
  }
  function stars(count) {
    let s = "<g>";
    for (let i = 0; i < count; i++) {
      const x = Math.round(Math.random() * 1000);
      const y = Math.round(Math.random() * 320);
      const r = Math.random() * 1.4 + 0.6;
      const d = (Math.random() * 3).toFixed(2);
      s += `<circle class="twinkle" style="animation-delay:${d}s" cx="${x}" cy="${y}" r="${r}" fill="rgba(255,245,220,0.9)"/>`;
    }
    return s + "</g>";
  }
  function motes(count, color) {
    let s = "<g>";
    for (let i = 0; i < count; i++) {
      const x = Math.round(Math.random() * 1000);
      const y = 200 + Math.round(Math.random() * 400);
      const r = Math.random() * 2 + 1;
      const d = (Math.random() * 6).toFixed(2);
      s += `<circle class="rise" style="animation-delay:${d}s" cx="${x}" cy="${y}" r="${r}" fill="${color || "rgba(255,210,140,0.7)"}"/>`;
    }
    return s + "</g>";
  }
  function gear(cx, cy, r, color, cls) {
    return `<g class="${cls || "spin"}" style="transform-box:fill-box;transform-origin:center">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${r * 0.34}" stroke-dasharray="${(r * 0.5).toFixed(0)} ${(r * 0.34).toFixed(0)}"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.52}" fill="none" stroke="${color}" stroke-width="${r * 0.12}"/>
      <circle cx="${cx}" cy="${cy}" r="${r * 0.16}" fill="${color}"/></g>`;
  }
  const moon = (cx, cy, r) =>
    `<circle cx="${cx}" cy="${cy}" r="${r * 2.4}" fill="url(#glowCool)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(245,240,225,0.95)"/>`;

  /* ---- scenes ----------------------------------------------------------- */
  function street() {
    return `${stars(40)}${moon(830, 110, 46)}
      <g fill="${DARKER}">
        <rect x="-20" y="430" width="300" height="200"/><rect x="60" y="360" width="120" height="270"/>
        <rect x="720" y="400" width="320" height="230"/><rect x="840" y="330" width="120" height="300"/>
      </g>
      <!-- the magical shop -->
      <g>
        <rect x="360" y="300" width="280" height="330" fill="rgba(20,12,8,0.92)"/>
        <polygon points="345,300 655,300 500,225" fill="rgba(28,16,10,0.95)"/>
        <ellipse cx="500" cy="470" rx="230" ry="150" fill="url(#glowWarm)"/>
        <rect class="flick" x="395" y="360" width="90" height="120" rx="6" fill="rgba(255,205,130,0.85)"/>
        <rect class="flick" style="animation-delay:.5s" x="515" y="360" width="90" height="120" rx="6" fill="rgba(255,205,130,0.8)"/>
        <rect x="470" y="500" width="60" height="130" fill="rgba(255,190,110,0.55)"/>
        <rect x="405" y="268" width="190" height="34" rx="6" fill="rgba(40,24,14,0.95)"/>
        <text x="500" y="292" text-anchor="middle" font-family="Georgia,serif" font-size="17" fill="rgba(255,214,150,0.95)" letter-spacing="2">CHOOSE WISELY</text>
      </g>
      <!-- stray cat -->
      <g class="sway" style="transform-box:fill-box;transform-origin:bottom center"><path d="M300 600 q6 -34 22 -34 q-6 -18 4 -24 q8 8 8 18 q10 -8 18 0 q6 6 2 30 z" fill="rgba(8,6,10,0.95)"/><circle cx="345" cy="556" r="2" fill="rgba(255,220,120,0.9)"/></g>
      <rect x="0" y="596" width="1000" height="60" fill="rgba(0,0,0,0.55)"/>
      ${rain(46, 0.3)}`;
  }

  function shop() {
    return `${motes(26)}
      <g fill="${DARKER}">
        <polygon points="0,0 250,0 190,600 0,600"/><polygon points="1000,0 750,0 810,600 1000,600"/>
      </g>
      <!-- hanging lanterns -->
      ${[180, 500, 820].map((x, i) => `<g class="sway" style="transform-box:fill-box;transform-origin:${x}px 60px;animation-delay:${i * .4}s">
        <line x1="${x}" y1="0" x2="${x}" y2="120" stroke="rgba(0,0,0,0.5)" stroke-width="3"/>
        <ellipse cx="${x}" cy="150" rx="70" ry="70" fill="url(#glowWarm)"/>
        <circle class="flame" style="transform-box:fill-box;transform-origin:center" cx="${x}" cy="140" r="14" fill="rgba(255,210,130,0.95)"/></g>`).join("")}
      <!-- shelves of toys (silhouette blocks) -->
      <g fill="rgba(12,8,14,0.8)">
        <rect x="40" y="360" width="230" height="26"/><rect x="60" y="470" width="210" height="26"/>
        <rect x="730" y="360" width="230" height="26"/><rect x="740" y="470" width="210" height="26"/>
      </g>
      <g fill="rgba(20,12,10,0.9)">
        <rect x="70" y="322" width="30" height="38"/><circle cx="140" cy="342" r="18"/><rect x="190" y="318" width="24" height="42"/>
        <rect x="770" y="322" width="26" height="38"/><circle cx="850" cy="342" r="18"/><rect x="900" y="320" width="24" height="40"/>
      </g>
      <!-- counter -->
      <rect x="330" y="470" width="340" height="130" fill="rgba(30,18,12,0.95)"/>
      <ellipse cx="500" cy="470" rx="150" ry="60" fill="url(#glowWarm)"/>`;
  }

  function gifts() {
    return `${motes(20)}
      <ellipse cx="500" cy="330" rx="360" ry="200" fill="url(#glowWarm)" opacity="0.5"/>
      <rect x="180" y="430" width="640" height="30" fill="rgba(28,18,12,0.95)"/>
      <path d="M180 430 q320 -120 640 0" fill="none" stroke="rgba(255,220,150,0.25)" stroke-width="2"/>
      <!-- four gifts -->
      <g class="float"><g style="transform-box:fill-box;transform-origin:center">
        <circle cx="290" cy="392" r="30" fill="rgba(150,96,50,0.95)"/><circle cx="278" cy="384" r="4" fill="rgba(255,220,120,0.95)"/><circle cx="302" cy="384" r="4" fill="rgba(255,220,120,0.95)"/>
        <circle cx="290" cy="360" r="30" fill="url(#glowWarm)"/></g></g>
      <g class="float" style="animation-delay:.5s"><g>
        <rect x="424" y="360" width="16" height="60" fill="rgba(240,235,220,0.9)"/><path class="flame" style="transform-box:fill-box;transform-origin:center" d="M432 340 q10 14 0 26 q-10 -12 0 -26z" fill="rgba(255,200,110,0.98)"/>
        <ellipse cx="432" cy="350" rx="46" ry="52" fill="url(#glowWarm)"/></g></g>
      <g class="float" style="animation-delay:1s"><g>
        <ellipse cx="576" cy="356" rx="30" ry="36" fill="rgba(220,90,90,0.92)"/><line x1="576" y1="392" x2="576" y2="426" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
        <ellipse cx="576" cy="356" rx="50" ry="56" fill="url(#glowCool)" opacity="0.5"/></g></g>
      <g class="float" style="animation-delay:1.5s">${gear(712, 370, 26, "rgba(210,130,60,0.95)")}<ellipse cx="712" cy="372" rx="52" ry="46" fill="url(#glowWarm)" opacity="0.5"/></g>`;
  }

  function teddy() {
    return `${motes(16, "rgba(255,190,120,0.6)")}
      <ellipse cx="500" cy="360" rx="380" ry="240" fill="url(#glowWarm)" opacity="0.4"/>
      <!-- watching toys -->
      <g fill="rgba(10,7,12,0.85)"><circle cx="120" cy="470" r="26"/><circle cx="880" cy="470" r="26"/><rect x="180" y="470" width="24" height="80"/><rect x="800" y="470" width="24" height="80"/></g>
      <g fill="rgba(255,210,120,0.85)"><circle cx="112" cy="466" r="3"/><circle cx="128" cy="466" r="3"/><circle cx="872" cy="466" r="3"/><circle cx="888" cy="466" r="3"/></g>
      <!-- big teddy -->
      <g class="breathe" style="transform-box:fill-box;transform-origin:center bottom">
        <circle cx="500" cy="300" r="120" fill="rgba(120,74,40,0.96)"/>
        <circle cx="420" cy="215" r="46" fill="rgba(120,74,40,0.96)"/><circle cx="580" cy="215" r="46" fill="rgba(120,74,40,0.96)"/>
        <ellipse cx="500" cy="470" rx="150" ry="120" fill="rgba(120,74,40,0.96)"/>
        <circle class="flick" cx="462" cy="286" r="12" fill="rgba(255,225,140,0.98)"/><circle class="flick" style="animation-delay:.4s" cx="538" cy="286" r="12" fill="rgba(255,225,140,0.98)"/>
        <path d="M470 340 q30 26 60 0" stroke="rgba(40,22,12,0.9)" stroke-width="4" fill="none"/>
        <line x1="500" y1="200" x2="500" y2="560" stroke="rgba(60,34,18,0.7)" stroke-width="3" stroke-dasharray="8 8"/>
      </g>`;
  }

  function alley() {
    return `<g class="breathe" style="transform-box:fill-box;transform-origin:left center"><polygon points="0,0 300,120 300,480 0,600" fill="${DARKER}"/></g>
      <g class="breathe" style="transform-box:fill-box;transform-origin:right center;animation-delay:.6s"><polygon points="1000,0 700,120 700,480 1000,600" fill="${DARKER}"/></g>
      <!-- brick lines -->
      <g stroke="rgba(255,255,255,0.05)" stroke-width="2">
        <line x1="40" y1="180" x2="290" y2="230"/><line x1="40" y1="300" x2="290" y2="330"/><line x1="40" y1="420" x2="290" y2="430"/>
        <line x1="960" y1="180" x2="710" y2="230"/><line x1="960" y1="300" x2="710" y2="330"/><line x1="960" y1="420" x2="710" y2="430"/>
      </g>
      <ellipse cx="500" cy="300" rx="120" ry="200" fill="url(#glowWarm)" opacity="0.35"/>
      <!-- teeth at the far end -->
      <g fill="rgba(20,10,10,0.9)"><polygon points="420,240 440,300 460,240"/><polygon points="470,240 490,310 510,240"/><polygon points="520,240 540,305 560,240"/><polygon points="570,240 590,300 610,240"/>
        <polygon points="430,360 450,300 470,360"/><polygon points="490,370 510,300 530,370"/><polygon points="540,365 560,300 580,365"/></g>
      <circle class="flick" cx="500" cy="300" r="10" fill="rgba(255,120,90,0.9)"/>
      ${motes(10, "rgba(255,120,90,0.5)")}`;
  }

  function candle() {
    return `<ellipse cx="500" cy="360" rx="260" ry="300" fill="url(#glowWarm)"/>
      <!-- warped decorations -->
      <g stroke="rgba(255,180,110,0.3)" stroke-width="3" fill="none"><path class="sway" style="transform-box:fill-box;transform-origin:center" d="M120 140 q60 40 0 80 q-60 40 0 80"/><path class="sway" style="transform-box:fill-box;transform-origin:center;animation-delay:.5s" d="M880 140 q-60 40 0 80 q60 40 0 80"/></g>
      <!-- candle -->
      <rect x="470" y="330" width="60" height="240" rx="8" fill="rgba(235,225,205,0.95)"/>
      <path d="M470 350 q-14 40 4 90 M530 350 q14 50 -2 100" stroke="rgba(255,255,255,0.4)" stroke-width="3" fill="none"/>
      <line x1="500" y1="330" x2="500" y2="300" stroke="rgba(20,14,10,0.9)" stroke-width="3"/>
      <g class="flame" style="transform-box:fill-box;transform-origin:center bottom">
        <path d="M500 210 q40 60 0 96 q-40 -36 0 -96z" fill="rgba(255,180,90,0.98)"/>
        <path d="M500 240 q20 34 0 56 q-20 -22 0 -56z" fill="rgba(255,240,190,0.98)"/>
      </g>
      <ellipse cx="500" cy="216" rx="120" ry="150" fill="url(#glowWarm)"/>
      ${motes(14, "rgba(255,200,120,0.6)")}`;
  }

  function balloon() {
    return `${stars(30)}
      <!-- rooftops far below -->
      <g fill="${DARKER}"><polygon points="0,520 120,470 240,520 240,600 0,600"/><polygon points="260,540 380,500 520,540 520,600 260,600"/><polygon points="560,530 700,485 860,530 860,600 560,600"/><polygon points="880,545 1000,510 1000,600 880,600"/></g>
      <g fill="rgba(255,210,130,0.8)"><rect x="90" y="500" width="14" height="14"/><rect x="360" y="524" width="12" height="12"/><rect x="700" y="512" width="12" height="12"/></g>
      <!-- balloon + boy -->
      <g class="float" style="transform-box:fill-box;transform-origin:center top">
        <ellipse cx="520" cy="180" rx="86" ry="104" fill="rgba(220,80,80,0.95)"/>
        <ellipse cx="490" cy="150" rx="26" ry="40" fill="rgba(255,255,255,0.22)"/>
        <path d="M520 284 l-6 12 l12 0 z" fill="rgba(180,60,60,0.95)"/>
        <line x1="520" y1="296" x2="520" y2="430" stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
        <circle cx="520" cy="452" r="20" fill="rgba(12,8,14,0.95)"/><rect x="506" y="470" width="28" height="46" rx="8" fill="rgba(12,8,14,0.95)"/>
      </g>
      <ellipse cx="520" cy="180" rx="150" ry="170" fill="url(#glowCool)" opacity="0.3"/>`;
  }

  function sky() {
    return `${stars(46)}
      <g class="drift-r">${cloud(160, 200, 1)}${cloud(760, 150, 0.9)}</g>
      <g class="drift-l">${cloud(480, 300, 1.2)}${cloud(120, 420, 0.8)}${cloud(860, 380, 1)}</g>
      <!-- three tiny party roofs far below -->
      <g fill="rgba(8,5,12,0.85)"><polygon points="180,560 240,530 300,560 300,600 180,600"/><polygon points="470,560 530,528 590,560 590,600 470,600"/><polygon points="740,560 800,532 860,560 860,600 740,600"/></g>
      <g fill="rgba(255,215,140,0.9)"><circle class="twinkle" cx="240" cy="548" r="4"/><circle class="twinkle" style="animation-delay:1s" cx="530" cy="546" r="4"/><circle class="twinkle" style="animation-delay:2s" cx="800" cy="548" r="4"/></g>
      <g class="float"><ellipse cx="500" cy="150" rx="60" ry="72" fill="rgba(220,80,80,0.9)"/><line x1="500" y1="222" x2="500" y2="300" stroke="rgba(255,255,255,0.5)" stroke-width="2"/></g>`;
  }
  function cloud(x, y, s) {
    return `<g transform="translate(${x},${y}) scale(${s})" fill="rgba(255,255,255,0.14)"><ellipse cx="0" cy="0" rx="70" ry="30"/><ellipse cx="-46" cy="8" rx="40" ry="24"/><ellipse cx="48" cy="8" rx="44" ry="24"/></g>`;
  }

  function dragon() {
    return `<ellipse cx="500" cy="340" rx="320" ry="240" fill="url(#glowWarm)" opacity="0.45"/>
      <!-- toy gate -->
      <g fill="rgba(10,7,12,0.8)"><rect x="60" y="300" width="26" height="300"/><rect x="914" y="300" width="26" height="300"/><rect x="60" y="300" width="880" height="24"/></g>
      <!-- gears -->
      ${gear(200, 430, 60, "rgba(190,110,55,0.9)", "spin")}
      ${gear(300, 470, 40, "rgba(210,130,60,0.85)", "spin-rev")}
      ${gear(770, 420, 54, "rgba(190,110,55,0.9)", "spin-rev")}
      <!-- dragon silhouette -->
      <g class="breathe" style="transform-box:fill-box;transform-origin:center bottom">
        <path d="M420 470 q-40 -80 40 -120 q30 -60 100 -50 q40 -40 90 -10 q-30 20 -46 46 q40 30 30 84 q-60 -30 -96 -6 q-70 -20 -118 62z" fill="rgba(120,60,30,0.96)"/>
        <polygon points="560,300 596,250 600,306" fill="rgba(140,70,34,0.96)"/>
        <circle class="flick" cx="612" cy="300" r="8" fill="rgba(255,180,90,0.98)"/>
      </g>
      <!-- ember sparks -->
      ${sparks(16)}`;
  }
  function sparks(n) {
    let s = "<g>";
    for (let i = 0; i < n; i++) {
      const x = 560 + Math.round(Math.random() * 220 - 40);
      const y = 300 + Math.round(Math.random() * 180);
      const d = (Math.random() * 4).toFixed(2);
      s += `<circle class="rise" style="animation-delay:${d}s" cx="${x}" cy="${y}" r="${(Math.random() * 2 + 1).toFixed(1)}" fill="rgba(255,150,70,0.9)"/>`;
    }
    return s + "</g>";
  }

  function party_gate() {
    return `${stars(28)}${moon(150, 120, 40)}
      <!-- warm party glow beyond -->
      <ellipse cx="500" cy="430" rx="330" ry="220" fill="url(#glowWarm)"/>
      <!-- string lights -->
      <path d="M120 150 q380 120 760 -10" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
      ${[180, 300, 420, 540, 660, 780].map((x, i) => `<circle class="flick" style="animation-delay:${(i * .3).toFixed(1)}s" cx="${x}" cy="${160 + (i % 2 === 0 ? 22 : 8)}" r="7" fill="rgba(255,210,130,0.95)"/>`).join("")}
      <!-- dancing silhouettes beyond -->
      <g fill="rgba(20,12,10,0.6)"><g class="sway" style="transform-box:fill-box;transform-origin:bottom"><ellipse cx="430" cy="470" rx="16" ry="40"/></g><g class="sway" style="transform-box:fill-box;transform-origin:bottom;animation-delay:.5s"><ellipse cx="560" cy="470" rx="16" ry="40"/></g></g>
      <!-- iron gate bars -->
      <g stroke="rgba(6,4,8,0.95)" stroke-width="12">
        ${[220, 300, 380, 460, 540, 620, 700, 780].map((x) => `<line x1="${x}" y1="180" x2="${x}" y2="600"/>`).join("")}
      </g>
      <g stroke="rgba(6,4,8,0.95)" stroke-width="10" fill="none"><line x1="200" y1="230" x2="800" y2="230"/><line x1="200" y1="560" x2="800" y2="560"/></g>
      <g fill="rgba(6,4,8,0.95)">${[220, 300, 380, 460, 540, 620, 700, 780].map((x) => `<polygon points="${x - 8},180 ${x + 8},180 ${x},160"/>`).join("")}</g>`;
  }

  function party_room() {
    return `<ellipse cx="500" cy="360" rx="420" ry="280" fill="url(#glowWarm)"/>
      <!-- bunting -->
      <path d="M40 100 q460 90 920 0" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const x = 90 + i * 110; const c = ["#ff9db1", "#ffd166", "#8ad7ff", "#c79bff"][i % 4]; return `<g class="sway" style="transform-box:fill-box;transform-origin:${x}px ${118 + i * 3}px;animation-delay:${(i * .2).toFixed(1)}s"><polygon points="${x - 20},${112 + i * 3} ${x + 20},${112 + i * 3} ${x},${158 + i * 3}" fill="${c}" opacity="0.8"/></g>`; }).join("")}
      <!-- table + cake -->
      <rect x="300" y="470" width="400" height="130" fill="rgba(30,18,14,0.9)"/>
      <rect x="430" y="380" width="140" height="92" rx="10" fill="rgba(245,220,200,0.95)"/>
      <rect x="430" y="410" width="140" height="10" fill="rgba(255,150,170,0.9)"/>
      ${[460, 500, 540].map((x, i) => `<g><line x1="${x}" y1="356" x2="${x}" y2="382" stroke="rgba(255,240,220,0.95)" stroke-width="5"/><path class="flame" style="transform-box:fill-box;transform-origin:center bottom;animation-delay:${(i * .3).toFixed(1)}s" d="M${x} 340 q9 12 0 22 q-9 -10 0 -22z" fill="rgba(255,200,110,0.98)"/></g>`).join("")}
      ${confetti(30)}`;
  }
  function confetti(n) {
    let s = "<g>";
    const cols = ["#ff9db1", "#ffd166", "#8ad7ff", "#c79bff", "#7be08a"];
    for (let i = 0; i < n; i++) {
      const x = Math.round(Math.random() * 1000);
      const y = Math.round(Math.random() * 300);
      const d = (Math.random() * 5).toFixed(2);
      s += `<rect class="fall" style="animation-delay:${d}s" x="${x}" y="${y}" width="7" height="10" fill="${cols[i % cols.length]}" opacity="0.85"/>`;
    }
    return s + "</g>";
  }

  function fifth() {
    return `${stars(30)}
      <ellipse cx="500" cy="360" rx="240" ry="320" fill="url(#glowViolet)"/>
      <!-- aisle perspective -->
      <g fill="rgba(10,6,18,0.85)"><polygon points="0,0 340,150 340,600 0,600"/><polygon points="1000,0 660,150 660,600 1000,600"/></g>
      <g stroke="rgba(199,155,255,0.18)" stroke-width="2"><line x1="340" y1="150" x2="500" y2="230"/><line x1="660" y1="150" x2="500" y2="230"/><line x1="340" y1="600" x2="500" y2="360"/><line x1="660" y1="600" x2="500" y2="360"/></g>
      <!-- floating child-lanterns drifting up -->
      ${[0, 1, 2, 3, 4].map((i) => { const x = 380 + i * 62; const d = (i * .9).toFixed(1); return `<g class="rise-slow" style="animation-delay:${d}s"><ellipse cx="${x}" cy="${300 - i * 10}" rx="14" ry="20" fill="rgba(199,155,255,0.35)"/><circle cx="${x}" cy="${300 - i * 10}" r="6" fill="rgba(230,210,255,0.9)"/></g>`; }).join("")}
      <!-- the brass key -->
      <g class="float"><circle cx="500" cy="330" r="18" fill="none" stroke="rgba(255,214,150,0.95)" stroke-width="7"/><rect x="497" y="346" width="6" height="60" fill="rgba(255,214,150,0.95)"/><rect x="503" y="386" width="16" height="6" fill="rgba(255,214,150,0.95)"/><rect x="503" y="398" width="12" height="6" fill="rgba(255,214,150,0.95)"/><ellipse cx="500" cy="360" rx="70" ry="90" fill="url(#glowViolet)" opacity="0.5"/></g>
      <!-- the cat -->
      <path d="M600 588 q6 -34 22 -34 q-6 -18 4 -24 q8 8 8 18 q10 -8 18 0 q6 6 2 30 z" fill="rgba(8,6,14,0.95)"/><circle cx="645" cy="544" r="2.4" fill="rgba(199,155,255,0.95)"/>`;
  }

  return { street, shop, gifts, teddy, alley, candle, balloon, sky, dragon, party_gate, party_room, fifth };
})();
