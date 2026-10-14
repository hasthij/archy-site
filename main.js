// Archy site: scroll reveals and pausing the HUD when it's off screen.
// No tracking, no storage, no network.
(function () {
  "use strict";

  var reveals = document.querySelectorAll("[data-reveal], [data-reveal-group]");

  // Stagger: children of a group, and sibling steps, get increasing delays.
  document.querySelectorAll("[data-reveal-group]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty("--delay", (0.12 + i * 0.05).toFixed(2) + "s");
    });
  });
  document.querySelectorAll(".step").forEach(function (step, i) {
    step.style.setProperty("--delay", (i * 0.14).toFixed(2) + "s");
  });

  if (!("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }

  var revealer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        revealer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
  reveals.forEach(function (el) { revealer.observe(el); });

  // The HUD loops forever; stop painting it while nobody can see it.
  var hud = document.querySelector(".hud");
  if (hud) {
    new IntersectionObserver(function (entries) {
      hud.classList.toggle("is-paused", !entries[0].isIntersecting);
    }).observe(hud);
  }
})();
