/* ============================================================================
 * share.js  -  CW.Share. The viral loop. When a player reaches an ending they
 * can share it: on mobile (Web Share API) it shares a BRANDED image card of the
 * ending — the Coraline ending art with the title + wordmark composited on — so
 * the whole aesthetic travels with the link. On desktop it saves that card and
 * copies a spoiler-light caption to the clipboard.
 *
 * The card is composited on a <canvas> from the ending's own same-origin PNG
 * (same-origin => canvas stays untainted => toBlob works). To keep the share
 * gesture inside the click's user-activation window, the card is pre-built when
 * the ending screen opens (CW.Share.prepare) and reused on the click.
 * ========================================================================== */
window.CW = window.CW || {};

CW.Share = (function () {
  var LIVE_URL = "https://kylefriesmarketing.github.io/choose-wisely/";
  var prepared = null; // { id, ctx, blob, file }

  function rt(s) {
    return (CW.UIController && CW.UIController.replaceTokens) ? CW.UIController.replaceTokens(s) : s;
  }
  function toast(m) { if (CW.UIController && CW.UIController.toast) CW.UIController.toast(m); }

  function endingContext(id) {
    if (!id) {
      var host = document.getElementById("ending-screen");
      id = host && host.dataset ? host.dataset.ending : null;
    }
    if (!id || !CW.Endings || !CW.Endings[id]) return null;
    var e = CW.Endings[id];
    return {
      id: id, title: rt(e.title), number: e.number, category: e.category || "Ending",
      img: "assets/endings/" + id + ".png",
    };
  }

  function shareText(ctx) {
    var total = (CW.GameState && CW.GameState.totalEndings)
      ? CW.GameState.totalEndings() : Object.keys(CW.Endings).length;
    return "I reached “" + ctx.title + "” — ending #" + ctx.number + " of " + total +
      " in Choose Wisely. One shop, four gifts, " + total + " endings. Which will you find?";
  }

  /* ---- canvas share card (1200x630, social-preview ratio) --------------- */
  function drawCover(g, im, x, y, w, h) {
    var ir = im.width / im.height, r = w / h, dw, dh, dx, dy;
    if (ir > r) { dh = h; dw = h * ir; dx = x - (dw - w) / 2; dy = y; }
    else { dw = w; dh = w / ir; dx = x; dy = y - (dh - h) / 2; }
    g.drawImage(im, dx, dy, dw, dh);
  }
  function wrapText(g, text, x, y, maxW, lh, font, maxLines) {
    g.font = font;
    var words = String(text).split(" "), line = "", yy = y, lines = 0;
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + " " + words[i] : words[i];
      if (g.measureText(test).width > maxW && line) {
        g.fillText(line, x, yy); line = words[i]; yy += lh; lines++;
        if (maxLines && lines >= maxLines - 1) { // squeeze the rest onto the last line
          var rest = words.slice(i).join(" ");
          while (g.measureText(rest + "…").width > maxW && rest.length) rest = rest.slice(0, -1);
          g.fillText(rest + (i < words.length ? "" : ""), x, yy); return yy;
        }
      } else { line = test; }
    }
    if (line) g.fillText(line, x, yy);
    return yy;
  }

  function buildCard(ctx) {
    return new Promise(function (resolve) {
      var W = 1200, H = 630;
      var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      var g = cv.getContext("2d");
      g.fillStyle = "#0c0910"; g.fillRect(0, 0, W, H);

      function paintText() {
        // bottom scrim + left scrim for legibility over any art
        var bg = g.createLinearGradient(0, H * 0.32, 0, H);
        bg.addColorStop(0, "rgba(8,6,12,0)");
        bg.addColorStop(0.62, "rgba(8,6,12,0.55)");
        bg.addColorStop(1, "rgba(6,4,9,0.97)");
        g.fillStyle = bg; g.fillRect(0, 0, W, H);
        var lg = g.createLinearGradient(0, 0, W * 0.55, 0);
        lg.addColorStop(0, "rgba(6,4,9,0.82)"); lg.addColorStop(1, "rgba(6,4,9,0)");
        g.fillStyle = lg; g.fillRect(0, 0, W, H);

        var pad = 66;
        g.textBaseline = "alphabetic";
        // gold rule
        g.strokeStyle = "rgba(255,179,71,0.65)"; g.lineWidth = 2;
        g.beginPath(); g.moveTo(pad, 118); g.lineTo(pad + 56, 118); g.stroke();
        // kicker
        g.fillStyle = "#ffb347";
        g.font = "600 22px 'Segoe UI', system-ui, sans-serif";
        g.fillText("ENDING #" + ctx.number + "   ·   " + String(ctx.category).toUpperCase(), pad, 110);
        // title
        g.fillStyle = "#ffcf7a";
        g.shadowColor = "rgba(0,0,0,0.6)"; g.shadowBlur = 12; g.shadowOffsetY = 2;
        wrapText(g, ctx.title, pad, 196, W - pad * 2 - 30, 74, "700 66px Georgia, 'Times New Roman', serif", 3);
        g.shadowBlur = 0; g.shadowOffsetY = 0;
        // wordmark + url
        g.fillStyle = "#f4ecd8"; g.font = "700 32px Georgia, serif";
        g.fillText("CHOOSE WISELY", pad, H - 92);
        g.fillStyle = "#c9bfa6"; g.font = "500 20px 'Segoe UI', system-ui, sans-serif";
        g.fillText("A branching horror storybook   ·   kylefriesmarketing.github.io/choose-wisely", pad, H - 58);

        cv.toBlob(function (b) { resolve(b); }, "image/png");
      }

      if (ctx.img) {
        var im = new Image();
        im.onload = function () { try { drawCover(g, im, 0, 0, W, H); } catch (e) {} paintText(); };
        im.onerror = function () { paintText(); };
        im.src = ctx.img;
      } else { paintText(); }
    });
  }

  // Pre-build the card for the ending currently on screen (or a given id).
  function prepare(id) {
    var ctx = endingContext(id);
    if (!ctx) { prepared = null; return; }
    buildCard(ctx).then(function (blob) {
      var file = null;
      try { if (blob) file = new File([blob], "choose-wisely-ending.png", { type: "image/png" }); } catch (e) {}
      prepared = { id: ctx.id, ctx: ctx, blob: blob, file: file };
    }).catch(function () { prepared = { id: ctx.id, ctx: ctx, blob: null, file: null }; });
  }

  function download(blob, name) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  async function shareEnding(id) {
    var ctx = endingContext(id);
    if (!ctx) { toast("No ending to share yet."); return; }
    var text = shareText(ctx), url = LIVE_URL;

    // Use the pre-built card if it matches; otherwise build now (may lose the
    // activation window for file-share, in which case we fall back to saving).
    var pack = (prepared && prepared.id === ctx.id) ? prepared : null;
    if (!pack) {
      var blob = null; try { blob = await buildCard(ctx); } catch (e) {}
      var f = null; try { if (blob) f = new File([blob], "choose-wisely-ending.png", { type: "image/png" }); } catch (e) {}
      pack = { id: ctx.id, ctx: ctx, blob: blob, file: f };
    }

    // 1) Native share WITH the branded image (best case: mobile).
    if (pack.file && navigator.canShare && navigator.canShare({ files: [pack.file] }) && navigator.share) {
      try { await navigator.share({ files: [pack.file], text: text, url: url }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    // 2) Native share of text + link (no file support).
    if (navigator.share) {
      try { await navigator.share({ title: "Choose Wisely", text: text, url: url }); return; }
      catch (e) { if (e && e.name === "AbortError") return; }
    }
    // 3) Desktop fallback: save the card + copy the caption.
    if (pack.blob) download(pack.blob, "choose-wisely-" + ctx.id + ".png");
    try {
      await navigator.clipboard.writeText(text + " " + url);
      toast(pack.blob ? "Card saved · caption copied — share it anywhere." : "Caption copied — share it anywhere.");
    } catch (e) {
      toast(pack.blob ? "Ending card saved — share it anywhere." : "Share: " + url);
    }
  }

  return { prepare: prepare, shareEnding: shareEnding, buildCard: buildCard, endingContext: endingContext };
})();
