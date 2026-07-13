// Lets visitors preview the site in alternate colour schemes (Wine / Navy / Green).
// Adds a small floating swatch switcher, persisted via localStorage across pages.
(function () {
  var STORAGE_KEY = "cm-theme";
  var THEMES = [
    { id: "wine", label: "Wine" },
    { id: "navy", label: "Navy" },
    { id: "green", label: "Green" }
  ];

  function applyTheme(id) {
    if (id === "wine") {
      document.documentElement.removeAttribute("data-cm-theme");
    } else {
      document.documentElement.setAttribute("data-cm-theme", id);
    }
  }

  var saved = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch (e) {}
  applyTheme(saved || "wine");

  function buildSwitcher() {
    if (document.getElementById("cm-theme-switcher")) return;

    var wrap = document.createElement("div");
    wrap.id = "cm-theme-switcher";

    var label = document.createElement("span");
    label.textContent = "Colour";
    wrap.appendChild(label);

    var buttons = [];
    THEMES.forEach(function (t) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.title = t.label;
      btn.setAttribute("data-swatch", t.id);
      btn.setAttribute("aria-label", t.label);
      btn.addEventListener("click", function () {
        applyTheme(t.id);
        try {
          localStorage.setItem(STORAGE_KEY, t.id);
        } catch (e) {}
        updateActive();
      });
      buttons.push(btn);
      wrap.appendChild(btn);
    });

    function updateActive() {
      var current = document.documentElement.getAttribute("data-cm-theme") || "wine";
      buttons.forEach(function (b) {
        b.setAttribute("data-active", b.getAttribute("data-swatch") === current ? "true" : "false");
      });
    }

    document.body.appendChild(wrap);
    updateActive();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildSwitcher);
  } else {
    buildSwitcher();
  }
})();
