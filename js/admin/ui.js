/* Admin UI helpers: element builder, toasts, modals, form fields, media picker. */
(function () {
  "use strict";
  var AS = window.AS;

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k]; if (v == null || v === false) return;
      if (k === "class") n.className = v; else if (k === "html") n.innerHTML = v; else if (k === "text") n.textContent = v;
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v); else if (k === "value") n.value = v;
      else n.setAttribute(k, v === true ? "" : v);
    });
    (Array.isArray(kids) ? kids : kids != null ? [kids] : []).forEach(function (c) { if (c == null || c === false) return; n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  AS.el = el;
  AS.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };

  /* ---------- toasts ---------- */
  AS.toast = function (msg, kind) {
    var box = document.getElementById("toasts"); if (!box) return;
    var t = el("div", { class: "toast " + (kind || "ok"), role: kind === "error" ? "alert" : "status", text: msg });
    box.appendChild(t); setTimeout(function () { t.classList.add("out"); setTimeout(function () { t.remove(); }, 400); }, kind === "error" ? 7000 : 3200);
  };

  /* ---------- modal ---------- */
  AS.modal = function (title, body, buttons, opts) {
    opts = opts || {};
    var prev = document.activeElement;
    var overlay = el("div", { class: "modal-overlay" });
    var box = el("div", { class: "modal " + (opts.wide ? "modal--wide" : ""), role: "dialog", "aria-modal": "true", "aria-label": title });
    var close = function (val) { overlay.remove(); document.removeEventListener("keydown", onKey); if (prev && prev.focus) prev.focus(); if (opts.onClose) opts.onClose(val); };
    var onKey = function (e) { if (e.key === "Escape") close(null); };
    document.addEventListener("keydown", onKey);
    box.appendChild(el("div", { class: "modal__head" }, [el("h2", { text: title }), el("button", { class: "icon-btn", type: "button", "aria-label": "Close", html: "&times;", onclick: function () { close(null); } })]));
    var bd = el("div", { class: "modal__body" }, body); box.appendChild(bd);
    if (buttons && buttons.length) box.appendChild(el("div", { class: "modal__foot" }, buttons.map(function (b) {
      return el("button", { class: "btn " + (b.cls || ""), type: "button", text: b.label, onclick: function () { var r = b.onClick ? b.onClick(close) : undefined; if (r !== false && !b.keepOpen) close(b.value); } });
    })));
    overlay.appendChild(box); overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) close(null); });
    document.body.appendChild(overlay);
    var f = box.querySelector("input,textarea,select,button.btn"); if (f) f.focus();
    return { close: close, box: box, body: bd };
  };
  AS.confirm = function (title, msg, okLabel, danger) {
    return new Promise(function (res) {
      AS.modal(title, el("p", { text: msg }), [{ label: "Cancel", value: false, cls: "btn--ghost" }, { label: okLabel || "OK", value: true, cls: danger ? "btn--danger" : "btn--primary" }], { onClose: function (v) { res(v === true); } });
    });
  };

  /* ---------- form fields ---------- */
  function getPath(obj, path) { var o = obj; (path || "").split(".").filter(Boolean).forEach(function (k) { if (o != null) o = o[k]; }); return o; }
  AS.getPath = getPath;
  function field(label, input, hint) {
    return el("label", { class: "field" }, [el("span", { class: "field__l", text: label }), input, hint ? el("small", { class: "field__h", text: hint }) : null]);
  }
  var F = AS.F = {};
  F.text = function (label, obj, key, o) {
    o = o || {};
    return field(label, el("input", { type: o.type || "text", value: obj[key] == null ? "" : obj[key], placeholder: o.placeholder || "", maxlength: o.max, oninput: function (e) { obj[key] = e.target.value; AS.touch(); if (o.onChange) o.onChange(e.target.value); } }), o.hint);
  };
  F.area = function (label, obj, key, o) {
    o = o || {};
    var ta = el("textarea", { rows: o.rows || 4, oninput: function (e) { obj[key] = e.target.value; AS.touch(); } }); ta.value = obj[key] == null ? "" : obj[key];
    return field(label, ta, o.hint);
  };
  F.lines = function (label, obj, key, o) {   // string[] <-> one per line
    o = o || {};
    var ta = el("textarea", { rows: o.rows || 4, oninput: function (e) { obj[key] = e.target.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean); AS.touch(); } });
    ta.value = (obj[key] || []).join("\n");
    return field(label, ta, o.hint || "One item per line");
  };
  F.paras = function (label, obj, key, o) {   // string[] <-> paragraphs separated by blank line
    var ta = el("textarea", { rows: (o && o.rows) || 8, oninput: function (e) { obj[key] = e.target.value.split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean); AS.touch(); } });
    ta.value = (obj[key] || []).join("\n\n");
    return field(label, ta, "Separate paragraphs with a blank line");
  };
  F.check = function (label, obj, key, o) {
    return el("label", { class: "check" }, [el("input", { type: "checkbox", checked: obj[key] !== false && !!obj[key], onchange: function (e) { obj[key] = e.target.checked; AS.touch(); if (o && o.onChange) o.onChange(e.target.checked); } }), el("span", { text: label })]);
  };
  F.select = function (label, obj, key, options, o) {
    var s = el("select", { onchange: function (e) { obj[key] = e.target.value; AS.touch(); if (o && o.onChange) o.onChange(e.target.value); } },
      options.map(function (op) { var v = typeof op === "string" ? op : op.value, l = typeof op === "string" ? op : op.label; return el("option", { value: v, text: l }); }));
    s.value = obj[key] == null ? "" : obj[key];
    return field(label, s, o && o.hint);
  };
  F.number = function (label, obj, key, o) {
    o = o || {};
    return field(label, el("input", { type: "number", value: obj[key] == null ? "" : obj[key], min: o.min, max: o.max, oninput: function (e) { var v = parseFloat(e.target.value); obj[key] = isNaN(v) ? 0 : v; AS.touch(); } }), o.hint);
  };
  F.color = function (label, obj, key) {
    var v = /^#[0-9a-f]{6}$/i.test(obj[key] || "") ? obj[key] : "#000000";
    return field(label, el("input", { type: "color", value: v, oninput: function (e) { obj[key] = e.target.value; AS.touch(); } }));
  };
  /* image field: preview + choose/upload + alt text */
  F.image = function (label, obj, key, o) {
    o = o || {};
    var prev = el("img", { class: "imgf__prev", alt: "", src: AS.url(obj[key]) || "" });
    var name = el("span", { class: "imgf__name", text: obj[key] || "No image selected" });
    function set(item) { obj[key] = item.path; if (o.thumbKey) obj[o.thumbKey] = item.thumb; if (o.dims) { obj.w = item.w; obj.h = item.h; }
      if (o.altKey && !obj[o.altKey]) obj[o.altKey] = item.alt || item.label; prev.src = AS.url(item.path); name.textContent = item.path; AS.touch(); if (o.onChange) o.onChange(item); }
    var wrap = el("div", { class: "field imgf" }, [
      el("span", { class: "field__l", text: label }),
      el("div", { class: "imgf__row" }, [
        el("div", { class: "imgf__box" }, prev),
        el("div", { class: "imgf__side" }, [name,
          el("div", { class: "row" }, [el("button", { class: "btn btn--sm", type: "button", text: "Choose / upload", onclick: function () { AS.pickImage(false).then(function (items) { if (items && items[0]) set(items[0]); }); } }),
            o.clearable ? el("button", { class: "btn btn--sm btn--ghost", type: "button", text: "Remove", onclick: function () { obj[key] = ""; prev.removeAttribute("src"); name.textContent = "No image selected"; AS.touch(); } }) : null])])]),
    ]);
    if (o.altKey) wrap.appendChild(F.text("Alt text (describes the image for search engines and screen readers)", obj, o.altKey));
    return wrap;
  };

  /* ---------- upload helpers ---------- */
  AS.uploadFiles = function (files, meta) {
    var list = [].slice.call(files), done = [], errs = [];
    var bar = el("div", { class: "progress" }, el("i")); var toast = el("div", { class: "toast ok", text: "Processing images… " }); toast.appendChild(bar);
    document.getElementById("toasts").appendChild(toast);
    return list.reduce(function (p, f, i) {
      return p.then(function () {
        bar.firstChild.style.width = Math.round((i / list.length) * 100) + "%";
        return AS.addImage(f, meta).then(function (it) { done.push(it); }).catch(function (e) { errs.push(e.message); });
      });
    }, Promise.resolve()).then(function () {
      toast.remove();
      if (errs.length) AS.toast(errs.join("; "), "error");
      if (done.length) AS.toast(done.length + " image" + (done.length > 1 ? "s" : "") + " added (saved in your local draft)");
      return done;
    });
  };

  /* ---------- media picker modal ---------- */
  AS.pickImage = function (multiple) {
    return new Promise(function (resolve) {
      var chosen = [], q = "", cat = "all";
      var grid = el("div", { class: "pick-grid" });
      var file = el("input", { type: "file", accept: "image/*", multiple: true, hidden: true, onchange: function (e) { AS.uploadFiles(e.target.files, {}).then(function (items) { items.forEach(function (it) { toggle(it, true); }); draw(); if (!multiple && items[0]) m.close(chosen); }); } });
      function toggle(it, force) {
        var i = chosen.findIndex(function (c) { return c.path === it.path; });
        if (!multiple) { chosen = [it]; return; }
        if (i >= 0 && !force) chosen.splice(i, 1); else if (i < 0) chosen.push(it);
      }
      function draw() {
        grid.innerHTML = "";
        var items = AS.data.media.items.filter(function (m) { return (cat === "all" || m.category === cat) && (!q || (m.label + " " + m.alt + " " + m.id).toLowerCase().indexOf(q) >= 0); }).slice().reverse();
        if (!items.length) grid.appendChild(el("p", { class: "muted", text: "No images found. Upload some!" }));
        items.forEach(function (it) {
          var sel = chosen.some(function (c) { return c.path === it.path; });
          grid.appendChild(el("button", { type: "button", class: "pick" + (sel ? " is-sel" : ""), title: it.label, onclick: function () { toggle(it); if (!multiple) { m.close(chosen); return; } draw(); } },
            [el("img", { src: AS.url(it.thumb || it.path), alt: it.alt || "", loading: "lazy" }), el("span", { text: it.label })]));
        });
      }
      var cats = el("select", { onchange: function (e) { cat = e.target.value; draw(); } }, [el("option", { value: "all", text: "All categories" })].concat(AS.data.media.categories.map(function (c) { return el("option", { value: c, text: c }); })));
      var body = el("div", {}, [el("div", { class: "pick-bar" }, [el("input", { type: "search", placeholder: "Search images…", oninput: function (e) { q = e.target.value.toLowerCase(); draw(); } }), cats,
        el("button", { class: "btn btn--primary", type: "button", text: "Upload new", onclick: function () { file.click(); } }), file]), grid]);
      draw();
      var m = AS.modal(multiple ? "Choose images" : "Choose an image", body, multiple ? [{ label: "Cancel", cls: "btn--ghost", value: null }, { label: "Use selected", cls: "btn--primary", value: "ok", keepOpen: true, onClick: function (close) { close(chosen); return false; } }] : [{ label: "Cancel", cls: "btn--ghost" }], { wide: true, onClose: function (v) { resolve(Array.isArray(v) && v.length ? v : null); } });
    });
  };

  /* ---------- generic schema-driven form ---------- */
  /* field defs: {t:'text|area|lines|paras|check|select|color|image|date|number|group|repeat', k:'key', l:'Label', ...} */
  AS.renderFields = function (defs, obj) {
    var frag = document.createDocumentFragment();
    defs.forEach(function (d) {
      var target = d.o ? getPath(obj, d.o) : obj; if (target == null) return;
      var n;
      switch (d.t) {
        case "text": n = F.text(d.l, target, d.k, d); break;
        case "area": n = F.area(d.l, target, d.k, d); break;
        case "lines": n = F.lines(d.l, target, d.k, d); break;
        case "paras": n = F.paras(d.l, target, d.k, d); break;
        case "check": n = F.check(d.l, target, d.k, d); break;
        case "select": n = F.select(d.l, target, d.k, d.options, d); break;
        case "color": n = F.color(d.l, target, d.k); break;
        case "number": n = F.number(d.l, target, d.k, d); break;
        case "date": n = F.text(d.l, target, d.k, { type: "date" }); break;
        case "image": n = F.image(d.l, target, d.k, d); break;
        case "group": n = el("fieldset", { class: "group" }, [el("legend", { text: d.l })].concat([].slice.call(AS.renderFields(d.fields, d.k ? target[d.k] : target).childNodes))); break;
        case "repeat": n = AS.repeater(d, target); break;
        default: n = null;
      }
      if (n) frag.appendChild(n);
    });
    return frag;
  };
  AS.repeater = function (d, parent) {
    var arr = parent[d.k] = parent[d.k] || [];
    var wrap = el("div", { class: "repeat" });
    function draw() {
      wrap.innerHTML = "";
      wrap.appendChild(el("div", { class: "repeat__head" }, [el("strong", { text: d.l }), el("span", { class: "muted", text: arr.length + " item" + (arr.length === 1 ? "" : "s") })]));
      arr.forEach(function (it, i) {
        var title = (typeof it === "string" ? it : (it[d.itemLabel || "title"] || it.name || it.label || it.day || "Item " + (i + 1)));
        var det = el("details", { class: "item" }, [
          el("summary", {}, [el("span", { text: String(title).slice(0, 70) }),
            el("span", { class: "item__acts" }, [
              el("button", { type: "button", class: "icon-btn", title: "Move up", "aria-label": "Move up", html: "&uarr;", disabled: i === 0, onclick: function (e) { e.preventDefault(); move(i, -1); } }),
              el("button", { type: "button", class: "icon-btn", title: "Move down", "aria-label": "Move down", html: "&darr;", disabled: i === arr.length - 1, onclick: function (e) { e.preventDefault(); move(i, 1); } }),
              d.noDelete ? null : el("button", { type: "button", class: "icon-btn icon-btn--danger", title: "Delete", "aria-label": "Delete", html: "&times;", onclick: function (e) { e.preventDefault(); AS.confirm("Delete item", "Delete this item?", "Delete", true).then(function (ok) { if (ok) { arr.splice(i, 1); AS.touch(); draw(); } }); } })])]),
          el("div", { class: "item__body" }, [].slice.call(AS.renderFields(d.fields, it).childNodes))]);
        wrap.appendChild(det);
      });
      if (!d.noAdd) wrap.appendChild(el("button", { type: "button", class: "btn btn--sm", text: "+ Add " + (d.single || "item"), onclick: function () { arr.push(JSON.parse(JSON.stringify(d.add || {}))); AS.touch(); draw(); var all = wrap.querySelectorAll("details.item"); all[all.length - 1].open = true; } }));
    }
    function move(i, dir) { var j = i + dir; if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; AS.touch(); draw(); }
    draw(); return wrap;
  };

  /* panel card */
  AS.card = function (title, body, actions) {
    return el("section", { class: "card" }, [el("div", { class: "card__head" }, [el("h2", { text: title }), actions ? el("div", { class: "row" }, actions) : null]), el("div", { class: "card__body" }, body)]);
  };
  AS.btn = function (label, cls, fn, attrs) { return el("button", Object.assign({ type: "button", class: "btn " + (cls || ""), text: label, onclick: fn }, attrs || {})); };
  AS.dropzone = function (onFiles, label) {
    var input = el("input", { type: "file", accept: "image/*", multiple: true, hidden: true, onchange: function (e) { onFiles(e.target.files); e.target.value = ""; } });
    var dz = el("div", { class: "dropzone", tabindex: "0", role: "button", "aria-label": label || "Upload images", onclick: function () { input.click(); }, onkeydown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } } },
      [el("strong", { text: label || "Drop images here or click to upload" }), el("span", { text: "JPG, PNG, WebP or HEIC-converted images · multiple files allowed · resized to WebP automatically" }), input]);
    ["dragenter", "dragover"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("over"); }); });
    dz.addEventListener("drop", function (e) { onFiles(e.dataTransfer.files); });
    return dz;
  };
})();

