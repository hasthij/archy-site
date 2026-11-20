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

  // Card stagger within a bento row.
  document.querySelectorAll(".bento > .card").forEach(function (c, i) { c.style.setProperty("--delay", ((i % 3) * 0.09).toFixed(2) + "s"); });

  // ---- Scroll and pointer motion (all transform/opacity; skipped with reduced motion) ----
  if (!reduce.matches) {
    var root = document.documentElement;
    root.classList.add("motion");

    // Section titles: words rise out of masks.
    var wi = 0;
    var split = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var o = document.createElement("span"); o.className = "sw";
            var i = document.createElement("span"); i.className = "sw__i"; i.textContent = part;
            i.style.setProperty("--i", wi++);
            o.appendChild(i); frag.appendChild(o);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) { split(n); }
      });
    };
    document.querySelectorAll(".section__head .section__title").forEach(function (t) { wi = 0; split(t); t.classList.add("has-split"); });

    var header = document.querySelector(".site-header");
    var parallax = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
    var cta = document.querySelector(".cta");
    var track = document.querySelector(".ticker__track");
    var tAnim = null;
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var lastY = window.scrollY, vel = 0, raf = 0;

    var frame = function () {
      raf = 0;
      var y = window.scrollY, dy = y - lastY;
      lastY = y;
      vel += (dy - vel) * 0.16;
      if (Math.abs(vel) < 0.02) vel = 0;

      if (header) {
        header.classList.toggle("is-scrolled", y > 8);
        if (!header.matches(":focus-within")) {
          if (y > 520 && dy > 6) header.classList.add("is-hidden");
          else if (dy < -6 || y < 240) header.classList.remove("is-hidden");
        }
      }
      var vh = window.innerHeight;
      parallax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        el.style.setProperty("--py", (-(r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute("data-parallax"))).toFixed(1));
      });
      if (cta) {
        var cr = cta.getBoundingClientRect();
        var p = clamp((vh - cr.top) / (vh * 0.75), 0, 1);
        cta.style.setProperty("--ci", (Math.pow(1 - p, 3) * 7).toFixed(2));
      }
      if (track && track.getAnimations) {
        if (!tAnim) tAnim = track.getAnimations()[0] || null;
        if (tAnim) tAnim.playbackRate = clamp(1 + vel * 0.28, -6, 9);
      }
      if (vel !== 0) raf = requestAnimationFrame(frame);
    };
    var kick = function () { if (!raf) raf = requestAnimationFrame(frame); };
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    kick();

    // Pointer-only polish (mouse / trackpad, not touch).
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.querySelectorAll(".card").forEach(function (card) {
        card.addEventListener("pointermove", function (e) {
          var r = card.getBoundingClientRect();
          card.style.setProperty("--mx", (e.clientX - r.left) + "px");
          card.style.setProperty("--my", (e.clientY - r.top) + "px");
        });
      });
      document.querySelectorAll(".btn--lg, .btn--xl").forEach(function (b) {
        b.addEventListener("pointermove", function (e) {
          var r = b.getBoundingClientRect();
          b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.1).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * 0.18).toFixed(1) + "px)";
        });
        b.addEventListener("pointerleave", function () { b.style.transform = ""; });
      });
      var hero = document.querySelector(".hero"), stack = document.querySelector(".demo__stack");
      if (hero && stack) {
        hero.addEventListener("pointermove", function (e) {
          var r = hero.getBoundingClientRect();
          stack.style.setProperty("--rx", (-((e.clientY - r.top) / r.height - 0.5) * 5).toFixed(2));
          stack.style.setProperty("--ry", (((e.clientX - r.left) / r.width - 0.5) * 7).toFixed(2));
        });
        hero.addEventListener("pointerleave", function () { stack.style.setProperty("--rx", 0); stack.style.setProperty("--ry", 0); });
      }
    }
  }
})();
