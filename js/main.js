/* Entry point: wires interactions, the enquiry form, then refreshes content from JSON. */
(function () {
  "use strict";
  window.SS = window.SS || {};
  var formBound = false;

  function digits(s) { return String(s || "").replace(/\D/g, ""); }

  function bindForm() {
    if (formBound) return; formBound = true;
    document.addEventListener("click", function (e) {
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
    });
  }

  function prefill() {
    var f = document.getElementById("enq-form"); if (!f) return;
    var p = new URLSearchParams(location.search).get("programme");
    if (p && f.elements.programme) { [].forEach.call(f.elements.programme.options, function (o) { if (o.value === p) f.elements.programme.value = p; }); }
  }

  function init() {
    SS.nav.init(); SS.gallery.init(); SS.anim.init(); bindForm(); prefill();
    var y = document.querySelector("[data-year]"); if (y) y.textContent = new Date().getFullYear();
  }
  SS.init = init;

  function start() {
    init();
    SS.loader.run().then(function (changed) { if (changed) { init(); window.scrollTo(window.scrollX, window.scrollY); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

