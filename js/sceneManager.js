/* ============================================================================
 * sceneManager.js  -  drives the living background. Sets the theme gradient
 * (sky colour) on #scene and renders an animated SVG scene into #scene-art that
 * depicts what is happening in the current node. Scenes come from scenes.js.
 * ========================================================================== */
window.CW = window.CW || {};

CW.SceneManager = (function () {
  const THEME_DEFAULT = {
    street: "street", shop: "shop", teddy: "teddy", candle: "candle",
    balloon: "balloon", dragon: "dragon", party: "party_gate", secret: "fifth",
  };
  // Per-node scene overrides where the illustration differs from the theme default.
  const OVERRIDE = {
    S02_FOUR_GIFTS: "gifts", S04_CHOOSE_GIFT: "gifts", F01_FIFTH_AISLE: "fifth",
    S03_SHOPKEEPER_WARNING: "shopkeeper", // the shopkeeper reveal — he looms as he speaks the rule
    T02: "alley", T03: "street", C02: "street",
    B02: "sky", B03: "sky", B04: "sky",
    P02_BIRTHDAY_ROOM: "party_room",
  };

  const DEFS = `
    <radialGradient id="glowWarm" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(255,200,120,0.55)"/>
      <stop offset="60%" stop-color="rgba(255,170,90,0.14)"/>
      <stop offset="100%" stop-color="rgba(255,170,90,0)"/>
    </radialGradient>
    <radialGradient id="glowCool" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(200,220,255,0.5)"/>
      <stop offset="70%" stop-color="rgba(160,190,255,0.1)"/>
      <stop offset="100%" stop-color="rgba(160,190,255,0)"/>
    </radialGradient>
    <radialGradient id="glowViolet" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(190,150,255,0.5)"/>
      <stop offset="70%" stop-color="rgba(160,120,240,0.12)"/>
      <stop offset="100%" stop-color="rgba(160,120,240,0)"/>
    </radialGradient>`;

  // Scenes that have a real illustrated background (in assets/images/<key>.png).
  // Scenes not listed here fall back to the animated SVG art.
  const SCENE_IMAGES = {
    street: 1, shop: 1, gifts: 1, teddy: 1, alley: 1, candle: 1,
    balloon: 1, sky: 1, dragon: 1, party_gate: 1, party_room: 1, fifth: 1,
    shopkeeper: 1,
  };

  let sceneEl = null, artEl = null, imageEl = null, currentTheme = null, currentScene = null;

  function init(el) {
    sceneEl = el;
    artEl = document.getElementById("scene-art");
    imageEl = document.getElementById("scene-image");
  }

  function sceneKeyFor(node) {
    // A node may name its own scene; else fall back to per-node override, then theme.
    return node.scene || OVERRIDE[node.id] || THEME_DEFAULT[node.theme] || "shop";
  }

  function showScene(node) {
    setTheme(node.theme);
    renderArt(sceneKeyFor(node));
  }

  function setTheme(theme) {
    if (!sceneEl) return;
    const t = THEME_DEFAULT[theme] ? theme : "shop";
    if (t === currentTheme) return;
    currentTheme = t;
    sceneEl.className = "scene theme-" + t;
  }

  function renderArt(key) {
    if (key === currentScene) return;
    currentScene = key;
    // Prefer a real illustration when one exists; otherwise use the SVG art.
    if (SCENE_IMAGES[key] && imageEl) {
      imageEl.style.backgroundImage = 'url("assets/images/' + key + '.png")';
      imageEl.classList.add("shown");
      if (sceneEl) sceneEl.classList.add("has-image");
      if (artEl) artEl.innerHTML = "";
      return;
    }
    if (imageEl) { imageEl.classList.remove("shown"); }
    if (sceneEl) sceneEl.classList.remove("has-image");
    if (!artEl) return;
    const draw = CW.Scenes[key] || CW.Scenes.shop;
    artEl.innerHTML =
      '<svg class="scene-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
      "<defs>" + DEFS + "</defs>" + draw() + "</svg>";
  }

  function theme() { return currentTheme; }
  // Illustrated cover for the title screen — the Coraline-style hero image.
  function cover() {
    setTheme("street");
    currentScene = "__cover__"; // so the next real scene always re-renders
    if (imageEl) {
      imageEl.style.backgroundImage = 'url("assets/art/cover_hero.png")';
      imageEl.classList.add("shown");
      if (sceneEl) sceneEl.classList.add("has-image");
    }
    if (artEl) artEl.innerHTML = "";
  }

  return { init, showScene, setTheme, sceneKeyFor, theme, cover, THEME_DEFAULT };
})();
