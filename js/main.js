// Kanoo Performance — shared site behaviour (nav, marquee is pure CSS, reveal-on-scroll, stat count-up)
(function () {
  "use strict";

  /* mobile nav ------------------------------------------------------ */
  var burger = document.querySelector(".nav-burger");
  var links = document.querySelector(".nav-links");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open-mobile");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* scroll-reveal ----------------------------------------------------*/
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
    // Safety net: never leave content invisible if IO stalls for any reason.
    setTimeout(function () {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    }, 4000);
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* stat count-up ------------------------------------------------------*/
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"), 10) : 0;
    var dur = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString()) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* active nav link by page ------------------------------------------*/
  var here = (location.pathname.split("/").pop() || "index.html");
  document.querySelectorAll(".nav-links a[href]").forEach(function (a) {
    if (a.getAttribute("href") === here) a.classList.add("active");
  });
})();
