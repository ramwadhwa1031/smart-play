/*! Smart Start â€“ isomorphic renderer.
 * Used by tools/build.js (Node, generates static HTML for SEO) and by the browser
 * (content-loader.js re-renders from fresh JSON / local draft). Pure functions, no DOM access. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SSRender = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var FILES = { index: "index.html", about: "about.html", philosophy: "philosophy.html", programmes: "programmes.html",
    gallery: "gallery.html", updates: "updates.html", centres: "centres.html", contact: "contact.html" };
  var PAGE_NAMES = { index: "Home", about: "About Us", philosophy: "Multiple Intelligence", programmes: "Programmes",
    gallery: "Gallery", updates: "Announcements", centres: "Our Centres", contact: "Contact Us" };
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var LONG_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function hl(s) { return esc(s).replace(/\[\[(.+?)\]\]/g, '<span class="hl">$1</span>'); }
  function plain(s) { return String(s == null ? "" : s).replace(/\[\[|\]\]/g, ""); }
  function words(s) {
    var i = 0;
    return String(s || "").split(/(\[\[.+?\]\])/).filter(Boolean).map(function (seg) {
      var h = /^\[\[(.+)\]\]$/.test(seg), t = h ? seg.slice(2, -2) : seg;
      return t.split(/\s+/).filter(Boolean).map(function (w) {
        return '<span class="w' + (h ? " hl" : "") + '" style="--i:' + (i++) + '"><span>' + esc(w) + "</span></span>";
      }).join(" ");
    }).join(" ");
  }
  function fmtDate(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ""); if (!m) return "";
    return parseInt(m[3], 10) + " " + MONTHS[parseInt(m[2], 10) - 1] + " " + m[1];
  }
  function longDate(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ""); if (!m) return "";
    return parseInt(m[3], 10) + " " + LONG_MONTHS[parseInt(m[2], 10) - 1] + " " + m[1];
  }
  function slug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function fmtAddr(addr, city) {
    addr = String(addr || "").trim(); city = String(city || "").trim();
    if (!addr) return city;
    if (!city || addr.toLowerCase().indexOf(city.toLowerCase()) >= 0) return addr;
    return addr + ", " + city;
  }
  function p(c, path) { return (c.prefix || "") + path; }           // asset path prefix (admin uses ../)
  function isAbs(u) { return /^(https?:|mailto:|tel:|data:|blob:|idb:|#)/i.test(u || ""); }
  function src(c, u) { return !u ? "" : (isAbs(u) ? u : p(c, u)); }
  function digits(n) { return String(n || "").replace(/\D/g, ""); }
  function telHref(n) { var d = digits(n); return "tel:+" + (d.length === 10 ? "91" + d : d); }
  function waUrl(c, msg) {
    var s = c.s;
    return "https://wa.me/" + digits(s.whatsapp) + "?text=" + encodeURIComponent(msg || s.whatsappMessage || "Hello Smart Start");
  }
  function link(c, l) {
    if (l === "whatsapp") return waUrl(c);
    if (l === "tel") return telHref((c.s.phones[0] || {}).number);
    return l || "#";
  }
  function ext(u) { return /^https?:/i.test(u || "") ? ' target="_blank" rel="noopener"' : ""; }
  function pageUrl(c, pid) { return c.base ? c.base + (pid === "index" ? "" : FILES[pid].replace(/\.html$/i, "")) : ""; }
  function abs(c, u) { return !u ? "" : (/^https?:/i.test(u) ? u : (c.base ? c.base + u.replace(/^\//, "") : "")); }

  /* ---------- context ---------- */
  function makeCtx(data, opt) {
    opt = opt || {};
    var c = { d: data, s: data.settings, prefix: opt.prefix || "", mi: {}, base: "" };
    var url = (opt.siteUrl || data.settings.siteUrl || "").trim();
    if (url) c.base = url.replace(/\/+$/, "") + "/";
    ((data.media && data.media.items) || []).forEach(function (m) { c.mi[m.path] = m; });
    return c;
  }

  function img(c, o, opt) {
    opt = opt || {}; o = o || {};
    var u = o.src || o.path || ""; if (!u) return "";
    var m = c.mi[u], w = (m && m.w) || o.w || 1200, h = (m && m.h) || o.h || 900;
    var useThumb = opt.thumb && m && m.thumb, s = useThumb ? m.thumb : u;
    var a = ' src="' + esc(src(c, s)) + '" alt="' + esc(o.alt || (m && m.alt) || "") + '" width="' + w + '" height="' + h + '"';
    if (m && m.thumb && m.w > 640 && !opt.nosrcset && !/^idb:/.test(u)) {
      var tw = w >= h ? 640 : Math.round(640 * w / h);
      a += ' srcset="' + esc(src(c, m.thumb)) + " " + tw + "w, " + esc(src(c, u)) + " " + w + 'w" sizes="' + esc(opt.sizes || "(max-width:700px) 90vw, 600px") + '"';
      if (!useThumb) a = a.replace(' src="' + esc(src(c, s)) + '"', ' src="' + esc(src(c, u)) + '"');
    }
    a += opt.eager ? ' fetchpriority="high"' : ' loading="lazy"';
    return "<img" + a + ' decoding="async"' + (opt.cls ? ' class="' + opt.cls + '"' : "") + ">";
  }

  function icon(n, cls) { return '<svg class="ic' + (cls ? " " + cls : "") + '" aria-hidden="true" focusable="false"><use href="#i-' + n + '"></use></svg>'; }
  function deco(n, cls, style) { return '<svg class="deco ' + n + (cls ? " " + cls : "") + '" aria-hidden="true" focusable="false"' + (style ? ' style="' + style + '"' : "") + '><use href="#d-' + n + '"></use></svg>'; }

  function btn(c, label, href, kind, extra) {
    var h = link(c, href);
    return '<a class="btn btn--' + (kind || "primary") + '" href="' + esc(src(c, h) === h ? h : h) + '"' + ext(h) + (extra || "") + "><span>" + esc(label) + "</span>" + icon("arrow") + "</a>";
  }
  function fixHref(c, h) { return isAbs(h) ? h : p(c, h); }
  function btnl(c, label, href, kind) {
    var h = link(c, href);
    return '<a class="btn btn--' + (kind || "primary") + '" href="' + esc(fixHref(c, h)) + '"' + ext(h) + "><span>" + esc(label) + "</span>" + icon("arrow") + "</a>";
  }
  function head(c, eyebrow, title, text, cls) {
    return '<header class="sec-head ' + (cls || "") + ' reveal">' +
      (eyebrow ? '<p class="eyebrow">' + esc(eyebrow) + "</p>" : "") +
      '<h2 class="h2">' + hl(title) + "</h2>" +
      (text ? '<p class="lead">' + esc(text) + "</p>" : "") + "</header>";
  }
  function sectionOrder(c) {
    return (c.d.homepage.sections || []).filter(function (x) { return x.visible !== false; }).map(function (x) { return x.id; });
  }
  function sortedUpdates(c) {
    return ((c.d.updates && c.d.updates.items) || []).filter(function (u) { return u.published; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }
  function visibleProgrammes(c) {
    return ((c.d.programmes && c.d.programmes.items) || []).filter(function (x) { return x.visible !== false; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }
  function visibleGallery(c) {
    return ((c.d.gallery && c.d.gallery.images) || []).filter(function (x) { return x.visible !== false; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }
  function publishedTestimonials(c) {
    return ((c.d.testimonials && c.d.testimonials.items) || []).filter(function (x) { return x.published; });
  }
  function catLabel(c, id) {
    var f = ((c.d.gallery && c.d.gallery.categories) || []).filter(function (x) { return x.id === id; })[0];
    return f ? f.label : id;
  }

  /* ---------- SVG sprite ---------- */
  function sprite() {
    var S = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>';
    var ic = {
      book: "M4 5.5c2.5-1 5-1 8 .8 3-1.8 5.5-1.8 8-.8V18c-2.5-1-5-1-8 .8-3-1.8-5.5-1.8-8-.8z M12 6.3v12.5",
      calc: "M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M8 8h8 M8 12h2 M14 12h2 M8 16h2 M14 16h2",
      palette: "M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2-.6-1.2.2-2.5 1.6-2.5H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z M7.5 11h.01 M10 7.5h.01 M14.5 7.5h.01 M17 11h.01",
      run: "M14.5 4.5h.01 M9 21l3-6-3-3 2-4 3 2 3 1 M12 15l4 2v4 M8 9l-3 2",
      music: "M9 18V6l10-2v12 M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3z M19 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z",
      people: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6 M17 4.3a3.5 3.5 0 0 1 0 6.4 M18.5 14.3c2 .7 3.5 2.6 3.5 5.7",
      heart: "M12 20s-8-4.6-8-10.2A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.8C20 15.4 12 20 12 20z",
      leaf: "M5 19c0-8 5-14 15-14 0 10-6 15-14 15 M5 19c2-5 5-8 9-10",
      brain: "M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 4 3 3 0 0 0 3 4h1V4z M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 4 3 3 0 0 1-3 4h-1V4z",
      hand: "M7 12V6a1.5 1.5 0 0 1 3 0v5 M10 11V4.5a1.5 1.5 0 0 1 3 0V11 M13 11V5.5a1.5 1.5 0 0 1 3 0V13 M16 10a1.5 1.5 0 0 1 3 0v4c0 4-3 7-7 7-3 0-5-1.5-6-4l-2-4a1.5 1.5 0 0 1 2.5-1.5L7 14",
      nolock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M5.6 5.6l12.8 12.8",
      globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18",
      shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M8.5 12l2.5 2.5 4.5-5",
      star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
      mic: "M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3",
      arrow: "M4 12h16 M14 6l6 6-6 6",
      phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
      whatsapp: "M3 21l1.6-4.8A9 9 0 1 1 8 19.6z M9 9c0 3 3 6 6 6l1-2-2.5-1-1 .8c-.8-.4-1.6-1.2-2-2l.8-1L10.2 7.8z",
      mail: "M3 6h18v12H3z M3 7l9 6 9-6",
      pin: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
      check: "M5 12.5l4.5 4.5L19 7.5",
      calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
      instagram: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M17.5 6.5h.01",
      facebook: "M14 21v-8h3l.5-3.5H14V7.5C14 6.5 14.5 6 15.5 6H18V3h-3a4 4 0 0 0-4 4v2.5H8V13h3v8z",
      youtube: "M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z M10 9l5 3-5 3z",
      chevron: "M6 9l6 6 6-6",
      close: "M6 6l12 12 M18 6L6 18",
      prev: "M15 5l-7 7 7 7",
      next: "M9 5l7 7-7 7",
      clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2"
    };
    Object.keys(ic).forEach(function (k) {
      S += '<symbol id="i-' + k + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="' + ic[k] + '"/></symbol>';
    });
    var dc = {
      star: "M12 1.5l3 7 7.5.6-5.7 4.9 1.8 7.4L12 17.4l-6.6 4 1.8-7.4L1.5 9.1 9 8.5z",
      cloud: "M6.5 19a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 17.5 8.5 4.8 4.8 0 0 1 17.5 19z",
      heart: "M12 21s-9-5.2-9-11.4A5 5 0 0 1 12 7a5 5 0 0 1 9 2.6C21 15.8 12 21 12 21z",
      sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M11 1h2v3h-2z M11 20h2v3h-2z M1 11h3v2H1z M20 11h3v2h-3z M4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4z M16.3 17.7l1.4-1.4 2.1 2.1-1.4 1.4z M4.2 18.4l2.1-2.1 1.4 1.4-2.1 2.1z M16.3 6.3l2.1-2.1 1.4 1.4-2.1 2.1z",
      pencil: "M16.5 2.5l5 5-13 13-6 1 1-6z M14.6 4.4l5 5",
      plus: "M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8z",
      squiggle: "M1 14Q4 6 7 14T13 14T19 14T23 14L23 17Q20 9 17 17T11 17T5 17T1 17z",
      triangle: "M12 3l10 18H2z",
      pin: "M12 22s-8-7-8-13a8 8 0 0 1 16 0c0 6-8 13-8 13zM12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
      circle: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
      book: "M2 5c3.500-1.500 7-1 10 1 3-2 6.500-2.500 10-1v14c-3.500-1.500-7-1-10 1-3-2-6.500-2.500-10-1z"
    };
    Object.keys(dc).forEach(function (k) {
      S += '<symbol id="d-' + k + '" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="' + dc[k] + '"/></symbol>';
    });
    return S + "</defs></svg>";
  }

  /* ---------- layout pieces ---------- */
  function dropdownProgrammes(c) {
    return visibleProgrammes(c).map(function (x) {
      return '<li><a href="' + p(c, "programmes.html#" + esc(x.id)) + '">' + esc(x.name) + ' <small>' + esc(x.age) + "</small></a></li>";
    }).join("");
  }
  function header(c, pid) {
    var s = c.s;
    var items = (s.nav || []).map(function (n) {
      var f = n.href, key = Object.keys(FILES).filter(function (k) { return FILES[k] === f; })[0];
      var cur = key === pid ? ' aria-current="page"' : "";
      var sub = "";
      if (key === "about") sub = '<li><a href="' + p(c, "about.html#story") + '">Our Story</a></li><li><a href="' + p(c, "about.html#vision") + '">Vision &amp; Promises</a></li><li><a href="' + p(c, "about.html#values") + '">Values</a></li><li><a href="' + p(c, "about.html#principal") + '">Principal\'s Message</a></li>';
      if (key === "programmes") sub = dropdownProgrammes(c);
      if (sub) {
        return '<li class="has-sub"><a href="' + esc(fixHref(c, f)) + '"' + cur + '>' + esc(n.label) + '</a><button class="sub-toggle" type="button" aria-label="Show ' + esc(n.label) + ' submenu" aria-expanded="false">' + icon("chevron") + '</button><ul class="sub">' + sub + "</ul></li>";
      }
      return '<li><a href="' + esc(fixHref(c, f)) + '"' + cur + '>' + esc(n.label) + "</a></li>";
    }).join("");
    return '<div class="header-inner container">' +
      '<a class="brand" href="' + p(c, "index.html") + '" aria-label="' + esc(s.name) + ' – home">' +
      '<img src="' + esc(src(c, s.logo)) + '" alt="' + esc(s.name) + ' logo" width="56" height="56"><span class="brand__txt"><b>' + esc(s.name) + "</b><small>The Premium School</small></span></a>" +
      '<nav class="nav" id="primary-nav" aria-label="Primary"><ul>' + items + "</ul>" +
      '<div class="nav__cta"><a class="btn btn--primary btn--sm" href="' + p(c, "contact.html#enquiry") + '"><span>Book A Campus Visit</span>' + icon("arrow") + "</a></div></nav>" +
      '<button class="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="primary-nav"><span></span><span></span><span></span></button></div>';
  }
  function progIconSvg(id, idx) {
    var k = String(id || "").toLowerCase();
    if (k.indexOf("toddler") >= 0 || idx === 0) {
      return '<svg class="fp-ic" viewBox="0 0 36 36" aria-hidden="true"><circle cx="10" cy="10" r="5" fill="#C67D3B"/><circle cx="26" cy="10" r="5" fill="#C67D3B"/><circle cx="10" cy="10" r="2.8" fill="#F4C28F"/><circle cx="26" cy="10" r="2.8" fill="#F4C28F"/><ellipse cx="18" cy="25" rx="9" ry="7.5" fill="#C67D3B"/><ellipse cx="18" cy="25.5" rx="5.5" ry="4.5" fill="#F4C28F"/><circle cx="18" cy="15" r="8" fill="#D88B44"/><ellipse cx="18" cy="17" rx="4.2" ry="3.2" fill="#FCE0BD"/><circle cx="15" cy="13.5" r="1.3" fill="#1E2250"/><circle cx="21" cy="13.5" r="1.3" fill="#1E2250"/><ellipse cx="18" cy="16" rx="1.6" ry="1.1" fill="#5D2E18"/></svg>';
    }
    if (k.indexOf("play") >= 0 || idx === 1) {
      return '<svg class="fp-ic" viewBox="0 0 36 36" aria-hidden="true"><rect x="16.5" y="6" width="3" height="24" rx="1.5" fill="#F4C28F"/><ellipse cx="18" cy="28" rx="11" ry="3.2" fill="#E8483F"/><ellipse cx="18" cy="23.5" rx="9.2" ry="2.9" fill="#FFC83D"/><ellipse cx="18" cy="19" rx="7.5" ry="2.7" fill="#2FA66A"/><ellipse cx="18" cy="14.8" rx="5.8" ry="2.5" fill="#54B9F2"/><circle cx="18" cy="9.5" r="3.2" fill="#C2307E"/></svg>';
    }
    if (k.indexOf("pre") >= 0 || idx === 2) {
      return '<svg class="fp-ic" viewBox="0 0 36 36" aria-hidden="true"><rect x="11.5" y="5" width="13" height="13" rx="3" fill="#9B51E0" stroke="#fff" stroke-width="1.2"/><text x="18" y="14.5" text-anchor="middle" fill="#fff" font-family="Fredoka,sans-serif" font-weight="700" font-size="9">A</text><rect x="4" y="18" width="13" height="13" rx="3" fill="#54B9F2" stroke="#fff" stroke-width="1.2"/><text x="10.5" y="27.5" text-anchor="middle" fill="#fff" font-family="Fredoka,sans-serif" font-weight="700" font-size="9">B</text><rect x="19" y="18" width="13" height="13" rx="3" fill="#2FA66A" stroke="#fff" stroke-width="1.2"/><text x="25.5" y="27.5" text-anchor="middle" fill="#fff" font-family="Fredoka,sans-serif" font-weight="700" font-size="9">C</text></svg>';
    }
    if (k.indexOf("nurs") >= 0 || idx === 3) {
      return '<svg class="fp-ic" viewBox="0 0 36 36" aria-hidden="true"><ellipse cx="18" cy="29" rx="9" ry="3.2" fill="#A97142"/><path d="M18 28V14" stroke="#46B855" stroke-width="2.8" stroke-linecap="round"/><path d="M18 19c-6 0-10-4-9-9 6 0 9 3 9 9z" fill="#6CD968"/><path d="M18 16c6 0 10-4 9-9-6 0-9 3-9 9z" fill="#38B649"/></svg>';
    }
    if (k.indexOf("lkg") >= 0 || idx === 4) {
      return '<svg class="fp-ic" viewBox="0 0 36 36" aria-hidden="true"><g transform="rotate(35 18 18)"><rect x="14" y="5" width="8" height="4" rx="1.5" fill="#F48FB1"/><rect x="14" y="9" width="8" height="2.2" fill="#CFD8DC"/><rect x="14" y="11.2" width="8" height="15" fill="#FFC83D"/><rect x="16.5" y="11.2" width="3" height="15" fill="#FFB300"/><polygon points="14,26.2 22,26.2 18,32.5" fill="#FFE0B2"/><polygon points="16.5,30 19.5,30 18,32.5" fill="#1E2250"/></g></svg>';
    }
    return '<svg class="fp-ic" viewBox="0 0 36 36" aria-hidden="true"><polygon points="18,7 33,14 18,21 3,14" fill="#7B3FB8" stroke="#E1BEE7" stroke-width="1"/><path d="M10 17.5v6c0 2.5 3.6 4.5 8 4.5s8-2 8-4.5v-6" fill="#5E2A9B" stroke="#E1BEE7" stroke-width="1"/><path d="M30 15.2v8.5" stroke="#FFC83D" stroke-width="2.2" stroke-linecap="round"/><circle cx="30" cy="24.5" r="2" fill="#FFC83D"/></svg>';
  }

  function footer(c) {
    var s = c.s, soc = s.social || {};
    var exploreList = [
      { label: "Home", href: "index.html" },
      { label: "About Us", href: "about.html" },
      { label: "Philosophy", href: "philosophy.html" },
      { label: "Programmes", href: "programmes.html" },
      { label: "Gallery", href: "gallery.html" },
      { label: "Announcements", href: "updates.html" },
      { label: "Our Centres", href: "centres.html" },
      { label: "Contact Us", href: "contact.html" }
    ];
    var links = exploreList.map(function (n) {
      return '<li><a href="' + esc(fixHref(c, n.href)) + '"><span class="f-chev" aria-hidden="true">›</span><span>' + esc(n.label) + "</span></a></li>";
    }).join("");
    var progs = visibleProgrammes(c).map(function (x, i) {
      var shortAge = String(x.age || "").replace(/years/i, "yrs").replace(/–/g, " – ");
      return '<li><a href="' + p(c, "programmes.html#" + esc(x.id)) + '">' + progIconSvg(x.id, i) + '<span class="f-prog-txt"><b>' + esc(x.name) + '</b> <span class="f-age">(' + esc(shortAge) + ")</span></span></a></li>";
    }).join("");
    var phoneIc = '<svg class="f-ic f-ic--phone" viewBox="0 0 24 24" aria-hidden="true"><path fill="#FF6F7D" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24c1.1.36 2.3.56 3.6.56a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.56 3.6a1 1 0 0 1-.25 1L6.6 10.8z"/></svg>';
    var mailIc = '<svg class="f-ic f-ic--mail" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="3" fill="none" stroke="#FFC83D" stroke-width="2"/><path d="M3 6.5l9 6.5 9-6.5" fill="none" stroke="#FFC83D" stroke-width="2" stroke-linecap="round"/></svg>';
    var pinIc = '<svg class="f-ic f-ic--pin" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.8-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.2 12 21 12 21z" fill="none" stroke="#FFC83D" stroke-width="2"/><circle cx="12" cy="10.5" r="2.3" fill="#FFC83D"/></svg>';
    var phones = (s.phones || []).map(function (x) {
      return '<li>' + phoneIc + '<a href="' + telHref(x.number) + '">' + esc(x.number) + "</a></li>";
    }).join("");
    var so = "";
    if (soc.instagram) so += '<a class="soc soc--ig" href="' + esc(soc.instagram) + '" target="_blank" rel="noopener" aria-label="' + esc(s.name) + ' on Instagram">' + icon("instagram") + "</a>";
    if (soc.facebook) so += '<a class="soc soc--fb" href="' + esc(soc.facebook) + '" target="_blank" rel="noopener" aria-label="' + esc(s.name) + ' on Facebook">' + icon("facebook") + "</a>";
    if (soc.youtube) so += '<a class="soc soc--yt" href="' + esc(soc.youtube) + '" target="_blank" rel="noopener" aria-label="' + esc(s.name) + ' on YouTube">' + icon("youtube") + "</a>";

    var sparkleH = '<svg class="fh-svg" viewBox="0 0 28 28" aria-hidden="true"><path fill="#FFC83D" d="M14 2l2.6 7.4L24 12l-7.4 2.6L14 22l-2.6-7.4L4 12l7.4-2.6z"/><path fill="#FFE082" d="M23 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/><circle cx="6" cy="22" r="1.5" fill="#FFC83D"/></svg>';
    var booksH = '<svg class="fh-svg" viewBox="0 0 28 28" aria-hidden="true"><rect x="3" y="6" width="22" height="5.5" rx="2" fill="#FFC83D"/><rect x="5" y="7.5" width="18" height="2.5" rx="1" fill="#FFF8E1"/><rect x="4" y="12.5" width="20" height="5.5" rx="2" fill="#E8483F"/><rect x="6" y="14" width="16" height="2.5" rx="1" fill="#FFEBEE"/><rect x="3" y="19" width="22" height="5.5" rx="2" fill="#7B3FB8"/><rect x="5" y="20.5" width="18" height="2.5" rx="1" fill="#F3E5F5"/></svg>';
    var touchH = '<svg class="fh-svg" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12" fill="#FFC83D"/><path fill="#1E2250" d="M10.5 12.8a9.5 9.5 0 0 0 4.7 4.7l1.5-1.5a.7.7 0 0 1 .7-.17c.8.25 1.6.4 2.5.4a.7.7 0 0 1 .7.7v2.4a.7.7 0 0 1-.7.7A11.8 11.8 0 0 1 8 8.1a.7.7 0 0 1 .7-.7h2.4a.7.7 0 0 1 .7.7c0 .9.15 1.7.4 2.5a.7.7 0 0 1-.17.7l-1.53 1.5z"/><path d="M15.5 8.5a4 4 0 0 1 4 4M15.5 11a1.5 1.5 0 0 1 1.5 1.5" stroke="#1E2250" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg>';

    var schoolSvg = '<svg class="f-schoolhouse" viewBox="0 0 360 150" aria-hidden="true">' +
      '<ellipse cx="52" cy="136" rx="34" ry="14" fill="#46A538"/><circle cx="38" cy="130" r="16" fill="#64C448"/><circle cx="62" cy="133" r="13" fill="#7BD658"/>' +
      '<rect x="78" y="108" width="6" height="30" rx="2" fill="#7D4E2D"/><circle cx="81" cy="96" r="20" fill="#5CB841"/><circle cx="71" cy="102" r="13" fill="#76D156"/><circle cx="91" cy="103" r="13" fill="#46A12E"/>' +
      '<rect x="115" y="74" width="130" height="64" rx="3" fill="#FFE79B"/><rect x="150" y="64" width="60" height="74" fill="#FFF2C2"/>' +
      '<polygon points="106,76 180,44 254,76" fill="#D93678"/><polygon points="142,68 180,38 218,68" fill="#EC488B"/>' +
      '<line x1="180" y1="16" x2="180" y2="40" stroke="#7D4E2D" stroke-width="2.5" stroke-linecap="round"/><path d="M181 17c8 1 13-2 20 3-6 5-12 3-20 5z" fill="#EC488B"/>' +
      '<circle cx="180" cy="56" r="7.5" fill="#54B9F2" stroke="#fff" stroke-width="2"/>' +
      '<rect x="126" y="85" width="16" height="16" rx="2" fill="#5C82B8" stroke="#fff" stroke-width="1.6"/><rect x="126" y="109" width="16" height="16" rx="2" fill="#5C82B8" stroke="#fff" stroke-width="1.6"/>' +
      '<rect x="218" y="85" width="16" height="16" rx="2" fill="#5C82B8" stroke="#fff" stroke-width="1.6"/><rect x="218" y="109" width="16" height="16" rx="2" fill="#5C82B8" stroke="#fff" stroke-width="1.6"/>' +
      '<rect x="158" y="82" width="16" height="16" rx="2" fill="#5C82B8" stroke="#fff" stroke-width="1.6"/><rect x="186" y="82" width="16" height="16" rx="2" fill="#5C82B8" stroke="#fff" stroke-width="1.6"/>' +
      '<path d="M167 138v-24a13 13 0 0 1 26 0v24z" fill="#6F4C8B" stroke="#fff" stroke-width="1.6"/><line x1="180" y1="101" x2="180" y2="138" stroke="#fff" stroke-width="1.4"/>' +
      '<rect x="282" y="96" width="8" height="42" rx="3" fill="#7D4E2D"/><circle cx="286" cy="76" r="24" fill="#74CC52"/><circle cx="272" cy="85" r="16" fill="#5BB53D"/><circle cx="300" cy="86" r="16" fill="#88DC65"/>' +
      '<circle cx="322" cy="130" r="16" fill="#58B33B"/><circle cx="340" cy="134" r="12" fill="#78D057"/><circle cx="256" cy="133" r="11" fill="#64C448"/>' +
      '</svg>';

    var leftBushSvg = '<svg class="f-bush-l" viewBox="0 0 180 90" aria-hidden="true"><circle cx="22" cy="72" r="34" fill="#64C448"/><circle cx="62" cy="74" r="28" fill="#82D65D"/><circle cx="98" cy="80" r="20" fill="#4BA535"/><circle cx="122" cy="84" r="14" fill="#74CC52"/></svg>';
    var starTrailSvg = '<svg class="f-star-trail" viewBox="0 0 110 130" aria-hidden="true"><path d="M22 18l5 10 11 1.5-8 7.5 2 11-10-5.5-10 5.5 2-11-8-7.5 11-1.5z" fill="#FFC83D"/><path d="M44 34c38 12 58 46 56 90" fill="none" stroke="#B6BCE8" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round"/></svg>';

    return '<div class="footer-wave" aria-hidden="true"><svg viewBox="0 0 1440 90" preserveAspectRatio="none">' +
      '<path class="fw-back" d="M0 32C180 82 380 86 620 42S1080 -6 1440 46V90H0Z"/>' +
      '<path class="fw-front" d="M0 46C220 92 440 84 720 44S1160 8 1440 54V90H0Z"/></svg></div>' +
      '<div class="footer-body">' +
      starTrailSvg +
      '<div class="container footer-grid">' +
      '<div class="f-col f-brand"><a class="brand brand--light" href="' + p(c, "index.html") + '"><img src="' + esc(src(c, s.logo)) + '" alt="' + esc(s.name) + ' logo" width="66" height="66" loading="lazy"><span class="brand__txt"><b>' + esc(s.name) + "</b><small>THE PREMIUM SCHOOL</small></span></a>" +
      "<p>" + esc((s.footer || {}).blurb) + '</p><div class="f-motto"><span>' + esc(s.motto) + '</span><svg viewBox="0 0 130 14" aria-hidden="true"><path d="M2 11c24-8 62-9 96-3" fill="none" stroke="#FFC83D" stroke-width="3.2" stroke-linecap="round"/></svg></div><div class="socials">' + so + "</div></div>" +
      '<nav class="f-col f-explore" aria-label="Explore"><h2 class="f-h">' + sparkleH + '<span>Explore</span></h2><ul class="f-links">' + links + "</ul></nav>" +
      '<nav class="f-col f-progs" aria-label="Our Programmes"><h2 class="f-h">' + booksH + '<span>Our Programmes</span></h2><ul class="f-proglist">' + progs + "</ul></nav>" +
      '<div class="f-col f-touch"><h2 class="f-h">' + touchH + '<span>Get in Touch</span></h2><ul class="f-contact">' + phones +
      '<li>' + mailIc + '<a href="mailto:' + esc(s.email) + '">' + esc(s.email) + "</a></li>" +
      (s.address ? '<li>' + pinIc + "<span>" + esc(fmtAddr(s.address, s.city)) + "</span></li>" : "") +
      (s.mapsUrl ? '<li>' + pinIc + '<a href="' + esc(s.mapsUrl) + '" target="_blank" rel="noopener">Find us on Google Maps</a></li>' : "") +
      "</ul></div></div>" +
      '<div class="footer-scene" aria-hidden="true">' + leftBushSvg + schoolSvg +
      '<div class="f-gold-wave"><svg viewBox="0 0 1440 36" preserveAspectRatio="none"><path d="M0 24C260 6 540 2 820 18S1220 34 1440 16" fill="none" stroke="#FFC83D" stroke-width="4.5" stroke-linecap="round"/></svg></div></div>' +
      '<div class="container footer-bottom">' +
      '<p class="f-copy">© <span data-year>' + new Date().getFullYear() + "</span> " + esc((s.footer || {}).copyright) + "</p>" +
      '<span class="f-div" aria-hidden="true"></span>' +
      '<p class="f-tag"><svg class="f-ray" viewBox="0 0 28 28" aria-hidden="true"><path d="M22 6L12 10M20 14L8 14M22 22L12 18" stroke="#FFC83D" stroke-width="2.8" stroke-linecap="round"/></svg>' +
      '<span>Little Steps. Big Dreams. Bright Futures.</span>' +
      '<svg class="f-ray" viewBox="0 0 28 28" aria-hidden="true"><path d="M6 6l10 4M8 14l12 0M6 22l10-4" stroke="#FFC83D" stroke-width="2.8" stroke-linecap="round"/></svg></p>' +
      "</div></div>";
  }
  function floating(c) {
    return '<a class="wa-float" href="' + esc(waUrl(c)) + '" target="_blank" rel="noopener" aria-label="Chat with Smart Start on WhatsApp">' +
      '<svg class="wa-float__ic" viewBox="0 0 32 32" aria-hidden="true"><path fill="#FFFFFF" d="M16 3C9.1 3 3.5 8.5 3.5 15.3c0 2.3.6 4.5 1.8 6.4L3.4 28.6l7.1-1.8a12.7 12.7 0 0 0 5.5 1.3c6.9 0 12.5-5.5 12.5-12.4S22.9 3 16 3zm0 22.7c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.2 1.1 1.1-4.1-.3-.4a10.2 10.2 0 0 1-1.6-5.4C5.2 9.5 10 4.8 16 4.8s10.8 4.7 10.8 10.5S22 25.7 16 25.7zm5.9-7.8c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.8 8.8 0 0 1-4.3-3.7c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.6s-.7-1.7-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.7 5.9 5.1 2.2.9 3.1 1 4.2.8.7-.1 1.9-.8 2.2-1.5.3-.8.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>' +
      '<span>WhatsApp</span></a>' +
      '<div class="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" hidden><button class="lb-close" type="button" aria-label="Close">' + icon("close") + '</button><button class="lb-prev" type="button" aria-label="Previous photo">' + icon("prev") + '</button><figure class="lb-fig"><img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" width="1" height="1"><figcaption></figcaption></figure><button class="lb-next" type="button" aria-label="Next photo">' + icon("next") + "</button></div>";
  }
  function pageHero(c, pid, eyebrow, title, text, extraCls) {
    return '<section class="page-hero ' + (extraCls || "") + '"><div class="container">' +
      '<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="' + p(c, "index.html") + '">Home</a></li><li aria-current="page">' + esc(PAGE_NAMES[pid]) + "</li></ol></nav>" +
      '<p class="eyebrow">' + esc(eyebrow) + '</p><h1 class="h1">' + words(title) + '</h1><p class="lead">' + esc(text) + "</p></div>" +
      deco("star", "f f1") + deco("cloud", "f f2") + deco("pencil", "f f3") + deco("plus", "f f4") + "</section>";
  }
  function wave(color, flip, on) {
    return '<div class="wave ' + (flip ? "wave--flip " : "") + color + (on ? " on-" + on : "") + '" aria-hidden="true"><svg viewBox="0 0 1440 70" preserveAspectRatio="none"><path d="M0 35c120 35 240 35 360 8S600 0 720 18s240 45 360 27 240-38 360-8V70H0Z"/></svg></div>';
  }
  function marqueeGroup(items, sep, hidden) {
    var rep = items.slice(); while (rep.length && rep.length < 12) rep = rep.concat(items);
    return '<ul class="marquee__group"' + (hidden ? ' aria-hidden="true"' : "") + ">" + rep.map(function (t) {
      return "<li><span>" + esc(t) + "</span>" + deco(sep || "star", "sep") + "</li>";
    }).join("") + "</ul>";
  }
  function marquee(c, items, cls, label, sep) {
    if (!items.length) return "";
    return '<div class="marquee ' + cls + '" role="region" aria-label="' + esc(label) + '"><div class="marquee__track">' + marqueeGroup(items, sep, false) + marqueeGroup(items, sep, true) + "</div></div>";
  }
  function enquiryHref(c, prog) { return p(c, "contact.html?programme=" + encodeURIComponent(prog) + "#enquiry"); }

  /* ---------- reusable blocks ---------- */
  function programmeCardMini(c, x, i) {
    return '<a class="step-card reveal c-' + esc(x.color) + '" style="--i:' + i + '" href="' + p(c, "programmes.html#" + esc(x.id)) + '">' +
      '<span class="step-img">' + img(c, x.image, { thumb: 1, sizes: "(max-width:700px) 88vw, 380px" }) + '<span class="age-pill">' + esc(x.age) + '</span></span>' +
      '<span class="step-body"><h3>' + esc(x.name) + '</h3><p>' + esc(x.tagline) + '</p><span class="more">Explore ' + icon("arrow") + "</span></span></a>";
  }
  function updateCard(c, u, i, big) {
    var count = (u.images || []).length;
    var gal = [u.cover].concat(u.images || []).filter(Boolean).map(function (x) { return src(c, x); });
    return '<article class="upd reveal' + (big ? " upd--big" : "") + '" style="--i:' + i + '" data-cat="' + esc(slug(u.category)) + '" data-gallery="' + esc(JSON.stringify(gal)) + '" data-title="' + esc(u.title) + '">' +
      '<button type="button" class="upd__img" aria-label="View photos: ' + esc(u.title) + '">' + img(c, { src: u.cover, alt: u.title }, { thumb: 1, sizes: big ? "(max-width:900px) 90vw, 560px" : "(max-width:700px) 90vw, 380px" }) +
      (count ? '<span class="upd__count">+' + count + " photos</span>" : "") + "</button>" +
      '<div class="upd__body"><p class="upd__meta"><span class="tag">' + esc(u.category) + '</span><time datetime="' + esc(u.date) + '">' + icon("calendar") + " " + fmtDate(u.date) + "</time></p>" +
      "<h3>" + esc(u.title) + "</h3><p>" + esc(u.description) + "</p></div></article>";
  }
  function miTabs(c, panel) {
    var list = c.d.philosophy.intelligences || [];
    return '<div class="mi-explorer" data-mi><div class="mi-tabs" role="tablist" aria-label="Eight intelligences">' +
      list.map(function (x, i) {
        return '<button type="button" role="tab" class="mi-tab c-' + esc(x.color) + (i === 0 ? " is-active" : "") + '" id="mi-t-' + x.id + '" aria-selected="' + (i === 0) + '" aria-controls="mi-p-' + x.id + '">' +
          '<span class="ico">' + icon(x.icon) + "</span><span class=\"nm\">" + esc(x.name) + "</span></button>";
      }).join("") + '</div><div class="mi-panels">' +
      list.map(function (x, i) {
        return '<article class="mi-panel c-' + esc(x.color) + (i === 0 ? " is-active" : "") + '" role="tabpanel" id="mi-p-' + x.id + '" aria-labelledby="mi-t-' + x.id + '">' +
          '<div class="mi-panel__img blob-a">' + img(c, x.image, { thumb: 1, sizes: "(max-width:900px) 80vw, 420px" }) + "</div>" +
          '<div class="mi-panel__txt"><p class="eyebrow">' + esc(x.name) + ' Intelligence</p><h3 class="h3">' + esc(x.heading) + "</h3><p>" + esc(x.text) + "</p>" +
          '<ul class="chips">' + (x.activities || []).map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul></div></article>";
      }).join("") + "</div></div>";
  }

  /* ---------- HOME sections ---------- */
  var HOME = {
    hero: function (c) {
      var h = c.d.homepage.hero, im = h.images || [];
      return '<section class="hero" id="top" aria-labelledby="hero-title">' +
        '<div class="hero__bg" aria-hidden="true"><span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span></div>' +
        deco("cloud", "f hc1", "--s:1") + deco("cloud", "f hc2") + deco("sun", "f hsun") + deco("star", "f hs1") + deco("star", "f hs2") + deco("pencil", "f hp") + deco("plus", "f hplus") + deco("heart", "f hh") +
        '<div class="container hero__grid"><div class="hero__copy">' +
        '<p class="eyebrow eyebrow--pill">' + esc(h.eyebrow) + '</p><h1 class="h1 split" id="hero-title">' + words(h.title) + "</h1>" +
        '<p class="lead rise" style="--d:.5s">' + esc(h.subtitle) + '</p><div class="btn-row rise" style="--d:.65s">' +
        btnl(c, h.cta1.label, h.cta1.link, "primary") + btnl(c, h.cta2.label, h.cta2.link, "yellow") + "</div>" +
        '<ul class="hero__chips rise" style="--d:.8s"><li>Ages 1.5 – 6 years</li><li>Multiple Intelligence</li><li>' + esc(c.s.motto) + "</li></ul></div>" +
        '<div class="hero__art" data-parallax>' +
        '<figure class="hf hf1 blob-a" data-depth="0.04">' + (im[0] ? img(c, im[0], { eager: 1, sizes: "(max-width:900px) 70vw, 460px", nosrcset: 0 }) : "") + "</figure>" +
        '<figure class="hf hf2 blob-circle" data-depth="0.08">' + (im[1] ? img(c, im[1], { thumb: 1, eager: 1, sizes: "220px" }) : "") + "</figure>" +
        '<figure class="hf hf3 blob-b" data-depth="0.06">' + (im[2] ? img(c, im[2], { thumb: 1, eager: 1, sizes: "240px" }) : "") + "</figure>" +
        '<div class="hero__badge" data-depth="0.1"><img src="' + esc(src(c, c.s.logo)) + '" alt="" width="84" height="84"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><path id="ring" d="M60 60m-48 0a48 48 0 1 1 96 0a48 48 0 1 1-96 0"/></defs><text><textPath href="#ring">' + esc(h.badge || c.s.motto) + " • " + esc(h.badge || c.s.motto) + " •</textPath></text></svg></div>" +
        '<span class="note note1" aria-hidden="true">learning is fun!</span></div></div>' +
        '<div class="wave white" aria-hidden="true"><svg viewBox="0 0 1440 70" preserveAspectRatio="none"><path d="M0 35c120 35 240 35 360 8S600 0 720 18s240 45 360 27 240-38 360-8V70H0Z"/></svg></div></section>';
    },
    marquee: function (c) {
      var m = c.d.homepage.marquee || {}, phil = (c.d.philosophy.intelligences || []).map(function (x) { return x.heading; });
      return '<section class="marquees" aria-label="Smart Start highlights">' +
        marquee(c, m.highlights || [], "m-purple", "School highlights", "star") +
        marquee(c, (m.programmes || visibleProgrammes(c).map(function (x) { return x.name; })), "m-yellow m-rev", "Programmes", "heart") +
        marquee(c, phil, "m-sky", "Learning philosophy", "plus") +
        marquee(c, (m.announcements || []), "m-magenta m-fast", "Announcements", "star") + "</section>";
    },
    intro: function (c) {
      var i = c.d.homepage.intro, im = i.images || [];
      return '<section class="sec sec--intro" id="about-us"><div class="container split-2">' +
        '<div class="collage reveal">' + (im[0] ? '<figure class="cf cf1 blob-a">' + img(c, im[0], { thumb: 1, sizes: "(max-width:900px) 80vw, 460px" }) + "</figure>" : "") +
        (im[1] ? '<figure class="cf cf2 blob-circle">' + img(c, im[1], { thumb: 1, sizes: "260px" }) + "</figure>" : "") +
        deco("star", "f cs1") + deco("squiggle", "f cs2") + '<span class="note note2" aria-hidden="true">our second home</span></div>' +
        '<div class="reveal"><p class="eyebrow">' + esc(i.eyebrow) + '</p><h2 class="h2">' + hl(i.title) + "</h2><p class=\"lead\">" + esc(i.text) + "</p>" +
        '<ul class="ticks">' + (i.points || []).map(function (t) { return "<li>" + icon("check") + "<span>" + esc(t) + "</span></li>"; }).join("") + "</ul>" +
        '<a class="link-arrow" href="' + p(c, "about.html") + '">Our story ' + icon("arrow") + "</a>" + stats(c) + "</div></div></section>";
    },
    mi: function (c) {
      var m = c.d.homepage.mi;
      return wave("sky", false) + '<section class="sec sec--mi" id="multiple-intelligence"><div class="container">' + deco("star", "f ms1") + deco("star", "f ms2") + deco("book", "f mb") +
        head(c, m.eyebrow, m.title, m.text) + miTabs(c) +
        '<p class="center reveal"><a class="btn btn--primary" href="' + p(c, "philosophy.html") + '"><span>Dive into Multiple Intelligence</span>' + icon("arrow") + "</a></p></div></section>" + wave("sky", true);
    },
    why: function (c) {
      var w = c.d.homepage.why, cols = ["purple", "magenta", "green", "yellow"];
      return '<section class="sec sec--why" id="why-smart-start"><div class="container">' + head(c, w.eyebrow, w.title, "") +
        '<div class="pillars">' + (w.items || []).map(function (x, i) {
          return '<article class="pillar reveal c-' + cols[i % 4] + '" style="--i:' + i + '"><span class="pillar__n">' + (i + 1) + '</span><span class="pillar__ico">' + icon(x.icon) + "</span><h3>" + esc(x.title) + "</h3><p>" + esc(x.text) + "</p></article>";
        }).join("") + "</div></div></section>";
    },
    philosophy: function (c) {
      var f = c.d.homepage.philosophy;
      return '<section class="sec sec--quote" id="learning-philosophy"><div class="stars" aria-hidden="true"></div><div class="container reveal"><p class="eyebrow eyebrow--light">' + esc(f.eyebrow) + "</p>" +
        '<blockquote><p>' + esc(f.title) + "</p></blockquote><p class=\"lead\">" + esc(f.text) + '</p><p class="attrib">— ' + esc(f.attribution) + "</p></div>" +
        '<div class="wave cream quote-wave" aria-hidden="true"><svg viewBox="0 0 1440 70" preserveAspectRatio="none"><path d="M0 35c120 35 240 35 360 8S600 0 720 18s240 45 360 27 240-38 360-8V70H0Z"/></svg></div></section>';
    },
    programmes: function (c) {
      var h = c.d.homepage.programmes, list = visibleProgrammes(c);
      return '<section class="sec sec--prog" id="programmes"><div class="container">' + head(c, h.eyebrow, h.title, h.text) +
        '<div class="ladder">' + list.map(function (x, i) { return programmeCardMini(c, x, i); }).join("") + "</div>" +
        '<p class="center reveal"><a class="btn btn--yellow" href="' + p(c, "programmes.html") + '"><span>See all programme details</span>' + icon("arrow") + "</a></p></div></section>";
    },
    environment: function (c) {
      var e = c.d.homepage.environment, im = e.images || [];
      return '<section class="sec sec--env" id="learning-environment"><div class="container">' + head(c, e.eyebrow, e.title, e.text) +
        '<div class="mosaic">' + im.map(function (x, i) {
          return '<figure class="mz mz' + (i + 1) + ' reveal reveal--img" style="--i:' + i + '">' + img(c, x, { thumb: 1, sizes: "(max-width:700px) 90vw, 440px" }) + "<figcaption>" + esc(x.caption || "") + "</figcaption></figure>";
        }).join("") + "</div></div></section>";
    },
    updates: function (c) {
      var u = c.d.homepage.updates, list = sortedUpdates(c).slice(0, Math.max(3, Math.min(6, u.count || 6)));
      if (!list.length) return "";
      return wave("yellow", false) + '<section class="sec sec--upd" id="latest-updates"><div class="container">' + head(c, u.eyebrow, u.title, u.text) +
        '<div class="upd-grid">' + list.map(function (x, i) { return updateCard(c, x, i, i === 0); }).join("") + "</div>" +
        '<p class="center reveal"><a class="btn btn--primary" href="' + p(c, "updates.html") + '"><span>All announcements</span>' + icon("arrow") + "</a></p></div></section>" + wave("yellow", true);
    },
    reels: function (c) {
      var r = (c.d.homepage && c.d.homepage.reels) || {};
      var items = r.items || [];
      if (!items.length) return "";
      var username = r.username || "smart_start_the_premium_school";
      var profileUrl = r.profileUrl || ("https://www.instagram.com/" + username + "/reels/");
      var handle = r.handle || ("@" + username);
      return '<section class="sec sec--reels" id="instagram-reels"><div class="container">' +
        '<div class="reels-top reveal">' +
        '<div class="reels-head">' +
        '<a class="reels-badge" href="' + esc(profileUrl) + '" target="_blank" rel="noopener">' + icon("instagram") + '<span>' + esc(r.eyebrow || ("Instagram Reels · " + handle)) + '</span><span class="reels-live-dot" aria-hidden="true"></span><b>LIVE</b></a>' +
        '<h2 class="h2">' + hl(r.title || "Watch the Magic Unfold [[Daily on Reels]]") + "</h2>" +
        (r.text ? '<p class="lead">' + esc(r.text) + "</p>" : "") +
        "</div>" +
        '<div class="reels-nav" aria-label="Carousel navigation">' +
        '<button class="reel-nav-btn" type="button" data-reel-dir="-1" aria-label="Previous reels">' + icon("prev") + "</button>" +
        '<button class="reel-nav-btn" type="button" data-reel-dir="1" aria-label="Next reels">' + icon("next") + "</button>" +
        "</div></div>" +
        '<div class="reels-track" data-reels-track data-reels-count="' + items.length + '" tabindex="0" role="region" aria-label="Instagram Reels carousel">' +
        items.concat(items).map(function (it, i) {
          var code = it.shortcode || ((String(it.url || "").match(/\/(?:reel|p)\/([A-Za-z0-9_-]+)/) || [])[1]) || "";
          var emb = it.embedUrl || (code ? ("https://www.instagram.com/reel/" + code + "/embed/") : "");
          if (!emb) return "";
          return '<div class="reel-card reel-card--embed reveal" style="--i:' + (i % 5) + '"' + (i >= items.length ? ' aria-hidden="true"' : "") + '>' +
            '<div class="reel-card__frame">' +
            '<iframe class="reel-iframe" src="' + esc(emb) + '" title="Instagram Reel ' + ((i % items.length) + 1) + ' (' + esc(handle) + ')" loading="lazy" allowtransparency="true" allow="autoplay; encrypted-media" allowfullscreen="true" frameborder="0" scrolling="no"></iframe>' +
            "</div></div>";
        }).join("") +
        "</div>" +
        '<p class="center reveal"><a class="btn btn--ig" href="' + esc(profileUrl) + '" target="_blank" rel="noopener">' + icon("instagram") + "<span>" + esc(r.buttonLabel || "Watch All Reels on Instagram") + "</span>" + icon("arrow") + "</a></p>" +
        "</div></section>";
    },
    gallery: function (c) {
      var g = c.d.homepage.gallery, all = visibleGallery(c);
      var list = all.filter(function (x) { return x.featured; }); if (list.length < (g.count || 8)) list = list.concat(all.filter(function (x) { return !x.featured; }));
      list = list.slice(0, g.count || 8);
      if (!list.length) return "";
      return '<section class="sec sec--gal" id="gallery-preview"><div class="container">' + head(c, g.eyebrow, g.title, g.text) +
        '<div class="strip" data-lightbox-group>' + list.map(function (x, i) {
          return '<a class="strip__i reveal reveal--img" style="--i:' + i + '" href="' + esc(src(c, x.src)) + '" data-caption="' + esc(x.caption) + '">' + img(c, { src: x.thumb || x.src, alt: x.alt, w: x.w, h: x.h }, { nosrcset: 1 }) + "</a>";
        }).join("") + '</div><p class="center reveal"><a class="btn btn--primary" href="' + p(c, "gallery.html") + '"><span>Open the full gallery</span>' + icon("arrow") + "</a></p></div></section>";
    },
    principal: function (c) {
      var pr = c.d.about.principal, h = c.d.homepage.principal;
      return '<section class="sec sec--princ" id="principal-intro"><div class="container princ-grid">' +
        '<div class="reveal princ-head"><p class="eyebrow">' + esc(h.eyebrow) + '</p><h2 class="h2">' + esc(h.title) + "</h2></div>" +
        '<div class="reveal princ-photo"><div class="blob-c">' + img(c, { src: pr.photo, alt: pr.photoAlt }, { thumb: 1, sizes: "(max-width:900px) 70vw, 420px" }) + "</div>" + deco("heart", "f ph1") + deco("star", "f ph2") + "</div>" +
        '<div class="reveal princ-body"><p class="lead">' + esc(pr.message[3] || pr.intro) + '</p><p class="who"><b>' + esc(pr.name) + "</b><span>" + esc(pr.designation) + "</span></p>" +
        btnl(c, h.button.label, h.button.link, "primary") + "</div></div></section>";
    },
    testimonials: function (c) {
      var t = publishedTestimonials(c); if (!t.length) return "";
      var h = c.d.homepage.testimonials;
      return '<section class="sec sec--test" id="testimonials"><div class="container">' + head(c, h.eyebrow, h.title, "") +
        '<div class="bubbles">' + t.map(function (x, i) {
          return '<figure class="bubble reveal" style="--i:' + i + '"><blockquote><p>' + esc(x.text) + "</p></blockquote><figcaption><b>" + esc(x.name) + "</b>" + (x.relation ? "<span>" + esc(x.relation) + "</span>" : "") + "</figcaption></figure>";
        }).join("") + "</div></div></section>";
    },
    cta: function (c) {
      var t = c.d.homepage.cta || {};
      var rawTitle = t.title || "Every [[Little Dream]] Deserves a {{Big Beginning!}}";
      var hTitle = esc(rawTitle)
        .replace(/\[\[(.+?)\]\]/g, '<span class="pf-purp">$1</span>')
        .replace(/\{\{(.+?)\}\}/g, '<br><span class="pf-mag">$1</span>');
      if (rawTitle.indexOf("{{") < 0 && rawTitle.indexOf("[[") >= 0) {
        hTitle = esc(rawTitle).replace(/\[\[(.+?)\]\]/g, '<span class="pf-mag">$1</span>');
      }
      var c1 = t.cta1 || { label: "Book A Campus Visit", link: "contact.html#enquiry" };
      var c2 = t.cta2 || { label: "Explore Programmes", link: "programmes.html" };
      var h1 = link(c, c1.link), h2 = link(c, c2.link);
      var capIc = '<svg class="pf-cap" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,4 22,9 12,14 2,9" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M6 11.5v4.5c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5v-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 10v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      var rainbowSvg = '<svg class="pf-rainbow" viewBox="0 0 130 74" aria-hidden="true">' +
        '<path d="M8 72a57 57 0 0 1 114 0" fill="none" stroke="#FF6B8B" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M16 72a49 49 0 0 1 98 0" fill="none" stroke="#FFB347" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M24 72a41 41 0 0 1 82 0" fill="none" stroke="#FFE066" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M32 72a33 33 0 0 1 66 0" fill="none" stroke="#6BCB77" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M40 72a25 25 0 0 1 50 0" fill="none" stroke="#4D96FF" stroke-width="8" stroke-linecap="round"/></svg>';
      var booksSvg = '<svg class="pf-books" viewBox="0 0 110 56" aria-hidden="true">' +
        '<rect x="6" y="38" width="88" height="14" rx="4" fill="#9B51E0"/><rect x="12" y="42" width="76" height="6" rx="2" fill="#F3E5F5"/>' +
        '<rect x="12" y="23" width="82" height="14" rx="4" fill="#FF6B8B"/><rect x="18" y="27" width="70" height="6" rx="2" fill="#FFF0F3"/>' +
        '<rect x="18" y="8" width="74" height="14" rx="4" fill="#38A3E8"/><rect x="24" y="12" width="62" height="6" rx="2" fill="#EBF7FF"/></svg>';
      var blocksSvg = '<svg class="pf-blocks" viewBox="0 0 120 96" aria-hidden="true">' +
        '<polygon points="48,36 78,8 108,36" fill="#FFC83D"/><rect x="52" y="36" width="52" height="12" rx="2" fill="#FFB300"/>' +
        '<rect x="52" y="48" width="18" height="32" rx="2" fill="#38A3E8"/><rect x="86" y="48" width="18" height="32" rx="2" fill="#38A3E8"/>' +
        '<rect x="48" y="80" width="24" height="12" rx="2" fill="#2684C7"/><rect x="80" y="80" width="28" height="12" rx="2" fill="#E8483F"/>' +
        '<rect x="8" y="80" width="26" height="13" rx="3" fill="#2FA66A"/><rect x="38" y="76" width="16" height="16" rx="3" fill="#FF9800"/></svg>';
      var planeSvg = '<svg class="pf-plane" viewBox="0 0 140 80" aria-hidden="true">' +
        '<path d="M6 70c26-8 46-24 62-44" fill="none" stroke="#3F3D6B" stroke-width="2" stroke-dasharray="5 5" stroke-linecap="round"/>' +
        '<path d="M126 10L74 26l17 8 9 17 8-14 18-27z" fill="none" stroke="#6D2FA0" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<path d="M126 10L91 34" fill="none" stroke="#6D2FA0" stroke-width="2.2"/></svg>';
      var raysSvg = '<svg class="pf-rays" viewBox="0 0 32 36" aria-hidden="true"><path d="M4 10L18 4M6 18L22 18M4 26L18 32" stroke="#FFC83D" stroke-width="3.6" stroke-linecap="round"/></svg>';

      return '<section class="prefoot" id="enquire">' +
        '<svg class="prefoot__hills" viewBox="0 0 1440 260" preserveAspectRatio="none" aria-hidden="true">' +
        '<path fill="#FDE8F1" d="M0 110C180 40 360 50 540 120S920 200 1140 110 1340 40 1440 80V260H0Z"/>' +
        '<path fill="#F3EAFC" d="M0 150C240 90 480 180 760 130S1180 50 1440 120V260H0Z"/>' +
        '<path fill="#FFF4D9" d="M0 190C320 140 620 210 960 165S1280 120 1440 170V260H0Z"/></svg>' +
        '<svg class="pf-cloud pf-cloud--l" viewBox="0 0 120 60" aria-hidden="true"><path fill="#D8F0FE" d="M25 48a16 16 0 0 1-2-32 22 22 0 0 1 42-6 18 18 0 0 1 30 13 14 14 0 0 1-3 25z"/></svg>' +
        '<div class="container prefoot__grid">' +
        '<div class="prefoot__side prefoot__side--l reveal">' +
        booksSvg +
        '<div class="pf-kid pf-kid--l">' + img(c, { src: "assets/images/independence-worksheet.webp", alt: "Happy Smart Start child learning" }, { thumb: 1, sizes: "240px" }) + raysSvg + "</div>" +
        rainbowSvg + "</div>" +
        '<div class="prefoot__center reveal">' +
        '<h2 class="prefoot__h">' + hTitle + raysSvg + "</h2>" +
        '<p class="prefoot__p">' + esc(t.text || "Give your child the confidence, creativity and care to explore a world of possibilities.") + "</p>" +
        '<div class="prefoot__btns">' +
        '<a class="pf-btn pf-btn--mag" href="' + esc(fixHref(c, h1)) + '"' + ext(h1) + "><span>" + esc(c1.label) + "</span>" + icon("arrow") + "</a>" +
        '<a class="pf-btn pf-btn--out" href="' + esc(fixHref(c, h2)) + '"' + ext(h2) + ">" + capIc + "<span>" + esc(c2.label) + "</span></a>" +
        "</div>" + planeSvg + "</div>" +
        '<div class="prefoot__side prefoot__side--r reveal">' +
        '<div class="pf-kid pf-kid--r">' + img(c, { src: "assets/images/climbing-net-smile.webp", alt: "Smiling Smart Start student" }, { thumb: 1, sizes: "240px" }) + raysSvg + "</div>" +
        blocksSvg + "</div>" +
        "</div></section>";
    },
    contact: function (c) {
      return gitSection(c);
    }
  };

  function stats(c) {
    var n = [[visibleProgrammes(c).length, "Programmes"], [(c.d.philosophy.intelligences || []).length, "Intelligences nurtured"], [((c.d.homepage.why || {}).items || []).length, "Pillars of care"]];
    return '<ul class="stats">' + n.map(function (x) { return '<li><b data-count-to="' + x[0] + '">' + x[0] + "</b><span>" + esc(x[1]) + "</span></li>"; }).join("") + "</ul>";
  }

  function gitSection(c) {
    var t = (c.d.homepage && c.d.homepage.contact) || {};
    var eyebrow = t.eyebrow || "Get in Touch";
    var rawTitle = t.title || "We’d Love to Hear [[From You]]";
    var sub = t.text || "Have a question about admissions, programmes or our school? Reach out to us anytime!";
    var hTitle = esc(rawTitle).replace(/\[\[(.+?)\]\]/g,
      '<span class="git-hl">$1<svg class="git-u" viewBox="0 0 180 18" aria-hidden="true"><path d="M4 11c18-7 36 6 54-1s36 6 54 0" fill="none" stroke="#FFC83D" stroke-width="5" stroke-linecap="round"/><path d="M132 12h10M152 11c7 2 14 0 21-2" fill="none" stroke="#FFC83D" stroke-width="5" stroke-linecap="round"/></svg></span>');
    if (rawTitle.indexOf("[[") < 0) {
      hTitle = esc(rawTitle);
    }
    var leftRays = '<svg class="git-rays" viewBox="0 0 42 44" aria-hidden="true"><path d="M32 8L18 2M26 20L10 15M24 32L8 30" stroke="#FFC83D" stroke-width="4.2" stroke-linecap="round"/></svg>';
    var heartSvg = '<svg class="git-heart" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 27s-10-6.8-10-14.2C6 8.5 9.5 6 12.8 6c2.2 0 3.2 1.5 3.2 2.8 0-1.3 1.2-2.8 3.4-2.8C22.8 6 26 8.6 26 12.8 26 20.2 16 27 16 27z" fill="none" stroke="#D42A78" stroke-width="2.6" stroke-linejoin="round"/></svg>';
    var planeSvg = '<svg class="git-plane" viewBox="0 0 150 96" aria-hidden="true">' +
      '<path d="M10 82c24 8 52-4 54-24 2-14-12-20-18-10-6 10 8 26 28 18 16-6 26-20 34-34" fill="none" stroke="#2D315E" stroke-width="2.2" stroke-dasharray="5 5" stroke-linecap="round"/>' +
      '<path d="M140 10L86 27l18 8 8 18 9-14 19-29z" fill="#D7E6FA" stroke="#2D315E" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M140 10l-36 25" fill="none" stroke="#2D315E" stroke-width="2.2"/></svg>';
    var cloudL = '<svg class="git-cloud git-cloud--l" viewBox="0 0 150 74" aria-hidden="true"><path fill="#CBEBFB" d="M30 60a20 20 0 0 1-2-40 28 28 0 0 1 53-7 22 22 0 0 1 37 16 17 17 0 0 1-3 31z"/></svg>';
    var cloudR = '<svg class="git-cloud git-cloud--r" viewBox="0 0 150 74" aria-hidden="true"><path fill="#CBEBFB" d="M30 60a20 20 0 0 1-2-40 28 28 0 0 1 53-7 22 22 0 0 1 37 16 17 17 0 0 1-3 31z"/></svg>';
    var bushL = '<svg class="git-bush git-bush--l" viewBox="0 0 130 100" aria-hidden="true"><ellipse cx="26" cy="58" rx="18" ry="36" transform="rotate(-18 26 58)" fill="#8AD03B"/><ellipse cx="48" cy="64" rx="16" ry="30" fill="#4BA32E"/><ellipse cx="70" cy="76" rx="15" ry="22" transform="rotate(20 70 76)" fill="#66B933"/><circle cx="18" cy="84" r="18" fill="#52A732"/></svg>';
    var bushR = '<svg class="git-bush git-bush--r" viewBox="0 0 130 100" aria-hidden="true"><ellipse cx="104" cy="58" rx="18" ry="36" transform="rotate(18 104 58)" fill="#8AD03B"/><ellipse cx="82" cy="64" rx="16" ry="30" fill="#4BA32E"/><ellipse cx="60" cy="76" rx="15" ry="22" transform="rotate(-20 60 76)" fill="#66B933"/><circle cx="112" cy="84" r="18" fill="#52A732"/></svg>';

    return '<section class="git-sec" id="contact-info">' +
      '<svg class="git-hills" viewBox="0 0 1440 420" preserveAspectRatio="none" aria-hidden="true">' +
      '<path fill="#FDEAF2" d="M0 40C140 20 240 130 340 240S520 380 0 400Z"/>' +
      '<path fill="#FDEAF2" d="M1440 90C1280 70 1160 170 1060 280S920 390 1440 410Z"/></svg>' +
      cloudL + cloudR +
      '<div class="container git-wrap">' +
      '<header class="git-head reveal">' +
      '<div class="git-pill"><span>' + esc(eyebrow) + '</span></div>' +
      '<div class="git-title-row">' + leftRays + '<h2 class="git-h2">' + hTitle + heartSvg + '</h2>' + planeSvg + '</div>' +
      '<p class="git-sub">' + esc(sub) + '</p>' +
      '</header>' +
      contactCards(c) +
      '</div>' +
      '<div class="git-grass" aria-hidden="true">' + bushL + bushR +
      '<svg viewBox="0 0 1440 48" preserveAspectRatio="none"><path fill="#BCE26B" d="M0 24C260 4 560 44 880 18S1260 6 1440 26V48H0Z"/><path fill="#A6D652" d="M0 34C340 16 700 46 1060 26S1320 18 1440 34V48H0Z"/></svg></div>' +
      '</section>';
  }

  function contactCards(c) {
    var s = c.s;
    var firstPhone = ((s.phones || [])[0] || {}).number || "9717177531";
    var badgeRays = '<svg class="git-brays" viewBox="0 0 28 28" aria-hidden="true"><path d="M4 14L14 4M8 20L22 12M12 25L24 22" stroke="#FFC83D" stroke-width="3.2" stroke-linecap="round"/></svg>';
    var waveYellow = '<svg class="git-twave" viewBox="0 0 110 12" aria-hidden="true"><path d="M3 7c14-6 28 6 42 0s28 6 42 0 16-4 20-1" fill="none" stroke="#FFC83D" stroke-width="3.6" stroke-linecap="round"/></svg>';
    var waveGreen = '<svg class="git-twave" viewBox="0 0 120 12" aria-hidden="true"><path d="M3 7c15-6 30 6 45 0s30 6 45 0" fill="none" stroke="#16A067" stroke-width="3.6" stroke-linecap="round"/><circle cx="106" cy="7" r="2.2" fill="#16A067"/></svg>';
    var smPhone = '<svg class="git-sm-ic" viewBox="0 0 20 20" aria-hidden="true"><path fill="#D42A78" d="M5.5 9a12.6 12.6 0 0 0 5.5 5.5l1.8-1.8a.8.8 0 0 1 .8-.2c.9.3 1.9.46 3 .46a.8.8 0 0 1 .8.8v2.9a.8.8 0 0 1-.8.8A14.2 14.2 0 0 1 2.5 3.4a.8.8 0 0 1 .8-.8h2.9a.8.8 0 0 1 .8.8c0 1 .16 2 .46 3a.8.8 0 0 1-.2.8L5.5 9z"/></svg>';
    var smMail = '<svg class="git-sm-ic" viewBox="0 0 22 18" aria-hidden="true"><rect x="1" y="2" width="20" height="14" rx="2.5" fill="#6D2FA0"/><path d="M2.5 3.5L11 10l8.5-6.5" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>';
    var smPin = '<svg class="git-sm-ic git-sm-ic--pin" viewBox="0 0 22 26" aria-hidden="true"><path fill="#1187D7" d="M11 25s-8-7.2-8-13.5a8 8 0 1 1 16 0C19 17.8 11 25 11 25z"/><circle cx="11" cy="11.5" r="3.2" fill="#fff"/></svg>';
    var arr = '<svg class="git-arr" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var badgePhone = '<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M11.5 16.2a16 16 0 0 0 8.3 8.3l2.6-2.6a1.4 1.4 0 0 1 1.4-.3c1.5.5 3.1.8 4.7.8a1.4 1.4 0 0 1 1.4 1.4v4.3a1.4 1.4 0 0 1-1.4 1.4A22.5 22.5 0 0 1 6.1 7.5a1.4 1.4 0 0 1 1.4-1.4h4.3a1.4 1.4 0 0 1 1.4 1.4c0 1.6.3 3.2.8 4.7a1.4 1.4 0 0 1-.3 1.4l-2.2 2.6z" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/><path d="M20 8a8 8 0 0 1 8 8M20 12.2a3.8 3.8 0 0 1 3.8 3.8" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';
    var badgeWa = '<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 6a11.8 11.8 0 0 0-10.1 17.9L6.2 30l6.3-1.6A11.8 11.8 0 1 0 18 6z" fill="none" stroke="#fff" stroke-width="2.3" stroke-linejoin="round"/><path fill="#fff" d="M14.5 13.2c-.3-.7-.6-.7-.9-.7h-.8c-.3 0-.8.1-1.2.6-.4.4-1.5 1.4-1.5 3.5s1.5 4.1 1.7 4.4c.2.3 3 4.7 7.3 6.4 3.6 1.4 4.3 1.1 5.1 1 .8-.1 2.5-1 2.8-2 .4-1 .4-1.8.3-2-.1-.2-.4-.3-.8-.5s-2.5-1.2-2.9-1.4c-.4-.1-.7-.2-1 .2-.3.4-1.1 1.4-1.4 1.7-.2.3-.5.3-.9.1a11.7 11.7 0 0 1-5.8-5.1c-.4-.7.4-.7 1.2-2.2.1-.3 0-.6-.1-.8s-1-2.4-1.3-3.2z" transform="scale(.78) translate(5 4)"/></svg>';
    var badgeMail = '<svg viewBox="0 0 36 36" aria-hidden="true"><rect x="6" y="9" width="24" height="18" rx="3.5" fill="none" stroke="#fff" stroke-width="2.3"/><path d="M7.5 11L18 19.5 28.5 11" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var badgePin = '<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 30s-9-7.6-9-14.8a9 9 0 1 1 18 0C27 22.4 18 30 18 30z" fill="none" stroke="#fff" stroke-width="2.3" stroke-linejoin="round"/><circle cx="18" cy="15.2" r="3.5" fill="none" stroke="#fff" stroke-width="2.3"/></svg>';

    var addrText = fmtAddr(s.address, s.city);
    var addrHtml = esc(addrText).replace(/,\s*(Rohini)/i, ",<br>$1");

    return '<div class="git-cards">' +
      '<article class="git-card git-card--pink reveal">' +
      '<div class="git-badge git-badge--pink">' + badgePhone + badgeRays + '</div>' +
      '<h3>Call Us</h3>' + waveYellow +
      '<ul class="git-phones">' + (s.phones || []).map(function (x) {
        return '<li>' + smPhone + '<a href="' + telHref(x.number) + '">' + esc(x.number) + "</a></li>";
      }).join("") + '</ul>' +
      '<a class="git-btn git-btn--pink" href="' + telHref(firstPhone) + '"><span>Call Now</span>' + arr + '</a></article>' +

      '<article class="git-card git-card--green reveal" style="--i:1">' +
      '<div class="git-badge git-badge--green">' + badgeWa + badgeRays + '</div>' +
      '<h3>WhatsApp</h3>' + waveGreen +
      '<p class="git-desc">Chat with us on WhatsApp<br>for quick queries</p>' +
      '<a class="git-btn git-btn--green" href="' + esc(waUrl(c)) + '" target="_blank" rel="noopener"><span>Chat on WhatsApp</span>' + arr + '</a></article>' +

      '<article class="git-card git-card--purple reveal" style="--i:2">' +
      '<div class="git-badge git-badge--purple">' + badgeMail + badgeRays + '</div>' +
      '<h3>Email</h3>' + waveYellow +
      '<p class="git-email">' + smMail + '<a href="mailto:' + esc(s.email) + '">' + esc(s.email) + '</a></p>' +
      '<a class="git-btn git-btn--purple" href="mailto:' + esc(s.email) + '"><span>Send an Email</span>' + arr + '</a></article>' +

      '<article class="git-card git-card--sky reveal" style="--i:3">' +
      '<div class="git-badge git-badge--sky">' + badgePin + badgeRays + '</div>' +
      '<h3>Find Us</h3>' + waveYellow +
      '<p class="git-addr">' + smPin + '<span>' + addrHtml + '</span></p>' +
      (s.mapsUrl ? '<a class="git-btn git-btn--sky" href="' + esc(s.mapsUrl) + '" target="_blank" rel="noopener"><span>Open in Google Maps</span>' + arr + '</a>' : "") +
      '</article></div>';
  }

  /* ---------- INNER PAGES ---------- */
  var PAGES = {};

  PAGES.index = function (c) {
    return sectionOrder(c).map(function (id) { return HOME[id] ? HOME[id](c) : ""; }).join("");
  };

  PAGES.about = function (c) {
    var a = c.d.about, pr = a.principal;
    var card = function (t, i) { return '<article class="vcard c-' + esc(t.color) + ' reveal" style="--i:' + i + '"><h3>' + esc(t.title) + "</h3><p>" + esc(t.text) + "</p></article>"; };
    return pageHero(c, "about", "About Smart Start", "A second home where [[childhood blossoms]]", "Meet the school, the vision and the people behind Smart Start – The Premium School.") +
      '<section class="sec" id="story"><div class="container split-2"><div class="reveal reveal--img blob-wrap">' + deco("star", "f as1") + '<div class="blob-a">' + img(c, a.story.image, { thumb: 1, sizes: "(max-width:900px) 90vw, 520px" }) + '</div></div><div class="reveal"><p class="eyebrow">' + esc(a.story.eyebrow) + '</p><h2 class="h2">' + hl(a.story.title) + "</h2>" +
      a.story.paragraphs.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") + "</div></div></section>" +
      wave("sky", false) + '<section class="sec sec--sky" id="vision"><div class="container"><div class="vision-card reveal"><p class="eyebrow">' + esc(a.vision.eyebrow) + '</p><h2 class="h2">' + hl(a.vision.title) + "</h2><p>" + esc(a.vision.official) + '</p><p class="vision-short">' + esc(a.vision.short) + '</p><p class="motto-line">' + esc(a.vision.motto) + "</p></div>" +
      head(c, a.promises.eyebrow, a.promises.title, "", "sec-head--sm") + '<div class="two-col">' +
      a.promises.items.map(function (t, i) { return '<article class="promise reveal" style="--i:' + i + '"><span class="num">' + (i + 1) + "</span><h3>" + esc(t.title) + "</h3><p>" + esc(t.text) + "</p></article>"; }).join("") + "</div></div></section>" + wave("sky", true) +
      '<section class="sec" id="approach"><div class="container">' + head(c, a.approach.eyebrow, a.approach.title, "") + '<div class="approach">' +
      a.approach.items.map(function (t, i) { return '<article class="ap reveal" style="--i:' + i + '"><span class="ico">' + icon(t.icon) + "</span><h3>" + esc(t.title) + "</h3><p>" + esc(t.text) + "</p></article>"; }).join("") + "</div></div></section>" +
      '<section class="sec sec--values" id="values"><div class="container">' + head(c, a.values.eyebrow, a.values.title, "") + '<div class="values">' + a.values.items.map(card).join("") + "</div></div></section>" +
      '<section class="sec sec--princ" id="principal"><div class="container princ-grid">' +
      '<div class="reveal princ-head"><p class="eyebrow">Principal\'s message</p><h2 class="h2">' + esc(pr.name) + '</h2><p class="role">' + esc(pr.designation) + "</p></div>" +
      '<div class="reveal princ-photo"><div class="blob-c">' + img(c, { src: pr.photo, alt: pr.photoAlt }, { thumb: 1, sizes: "(max-width:900px) 70vw, 420px" }) + "</div>" + deco("heart", "f ph1") + deco("star", "f ph2") + "</div>" +
      '<div class="reveal princ-body"><p>' + esc(pr.bio) + '</p></div></div>' +
      '<div class="container letter reveal"><div class="letter__paper">' + pr.message.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("") + '<p class="sign">' + esc(pr.signoff) + "</p></div></div></section>" +
      '<section class="sec" id="why-choose-us"><div class="container"><div class="whylist reveal"><div>' + head(c, a.why.eyebrow, a.why.title, "") + '</div><ul class="ticks ticks--lg">' + a.why.items.map(function (t) { return "<li>" + icon("check") + "<span>" + esc(t) + "</span></li>"; }).join("") + "</ul></div></div></section>" +
      ((a.staff || []).length ? staffSection(c) : "") + HOME.cta(c);
  };
  function staffSection(c) {
    return '<section class="sec" id="staff"><div class="container">' + head(c, "Our team", "The people who care for your child", "") + '<div class="staff">' +
      c.d.about.staff.map(function (s, i) {
        return '<article class="staff__i reveal" style="--i:' + i + '"><div class="blob-circle">' + (s.photo ? img(c, { src: s.photo, alt: s.name }, { thumb: 1, sizes: "200px" }) : "") + "</div><h3>" + esc(s.name) + "</h3><p>" + esc(s.designation) + "</p></article>";
      }).join("") + "</div></div></section>";
  }

  PAGES.philosophy = function (c) {
    var f = c.d.philosophy, list = f.intelligences;
    return pageHero(c, "philosophy", f.hero.eyebrow, f.hero.title, f.hero.text, "page-hero--mi") +
      '<section class="sec"><div class="container"><header class="sec-head reveal"><h2 class="h2">' + hl(f.how.title) + '</h2></header><ol class="steps">' + f.how.steps.map(function (s, i) {
        return '<li class="reveal" style="--i:' + i + '"><span class="n">' + (i + 1) + "</span><h3>" + esc(s.title) + "</h3><p>" + esc(s.text) + "</p></li>";
      }).join("") + "</ol></div></section>" +
      '<section class="sec sec--sky"><div class="container"><header class="sec-head reveal"><p class="eyebrow">Explore</p><h2 class="h2">Tap an intelligence</h2></header>' + miTabs(c) + "</div></section>" +
      list.map(function (x, i) {
        return '<section class="mi-sec c-' + esc(x.color) + (i % 2 ? " mi-sec--rev" : "") + '" id="' + esc(x.id) + '"><div class="container split-2' + (i % 2 ? " split-2--rev" : "") + '">' +
          '<div class="reveal reveal--img mi-sec__img"><span class="bignum" aria-hidden="true">' + (i + 1) + '</span><div class="blob-' + ["a", "b", "c"][i % 3] + '">' + img(c, x.image, { thumb: 1, sizes: "(max-width:900px) 90vw, 520px" }) + '</div><span class="mi-sec__ico">' + icon(x.icon) + "</span></div>" +
          '<div class="reveal"><p class="eyebrow">' + esc(x.name) + ' Intelligence</p><h2 class="h2">' + esc(x.heading) + "</h2><p class=\"lead\">" + esc(x.text) + '</p><h3 class="h4">Activities that nurture it</h3><ul class="act">' +
          (x.activities || []).map(function (a, j) { return '<li style="--i:' + j + '">' + esc(a) + "</li>"; }).join("") + "</ul></div></div></section>";
      }).join("") + HOME.cta(c);
  };

  PAGES.programmes = function (c) {
    var h = c.d.programmes.hero, list = visibleProgrammes(c);
    return pageHero(c, "programmes", h.eyebrow, h.title, h.text) +
      '<section class="sec sec--tight"><div class="container"><nav class="age-nav" aria-label="Programme quick links">' + list.map(function (x) {
        return '<a class="c-' + esc(x.color) + '" href="#' + esc(x.id) + '"><b>' + esc(x.name) + "</b><small>" + esc(x.age) + "</small></a>";
      }).join("") + "</nav></div></section>" +
      list.map(function (x, i) {
        return '<section class="prog c-' + esc(x.color) + (i % 2 ? " prog--rev" : "") + '" id="' + esc(x.id) + '"><div class="container prog__grid">' +
          '<div class="prog__img reveal reveal--img"><div class="blob-' + ["a", "b", "c"][i % 3] + '">' + img(c, x.image, { thumb: 1, sizes: "(max-width:900px) 90vw, 480px" }) + '</div><span class="age-sticker">' + esc(x.age) + "</span></div>" +
          '<div class="prog__txt reveal"><p class="eyebrow">' + esc(x.tagline) + '</p><h2 class="h2">' + esc(x.name) + "</h2><p class=\"lead\">" + esc(x.description) + "</p>" +
          '<div class="prog__cols"><div><h3>Learning objectives</h3><ul>' + (x.objectives || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div><div><h3>Activities</h3><ul>" + (x.activities || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul></div></div>" +
          '<h3 class="h4">Development areas</h3><ul class="chips">' + (x.development || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" +
          '<a class="btn btn--primary" href="' + enquiryHref(c, x.name) + '"><span>Enquire about ' + esc(x.name) + "</span>" + icon("arrow") + "</a></div></div></section>";
      }).join("") + HOME.cta(c);
  };

  PAGES.gallery = function (c) {
    var cats = c.d.gallery.categories, list = visibleGallery(c);
    var used = {}; list.forEach(function (x) { used[x.category] = 1; });
    return pageHero(c, "gallery", "School gallery", "Little moments, [[big memories]]", "Festivals, stage shows, classrooms and play. Tap any photo to enlarge it.") +
      '<section class="sec sec--tight"><div class="container"><div class="filters" role="group" aria-label="Filter photos by category"><button type="button" class="chip is-active" data-filter="all">All</button>' +
      cats.filter(function (x) { return used[x.id]; }).map(function (x) { return '<button type="button" class="chip" data-filter="' + esc(x.id) + '">' + esc(x.label) + "</button>"; }).join("") + '</div>' +
      '<p class="count" aria-live="polite"><span data-count>' + list.length + "</span> photos</p>" +
      '<div class="masonry" data-lightbox-group>' + list.map(function (x, i) {
        return '<a class="mas" data-cat="' + esc(x.category) + '" href="' + esc(src(c, x.src)) + '" data-caption="' + esc(x.caption) + '" style="--r:' + (x.h / x.w).toFixed(3) + '">' +
          img(c, { src: x.thumb || x.src, alt: x.alt, w: x.w, h: x.h }, { nosrcset: 1 }) + "<span class=\"mas__cap\"><b>" + esc(x.caption) + "</b><small>" + esc(catLabel(c, x.category)) + "</small></span></a>";
      }).join("") + "</div></div></section>" + HOME.cta(c);
  };

  PAGES.updates = function (c) {
    var list = sortedUpdates(c), cats = {}; list.forEach(function (u) { cats[u.category] = 1; });
    return pageHero(c, "updates", "News & notices", "Latest [[announcements]] from school", "Celebrations, events, activities and important announcements.") +
      '<section class="sec sec--tight"><div class="container">' + (list.length ? '<div class="filters" role="group" aria-label="Filter updates"><button type="button" class="chip is-active" data-filter="all">All</button>' +
        Object.keys(cats).map(function (k) { return '<button type="button" class="chip" data-filter="' + esc(slug(k)) + '">' + esc(k) + "</button>"; }).join("") + '</div><div class="upd-list">' +
        list.map(function (u, i) { return updateCard(c, u, i % 6, false); }).join("") + "</div>" :
        '<p class="empty">No updates published yet. Please check back soon.</p>') + "</div></section>" + HOME.cta(c);
  };

  PAGES.centres = function (c) {
    var list = ((c.d.centres && c.d.centres.centres) || []).filter(function (x) { return x.visible !== false; });
    return pageHero(c, "centres", "Visit us", "Our [[centre]]", "Come and see Smart Start for yourself. We would love to show you around.") +
      list.map(function (x, i) {
        var ph = x.photos || [];
        return '<section class="sec centre" id="' + esc(x.id) + '"><div class="container centre__grid"><div class="centre__photos reveal reveal--img">' +
          ph.map(function (q, j) { return '<figure class="cp cp' + (j + 1) + '">' + img(c, q, { thumb: 1, sizes: "(max-width:900px) 90vw, 420px" }) + "</figure>"; }).join("") + "</div>" +
          '<div class="centre__info reveal"><p class="eyebrow">Centre ' + (i + 1) + '</p><h2 class="h2">' + esc(x.name) + "</h2><p class=\"lead\">" + esc(x.intro) + "</p>" +
          '<dl class="dl"><dt>' + icon("pin") + " Address</dt><dd>" + esc(fmtAddr(x.address, x.city)) + (x.address ? "" : " (call us for the exact address)") + "</dd>" +
          "<dt>" + icon("phone") + " Phone</dt><dd>" + (x.phones || []).map(function (n) { return '<a href="' + telHref(n) + '">' + esc(n) + "</a>"; }).join(" · ") + "</dd>" +
          "<dt>" + icon("mail") + ' Email</dt><dd><a href="mailto:' + esc(x.email) + '">' + esc(x.email) + "</a></dd></dl>" +
          '<div class="btn-row">' + (x.mapsUrl ? '<a class="btn btn--primary" href="' + esc(x.mapsUrl) + '" target="_blank" rel="noopener"><span>Get directions</span>' + icon("pin") + "</a>" : "") +
          '<a class="btn btn--yellow" href="' + p(c, "contact.html#enquiry") + '"><span>Book A Campus Visit</span>' + icon("arrow") + "</a></div></div></div></section>";
      }).join("") + HOME.cta(c);
  };

  PAGES.contact = function (c) {
    var s = c.s, progs = visibleProgrammes(c);
    var hours = (s.hours || []).length ? '<ul class="hours">' + s.hours.map(function (h) { return "<li><span>" + esc(h.day) + "</span><b>" + esc(h.time) + "</b></li>"; }).join("") + "</ul>" : "";
    return pageHero(c, "contact", "Get in touch", "Let's start your child's [[smart start]]", "Call, WhatsApp, email or send an enquiry. We're happy to answer every question.") +
      gitSection(c) +
      '<section class="sec" id="enquiry"><div class="container enq"><div class="reveal"><p class="eyebrow">Enquiry</p><h2 class="h2">Send us an <span class="hl">enquiry</span></h2>' +
      '<p>Fill in the form and choose how to send it. Your message will open in WhatsApp or your email app, and nothing is sent until you press send there.</p>' +
      '<div class="hours-box"><h3>' + icon("clock") + " Visiting hours</h3>" + hours + "<p>" + esc(s.hoursNote) + "</p></div>" +
      (s.mapsUrl ? '<a class="btn btn--sky" href="' + esc(s.mapsUrl) + '" target="_blank" rel="noopener"><span>Open Google Maps</span>' + icon("pin") + "</a>" : "") + "</div>" +
      '<form class="enq-form reveal" id="enq-form" novalidate data-wa="' + esc(digits(s.whatsapp)) + '" data-email="' + esc(s.email) + '" data-school="' + esc(s.name) + '">' +
      '<label>Parent name<input name="name" type="text" autocomplete="name" required></label>' +
      '<label>Phone number<input name="phone" type="tel" autocomplete="tel" inputmode="tel" required></label>' +
      '<label>Child\'s age or programme<select name="programme"><option value="">Not sure yet</option>' + progs.map(function (x) { return '<option value="' + esc(x.name) + '">' + esc(x.name) + " (" + esc(x.age) + ")</option>"; }).join("") + "</select></label>" +
      '<label>Your message<textarea name="message" rows="4"></textarea></label>' +
      '<p class="form-err" role="alert" hidden>Please add your name and phone number.</p>' +
      '<div class="btn-row"><button class="btn btn--green" type="button" data-send="wa"><span>Send on WhatsApp</span>' + icon("whatsapp") + '</button><button class="btn btn--purple" type="button" data-send="mail"><span>Send by email</span>' + icon("mail") + "</button></div>" +
      '<p class="fine">We do not store form data on this website.</p></form></div></section>' +
      '<section class="sec sec--tight"><div class="container"><div class="map-card reveal"><div class="map-art" aria-hidden="true">' + deco("pin", "") + '</div><div><h2 class="h3">Find Smart Start on the map</h2><p>' + esc(fmtAddr(s.address, s.city)) + "</p>" +
      (s.mapsUrl ? '<a class="btn btn--primary" href="' + esc(s.mapsUrl) + '" target="_blank" rel="noopener"><span>Get directions on Google Maps</span>' + icon("arrow") + "</a>" : "") + '</div></div></div></section>' +
      HOME.cta(c);
  };

  /* ---------- JSON-LD ---------- */
  function jsonld(c, pid) {
    var s = c.s, url = pageUrl(c, pid), org = {
      "@type": ["Preschool", "EducationalOrganization"], "@id": (c.base || "") + "#organization", name: s.fullName || s.name,
      description: (c.d.seo.structured || {}).description || "", telephone: (s.phones[0] || {}).number ? "+91" + digits(s.phones[0].number) : undefined,
      email: s.email, logo: abs(c, s.logo), image: abs(c, s.logo),
      address: { "@type": "PostalAddress", streetAddress: s.address || undefined, addressLocality: s.city, postalCode: ((s.address || "").match(/\b(\d{6})\b/) || [])[1] || undefined, addressCountry: "IN" },
      sameAs: Object.keys(s.social || {}).map(function (k) { return s.social[k]; }).filter(Boolean)
    };
    if (c.base) org.url = c.base;
    var g = [org,
      { "@type": "WebSite", "@id": (c.base || "") + "#website", name: s.name, url: c.base || undefined, publisher: { "@id": (c.base || "") + "#organization" }, inLanguage: "en-IN" },
      { "@type": "WebPage", "@id": url || undefined, url: url || undefined, name: ((c.d.seo.pages[pid] || {}).title || ""), isPartOf: { "@id": (c.base || "") + "#website" }, about: { "@id": (c.base || "") + "#organization" } }
    ];
    if (pid !== "index") g.push({ "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: pageUrl(c, "index") || undefined },
      { "@type": "ListItem", position: 2, name: PAGE_NAMES[pid], item: url || undefined }] });
    if (pid === "updates" || pid === "index") {
      sortedUpdates(c).filter(function (u) { return u.eventDate; }).forEach(function (u) {
        g.push({ "@type": "Event", name: u.title, description: u.description, startDate: u.eventDate, image: abs(c, u.cover), eventStatus: "https://schema.org/EventScheduled",
          location: { "@type": "Place", name: s.fullName || s.name, address: { "@type": "PostalAddress", addressLocality: s.city, addressCountry: "IN" } }, organizer: { "@id": (c.base || "") + "#organization" } });
      });
    }
    var extra = (c.d.seo.structured || {}).extraJsonLd;
    var json = JSON.stringify({ "@context": "https://schema.org", "@graph": g }).replace(/</g, "\\u003c");
    var out = '<script type="application/ld+json">' + json + "</script>";
    if (extra && extra.trim()) { try { JSON.parse(extra); out += '<script type="application/ld+json">' + extra.replace(/</g, "\\u003c") + "</script>"; } catch (e) { /* ignore invalid */ } }
    return out;
  }

  function cssVars(s) {
    var o = s.colors || {}, m = { purple: "--purple", magenta: "--magenta", coral: "--coral", sky: "--sky", yellow: "--yellow", green: "--green", navy: "--navy", cream: "--cream" };
    var css = Object.keys(m).filter(function (k) { return /^#[0-9a-f]{6}$/i.test(o[k] || ""); }).map(function (k) { return m[k] + ":" + o[k]; }).join(";");
    return css ? ":root{" + css + "}" : "";
  }

  function headTags(c, pid) {
    var s = c.s, seo = (c.d.seo.pages[pid] || {}), url = seo.canonical || pageUrl(c, pid);
    var title = seo.title || (PAGE_NAMES[pid] + " | " + s.name), desc = seo.description || "";
    var ogimg = abs(c, seo.ogImage), pre = c.prefix || "";
    var h = '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
      "<title>" + esc(title) + '</title><meta name="description" content="' + esc(desc) + '">' +
      '<meta name="robots" content="' + esc(seo.robots || "index,follow") + '">' +
      (url ? '<link rel="canonical" href="' + esc(url) + '">' : "") +
      '<meta property="og:type" content="website"><meta property="og:site_name" content="' + esc(s.name) + '"><meta property="og:locale" content="en_IN">' +
      '<meta property="og:title" content="' + esc(seo.ogTitle || title) + '"><meta property="og:description" content="' + esc(seo.ogDescription || desc) + '">' +
      (url ? '<meta property="og:url" content="' + esc(url) + '">' : "") + (ogimg ? '<meta property="og:image" content="' + esc(ogimg) + '">' : "") +
      '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(seo.ogTitle || title) + '"><meta name="twitter:description" content="' + esc(seo.ogDescription || desc) + '">' +
      (ogimg ? '<meta name="twitter:image" content="' + esc(ogimg) + '">' : "") +
      '<meta name="theme-color" content="#6D2FA0"><link rel="icon" href="' + esc(src(c, s.favicon || "assets/logos/favicon-32.png")) + '"><link rel="icon" href="' + pre + 'favicon.ico" sizes="any"><link rel="apple-touch-icon" href="' + pre + 'assets/logos/favicon-180.png">' +
      '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800&display=swap">' +
      '<link rel="stylesheet" href="' + pre + 'css/style.css"><link rel="stylesheet" href="' + pre + 'css/animations.css"><link rel="stylesheet" href="' + pre + 'css/responsive.css">' +
      (cssVars(s) ? '<style id="brand-vars">' + cssVars(s) + "</style>" : "") +
      "<script>document.documentElement.classList.add('js')</script>" + jsonld(c, pid);
    return h;
  }

  function fnv(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  function contentHash(data) {
    var keys = ["settings", "homepage", "about", "philosophy", "programmes", "gallery", "updates", "centres", "testimonials", "seo", "media"];
    return fnv(keys.map(function (k) { return JSON.stringify(data[k] || null); }).join("|"));
  }

  function renderParts(c, pid) {
    return { header: header(c, pid), main: (PAGES[pid] || function () { return ""; })(c), footer: footer(c), float: floating(c) };
  }

  function renderPage(data, pid, opt) {
    var c = makeCtx(data, opt), parts = renderParts(c, pid);
    var pre = c.prefix || "";
    return "<!DOCTYPE html>\n<html lang=\"en\"><head>" + headTags(c, pid) + "</head>\n<body class=\"page-" + pid + '" data-page="' + pid + '" data-hash="' + contentHash(data) + '">\n' +
      '<a class="skip" href="#main">Skip to content</a>\n' + sprite() +
      '\n<header class="site-header" id="site-header">' + parts.header + "</header>\n" +
      '<main id="main" tabindex="-1">' + parts.main + "</main>\n" +
      '<footer class="site-footer" id="site-footer">' + parts.footer + "</footer>\n" +
      '<div id="site-float">' + parts.float + "</div>\n" +
      '<script src="' + pre + 'js/seed-data.js"></script><script src="' + pre + 'js/render.js"></script><script src="' + pre + 'js/animations.js"></script><script src="' + pre + 'js/navigation.js"></script><script src="' + pre + 'js/gallery.js"></script><script src="' + pre + 'js/content-loader.js"></script><script src="' + pre + 'js/main.js"></script>\n</body></html>\n';
  }

  function sitemap(data, base) {
    var c = makeCtx(data, { siteUrl: base });
    if (!c.base) return "";
    var today = new Date().toISOString().slice(0, 10);
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      Object.keys(FILES).filter(function (k) { return ((data.seo.pages[k] || {}).robots || "index").indexOf("noindex") < 0; }).map(function (k) {
        return "  <url><loc>" + esc(pageUrl(c, k)) + "</loc><lastmod>" + today + "</lastmod><priority>" + (k === "index" ? "1.0" : "0.8") + "</priority></url>";
      }).join("\n") + "\n</urlset>\n";
  }

  return { FILES: FILES, PAGE_NAMES: PAGE_NAMES, makeCtx: makeCtx, renderPage: renderPage, renderParts: renderParts, headTags: headTags,
    contentHash: contentHash, sitemap: sitemap, esc: esc, fmtDate: fmtDate, longDate: longDate, slug: slug, digits: digits,
    sortedUpdates: sortedUpdates, visibleProgrammes: visibleProgrammes, visibleGallery: visibleGallery, publishedTestimonials: publishedTestimonials };
});
