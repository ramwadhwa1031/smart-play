/* Admin data store: published JSON snapshot, local draft (localStorage), media blobs (IndexedDB). No backend. */
(function () {
  "use strict";
  var AS = window.AS = window.AS || {};
  var FILES = { settings: "site-settings", homepage: "homepage", about: "about", philosophy: "philosophy", programmes: "programmes",
    gallery: "gallery", updates: "updates", centres: "centres", testimonials: "testimonials", seo: "seo", media: "media" };
  var LABELS = { settings: "Website settings", homepage: "Homepage", about: "About & principal", philosophy: "Multiple Intelligence", programmes: "Programmes",
    gallery: "Gallery", updates: "Announcements", centres: "Centres", testimonials: "Testimonials", seo: "SEO", media: "Media library" };
  var DRAFT_KEY = "ss_draft_v14", PUB_KEY = "ss_last_publish", CFG_KEY = "ss_gh_config";
  AS.FILES = FILES; AS.LABELS = LABELS; AS.DRAFT_KEY = DRAFT_KEY;
  AS.data = {}; AS.original = {}; AS.deleted = []; AS.urls = {}; AS.listeners = [];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function norm(o) { return JSON.stringify(o); }
  AS.clone = clone;

  /* ---------- IndexedDB ---------- */
  var dbp = null;
  function db() {
    if (!dbp) dbp = new Promise(function (res, rej) {
      var r = indexedDB.open("ss-media", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("files"); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function idbPut(key, val) { return db().then(function (d) { return new Promise(function (res, rej) { var t = d.transaction("files", "readwrite"); t.objectStore("files").put(val, key); t.oncomplete = res; t.onerror = function () { rej(t.error); }; }); }); }
  function idbGet(key) { return db().then(function (d) { return new Promise(function (res) { var r = d.transaction("files").objectStore("files").get(key); r.onsuccess = function () { res(r.result); }; r.onerror = function () { res(null); }; }); }); }
  function idbDel(key) { return db().then(function (d) { return new Promise(function (res) { var t = d.transaction("files", "readwrite"); t.objectStore("files").delete(key); t.oncomplete = res; t.onerror = res; }); }); }
  function idbKeys() { return db().then(function (d) { return new Promise(function (res) { var r = d.transaction("files").objectStore("files").getAllKeys(); r.onsuccess = function () { res(r.result); }; r.onerror = function () { res([]); }; }); }); }
  AS.idbGet = idbGet;

  /* ---------- URL resolution for previews inside admin ---------- */
  AS.url = function (p) {
    if (!p) return "";
    if (/^idb:/.test(p)) return AS.urls[p] || "";
    if (/^(https?:|data:|blob:)/.test(p)) return p;
    return "../" + p;
  };
  function loadBlobUrls() {
    return idbKeys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return idbGet(k).then(function (v) { if (v && v.blob) AS.urls["idb:" + k] = URL.createObjectURL(v.blob); }); }));
    });
  }

  /* ---------- load / save ---------- */
  function seedFor(fileName) {
    var s = window.SS_SEED_DATA && window.SS_SEED_DATA[fileName];
    return s ? clone(s) : null;
  }
  function fetchPublished() {
    if (location.protocol === "file:" && window.SS_SEED_DATA) {
      var o = {};
      Object.keys(FILES).forEach(function (k) { o[k] = seedFor(FILES[k]); });
      return Promise.resolve(o);
    }
    return Promise.all(Object.keys(FILES).map(function (k) {
      var fn = FILES[k];
      return fetch("../data/" + fn + ".json", { cache: "no-cache" }).then(function (r) {
        if (!r.ok) throw new Error(fn + ".json: HTTP " + r.status);
        return r.json();
      }).catch(function (err) {
        var fallback = seedFor(fn);
        if (fallback) return fallback;
        throw err;
      });
    })).then(function (arr) { var o = {}; Object.keys(FILES).forEach(function (k, i) { o[k] = arr[i]; }); return o; });
  }
  AS.load = function () {
    return fetchPublished().then(function (pub) {
      AS.original = pub;
      var draft = null; try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch (e) { /* ignore */ }
      if (draft && draft.files) {
        AS.data = {}; Object.keys(FILES).forEach(function (k) { AS.data[k] = draft.files[FILES[k]] ? draft.files[FILES[k]] : clone(pub[k]); });
        AS.deleted = draft.deleted || [];
        AS.hasDraft = true;
      } else { AS.data = clone(pub); AS.deleted = []; AS.hasDraft = false; }
      return loadBlobUrls();
    });
  };
  AS.changedFiles = function () {
    return Object.keys(FILES).filter(function (k) { return norm(AS.data[k]) !== norm(AS.original[k]); });
  };
  var saveTimer = null;
  AS.save = function () {
    var files = {}; Object.keys(FILES).forEach(function (k) { files[FILES[k]] = AS.data[k]; });
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ files: files, deleted: AS.deleted, updatedAt: new Date().toISOString() })); }
    catch (e) { AS.toast && AS.toast("Could not save draft: browser storage is full. Export a backup now.", "error"); }
    AS.hasDraft = AS.changedFiles().length > 0 || AS.deleted.length > 0;
    AS.emit();
  };
  AS.touch = function () { clearTimeout(saveTimer); saveTimer = setTimeout(AS.save, 250); };
  AS.on = function (fn) { AS.listeners.push(fn); };
  AS.emit = function () { AS.listeners.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } }); };
  AS.discard = function () {
    localStorage.removeItem(DRAFT_KEY); AS.data = clone(AS.original); AS.deleted = []; AS.hasDraft = false; AS.emit();
  };

  /* ---------- last publish record (non-secret) ---------- */
  AS.lastPublish = function () { try { return JSON.parse(localStorage.getItem(PUB_KEY)); } catch (e) { return null; } };
  AS.setLastPublish = function (o) { localStorage.setItem(PUB_KEY, JSON.stringify(o)); };
  AS.getConfig = function () { try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; } catch (e) { return {}; } };
  AS.setConfig = function (c) { localStorage.setItem(CFG_KEY, JSON.stringify({ owner: c.owner, repo: c.repo, branch: c.branch })); };   // never the token

  /* ---------- helpers ---------- */
  AS.uid = function (p) { return (p || "u") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
  AS.slug = function (s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || AS.uid("x"); };
  AS.mediaByPath = function (p) { return (AS.data.media.items || []).filter(function (m) { return m.path === p; })[0] || null; };
  AS.fmtBytes = function (b) { return b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.round(b / 1024) + " KB"; };

  /* ---------- image processing ---------- */
  function toBlob(canvas, q) { return new Promise(function (res) { canvas.toBlob(function (b) { res(b); }, "image/webp", q); }); }
  function resize(bmp, maxSide, q) {
    var s = Math.min(1, maxSide / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * s), h = Math.round(bmp.height * s);
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var ctx = c.getContext("2d"); ctx.imageSmoothingQuality = "high"; ctx.drawImage(bmp, 0, 0, w, h);
    return toBlob(c, q).then(function (b) { return { blob: b, w: w, h: h }; });
  }
  /* Adds a File to the media library. Returns the media item {id,path,thumb,w,h,bytes,...}. */
  AS.addImage = function (file, meta) {
    meta = meta || {};
    if (!/^image\//.test(file.type)) return Promise.reject(new Error(file.name + " is not an image"));
    if (file.size > 40 * 1048576) return Promise.reject(new Error(file.name + " is larger than 40 MB"));
    return createImageBitmap(file).then(function (bmp) {
      return Promise.all([resize(bmp, 1600, .82), resize(bmp, 640, .74)]).then(function (r) {
        if (!r[0].blob) throw new Error("This browser cannot convert images to WebP");
        var id = AS.uid("u");
        return Promise.all([idbPut(id, { blob: r[0].blob }), idbPut(id + "-sm", { blob: r[1].blob })]).then(function () {
          AS.urls["idb:" + id] = URL.createObjectURL(r[0].blob); AS.urls["idb:" + id + "-sm"] = URL.createObjectURL(r[1].blob);
          var label = (file.name || "image").replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
          var item = { id: id, path: "idb:" + id, thumb: "idb:" + id + "-sm", w: r[0].w, h: r[0].h, bytes: r[0].blob.size,
            category: meta.category || "uploads", label: label, alt: meta.alt || label };
          AS.data.media.items.push(item);
          if (AS.data.media.categories.indexOf(item.category) < 0) AS.data.media.categories.push(item.category);
          AS.touch();
          return item;
        });
      });
    });
  };

  /* Replace every reference of one image path with another across all data (used for "replace image"). */
  AS.replaceEverywhere = function (oldPath, oldThumb, nw) {
    function walk(v) {
      if (Array.isArray(v)) return v.map(walk);
      if (v && typeof v === "object") { var o = {}; Object.keys(v).forEach(function (k) { o[k] = walk(v[k]); }); return o; }
      if (v === oldPath) return nw.path; if (oldThumb && v === oldThumb) return nw.thumb; return v;
    }
    Object.keys(FILES).forEach(function (k) { if (k !== "media") AS.data[k] = walk(AS.data[k]); });
    AS.touch();
  };

  /* Where is an image used? */
  AS.usage = function (path) {
    var out = [];
    Object.keys(FILES).forEach(function (k) {
      if (k === "media") return;
      var t = JSON.stringify(AS.data[k]); if (t.indexOf('"' + path + '"') >= 0) out.push(LABELS[k]);
    });
    return out;
  };
  AS.removeMedia = function (id) {
    var items = AS.data.media.items, i = items.findIndex(function (m) { return m.id === id; }); if (i < 0) return;
    var m = items[i]; items.splice(i, 1);
    if (/^idb:/.test(m.path)) { idbDel(m.id); idbDel(m.id + "-sm"); }
    else if (/^assets\/(images|uploads)\//.test(m.path)) { AS.deleted.push(m.path); if (m.thumb) AS.deleted.push(m.thumb); }
    // remove from gallery and unlink elsewhere
    AS.data.gallery.images = AS.data.gallery.images.filter(function (g) { return g.src !== m.path; });
    AS.data.updates.items.forEach(function (u) { u.images = (u.images || []).filter(function (x) { return x !== m.path; }); if (u.cover === m.path) u.cover = u.images[0] || ""; });
    AS.touch();
  };

  /* ---------- backup ---------- */
  AS.exportBackup = function () {
    var files = {}; Object.keys(FILES).forEach(function (k) { files[FILES[k]] = AS.data[k]; });
    var keys = Object.keys(AS.urls).filter(function (u) { return !/-sm$/.test(u); }).map(function (u) { return u.slice(4); });
    return Promise.all(keys.map(function (k) {
      return idbGet(k).then(function (v) { return v && v.blob ? blobToDataUrl(v.blob).then(function (d) { return [k, d]; }) : null; });
    })).then(function (pairs) {
      var imgs = {}; pairs.filter(Boolean).forEach(function (p) { imgs[p[0]] = p[1]; });
      return JSON.stringify({ app: "smart-start-cms", version: 1, exportedAt: new Date().toISOString(), files: files, deleted: AS.deleted, localImages: imgs }, null, 2);
    });
  };
  function blobToDataUrl(b) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(b); }); }
  AS.importBackup = function (text) {
    var j = JSON.parse(text);
    if (j.app !== "smart-start-cms" || !j.files) throw new Error("This is not a Smart Start backup file");
    var next = {};
    Object.keys(FILES).forEach(function (k) { next[k] = j.files[FILES[k]] || AS.data[k]; });
    var imgs = j.localImages || {}, ids = Object.keys(imgs);
    return Promise.all(ids.map(function (id) {
      return fetch(imgs[id]).then(function (r) { return r.blob(); }).then(function (b) { return idbPut(id, { blob: b }).then(function () { AS.urls["idb:" + id] = URL.createObjectURL(b); }); });
    })).then(function () {
      Object.keys(next).forEach(function (k) { AS.data[k] = next[k]; }); AS.deleted = j.deleted || []; AS.save();
    });
  };
  /* Individual JSON file import */
  AS.importJsonFile = function (key, text) { var o = JSON.parse(text); AS.data[key] = o; AS.save(); };

  AS.publishPayload = function () {
    // Returns {files:{name:objWithRealPaths}, uploads:[{id,path}]}
    var uploads = [];
    function fix(s) { return s.replace(/idb:([A-Za-z0-9_\-]+)/g, function (m, id) { if (uploads.indexOf(id) < 0) uploads.push(id); return "assets/uploads/" + id + ".webp"; }); }
    var files = {};
    Object.keys(FILES).forEach(function (k) { files[k] = JSON.parse(fix(JSON.stringify(AS.data[k]))); });
    return { files: files, uploads: uploads };
  };
  AS.applyPublished = function (payload) {
    Object.keys(FILES).forEach(function (k) { AS.data[k] = clone(payload.files[k]); AS.original[k] = clone(payload.files[k]); });
    AS.deleted = []; localStorage.removeItem(DRAFT_KEY); AS.hasDraft = false;
    // map idb urls to the new paths so previews keep working
    payload.uploads.forEach(function (id) { AS.urls["assets/uploads/" + id + ".webp"] = AS.urls["idb:" + id]; });
    AS.emit();
  };
  var oldUrl = AS.url;
  AS.url = function (p) { if (p && AS.urls[p]) return AS.urls[p]; return oldUrl(p); };
})();

