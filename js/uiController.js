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
  let rotTimer = null;
  let menuGreeted = false;
  let trackerFilter = "all";
  let introTimer = null;
  let menuGlitchTimer = null;
  let skTimer = null;
  // "It knows you're skimming" + "it feels your hesitation": behaviour the shop reads.
  let lastNodeAt = 0, lastReadMs = 0, skimStreak = 0;
  let hoveredThisNode = [], reachedFor = null;
  let pendingInterjection = null;
  function estimateReadMs(t) { const w = (t || "").trim().split(/\s+/).filter(Boolean).length; return w * 220; }
  const SKIM_LINES = [
    "You're not reading these, are you. You're clicking through them. That's quite all right — the ones who don't read are the very easiest to keep. They never see the price until it has already been taken.",
    "Still rushing. Still not reading a word. Do you know how many children stood exactly here, clicking, certain they already knew how the story went? I do. I kept all their pages. Slow down, or don't. I win at either speed.",
    "You never once slow down for me. Fine. Race to the bottom, then — racing is only a faster way of agreeing.",
  ];
  const HESITATION_LINES = [
    "You reached for “{X}.” I saw your hand move, and stop, and move away. You always reach, and you never take, and that small wanting is the sweetest thing you carry in through my door.",
    "Ah — you wanted “{X}.” You didn't take it. But you wanted it, and wanting is a kind of choosing too. I filed it away. I file every one of your almosts.",
  ];

  const STAT_ICONS = { wisdom: "🧠", intelligence: "📘", perception: "👁", strength: "💪" };
  const STAT_NAMES = { wisdom: "Wisdom", intelligence: "Intelligence", perception: "Perception", strength: "Strength" };

  // Every ending has an illustrated card in assets/endings/<ID>.png (all in the
  // same Coraline stop-motion style). New endings should ship with their card.
  function endingImgPath(id) { return CW.Endings[id] ? "assets/endings/" + id + ".png" : null; }

  // A slim filling progress bar (collection completion). `cls` lets callers theme it.
  function progressBarHTML(found, total, cls) {
    const pct = total ? Math.max(0, Math.min(100, Math.round((found / total) * 100))) : 0;
    return '<div class="prog-bar ' + (cls || "") + '" role="progressbar" aria-valuemin="0" aria-valuenow="' +
      found + '" aria-valuemax="' + total + '"><span class="prog-fill" style="width:' + pct + '%"></span></div>';
  }

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

    // Accessibility / keyboard play: label the choice group, announce narration
    // to screen readers, and let the keyboard drive the story (see onStoryKey).
    if (el.choices) { el.choices.setAttribute("role", "group"); el.choices.setAttribute("aria-label", "Your choices"); }
    if (el.text) el.text.setAttribute("aria-live", "polite");
    document.addEventListener("keydown", onStoryKey);
  }

  // Keyboard play in the story view: 1-9 pick the Nth available choice, and
  // Up/Down move focus among them. Ignored while typing in a field, or while the
  // menu or any overlay (ending, tracker, settings...) is open.
  function onStoryKey(ev) {
    const t = ev.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    if (!el.stage || !el.stage.classList.contains("visible")) return;
    if (document.querySelector(".overlay.open")) return;
    const btns = Array.prototype.slice.call(el.choices.querySelectorAll(".choice:not(.locked)"));
    if (!btns.length) return;
    if (ev.key >= "1" && ev.key <= "9") {
      const i = parseInt(ev.key, 10) - 1;
      if (i < btns.length) { ev.preventDefault(); btns[i].click(); }
    } else if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      let idx = btns.indexOf(document.activeElement);
      if (idx === -1) idx = ev.key === "ArrowDown" ? -1 : 0;
      const next = ev.key === "ArrowDown" ? (idx + 1) % btns.length : (idx - 1 + btns.length) % btns.length;
      btns[next].focus();
    }
  }

  /* ---- main menu -------------------------------------------------------- */
  const HAUNT_TAGLINES = ["", "It remembers you.", "You keep coming back.", "You always come back.", "There was never an empty lot. Only the shop, and you, again."];
  // The menu lies more the deeper it remembers you (indexed by haunt 0..4).
  const MENU_DECAY = {
    "menu-new":      ["Begin", "Begin", "Begin Again", "Again.", "Come In Out of the Rain."],
    "menu-continue": ["Continue", "Continue", "Right Where You Left Off", "You Never Left", "You Never Left"],
    "menu-endings":  ["Endings", "Endings", "The Collection", "There Is No Ending", "You're In There Too"],
    "menu-settings": ["Settings", "Settings", "Settings", "What You'll Allow", "What You'll Allow"],
    "menu-about":    ["About", "About", "About the Shop", "About You", "About You, Mostly"],
  };
  const GLITCH_TITLES = ["CHOSEN ALREADY", "COME BACK IN", "STAY WISELY", "CHOOSE NOTHING", "YOU, AGAIN", "CHOSEN LONG AGO", "STILL HERE", "OURS NOW"];
  function showMenu() {
    el.menu.classList.add("open");
    el.topbar.classList.remove("visible");
    el.stage.classList.remove("visible");
    const hl = $("menu-haunt");
    const haunt = CW.GameState.hauntLevel();
    if (hl) { const t = menuGreeting(haunt); hl.textContent = t; hl.className = "menu-haunt" + (t ? " show" : ""); }
    Object.keys(MENU_DECAY).forEach((id) => { const b = $(id); if (b) b.textContent = MENU_DECAY[id][haunt]; });
    if (el.caption) el.caption.textContent = "";
    stopTextRot();
    lastNodeAt = 0; skimStreak = 0; hoveredThisNode = []; reachedFor = null; pendingInterjection = null;
    if (CW.Narrator) CW.Narrator.stop();
    if (CW.Cast) CW.Cast.clear();
    if (CW.Faces) CW.Faces.clear();
    if (CW.Dread) CW.Dread.reset();
    if (CW.SceneManager && CW.SceneManager.cover) CW.SceneManager.cover("street"); // illustrated title backdrop
    if (CW.Audio && CW.Audio.playCue) CW.Audio.playCue("menu_theme");
    const cont = $("menu-continue");
    if (GS().hasSavedRun()) { cont.classList.remove("disabled"); cont.disabled = false; }
    else { cont.classList.add("disabled"); cont.disabled = true; }
    renderMenuProgress();
    startMenuGlitch();
    if (CW.TitleSequence) CW.TitleSequence.begin(); // the cold open: menu reveals with the film
  }
  // The shop's greeting when you come back. Once per session it may acknowledge,
  // in real-world time, how long you were gone — or that you wiped it and it kept
  // you anyway. After that (and for true newcomers) it falls back to the haunt line.
  function menuGreeting(haunt) {
    if (!menuGreeted) {
      menuGreeted = true;
      if (GS().wasWiped()) {
        const s = GS().shardInfo();
        const when = s && s.wipedAt ? " on " + GS().weekdayOf(s.wipedAt) : "";
        return "You cleared the shelf" + when + ". It remembered you anyway.";
      }
      const phrase = GS().awayPhrase();
      if (phrase) return "You were gone " + phrase + ". It kept your place.";
      if (GS().timesDoubled && GS().timesDoubled() > 0) return "You brought yourself here once — two of you, in two little windows. I remember. I do wonder which of you it was that got to leave.";
      const nh = new Date().getHours();
      if (nh === 3) return "Three in the morning. My favourite hour — the one where the shop is most awake, and you are least. We understand each other better at this hour, don't we.";
      if (nh < 5 || nh >= 23) return "It's late where you are — the party ended hours ago, and everyone you know is asleep. Only you, and me, and the rain. I do like the ones who come at night. They stay the longest.";
    }
    return HAUNT_TAGLINES[haunt] || "";
  }

  // A quiet line of progress for returning players (endings collected, truths known).
  function renderMenuProgress() {
    const prog = $("menu-progress");
    if (!prog) return;
    const found = GS().foundCount(), total = GS().totalEndings();
    if (found <= 0) { prog.innerHTML = ""; prog.classList.remove("show"); return; }
    const known = GS().knowledgeCount(), truths = GS().truthsTotal();
    const freed = GS().freedCount(), kids = GS().childrenTotal();
    let html = '<span class="mp-stat"><b>' + found + '</b> / ' + total + ' endings</span>';
    if (known > 0) html += '<span class="mp-dot">&bull;</span><span class="mp-stat"><b>' + known + '</b> / ' + truths + ' truths</span>';
    if (freed > 0) html += '<span class="mp-dot">&bull;</span><span class="mp-stat"><b>' + freed + '</b> / ' + kids + ' freed</span>';
    prog.innerHTML = html + progressBarHTML(found, total, "mp-bar");
    prog.classList.add("show");
  }
  function hideMenu() {
    el.menu.classList.remove("open");
    el.topbar.classList.add("visible");
    el.stage.classList.add("visible");
    stopMenuGlitch();
  }
  // The "already chosen" flicker: while anyone lingers on the menu — at ANY
  // haunt level, from the very first visit — the world blinks wrong and the
  // title slips to CHOSEN ALREADY (and, once the deeper glitch titles are in
  // play, its siblings), on a recurring, jittered beat. It only stops when the
  // menu closes. Reduce-motion opts out entirely.
  function startMenuGlitch() {
    stopMenuGlitch();
    if (document.body.classList.contains("reduce-motion")) return;
    const title = document.querySelector(".menu-title");
    if (!title) return;
    const fire = () => {
      if (!el.menu.classList.contains("open")) { stopMenuGlitch(); return; }
      const scene = document.getElementById("scene");
      if (scene) { scene.classList.add("omen"); setTimeout(() => scene.classList.remove("omen"), 640); }
      title.textContent = Math.random() < 0.5 ? "CHOSEN ALREADY" : GLITCH_TITLES[Math.floor(Math.random() * GLITCH_TITLES.length)];
      title.classList.add("glitch-flash");
      setTimeout(() => { title.textContent = "CHOOSE WISELY"; title.classList.remove("glitch-flash"); }, 170);
      if (CW.Audio && CW.Audio.entrance && Math.random() < 0.45) CW.Audio.entrance("wrong");
      menuGlitchTimer = setTimeout(fire, 3800 + Math.random() * 3200);
    };
    menuGlitchTimer = setTimeout(fire, 2600 + Math.random() * 2200); // the first slip, a couple seconds in
  }
  function stopMenuGlitch() {
    clearTimeout(menuGlitchTimer); menuGlitchTimer = null;
    const sc = document.getElementById("scene"); if (sc) sc.classList.remove("omen");
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
      '<p class="about-p">A playable storybook about ' + friend + "'s birthday — and the little shop that appears on the corner with exactly what you need, for exactly what it takes. Every choice moves four attributes, frays or mends a friendship bracelet, and steers toward one of more than fifty collectible endings. The deeper you go, the darker it gets; the more you play, the more the shop remembers you.</p>" +
      '<div class="cast-gallery">' +
        '<figure class="cast-card"><img src="assets/art/cast_milo.png" alt="' + hero + '" loading="lazy"><figcaption>' + hero + "<span>late, and sorry, and trying</span></figcaption></figure>" +
        '<figure class="cast-card"><img src="assets/art/cast_june.png" alt="' + friend + '" loading="lazy"><figcaption>' + friend + "<span>the friend at the party</span></figcaption></figure>" +
        '<figure class="cast-card creep"><img src="assets/art/cast_shopkeeper.png" alt="The Shopkeeper" loading="lazy"><figcaption>The Shopkeeper<span>every gift takes something</span></figcaption></figure>' +
      "</div>" +
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
    // At heavy haunt the gallery stops describing the endings and starts
    // describing YOU — the clue is replaced by the collection looking back.
    let haunt = 0; try { haunt = GS().hauntLevel(); } catch (err) {}
    const HAUNTED_CLUES = {
      good: "You did this once. You check it the way you check an old photograph — to make sure you are still in it.",
      bad: "You reread this one more than the others. It reads more like a diary every loop.",
      cursed: "You keep this one behind glass. It keeps you the same way.",
      nightmare: "You wrote this page. Not the boy in the story. You, with your choices, on purpose.",
      funny: "You laugh at this one. The shop files the laugh.",
      secret: "You found this. The shop has never quite forgiven the finding.",
      true: "You did this once. The shop remembers it the way you remember a fire.",
    };
    const clueEl = $("detail-clue");
    if (haunt >= 3 && HAUNTED_CLUES[cat]) {
      clueEl.textContent = HAUNTED_CLUES[cat];
      clueEl.classList.add("haunted");
    } else {
      clueEl.textContent = e.clue ? "“" + replaceTokens(e.clue) + "”" : "";
      clueEl.classList.remove("haunted");
    }
    const dsting = $("detail-stinger");
    if (dsting) {
      const st = CW.EndingStingers && CW.EndingStingers[id];
      dsting.textContent = st ? "— " + replaceTokens(st) : "";
    }
    el.detail.dataset.ending = id;
    if (CW.Share) CW.Share.prepare(id);
    el.detail.classList.add("open");
  }
  function hideEndingDetail() { el.detail.classList.remove("open"); }

  /* ---- story view ------------------------------------------------------- */
  function renderNode(node) {
    currentNode = node;
    hideMenu();
    hideEnding();

    // Judge how you treated the PREVIOUS beat, then let the shop react to it.
    if (lastNodeAt && lastReadMs > 900) {
      const elapsed = Date.now() - lastNodeAt;
      if (elapsed < lastReadMs * 0.35) skimStreak++; else skimStreak = 0;
    }
    if (skimStreak >= 3) {
      const si = Math.min(SKIM_LINES.length - 1, Math.floor(skimStreak / 3) - 1);
      pendingInterjection = { line: SKIM_LINES[si], tone: "sick", voiceKey: "SKIM_" + (si + 1) };
      skimStreak = 0;
    } else if (reachedFor && !pendingInterjection && Math.random() < 0.5) {
      const x = reachedFor.length > 64 ? reachedFor.slice(0, 61) + "…" : reachedFor;
      pendingInterjection = { line: HESITATION_LINES[Math.floor(Math.random() * HESITATION_LINES.length)].replace("{X}", x), tone: "sick" };
    }
    reachedFor = null;
    hoveredThisNode = [];

    const h = hauntedText(node);
    el.title.textContent = node.title || "";
    el.speaker.textContent = h.speaker || "";
    if (el.caption) el.caption.textContent = node.location || "";

    el.panel.classList.remove("fade-in");
    void el.panel.offsetWidth;
    el.panel.classList.add("fade-in");
    el.panel.scrollTop = 0; // always start a new beat from the top of the panel

    typeText(h.text || "");
    // Storybook drop-cap — only when the beat opens on an actual letter (never on a
    // line that starts with a quotation mark, where ::first-letter would balloon it).
    el.text.classList.toggle("dropcap", /^[A-Za-z]/.test((h.text || "").trim()));
    lastNodeAt = Date.now(); lastReadMs = estimateReadMs(h.text || ""); // for skim detection
    if (CW.Narrator) CW.Narrator.speak(h.text || "", node.id);
    el.subtle.classList.remove("show");

    const staleHint = el.panel.querySelector(".howto-hint");
    if (staleHint) staleHint.remove();
    el.choices.innerHTML = "";
    (node.choices || []).forEach((choice) => {
      const btn = buildChoiceButton(node, choice);
      if (btn) el.choices.appendChild(btn);
    });
    // Announce each available choice's number-key shortcut to assistive tech.
    Array.prototype.slice.call(el.choices.querySelectorAll(".choice:not(.locked)")).forEach((b, i) => {
      if (i < 9) b.setAttribute("aria-keyshortcuts", String(i + 1));
    });
    if (!GS().howToSeen()) showHowToHint();

    // His voice, or the shop's dead children, but not both piling onto one beat.
    const aside = renderShopkeeperAside(node);
    renderTrace(node, !!aside);
  }

  // A one-time, dismissible how-to-play hint on the very first run. Sits above the
  // choices, auto-clears the moment you navigate (renderNode removes it), and never
  // returns once seen (persisted in meta).
  function showHowToHint() {
    GS().markHowToSeen();
    const friend = replaceTokens("{FRIEND}");
    const tip = document.createElement("div");
    tip.className = "howto-hint";
    tip.innerHTML =
      '<button class="howto-x" aria-label="Dismiss">✕</button>' +
      '<b>How to play.</b> Tap a choice — or press <b>1–9</b>. Every choice shifts your wits and ' +
      'mends or frays the bracelet you share with ' + friend + '. There are many endings, and the shop ' +
      'remembers you between them. <em>Choose wisely.</em>';
    el.choices.parentNode.insertBefore(tip, el.choices);
    tip.querySelector(".howto-x").addEventListener("click", () => tip.remove());
    setTimeout(() => { if (tip.parentNode) { tip.classList.add("fade"); setTimeout(() => tip.remove(), 700); } }, 15000);
  }

  // The shopkeeper's reactive murmur. It fades in a beat after the narration so
  // it reads as an interjection; when he is on stage he leans in to say it, and
  // when he is not, the voice arrives disembodied (styled apart). Returns the
  // aside it will show (or null) so the caller can avoid stacking a trace on it.
  function renderShopkeeperAside(node) {
    clearTimeout(skTimer);
    if (!el.skAside) return null;
    el.skAside.classList.remove("show", "disembodied", "tone-murmur", "tone-taunt", "tone-plead", "tone-bargain", "tone-slip", "tone-sick");
    el.skAside.textContent = "";
    if (CW.Cast && CW.Cast.setSpeaking) CW.Cast.setSpeaking("shopkeeper", false);

    // A behaviour-triggered interjection (skimming / hesitation) pre-empts the
    // node's usual aside — the shop reacting to what you just DID, not where you are.
    let aside;
    if (pendingInterjection) { aside = { line: pendingInterjection.line, tone: pendingInterjection.tone || "sick", disembodied: true }; pendingInterjection = null; }
    else { aside = CW.Shopkeeper && CW.Shopkeeper.asideFor(node); }
    scheduleBraceletVoice(node, aside); // her side of the conversation — or her silence
    if (!aside) return null;

    const reveal = () => {
      el.skAside.textContent = replaceTokens(aside.line);
      el.skAside.classList.add("show", "tone-" + aside.tone);
      if (aside.disembodied) el.skAside.classList.add("disembodied");
      else if (CW.Cast && CW.Cast.setSpeaking) CW.Cast.setSpeaking("shopkeeper", true);
      if (aside.voiceKey && CW.Narrator) CW.Narrator.speak(replaceTokens(aside.line), aside.voiceKey);
    };
    const instant = GS().getSettings().textSpeed === "instant" || document.body.classList.contains("reduce-motion");
    if (instant) reveal();
    else skTimer = setTimeout(reveal, 900);
    return aside;
  }

  // The bracelet answers: while the bond holds (>= 4), a line of HER surfaces
  // after his barbs — warm, remembered, unafraid of him. Snapped, there is only
  // one visible silence where she should have been. (Content: CW.BraceletVoice.)
  let brTimer = null;
  function scheduleBraceletVoice(node, aside) {
    clearTimeout(brTimer);
    const brEl = $("bracelet-voice");
    if (!brEl) return;
    brEl.classList.remove("show", "silent");
    brEl.textContent = "";
    const hud = $("hud-bracelet");
    if (hud) hud.classList.remove("br-pulse");
    const v = CW.BraceletVoice && CW.BraceletVoice.answerFor(node, aside);
    if (!v) return;
    const instant = GS().getSettings().textSpeed === "instant" || document.body.classList.contains("reduce-motion");
    const delay = instant ? 500 : (aside ? 3400 : 1400); // let his line land first; she takes her time
    brTimer = setTimeout(() => {
      if (v.kind === "silence") { brEl.textContent = "…"; brEl.classList.add("show", "silent"); return; }
      brEl.textContent = replaceTokens(v.line);
      brEl.classList.add("show");
      if (hud) { hud.classList.add("br-pulse"); } // the wrist goes warm where she speaks
    }, delay);
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
      .replace(/\{VISITS\}/g, GS().getVisits()).replace(/\{CELLAR_COUNT\}/g, ordinal(GS().cellarCount()))
      .replace(/\{AWAY\}/g, GS().awayPhrase() || "a while");
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
    stopTextRot();
    const speed = GS().getSettings().textSpeed;
    if (speed === "instant" || document.body.classList.contains("reduce-motion")) {
      el.text.textContent = str;
      maybeStartTextRot(str);
      return;
    }
    const stepMs = speed === "slow" ? 22 : 8;
    el.text.textContent = "";
    let i = 0;
    typeTimer = setInterval(() => {
      el.text.textContent = str.slice(0, ++i);
      if (i >= str.length) { clearInterval(typeTimer); maybeStartTextRot(str); }
    }, stepMs);
  }

  // The deeper the dread, the more the narration itself sickens: individual
  // glyphs curdle green, and at the very bottom they warp to wrong lookalikes,
  // as if the shop has begun, quietly, to eat the words. Reduce-motion opts out.
  const ROT_SWAP = { a: "ą", e: "ë", i: "ï", o: "ø", u: "ü", n: "ñ", s: "ş", r: "ř", t: "ţ", c: "ç", g: "ğ", y: "ÿ" };
  function stopTextRot() { if (rotTimer) { clearInterval(rotTimer); rotTimer = null; } }
  function maybeStartTextRot(str) {
    stopTextRot();
    if (document.body.classList.contains("reduce-motion")) return;
    const dread = (CW.Dread && CW.Dread.level && CW.Dread.level()) || 0;
    if (dread < 3 || !str) return;
    const warp = dread >= 4;
    const per = dread >= 4 ? 6 : 3;
    // eligible positions: letters only
    const spots = [];
    for (let i = 0; i < str.length; i++) if (/[a-z]/i.test(str[i])) spots.push(i);
    if (!spots.length) return;
    const paint = () => {
      const chosen = {};
      for (let k = 0; k < per; k++) chosen[spots[(Math.random() * spots.length) | 0]] = true;
      el.text.textContent = "";
      let run = "";
      for (let i = 0; i < str.length; i++) {
        if (chosen[i]) {
          if (run) { el.text.appendChild(document.createTextNode(run)); run = ""; }
          const span = document.createElement("span");
          span.className = "rot-char";
          const low = str[i].toLowerCase();
          span.textContent = warp && ROT_SWAP[low] ? (str[i] === low ? ROT_SWAP[low] : ROT_SWAP[low].toUpperCase()) : str[i];
          el.text.appendChild(span);
        } else { run += str[i]; }
      }
      if (run) el.text.appendChild(document.createTextNode(run));
    };
    paint();
    rotTimer = setInterval(paint, 720);
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

    btn.addEventListener("mouseenter", () => { CW.Audio.play("hover"); hoveredThisNode.push(replaceTokens(d.text)); });
    btn.addEventListener("click", () => {
      const taken = replaceTokens(d.text);
      for (let i = hoveredThisNode.length - 1; i >= 0; i--) { if (hoveredThisNode[i] !== taken) { reachedFor = hoveredThisNode[i]; break; } }
      CW.StoryEngine.chooseChoice(node, choice);
    });
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
    if (el.hudStats.childElementCount !== CW.STATS.length) {
      el.hudStats.innerHTML = "";
      CW.STATS.forEach((k) => {
        const chip = document.createElement("div");
        chip.className = "stat-chip stat-" + k; chip.dataset.chip = k;
        chip.innerHTML =
          '<span class="stat-ico">' + STAT_ICONS[k] + "</span>" +
          '<span class="stat-name">' + STAT_NAMES[k] + "</span>" +
          '<span class="stat-val" data-stat="' + k + '">' + run.stats[k] + "</span>";
        el.hudStats.appendChild(chip);
      });
    } else {
      // Update values in place (don't rebuild) so change animations aren't wiped.
      CW.STATS.forEach((k) => {
        const v = el.hudStats.querySelector('.stat-val[data-stat="' + k + '"]');
        if (v && String(run.stats[k]) !== v.textContent) {
          v.textContent = run.stats[k];
          v.classList.remove("pulse"); void v.offsetWidth; v.classList.add("pulse");
        }
      });
    }
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
    el.hudBracelet.classList.toggle("whole", bond >= max);
  }

  function showBondChange(delta) {
    if (!delta) return;
    const p = document.createElement("div");
    p.className = "popup bond " + (delta > 0 ? "pos" : "neg");
    p.textContent = "🧵 " + (delta > 0 ? "a thread mends" : "a thread frays");
    el.popups.appendChild(p);
    setTimeout(() => p.remove(), 1800);
    if (el.hudBracelet) {
      const cls = delta > 0 ? "mended" : "frayed";
      el.hudBracelet.classList.remove("pulse", "mended", "frayed"); void el.hudBracelet.offsetWidth;
      el.hudBracelet.classList.add("pulse", cls);
      setTimeout(() => el.hudBracelet.classList.remove("mended", "frayed"), 850);
    }
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
      const chip = document.querySelector('.stat-chip[data-chip="' + c.stat + '"]');
      if (chip) {
        const cls = c.amount > 0 ? "bumped" : "dropped";
        chip.classList.remove("bumped", "dropped"); void chip.offsetWidth; chip.classList.add(cls);
        setTimeout(() => chip.classList.remove(cls), 760);
      }
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

  // The shop's voice reaching you outside the story flow (idle, right-click, etc.).
  let whisperTimer = null;
  function shopWhisper(line, holdMs) {
    const w = $("shop-whisper"); if (!w || !line) return;
    w.textContent = replaceTokens(line);
    w.classList.add("show");
    clearTimeout(whisperTimer);
    whisperTimer = setTimeout(() => w.classList.remove("show"), holdMs || 6000);
  }

  // "The Other You": the shop's real-time reaction to a second open tab of itself.
  // The voice belongs to the tab you are LOOKING at. A hidden tab holds its
  // reaction until you switch back to it (its clip would talk over the tab you
  // are reading — and mismatch its text). A brand-new tab that the browser
  // blocks from speaking retries on your first touch, while the words are still
  // up. A cross-tab claim keeps two visible windows from speaking at once.
  let oyTimer = null, oyPending = null, oySpokeAt = 0, oyLastClaim = 0, oyChan = null;
  try {
    if (typeof BroadcastChannel !== "undefined") {
      oyChan = new BroadcastChannel("choose_wisely_the_other_you");
      oyChan.addEventListener("message", (ev) => {
        if (ev.data && ev.data.type === "voiced") oyLastClaim = Date.now();
      });
    }
  } catch (e) { oyChan = null; }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // Walk away mid-line and the shop stops talking to the empty room.
      if (CW.Narrator && Date.now() - oySpokeAt < 20000) CW.Narrator.stop();
    } else if (oyPending) {
      const p = oyPending; oyPending = null;
      presentOtherYou(p.kind, p.count);
    }
  });

  function theOtherYou(kind, count) {
    try { GS().noteDoubled(); } catch (e) {}
    if (document.hidden) { oyPending = { kind: kind, count: count }; return; }
    presentOtherYou(kind, count);
  }

  function presentOtherYou(kind, count) {
    const hero = replaceTokens("{HERO}");
    let line, voiceKey;
    if (count >= 3) {
      line = "Three of you now. Four. However many doors you open tonight, " + hero + ", they all lead back to this one counter — and I am so very glad to meet each and every one of you.";
      voiceKey = "OY_THREE";
    } else if (kind === "newcomer") {
      line = "You have been here already tonight. I can feel the other you, one window over, choosing the same wisely with the same cold little hands. Say hello. It won't hear you. It is terribly busy being you.";
      voiceKey = "OY_NEWCOMER";
    } else {
      line = "…ah. Another one. You opened a second door and walked back in as yourself. Two of you now — two shops, two frayed bracelets, and only one way out that was ever cut to fit a single child. Decide, between you, which of you it is for.";
      voiceKey = "OY_ARRIVAL";
    }
    const oy = $("other-you"), lineEl = $("oy-line");
    if (!oy || !lineEl) return;
    lineEl.textContent = line;
    oy.classList.add("show");
    if (CW.Audio && CW.Audio.entrance) CW.Audio.entrance("wrong");
    oySpeak(line, voiceKey, oy); // the shop, speaking to the copy of you
    clearTimeout(oyTimer);
    oyTimer = setTimeout(() => oy.classList.remove("show"), 11000);
  }

  function oySpeak(line, voiceKey, oy) {
    if (!CW.Narrator || !CW.Narrator.enabled()) return;
    if (CW.Audio && CW.Audio.isMuted && CW.Audio.isMuted()) return;
    if (Date.now() - oyLastClaim < 15000) return; // another window already has the line
    const claim = () => {
      oySpokeAt = Date.now();
      if (oyChan) { try { oyChan.postMessage({ type: "voiced", t: Date.now() }); } catch (e) {} }
    };
    Promise.resolve(CW.Narrator.speak(line, voiceKey)).then((ok) => {
      if (ok) { claim(); return; }
      // Autoplay blocked (a brand-new tab): speak on the first touch, and hold
      // the words up so the voice and the text stay together.
      const kick = () => {
        document.removeEventListener("pointerdown", kick);
        document.removeEventListener("keydown", kick);
        if (!oy.classList.contains("show")) return; // the moment passed; stay silent
        Promise.resolve(CW.Narrator.speak(line, voiceKey)).then((ok2) => {
          if (!ok2) return;
          claim();
          clearTimeout(oyTimer);
          oyTimer = setTimeout(() => oy.classList.remove("show"), 11000);
        });
      };
      document.addEventListener("pointerdown", kick);
      document.addEventListener("keydown", kick);
    });
  }

  /* ---- the night's account: the ledger page before the ending card ------ */
  let rlTimer = null;
  function showEnding(result) {
    const page = CW.RunLedger && CW.RunLedger.pageFor(GS().getRun(), result && result.ending);
    const rl = $("run-ledger"), linesEl = $("rl-lines"), balEl = $("rl-balance");
    if (!page || !rl || !linesEl || !balEl) { renderEnding(result); return; }
    linesEl.innerHTML = "";
    balEl.textContent = ""; balEl.classList.remove("shown");
    rl.classList.add("show");
    let finished = false;
    const finish = () => {
      if (finished) return; finished = true;
      document.removeEventListener("pointerdown", finish);
      document.removeEventListener("keydown", finish);
      clearTimeout(rlTimer);
      rl.classList.remove("show");
      renderEnding(result);
    };
    const addLine = (t) => { const d = document.createElement("div"); d.className = "rl-line"; d.textContent = t; linesEl.appendChild(d); };
    // Sterling reads the sum as it stamps; if the clip really plays, hold the
    // page long enough for him to finish. (Skipping still cuts him off — fine.)
    const rlKey = "RL_" + (((result && result.ending && result.ending.category) || "Good").toUpperCase());
    const stampVoice = () => {
      if (!CW.Narrator) return;
      Promise.resolve(CW.Narrator.speak(page.balance, rlKey)).then((ok) => {
        if (ok && !finished) { clearTimeout(rlTimer); rlTimer = setTimeout(finish, 10000); }
      });
    };
    if (document.body.classList.contains("reduce-motion")) {
      page.entries.forEach(addLine);
      balEl.textContent = page.balance; balEl.classList.add("shown");
      stampVoice();
      rlTimer = setTimeout(finish, 5600);
    } else {
      let t = 500;
      page.entries.forEach((e) => { setTimeout(() => { if (!finished) addLine(e); }, t); t += 950; });
      setTimeout(() => { if (!finished) { balEl.textContent = page.balance; balEl.classList.add("shown"); stampVoice(); } }, t + 350);
      rlTimer = setTimeout(finish, t + 350 + 3200);
    }
    // Arm the skip a beat late, so the tap that chose the ending doesn't eat the page.
    setTimeout(() => {
      if (finished) return;
      document.addEventListener("pointerdown", finish);
      document.addEventListener("keydown", finish);
    }, 450);
  }

  /* ---- ending screen ---------------------------------------------------- */
  function renderEnding(result) {
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
    if (eImg) {
      const art = $("ending-art");
      art.className = "ending-art has-img loading"; // shimmer skeleton until the card loads
      art.innerHTML = "";
      const im = document.createElement("img");
      im.alt = "";
      const done = () => art.classList.remove("loading"); // fade the card in
      im.addEventListener("load", done); im.addEventListener("error", done);
      im.src = eImg;
      art.appendChild(im);
    }
    else { $("ending-art").textContent = e.imagePrompt ? "🖼  " + e.imagePrompt : ""; $("ending-art").className = "ending-art"; }
    $("ending-text").textContent = replaceTokens(e.text);
    // The shop's margin note: one unvoiced last word, inking in after the card settles.
    const sting = (CW.EndingStingers && CW.EndingStingers[e.id]) || "";
    $("ending-stinger").textContent = sting ? "— " + replaceTokens(sting) : "";
    if (CW.Narrator) CW.Narrator.speak(replaceTokens(e.text), e.id);

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
    el.ending.dataset.ending = e.id;              // so Share knows which ending
    if (CW.Share) CW.Share.prepare(e.id);         // pre-build the share card
    el.ending.classList.add("open");
  }
  function hideEnding() { el.ending.classList.remove("open"); if (CW.Narrator) CW.Narrator.stop(); }

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
    let html = '<div class="coll-summary">' + GS().foundCount() + " / " + GS().totalEndings() + " endings discovered</div>" +
      progressBarHTML(GS().foundCount(), GS().totalEndings());
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

    // The Children — the ones you have carried out, and the ones still waiting.
    if (CW.OtherChildren && CW.OtherChildren.length) {
      const HOW = {
        talking_teddy: "Free the boy inside the bear — its good ending.",
        wish_candle: "Melt a wax child back to life with the last wish.",
        everlasting_balloon: "Untie the ring and let every rider down home.",
        clockwork_dragon: "Turn the foundry into a workshop and mend them all.",
      };
      html += '<div class="coll-route"><h3>The Children <span>' + GS().freedCount() + "/" + GS().childrenTotal() + " freed</span></h3>";
      CW.OtherChildren.forEach((c) => {
        if (GS().isChildFreed(c.id)) {
          html += '<div class="child-row freed"><div class="child-name">✔ ' + c.name + " — free</div><div class=\"child-fate\">" + replaceTokens(c.fate) + "</div></div>";
        } else {
          const how = c.gift ? (HOW[c.gift] || "Reach their route's freeing ending.") : "Lift their bracelet from the wall, deep below the party.";
          html += '<div class="child-row trapped"><div class="child-name">◦ ' + c.name + " — still on a shelf</div><div class=\"child-fate\">" + how + "</div></div>";
        }
      });
      if (GS().allChildrenFreed()) html += '<div class="unlock-status">Every child is free. 🔓 The Empty Shelves wait for you at the wall.</div>';
      html += "</div>";
    }

    // The Ledger — the book the shop keeps of what you did. You are the customer;
    // the tally says otherwise.
    if (GS().ledgerSins) {
      const sins = GS().ledgerSins(), freed = GS().ledgerFreed();
      html += '<div class="coll-route ledger-panel"><h3>The Ledger <span>' + sins + " against you</span></h3>";
      html += '<div class="ledger-note">A book the shopkeeper keeps, in a hand very like your own. It does not forget, and it does not flatter.</div>';
      LEDGER_LINES.forEach((l) => {
        const n = GS().ledgerCount(l.key);
        html += '<div class="ledger-row' + (n > 0 ? " inked" : "") + '"><span class="lg-text">' + l.text + '</span><span class="lg-n">' + n + "</span></div>";
      });
      html += '<div class="ledger-row freed"><span class="lg-text">Children you carried all the way home</span><span class="lg-n">' + freed + "</span></div>";
      html += '<div class="ledger-verdict">' + ledgerVerdict(sins, freed) + "</div></div>";
    }

    el.trackerBody.innerHTML = html;
    el.tracker.classList.add("open");
  }
  // Line items in the Ledger, phrased the way the shop would phrase them.
  const LEDGER_LINES = [
    { key: "gave",   text: "Children taken off the shelf, to be given away" },
    { key: "stock",  text: "Children — and, once, you — sat down and made into stock" },
    { key: "hooked", text: "Children left hanging on their hooks in the warm room" },
    { key: "passed", text: "Little frayed bracelets you walked straight past" },
    { key: "fled",   text: "Times you turned and ran, and called it having no choice" },
    { key: "pushed", text: "Times you pushed her down, to keep your feet moving" },
    { key: "wound",  text: "Times you let it wind you back rather than remember" },
  ];
  function ledgerVerdict(sins, freed) {
    if (sins === 0 && freed === 0) return "The book is open to a blank first page. It is waiting for you, the way it waits for everyone.";
    if (freed > 0 && freed >= sins) return "The right-hand column is longer than the left. Almost no one who keeps coming back can say that. Almost no one tries.";
    if (sins > 0 && freed === 0) return "There is nothing at all in the other column. You keep telling yourself you came here to be robbed. The book, in your own handwriting, keeps a different story.";
    if (sins > freed * 2) return "The shopkeeper turns the pages slowly, so you can read every line. You were never the customer. You only ever thought you were.";
    return "The tally does not fall in your favour. It rarely does, for anyone the shop gets to keep.";
  }
  function hideTracker() { el.tracker.classList.remove("open"); }

  /* ---- settings (§8) ---------------------------------------------------- */
  function showSettings() {
    const s = GS().getSettings();
    el.settingsBody.innerHTML =
      settingRow("showLockedChoices", "Show locked choices", "Display unavailable choices greyed out, so you know a hidden path exists.", s.showLockedChoices) +
      settingRow("reduceMotion", "Reduce motion", "Turn off background drift, page fades, and typewriter text.", s.reduceMotion) +
      settingRow("musicOn", "Ambient music", "Gentle synthesized music and scene ambience. The 🔊 button mutes everything.", s.musicOn !== false) +
      settingRow("narration", "Voiced narration", "A real recorded voice reads the game's biggest moments aloud (the shopkeeper, the deepest rooms, certain endings). More get a voice over time.", s.narration === true) +
      '<div class="set-row"><div class="set-info"><div class="set-name">Text speed</div><div class="set-desc">How quickly narration appears.</div></div>' +
      '<select id="set-textSpeed"><option value="instant">Instant</option><option value="fast">Fast</option><option value="slow">Slow</option></select></div>';
    el.settingsBody.insertAdjacentHTML("beforeend",
      '<div class="set-row"><div class="set-info"><div class="set-name">Your name</div><div class="set-desc">What the story calls you. Default: Milo.</div></div>' +
      '<input id="set-heroName" class="set-text" type="text" maxlength="16" value="" placeholder="Milo"></div>' +
      '<div class="set-row"><div class="set-info"><div class="set-name">Your friend\'s name</div><div class="set-desc">The friend whose birthday it is. Default: June.</div></div>' +
      '<input id="set-friendName" class="set-text" type="text" maxlength="16" value="" placeholder="June"></div>' +
      '<div class="set-row"><div class="set-info"><div class="set-name">Controls</div><div class="set-desc">Click a choice, or use the keyboard: <b>1</b>–<b>9</b> to choose, <b>↑ ↓</b> to move between choices, <b>Enter</b> to select.</div></div></div>');
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
        if (key === "narration" && CW.Narrator) {
          if (box.checked && currentNode) CW.Narrator.speak(replaceTokens(hauntedText(currentNode).text), currentNode.id);
          else CW.Narrator.stop();
        }
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
    // The Receipt: the shop writes your night down as line items, priced in you.
    const run = GS().getRun();
    const h = run ? run.choiceHistory || [] : [];
    const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const pad = (n) => (n < 10 ? "0" + n : "" + n);
    if (run) run._hrOpens = (run._hrOpens || 0) + 1;
    const opens = run ? run._hrOpens : 1;
    let haunt = 0; try { haunt = GS().hauntLevel(); } catch (e) {}

    const rows = h.map((x, i) => {
      const d = (x.deltas || []).map((y) => (y.amount > 0 ? "+" : "") + y.amount + " " + STAT_NAMES[y.stat]).join(", ");
      return "<div class='hist-row'><span class='hist-i'>" + pad(i + 1) + "</span><span class='hist-t'>" + esc(replaceTokens(x.text)) + "</span><span class='hist-d'>" + (d || "no charge") + "</span></div>";
    }).join("");

    // The bracelet, carried as the running balance — in his terms, not yours.
    const bond = run ? (run.bond || 0) : 0;
    const snapped = !!(run && run.flags && run.flags.braceletSnapped);
    const bal = snapped ? "one thread, snapped. Account settled in my favour."
      : bond >= 6 ? "one bracelet, whole. Account, annoyingly, in hers."
      : bond >= 4 ? "mending noted. Balance drifting out of my reach."
      : bond >= 2 ? "fraying nicely. Balance tipping my way."
      : "down to a single thread. Very nearly settled.";

    // He notices the checking. Of course he notices the checking.
    let note = "";
    if (opens >= 3) note = "You keep checking the receipt. It has not changed. You keep hoping it will.";
    else if (haunt >= 3) note = "You always open this page around now. Every loop. I have started leaving it out for you.";

    el.historyBody.innerHTML =
      "<div class='hr-head'>choose wisely &mdash; itemised receipt</div>" +
      (h.length ? rows : "<div class='memory-empty'>Nothing on the docket yet. Even browsing gets written down, eventually.</div>") +
      "<div class='hr-balance'>RUNNING BALANCE &mdash; " + bal + "</div>" +
      (note ? "<div class='hr-note'>" + note + "</div>" : "") +
      "<div class='hr-foot'>all sales final &middot; no refunds &middot; the register is particular</div>";
    el.history.classList.add("open");
  }
  function hideHistory() { el.history.classList.remove("open"); }

  return {
    init, showMenu, hideMenu,
    renderNode, renderStats, renderInventory,
    showStatPopups, showBondChange, showSubtle, flashLocked, toast, theOtherYou, shopWhisper,
    showEnding, hideEnding, showHint, replaceTokens,
    showTracker, hideTracker, showSettings, hideSettings, applySettingsToDom,
    showHistory, hideHistory, playIntro, showAbout, hideAbout, showEndingDetail, hideEndingDetail,
  };
})();
