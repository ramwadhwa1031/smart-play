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
      // mi explorer tabs
      var tab = e.target.closest(".mi-tab");
      if (tab) activate(tab);
    });
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
    box.querySelectorAll(".mi-tab").forEach(function (t) { var on = t === tab; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on); });
    box.querySelectorAll(".mi-panel").forEach(function (p) { p.classList.toggle("is-active", p.id === tab.getAttribute("aria-controls")); });
  }

  SS.nav = { init: init, close: closeNav };
})();

