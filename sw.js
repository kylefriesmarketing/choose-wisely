/* ============================================================================
 * sw.js  -  Choose Wisely service worker. Makes the game installable and fast
 * on repeat visits, and playable offline.
 *
 * Strategy (deliberately conservative so it can never "brick" the live site):
 *   - App shell (html / css / js / manifest)  = NETWORK-FIRST. A fresh copy
 *     always wins when online, so code updates land immediately; the cached
 *     copy is only a fallback when offline.
 *   - Heavy media (images / endings / art / voice) = CACHE-FIRST, versioned.
 *     These are effectively immutable, so serving them from cache makes repeat
 *     loads of the ~250MB illustrated world instant.
 *   - Range requests (streamed audio) bypass the worker entirely to avoid any
 *     partial-content weirdness.
 *
 * Bump CACHE_VERSION to invalidate everything.
 * ========================================================================== */
var CACHE_VERSION = "cw-v1";
var SHELL_CACHE = CACHE_VERSION + "-shell";
var MEDIA_CACHE = CACHE_VERSION + "-media";

// Core files worth precaching so the game can boot with no network.
var SHELL = [
  "./",
  "index.html",
  "manifest.json",
  "css/styles.css",
  "js/storyData.js", "js/gameState.js", "js/requirements.js", "js/applyChoice.js",
  "js/audio.js", "js/scenes.js", "js/characters.js", "js/shopkeeper.js", "js/traces.js",
  "js/tabHorror.js", "js/narrator.js", "js/dread.js", "js/sceneManager.js", "js/titleSequence.js",
  "js/uiController.js", "js/storyEngine.js", "js/share.js", "js/debug.js", "js/main.js",
  "assets/art/cover_hero.png", "assets/art/favicon.svg", "assets/art/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil((async function () {
    var c = await caches.open(SHELL_CACHE);
    // Best-effort: a single 404 must not fail the whole install.
    await Promise.allSettled(SHELL.map(function (u) { return c.add(u); }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys
      .filter(function (k) { return k.indexOf(CACHE_VERSION) !== 0; })
      .map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
  })());
});

function isMedia(url) {
  return /\.(png|jpe?g|webp|gif|svg|mp3|wav|ogg|mp4|webm|mov|woff2?)$/i.test(url.pathname) ||
         url.pathname.indexOf("/assets/") !== -1;
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  // Let the browser handle streamed range requests (audio) directly.
  if (req.headers.has("range")) return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return; // never touch cross-origin

  // Media: cache-first for instant repeat loads.
  if (isMedia(url)) {
    e.respondWith((async function () {
      var cached = await caches.match(req);
      if (cached) return cached;
      try {
        var res = await fetch(req);
        if (res && res.ok) { var c = await caches.open(MEDIA_CACHE); c.put(req, res.clone()); }
        return res;
      } catch (err) {
        return cached || Response.error();
      }
    })());
    return;
  }

  // App shell / navigations: network-first, fall back to cache when offline.
  e.respondWith((async function () {
    try {
      var res = await fetch(req);
      if (res && res.ok) { var c = await caches.open(SHELL_CACHE); c.put(req, res.clone()); }
      return res;
    } catch (err) {
      var cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === "navigate") {
        var idx = await caches.match("index.html");
        if (idx) return idx;
      }
      return Response.error();
    }
  })());
});
