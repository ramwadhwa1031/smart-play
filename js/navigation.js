/* Sticky header state, mobile drawer, dropdowns, active tabs. Event delegation: survives re-rendered markup. */
(function () {
  "use strict";
  window.SS = window.SS || {};
  var bound = false;

  function closeNav() {
    document.body.classList.remove("nav-open");
    var b = document.querySelector(".burger");
    if (b) { b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-label", "Open menu"); }
  }

  function init() {
    var hdr = document.getElementById("site-header");
    var onScroll = function () { var h = document.getElementById("site-header"); if (h) h.classList.toggle("is-stuck", window.scrollY > 8); };
    if (bound) { onScroll(); return; }
    bound = true;
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

    document.addEventListener("click", function (e) {
      var burger = e.target.closest(".burger");
      if (burger) {
        var open = document.body.classList.toggle("nav-open");
        burger.setAttribute("aria-expanded", open);
        burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
        return;
      }
      var tog = e.target.closest(".sub-toggle");
      if (tog) {
        var li = tog.closest(".has-sub"), o = li.classList.toggle("open");
        tog.setAttribute("aria-expanded", o);
        return;
      }
      if (document.body.classList.contains("nav-open")) {
        if (e.target.closest(".nav a")) closeNav();
        else if (!e.target.closest(".nav")) closeNav();
      }
      // mi explorer tabs & dots
      var tab = e.target.closest(".mi-tab");
      if (tab) { activate(tab); return; }
      var dot = e.target.closest(".mi-dot");
      if (dot) {
        var box = dot.closest("[data-mi]");
        var idx = parseInt(dot.getAttribute("data-mi-dot"), 10) || 0;
        var target = box && box.querySelectorAll(".mi-tab")[idx];
        if (target) activate(target);
      }
    });
    var miSx = 0;
    document.addEventListener("touchstart", function (e) {
      if (e.target.closest(".mi-panels") && e.changedTouches && e.changedTouches[0]) miSx = e.changedTouches[0].clientX;
    }, { passive: true });
    document.addEventListener("touchend", function (e) {
      var pnl = e.target.closest(".mi-panels");
      if (!pnl || !e.changedTouches || !e.changedTouches[0]) return;
      var dx = e.changedTouches[0].clientX - miSx;
      if (Math.abs(dx) > 45) {
        var box = pnl.closest("[data-mi]");
        var tabs = [].slice.call(box.querySelectorAll(".mi-tab"));
        var cur = tabs.findIndex(function (t) { return t.classList.contains("is-active"); });
        var next = tabs[((cur < 0 ? 0 : cur) + (dx < 0 ? 1 : tabs.length - 1)) % tabs.length];
        if (next) activate(next);
      }
    }, { passive: true });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
      var tab = e.target.closest && e.target.closest(".mi-tab");
      if (tab && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        var tabs = [].slice.call(tab.parentNode.querySelectorAll(".mi-tab")), i = tabs.indexOf(tab);
        var n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        n.focus(); activate(n); e.preventDefault();
      }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 1180) closeNav(); });
  }

  function activate(tab) {
    var box = tab.closest("[data-mi]"); if (!box) return;
    var tabs = [].slice.call(box.querySelectorAll(".mi-tab")), idx = tabs.indexOf(tab);
    tabs.forEach(function (t) { var on = t === tab; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on); });
    box.querySelectorAll(".mi-panel").forEach(function (p) { p.classList.toggle("is-active", p.id === tab.getAttribute("aria-controls")); });
    box.querySelectorAll(".mi-dot").forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
  }

  SS.nav = { init: init, close: closeNav };
})();

