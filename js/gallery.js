/* Gallery: category filtering (gallery + updates pages) and the lightbox with keyboard / swipe navigation. */
(function () {
  "use strict";
  window.SS = window.SS || {};
  var items = [], idx = 0, lastFocus = null, bound = false;

  function box() { return document.querySelector(".lightbox"); }

  function show(i) {
    var lb = box(); if (!lb || !items.length) return;
    idx = (i + items.length) % items.length;
    var it = items[idx], img = lb.querySelector("img");
    img.src = it.src; img.alt = it.alt || it.caption || "";
    lb.querySelector("figcaption").textContent = it.caption || "";
    lb.classList.toggle("single", items.length < 2);
    // preload neighbours
    [1, -1].forEach(function (d) { var n = items[(idx + d + items.length) % items.length]; if (n) { var im = new Image(); im.src = n.src; } });
  }
  function open(list, i, trigger) {
    var lb = box(); if (!lb) return;
    items = list; lastFocus = trigger || document.activeElement;
    lb.hidden = false; document.documentElement.style.overflow = "hidden";
    show(i); lb.querySelector(".lb-close").focus();
  }
  function close() {
    var lb = box(); if (!lb || lb.hidden) return;
    lb.hidden = true; document.documentElement.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function filter(btn, instant) {
    var wrap = btn.closest(".filters"), key = btn.getAttribute("data-filter");
    wrap.querySelectorAll(".chip").forEach(function (c) { var on = c === btn; c.classList.toggle("is-active", on); c.setAttribute("aria-pressed", on); });
    var targets = document.querySelectorAll(".mas, .upd-list .upd"), n = 0;
    targets.forEach(function (el) {
      var cat = el.getAttribute("data-cat"), ok = key === "all" || cat === key;
      if (ok) {
        n++; el.classList.remove("is-hidden"); el.style.display = "";
        if (!instant) { el.classList.add("pop"); setTimeout(function () { el.classList.remove("pop"); }, 500); }
      } else {
        el.classList.add("is-hidden"); el.style.display = "none";
      }
    });
    var c = document.querySelector("[data-count]"); if (c) c.textContent = n;
  }

  function applyInitialFilter() {
    try {
      var cat = new URLSearchParams(location.search).get("cat");
      if (!cat) return;
      var chip = document.querySelector('.filters .chip[data-filter="' + cat.replace(/[^a-z0-9_-]/gi, "") + '"]');
      if (chip) filter(chip, true);
    } catch (e) { /* ignore */ }
  }

  function init() {
    applyInitialFilter();
    if (bound) return; bound = true;
    document.addEventListener("click", function (e) {
      var chip = e.target.closest(".filters .chip"); if (chip) { filter(chip); return; }
      var a = e.target.closest("[data-lightbox-group] a");
      if (a) {
        e.preventDefault();
        var grp = a.closest("[data-lightbox-group]"), all = [].slice.call(grp.querySelectorAll("a")).filter(function (x) { return x.style.display !== "none" && !x.classList.contains("is-hidden"); });
        var list = all.map(function (x) { var im = x.querySelector("img"); return { src: x.getAttribute("href"), caption: x.getAttribute("data-caption"), alt: im ? im.alt : "" }; });
        open(list, Math.max(0, all.indexOf(a)), a); return;
      }
      var ub = e.target.closest(".upd__img");
      if (ub) {
        var card = ub.closest(".upd"), g = []; try { g = JSON.parse(card.getAttribute("data-gallery")); } catch (x) { /* ignore */ }
        var t = card.getAttribute("data-title");
        open(g.map(function (s, i) { return { src: s, caption: t + (g.length > 1 ? " (" + (i + 1) + "/" + g.length + ")" : ""), alt: t }; }), 0, ub); return;
      }
      var lb = box();
      if (lb && !lb.hidden) {
        if (e.target.closest(".lb-close") || e.target === lb) close();
        else if (e.target.closest(".lb-prev")) show(idx - 1);
        else if (e.target.closest(".lb-next")) show(idx + 1);
      }
    });
    document.addEventListener("keydown", function (e) {
      var lb = box(); if (!lb || lb.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
      else if (e.key === "Tab") { // simple focus trap
        var f = [].slice.call(lb.querySelectorAll("button")).filter(function (b) { return b.offsetParent !== null; });
        if (!f.length) return; var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    });
    var sx = 0;
    document.addEventListener("touchstart", function (e) { if (box() && !box().hidden) sx = e.changedTouches[0].clientX; }, { passive: true });
    document.addEventListener("touchend", function (e) {
      if (!box() || box().hidden) return; var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  SS.gallery = { init: init, open: open, close: close };
})();

