/* Scroll reveals, counters, parallax. Vanilla JS + IntersectionObserver. */
(function () {
  "use strict";
  window.SS = window.SS || {};
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var io = null, parallaxBound = false;

  function show(el) { el.classList.add("in"); }

  function countUp(el) {
    var to = parseFloat(el.getAttribute("data-count-to")); if (isNaN(to)) return;
    if (reduce) { el.textContent = to; return; }
    var start = null, dur = 1200;
    function step(t) {
      if (!start) start = t;
      var k = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function observe(root) {
    root = root || document;
    var els = root.querySelectorAll(".reveal:not(.in), [data-count-to]:not([data-counted])");
    if (!("IntersectionObserver" in window) || reduce) {
      els.forEach(function (el) { show(el); if (el.hasAttribute("data-count-to")) el.setAttribute("data-counted", "1"); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target; io.unobserve(el);
          if (el.hasAttribute("data-count-to")) { el.setAttribute("data-counted", "1"); countUp(el); } else show(el);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    }
    els.forEach(function (el) {
      if (el.hasAttribute("data-count-to")) el.textContent = "0";
      io.observe(el);
    });
  }

  function parallax() {
    if (reduce || parallaxBound) return;
    var art = document.querySelector("[data-parallax]");
    if (art && window.matchMedia("(hover:hover)").matches) {
      parallaxBound = true;
      var raf = 0, mx = 0, my = 0;
      document.addEventListener("pointermove", function (e) {
        mx = e.clientX / window.innerWidth - .5; my = e.clientY / window.innerHeight - .5;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          document.querySelectorAll("[data-parallax] [data-depth]").forEach(function (n) {
            var d = parseFloat(n.getAttribute("data-depth")) * 900;
            n.style.translate = (mx * d).toFixed(1) + "px " + (my * d).toFixed(1) + "px";
          });
        });
      }, { passive: true });
    }
    var blobs = document.querySelectorAll(".hero__bg .blob"), ticking = false;
    if (blobs.length) {
      window.addEventListener("scroll", function () {
        if (ticking) return; ticking = true;
        requestAnimationFrame(function () {
          ticking = false; var y = window.scrollY;
          if (y > 900) return;
          blobs.forEach(function (b, i) { b.style.translate = "0 " + (y * (0.08 + i * 0.05)).toFixed(1) + "px"; });
        });
      }, { passive: true });
    }
  }

  SS.anim = { init: function (root) { observe(root); parallax(); } };
})();

