/* Entry point: wires interactions, the enquiry form, then refreshes content from JSON. */
(function () {
  "use strict";
  window.SS = window.SS || {};
  var formBound = false, reelTimer = null, reelPausedUntil = 0;
  var heroTimer = null, heroPausedUntil = 0, heroIdx = 0;

  function digits(s) { return String(s || "").replace(/\D/g, ""); }

  function setHeroSlide(nextIdx) {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) return;
    var slides = slider.querySelectorAll("[data-hero-slide]");
    var dots = slider.querySelectorAll("[data-hero-dot]");
    if (!slides.length) return;
    heroIdx = ((nextIdx % slides.length) + slides.length) % slides.length;
    slider.setAttribute("data-active-slide", String(heroIdx));
    slides.forEach(function (s, i) {
      var active = i === heroIdx;
      s.classList.toggle("is-active", active);
      s.setAttribute("aria-hidden", !active);
    });
    dots.forEach(function (d, i) {
      var active = i === heroIdx;
      d.classList.toggle("is-active", active);
      d.setAttribute("aria-selected", active);
    });
  }

  function startHeroAuto() {
    if (heroTimer) clearInterval(heroTimer);
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) return;
    heroIdx = 0;
    slider.setAttribute("data-active-slide", "0");
    heroTimer = setInterval(function () {
      if (Date.now() < heroPausedUntil || document.hidden) return;
      setHeroSlide(heroIdx + 1);
    }, 3800);
    slider.addEventListener("mouseenter", function () { heroPausedUntil = Date.now() + 6000; });
    var hsx = 0;
    slider.addEventListener("touchstart", function (e) {
      heroPausedUntil = Date.now() + 7000;
      if (e.changedTouches && e.changedTouches[0]) hsx = e.changedTouches[0].clientX;
    }, { passive: true });
    slider.addEventListener("touchend", function (e) {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      var dx = e.changedTouches[0].clientX - hsx;
      if (Math.abs(dx) > 40) {
        setHeroSlide(heroIdx + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });
  }

  function stepProg(dir) {
    var track = document.querySelector("[data-prog-track]");
    if (!track) return;
    var cards = track.querySelectorAll(".prog-card");
    if (cards.length < 2) return;
    var step = cards[1].offsetLeft - cards[0].offsetLeft;
    if (step <= 0) step = cards[0].getBoundingClientRect().width + 20;
    var maxScroll = track.scrollWidth - track.clientWidth;
    if (dir > 0 && track.scrollLeft >= maxScroll - 12) {
      track.scrollTo({ left: 0, behavior: "smooth" });
    } else if (dir < 0 && track.scrollLeft <= 12) {
      track.scrollTo({ left: maxScroll, behavior: "smooth" });
    } else {
      track.scrollBy({ left: step * dir, behavior: "smooth" });
    }
  }

  function scrollToProgDot(idx) {
    var track = document.querySelector("[data-prog-track]");
    if (!track) return;
    var cards = track.querySelectorAll(".prog-card");
    if (!cards[idx]) return;
    var left = cards[idx].offsetLeft - cards[0].offsetLeft;
    track.scrollTo({ left: left, behavior: "smooth" });
  }

  function bindProgCarousel() {
    var track = document.querySelector("[data-prog-track]");
    if (!track) return;
    track.addEventListener("scroll", function () {
      var cards = track.querySelectorAll(".prog-card");
      var dots = document.querySelectorAll("[data-prog-dot]");
      if (!cards.length || !dots.length) return;
      var step = cards.length > 1 ? (cards[1].offsetLeft - cards[0].offsetLeft) : cards[0].offsetWidth;
      if (step <= 0) step = cards[0].offsetWidth || 1;
      var activeIdx = Math.min(cards.length - 1, Math.max(0, Math.round(track.scrollLeft / step)));
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === activeIdx); });
    }, { passive: true });
  }

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
      var hb = e.target.closest("[data-hero-dir]");
      if (hb) {
        var hdir = parseInt(hb.getAttribute("data-hero-dir"), 10) || 1;
        heroPausedUntil = Date.now() + 7000;
        setHeroSlide(heroIdx + hdir);
        return;
      }
      var hd = e.target.closest("[data-hero-dot]");
      if (hd) {
        var dIdx = parseInt(hd.getAttribute("data-hero-dot"), 10) || 0;
        heroPausedUntil = Date.now() + 7000;
        setHeroSlide(dIdx);
        return;
      }
      var pb = e.target.closest("[data-prog-dir]");
      if (pb) {
        var pdir = parseInt(pb.getAttribute("data-prog-dir"), 10) || 1;
        stepProg(pdir);
        return;
      }
      var pd = e.target.closest("[data-prog-dot]");
      if (pd) {
        var pIdx = parseInt(pd.getAttribute("data-prog-dot"), 10) || 0;
        scrollToProgDot(pIdx);
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

  function cleanUrlBar() {
    if (!/^https?:$/.test(location.protocol) || !window.history || !history.replaceState) return;
    var p = location.pathname;
    if (/\/index\.html$/i.test(p)) {
      history.replaceState(null, "", p.replace(/index\.html$/i, "") + location.search + location.hash);
    } else if (/\.html$/i.test(p)) {
      var clean = p.replace(/\.html$/i, "");
      if (!/^(localhost|127\.0\.0\.1)$/i.test(location.hostname)) {
        history.replaceState(null, "", clean + location.search + location.hash);
      } else {
        fetch(clean, { method: "HEAD" }).then(function (r) {
          if (r.ok) history.replaceState(null, "", clean + location.search + location.hash);
        }).catch(function () {});
      }
    }
  }

  function init() {
    cleanUrlBar();
    SS.nav.init(); SS.gallery.init(); SS.anim.init(); bindForm(); prefill(); startReelsAuto(); startHeroAuto(); bindProgCarousel();
    var y = document.querySelector("[data-year]"); if (y) y.textContent = new Date().getFullYear();
  }
  SS.init = init;

  function start() {
    init();
    SS.loader.run().then(function (changed) { if (changed) { init(); window.scrollTo(window.scrollX, window.scrollY); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

