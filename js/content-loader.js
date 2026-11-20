/* Loads the JSON content and, when it differs from the HTML baked in at build time, re-renders the page.
 * Static HTML stays the SEO source of truth; this only refreshes it (e.g. right after publishing, before the
 * GitHub Action finishes) and powers the admin "Preview draft" mode (localStorage draft + IndexedDB images). */
(function () {
  "use strict";
  window.SS = window.SS || {};
  var FILES = {
    settings: "site-settings", homepage: "homepage", about: "about", philosophy: "philosophy", programmes: "programmes",
    gallery: "gallery", updates: "updates", centres: "centres", testimonials: "testimonials", seo: "seo", media: "media"
  };
  var DRAFT_KEY = "ss_draft_v22", PREVIEW_KEY = "ss_preview";

  function isPreview() {
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("preview") === "1") sessionStorage.setItem(PREVIEW_KEY, "1");
      if (q.get("preview") === "0") sessionStorage.removeItem(PREVIEW_KEY);
      return sessionStorage.getItem(PREVIEW_KEY) === "1";
    } catch (e) { return false; }
  }
  function getDraft() {
    try { var d = JSON.parse(localStorage.getItem(DRAFT_KEY)); return d && d.files ? d.files : null; } catch (e) { return null; }
  }
  function fetchJSON(name) {
    if (location.protocol === "file:" && window.SS_SEED_DATA && window.SS_SEED_DATA[name]) {
      return Promise.resolve(JSON.parse(JSON.stringify(window.SS_SEED_DATA[name])));
    }
    return fetch("data/" + name + ".json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(name + " " + r.status);
      return r.json();
    }).catch(function (err) {
      if (window.SS_SEED_DATA && window.SS_SEED_DATA[name]) {
        return JSON.parse(JSON.stringify(window.SS_SEED_DATA[name]));
      }
      throw err;
    });
  }
  function openDB() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open("ss-media", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("files"); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
  }
  function idbBlobUrls(text) {
    var ids = {}; (text.match(/idb:[A-Za-z0-9_\-]+/g) || []).forEach(function (m) { ids[m] = 1; });
    var keys = Object.keys(ids); if (!keys.length) return Promise.resolve({});
    return openDB().then(function (db) {
      return Promise.all(keys.map(function (k) {
        return new Promise(function (res) {
          var rq = db.transaction("files").objectStore("files").get(k.slice(4));
          rq.onsuccess = function () { res([k, rq.result && rq.result.blob ? URL.createObjectURL(rq.result.blob) : ""]); };
          rq.onerror = function () { res([k, ""]); };
        });
      }));
    }).then(function (pairs) { var m = {}; pairs.forEach(function (p) { if (p[1]) m[p[0]] = p[1]; }); return m; }).catch(function () { return {}; });
  }

  function load(preview) {
    var draft = preview ? getDraft() : null;
    return Promise.all(Object.keys(FILES).map(function (k) {
      if (draft && draft[FILES[k]]) return Promise.resolve(draft[FILES[k]]);
      return fetchJSON(FILES[k]);
    })).then(function (arr) {
      var d = {}; Object.keys(FILES).forEach(function (k, i) { d[k] = arr[i]; }); return d;
    });
  }

  function apply(data, hash) {
    var pid = document.body.getAttribute("data-page"), R = window.SSRender;
    if (!R || !pid) return Promise.resolve(false);
    var parts = R.renderParts(R.makeCtx(data, { siteUrl: location.protocol.indexOf("http") === 0 ? "" : "" }), pid);
    var all = parts.header + parts.main + parts.footer + parts.float;
    return idbBlobUrls(JSON.stringify(data)).then(function (map) {
      function fix(s) { return s.replace(/idb:[A-Za-z0-9_\-]+/g, function (m) { return map[m] || m; }); }
      document.getElementById("site-header").innerHTML = fix(parts.header);
      document.getElementById("main").innerHTML = fix(parts.main);
      document.getElementById("site-footer").innerHTML = fix(parts.footer);
      document.getElementById("site-float").innerHTML = fix(parts.float);
      var seo = (data.seo.pages || {})[pid]; if (seo && seo.title) document.title = seo.title;
      var st = document.getElementById("brand-vars"), css = (function () {
        var o = data.settings.colors || {}; return Object.keys(o).filter(function (k) { return /^#[0-9a-f]{6}$/i.test(o[k]); }).map(function (k) { return "--" + k + ":" + o[k]; }).join(";");
      })();
      if (css) { if (!st) { st = document.createElement("style"); st.id = "brand-vars"; document.head.appendChild(st); } st.textContent = ":root{" + css + "}"; }
      document.body.setAttribute("data-hash", hash);
      return true;
    });
  }

  function banner() {
    if (document.getElementById("preview-bar")) return;
    var b = document.createElement("div"); b.id = "preview-bar";
    b.setAttribute("style", "position:fixed;left:0;right:0;bottom:0;z-index:400;background:#1E2250;color:#fff;padding:.6rem 1rem;font:700 .95rem Nunito,sans-serif;display:flex;gap:1rem;justify-content:center;align-items:center;flex-wrap:wrap");
    b.innerHTML = 'Preview of your unpublished draft &nbsp;<a style="color:#FFC83D" href="?preview=0">Exit preview</a> <a style="color:#FFC83D" href="admin/index.html">Back to admin</a>';
    document.body.appendChild(b);
  }

  function run() {
    var preview = isPreview();
    var isLocal = location.protocol === "file:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
    var useDraft = preview || (isLocal && !!getDraft());
    /* On live hosted pages, static HTML is already freshly built on deploy; skip 11 redundant JSON fetches unless previewing drafts. */
    if (!useDraft && !preview && location.protocol.indexOf("http") === 0 && !isLocal) {
      return Promise.resolve(false);
    }
    return load(useDraft).then(function (data) {
      var R = window.SSRender, hash = R.contentHash(data), baked = document.body.getAttribute("data-hash");
      if (preview) banner();
      if (!useDraft && hash === baked) return false;
      return apply(data, hash);
    }).catch(function (e) { if (window.console) console.warn("Content refresh skipped:", e.message); return false; });
  }

  SS.loader = { run: run, DRAFT_KEY: DRAFT_KEY };
})();

