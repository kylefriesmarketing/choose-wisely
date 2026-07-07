/* ============================================================================
 * uiController.js  -  the view layer. Renders the main menu, story view, stat
 * panel, choice panel, inventory, history, settings, ending screen, and ending
 * tracker. It reads state and routes clicks to StoryEngine; it decides nothing
 * about story logic.
 * ========================================================================== */
window.CW = window.CW || {};

CW.UIController = (function () {
  const GS = () => CW.GameState;
  let el = {};
  let currentNode = null;
  let typeTimer = null;
  let trackerFilter = "all";
  let introTimer = null;
  let menuGlitchTimer = null;
  let skTimer = null;

  const STAT_ICONS = { wisdom: "🧠", intelligence: "📘", perception: "👁", strength: "💪" };
  const STAT_NAMES = { wisdom: "Wisdom", intelligence: "Intelligence", perception: "Perception", strength: "Strength" };

  // Endings with an illustrated card in assets/endings/<ID>.png. Endings not
  // listed here fall back to showing their imagePrompt as text.
  const ENDING_IMG = {
    END_T_GOOD: 1, END_T_BAD: 1, END_T_FUNNY: 1, END_T_LITTLE_KEEPER: 1, END_T_HOLLOW_GIFT: 1, END_T_REUNITED: 1,
    END_C_GOOD: 1, END_C_CURSED: 1, END_C_SECRET: 1, END_C_WAXWORK: 1, END_C_MELTED_FREE: 1, END_C_SNUFFED: 1,
    END_B_GOOD: 1, END_B_BAD: 1, END_B_FUNNY: 1, END_B_FREED_SKY: 1, END_B_ANCHORED: 1, END_B_QUIET_RETURN: 1,
    END_D_GOOD: 1, END_D_BAD: 1, END_D_SECRET: 1, END_D_FOUNDRY_HALT: 1, END_D_TOYMAKER: 1, END_D_BIGGER: 1,
    END_DISPLAY_PRISONER: 1, END_FIFTH_GIFT: 1, END_TRUE: 1, END_THE_REGULAR: 1, END_JUST_CAME: 1, END_COLD_FEET: 1,
    END_LAST_THREAD: 1, END_WHOLE_AGAIN: 1, END_NO_ESCAPE: 1, END_TAKEN: 1, END_SHATTERED: 1, END_FORTY_FIRST: 1, END_WOUND_BACK: 1,
  };
  function endingImgPath(id) { return ENDING_IMG[id] ? "assets/endings/" + id + ".png" : null; }

  function $(id) { return document.getElementById(id); }

  function init() {
    el = {
      menu: $("main-menu"), stage: $("stage"), topbar: $("topbar"),
      title: $("node-title"), caption: $("scene-caption"),
      speaker: $("speaker"), text: $("story-text"), subtle: $("subtle"), skAside: $("shopkeeper-aside"), trace: $("trace"),
      choices: $("choices"), panel: $("story-panel"),
      hudStats: $("hud-stats"), hudEndings: $("hud-endings"), hudBracelet: $("hud-bracelet"),
      inventory: $("inventory"),
      popups: $("popups"), toast: $("toast"),
      ending: $("ending-screen"),
      tracker: $("tracker-screen"), trackerBody: $("tracker-body"),
      settings: $("settings-screen"), settingsBody: $("settings-body"),
      history: $("history-screen"), historyBody: $("history-body"),
      intro: $("intro"), introLine: $("intro-line"),
      about: $("about-screen"), aboutBody: $("about-body"),
      detail: $("ending-detail"),
    };
    applySettingsToDom();
    // Gallery: filter chips + click a discovered ending to see its full art.
    el.trackerBody.addEventListener("click", (ev) => {
      const chip = ev.target.closest(".filter-chip");
      if (chip) { trackerFilter = chip.getAttribute("data-filter"); showTracker(); return; }
      const card = ev.target.closest(".coll-card.found[data-ending]");
      if (card) showEndingDetail(card.getAttribute("data-ending"));
    });
  }

  /* ---- main menu -------------------------------------------------------- */
  const HAUNT_TAGLINES = ["", "It remembers you.", "You keep coming back.", "You always come back.", "There was never an empty lot. Only the shop, and you, again."];
  // The menu lies more the deeper it remembers you (indexed by haunt 0..4).
  const MENU_DECAY = {
    "menu-new":      ["New Run", "New Run", "New Run", "Again.", "Come In Out of the Rain."],
    "menu-continue": ["Continue", "Continue", "Continue", "You Never Left", "You Never Left"],
    "menu-endings":  ["Endings", "Endings", "Endings", "There Is No Ending", "There Is No Ending"],
    "menu-about":    ["About", "About", "About", "About You", "About You"],
  };
  const GLITCH_TITLES = ["CHOSEN ALREADY", "COME BACK IN", "STAY WISELY", "CHOOSE NOTHING", "YOU, AGAIN"];
  function showMenu() {
    el.menu.classList.add("open");
    el.topbar.classList.remove("visible");
    el.stage.classList.remove("visible");
    const hl = $("menu-haunt");
    const haunt = CW.GameState.hauntLevel();
    if (hl) { const t = HAUNT_TAGLINES[haunt] || ""; hl.textContent = t; hl.className = "menu-haunt" + (t ? " show" : ""); }
    Object.keys(MENU_DECAY).forEach((id) => { const b = $(id); if (b) b.textContent = MENU_DECAY[id][haunt]; });
    if (el.caption) el.caption.textContent = "";
    if (CW.Cast) CW.Cast.clear();
    if (CW.Faces) CW.Faces.clear();
    if (CW.Dread) CW.Dread.reset();
    if (CW.SceneManager && CW.SceneManager.cover) CW.SceneManager.cover("street"); // illustrated title backdrop
    if (CW.Audio && CW.Audio.playCue) CW.Audio.playCue("menu_theme");
    const cont = $("menu-continue");
    if (GS().hasSavedRun()) { cont.classList.remove("disabled"); cont.disabled = false; }
    else { cont.classList.add("disabled"); cont.disabled = true; }
    startMenuGlitch();
  }
  function hideMenu() {
    el.menu.classList.remove("open");
    el.topbar.classList.add("visible");
    el.stage.classList.add("visible");
    stopMenuGlitch();
  }
  function startMenuGlitch() {
    stopMenuGlitch();
    if (CW.GameState.hauntLevel() < 4 || document.body.classList.contains("reduce-motion")) return;
    const title = document.querySelector(".menu-title");
    if (!title) return;
    menuGlitchTimer = setInterval(() => {
      if (!el.menu.classList.contains("open")) { stopMenuGlitch(); return; }
      title.textContent = GLITCH_TITLES[Math.floor(Math.random() * GLITCH_TITLES.length)];
      title.classList.add("glitch-flash");
      setTimeout(() => { title.textContent = "CHOOSE WISELY"; title.classList.remove("glitch-flash"); }, 150);
    }, 4200 + Math.random() * 3000);
  }
  function stopMenuGlitch() {
    clearInterval(menuGlitchTimer); menuGlitchTimer = null;
    const t = document.querySelector(".menu-title"); if (t) { t.textContent = "CHOOSE WISELY"; t.classList.remove("glitch-flash"); }
  }

  /* ---- atmospheric intro ------------------------------------------------ */
  const INTRO_LINES = [
    "You are always late. You always forget.",
    "And every time you do, a little shop is waiting on the corner —",
    "— with exactly what you need, for exactly what it takes.",
  ];
  function playIntro(onDone) {
    let i = 0;
    const reduce = document.body.classList.contains("reduce-motion");
    el.intro.classList.add("open");
    function finish() {
      clearTimeout(introTimer); introTimer = null;
      el.intro.classList.remove("open");
      el.intro.onclick = null; document.removeEventListener("keydown", onKey);
      if (onDone) onDone();
    }
    function onKey() { finish(); }
    function next() {
      if (i >= INTRO_LINES.length) { introTimer = setTimeout(finish, 700); return; }
      el.introLine.textContent = INTRO_LINES[i];
      el.introLine.classList.remove("show"); void el.introLine.offsetWidth; el.introLine.classList.add("show");
      i++;
      introTimer = setTimeout(next, reduce ? 1300 : 3200);
    }
    el.intro.onclick = finish;
    document.addEventListener("keydown", onKey);
    next();
  }

  /* ---- about / credits -------------------------------------------------- */
  function showAbout() {
    const s = GS().getSettings(), hero = (s.heroName || "Milo"), friend = (s.friendName || "June");
    el.aboutBody.innerHTML =
      '<div class="about-title">CHOOSE WISELY</div>' +
      '<div class="about-tag">One shop. Four gifts. Hundreds of endings.</div>' +
      '<p class="about-p">A playable storybook about ' + friend + "'s birthday — and the little shop that appears on the corner with exactly what you need, for exactly what it takes. Every choice moves four attributes, frays or mends a friendship bracelet, and steers toward one of forty collectible endings. The deeper you go, the darker it gets; the more you play, the more the shop remembers you.</p>" +
      '<div class="about-sec"><b>Made with</b><div>Design, writing, art, and music generated for this build. Scenes and ending cards are painted illustrations; the soundtrack is composed live in your browser with WebAudio — no audio files, no dependencies, no build step.</div></div>' +
      '<div class="about-sec"><b>How to play</b><div>Read, choose, and watch your stats and the bracelet in the corner. Locked choices are goals, not walls. Every ending — even the sad ones — is worth collecting. Press <b>~</b> for developer tools.</div></div>' +
      '<div class="about-sec"><b>Your story</b><div>You are <b>' + hero + "</b>. Your friend is <b>" + friend + "</b>. Rename them any time in Settings.</div></div>" +
      '<div class="about-foot">' + GS().foundCount() + " / " + GS().totalEndings() + " endings found · haunt " + GS().hauntLevel() + " / 4</div>";
    el.about.classList.add("open");
  }
  function hideAbout() { el.about.classList.remove("open"); }

  /* ---- ending gallery detail -------------------------------------------- */
  function showEndingDetail(id) {
    const e = CW.Endings[id];
    if (!e || !GS().isFound(id)) return;
    const cat = e.category.toLowerCase();
    el.detail.querySelector(".detail-card").className = "detail-card cat-" + cat;
    const img = endingImgPath(id);
    $("detail-art").innerHTML = img ? '<img src="' + img + '" alt="" />' : "";
    $("detail-num").textContent = "Ending #" + e.number;
    $("detail-name").textContent = replaceTokens(e.title);
    $("detail-cat").textContent = e.category; $("detail-cat").className = "ending-cat-chip cat-" + cat;
    $("detail-text").textContent = replaceTokens(e.text);
    $("detail-clue").textContent = e.clue ? "“" + replaceTokens(e.clue) + "”" : "";
    el.detail.classList.add("open");
  }
  function hideEndingDetail() { el.detail.classList.remove("open"); }

  /* ---- story view ------------------------------------------------------- */
  function renderNode(node) {
    currentNode = node;
    hideMenu();
    hideEnding();

    const h = hauntedText(node);
    el.title.textContent = node.title || "";
    el.speaker.textContent = h.speaker || "";
    if (el.caption) el.caption.textContent = node.location || "";

    el.panel.classList.remove("fade-in");
    void el.panel.offsetWidth;
    el.panel.classList.add("fade-in");

    typeText(h.text || "");
    el.subtle.classList.remove("show");

    el.choices.innerHTML = "";
    (node.choices || []).forEach((choice) => {
      const btn = buildChoiceButton(node, choice);
      if (btn) el.choices.appendChild(btn);
    });

    // His voice, or the shop's dead children, but not both piling onto one beat.
    const aside = renderShopkeeperAside(node);
    renderTrace(node, !!aside);
  }

  // The shopkeeper's reactive murmur. It fades in a beat after the narration so
  // it reads as an interjection; when he is on stage he leans in to say it, and
  // when he is not, the voice arrives disembodied (styled apart). Returns the
  // aside it will show (or null) so the caller can avoid stacking a trace on it.
  function renderShopkeeperAside(node) {
    clearTimeout(skTimer);
    if (!el.skAside) return null;
    el.skAside.classList.remove("show", "disembodied", "tone-murmur", "tone-taunt", "tone-plead", "tone-bargain", "tone-slip");
    el.skAside.textContent = "";
    if (CW.Cast && CW.Cast.setSpeaking) CW.Cast.setSpeaking("shopkeeper", false);

    const aside = CW.Shopkeeper && CW.Shopkeeper.asideFor(node);
    if (!aside) return null;

    const reveal = () => {
      el.skAside.textContent = replaceTokens(aside.line);
      el.skAside.classList.add("show", "tone-" + aside.tone);
      if (aside.disembodied) el.skAside.classList.add("disembodied");
      else if (CW.Cast && CW.Cast.setSpeaking) CW.Cast.setSpeaking("shopkeeper", true);
    };
    const instant = GS().getSettings().textSpeed === "instant" || document.body.classList.contains("reduce-motion");
    if (instant) reveal();
    else skTimer = setTimeout(reveal, 900);
    return aside;
  }

  // The other children: a note behind a toy, a little frayed bracelet, a face at
  // the glass, the toy whispering. Environmental, not a voice — styled cold and
  // apart from the narration. Suppressed on beats where the shopkeeper speaks.
  function renderTrace(node, suppressed) {
    if (!el.trace) return;
    el.trace.classList.remove("show", "kind-note", "kind-bracelet", "kind-window", "kind-whisper");
    el.trace.textContent = "";
    if (suppressed) return;

    const trace = CW.Traces && CW.Traces.traceFor(node);
    if (!trace) return;
    el.trace.textContent = replaceTokens(trace.text);
    el.trace.classList.add("show", "kind-" + trace.kind);
  }

  // The shop remembers you: swap in a haunt-level text/speaker variant and fill
  // live tokens ({VISITS}, {CELLAR_COUNT}).
  function ordinal(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function replaceTokens(t) {
    if (!t || t.indexOf("{") < 0) return t;
    const s = GS().getSettings();
    const hero = ((s.heroName || "Milo").trim()) || "Milo";
    const friend = ((s.friendName || "June").trim()) || "June";
    return String(t)
      .replace(/\{HERO\}/g, hero).replace(/\{FRIEND\}/g, friend)
      .replace(/\{VISITS\}/g, GS().getVisits()).replace(/\{CELLAR_COUNT\}/g, ordinal(GS().cellarCount()));
  }
  function hauntedText(node) {
    let text = node.text || "", speaker = node.speaker || "";
    if (node.haunt) {
      const lvl = GS().hauntLevel();
      for (let k = lvl; k >= 1; k--) {
        if (node.haunt[k]) {
          if (node.haunt[k].text != null) text = node.haunt[k].text;
          if (node.haunt[k].speaker != null) speaker = node.haunt[k].speaker;
          break;
        }
      }
    }
    return { text: replaceTokens(text), speaker: replaceTokens(speaker) };
  }

  function typeText(str) {
    clearInterval(typeTimer);
    const speed = GS().getSettings().textSpeed;
    if (speed === "instant" || document.body.classList.contains("reduce-motion")) {
      el.text.textContent = str;
      return;
    }
    const stepMs = speed === "slow" ? 22 : 8;
    el.text.textContent = "";
    let i = 0;
    typeTimer = setInterval(() => {
      el.text.textContent = str.slice(0, ++i);
      if (i >= str.length) clearInterval(typeTimer);
    }, stepMs);
  }

  function buildChoiceButton(node, choice) {
    const d = CW.Requirements.describe(choice);
    // Hard branch selectors and (optionally) locked choices are hidden.
    if (d.locked && d.hideWhenLocked) return null;
    if (d.locked && !GS().getSettings().showLockedChoices) return null;

    const btn = document.createElement("button");
    btn.className = "choice" + (d.locked ? " locked" : "");
    if (d.locked) btn.setAttribute("aria-disabled", "true");

    const label = document.createElement("span");
    label.className = "choice-text";
    label.textContent = replaceTokens(d.text);
    btn.appendChild(label);

    const tags = document.createElement("span");
    tags.className = "choice-tags";
    if (d.reqLabel) tags.appendChild(tag(d.reqLabel, "req"));
    if (d.costLabel) tags.appendChild(tag(d.costLabel, "cost"));
    if (d.gainLabel) tags.appendChild(tag(d.gainLabel, "gain"));
    if (d.locked) tags.appendChild(tag("🔒", "lockchip"));
    if (tags.childNodes.length) btn.appendChild(tags);

    btn.addEventListener("mouseenter", () => CW.Audio.play("hover"));
    btn.addEventListener("click", () => CW.StoryEngine.chooseChoice(node, choice));
    return btn;
  }

  function tag(text, cls) {
    const s = document.createElement("span");
    s.className = "tag tag-" + cls;
    s.textContent = text;
    return s;
  }

  /* ---- stat panel + inventory ------------------------------------------ */
  function renderStats() {
    const run = GS().getRun();
    if (!run || !el.hudStats) return;
    el.hudStats.innerHTML = "";
    CW.STATS.forEach((k) => {
      const chip = document.createElement("div");
      chip.className = "stat-chip stat-" + k;
      chip.innerHTML =
        '<span class="stat-ico">' + STAT_ICONS[k] + "</span>" +
        '<span class="stat-name">' + STAT_NAMES[k] + "</span>" +
        '<span class="stat-val" data-stat="' + k + '">' + run.stats[k] + "</span>";
      el.hudStats.appendChild(chip);
    });
    el.hudEndings.textContent = GS().foundCount() + " / " + GS().totalEndings() + " endings";
    renderBracelet();
  }

  // The bracelet: a little woven band that gains threads (mends) or loses them
  // (frays) with the bond. At 0 it hangs snapped.
  function renderBracelet() {
    if (!el.hudBracelet) return;
    const bond = GS().bondValue(), max = GS().bondMax();
    const W = 66, H = 22, cy = 11;
    let strands = "";
    if (bond <= 0) {
      strands =
        '<path d="M6 11 q10 -5 18 0" stroke="#8a6a4a" stroke-width="2" fill="none"/>' +
        '<path d="M24 11 l4 4 M24 11 l3 -4 M24 11 l5 0" stroke="#8a6a4a" stroke-width="1.4" fill="none" opacity="0.8"/>' +
        '<path d="M60 11 q-10 -5 -18 0" stroke="#8a6a4a" stroke-width="2" fill="none"/>' +
        '<path d="M42 11 l-4 4 M42 11 l-3 -4 M42 11 l-5 0" stroke="#8a6a4a" stroke-width="1.4" fill="none" opacity="0.8"/>';
    } else {
      // draw `bond` interwoven strands across the band
      const cols = ["#e08aa0", "#ffcf7a", "#8ad7ff", "#7be08a", "#c79bff", "#ff9d5c"];
      for (let i = 0; i < bond; i++) {
        const phase = i % 2 === 0 ? 1 : -1;
        const amp = 3 + (i % 3);
        strands += '<path d="M6 ' + cy + ' q13 ' + (phase * amp) + ' 26 0 q13 ' + (-phase * amp) + ' 26 0" stroke="' + cols[i % cols.length] + '" stroke-width="1.7" fill="none" opacity="' + (0.55 + i * 0.06) + '"/>';
      }
      // knots
      for (let k = 0; k < Math.min(bond, 4); k++) {
        strands += '<circle cx="' + (14 + k * 12) + '" cy="' + cy + '" r="1.6" fill="rgba(255,240,220,0.9)"/>';
      }
    }
    el.hudBracelet.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' + strands + "</svg>" +
      '<span class="brc-label">' + (bond <= 0 ? "snapped" : bond >= max ? "whole" : bond + "/" + max) + "</span>";
    el.hudBracelet.classList.toggle("snapped", bond <= 0);
  }

  function showBondChange(delta) {
    if (!delta) return;
    const p = document.createElement("div");
    p.className = "popup bond " + (delta > 0 ? "pos" : "neg");
    p.textContent = "🧵 " + (delta > 0 ? "a thread mends" : "a thread frays");
    el.popups.appendChild(p);
    setTimeout(() => p.remove(), 1800);
    if (el.hudBracelet) { el.hudBracelet.classList.remove("pulse"); void el.hudBracelet.offsetWidth; el.hudBracelet.classList.add("pulse"); }
  }

  function renderInventory() {
    const run = GS().getRun();
    if (!run || !el.inventory) return;
    if (!run.inventory.length) { el.inventory.innerHTML = '<span class="inv-empty">Satchel empty</span>'; return; }
    el.inventory.innerHTML = '<span class="inv-label">Carrying:</span>' + run.inventory.map((id) => {
      const g = CW.Gifts[id];
      return '<span class="inv-item">' + (g ? g.icon + " " + replaceTokens(g.name) : id) + "</span>";
    }).join("");
  }

  /* ---- feedback --------------------------------------------------------- */
  function showStatPopups(applied) {
    applied.forEach((c, i) => {
      const p = document.createElement("div");
      p.className = "popup " + (c.amount > 0 ? "pos" : "neg");
      p.textContent = (c.amount > 0 ? "+" : "") + c.amount + " " + STAT_NAMES[c.stat];
      p.style.animationDelay = i * 0.12 + "s";
      el.popups.appendChild(p);
      const hv = document.querySelector('.stat-val[data-stat="' + c.stat + '"]');
      if (hv) { hv.classList.remove("pulse"); void hv.offsetWidth; hv.classList.add("pulse"); }
      setTimeout(() => p.remove(), 1700 + i * 120);
    });
  }
  function showSubtle(t) { el.subtle.textContent = t; el.subtle.classList.remove("show"); void el.subtle.offsetWidth; el.subtle.classList.add("show"); }
  function flashLocked(reason) { toast(reason || "That path is locked."); }
  let toastTimer = null;
  function toast(msg) {
    el.toast.textContent = msg; el.toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.remove("show"), 2600);
  }

  /* ---- ending screen ---------------------------------------------------- */
  function showEnding(result) {
    const e = result.ending;
    const run = GS().getRun();
    const cat = (e.category || "Good").toLowerCase();
    el.ending.querySelector(".ending-card").className = "ending-card cat-" + cat;

    $("ending-number").textContent = "Ending #" + e.number;
    $("ending-new").textContent = result.isNew ? "✦ New ending discovered!" : "Already in your collection";
    $("ending-new").className = "ending-new " + (result.isNew ? "is-new" : "");
    $("ending-name").textContent = replaceTokens(e.title);
    $("ending-cat").textContent = e.category;
    $("ending-cat").className = "ending-cat-chip cat-" + cat;
    const eImg = endingImgPath(e.id);
    if (eImg) { $("ending-art").innerHTML = '<img src="' + eImg + '" alt="" />'; $("ending-art").className = "ending-art has-img"; }
    else { $("ending-art").textContent = e.imagePrompt ? "🖼  " + e.imagePrompt : ""; $("ending-art").className = "ending-art"; }
    $("ending-text").textContent = replaceTokens(e.text);

    // Discovered stats snapshot.
    $("ending-stats").innerHTML = CW.STATS.map((k) =>
      '<span class="es-stat">' + STAT_ICONS[k] + " " + run.stats[k] + "</span>").join("");

    // Choices that mattered (had stat deltas or set flags).
    const mattered = run.choiceHistory.filter((h) => (h.deltas && h.deltas.length) || (h.setFlags && h.setFlags.length));
    $("ending-choices").innerHTML = mattered.length
      ? "<h4>Choices that mattered</h4>" + mattered.slice(-6).map((h) => "<div class='ec-row'>• " + replaceTokens(h.text) + "</div>").join("")
      : "";

    // Meta unlock notices.
    $("ending-unlocks").innerHTML = (result.newlyUnlocked || []).length
      ? result.newlyUnlocked.map((u) => "<div class='ending-unlock'>✧ " + u + "</div>").join("")
      : "";

    $("ending-progress").textContent = GS().foundCount() + " / " + GS().totalEndings() + " endings found";
    $("ending-hint").textContent = "";
    el.ending.classList.add("open");
  }
  function hideEnding() { el.ending.classList.remove("open"); }

  function showHint() {
    // Optional vague hint toward an undiscovered ending (brief §16, §17).
    const undiscovered = Object.keys(CW.Endings).filter((id) => !GS().isFound(id));
    if (!undiscovered.length) { $("ending-hint").textContent = "You have found every ending. Truly, well read."; return; }
    const e = CW.Endings[undiscovered[Math.floor(Math.random() * undiscovered.length)]];
    const routeName = { teddy: "Teddy Bear", candle: "Wish Candle", balloon: "Balloon", dragon: "Dragon", shop: "shop itself", meta: "hidden fifth aisle", cellar: "deep dark you should not have found" }[e.route] || e.route;
    $("ending-hint").textContent = "Hint: there is a " + e.category + " ending waiting on the " + routeName + " path.";
  }

  /* ---- ending tracker + memory page (§17) ------------------------------- */
  function showTracker() {
    const routes = [
      { key: "teddy", label: "Talking Teddy Bear" },
      { key: "candle", label: "Wish Candle" },
      { key: "balloon", label: "Everlasting Balloon" },
      { key: "dragon", label: "Clockwork Dragon" },
      { key: "shop", label: "The Shop" },
      { key: "meta", label: "Hidden" },
      { key: "cellar", label: "The Cellar" },
    ];
    let html = '<div class="coll-summary">' + GS().foundCount() + " / " + GS().totalEndings() + " endings discovered</div>";
    const FILTERS = [{ key: "all", label: "All" }].concat(routes);
    html += '<div class="coll-filters">' + FILTERS.map((f) => '<button class="filter-chip' + (trackerFilter === f.key ? " active" : "") + '" data-filter="' + f.key + '">' + f.label + "</button>").join("") + "</div>";

    routes.forEach((r) => {
      if (trackerFilter !== "all" && r.key !== trackerFilter) return;
      const list = Object.keys(CW.Endings).map((id) => ({ id, e: CW.Endings[id] })).filter((x) => x.e.route === r.key);
      if (!list.length) return;
      const found = list.filter((x) => GS().isFound(x.id)).length;
      html += '<div class="coll-route"><h3>' + r.label + " <span>" + found + "/" + list.length + "</span></h3><div class='coll-cards'>";
      list.forEach((x) => {
        if (GS().isFound(x.id)) {
          const t = endingImgPath(x.id);
          const thumb = t ? '<div class="cc-thumb" style="background-image:url(\'' + t + '\')"></div>' : "";
          html += '<div class="coll-card found clickable cat-' + x.e.category.toLowerCase() + '" data-ending="' + x.id + '">' + thumb + '<div class="cc-num">#' + x.e.number + '</div><div class="cc-name">' + replaceTokens(x.e.title) + "</div><div class='cc-type'>" + x.e.category + "</div></div>";
        } else {
          const hiddenLabel = (x.e.category === "Secret" || x.e.category === "True" || x.e.category === "Nightmare") ? "???" : "Undiscovered";
          html += '<div class="coll-card hidden"><div class="cc-num">#' + x.e.number + '</div><div class="cc-name">? ? ?</div><div class="cc-type">' + hiddenLabel + "</div></div>";
        }
      });
      html += "</div></div>";
    });

    // Memory page (gallery of clues).
    const gallery = GS().getMeta().gallery;
    html += '<div class="coll-route"><h3>Memory Page</h3>';
    html += gallery.length
      ? '<div class="memory-list">' + gallery.map((g) => "<div class='memory-clue'>“" + g.clue + "”</div>").join("") + "</div>"
      : '<div class="memory-empty">Reach endings to record what you learn.</div>';
    // Secret unlock status.
    const meta = GS().getMeta();
    html += '<div class="unlock-status">Fifth Aisle: ' + (meta.unlockedSecrets.includes("fifthAisle") ? "🔓 open" : "🔒 locked — find one ending from each gift") + "</div>";
    html += '<div class="unlock-status">True Ending: ' + (meta.unlockedSecrets.includes("trueEnding") ? "🔓 ready" : "🔒 locked — find all four good endings") + "</div>";
    html += '<div class="unlock-status haunt-stat">The shop remembers you — ' + GS().getVisits() + " visit" + (GS().getVisits() === 1 ? "" : "s") +
      ", wound back " + GS().getLoops() + " time" + (GS().getLoops() === 1 ? "" : "s") +
      ", haunt " + GS().hauntLevel() + " / 4.</div>";
    html += "</div>";

    // The Truth — knowledge gathered across runs toward the way back to June.
    if (CW.Truths) {
      const friend = replaceTokens("{FRIEND}");
      html += '<div class="coll-route"><h3>The Truth <span>' + GS().knowledgeCount() + "/" + GS().truthsTotal() + "</span></h3>";
      Object.keys(CW.Truths).forEach((k) => {
        if (GS().hasKnowledge(k)) {
          html += '<div class="truth-row known"><div class="truth-title">✦ ' + replaceTokens(CW.Truths[k].title) + '</div><div class="truth-text">' + replaceTokens(CW.Truths[k].text) + "</div></div>";
        } else {
          html += '<div class="truth-row unknown">✦ ??? — a truth you have not yet uncovered.</div>';
        }
      });
      const ready = GS().getMeta().unlockedSecrets.includes("theWayBack");
      html += '<div class="unlock-status">The Way Back to ' + friend + ": " + (ready ? "🔓 open — find it in the fifth aisle, and keep the bracelet whole" : "🔒 locked — gather every truth") + "</div></div>";
    }

    el.trackerBody.innerHTML = html;
    el.tracker.classList.add("open");
  }
  function hideTracker() { el.tracker.classList.remove("open"); }

  /* ---- settings (§8) ---------------------------------------------------- */
  function showSettings() {
    const s = GS().getSettings();
    el.settingsBody.innerHTML =
      settingRow("showLockedChoices", "Show locked choices", "Display unavailable choices greyed out, so you know a hidden path exists.", s.showLockedChoices) +
      settingRow("reduceMotion", "Reduce motion", "Turn off background drift, page fades, and typewriter text.", s.reduceMotion) +
      settingRow("musicOn", "Ambient music", "Gentle synthesized music and scene ambience. The 🔊 button mutes everything.", s.musicOn !== false) +
      '<div class="set-row"><div class="set-info"><div class="set-name">Text speed</div><div class="set-desc">How quickly narration appears.</div></div>' +
      '<select id="set-textSpeed"><option value="instant">Instant</option><option value="fast">Fast</option><option value="slow">Slow</option></select></div>';
    el.settingsBody.insertAdjacentHTML("beforeend",
      '<div class="set-row"><div class="set-info"><div class="set-name">Your name</div><div class="set-desc">What the story calls you. Default: Milo.</div></div>' +
      '<input id="set-heroName" class="set-text" type="text" maxlength="16" value="" placeholder="Milo"></div>' +
      '<div class="set-row"><div class="set-info"><div class="set-name">Your friend\'s name</div><div class="set-desc">The friend whose birthday it is. Default: June.</div></div>' +
      '<input id="set-friendName" class="set-text" type="text" maxlength="16" value="" placeholder="June"></div>');
    $("set-heroName").value = s.heroName || "Milo";
    $("set-friendName").value = s.friendName || "June";
    $("set-heroName").addEventListener("input", (ev) => { GS().setSetting("heroName", ev.target.value); CW.StoryEngine.rerenderCurrent(); });
    $("set-friendName").addEventListener("input", (ev) => { GS().setSetting("friendName", ev.target.value); CW.StoryEngine.rerenderCurrent(); });

    $("set-textSpeed").value = s.textSpeed;
    el.settingsBody.querySelectorAll("[data-setting]").forEach((box) => {
      box.addEventListener("change", () => {
        const key = box.getAttribute("data-setting");
        GS().setSetting(key, box.checked);
        applySettingsToDom();
        if (key === "musicOn" && CW.Audio && CW.Audio.refreshMusic) CW.Audio.refreshMusic();
      });
    });
    $("set-textSpeed").addEventListener("change", (ev) => GS().setSetting("textSpeed", ev.target.value));
    el.settings.classList.add("open");
  }
  function settingRow(key, name, desc, val) {
    return '<div class="set-row"><div class="set-info"><div class="set-name">' + name + '</div><div class="set-desc">' + desc + '</div></div>' +
      '<label class="switch"><input type="checkbox" data-setting="' + key + '" ' + (val ? "checked" : "") + '><span class="slider"></span></label></div>';
  }
  function hideSettings() { el.settings.classList.remove("open"); }
  function applySettingsToDom() {
    document.body.classList.toggle("reduce-motion", !!GS().getSettings().reduceMotion);
  }

  /* ---- history (§18, optional) ------------------------------------------ */
  function showHistory() {
    const run = GS().getRun();
    const h = run ? run.choiceHistory : [];
    el.historyBody.innerHTML = h.length
      ? h.map((x, i) => {
          const d = (x.deltas || []).map((y) => (y.amount > 0 ? "+" : "") + y.amount + " " + STAT_NAMES[y.stat]).join(", ");
          return "<div class='hist-row'><span class='hist-i'>" + (i + 1) + ".</span> " + x.text + (d ? " <span class='hist-d'>(" + d + ")</span>" : "") + "</div>";
        }).join("")
      : "<div class='memory-empty'>No choices made yet this run.</div>";
    el.history.classList.add("open");
  }
  function hideHistory() { el.history.classList.remove("open"); }

  return {
    init, showMenu, hideMenu,
    renderNode, renderStats, renderInventory,
    showStatPopups, showBondChange, showSubtle, flashLocked, toast,
    showEnding, hideEnding, showHint,
    showTracker, hideTracker, showSettings, hideSettings, applySettingsToDom,
    showHistory, hideHistory, playIntro, showAbout, hideAbout, showEndingDetail, hideEndingDetail,
  };
})();
