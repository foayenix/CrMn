// Makes the party-size chips (2/4/6/8) and the custom number box in the
// booking widget selectable. Purely cosmetic — no data is submitted anywhere.
// Uses event delegation on document because the widget is mounted async by
// the page's React-based renderer, so the elements may not exist yet at
// script-load time.
(function () {
  document.addEventListener("click", function (e) {
    const chip = e.target.closest(".cm-chip");
    if (!chip) return;
    const group = chip.closest("#cm-party-group");
    if (!group) return;
    group.querySelectorAll(".cm-chip").forEach(function (c) {
      c.classList.remove("is-active");
    });
    chip.classList.add("is-active");
    const customWrap = document.getElementById("cm-custom-wrap");
    const customInput = document.getElementById("cm-custom-size");
    if (customInput) customInput.value = "";
    if (customWrap) customWrap.classList.remove("is-active");
  });

  document.addEventListener("input", function (e) {
    if (e.target.id !== "cm-custom-size") return;
    const group = document.getElementById("cm-party-group");
    if (group) {
      group.querySelectorAll(".cm-chip").forEach(function (c) {
        c.classList.remove("is-active");
      });
    }
    const customWrap = document.getElementById("cm-custom-wrap");
    if (customWrap) customWrap.classList.add("is-active");
  });
})();
