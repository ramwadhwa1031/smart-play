/* Smart Start Admin CMS controller & router. */
(function () {
  "use strict";
  var AS = window.AS;

  function updateStatus() {
    var pill = document.getElementById("draft-pill");
    if (!pill) return;
    var ch = AS.changedFiles ? AS.changedFiles() : [];
    var n = ch.length + (AS.deleted ? AS.deleted.length : 0);
    if (n > 0) {
      pill.className = "badge badge--warn";
      pill.textContent = n + " unpublished change" + (n === 1 ? "" : "s");
    } else {
      pill.className = "badge badge--ok";
      pill.textContent = "All changes synced";
    }
  }

  function router() {
    var root = document.getElementById("view");
    if (!root || !AS.views) return;
    var defaultView = document.body.getAttribute("data-default-view") || "dashboard";
    var raw = (location.hash || "").replace(/^#\/?/, "");
    if (!raw) raw = defaultView;
    var parts = raw.split("/");
    var name = parts[0] || "dashboard";
    var sub = parts.slice(1).join("/");
    var fn = AS.views[name] || AS.views.dashboard;

    document.querySelectorAll(".side-nav a[data-nav]").forEach(function (a) {
      var active = a.getAttribute("data-nav") === name;
      a.classList.toggle("is-active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    document.body.classList.remove("side-open");
    root.innerHTML = "";
    try {
      fn(root, sub);
    } catch (e) {
      root.appendChild(AS.el("div", { class: "msg error", text: "Error rendering view: " + e.message }));
      if (window.console) console.error(e);
    }
    updateStatus();
  }
  AS.router = router;

  function boot() {
    if (/^https?:$/.test(location.protocol) && window.history && history.replaceState && /\/index\.html$/i.test(location.pathname)) {
      history.replaceState(null, "", location.pathname.replace(/index\.html$/i, "") + location.search + location.hash);
    }
    var root = document.getElementById("view");
    var menuBtn = document.getElementById("side-toggle");
    if (menuBtn) {
      menuBtn.addEventListener("click", function () {
        document.body.classList.toggle("side-open");
      });
    }
    var prevBtn = document.getElementById("btn-preview");
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        window.open("../index.html?preview=1", "_blank");
      });
    }

    AS.on(updateStatus);
    window.addEventListener("hashchange", router);

    AS.load().then(function () {
      router();
    }).catch(function (e) {
      if (root) {
        root.innerHTML = "";
        root.appendChild(AS.el("div", { class: "msg error" }, [
          AS.el("strong", { text: "Could not load website data JSON files. " }),
          AS.el("span", { text: e.message + ". Make sure you open the admin panel over a local web server (e.g. http://localhost:8080/admin/) or GitHub Pages, rather than double-clicking a file:// URL." })
        ]));
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

