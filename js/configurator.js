// Kanoo Performance — Build Configurator
// Data-driven spec builder: model -> exterior/performance/wheels/finish -> live SVG + HUD + price + WhatsApp inquiry.
(function () {
  "use strict";

  var WHATSAPP_NUMBER = "97317780555"; // +973 1778 0555

  /* ------------------------------------------------------------ DATA */
  var MODELS = {
    m4: {
      name: "BMW M4 Competition",
      tag: "Coupe · S58 3.0L Twin-Turbo I6",
      baseHP: 503,
      kits: [
        { id: "stock", label: "Stock Bumpers", sub: "Factory M4 aero", price: 0 },
        { id: "sport", label: "Sport Line", sub: "Carbon lip + side skirts", price: 650 },
        { id: "wide", label: "Widebody", sub: "Flared arches, full aero", price: 2400 }
      ],
      wings: [
        { id: "none", label: "No Spoiler", sub: "Clean decklid", price: 0 },
        { id: "duck", label: "Ducktail", sub: "Subtle trunk spoiler", price: 320 },
        { id: "gt", label: "GT Wing", sub: "Fixed carbon wing", price: 950 }
      ],
      wstyles: [
        { id: "oem", label: "OEM Style", sub: "Factory forged", price: 0 },
        { id: "5spoke", label: "5-Spoke Forged", sub: "Lightweight monoblock", price: 900 },
        { id: "concave", label: "Deep Concave", sub: "Multi-spoke, aggressive fit", price: 1450 }
      ],
      susps: [
        { id: "stock", label: "Stock Suspension", sub: "Factory ride", price: 0, mm: 0 },
        { id: "springs", label: "Lowering Springs", sub: "-25mm, stiffer rate", price: 420, mm: -25 },
        { id: "coilover", label: "Coilovers", sub: "-35mm, full adjustable", price: 1350, mm: -35 },
        { id: "air", label: "Air Suspension", sub: "Adjustable ride height", price: 2200, mm: -40 }
      ],
      sizes: ["19", "20", "21"]
    },
    sclass: {
      name: "Mercedes-Benz S-Class",
      tag: "Sedan · Flagship Luxury Inline-6 Hybrid",
      baseHP: 429,
      kits: [
        { id: "stock", label: "Stock Bumpers", sub: "Factory S-Class lines", price: 0 },
        { id: "sport", label: "AMG-Line Kit", sub: "Deeper front apron + skirts", price: 720 },
        { id: "wide", label: "Executive Widebody", sub: "Flush wide-arch conversion", price: 2600 }
      ],
      wings: [
        { id: "none", label: "No Spoiler", sub: "Factory deck", price: 0 },
        { id: "duck", label: "Trunk Lip", sub: "Understated lip spoiler", price: 280 },
        { id: "gt", label: "Chrome Delete Trim", sub: "Blacked-out trim package", price: 540 }
      ],
      wstyles: [
        { id: "oem", label: "OEM Style", sub: "Factory forged", price: 0 },
        { id: "5spoke", label: "Multi-Spoke Forged", sub: "20-way brushed finish", price: 980 },
        { id: "concave", label: "Deep Concave", sub: "Show-car fitment", price: 1600 }
      ],
      susps: [
        { id: "stock", label: "Air Body Control", sub: "Factory adaptive air ride", price: 0, mm: 0 },
        { id: "springs", label: "Lowering Module", sub: "-15mm firmer stance", price: 480, mm: -15 },
        { id: "coilover", label: "Adjustable Air Coilover", sub: "-25mm, tuned damping", price: 1650, mm: -25 },
        { id: "air", label: "Performance Air Suspension", sub: "Ride-height on demand", price: 2400, mm: -30 }
      ],
      sizes: ["20", "21", "22"]
    },
    g63: {
      name: "Mercedes-AMG G63",
      tag: "SUV · 4.0L Bi-Turbo V8 “G-Wagon”",
      baseHP: 577,
      kits: [
        { id: "stock", label: "Stock Armor", sub: "Factory G63 body", price: 0 },
        { id: "sport", label: "Steel Bar + Side Steps", sub: "ARB-style front bar, rock rails", price: 780 },
        { id: "wide", label: "Portal Widebody", sub: "Widened fenders, off-road flares", price: 3200 }
      ],
      wings: [
        { id: "none", label: "Clean Roof", sub: "No rack", price: 0 },
        { id: "duck", label: "Roof Light Bar", sub: "LED light bar + mounts", price: 420 },
        { id: "gt", label: "Roof Rack + Ladder", sub: "Expedition-ready rack", price: 680 }
      ],
      wstyles: [
        { id: "oem", label: "OEM Style", sub: "Factory alloy", price: 0 },
        { id: "5spoke", label: "Off-Road Alloy", sub: "Reinforced beadlock-look", price: 1100 },
        { id: "concave", label: "Beadlock", sub: "True beadlock rings", price: 1750 }
      ],
      susps: [
        { id: "stock", label: "Stock Suspension", sub: "Factory height", price: 0, mm: 0 },
        { id: "springs", label: "Lift Kit", sub: "+40mm, larger tires", price: 750, mm: 40 },
        { id: "coilover", label: "Portal Gear Lift", sub: "+60mm, adjustable coilover", price: 1900, mm: 60 },
        { id: "air", label: "Adjustable Air Suspension", sub: "On-road/off-road modes", price: 2500, mm: 20 }
      ],
      sizes: ["20", "22", "24"]
    }
  };

  var EXHAUST = [
    { id: "stock", label: "Stock Exhaust", sub: "Factory system", price: 0, hp: 0 },
    { id: "sport", label: "Sport Cat-Back", sub: "Deeper tone, light gain", price: 480, hp: 18 },
    { id: "valve", label: "Valvetronic Active", sub: "Switchable quiet/loud", price: 950, hp: 28 },
    { id: "race", label: "Full Titanium Race", sub: "Max flow, weight savings", price: 1850, hp: 45 }
  ];
  var ECU = [
    { id: "stock", label: "Stock ECU", sub: "Factory tune", price: 0, hp: 0 },
    { id: "s1", label: "Stage 1", sub: "Software only", price: 650, hp: 45 },
    { id: "s2", label: "Stage 2", sub: "+ supporting hardware", price: 1400, hp: 85 },
    { id: "s2p", label: "Stage 2+", sub: "Turbo-back, race fuel ready", price: 2600, hp: 130 }
  ];
  var INTAKE = [
    { id: "stock", label: "Stock Intake", sub: "Factory airbox", price: 0, hp: 0 },
    { id: "perf", label: "Performance Intake", sub: "Cold-air + charge pipe", price: 380, hp: 12 }
  ];
  var BRAKES = [
    { id: "stock", label: "Stock Brakes", sub: "Factory calipers", price: 0, tag: "" },
    { id: "big", label: "Big Brake Kit", sub: "6-piston, red calipers", price: 1600, tag: "red" },
    { id: "carbon", label: "Carbon Ceramic", sub: "Track-grade, yellow calipers", price: 4200, tag: "yellow" }
  ];
  var WSIZE_PRICE = { "19": 0, "20": 150, "21": 320, "22": 520, "24": 780 };
  var WFINISH = [
    { id: "black", label: "Gloss Black", sub: "", price: 0, hex: "#161619" },
    { id: "bronze", label: "Matte Bronze", sub: "", price: 90, hex: "#8a6a3c" },
    { id: "silver", label: "Brushed Silver", sub: "", price: 90, hex: "#b9bcc2" },
    { id: "red", label: "Candy Red", sub: "", price: 140, hex: "#a01d2a" }
  ];
  var TIRES = [
    { id: "street", label: "Street", sub: "Comfort + daily grip", price: 0 },
    { id: "perf", label: "Performance Summer", sub: "Max dry grip", price: 220 },
    { id: "at", label: "All-Terrain", sub: "On/off-road", price: 260 }
  ];
  var FINISH_TYPE = [
    { id: "paint", label: "Factory Paint", sub: "OEM color, gloss finish", price: 0 },
    { id: "matte", label: "Matte Wrap", sub: "Full color-change", price: 1600 },
    { id: "satin", label: "Satin Wrap", sub: "Full color-change", price: 1750 },
    { id: "gloss", label: "Gloss Wrap", sub: "Full color-change", price: 1900 }
  ];
  var COLORS = [
    { id: "red", label: "KP Red", hex: "#c8202e" },
    { id: "black", label: "Jet Black", hex: "#0c0c0e" },
    { id: "white", label: "Alpine White", hex: "#eef0f2" },
    { id: "grey", label: "Selenite Grey", hex: "#6b6f76" },
    { id: "green", label: "Verde Mantis", hex: "#1f5c3f" },
    { id: "blue", label: "Frozen Blue", hex: "#2c4d86" }
  ];
  var PPF = [
    { id: "none", label: "No PPF", sub: "", price: 0 },
    { id: "partial", label: "Partial Front", sub: "Bumper, hood edge, mirrors", price: 650 },
    { id: "full", label: "Full Body", sub: "Ziebart / LLumar, full coverage", price: 2400 }
  ];
  var TINT = [
    { id: "20", label: "20% Tint", sub: "", price: 0 },
    { id: "35", label: "35% Tint", sub: "", price: 0 },
    { id: "50", label: "50% Tint", sub: "", price: 0 },
    { id: "ceramic", label: "Ceramic IR", sub: "Max heat rejection", price: 480 }
  ];
  var INTERIOR = [
    { id: "standard", label: "Standard Interior", sub: "", price: 0 },
    { id: "alcantara", label: "Alcantara Package", sub: "Wheel, shifter, inserts", price: 850 },
    { id: "carbon", label: "Carbon Trim Package", sub: "Full interior carbon", price: 650 }
  ];

  /* ------------------------------------------------------------ STATE */
  var state = {
    model: "m4", kit: "stock", wing: "none", exhaust: "stock",
    ecu: "stock", susp: "stock", intake: "stock", brakes: "stock",
    wstyle: "oem", wsize: null, wfinish: "black", tires: "street",
    finish: "paint", color: "red", ppf: "none", tint: "20", interior: "standard"
  };
  state.wsize = MODELS[state.model].sizes[1];

  function findOpt(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return list[0]; }
  function M() { return MODELS[state.model]; }

  /* -------------------------------------------------------- SVG STAGE */
  function wheelSVG(cx, cy, r, style, hex) {
    var spokes = style === "5spoke" ? 5 : style === "concave" ? 8 : 6;
    var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#0a0a0c" stroke="#4b4b54" stroke-width="5"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.46) + '" fill="' + hex + '" stroke="#000" stroke-width="1.5"/>';
    for (var i = 0; i < spokes; i++) {
      var a = (Math.PI * 2 * i) / spokes;
      var x2 = cx + Math.cos(a) * r * 0.42, y2 = cy + Math.sin(a) * r * 0.42;
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + hex + '" stroke-width="4"/>';
    }
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.14) + '" fill="#1a1a1e"/>';
    return s;
  }

  function bodyPathFor(model, kit) {
    if (model === "g63") {
      // boxy SUV
      var flare = kit === "wide" ? 10 : kit === "sport" ? 4 : 0;
      return "M40 " + (150 - flare) + " V96 Q40 78 60 78 H120 L140 54 H340 L364 78 H420 Q440 78 440 96 V" + (150 - flare) +
        " H40 Z M40 " + (150) + " H" + (60 - flare) + " M420 " + (150) + " H" + (460 + flare);
    }
    if (model === "sclass") {
      var w = kit === "wide" ? 6 : kit === "sport" ? 2 : 0;
      return "M30 172c0-8 10-14 22-14h20l22-32c10-14 30-22 50-22h150c20 0 38 9 49 24l26 30h24c14 0 24 8 24 16v" + (10 + w) +
        "c0 8-6 14-14 14H36c-8 0-14-6-14-14Z";
    }
    // m4 coupe (default)
    var flareM = kit === "wide" ? 8 : kit === "sport" ? 3 : 0;
    return "M40 " + (178 - flareM) + "c0-8 10-14 24-14h30l18-30c8-13 26-24 46-24h96c22 0 42 10 54 26l22 28h26c14 0 24 8 24 18v10c0 8-6 14-14 14H54c-8 0-14-6-14-14Z";
  }

  function renderCarSVG() {
    var m = M();
    var color = findOpt(COLORS, state.color).hex;
    var wf = findOpt(WFINISH, state.wfinish).hex;
    var susp = findOpt(m.susps, state.susp);
    var liftPx = Math.max(-18, Math.min(18, -(susp.mm || 0) / 3)); // visual only, capped
    var glow = (findOpt(EXHAUST, state.exhaust).hp || 0) > 25 ? 1 : 0.45;
    var wideOn = state.kit === "wide";
    var isG63 = state.model === "g63";
    var isS = state.model === "sclass";

    var vb = "0 0 520 240";
    var body = bodyPathFor(state.model, state.kit);
    var sheen = state.finish !== "paint" ? '<rect x="60" y="70" width="380" height="18" rx="9" fill="#ffffff" opacity="' + (state.finish === "gloss" ? 0.16 : state.finish === "satin" ? 0.1 : 0.06) + '" transform="skewX(-18)"/>' : "";

    var wingHTML = "";
    if (state.wing === "duck") wingHTML = isG63
      ? '<rect x="150" y="46" width="120" height="8" rx="3" fill="#111" stroke="#e4231a" stroke-width="1"/>'
      : '<path d="M300 ' + (60 + (isS?6:0)) + ' q30 -6 46 4" stroke="#111" stroke-width="8" fill="none" stroke-linecap="round"/>';
    if (state.wing === "gt") wingHTML = isG63
      ? '<rect x="120" y="40" width="200" height="10" rx="2" fill="#111"/><rect x="130" y="24" width="20" height="18" fill="#222"/><rect x="330" y="24" width="20" height="18" fill="#222"/>'
      : '<path d="M298 58 L340 40 M340 40 L360 40 L360 58 M298 58 L360 58" stroke="#111" stroke-width="6" fill="none" stroke-linecap="round"/>';

    var kitHTML = "";
    if (wideOn) {
      kitHTML += '<path d="M120 176 q20 12 46 0" stroke="' + color + '" stroke-width="10" fill="none" opacity=".9"/>';
      kitHTML += '<path d="M336 176 q20 12 46 0" stroke="' + color + '" stroke-width="10" fill="none" opacity=".9"/>';
      kitHTML += '<rect x="150" y="182" width="220" height="7" rx="3" fill="#111"/>';
    } else if (state.kit === "sport") {
      kitHTML += '<rect x="160" y="182" width="200" height="4" rx="2" fill="#222"/>';
    }

    var exhaustHTML = '<circle cx="' + (isG63 ? 470 : 486) + '" cy="180" r="7" fill="#151517" stroke="' + color + '" stroke-width="1"/>' +
      '<circle cx="' + (isG63 ? 470 : 486) + '" cy="180" r="10" fill="none" stroke="#e4231a" stroke-width="2" opacity="' + glow + '"/>';

    var brakeHex = state.brakes === "big" ? "#e0313a" : state.brakes === "carbon" ? "#f0c419" : "#26262c";
    void brakeHex; // reserved for a future caliper-color accent pass

    var svg = '<svg viewBox="' + vb + '" fill="none" aria-label="' + m.name + ' preview">' +
      '<g transform="translate(0,' + liftPx.toFixed(1) + ')">' +
      '<path d="' + body + '" fill="' + color + '" stroke="#000" stroke-width="2"/>' +
      sheen + kitHTML + wingHTML +
      '<path d="' + (isG63 ? "M92 96 L100 60 H360 L368 96 Z" : isS ? "M150 132l16-27c7-11 21-19 35-19h84c17 0 33 8 42 21l17 25" : "M132 134l16-27c7-11 21-19 35-19h84c17 0 33 8 42 21l17 25") +
      '" fill="#0a0a0c" stroke="#3a3a42" stroke-width="1.5" opacity=".9"/>' +
      exhaustHTML +
      wheelSVG(isG63 ? 118 : 150, 178, isG63 ? 34 : 30, state.wstyle, wf) +
      wheelSVG(isG63 ? 402 : 366, 178, isG63 ? 34 : 30, state.wstyle, wf) +
      "</g></svg>";
    return svg;
  }

  /* --------------------------------------------------------- OPTION UI */
  function cardHTML(item, selected, priceLabel) {
    var sel = item.id === selected ? " sel" : "";
    var price = item.price > 0 ? '<span class="delta">+' + item.price + " BD</span>" : "";
    return '<button type="button" class="opt-card' + sel + '" data-id="' + item.id + '">' +
      "<b>" + item.label + price + "</b><span>" + (item.sub || "") + "</span></button>";
  }

  function buildGroup(containerId, list, selectedId, onPick) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = list.map(function (i) { return cardHTML(i, selectedId); }).join("");
    el.querySelectorAll(".opt-card").forEach(function (btn) {
      btn.addEventListener("click", function () { onPick(btn.getAttribute("data-id")); render(); });
    });
  }

  function buildSwatches(containerId, list, selectedId, onPick) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = list.map(function (c) {
      var sel = c.id === selectedId ? " sel" : "";
      return '<button type="button" class="swatch' + sel + '" data-id="' + c.id + '"><i style="background:' + c.hex + '"></i><em>' + c.label + "</em></button>";
    }).join("");
    el.querySelectorAll(".swatch").forEach(function (btn) {
      btn.addEventListener("click", function () { onPick(btn.getAttribute("data-id")); render(); });
    });
  }

  function buildSizeChips(containerId, sizes, selectedId, onPick) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = sizes.map(function (s) {
      var price = WSIZE_PRICE[s] || 0;
      var item = { id: s, label: s + '"', sub: price ? "" : "Base size", price: price };
      return cardHTML(item, selectedId);
    }).join("");
    el.querySelectorAll(".opt-card").forEach(function (btn) {
      btn.addEventListener("click", function () { onPick(btn.getAttribute("data-id")); render(); });
    });
  }

  /* --------------------------------------------------------- MODEL PICKER */
  function renderModelPicker() {
    document.querySelectorAll(".model-card").forEach(function (card) {
      card.classList.toggle("active", card.getAttribute("data-model") === state.model);
    });
  }

  /* --------------------------------------------------------- COMPUTE */
  function computeTotals() {
    var m = M();
    var price = 0, hp = 0;
    var picks = [];

    function add(label, opt) {
      if (!opt) return;
      price += opt.price || 0;
      hp += opt.hp || 0;
      if (opt.id !== "stock" && opt.id !== "none" && opt.id !== "oem" && opt.id !== "standard" && !(label === "Paint / Wrap" && opt.id === "paint")) {
        picks.push({ label: label, value: opt.label, price: opt.price || 0 });
      }
    }

    add("Body Kit", findOpt(m.kits, state.kit));
    add("Aero / Roof", findOpt(m.wings, state.wing));
    add("Exhaust", findOpt(EXHAUST, state.exhaust));
    add("ECU Tune", findOpt(ECU, state.ecu));
    add("Suspension", findOpt(m.susps, state.susp));
    add("Intake", findOpt(INTAKE, state.intake));
    add("Brakes", findOpt(BRAKES, state.brakes));
    add("Wheel Style", findOpt(m.wstyles, state.wstyle));
    var sizeOpt = { id: state.wsize, label: state.wsize + '"', price: WSIZE_PRICE[state.wsize] || 0 };
    add("Wheel Size", sizeOpt);
    add("Wheel Finish", findOpt(WFINISH, state.wfinish));
    add("Tires", findOpt(TIRES, state.tires));
    add("Paint / Wrap", findOpt(FINISH_TYPE, state.finish));
    add("PPF Protection", findOpt(PPF, state.ppf));
    add("Window Tint", findOpt(TINT, state.tint));
    add("Interior", findOpt(INTERIOR, state.interior));

    var susp = findOpt(m.susps, state.susp);
    return { price: price, hp: m.baseHP + hp, ride: susp.mm || 0, picks: picks };
  }

  /* --------------------------------------------------------- RENDER */
  function render() {
    var m = M();
    renderModelPicker();

    document.getElementById("cfg-model-name").textContent = m.name;
    document.getElementById("cfg-model-tag").textContent = m.tag;

    buildGroup("grp-kit", m.kits, state.kit, function (v) { state.kit = v; });
    buildGroup("grp-wing", m.wings, state.wing, function (v) { state.wing = v; });
    buildGroup("grp-exhaust", EXHAUST, state.exhaust, function (v) { state.exhaust = v; });

    buildGroup("grp-ecu", ECU, state.ecu, function (v) { state.ecu = v; });
    buildGroup("grp-susp", m.susps, state.susp, function (v) { state.susp = v; });
    buildGroup("grp-intake", INTAKE, state.intake, function (v) { state.intake = v; });
    buildGroup("grp-brakes", BRAKES, state.brakes, function (v) { state.brakes = v; });

    buildGroup("grp-wstyle", m.wstyles, state.wstyle, function (v) { state.wstyle = v; });
    buildSizeChips("grp-wsize", m.sizes, state.wsize, function (v) { state.wsize = v; });
    buildSwatches("grp-wfinish", WFINISH.map(function (f) { return { id: f.id, label: f.label, hex: f.hex }; }), state.wfinish, function (v) { state.wfinish = v; });
    buildGroup("grp-tires", TIRES, state.tires, function (v) { state.tires = v; });

    buildGroup("grp-finish", FINISH_TYPE, state.finish, function (v) { state.finish = v; });
    buildSwatches("grp-color", COLORS, state.color, function (v) { state.color = v; });
    buildGroup("grp-ppf", PPF, state.ppf, function (v) { state.ppf = v; });
    buildGroup("grp-tint", TINT, state.tint, function (v) { state.tint = v; });
    buildGroup("grp-interior", INTERIOR, state.interior, function (v) { state.interior = v; });

    document.getElementById("stage-canvas").innerHTML = renderCarSVG();

    var t = computeTotals();
    document.getElementById("hud-hp").textContent = t.hp;
    document.getElementById("hud-ride").textContent = (t.ride > 0 ? "+" : "") + t.ride + "mm";
    document.getElementById("hud-wheel").textContent = state.wsize + '"';
    document.getElementById("hud-price").textContent = t.price.toLocaleString() + " BD";

    var list = document.getElementById("bs-list");
    if (t.picks.length === 0) {
      list.innerHTML = '<div class="bs-row"><span class="k">No modifications selected yet</span><span class="v">—</span></div>';
    } else {
      list.innerHTML = t.picks.map(function (p) {
        return '<div class="bs-row"><span class="k">' + p.label + ": " + p.value + '</span><span class="v">' + (p.price ? "+" + p.price + " BD" : "Included") + "</span></div>";
      }).join("");
    }
    document.getElementById("bs-total").textContent = t.price.toLocaleString() + " BD";
    document.getElementById("bs-platform").textContent = m.name;

    buildSummaryText(t, m);
  }

  var lastSummary = "";
  function buildSummaryText(t, m) {
    var lines = [];
    lines.push("KANOO PERFORMANCE — BUILD INQUIRY");
    lines.push("Platform: " + m.name);
    lines.push("Est. Power: " + t.hp + " hp | Ride: " + (t.ride > 0 ? "+" : "") + t.ride + "mm | Wheels: " + state.wsize + '"');
    lines.push("");
    if (t.picks.length) {
      t.picks.forEach(function (p) { lines.push("• " + p.label + ": " + p.value); });
    } else {
      lines.push("• Stock spec — exploring options");
    }
    lines.push("");
    lines.push("Est. Modification Total: " + t.price.toLocaleString() + " BD (estimate only, to be confirmed)");
    lastSummary = lines.join("\n");
  }

  /* --------------------------------------------------------- WIRING */
  document.querySelectorAll(".model-card").forEach(function (card) {
    card.addEventListener("click", function () {
      state.model = card.getAttribute("data-model");
      state.kit = "stock"; state.wing = "none"; state.susp = "stock"; state.wstyle = "oem";
      state.wsize = MODELS[state.model].sizes[1];
      render();
    });
  });

  document.querySelectorAll(".cfg-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".cfg-tab").forEach(function (t) { t.classList.remove("active"); });
      document.querySelectorAll(".cfg-panel").forEach(function (p) { p.classList.remove("active"); });
      tab.classList.add("active");
      document.getElementById(tab.getAttribute("data-panel")).classList.add("active");
    });
  });

  function showToast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  var form = document.getElementById("inquiry-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("inq-name").value.trim();
      var phone = document.getElementById("inq-phone").value.trim();
      var notes = document.getElementById("inq-notes").value.trim();
      if (!name || !phone) { showToast("Please add your name and phone number"); return; }
      var msg = lastSummary + "\n\nName: " + name + "\nPhone: " + phone + (notes ? "\nNotes: " + notes : "");
      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg);
      window.open(url, "_blank", "noopener");
    });
  }

  var copyBtn = document.getElementById("copy-summary");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var name = document.getElementById("inq-name").value.trim();
      var phone = document.getElementById("inq-phone").value.trim();
      var notes = document.getElementById("inq-notes").value.trim();
      var full = lastSummary + (name ? "\n\nName: " + name : "") + (phone ? "\nPhone: " + phone : "") + (notes ? "\nNotes: " + notes : "");
      if (navigator.clipboard) {
        navigator.clipboard.writeText(full).then(function () { showToast("Build summary copied"); }).catch(function () { showToast("Could not copy — select manually"); });
      } else {
        showToast("Clipboard unavailable in this browser");
      }
    });
  }

  render();
})();
