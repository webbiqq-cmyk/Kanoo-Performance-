// Kanoo Performance — shared site behaviour
// Nav, reveal-on-scroll, stat count-up, work filter, WhatsApp contact form.
(function () {
  "use strict";

  var WHATSAPP = "97317780555"; // +973 1778 0555
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    var navTicking = false;
    var onScroll = function () {
      nav.style.background = window.scrollY > 20
        ? "rgba(243,244,244,.95)" : "rgba(243,244,244,.82)";
    };
    window.addEventListener("scroll", function () {
      if (navTicking) return;
      navTicking = true;
      requestAnimationFrame(function () { navTicking = false; onScroll(); });
    }, { passive: true });
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
    setTimeout(function () { revealEls.forEach(function (el) { el.classList.add("in"); }); }, 3000);
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  var marquee = document.querySelector(".marquee");
  if (marquee && "IntersectionObserver" in window) {
    var marqueeIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        marquee.classList.toggle("is-paused", !entry.isIntersecting);
      });
    });
    marqueeIo.observe(marquee);
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
      !reduceMotion) {
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
    var canUse3D = !reduceMotion && window.matchMedia("(min-width: 721px)").matches && !!document.createElement("canvas").getContext("webgl");
    var scriptStarted = false;
    var fallback = document.querySelector(".hero-car-fallback");
    var BASE_THETA = -32, BASE_PHI = 80, RADIUS = "92%";
    var userDragging = false;
    car.addEventListener("pointerdown", function () { userDragging = true; });
    car.addEventListener("pointerup", function () { userDragging = false; });
    car.addEventListener("pointercancel", function () { userDragging = false; });
    function loadModelViewer() {
      if (scriptStarted || !canUse3D) {
        if (!canUse3D) document.documentElement.classList.add("no-hero-3d");
        return;
      }
      scriptStarted = true;
      document.documentElement.classList.add("hero-3d-loading");
      car.setAttribute("src", car.getAttribute("data-src"));
      import("https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js").catch(function () {
        document.documentElement.classList.add("no-hero-3d");
      });
    }
    if ("IntersectionObserver" in window) {
      var carIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { loadModelViewer(); carIo.disconnect(); }
        });
      }, { rootMargin: "300px 0px" });
      carIo.observe(car);
    } else {
      loadModelViewer();
    }
    // scroll nudges the orbit while the hero is on screen (unless the user is dragging)
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!scriptStarted || userDragging || ticking) return;
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
    /* ---- body-colour changer ------------------------------------- */
    var PAINT = [
      { name: "Rosso",     hex: "#c11a17" },
      { name: "Nero",      hex: "#16181b" },
      { name: "Grigio",    hex: "#3b4046" },
      { name: "Blu Notte", hex: "#122442" },
      { name: "Verde",     hex: "#14291d" }
    ];
    function s2l(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    function toLin(hex) {
      var n = parseInt(hex.slice(1), 16);
      return [s2l((n >> 16) & 255), s2l((n >> 8) & 255), s2l(n & 255), 1];
    }
    var LIN = PAINT.map(function (p) { return toLin(p.hex); });
    var body = null, paintIdx = 0, paintAnim = null, paintTimer = null;

    function animatePaint(target) {
      if (!body) return;
      if (paintAnim) cancelAnimationFrame(paintAnim);
      var from = body.pbrMetallicRoughness.baseColorFactor.slice(), t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 650, 1), e = 1 - Math.pow(1 - p, 3);
        body.pbrMetallicRoughness.setBaseColorFactor([
          from[0] + (target[0] - from[0]) * e,
          from[1] + (target[1] - from[1]) * e,
          from[2] + (target[2] - from[2]) * e, 1
        ]);
        if (p < 1) paintAnim = requestAnimationFrame(step);
      }
      paintAnim = requestAnimationFrame(step);
    }
    function setPaint(i, fromUser) {
      paintIdx = (i % PAINT.length + PAINT.length) % PAINT.length;
      animatePaint(LIN[paintIdx]);
      var btns = document.querySelectorAll("#paintSwatches button");
      for (var b = 0; b < btns.length; b++) {
        btns[b].setAttribute("aria-pressed", b === paintIdx ? "true" : "false");
      }
      if (fromUser && paintTimer) { clearInterval(paintTimer); paintTimer = null; }
    }

    var swatchWrap = document.getElementById("paintSwatches");
    if (swatchWrap) {
      PAINT.forEach(function (p, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.title = p.name;
        b.style.background = p.hex;
        b.setAttribute("aria-label", "Body colour: " + p.name);
        b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
        b.addEventListener("click", function () { setPaint(i, true); });
        swatchWrap.appendChild(b);
      });
    }

    car.addEventListener("load", function () {
      document.documentElement.classList.add("hero-3d-ready");
      if (fallback) fallback.loading = "lazy";
      var loader = car.querySelector(".hero-car-loading");
      if (loader) loader.remove();

      var mats = car.model ? car.model.materials : [];
      for (var m = 0; m < mats.length; m++) {
        if (/body/i.test(mats[m].name)) { body = mats[m]; break; }
      }
      if (body && !reduceMotion) {
        paintTimer = setInterval(function () { setPaint(paintIdx + 1); }, 6000);
      }

      if (reduceMotion) return;
      car.setAttribute("auto-rotate", "");
      car.setAttribute("auto-rotate-delay", "3000");
      car.setAttribute("rotation-per-second", "6deg");
    });
  }

  /* ---------------------------------------------------- featured build hotspots */
  var fbEyebrow = document.getElementById("fp-eyebrow");
  if (fbEyebrow) {
    var FB_DATA = {
      aero:    { eyebrow: "Aero & Body",     title: "Front splitter & carbon aero",           desc: "Hand-laid carbon splitter and skirts fitted and gap-checked in-house, paired with a fixed rear wing for real high-speed downforce — not just the look of it." },
      wheels:  { eyebrow: "Wheels & Brakes", title: "Forged wheels, big-brake package",        desc: "Lightweight forged monoblocks over a 6-piston front / 4-piston rear big-brake upgrade, bedded in and road-verified before handover." },
      exhaust: { eyebrow: "Exhaust",         title: "Titanium side-exit system",               desc: "Mandrel-bent titanium, hand-welded in the fab shop and dyno-tuned for flow and note — built to the client's spec, not off a shelf." },
      power:   { eyebrow: "Powertrain",      title: "Naturally-aspirated V12, recommissioned", desc: "Full service and recommission on the original powerplant — timing, cooling and ancillaries brought back to factory tolerance." }
    };
    var fbTitle = document.getElementById("fp-title");
    var fbDesc = document.getElementById("fp-desc");
    var fbSpots = document.querySelectorAll(".hotspot");
    var fbListBtns = document.querySelectorAll("#featureList button");
    var setFeature = function (key) {
      var d = FB_DATA[key];
      if (!d) return;
      fbEyebrow.textContent = d.eyebrow;
      fbTitle.textContent = d.title;
      fbDesc.textContent = d.desc;
      fbSpots.forEach(function (s) { s.classList.toggle("active", s.getAttribute("data-spot") === key); });
      fbListBtns.forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-spot") === key); });
    };
    fbSpots.forEach(function (s) { s.addEventListener("click", function () { setFeature(s.getAttribute("data-spot")); }); });
    fbListBtns.forEach(function (b) { b.addEventListener("click", function () { setFeature(b.getAttribute("data-spot")); }); });
  }

  /* ---------------------------------------------------- dashboard demo data */
  var dashboardRoot = document.querySelector("[data-dashboard]");
  if (dashboardRoot) {
    var demoJob = {
      owner: "Ahmed K.",
      vehicle: "Porsche 911 Turbo S",
      plate: "KP 911",
      advisor: "Yousef — Performance Desk",
      statusIndex: 3,
      stages: ["Received", "Inspection", "Parts", "Installation", "Testing", "QC", "Ready"],
      build: "Stage 2 ECU, titanium valved exhaust, full PPF refresh",
      eta: "Ready for testing: Thursday, 17 Sep",
      next: "Dyno validation and road log",
      history: [
        ["12 Sep", "Inspection complete", "Compression, leak check and baseline dyno logged"],
        ["10 Sep", "Vehicle received", "Paint inspection, intake scan and build sheet confirmed"],
        ["04 Jun", "Service", "Oil, filters, brake fluid and geometry check"]
      ],
      appointment: { date: "19 Sep", time: "10:30", type: "Handover appointment" }
    };
    function statusSteps() {
      return demoJob.stages.map(function (s, i) {
        var cls = i < demoJob.statusIndex ? " done" : i === demoJob.statusIndex ? " now" : "";
        return '<li class="' + cls + '"><span></span><b>' + s + '</b></li>';
      }).join("");
    }
    function historyRows() {
      return demoJob.history.map(function (h) {
        return '<div class="dash-row"><b>' + h[0] + '</b><span>' + h[1] + '</span><em>' + h[2] + '</em></div>';
      }).join("");
    }
    var panels = {
      overview: '<div class="dash-kpis"><div><span>Owner</span><b>' + demoJob.owner + '</b></div><div><span>Vehicle</span><b>' + demoJob.vehicle + '</b></div><div><span>Advisor</span><b>' + demoJob.advisor + '</b></div></div><h3>Current job</h3><p>' + demoJob.build + '</p><ul class="status-steps">' + statusSteps() + '</ul>',
      vehicle: '<div class="dash-vehicle-card"><img src="assets/build-06.jpg" alt="Porsche 911 in service bay" loading="lazy"><div><h3>' + demoJob.vehicle + '</h3><p>Plate ' + demoJob.plate + ' · Customer performance build</p><div class="dash-specs"><span>Baseline 572 hp</span><span>Target 690 hp</span><span>PPF refresh</span></div></div></div>',
      status: '<h3>Build status</h3><p>' + demoJob.next + '</p><ul class="status-steps status-steps--wide">' + statusSteps() + '</ul><div class="dash-note"><b>' + demoJob.eta + '</b><span>Owner approval is only needed if the scope changes.</span></div>',
      history: '<h3>Service history</h3>' + historyRows(),
      appointments: '<h3>Appointments</h3><div class="dash-appointment"><b>' + demoJob.appointment.date + '</b><span>' + demoJob.appointment.time + '</span><em>' + demoJob.appointment.type + '</em></div><a class="btn btn--sm btn--solid" href="tel:+97317780555">Call to reschedule</a>'
    };
    Object.keys(panels).forEach(function (key) {
      var panel = dashboardRoot.querySelector('[data-dash-panel-id="' + key + '"]');
      if (panel) panel.innerHTML = panels[key];
    });
    dashboardRoot.addEventListener("click", function (e) {
      var tab = e.target.closest(".dash-tab");
      if (!tab) return;
      var key = tab.getAttribute("data-dash-panel");
      dashboardRoot.querySelectorAll(".dash-tab").forEach(function (t) { t.classList.toggle("active", t === tab); });
      dashboardRoot.querySelectorAll(".dash-panel").forEach(function (panel) {
        panel.classList.toggle("active", panel.getAttribute("data-dash-panel-id") === key);
      });
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
