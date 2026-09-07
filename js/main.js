// Kanoo Performance — shared site behaviour
// Nav, reveal-on-scroll, stat count-up, work filter, WhatsApp contact form.
(function () {
  "use strict";

  var WHATSAPP = "97317780555"; // +973 1778 0555

  /* ---------------------------------------------------- mobile nav */
  var burger = document.querySelector(".nav-burger");
  var links = document.getElementById("navLinks");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open-mobile");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open-mobile");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------------------------------------------- nav on scroll */
  var nav = document.getElementById("nav");
  if (nav) {
    var onScroll = function () {
      nav.style.background = window.scrollY > 20
        ? "rgba(243,244,244,.95)" : "rgba(243,244,244,.82)";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------- reveal */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
    setTimeout(function () { revealEls.forEach(function (el) { el.classList.add("in"); }); }, 4000);
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------------------------------------------- count-up */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1500, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(target * eased);
      el.textContent = val.toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------------------------------------------------- hero 3D car */
  var car = document.getElementById("heroCar");
  if (car) {
    var BASE_THETA = -32, BASE_PHI = 80, RADIUS = "92%";
    var userDragging = false;
    car.addEventListener("pointerdown", function () { userDragging = true; });
    // scroll nudges the orbit while the hero is on screen (unless the user is dragging)
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (userDragging || ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var h = window.innerHeight || 800;
        var p = Math.min(Math.max(window.scrollY / h, 0), 1);
        try {
          car.cameraOrbit = (BASE_THETA + p * 60) + "deg " + (BASE_PHI - p * 8) + "deg " + RADIUS;
        } catch (err) { /* model-viewer not ready */ }
      });
    }, { passive: true });
    // gentle idle drift until first interaction
    car.addEventListener("load", function () {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      car.setAttribute("auto-rotate", "");
      car.setAttribute("auto-rotate-delay", "3000");
      car.setAttribute("rotation-per-second", "6deg");
    });
  }

  /* ---------------------------------------------------- work filter */
  var filter = document.getElementById("workFilter");
  var grid = document.getElementById("workGrid");
  if (filter && grid) {
    filter.addEventListener("click", function (e) {
      var btn = e.target.closest(".chip");
      if (!btn) return;
      filter.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
      btn.classList.add("active");
      var f = btn.getAttribute("data-f");
      grid.querySelectorAll(".build").forEach(function (card) {
        var show = f === "all" || card.getAttribute("data-cat") === f;
        card.style.display = show ? "" : "none";
      });
    });
  }

  /* ---------------------------------------------------- toast */
  var toast = document.getElementById("toast");
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }

  /* ---------------------------------------------------- contact → WhatsApp */
  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
      var lines = [
        "Kanoo Performance — enquiry",
        "",
        "Name: " + (v("c-name") || "—"),
        "Phone: " + (v("c-phone") || "—"),
        "Vehicle: " + (v("c-car") || "—"),
        "Interest: " + (v("c-service") || "—"),
        "",
        (v("c-msg") || "(no message)")
      ];
      var url = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n"));
      showToast("Opening WhatsApp…");
      window.open(url, "_blank", "noopener");
    });
  }

  /* ---------------------------------------------------- scrollspy */
  var spyLinks = [].slice.call(document.querySelectorAll(".nav-links a")).filter(function (a) {
    var h = a.getAttribute("href") || "";
    return h.charAt(0) === "#" || a.hasAttribute("data-spy");
  });
  if (spyLinks.length) {
    var sections = spyLinks.map(function (a) {
      var id = a.getAttribute("data-spy") || a.getAttribute("href").slice(1);
      return { link: a, el: document.getElementById(id) };
    }).filter(function (s) { return s.el; });

    var spy = function () {
      var line = window.scrollY + window.innerHeight * 0.32;
      var current = null, bestTop = -Infinity;
      sections.forEach(function (s) {
        var top = s.el.getBoundingClientRect().top + window.scrollY;
        if (top <= line && top > bestTop) { bestTop = top; current = s; }
      });
      // pin the last section (by document order) once scrolled to the bottom
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = sections.slice().sort(function (a, b) {
          return (a.el.getBoundingClientRect().top) - (b.el.getBoundingClientRect().top);
        }).pop();
      }
      spyLinks.forEach(function (a) { a.classList.remove("active"); });
      if (current) current.link.classList.add("active");
    };

    var spyRaf = false;
    var onSpy = function () {
      if (spyRaf) return;
      spyRaf = true;
      requestAnimationFrame(function () { spyRaf = false; spy(); });
    };
    window.addEventListener("scroll", onSpy, { passive: true });
    window.addEventListener("resize", onSpy, { passive: true });
    window.addEventListener("hashchange", onSpy);
    spy();
  }
})();
