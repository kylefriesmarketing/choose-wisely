/* ============================================================================
 * main.js  -  bootstrap. Loads meta-progress, wires the shell, opens the menu.
 * ========================================================================== */
(function () {
  function boot() {
    CW.GameState.loadMeta();
    CW.GameState.noteVisit();          // the shop counts the time you were gone
    CW.SceneManager.init(document.getElementById("scene"));
    CW.UIController.init();
    CW.Debug.init();
    if (CW.TabHorror) CW.TabHorror.init();
    if (CW.Narrator) CW.Narrator.init();

    const UI = CW.UIController;
    const Engine = CW.StoryEngine;

    // Main menu.
    document.getElementById("menu-new").addEventListener("click", () => {
      const start = () => { UI.hideMenu(); Engine.startNewRun(); };
      if (!CW.GameState.introSeen()) { CW.GameState.markIntroSeen(); UI.playIntro(start); }
      else start();
    });
    document.getElementById("menu-about").addEventListener("click", UI.showAbout);
    document.getElementById("menu-continue").addEventListener("click", (e) => {
      if (e.currentTarget.disabled) return;
      UI.hideMenu(); Engine.continueRun();
    });
    document.getElementById("menu-endings").addEventListener("click", UI.showTracker);
    document.getElementById("menu-settings").addEventListener("click", UI.showSettings);

    // Topbar.
    document.getElementById("btn-menu").addEventListener("click", () => { CW.GameState.saveRun(); UI.showMenu(); });
    document.getElementById("btn-endings").addEventListener("click", UI.showTracker);
    document.getElementById("btn-history").addEventListener("click", UI.showHistory);
    document.getElementById("btn-settings").addEventListener("click", UI.showSettings);
    const btnMute = document.getElementById("btn-mute");
    btnMute.addEventListener("click", () => {
      const now = !CW.Audio.isMuted();
      CW.Audio.setMuted(now);
      if (now && CW.Narrator) CW.Narrator.stop(); // muting silences the voice too
      btnMute.textContent = now ? "🔇" : "🔊";
    });

    // Overlay closes.
    document.getElementById("tracker-close").addEventListener("click", UI.hideTracker);
    document.getElementById("settings-close").addEventListener("click", UI.hideSettings);
    document.getElementById("history-close").addEventListener("click", UI.hideHistory);
    document.getElementById("about-close").addEventListener("click", UI.hideAbout);
    document.getElementById("detail-close").addEventListener("click", UI.hideEndingDetail);

    // Ending screen.
    document.getElementById("btn-replay").addEventListener("click", () => { UI.hideEnding(); Engine.startNewRun(); });
    document.getElementById("btn-ending-hint").addEventListener("click", UI.showHint);
    document.getElementById("btn-ending-tracker").addEventListener("click", UI.showTracker);
    document.getElementById("btn-ending-menu").addEventListener("click", () => { UI.hideEnding(); UI.showMenu(); });
    if (CW.Share) {
      document.getElementById("btn-ending-share").addEventListener("click", () => CW.Share.shareEnding());
      document.getElementById("btn-detail-share").addEventListener("click", () => {
        const d = document.getElementById("ending-detail");
        CW.Share.shareEnding(d && d.dataset ? d.dataset.ending : null);
      });
    }

    UI.showMenu();

    // Make the game installable + fast on repeat visits (safe network-first SW).
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
