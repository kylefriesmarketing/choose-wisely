/* ============================================================================
 * otherYou.js  -  "The Other You." The whole game is about the shop keeping
 * copies of you. So it watches, in real time, for the most literal copy of all:
 * a SECOND open tab or window of the game, in the same browser. When it finds
 * one, the two shops notice each other across the browser and the shopkeeper is
 * delighted — you brought yourself.
 *
 * Presence is gossiped over a BroadcastChannel (same-origin, cross-tab). Each
 * instance has a random id, announces itself, heartbeats, and prunes peers that
 * go quiet. The first time another instance is seen, it fires a reaction:
 *   - "newcomer": THIS tab just opened and found an older you already here.
 *   - "arrival":  this tab was already here, and another you just walked in.
 * If BroadcastChannel is unavailable, the whole thing silently does nothing.
 * ========================================================================== */
window.CW = window.CW || {};

CW.OtherYou = (function () {
  var CH = "choose_wisely_the_other_you";
  var myId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  var chan = null;
  var peers = {};            // peerId -> lastSeen ms
  var booted = 0;
  var onDetect = null;       // callback(kind, count)
  var reactedNewcomer = false;
  var HEARTBEAT = 2500, STALE = 7000, DISCOVERY = 1700;

  function now() { return Date.now(); }
  function prune() { var t = now(); for (var id in peers) { if (t - peers[id] > STALE) delete peers[id]; } }
  function peerCount() { prune(); return Object.keys(peers).length; }
  function send(type) { if (chan) { try { chan.postMessage({ type: type, id: myId, t: now() }); } catch (e) {} } }

  function fire(kind) {
    prune();
    if (typeof onDetect === "function") onDetect(kind, Object.keys(peers).length + 1);
  }

  function onMsg(ev) {
    var d = ev.data;
    if (!d || d.id === myId) return;
    if (d.type === "leave") { delete peers[d.id]; return; }
    if (d.type !== "ping" && d.type !== "pong" && d.type !== "join") return;
    var wasKnown = !!peers[d.id];
    peers[d.id] = now();
    // Let a newcomer (or anyone) know we're here.
    if (d.type === "join" || d.type === "ping") send("pong");
    if (!wasKnown && now() - booted > DISCOVERY) fire("arrival"); // we were here; another you arrived
  }

  function init(cb) {
    onDetect = cb;
    booted = now();
    if (typeof BroadcastChannel === "undefined") return; // unsupported -> silently off
    try { chan = new BroadcastChannel(CH); } catch (e) { chan = null; return; }
    chan.addEventListener("message", onMsg);
    send("join");
    setInterval(function () { send("ping"); prune(); }, HEARTBEAT);
    // After a short discovery window: if anyone already answered, THIS tab is the
    // newcomer that walked in on an existing you.
    setTimeout(function () {
      prune();
      if (!reactedNewcomer && Object.keys(peers).length > 0) { reactedNewcomer = true; fire("newcomer"); }
    }, DISCOVERY);
    window.addEventListener("pagehide", function () { send("leave"); });
    window.addEventListener("beforeunload", function () { send("leave"); });
  }

  // Test hook: inject a fake peer message (used to verify without a real 2nd tab).
  function _simulatePeer(type) { onMsg({ data: { type: type || "join", id: "test-peer-" + Math.random(), t: now() } }); }

  return { init: init, peerCount: peerCount, _simulatePeer: _simulatePeer, _id: function () { return myId; } };
})();
