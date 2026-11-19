/* Entry point: wires interactions, the enquiry form, then refreshes content from JSON. */
(function () {
  "use strict";
  window.SS = window.SS || {};
  var formBound = false, reelTimer = null, reelPausedUntil = 0;

  function digits(s) { return String(s || "").replace(/\D/g, ""); }

  function stepReels(dir) {
    var track = document.querySelector("[data-reels-track]");
    if (!track) return;
    var cards = track.querySelectorAll(".reel-card");
    if (cards.length < 2) return;
    var count = parseInt(track.getAttribute("data-reels-count"), 10) || Math.floor(cards.length / 2);
    var step = cards[1].offsetLeft - cards[0].offsetLeft;
    if (step <= 0) step = cards[0].getBoundingClientRect().width + 20;
    var halfSpan = cards[count] ? (cards[count].offsetLeft - cards[0].offsetLeft) : (track.scrollWidth / 2);

    if (dir > 0 && halfSpan > 0 && track.scrollLeft >= halfSpan - 10) {
      track.style.scrollBehavior = "auto";
      track.scrollLeft -= halfSpan;
      void track.offsetWidth;
      track.style.scrollBehavior = "";
    } else if (dir < 0 && halfSpan > 0 && track.scrollLeft <= 10) {
      track.style.scrollBehavior = "auto";
      track.scrollLeft += halfSpan;
      void track.offsetWidth;
      track.style.scrollBehavior = "";
    }
    track.scrollBy({ left: step * dir, behavior: "smooth" });
  }

  function startReelsAuto() {
    if (reelTimer) clearInterval(reelTimer);
    var track = document.querySelector("[data-reels-track]");
    if (!track) return;
    reelTimer = setInterval(function () {
      if (Date.now() < reelPausedUntil || document.hidden) return;
      stepReels(1);
    }, 2800);
    track.addEventListener("touchstart", function () { reelPausedUntil = Date.now() + 5000; }, { passive: true });
  }

  function bindForm() {
    if (formBound) return; formBound = true;
    document.addEventListener("click", function (e) {
      var rc = e.target.closest("[data-reel-embed]");
      if (rc) {
        var modal = document.getElementById("reel-modal");
        var frame = document.getElementById("reel-modal-frame");
        var ext = document.getElementById("reel-modal-ext");
        if (modal && frame) {
          e.preventDefault();
          frame.src = rc.getAttribute("data-reel-embed");
          if (ext) ext.href = rc.getAttribute("href") || "https://www.instagram.com/smart_start_the_premium_school/reels/";
          modal.hidden = false;
          document.documentElement.style.overflow = "hidden";
          return;
        }
      }
      var rclose = e.target.closest("[data-reel-close]");
      var rmodal = document.getElementById("reel-modal");
      if (rmodal && !rmodal.hidden && (rclose || e.target === rmodal)) {
        rmodal.hidden = true;
        var rf = document.getElementById("reel-modal-frame");
        if (rf) rf.src = "data:text/html,";
        document.documentElement.style.overflow = "";
        return;
      }
      var rb = e.target.closest("[data-reel-dir]");
      if (rb) {
        var dir = parseInt(rb.getAttribute("data-reel-dir"), 10) || 1;
        reelPausedUntil = Date.now() + 4500;
        stepReels(dir);
        return;
      }
      var b = e.target.closest("[data-send]"); if (!b) return;
      var f = b.closest("form"), v = function (n) { return (f.elements[n].value || "").trim(); };
      var err = f.querySelector(".form-err");
      if (!v("name") || digits(v("phone")).length < 8) { err.hidden = false; (v("name") ? f.elements.phone : f.elements.name).focus(); return; }
      err.hidden = true;
      var lines = ["Hello " + f.dataset.school + ",", "I would like to enquire about admissions.", "Parent name: " + v("name"), "Phone: " + v("phone")];
      if (v("programme")) lines.push("Programme / age: " + v("programme"));
      if (v("message")) lines.push("Message: " + v("message"));
      var text = lines.join("\n");
      if (b.getAttribute("data-send") === "wa") window.open("https://wa.me/" + f.dataset.wa + "?text=" + encodeURIComponent(text), "_blank", "noopener");
      else location.href = "mailto:" + f.dataset.email + "?subject=" + encodeURIComponent("Admission enquiry – " + v("name")) + "&body=" + encodeURIComponent(text);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        var rmodal = document.getElementById("reel-modal");
        if (rmodal && !rmodal.hidden) {
          rmodal.hidden = true;
          var rf = document.getElementById("reel-modal-frame");
          if (rf) rf.src = "data:text/html,";
          document.documentElement.style.overflow = "";
        }
      }
    });
  }

  function prefill() {
    var f = document.getElementById("enq-form"); if (!f) return;
    var p = new URLSearchParams(location.search).get("programme");
    if (p && f.elements.programme) { [].forEach.call(f.elements.programme.options, function (o) { if (o.value === p) f.elements.programme.value = p; }); }
  }

  function init() {
    SS.nav.init(); SS.gallery.init(); SS.anim.init(); bindForm(); prefill(); startReelsAuto();
    var y = document.querySelector("[data-year]"); if (y) y.textContent = new Date().getFullYear();
  }
  SS.init = init;

  function start() {
    init();
    SS.loader.run().then(function (changed) { if (changed) { init(); window.scrollTo(window.scrollX, window.scrollY); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

