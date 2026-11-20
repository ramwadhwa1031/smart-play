/* Entry point: wires interactions, the enquiry form, then refreshes content from JSON. */
(function () {
  "use strict";
  window.SS = window.SS || {};
  var formBound = false, reelTimer = null, reelPausedUntil = 0;
  var heroTimer = null, heroPausedUntil = 0, heroIdx = 0;
  var grevTimer = null, grevPausedUntil = 0;
  var fameTimer = null, famePausedUntil = 0;

  function digits(s) { return String(s || "").replace(/\D/g, ""); }

  function hydrateSlideImg(imgEl) {
    if (!imgEl || !imgEl.getAttribute("data-src")) return;
    var ds = imgEl.getAttribute("data-src");
    var dss = imgEl.getAttribute("data-srcset");
    if (dss) { imgEl.setAttribute("srcset", dss); imgEl.removeAttribute("data-srcset"); }
    imgEl.setAttribute("src", ds);
    imgEl.removeAttribute("data-src");
  }

  function hydrateHeroSlides() {
    var imgs = document.querySelectorAll("[data-hero-slide] img[data-src]");
    if (!imgs.length) return;
    var loadAll = function () { imgs.forEach(hydrateSlideImg); };
    if (document.readyState === "complete") setTimeout(loadAll, 400);
    else window.addEventListener("load", function () { setTimeout(loadAll, 400); }, { once: true });
  }

  function setHeroSlide(nextIdx) {
    var slider = document.querySelector("[data-hero-slider]");
    if (!slider) return;
    var slides = slider.querySelectorAll("[data-hero-slide]");
    var dots = slider.querySelectorAll("[data-hero-dot]");
    if (!slides.length) return;
    heroIdx = ((nextIdx % slides.length) + slides.length) % slides.length;
    hydrateSlideImg(slides[heroIdx].querySelector("img[data-src]"));
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
    var maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 12) return;
    var step = cards[1].offsetLeft - cards[0].offsetLeft;
    if (step <= 0) step = cards[0].getBoundingClientRect().width + 16;
    if (dir > 0 && track.scrollLeft >= maxScroll - 14) {
      track.scrollTo({ left: 0, behavior: "smooth" });
    } else if (dir < 0 && track.scrollLeft <= 14) {
      track.scrollTo({ left: maxScroll, behavior: "smooth" });
    } else {
      track.scrollBy({ left: step * dir, behavior: "smooth" });
    }
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
      var vclose = e.target.closest("[data-visit-close]");
      var vmodal = document.getElementById("visit-modal");
      if (vmodal && !vmodal.hidden && (vclose || e.target === vmodal)) {
        closeVisitPopup();
        return;
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
      var gb = e.target.closest("[data-grev-dir]");
      if (gb) {
        var gdir = parseInt(gb.getAttribute("data-grev-dir"), 10) || 1;
        grevPausedUntil = Date.now() + 6500;
        stepGrev(gdir);
        return;
      }
      var gd = e.target.closest("[data-grev-dot]");
      if (gd) {
        var gIdx = parseInt(gd.getAttribute("data-grev-dot"), 10) || 0;
        grevPausedUntil = Date.now() + 6500;
        scrollToGrevDot(gIdx);
        return;
      }
      var fb = e.target.closest("[data-fame-dir]");
      if (fb) {
        var fdir = parseInt(fb.getAttribute("data-fame-dir"), 10) || 1;
        famePausedUntil = Date.now() + 7000;
        stepFame(fdir);
        return;
      }
      var fd = e.target.closest("[data-fame-dot]");
      if (fd) {
        var fIdx = parseInt(fd.getAttribute("data-fame-dot"), 10) || 0;
        famePausedUntil = Date.now() + 7000;
        scrollToFameDot(fIdx);
        return;
      }
      var pick = e.target.closest("[data-pick-prog]");
      if (pick) {
        var fPick = document.getElementById("enq-form");
        var progVal = pick.getAttribute("data-pick-prog");
        if (fPick && fPick.elements.programme && progVal) {
          [].forEach.call(fPick.elements.programme.options, function (o) {
            if (o.value === progVal) fPick.elements.programme.value = progVal;
          });
        }
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
      if (f.id === "enq-popup-form") closeVisitPopup();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeVisitPopup();
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

  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function stepGrev(dir) {
    var track = document.querySelector("[data-google-reviews]");
    if (!track) return;
    var cards = track.querySelectorAll(".grev-card, .grev-hl-card");
    if (cards.length < 2) return;
    var step = cards[1].offsetLeft - cards[0].offsetLeft;
    if (step <= 0) step = cards[0].getBoundingClientRect().width + 20;
    var maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 8) return;
    if (dir > 0 && track.scrollLeft >= maxScroll - 14) {
      track.scrollTo({ left: 0, behavior: "smooth" });
    } else if (dir < 0 && track.scrollLeft <= 14) {
      track.scrollTo({ left: maxScroll, behavior: "smooth" });
    } else {
      track.scrollBy({ left: step * dir, behavior: "smooth" });
    }
  }

  function scrollToGrevDot(idx) {
    var track = document.querySelector("[data-google-reviews]");
    if (!track) return;
    var cards = track.querySelectorAll(".grev-card, .grev-hl-card");
    if (!cards[idx]) return;
    var left = cards[idx].offsetLeft - cards[0].offsetLeft;
    track.scrollTo({ left: left, behavior: "smooth" });
  }

  function bindGrevCarousel() {
    if (grevTimer) clearInterval(grevTimer);
    var track = document.querySelector("[data-google-reviews]");
    if (!track) return;
    track.addEventListener("scroll", function () {
      var cards = track.querySelectorAll(".grev-card, .grev-hl-card");
      var dots = document.querySelectorAll("[data-grev-dot]");
      if (!cards.length || !dots.length) return;
      var step = cards.length > 1 ? (cards[1].offsetLeft - cards[0].offsetLeft) : cards[0].offsetWidth;
      if (step <= 0) step = cards[0].offsetWidth || 1;
      var activeIdx = Math.min(cards.length - 1, Math.max(0, Math.round(track.scrollLeft / step)));
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === activeIdx); });
    }, { passive: true });
    track.addEventListener("mouseenter", function () { grevPausedUntil = Date.now() + 7000; });
    track.addEventListener("touchstart", function () { grevPausedUntil = Date.now() + 7000; }, { passive: true });
    grevTimer = setInterval(function () {
      if (Date.now() < grevPausedUntil || document.hidden) return;
      stepGrev(1);
    }, 4400);
  }

  function loadLiveGoogleReviews() {
    var box = document.querySelector("[data-google-reviews]");
    if (!box) return;
    var featId = (box.getAttribute("data-featurable-id") || "").trim();
    var feedUrl = (box.getAttribute("data-google-feed") || "").trim();
    if (!feedUrl && featId) feedUrl = "https://featurable.com/api/v1/widgets/" + encodeURIComponent(featId);
    if (!feedUrl) return;
    fetch(feedUrl, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (data) {
      var list = Array.isArray(data) ? data : (data.reviews || data.items || (data.result && data.result.reviews) || []);
      var cleaned = list.map(function (r) {
        var name = (r.reviewer && r.reviewer.displayName) || r.author_name || r.authorName || r.name || "";
        var text = r.comment || r.text || (r.text && r.text.text) || r.review || "";
        if (typeof text === "object" && text && text.text) text = text.text;
        var rating = Number(r.starRating || r.rating || 5) || 5;
        if (typeof r.starRating === "string") {
          var map = { FIVE: 5, FOUR: 4, THREE: 3, TWO: 2, ONE: 1 };
          rating = map[r.starRating.toUpperCase()] || 5;
        }
        var rel = r.relative_time_description || r.relativePublishTimeDescription || r.relation || "Google Review";
        var avatar = (r.reviewer && r.reviewer.profilePhotoUrl) || r.profile_photo_url || r.avatar || "";
        return { name: String(name).trim(), text: String(text).trim(), rating: rating, relation: String(rel).trim(), avatar: String(avatar).trim() };
      }).filter(function (x) { return x.name && x.text; }).slice(0, 12);
      if (!cleaned.length) return;
      var ratingEl = document.querySelector("[data-google-rating]");
      var countEl = document.querySelector("[data-google-count]");
      var avg = Number(data.averageRating || data.rating || (data.result && data.result.rating));
      var total = Number(data.totalReviewCount || data.user_ratings_total || data.reviewCount || (data.result && data.result.user_ratings_total));
      if (ratingEl && avg) ratingEl.textContent = avg.toFixed(1);
      if (countEl && total) countEl.textContent = total + " Google Reviews";
      var gSvg = '<svg class="grev-g" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>';
      var starSvg = '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 1.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.8 4.8 17.5l1-5.8-4.2-4.1 5.8-.8z"/></svg>';
      box.innerHTML = cleaned.map(function (x, i) {
        var init = x.name.split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase();
        var st = "";
        for (var k = 0; k < 5; k++) st += '<span class="grev-star' + (k < Math.round(x.rating) ? " is-on" : "") + '">' + starSvg + "</span>";
        return '<article class="grev-card" style="--i:' + (i % 4) + '"><div class="grev-card__top">' +
          (x.avatar ? '<img class="grev-avatar" src="' + escHtml(x.avatar) + '" alt="" loading="lazy" width="44" height="44">' : '<span class="grev-avatar grev-avatar--init" aria-hidden="true">' + escHtml(init) + "</span>") +
          '<div class="grev-meta"><b>' + escHtml(x.name) + "</b><span>" + escHtml(x.relation) + "</span></div>" + gSvg +
          '</div><span class="grev-stars" aria-label="' + Math.round(x.rating) + ' out of 5 stars">' + st + '</span><p class="grev-text">"' + escHtml(x.text) + '"</p></article>';
      }).join("");
      var dotsWrap = document.querySelector("[data-grev-dots]");
      if (dotsWrap) {
        dotsWrap.innerHTML = cleaned.map(function (_, i) {
          return '<button type="button" class="grev-dot' + (i === 0 ? " is-active" : "") + '" data-grev-dot="' + i + '" aria-label="View review ' + (i + 1) + '"></button>';
        }).join("");
      }
      box.scrollTo({ left: 0, behavior: "auto" });
    }).catch(function () {});
  }

  function lazyLoadIframes() {
    var frames = document.querySelectorAll("iframe[data-src]");
    if (!frames.length) return;
    var loadFrame = function (f) {
      var u = f.getAttribute("data-src");
      if (!u) return;
      f.setAttribute("src", u);
      f.removeAttribute("data-src");
    };
    if (!("IntersectionObserver" in window)) {
      frames.forEach(loadFrame);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (ent) {
        if (ent.isIntersecting) {
          loadFrame(ent.target);
          io.unobserve(ent.target);
        }
      });
    }, { rootMargin: "420px 0px" });
    frames.forEach(function (f) { io.observe(f); });
  }

  function ensureElfsight() {
    var el = document.querySelector('[class*="elfsight-app-"]');
    if (!el) return;
    if (!document.querySelector('script[src*="elfsightcdn.com/platform.js"]')) {
      var s = document.createElement("script");
      s.src = "https://elfsightcdn.com/platform.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }

  function stepFame(dir) {
    var track = document.querySelector("[data-fame-track]");
    if (!track) return;
    var cards = track.querySelectorAll(".fame-card");
    if (cards.length < 2) return;
    var step = cards[1].offsetLeft - cards[0].offsetLeft;
    if (step <= 0) step = cards[0].getBoundingClientRect().width + 20;
    var maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 10) return;
    if (dir > 0 && track.scrollLeft >= maxScroll - 14) {
      track.scrollTo({ left: 0, behavior: "smooth" });
    } else if (dir < 0 && track.scrollLeft <= 14) {
      track.scrollTo({ left: maxScroll, behavior: "smooth" });
    } else {
      track.scrollBy({ left: step * dir, behavior: "smooth" });
    }
  }

  function scrollToFameDot(idx) {
    var track = document.querySelector("[data-fame-track]");
    if (!track) return;
    var cards = track.querySelectorAll(".fame-card");
    if (!cards[idx]) return;
    track.scrollTo({ left: cards[idx].offsetLeft - cards[0].offsetLeft, behavior: "smooth" });
  }

  function bindFameCarousel() {
    if (fameTimer) clearInterval(fameTimer);
    var track = document.querySelector("[data-fame-track]");
    if (!track) return;
    track.addEventListener("scroll", function () {
      var cards = track.querySelectorAll(".fame-card");
      var dots = document.querySelectorAll("[data-fame-dot]");
      if (!cards.length || !dots.length) return;
      var step = cards.length > 1 ? (cards[1].offsetLeft - cards[0].offsetLeft) : cards[0].offsetWidth;
      if (step <= 0) step = cards[0].offsetWidth || 1;
      var activeIdx = Math.min(cards.length - 1, Math.max(0, Math.round(track.scrollLeft / step)));
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === activeIdx); });
    }, { passive: true });
    track.addEventListener("mouseenter", function () { famePausedUntil = Date.now() + 7000; });
    track.addEventListener("touchstart", function () { famePausedUntil = Date.now() + 7000; }, { passive: true });
    fameTimer = setInterval(function () {
      if (Date.now() < famePausedUntil || document.hidden) return;
      stepFame(1);
    }, 4200);
  }

  var visitPopupTimer = null;
  function closeVisitPopup() {
    var m = document.getElementById("visit-modal");
    if (!m || m.hidden) return;
    m.hidden = true;
    document.documentElement.style.overflow = "";
    try { sessionStorage.setItem("ss_visit_popup_closed", "1"); } catch (e) {}
  }

  function initVisitPopup() {
    var m = document.getElementById("visit-modal");
    if (!m) return;
    try {
      if (sessionStorage.getItem("ss_visit_popup_closed") === "1") return;
    } catch (e) {}
    if (visitPopupTimer) clearTimeout(visitPopupTimer);
    visitPopupTimer = setTimeout(function () {
      var modal = document.getElementById("visit-modal");
      var lb = document.querySelector(".lightbox");
      if (!modal || !modal.hidden || (lb && !lb.hidden)) return;
      modal.hidden = false;
      document.documentElement.style.overflow = "hidden";
    }, 1100);
  }

  function init() {
    cleanUrlBar();
    SS.nav.init(); SS.gallery.init(); SS.anim.init(); bindForm(); prefill(); startReelsAuto(); startHeroAuto(); hydrateHeroSlides(); bindProgCarousel(); bindFameCarousel(); bindGrevCarousel(); loadLiveGoogleReviews(); lazyLoadIframes(); ensureElfsight(); initVisitPopup();
    var y = document.querySelector("[data-year]"); if (y) y.textContent = new Date().getFullYear();
  }
  SS.init = init;

  function start() {
    init();
    SS.loader.run().then(function (changed) { if (changed) { init(); window.scrollTo(window.scrollX, window.scrollY); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

