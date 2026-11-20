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

  // Download buttons: let the browser fetch the installer, then show the thanks + SmartScreen note.
  var thanks = document.getElementById("dl-thanks");
  if (thanks && thanks.showModal) {
    document.querySelectorAll('a[href$="Archy-Setup.exe"]:not([data-no-thanks])').forEach(function (a) {
      a.addEventListener("click", function () {
        setTimeout(function () { if (!thanks.open) thanks.showModal(); }, 300);
      });
    });
    thanks.querySelector(".dl__close").addEventListener("click", function () { thanks.close(); });
    // Click on the dim backdrop (outside the box) closes it.
    thanks.addEventListener("click", function (e) {
      var r = thanks.getBoundingClientRect();
      if (e.target === thanks && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) thanks.close();
    });
  }

  // Latest release: the exe link already follows /releases/latest/download, but the zip is
  // not always attached to the newest release, so look up the newest one that has it.
  // One anonymous GET to api.github.com; if it fails the static fallback links still work.
  function mb(n) { return n >= 1e8 ? Math.round(n / 1e6) + " MB" : (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + " MB"; }
  function fill(key, text) {
    document.querySelectorAll('[data-latest="' + key + '"]').forEach(function (el) { el.textContent = text; });
  }
  if (window.fetch && document.querySelector("[data-asset], [data-latest]")) {
    fetch("https://api.github.com/repos/hasthij/Archy/releases?per_page=12", { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (releases) {
        var exe = null, zip = null, newest = null;
        releases.forEach(function (rel) {
          if (rel.draft || rel.prerelease) return;
          newest = newest || rel;
          (rel.assets || []).forEach(function (a) {
            if (!exe && /^Archy-Setup\.exe$/i.test(a.name)) exe = a;
            if (!zip && /^Archy(-[\d.]+)?\.zip$/i.test(a.name)) zip = a;
          });
        });
        if (newest) fill("version", newest.tag_name.replace(/^v?/, "v"));
        if (exe) fill("exe-size", "~" + mb(exe.size));
        if (zip) {
          fill("zip-size", mb(zip.size));
          document.querySelectorAll('a[data-asset="zip"]').forEach(function (a) { a.href = zip.browser_download_url; });
        }
      })
      .catch(function () {});
  }

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

  // Looping animations: stop painting them while nobody can see them.
  var live = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) { entry.target.classList.toggle("is-paused", !entry.isIntersecting); });
  });
  document.querySelectorAll("[data-live]").forEach(function (el) { live.observe(el); });

  // Guide: highlight the table-of-contents link of the chapter being read.
  var tocLinks = document.querySelectorAll(".toc a");
  if (tocLinks.length) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var chapters = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        tocLinks.forEach(function (a) { a.removeAttribute("aria-current"); });
        var a = byId[e.target.id];
        if (a) a.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    document.querySelectorAll(".chapter[id]").forEach(function (c) { chapters.observe(c); });
  }

  // Thin scroll-progress bar under the header (transform only).
  var bar = document.querySelector(".progress");
  if (bar) {
    var ticking = false;
    var update = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
      ticking = false;
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // Step clips: play only while on screen, and never with reduced motion (the poster stays).
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var clips = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var v = entry.target;
      if (entry.isIntersecting && !reduce.matches) {
        var p = v.play();
        if (p) p.catch(function () {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll("video.shot").forEach(function (v) { clips.observe(v); });
})();
