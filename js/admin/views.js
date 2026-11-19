/* Admin views: dashboard, content, updates, gallery, programmes, people, testimonials, centres, seo, media, settings, publish. */
(function () {
  "use strict";
  var AS = window.AS, el = AS.el, F = AS.F;
  var V = AS.views = {};
  var COLORS = ["purple", "magenta", "coral", "sky", "yellow", "green"];
  var ICONS = ["book", "calc", "palette", "run", "music", "people", "heart", "leaf", "brain", "hand", "nolock", "globe", "shield", "star", "mic"];

  /* ---------- shared bits ---------- */
  function head(title, sub, actions) {
    return el("div", { class: "view-head" }, [el("div", {}, [el("h1", { text: title }), sub ? el("p", { class: "muted", text: sub }) : null]), actions ? el("div", { class: "row" }, actions) : null]);
  }
  function renumber(arr) { arr.forEach(function (x, i) { x.order = i + 1; }); }
  function swap(arr, i, j) { if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  function thumb(path, cls) { return el("img", { class: cls || "thumb", src: AS.url(path) || "", alt: "", loading: "lazy" }); }
  function badge(text, kind) { return el("span", { class: "badge badge--" + (kind || "grey"), text: text }); }
  function accordion(title, body, open) { var d = el("details", { class: "acc" }, [el("summary", { text: title }), el("div", { class: "acc__body" }, body)]); if (open) d.open = true; return d; }
  function fieldsNode(defs, obj) { return [].slice.call(AS.renderFields(defs, obj).childNodes); }
  var LINK_HINT = "A page (e.g. programmes.html), a full URL, or the words whatsapp / tel";
  var HL_HINT = "Wrap words in [[double square brackets]] to highlight them";

  /* =============== DASHBOARD =============== */
  V.dashboard = function (root) {
    var d = AS.data, ups = d.updates.items, pub = ups.filter(function (u) { return u.published; });
    var gal = d.gallery.images, vis = gal.filter(function (g) { return g.visible !== false; });
    var tes = d.testimonials.items, tpub = tes.filter(function (t) { return t.published; });
    var changed = AS.changedFiles(), lp = AS.lastPublish();
    var stat = function (n, l, href, c) { return el("a", { class: "stat c-" + c, href: href }, [el("b", { text: String(n) }), el("span", { text: l })]); };
    root.appendChild(head("Dashboard", "Welcome back! Here is the state of the Smart Start website."));
    root.appendChild(el("div", { class: "stats" }, [
      stat(pub.length, "Published updates (" + ups.length + " total)", "#/updates", "magenta"),
      stat(vis.length, "Gallery images (" + gal.length + " uploaded)", "#/gallery", "purple"),
      stat(d.programmes.items.length, "Programmes", "#/programmes", "green"),
      stat(tpub.length, "Published testimonials (" + tes.length + " total)", "#/testimonials", "sky")]));
    var status = changed.length || AS.deleted.length
      ? el("div", {}, [badge("Unpublished changes", "warn"), el("p", { text: "These sections differ from the live website: " + changed.map(function (k) { return AS.LABELS[k]; }).join(", ") + (AS.deleted.length ? " · " + AS.deleted.length + " image file(s) will be deleted" : "") + "." }),
        el("div", { class: "row" }, [AS.btn("Preview draft", "", function () { window.open("../index.html?preview=1", "_blank"); }), el("a", { class: "btn btn--primary", href: "#/publish", text: "Publish changes" })])])
      : el("div", {}, [badge("In sync", "ok"), el("p", { text: "Your admin data matches the published website." })]);
    var lastSite = el("span", { text: location.protocol === "file:" ? "Local file mode (ready)" : "checking…" });
    if (location.protocol !== "file:") {
      fetch("../data/updates.json", { method: "HEAD", cache: "no-cache" }).then(function (r) { var lm = r.headers.get("last-modified"); lastSite.textContent = lm ? new Date(lm).toLocaleString() : "ready"; }).catch(function () { lastSite.textContent = "ready"; });
    }
    root.appendChild(el("div", { class: "grid-2" }, [
      AS.card("Website content status", status),
      AS.card("Last published", [el("p", {}, [el("strong", { text: "From this browser: " }), el("span", { text: lp ? new Date(lp.at).toLocaleString() + " → " + lp.repo + " (" + lp.branch + ")" : "Nothing published from this browser yet" })]),
        el("p", {}, [el("strong", { text: "Website data last modified (server): " }), lastSite])])]));
    var qa = [["Add an update", "#/updates/new"], ["Upload gallery photos", "#/gallery"], ["Edit homepage text", "#/content"], ["Manage programmes", "#/programmes"], ["Edit principal's message", "#/people"], ["Open media library", "#/media"], ["SEO settings", "#/seo"]];
    root.appendChild(AS.card("Quick actions", el("div", { class: "qa" }, qa.map(function (q) { return el("a", { class: "btn", href: q[1], text: q[0] }); }).concat([AS.btn("Preview draft site", "btn--ghost", function () { window.open("../index.html?preview=1", "_blank"); })]))));
    var secs = d.homepage.sections;
    root.appendChild(AS.card("Homepage sections", el("div", { class: "chips" }, secs.map(function (s) { return el("span", { class: "chip2 " + (s.visible === false ? "off" : "on"), text: s.label + (s.visible === false ? " (hidden)" : "") }); }))));
  };

  /* =============== CONTENT =============== */
  var HOME_BLOCKS = [
    { title: "Hero (top of homepage)", f: [
      { t: "text", o: "hero", k: "eyebrow", l: "Small label above heading" }, { t: "area", o: "hero", k: "title", l: "Main heading", rows: 2, hint: HL_HINT }, { t: "area", o: "hero", k: "subtitle", l: "Description", rows: 3 },
      { t: "group", l: "Button 1", o: "hero", k: "cta1", fields: [{ t: "text", k: "label", l: "Label" }, { t: "text", k: "link", l: "Link", hint: LINK_HINT }] },
      { t: "group", l: "Button 2", o: "hero", k: "cta2", fields: [{ t: "text", k: "label", l: "Label" }, { t: "text", k: "link", l: "Link", hint: LINK_HINT }] },
      { t: "text", o: "hero", k: "badge", l: "Rotating badge text" },
      { t: "repeat", o: "hero", k: "images", l: "Hero photos (3 are shown)", single: "photo", itemLabel: "alt", add: { src: "", alt: "" }, fields: [{ t: "image", k: "src", l: "Photo", altKey: "alt" }] }] },
    { title: "Highlights marquee", f: [
      { t: "lines", o: "marquee", k: "highlights", l: "School highlights" }, { t: "lines", o: "marquee", k: "programmes", l: "Programme names (leave empty to use your programmes)" },
      { t: "lines", o: "marquee", k: "announcements", l: "Important announcements (the band is hidden when empty)" }] },
    { title: "School introduction", f: [
      { t: "text", o: "intro", k: "eyebrow", l: "Label" }, { t: "area", o: "intro", k: "title", l: "Heading", rows: 2, hint: HL_HINT }, { t: "area", o: "intro", k: "text", l: "Text", rows: 4 }, { t: "lines", o: "intro", k: "points", l: "Bullet points" },
      { t: "repeat", o: "intro", k: "images", l: "Photos (2 are shown)", single: "photo", itemLabel: "alt", add: { src: "", alt: "" }, fields: [{ t: "image", k: "src", l: "Photo", altKey: "alt" }] }] },
    { title: "Multiple Intelligence teaser", f: [{ t: "text", o: "mi", k: "eyebrow", l: "Label" }, { t: "area", o: "mi", k: "title", l: "Heading", rows: 2, hint: HL_HINT }, { t: "area", o: "mi", k: "text", l: "Text", rows: 3 }] },
    { title: "Why Smart Start?", f: [{ t: "text", o: "why", k: "eyebrow", l: "Label" }, { t: "text", o: "why", k: "title", l: "Heading" },
      { t: "repeat", o: "why", k: "items", l: "Pillars", single: "pillar", add: { icon: "star", title: "", text: "" }, fields: [{ t: "select", k: "icon", l: "Icon", options: ICONS }, { t: "text", k: "title", l: "Title" }, { t: "area", k: "text", l: "Text", rows: 2 }] }] },
    { title: "Learning philosophy quote band", f: [{ t: "text", o: "philosophy", k: "eyebrow", l: "Label" }, { t: "area", o: "philosophy", k: "title", l: "Quote", rows: 3 }, { t: "area", o: "philosophy", k: "text", l: "Supporting text", rows: 2 }, { t: "text", o: "philosophy", k: "attribution", l: "Attribution" }] },
    { title: "Programmes teaser", f: [{ t: "text", o: "programmes", k: "eyebrow", l: "Label" }, { t: "area", o: "programmes", k: "title", l: "Heading", rows: 2, hint: HL_HINT }, { t: "area", o: "programmes", k: "text", l: "Text", rows: 2 }] },
    { title: "Learning environment", f: [{ t: "text", o: "environment", k: "eyebrow", l: "Label" }, { t: "area", o: "environment", k: "title", l: "Heading", rows: 2, hint: HL_HINT }, { t: "area", o: "environment", k: "text", l: "Text", rows: 3 },
      { t: "repeat", o: "environment", k: "images", l: "Photos (4 are shown)", single: "photo", itemLabel: "caption", add: { src: "", alt: "", caption: "" }, fields: [{ t: "image", k: "src", l: "Photo", altKey: "alt" }, { t: "text", k: "caption", l: "Caption" }] }] },
    { title: "Latest updates & gallery preview headings", f: [
      { t: "text", o: "updates", k: "eyebrow", l: "Updates label" }, { t: "area", o: "updates", k: "title", l: "Updates heading", rows: 2, hint: HL_HINT }, { t: "area", o: "updates", k: "text", l: "Updates text", rows: 2 }, { t: "number", o: "updates", k: "count", l: "Number of updates shown (3-6)" },
      { t: "text", o: "gallery", k: "eyebrow", l: "Gallery label" }, { t: "area", o: "gallery", k: "title", l: "Gallery heading", rows: 2, hint: HL_HINT }, { t: "area", o: "gallery", k: "text", l: "Gallery text", rows: 2 }, { t: "number", o: "gallery", k: "count", l: "Number of photos shown" }] },
    { title: "Instagram Reels carousel", f: [
      { t: "text", o: "reels", k: "eyebrow", l: "Badge label" }, { t: "area", o: "reels", k: "title", l: "Heading", rows: 2, hint: HL_HINT }, { t: "area", o: "reels", k: "text", l: "Description", rows: 2 },
      { t: "text", o: "reels", k: "profileUrl", l: "Instagram Reels profile URL" }, { t: "text", o: "reels", k: "handle", l: "Instagram handle" }, { t: "text", o: "reels", k: "buttonLabel", l: "Bottom button label" },
      { t: "repeat", o: "reels", k: "items", l: "Reel cards", single: "reel", itemLabel: "title", add: { title: "New Reel", tag: "Classroom Reel", thumb: "", url: "https://www.instagram.com/smart_start_the_premium_school/reels/" },
        fields: [{ t: "text", k: "title", l: "Title / caption" }, { t: "text", k: "tag", l: "Category tag" }, { t: "image", k: "thumb", l: "Thumbnail image" }, { t: "text", k: "url", l: "Instagram Reel URL" }] }] },
    { title: "Principal teaser (text comes from People)", f: [{ t: "text", o: "principal", k: "eyebrow", l: "Label" }, { t: "text", o: "principal", k: "title", l: "Heading (quote)" }, { t: "text", o: "principal", o2: "button", k: "label", l: "Button label" }] },
    { title: "Testimonials heading", f: [{ t: "text", o: "testimonials", k: "eyebrow", l: "Label" }, { t: "text", o: "testimonials", k: "title", l: "Heading" }] },
    { title: "Enquiry call-to-action band", f: [{ t: "area", o: "cta", k: "title", l: "Heading", rows: 2, hint: HL_HINT }, { t: "area", o: "cta", k: "text", l: "Text", rows: 2 },
      { t: "group", l: "Button 1", o: "cta", k: "cta1", fields: [{ t: "text", k: "label", l: "Label" }, { t: "text", k: "link", l: "Link", hint: LINK_HINT }] },
      { t: "group", l: "Button 2", o: "cta", k: "cta2", fields: [{ t: "text", k: "label", l: "Label" }, { t: "text", k: "link", l: "Link", hint: LINK_HINT }] }] },
    { title: "Contact information heading", f: [{ t: "text", o: "contact", k: "eyebrow", l: "Label" }, { t: "text", o: "contact", k: "title", l: "Heading", hint: HL_HINT }, { t: "area", o: "contact", k: "text", l: "Subtitle", rows: 2 }] }
  ];
  var ABOUT_BLOCKS = [
    { title: "Our story", f: [{ t: "text", o: "story", k: "eyebrow", l: "Label" }, { t: "area", o: "story", k: "title", l: "Heading", rows: 2, hint: HL_HINT }, { t: "paras", o: "story", k: "paragraphs", l: "Story" }, { t: "image", o: "story.image", k: "src", l: "Photo", altKey: "alt" }] },
    { title: "Vision", f: [{ t: "text", o: "vision", k: "eyebrow", l: "Label" }, { t: "area", o: "vision", k: "title", l: "Heading", rows: 2 }, { t: "area", o: "vision", k: "official", l: "Vision statement", rows: 5 }, { t: "text", o: "vision", k: "short", l: "Short vision line" }, { t: "text", o: "vision", k: "motto", l: "Motto" }] },
    { title: "Our promises (mission)", f: [{ t: "text", o: "promises", k: "eyebrow", l: "Label" }, { t: "text", o: "promises", k: "title", l: "Heading" }, { t: "repeat", o: "promises", k: "items", l: "Promises", single: "promise", add: { title: "", text: "" }, fields: [{ t: "text", k: "title", l: "Title" }, { t: "area", k: "text", l: "Text", rows: 3 }] }] },
    { title: "Learning approach", f: [{ t: "text", o: "approach", k: "eyebrow", l: "Label" }, { t: "text", o: "approach", k: "title", l: "Heading" }, { t: "repeat", o: "approach", k: "items", l: "Approach points", single: "point", add: { icon: "star", title: "", text: "" }, fields: [{ t: "select", k: "icon", l: "Icon", options: ICONS }, { t: "text", k: "title", l: "Title" }, { t: "area", k: "text", l: "Text", rows: 2 }] }] },
    { title: "Values", f: [{ t: "text", o: "values", k: "eyebrow", l: "Label" }, { t: "text", o: "values", k: "title", l: "Heading" }, { t: "repeat", o: "values", k: "items", l: "Values", single: "value", add: { title: "", text: "", color: "purple" }, fields: [{ t: "text", k: "title", l: "Title" }, { t: "text", k: "text", l: "Text" }, { t: "select", k: "color", l: "Colour", options: COLORS }] }] },
    { title: "Why choose Smart Start?", f: [{ t: "text", o: "why", k: "eyebrow", l: "Label" }, { t: "text", o: "why", k: "title", l: "Heading" }, { t: "lines", o: "why", k: "items", l: "Reasons", rows: 7 }] }
  ];
  var PHIL_BLOCKS = [
    { title: "Page introduction", f: [{ t: "text", o: "hero", k: "eyebrow", l: "Label" }, { t: "area", o: "hero", k: "title", l: "Heading", rows: 2, hint: HL_HINT }, { t: "area", o: "hero", k: "text", l: "Text", rows: 4 }] },
    { title: "How it works (3 steps)", f: [{ t: "text", o: "how", k: "title", l: "Heading" }, { t: "repeat", o: "how", k: "steps", l: "Steps", single: "step", add: { title: "", text: "" }, fields: [{ t: "text", k: "title", l: "Title" }, { t: "area", k: "text", l: "Text", rows: 2 }] }] }
  ];

  function blocks(file, list, open) {
    var data = AS.data[file], nodes = [];
    list.forEach(function (b, i) {
      var defs = b.f.map(function (d) {
        if (d.o2) { return { t: d.t, o: d.o + "." + d.o2, k: d.k, l: d.l }; } return d;
      });
      nodes.push(accordion(b.title, fieldsNode(defs, data), open && i === 0));
    });
    return nodes;
  }
  function sectionManager() {
    var secs = AS.data.homepage.sections, box = el("div", { class: "sec-list" });
    function draw() {
      box.innerHTML = "";
      secs.forEach(function (s, i) {
        box.appendChild(el("div", { class: "sec-row" }, [el("label", { class: "check" }, [el("input", { type: "checkbox", checked: s.visible !== false, onchange: function (e) { s.visible = e.target.checked; AS.touch(); } }), el("span", { text: s.label })]),
          el("span", { class: "item__acts" }, [el("button", { class: "icon-btn", type: "button", html: "&uarr;", "aria-label": "Move up", disabled: i === 0, onclick: function () { swap(secs, i, i - 1); AS.touch(); draw(); } }), el("button", { class: "icon-btn", type: "button", html: "&darr;", "aria-label": "Move down", disabled: i === secs.length - 1, onclick: function () { swap(secs, i, i + 1); AS.touch(); draw(); } })])]));
      });
    }
    draw(); return box;
  }
  V.content = function (root, sub) {
    var tabs = [["home", "Homepage"], ["about", "About Us"], ["philosophy", "Multiple Intelligence"]], cur = sub || "home";
    root.appendChild(head("Website content", "Edit headings, descriptions, buttons, links and photos. Changes are saved to your local draft automatically."));
    root.appendChild(el("div", { class: "tabs", role: "tablist" }, tabs.map(function (t) { return el("a", { href: "#/content/" + t[0], role: "tab", class: "tab" + (cur === t[0] ? " is-active" : ""), text: t[1] }); })));
    if (cur === "home") { root.appendChild(accordion("Show / hide & reorder homepage sections", sectionManager(), true)); blocks("homepage", HOME_BLOCKS, false).forEach(function (n) { root.appendChild(n); }); }
    else if (cur === "about") blocks("about", ABOUT_BLOCKS, true).forEach(function (n) { root.appendChild(n); });
    else {
      blocks("philosophy", PHIL_BLOCKS, true).forEach(function (n) { root.appendChild(n); });
      root.appendChild(accordion("The eight intelligences", fieldsNode([{ t: "repeat", k: "intelligences", l: "Intelligences", single: "intelligence", itemLabel: "name", noDelete: false,
        add: { id: "", name: "", heading: "", color: "purple", icon: "star", text: "", activities: [], image: { src: "", alt: "" } },
        fields: [{ t: "text", k: "name", l: "Name (e.g. Linguistic)" }, { t: "text", k: "heading", l: "Creative heading" }, { t: "select", k: "color", l: "Colour", options: COLORS }, { t: "select", k: "icon", l: "Icon", options: ICONS },
          { t: "image", o: "image", k: "src", l: "Illustration / photo", altKey: "alt" }, { t: "area", k: "text", l: "Simple explanation", rows: 3 }, { t: "lines", k: "activities", l: "Practical learning activities" }] }], AS.data.philosophy), true));
    }
  };

  /* =============== UPDATES =============== */
  V.updates = function (root, sub) {
    var items = AS.data.updates.items;
    if (sub) return updateEditor(root, sub);
    root.appendChild(head("Announcements", "News, events, celebrations and important notices. Published announcements appear on the homepage and the Announcements page.", [el("a", { class: "btn btn--primary", href: "#/updates/new", text: "+ Add announcement" })]));
    if (!items.length) root.appendChild(el("p", { class: "empty", text: "No updates yet. Add your first update." }));
    var list = el("div", { class: "rows" });
    items.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); }).forEach(function (u, i, arr) {
      list.appendChild(el("div", { class: "row-card" }, [thumb(u.cover), el("div", { class: "row-card__t" }, [el("strong", { text: u.title || "(untitled)" }), el("small", { class: "muted", text: u.category + " · " + u.date + " · " + (1 + (u.images || []).length) + " photo(s)" })]),
        badge(u.published ? "Published" : "Draft", u.published ? "ok" : "warn"),
        el("div", { class: "row" }, [
          AS.btn(u.published ? "Unpublish" : "Publish", "btn--sm", function () { u.published = !u.published; AS.touch(); AS.router(); }),
          el("a", { class: "btn btn--sm", href: "#/updates/" + encodeURIComponent(u.id), text: "Edit" }),
          el("button", { class: "icon-btn", type: "button", html: "&uarr;", "aria-label": "Move up", disabled: i === 0, onclick: function () { var s = arr.slice(); swap(s, i, i - 1); renumber(s); AS.data.updates.items = s; AS.touch(); AS.router(); } }),
          el("button", { class: "icon-btn", type: "button", html: "&darr;", "aria-label": "Move down", disabled: i === arr.length - 1, onclick: function () { var s = arr.slice(); swap(s, i, i + 1); renumber(s); AS.data.updates.items = s; AS.touch(); AS.router(); } }),
          el("button", { class: "icon-btn icon-btn--danger", type: "button", html: "&times;", "aria-label": "Delete update", onclick: function () { AS.confirm("Delete update", "Delete “" + u.title + "”? Its photos stay in the media library.", "Delete", true).then(function (ok) { if (ok) { AS.data.updates.items = AS.data.updates.items.filter(function (x) { return x !== u; }); AS.touch(); AS.router(); } }); } })])]));
    });
    root.appendChild(list);
  };
  function updateEditor(root, id) {
    var items = AS.data.updates.items, u;
    if (id === "new") {
      u = { id: AS.uid("update"), title: "", category: AS.data.updates.categories[0] || "Celebrations", date: new Date().toISOString().slice(0, 10), description: "", cover: "", images: [], published: false, order: 0 };
      items.unshift(u); renumber(items); AS.touch(); history.replaceState(null, "", "#/updates/" + encodeURIComponent(u.id));
    } else u = items.filter(function (x) { return x.id === decodeURIComponent(id); })[0];
    if (!u) { root.appendChild(el("p", { class: "empty", text: "Update not found." })); return; }
    root.appendChild(head(u.title || "New update", "Changes save automatically to your local draft.", [el("a", { class: "btn", href: "#/updates", text: "← Back to list" }), AS.btn("Preview draft", "btn--ghost", function () { window.open("../updates.html?preview=1", "_blank"); })]));
    var catSel = F.select("Category", u, "category", AS.data.updates.categories);
    var newCat = el("input", { type: "text", placeholder: "New category name" });
    var cats = el("div", { class: "row end" }, [catSel, el("label", { class: "field" }, [el("span", { class: "field__l", text: "Add category" }), el("div", { class: "row" }, [newCat, AS.btn("Add", "btn--sm", function () { var v = newCat.value.trim(); if (v && AS.data.updates.categories.indexOf(v) < 0) { AS.data.updates.categories.push(v); u.category = v; AS.touch(); AS.router(); } })])])]);
    root.appendChild(AS.card("Details", [F.text("Title", u, "title"), F.area("Description", u, "description", { rows: 5 }), cats, el("div", { class: "grid-2" }, [F.text("Publication date", u, "date", { type: "date" }), F.text("Event date (optional – adds Event structured data for search engines)", u, "eventDate", { type: "date" })]), F.check("Published (visible on the website)", u, "published")]));
    var grid = el("div", { class: "imgs" });
    function allImgs() { return [u.cover].concat(u.images || []).filter(Boolean); }
    function setAll(arr) { u.cover = arr[0] || ""; u.images = arr.slice(1); AS.touch(); draw(); }
    function draw() {
      grid.innerHTML = ""; var arr = allImgs();
      if (!arr.length) grid.appendChild(el("p", { class: "muted", text: "No images yet. Add a cover image and any extra photos below." }));
      arr.forEach(function (p, i) {
        grid.appendChild(el("figure", { class: "tile" }, [thumb(p, "tile__img"), i === 0 ? badge("Featured cover", "ok") : null,
          el("figcaption", { class: "row" }, [
            i ? AS.btn("Set featured", "btn--sm", function () { var a = arr.slice(); var t = a.splice(i, 1)[0]; a.unshift(t); setAll(a); }) : null,
            AS.btn("Replace", "btn--sm", function () { AS.pickImage(false).then(function (r) { if (r) { var a = arr.slice(); a[i] = r[0].path; setAll(a); } }); }),
            el("button", { class: "icon-btn", type: "button", html: "&larr;", "aria-label": "Move earlier", disabled: i === 0, onclick: function () { var a = arr.slice(); swap(a, i, i - 1); setAll(a); } }),
            el("button", { class: "icon-btn", type: "button", html: "&rarr;", "aria-label": "Move later", disabled: i === arr.length - 1, onclick: function () { var a = arr.slice(); swap(a, i, i + 1); setAll(a); } }),
            el("button", { class: "icon-btn icon-btn--danger", type: "button", html: "&times;", "aria-label": "Remove image", onclick: function () { var a = arr.slice(); a.splice(i, 1); setAll(a); } })])]));
      });
    }
    draw();
    root.appendChild(AS.card("Photos (the first one is the featured cover)", [grid, AS.dropzone(function (files) { AS.uploadFiles(files, { category: "updates" }).then(function (its) { setAll(allImgs().concat(its.map(function (x) { return x.path; }))); }); }, "Upload photos for this update"),
      el("div", { class: "row" }, [AS.btn("Choose from media library", "", function () { AS.pickImage(true).then(function (r) { if (r) setAll(allImgs().concat(r.map(function (x) { return x.path; }).filter(function (p) { return allImgs().indexOf(p) < 0; }))); }); })])]));
    root.appendChild(el("div", { class: "row" }, [el("a", { class: "btn btn--primary", href: "#/updates", text: "Done" }), AS.btn("Delete this update", "btn--danger", function () { AS.confirm("Delete update", "Delete this update permanently?", "Delete", true).then(function (ok) { if (ok) { AS.data.updates.items = AS.data.updates.items.filter(function (x) { return x !== u; }); AS.touch(); location.hash = "#/updates"; } }); })]));
  }

  /* =============== GALLERY =============== */
  var galState = { cat: "all", sel: {} };
  V.gallery = function (root) {
    var G = AS.data.gallery, cats = G.categories;
    root.appendChild(head("Gallery", "Upload, caption, categorise, reorder and show/hide photos."));
    var upCat = el("select", {}, cats.map(function (c) { return el("option", { value: c.id, text: c.label }); }));
    root.appendChild(AS.card("Upload photos", [el("div", { class: "row end" }, [el("label", { class: "field" }, [el("span", { class: "field__l", text: "Add to category" }), upCat])]),
      AS.dropzone(function (files) {
        AS.uploadFiles(files, { category: "gallery" }).then(function (its) {
          its.forEach(function (it) { G.images.push({ id: it.id, src: it.path, thumb: it.thumb, w: it.w, h: it.h, category: upCat.value, caption: it.label, alt: it.alt, featured: false, visible: true, order: G.images.length + 1 }); });
          AS.touch(); AS.router();
        });
      }, "Bulk upload: drop many photos here or click")]));
    // category manager
    var cm = el("div", { class: "cats" });
    function drawCats() {
      cm.innerHTML = "";
      cats.forEach(function (c, i) {
        cm.appendChild(el("div", { class: "row cat-row" }, [el("input", { type: "text", value: c.label, "aria-label": "Category name", oninput: function (e) { c.label = e.target.value; AS.touch(); } }),
          el("span", { class: "muted", text: G.images.filter(function (g) { return g.category === c.id; }).length + " photos" }),
          el("button", { class: "icon-btn icon-btn--danger", type: "button", html: "&times;", "aria-label": "Delete category", onclick: function () { if (G.images.some(function (g) { return g.category === c.id; })) { AS.toast("Move or delete the photos in this category first.", "error"); return; } cats.splice(i, 1); AS.touch(); AS.router(); } })]));
      });
      var nn = el("input", { type: "text", placeholder: "New category name" });
      cm.appendChild(el("div", { class: "row" }, [nn, AS.btn("Add category", "btn--sm", function () { var v = nn.value.trim(); if (!v) return; cats.push({ id: AS.slug(v), label: v }); AS.touch(); AS.router(); })]));
    }
    drawCats();
    root.appendChild(accordion("Edit gallery categories", cm));
    // filter bar
    var bar = el("div", { class: "filter-bar" });
    [{ id: "all", label: "All" }].concat(cats).forEach(function (c) { bar.appendChild(el("button", { type: "button", class: "chip" + (galState.cat === c.id ? " is-active" : ""), text: c.label, onclick: function () { galState.cat = c.id; AS.router(); } })); });
    root.appendChild(bar);
    var list = G.images.filter(function (g) { return galState.cat === "all" || g.category === galState.cat; });
    var nsel = Object.keys(galState.sel).filter(function (k) { return galState.sel[k]; });
    var bulkCat = el("select", {}, cats.map(function (c) { return el("option", { value: c.id, text: c.label }); }));
    root.appendChild(el("div", { class: "bulk" }, [el("strong", { text: nsel.length + " selected" }), AS.btn("Select all shown", "btn--sm", function () { list.forEach(function (g) { galState.sel[g.id] = true; }); AS.router(); }), AS.btn("Clear", "btn--sm btn--ghost", function () { galState.sel = {}; AS.router(); }),
      bulkCat, AS.btn("Move to category", "btn--sm", function () { G.images.forEach(function (g) { if (galState.sel[g.id]) g.category = bulkCat.value; }); AS.touch(); AS.router(); }),
      AS.btn("Show", "btn--sm", function () { G.images.forEach(function (g) { if (galState.sel[g.id]) g.visible = true; }); AS.touch(); AS.router(); }), AS.btn("Hide", "btn--sm", function () { G.images.forEach(function (g) { if (galState.sel[g.id]) g.visible = false; }); AS.touch(); AS.router(); }),
      AS.btn("Delete selected", "btn--sm btn--danger", function () { if (!nsel.length) return; AS.confirm("Delete photos", "Delete " + nsel.length + " selected photo(s) from the gallery?", "Delete", true).then(function (ok) { if (ok) { G.images = G.images.filter(function (g) { return !galState.sel[g.id]; }); galState.sel = {}; renumber(G.images); AS.touch(); AS.router(); } }); })]));
    var grid = el("div", { class: "gal-admin" });
    list.forEach(function (g) {
      var idx = G.images.indexOf(g);
      grid.appendChild(el("article", { class: "gcard" + (g.visible === false ? " is-off" : "") }, [
        el("div", { class: "gcard__img" }, [thumb(g.thumb || g.src, "tile__img"), el("label", { class: "gcard__sel" }, [el("input", { type: "checkbox", checked: !!galState.sel[g.id], "aria-label": "Select photo", onchange: function (e) { galState.sel[g.id] = e.target.checked; } })]), g.featured ? badge("Featured", "ok") : null]),
        F.text("Caption", g, "caption"), F.select("Category", g, "category", cats.map(function (c) { return { value: c.id, label: c.label }; })), F.text("Alt text", g, "alt"),
        el("div", { class: "row" }, [F.check("Visible", g, "visible"), F.check("Featured", g, "featured")]),
        el("div", { class: "row" }, [
          el("button", { class: "icon-btn", type: "button", html: "&larr;", "aria-label": "Move earlier", disabled: idx === 0, onclick: function () { swap(G.images, idx, idx - 1); renumber(G.images); AS.touch(); AS.router(); } }),
          el("button", { class: "icon-btn", type: "button", html: "&rarr;", "aria-label": "Move later", disabled: idx === G.images.length - 1, onclick: function () { swap(G.images, idx, idx + 1); renumber(G.images); AS.touch(); AS.router(); } }),
          AS.btn("Replace", "btn--sm", function () { AS.pickImage(false).then(function (r) { if (r) { var it = r[0]; g.src = it.path; g.thumb = it.thumb; g.w = it.w; g.h = it.h; AS.touch(); AS.router(); } }); }),
          el("button", { class: "icon-btn icon-btn--danger", type: "button", html: "&times;", "aria-label": "Delete photo", onclick: function () { AS.confirm("Delete photo", "Remove this photo from the gallery? (It stays in the media library.)", "Remove", true).then(function (ok) { if (ok) { G.images.splice(G.images.indexOf(g), 1); renumber(G.images); AS.touch(); AS.router(); } }); } })])]));
    });
    root.appendChild(grid);
  };

  /* =============== PROGRAMMES =============== */
  V.programmes = function (root) {
    var P = AS.data.programmes;
    root.appendChild(head("Programmes", "Add, edit, delete and reorder programmes. Age ranges, objectives and photos are all editable."));
    root.appendChild(accordion("Programmes page introduction", fieldsNode([{ t: "text", o: "hero", k: "eyebrow", l: "Label" }, { t: "area", o: "hero", k: "title", l: "Heading", rows: 2, hint: HL_HINT }, { t: "area", o: "hero", k: "text", l: "Text", rows: 3 }], P)));
    root.appendChild(el("div", { class: "card" }, el("div", { class: "card__body" }, fieldsNode([{ t: "repeat", k: "items", l: "Programmes", single: "programme", itemLabel: "name",
      add: { id: "", name: "New programme", age: "", color: "purple", visible: true, tagline: "", description: "", objectives: [], activities: [], development: [], image: { src: "", alt: "" } },
      fields: [{ t: "text", k: "name", l: "Programme name" }, { t: "text", k: "age", l: "Age range (e.g. 3–4 years)" }, { t: "text", k: "id", l: "Link ID (letters, numbers and dashes only)", hint: "Used in the page address, e.g. programmes.html#nursery" }, { t: "text", k: "tagline", l: "Tagline" },
        { t: "select", k: "color", l: "Colour", options: COLORS }, { t: "check", k: "visible", l: "Visible on website" }, { t: "area", k: "description", l: "Description", rows: 4 },
        { t: "lines", k: "objectives", l: "Learning objectives" }, { t: "lines", k: "activities", l: "Activities" }, { t: "lines", k: "development", l: "Development areas" }, { t: "image", o: "image", k: "src", l: "Programme image", altKey: "alt" }] }], P))));
  };

  /* =============== PEOPLE =============== */
  V.people = function (root) {
    var A = AS.data.about;
    root.appendChild(head("Principal & staff", "The principal's photograph, designation, biography and message, plus staff members."));
    root.appendChild(AS.card("Principal", fieldsNode([{ t: "text", k: "name", l: "Name" }, { t: "text", k: "designation", l: "Designation" }, { t: "image", k: "photo", l: "Photograph", altKey: "photoAlt" }, { t: "area", k: "bio", l: "Biography", rows: 4 }, { t: "area", k: "intro", l: "Short quote (used on the homepage when no message is available)", rows: 2 }, { t: "paras", k: "message", l: "Message to parents (full letter)", rows: 14 }, { t: "text", k: "signoff", l: "Sign-off" }], A.principal)));
    root.appendChild(AS.card("Staff members", fieldsNode([{ t: "repeat", k: "staff", l: "Staff (shown on About Us when you add at least one)", single: "staff member", itemLabel: "name", add: { name: "", designation: "", photo: "" }, fields: [{ t: "text", k: "name", l: "Name" }, { t: "text", k: "designation", l: "Designation" }, { t: "image", k: "photo", l: "Photograph", clearable: true }] }], A)));
  };

  /* =============== TESTIMONIALS =============== */
  V.testimonials = function (root) {
    var T = AS.data.testimonials;
    root.appendChild(head("Testimonials", "Only add genuine parent feedback with permission. The testimonials section stays hidden on the website until at least one is published."));
    root.appendChild(AS.card("Section heading", fieldsNode([{ t: "text", k: "eyebrow", l: "Label" }, { t: "text", k: "title", l: "Heading" }], T)));
    root.appendChild(AS.card("Testimonials", fieldsNode([{ t: "repeat", k: "items", l: "Testimonials", single: "testimonial", itemLabel: "name", add: { name: "", relation: "Parent", text: "", published: false }, fields: [{ t: "text", k: "name", l: "Parent name" }, { t: "text", k: "relation", l: "Relation (e.g. Parent of a Nursery student)" }, { t: "area", k: "text", l: "Testimonial", rows: 4 }, { t: "check", k: "published", l: "Published" }] }], T)));
  };

  /* =============== CENTRES =============== */
  V.centres = function (root) {
    root.appendChild(head("Centres", "Centre details shown on the Our Centres page. Only add addresses you have confirmed."));
    root.appendChild(AS.card("Centres", fieldsNode([{ t: "repeat", k: "centres", l: "Centres", single: "centre", itemLabel: "name", add: { id: "", name: "", address: "", city: "Delhi", intro: "", photos: [], phones: [], email: "", mapsUrl: "", visible: true },
      fields: [{ t: "text", k: "name", l: "Centre name" }, { t: "text", k: "id", l: "Link ID (no spaces)" }, { t: "text", k: "address", l: "Street address (leave empty if not confirmed)" }, { t: "text", k: "city", l: "City" }, { t: "area", k: "intro", l: "Short description", rows: 3 },
        { t: "lines", k: "phones", l: "Phone numbers" }, { t: "text", k: "email", l: "Email" }, { t: "text", k: "mapsUrl", l: "Google Maps link" }, { t: "check", k: "visible", l: "Visible on website" },
        { t: "repeat", k: "photos", l: "Photographs", single: "photo", itemLabel: "alt", add: { src: "", alt: "" }, fields: [{ t: "image", k: "src", l: "Photo", altKey: "alt" }] }] }], AS.data.centres)));
  };

  /* =============== SEO =============== */
  var seoPage = "index";
  V.seo = function (root) {
    var S = AS.data.seo, names = { index: "Home", about: "About", philosophy: "Multiple Intelligence", programmes: "Programmes", gallery: "Gallery", updates: "Updates", centres: "Centres", contact: "Contact" };
    root.appendChild(head("SEO manager", "Titles, descriptions, social sharing and structured data for every page. Aim for titles up to 60 characters and descriptions up to 160."));
    root.appendChild(el("div", { class: "tabs" }, Object.keys(names).map(function (k) { return el("a", { href: "#/seo", class: "tab" + (seoPage === k ? " is-active" : ""), text: names[k], onclick: function () { seoPage = k; } }); })));
    var p = S.pages[seoPage];
    var count = function (obj, key, max) { var s = el("small", { class: "muted" }); var f = function () { s.textContent = (obj[key] || "").length + " / " + max + " characters"; s.className = "muted" + ((obj[key] || "").length > max ? " over" : ""); }; f(); return { node: s, update: f }; };
    var t = count(p, "title", 60), d = count(p, "description", 160);
    root.appendChild(AS.card(names[seoPage] + " page", [
      F.text("SEO title", p, "title", { onChange: t.update }), t.node, F.area("Meta description", p, "description", { rows: 3, onChange: d.update }), d.node,
      F.text("Canonical URL (leave empty to use the automatic address)", p, "canonical", { placeholder: "https://…" }),
      F.text("Open Graph title", p, "ogTitle"), F.area("Open Graph description", p, "ogDescription", { rows: 2 }),
      F.image("Social sharing image", p, "ogImage"),
      F.select("Robots", p, "robots", ["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"])]));
    var st = S.structured;
    root.appendChild(AS.card("Structured data (all pages)", [F.select("Organisation type", st, "type", ["Preschool", "EducationalOrganization", "School"]), F.area("Organisation description", st, "description", { rows: 3 }),
      F.area("Extra JSON-LD (advanced, optional)", st, "extraJsonLd", { rows: 6, hint: "Paste a complete JSON-LD object. Invalid JSON is ignored. Event data is generated automatically from updates that have an event date." }),
      el("p", { class: "muted", text: "Preschool, WebSite, WebPage and BreadcrumbList data is generated automatically. Address, ratings and opening hours are only included when you enter them." })]));
  };

  /* =============== MEDIA =============== */
  var mediaState = { q: "", cat: "all" };
  V.media = function (root) {
    var M = AS.data.media;
    root.appendChild(head("Media library", "All images used on the website. Search, upload, reuse, check where each image is used, and delete."));
    root.appendChild(AS.card("Upload", [el("div", { class: "row end" }, [F.select("Category for new uploads", mediaState, "upcat", M.categories)]),
      AS.dropzone(function (files) { AS.uploadFiles(files, { category: mediaState.upcat || M.categories[0] }).then(function () { AS.router(); }); })]));
    var cats = el("select", { "aria-label": "Filter by category", onchange: function (e) { mediaState.cat = e.target.value; AS.router(); } }, [el("option", { value: "all", text: "All categories" })].concat(M.categories.map(function (c) { return el("option", { value: c, text: c }); }))); cats.value = mediaState.cat;
    root.appendChild(el("div", { class: "pick-bar" }, [el("input", { type: "search", placeholder: "Search by name or alt text…", value: mediaState.q, oninput: function (e) { mediaState.q = e.target.value; clearTimeout(V._mt); V._mt = setTimeout(function () { AS.router(); document.querySelector("#view input[type=search]").focus(); }, 350); } }), cats]));
    var items = M.items.filter(function (m) { return (mediaState.cat === "all" || m.category === mediaState.cat) && (!mediaState.q || (m.label + " " + m.alt + " " + m.id).toLowerCase().indexOf(mediaState.q.toLowerCase()) >= 0); });
    root.appendChild(el("p", { class: "muted", text: items.length + " image(s)" }));
    var grid = el("div", { class: "media-grid" });
    items.forEach(function (m) {
      var use = AS.usage(m.path);
      grid.appendChild(el("article", { class: "mcard" }, [thumb(m.thumb || m.path, "tile__img"),
        el("div", { class: "mcard__b" }, [F.text("Name", m, "label"), F.text("Alt text", m, "alt"),
          el("p", { class: "muted small", text: m.w + " × " + m.h + " px · " + AS.fmtBytes(m.bytes) + " · " + m.category + (/^idb:/.test(m.path) ? " · not published yet" : "") }),
          el("p", { class: "small" }, [el("strong", { text: "Used in: " }), use.length ? use.join(", ") : "not used anywhere"]),
          el("div", { class: "row" }, [
            AS.btn("Replace everywhere", "btn--sm", function () { AS.pickImage(false).then(function (r) { if (r && r[0].path !== m.path) { AS.replaceEverywhere(m.path, m.thumb, r[0]); AS.toast("Replaced in all places it was used"); AS.router(); } }); }),
            AS.btn("Delete", "btn--sm btn--danger", function () { AS.confirm("Delete image", use.length ? "This image is used in: " + use.join(", ") + ". It will be removed from those places. Delete it?" : "Delete this image from the library?", "Delete", true).then(function (ok) { if (ok) { AS.removeMedia(m.id); AS.router(); } }); })])])]));
    });
    root.appendChild(grid);
  };

  /* =============== SETTINGS =============== */
  V.settings = function (root) {
    var S = AS.data.settings;
    root.appendChild(head("Website settings", "School details, branding, contact information, footer and colours."));
    root.appendChild(AS.card("School & branding", fieldsNode([{ t: "text", k: "name", l: "School name" }, { t: "text", k: "fullName", l: "Full name (used in search results)" }, { t: "text", k: "tagline", l: "Tagline" }, { t: "text", k: "motto", l: "Motto" },
      { t: "image", k: "logo", l: "Logo (square or circular works best)" }, { t: "image", k: "favicon", l: "Favicon (small square image)" }, { t: "text", k: "city", l: "City" }, { t: "text", k: "siteUrl", l: "Public website address", hint: "e.g. https://yourname.github.io/smart-start/ – used for canonical links, social previews and the sitemap. Leave empty to detect automatically on GitHub." }], S)));
    root.appendChild(AS.card("Contact details", fieldsNode([{ t: "repeat", k: "phones", l: "Phone numbers", single: "number", itemLabel: "number", add: { label: "Call", number: "" }, fields: [{ t: "text", k: "label", l: "Label" }, { t: "text", k: "number", l: "Number" }] },
      { t: "text", k: "email", l: "Email" }, { t: "text", k: "whatsapp", l: "WhatsApp number with country code (e.g. 919717177531)" }, { t: "text", k: "whatsappMessage", l: "Default WhatsApp message" }, { t: "text", k: "mapsUrl", l: "Google Maps URL" }, { t: "text", k: "address", l: "Street address (leave empty if unknown)" },
      { t: "repeat", k: "hours", l: "Working hours", single: "row", itemLabel: "day", add: { day: "Monday – Friday", time: "9:00 am – 1:00 pm" }, fields: [{ t: "text", k: "day", l: "Days" }, { t: "text", k: "time", l: "Hours" }] }, { t: "area", k: "hoursNote", l: "Note shown with the hours", rows: 2 }], S)));
    root.appendChild(AS.card("Social media", fieldsNode([{ t: "text", o: "social", k: "instagram", l: "Instagram URL" }, { t: "text", o: "social", k: "facebook", l: "Facebook URL" }, { t: "text", o: "social", k: "youtube", l: "YouTube URL" }, { t: "text", o: "social", k: "twitter", l: "X / Twitter URL" }], S)));
    root.appendChild(AS.card("Footer", fieldsNode([{ t: "area", o: "footer", k: "blurb", l: "Footer description", rows: 3 }, { t: "text", o: "footer", k: "copyright", l: "Copyright line" }], S)));
    root.appendChild(AS.card("Menu", fieldsNode([{ t: "repeat", k: "nav", l: "Navigation links", single: "link", itemLabel: "label", add: { label: "", href: "" }, fields: [{ t: "text", k: "label", l: "Label" }, { t: "text", k: "href", l: "Page or link", hint: "e.g. gallery.html" }] }], S)));
    var cols = [["purple", "Primary: purple (creativity)"], ["magenta", "Primary: magenta (highlights, buttons)"], ["coral", "Secondary: coral"], ["sky", "Secondary: sky blue"], ["yellow", "Secondary: yellow"], ["green", "Secondary: green"], ["navy", "Text: dark navy"], ["cream", "Page background: cream"]];
    root.appendChild(AS.card("Colours", [el("div", { class: "grid-4" }, cols.map(function (c) { return F.color(c[1], S.colors, c[0]); })), AS.btn("Reset to brand colours", "btn--sm btn--ghost", function () { S.colors = { purple: "#6D2FA0", magenta: "#C2307E", coral: "#E8483F", sky: "#54B9F2", yellow: "#FFC83D", green: "#2FA66A", navy: "#1E2250", cream: "#FFF9EE" }; AS.touch(); AS.router(); })]));
  };

  /* =============== PUBLISH =============== */
  V.publish = function (root) {
    var cfg = Object.assign({ owner: "", repo: "", branch: "main" }, AS.getConfig());
    var changed = AS.changedFiles(), G = AS.gh;
    root.appendChild(head("Publish & backup", "Two modes: keep working in your local draft, or publish to GitHub."));
    root.appendChild(el("div", { class: "notice" }, [el("strong", { text: "How secure is this? " }), "This is a backend-free approach, not a multi-user CMS. Your GitHub token is held only in this browser tab's memory (never saved, never committed) and is gone when you close or reload the tab. Anyone with access to this browser session could inspect it, so use a dedicated repository, a fine-grained token limited to that single repository with only ", el("em", { text: "Contents: Read and write" }), " permission, a short expiry, and close the tab after publishing. For stronger authentication a trusted server-side or GitHub Actions workflow would be required."]));
    // Mode 1
    root.appendChild(AS.card("Mode 1 – Local draft", [el("p", { text: changed.length || AS.deleted.length ? "You have unpublished changes in: " + changed.map(function (k) { return AS.LABELS[k]; }).join(", ") + "." : "No unpublished changes." }),
      el("div", { class: "row" }, [AS.btn("Preview draft on the website", "btn--primary", function () { window.open("../index.html?preview=1", "_blank"); }),
        AS.btn("Export full backup (.json)", "", function () { AS.exportBackup().then(function (t) { download("smart-start-backup-" + new Date().toISOString().slice(0, 10) + ".json", t); AS.toast("Backup downloaded"); }); }),
        AS.btn("Import backup", "", function () { pickFile(".json", function (text) { try { AS.importBackup(text).then(function () { AS.toast("Backup imported into your draft"); AS.router(); }, function (e) { AS.toast(e.message, "error"); }); } catch (e) { AS.toast(e.message, "error"); } }); }),
        AS.btn("Discard draft", "btn--danger", function () { AS.confirm("Discard draft", "Throw away all unpublished changes and reload the published content?", "Discard", true).then(function (ok) { if (ok) { AS.discard(); AS.router(); } }); })]),
      el("details", { class: "acc" }, [el("summary", { text: "Export / import individual JSON files" }), el("div", { class: "acc__body" }, Object.keys(AS.FILES).map(function (k) {
        return el("div", { class: "row cat-row" }, [el("span", { text: AS.FILES[k] + ".json" }), AS.btn("Export", "btn--sm", function () { download(AS.FILES[k] + ".json", JSON.stringify(AS.data[k], null, 2) + "\n"); }), AS.btn("Import", "btn--sm", function () { pickFile(".json", function (t) { try { AS.importJsonFile(k, t); AS.toast(AS.FILES[k] + ".json imported"); AS.router(); } catch (e) { AS.toast("Invalid JSON: " + e.message, "error"); } }); })]);
      }))])]));
    // Mode 2
    var out = el("div", { class: "log", "aria-live": "polite" });
    var owner = el("input", { type: "text", value: cfg.owner, placeholder: "e.g. my-school-account", autocomplete: "off" }), repo = el("input", { type: "text", value: cfg.repo, placeholder: "e.g. smart-start", autocomplete: "off" }), branch = el("input", { type: "text", value: cfg.branch, autocomplete: "off" });
    var token = el("input", { type: "password", placeholder: "github_pat_…", autocomplete: "off", spellcheck: "false" });
    var state = el("div", { class: "gh-state" });
    function drawState() {
      state.innerHTML = "";
      if (G.token) state.appendChild(el("div", { class: "row" }, [badge("Connected to " + cfg.owner + "/" + cfg.repo + " (" + cfg.branch + ")" + (G.repoInfo && G.repoInfo.private ? " · private repo" : ""), "ok"), AS.btn("Disconnect (forget token)", "btn--sm btn--ghost", function () { G.disconnect(); drawState(); })]));
      else state.appendChild(badge("Not connected", "grey"));
    }
    function readCfg() { cfg = { owner: owner.value.trim(), repo: repo.value.trim(), branch: branch.value.trim() || "main" }; return cfg; }
    var connectBtn = AS.btn("Connect", "btn--primary", function () {
      readCfg(); out.innerHTML = "";
      if (!cfg.owner || !cfg.repo || !token.value.trim()) { AS.toast("Enter the owner, repository and token.", "error"); return; }
      connectBtn.disabled = true; connectBtn.textContent = "Connecting…";
      G.connect(cfg, token.value).then(function () { token.value = ""; AS.toast("Connected. The token is kept in memory only."); }, function (e) { out.appendChild(el("div", { class: "msg error", text: e.message })); })
        .then(function () { connectBtn.disabled = false; connectBtn.textContent = "Connect"; drawState(); });
    });
    var pubBtn = AS.btn("Publish changes to GitHub", "btn--primary btn--lg", function () { doPublish(); });
    function log(label, st, msg) {
      var id = "log-" + label.replace(/\W+/g, "");
      var n = out.querySelector("#" + id) || out.appendChild(el("div", { id: id, class: "logline" }));
      n.className = "logline " + st; n.textContent = (st === "ok" ? "✔ " : st === "fail" ? "✘ " : "… ") + label + (msg ? " – " + msg : "");
    }
    function doPublish(force) {
      readCfg(); out.innerHTML = "";
      if (!G.token) { out.appendChild(el("div", { class: "msg error", text: "Connect to GitHub first." })); return; }
      var payload = AS.publishPayload(), ch = Object.keys(AS.FILES).filter(function (k) { return JSON.stringify(payload.files[k]) !== JSON.stringify(AS.original[k]); });
      if (!ch.length && !AS.deleted.length) { out.appendChild(el("div", { class: "msg", text: "Nothing to publish: your data already matches the published website." })); return; }
      pubBtn.disabled = true; pubBtn.textContent = "Publishing…";
      var start = force ? Promise.resolve([]) : (log("Checking GitHub for newer changes", "run"), G.findConflicts(cfg, payload, ch));
      start.then(function (conf) {
        if (conf.length) {
          log("Checking GitHub for newer changes", "fail", "files changed on GitHub: " + conf.join(", "));
          return AS.confirm("GitHub has newer changes", "These files were changed on GitHub since you loaded the admin: " + conf.map(function (k) { return AS.FILES[k] + ".json"; }).join(", ") + ". Publishing now would overwrite those changes. Overwrite?", "Overwrite GitHub", true).then(function (ok) { if (ok) return doPublish2(true); out.appendChild(el("div", { class: "msg error", text: "Cancelled. Nothing was published. Export a backup, reload the admin to fetch the latest content, then re-apply your edits." })); });
        }
        if (!force) log("Checking GitHub for newer changes", "ok");
        return doPublish2(force);
      }).catch(fail).then(function () { pubBtn.disabled = false; pubBtn.textContent = "Publish changes to GitHub"; });
    }
    function doPublish2() {
      return G.publish(cfg, log).then(function (r) {
        out.appendChild(el("div", { class: "msg success" }, [el("strong", { text: "Published. GitHub confirmed every commit." }), el("p", { text: "Files: " + r.record.files.join(", ") + ". " + "GitHub Actions now regenerates the static HTML (usually 1–2 minutes). The live site already shows the new content through its JSON refresh once GitHub Pages has deployed the new data." }),
          el("ul", {}, r.commits.map(function (c) { return el("li", {}, el("a", { href: c.url, target: "_blank", rel: "noopener", text: c.file + " → " + c.sha.slice(0, 7) })); }))]));
        AS.toast("Published to GitHub"); AS.emit();
      });
    }
    function fail(e) {
      out.appendChild(el("div", { class: "msg error" }, [el("strong", { text: "Publishing did not complete. " }), el("span", { text: e.message }), el("p", { text: "Your draft is safe in this browser. Steps already confirmed by GitHub are shown above; nothing else was changed. Fix the problem and publish again." })]));
      if (e.status === 401) { G.disconnect(); drawState(); }
    }
    root.appendChild(AS.card("Mode 2 – Publish to GitHub", [
      el("ol", { class: "steps" }, [el("li", { text: "Use a dedicated repository for the website (public for free GitHub Pages)." }), el("li", { html: "GitHub → Settings → Developer settings → <strong>Fine-grained tokens</strong> → Generate. Select <em>only this repository</em>, set a short expiry, and give only <strong>Contents: Read and write</strong>." }), el("li", { text: "Paste the details below and press Connect, then Publish." })]),
      el("div", { class: "grid-3" }, [el("label", { class: "field" }, [el("span", { class: "field__l", text: "Owner (user or organisation)" }), owner]), el("label", { class: "field" }, [el("span", { class: "field__l", text: "Repository" }), repo]), el("label", { class: "field" }, [el("span", { class: "field__l", text: "Branch" }), branch])]),
      el("label", { class: "field" }, [el("span", { class: "field__l", text: "Fine-grained personal access token (kept in memory only)" }), token]),
      el("div", { class: "row" }, [connectBtn]), state, el("hr"), el("div", { class: "row" }, [pubBtn]), out]));
    drawState();
  };
  function download(name, text) { var a = el("a", { href: URL.createObjectURL(new Blob([text], { type: "application/json" })), download: name }); document.body.appendChild(a); a.click(); a.remove(); }
  function pickFile(accept, cb) { var i = el("input", { type: "file", accept: accept }); i.onchange = function () { var f = i.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { cb(String(r.result)); }; r.readAsText(f); }; i.click(); }
})();

