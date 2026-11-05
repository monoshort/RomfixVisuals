(function () {
  /** Oude producthoogtes in deellinks (100/150/200) → werkingsdikte + extra. */
  const WAP_FUNDERING_KEUZES = [100, 150, 200];
  /** Werkingsdikte = oude producthoogte + dit bedrag (MIF bepaald over 300 mm). */
  const WAP_FUNDERING_WERKING_EXTRA = 150;
  const WAP_FUNDERING_WERKING_DEFAULT = 300;
  /** Fysieke R'Cel-producthoogte (los van werkingsdikte 300 mm). */
  const RCEL_HOOGTE_KEUZES = [100, 150, 200];
  const RCEL_HOOGTE_DEFAULT = 150;

  /** Support Improvement Factor / Modules Improvement Factor (Romfix-terminologie). */
  const SIF_NAME = "Support Improvement Factor";
  const MIF_NAME = "Modules Improvement Factor";

  /**
   * Wapeningsconfiguratie — zelfde ids/labels als prive/Romfix (script.js, live-berekeningen/kern.js).
   * SIF vast per type (Chris/Excel: 5,0 · 7,6 · 10,0) → D19/D20.
   */
  const WAPENING_TYPES = [
    { id: "none", label: "Geen wapening", product: "geen", sif: 0 },
    { id: "grid_only", label: "Alleen geogrid", product: "E'Grid", sif: 5.0 },
    { id: "cell_only", label: "Alleen geocel", product: "R'Cel", sif: 7.6 },
    { id: "grid_cell", label: "Geogrid + geocel", product: "E'Grid + R'Cel", sif: 10.0 },
  ];
  const WAPENING_TYPE_DEFAULT = "grid_cell";
  const WAPENING_ID_ALIASES = {
    egrid: "grid_only",
    rcel: "cell_only",
    beide: "grid_cell",
  };

  /** Constructietype onderconstructie bepaalt Capping_Romfix vs RoadBase_Romfix */
  const CONSTRUCTIE_TYPES = [
    {
      id: "onderconstructie",
      label: "Onderconstructie",
      sheet: "capping",
      tab: "Capping (Series 600)",
    },
    {
      id: "beton-fund",
      label: "Beton + fundering",
      sheet: "roadbase",
      tab: "RoadBase (Series 800)",
    },
  ];

  const PRESETS = {
    capping: {
      funderingBasis: 250,
      overhoogte: 0,
      ogvDikte: 300,
      eFundering: 150,
      eOgv: 150,
      eOndergrond: 11,
      wapFundering: 300,
      wapOgv: 300,
      sifFundering: 10,
      sifOgv: 10,
      mifFundering: 4.5,
      mifOgv: 4.8,
      funderingModus: "vrij",
      labels: { fund: "Fundering + overhoogte", ogv: "Ondergrond verbetering" },
    },
    roadbase: {
      funderingBasis: 250,
      overhoogte: 0,
      ogvDikte: 250,
      eFundering: 150,
      eOgv: 150,
      eOndergrond: 105,
      wapFundering: 300,
      wapOgv: 300,
      sifFundering: 10,
      sifOgv: 10,
      mifFundering: 4.3,
      mifOgv: 3.8,
      funderingModus: "vrij",
      labels: { fund: "Fundering + overhoogte", ogv: "Ondergrond verbetering" },
    },
  };

  const MATERIAAL_LAAG_KERN = [
    { label: "Menggranulaat", mpa: 400, bindend: true, kgM3: 1900 },
    { label: "Hydraulisch menggranulaat", mpa: 600, bindend: true, kgM3: 2000 },
    { label: "Metselwerkpuin", mpa: 150, bindend: false, kgM3: 1600 },
    { label: "Steenslag/steenmengsels", mpa: 150, bindend: false, kgM3: 1800 },
    /**
     * CROW: puimsteen = bims. Geen ontwerp-E in de funderingstabel (die 150 is steenslag/lava).
     * E_dyn 150–300 MPa (ophoogrichtlijn). Zandboek: E_dyn ≈ 2–2,5 × E_stat, dus statisch vanaf 60.
     * Dichtheid in het werk verdicht 850–1.150 kg/m³; hier de onderkant.
     */
    { label: "Puimsteen / Bims", mpa: 60, bindend: false, kgM3: 850 },
    { label: "Schuimglas", mpa: 50, bindend: false, kgM3: 200 },
  ];
  /** CROW: ontwerpstijfheid 600 MPa, verdicht in het werk ca. 2.000 kg/m³. Zelfbindend, net als menggranulaat. */
  const MATERIAAL_BETONGRANULAAT = {
    label: "Betongranulaat",
    mpa: 600,
    bindend: true,
    kgM3: 2000,
  };
  /**
   * CROW dunne asfaltverhardingen, tabel 31: Argex stijfheid 10–30 MPa,
   * droge volumieke massa 470–650 kg/m³. De slider begint bij 30 MPa.
   * Niet in MATERIAAL_LAAG_KERN: die volgorde zit in deel-links van ondergrond en verbetering.
   */
  const MATERIAAL_ARGEX = {
    label: "Argex",
    mpa: 30,
    bindend: false,
    kgM3: 550,
  };
  /** Licht vulmateriaal; indicatieve stijfheid in dezelfde band als de andere lichte granulaten. */
  const MATERIAAL_WINGS = {
    label: "Wings",
    mpa: 40,
    bindend: false,
    kgM3: 400,
  };
  const MATERIAAL_LAAG = MATERIAAL_LAAG_KERN.concat([
    MATERIAAL_BETONGRANULAAT,
    MATERIAAL_ARGEX,
    MATERIAAL_WINGS,
  ]);

  const MATERIAAL_ONDERGROND = [
    { label: "Zand", mpa: 100, kgM3: 1700 },
    { label: "Goed gegradeerd zand", mpa: 120, kgM3: 1900 },
    { label: "Vaste klei", mpa: 50, kgM3: 1800 },
    { label: "Veen/slappe klei", mpa: 30, kgM3: 1450 },
  ];
  /** Referentie voor gewichtcompensatie: het pakket alsof het slappe klei is. */
  const REFERENTIE_KLEI_KG_M3 = 1450;

  /** Betongranulaat achteraan, zodat oude deel-indices van ondergrond blijven kloppen. */
  const MATERIAAL_ALLE = MATERIAAL_LAAG_KERN.concat(MATERIAAL_ONDERGROND, [
    MATERIAAL_BETONGRANULAAT,
    MATERIAAL_ARGEX,
    MATERIAAL_WINGS,
  ]);

  /**
   * Lichte vulling wordt de ondergrond (eigen catalogus-E). De fundering daarboven
   * is steenslag. Geen extra laag meer ín de fundering — die split blijft uit.
   */
  const LICHT_FUNDERING_LABELS = [];
  const STEENSLAG_LABEL = "Steenslag/steenmengsels";
  const DRUKLAAG_DEFAULT_MM = 150;
  const DRUKLAAG_MIN_MM = 80;
  const DRUKLAAG_MAX_MM = 400;
  const LICHT_MIN_MM = 50;
  const LICHT_MAX_MM = 1000;
  const FUNDERING_BASIS_MAX_MM = LICHT_MAX_MM + DRUKLAAG_MAX_MM;
  const MATERIAAL_DRUKLAAG = MATERIAAL_LAAG.filter(function (m) {
    return LICHT_FUNDERING_LABELS.indexOf(m.label) < 0;
  });

  /** Vaste equivalente E van hele bovenconstructie (geen Romfix) */
  const BOVEN_E_EQUIVALENT = 5000;
  const BOVEN_LAGEN = [
    {
      id: "klinkers",
      dikteKey: "bovenKlinkers",
      label: "Bestrating",
      note: "ca. 5 cm",
      defaultMm: 50,
      kgM3: 2200,
      min: 0,
      max: 100,
      step: 5,
      cls: "klinkers",
    },
    {
      id: "asfalt",
      dikteKey: "bovenAsfalt",
      label: "Asfalt",
      note: "3 lagen",
      defaultMm: 180,
      kgM3: 2300,
      min: 0,
      max: 380,
      step: 5,
      cls: "asfalt",
    },
    {
      id: "beton",
      dikteKey: "bovenBeton",
      label: "Beton",
      note: "20–25 cm",
      defaultMm: 225,
      kgM3: 2400,
      min: 200,
      max: 250,
      step: 5,
      cls: "beton",
    },
  ];

  /** Asfalt: drie lagen, elk apart. bovenAsfalt blijft de som (oude links en B12). */
  const ASFALT_LAGEN = [
    { key: "bovenAsfaltDek", label: "Deklaag", cls: "asfalt-dek", defaultMm: 40, min: 0, max: 80, step: 5, kgM3: 2300 },
    { key: "bovenAsfaltTussen", label: "Tussenlaag", cls: "asfalt-tussen", defaultMm: 50, min: 0, max: 100, step: 5, kgM3: 2300 },
    { key: "bovenAsfaltOnder", label: "Onderlaag", cls: "asfalt-onder", defaultMm: 90, min: 0, max: 200, step: 5, kgM3: 2300 },
  ];

  /** Onder bestrating — telt mee in bovenconstructie. Diktekey blijft bovenStraatzand (deellinks). */
  const BOVEN_STRAATZAND = {
    dikteKey: "bovenStraatzand",
    label: "Straatzand",
    note: "onder bestrating, max 20 cm",
    defaultMm: 40,
    min: 0,
    max: 200,
    step: 10,
  };

  const BOVEN_BEDDING = [
    { id: "straatzand", label: "Straatzand", cls: "straatzand", kgM3: 1700 },
    { id: "drainagemortel", label: "Drainagemortel", cls: "drainagemortel", kgM3: 1800 },
    { id: "split", label: "Split", cls: "split", kgM3: 1600 },
  ];
  const BOVEN_BEDDING_DEFAULT = "straatzand";

  const LAYERS = [
    {
      id: "boven",
      label: "Bovenconstructie",
      hint: "Kies één toplaag (bestrating, asfalt of beton). Bij bestrating: straatzand, drainagemortel of split eronder — samen bovenconstructie.",
    },
    {
      id: "onder",
      label: "Onderconstructie",
      hint: "Fundering + overhoogte en Ondergrond verbetering. Constructietype bepaalt Capping/RoadBase.",
    },
    { id: "grond", label: "Ondergrond", hint: "E-modulus van de ondergrond." },
  ];

  const SUB_LAYERS = {
    fund: {
      label: "Fundering + overhoogte",
      hint:
        "Onderdeel onderconstructie. Overhoogte telt mee in totale funderingdikte.",
    },
    "fund-licht": {
      label: "Schuimglas / puimsteen",
      hint: "Onderlaag onder de druklaag. Wapening kies je hier, niet op de overhoogte.",
    },
    "fund-druk": {
      label: "Druklaag",
      hint: "Bovenste laag van de lichte fundering. Blijft ongewapend; wapening zit op de onderlaag.",
    },
    ogv: {
      label: "Ondergrond verbetering",
      hint: "Onderdeel onderconstructie. Verbeterlaag op de ondergrond.",
    },
  };

  const FIELDS = {
    boven: {
      materiaal: [],
      wapening: [],
    },
    onder: {
      materiaal: [],
      wapening: [],
    },
    fund: {
      dikte: [
        { key: "funderingBasis", label: "Dikte", unit: "mm", min: 50, max: FUNDERING_BASIS_MAX_MM, step: 10 },
        { key: "overhoogte", label: "Overhoogte", unit: "mm", min: 0, max: 300, step: 10 },
      ],
      materiaal: [
        { key: "eFundering", label: "E-modulus vulmateriaal", unit: "MPa", min: 30, max: 600, step: 5 },
      ],
      druklaag: [
        {
          key: "druklaagDikte",
          label: "Dikte druklaag",
          unit: "mm",
          min: DRUKLAAG_MIN_MM,
          max: DRUKLAAG_MAX_MM,
          step: 10,
        },
        {
          key: "eDruklaag",
          label: "E-modulus druklaag",
          unit: "MPa",
          min: 30,
          max: 600,
          step: 5,
        },
      ],
      wapening: [
        {
          key: "wapFundering",
          label: "Effectieve werkingsdikte eerste wapeningsrij",
          unit: "mm",
          min: 50,
          max: 400,
          step: 10,
        },
      ],
    },
    ogv: {
      dikte: [{ key: "ogvDikte", label: "Dikte", unit: "mm", min: 0, max: 600, step: 10 }],
      materiaal: [{ key: "eOgv", label: "E-modulus vulmateriaal", unit: "MPa", min: 30, max: 600, step: 1 }],
      wapening: [
        { key: "wapOgv", label: "Werkingsdikte wapening", unit: "mm", min: 50, max: 400, step: 10 },
      ],
    },
    grond: {
      dikte: [],
      materiaal: [{ key: "eOndergrond", label: "E-modulus ondergrond", unit: "MPa", min: 30, max: 600, step: 1 }],
      wapening: [],
    },
  };

  let sheet = "roadbase";
  const EXPERT_SESSION_KEY = "romfix-expert-auth";
  let wapeningFund = false;
  let wapeningOgv = false;
  let selected = "grond";
  let values = {};
  let materiaalKeuze = { eFundering: "", eDruklaag: "", eOgv: "", eOndergrond: "" };

  function tx(s) {
    return window.RomfixI18n ? window.RomfixI18n.t(s) : s == null ? "" : String(s);
  }

  function applyI18n() {
    if (window.RomfixI18n) window.RomfixI18n.apply();
  }

  const tableEl = document.getElementById("table");
  const tableBody = document.querySelector("#table tbody");
  const pakketSummaryEl = document.getElementById("pakket-summary");
  const visualGewEl = document.getElementById("visual-gew");
  const visualOngEl = document.getElementById("visual-ong");
  const layerTabsEl = document.getElementById("layer-tabs");
  const panelTitle = document.getElementById("panel-title");
  const panelHint = document.getElementById("panel-hint");
  const panelFields = document.getElementById("panel-fields");
  const expertDashboardEl = document.getElementById("expert-dashboard");
  const standardViewEl = document.getElementById("standard-view");
  const expertToggleEl = document.getElementById("expert-toggle");
  const tableToggleEl = document.getElementById("table-toggle");
  const tableWrapEl = document.getElementById("table-wrap");
  const expertLoginEl = document.getElementById("expert-login");
  const expertPasswordEl = document.getElementById("expert-password");
  const expertLoginErrorEl = document.getElementById("expert-login-error");
  const expertLoginSubmitEl = document.getElementById("expert-login-submit");
  const expertLoginCancelEl = document.getElementById("expert-login-cancel");

  let showOngewapend = false;
  const visitedGroups = { grond: false, ogv: false, fund: false, boven: false };

  function markVisited(id) {
    if (id === "boven") visitedGroups.boven = true;
    else if (id === "grond") visitedGroups.grond = true;
    else if (id === "ogv") visitedGroups.ogv = true;
    else if (id === "fund" || id === "fund-licht" || id === "fund-druk") visitedGroups.fund = true;
    else if (id === "onder") {
      visitedGroups.fund = true;
      visitedGroups.ogv = true;
    }
  }

  function invoerCompleet() {
    return !!(visitedGroups.grond && visitedGroups.ogv && visitedGroups.fund && visitedGroups.boven);
  }

  function syncOngewapendUi() {
    const wrap = document.getElementById("ongewapend-toggle-wrap");
    const toggle = document.getElementById("toggle-ongewapend");
    const ongCol = document.getElementById("visual-col-ong");
    const sub = document.getElementById("profile-sub");
    const table = document.getElementById("table");
    if (wrap) wrap.hidden = false;
    if (toggle) {
      toggle.disabled = false;
      toggle.checked = !!showOngewapend;
    }
    if (ongCol) ongCol.hidden = !showOngewapend;
    if (sub) {
      sub.textContent = showOngewapend
        ? tx("Gewapend boven, ongewapend ter vergelijking eronder")
        : tx("Klik op de laag die je wilt aanpassen.");
    }
    if (table) table.classList.toggle("table--solo", !showOngewapend);
  }

  let expertMode = false;
  let expertDashBuilt = false;
  let expertEventsBound = false;
  const WAPENING_LICHT_DEFAULT = WAPENING_TYPE_DEFAULT;
  const WAPENING_DRUKLAAG_TYPE = "grid_only";

  function typeHasRcel(typeId) {
    const id = normalizeWapeningId(typeId);
    return id === "cell_only" || id === "grid_cell";
  }

  function growOnderlaagVoorCel(cellMm) {
    const cel = Math.max(0, Number(cellMm) || 0);
    if (!cel) return false;
    if (isDruklaagActief()) {
      const druk = Number(values.druklaagDikte) || DRUKLAAG_DEFAULT_MM;
      const licht = Math.max(0, (Number(values.funderingBasis) || 0) - druk);
      if (licht >= cel) return false;
      values.druklaagDikte = druk;
      values.lichtDikte = cel;
      values.funderingBasis = Math.min(FUNDERING_BASIS_MAX_MM, druk + cel);
      clampDruklaagDiktes();
      return true;
    }
    if ((Number(values.funderingBasis) || 0) >= cel) return false;
    values.funderingBasis = Math.min(FUNDERING_BASIS_MAX_MM, cel);
    return true;
  }

  function rcelHoogteMm() {
    const n = Number(values.rcelHoogte);
    return RCEL_HOOGTE_KEUZES.indexOf(n) >= 0 ? n : RCEL_HOOGTE_DEFAULT;
  }

  function rcelHoogteField() {
    return {
      key: "rcelHoogte",
      label: "Hoogte R'Cel",
      unit: "mm",
      choices: RCEL_HOOGTE_KEUZES,
    };
  }

  const OVERHOOGTE_GEWAP_MAX = 150;

  /**
   * R'Cel 100/150/200. Boven de cel: max. 150 mm gewapend, de rest ongewapend.
   */
  function cellFillSplit(layerMm) {
    const laag = Math.max(0, Number(layerMm) || 0);
    const product = rcelHoogteMm();
    const cell = Math.min(laag, product);
    const fill = Math.max(0, laag - cell);
    const fillGew = Math.min(fill, OVERHOOGTE_GEWAP_MAX);
    const fillOng = Math.max(0, fill - OVERHOOGTE_GEWAP_MAX);
    return {
      product: product,
      cell: cell,
      fill: fill,
      fillGew: fillGew,
      fillOng: fillOng,
      ohGew: fillGew,
      ohOng: fillOng,
      wapMm: cell + fillGew,
      ongMm: fillOng,
    };
  }

  /** Van boven naar onder: ongewapend lichtgroen → gewapende overhoogte → gewapende celhoogte. */
  function cellSplitBands(split, prefix, infillNaam) {
    const p = prefix ? prefix + " · " : "";
    const bands = [];
    if (!split) return bands;
    if (split.fillOng > 0) {
      bands.push({ cls: "groen-licht", name: p + "ongewapende overhoogte", mm: split.fillOng, kind: "ong" });
    }
    if (split.fillGew > 0) {
      bands.push({ cls: "gewap", name: p + "gewapende overhoogte", mm: split.fillGew, kind: "vul" });
    }
    if (split.cell > 0) {
      bands.push({
        cls: "gewap",
        name: infillNaam ? "R'Cel · infill " + infillNaam : p + "gewapende celhoogte",
        mm: split.cell,
        kind: "cel",
      });
    }
    return bands;
  }

  function appendCellSplitParts(parts, zoneId, split, mpaFor, clsMap, prefix, infillNaam) {
    clsMap = clsMap || {};
    cellSplitBands(split, prefix, infillNaam).forEach(function (b) {
      const cls = clsMap[b.kind] || b.cls;
      const mpa = mpaFor ? mpaFor(b) : null;
      parts.push(segmentBtn(zoneId, cls, b.name, b.mm, mpa, b.mm));
    });
  }

  function rcelSplitNoteHtml(split) {
    if (!split) return "";
    return (
      "<strong>R'Cel:</strong> " +
      split.cell +
      " mm" +
      (split.cell < split.product ? " (keuze " + split.product + " mm, laag is dunner)" : "") +
      "<br>" +
      (split.fillOng > 0
        ? '<strong class="warn">Ongewapend boven de cel:</strong> ' + split.fillOng + " mm<br>"
        : "") +
      "<strong>Gewapend totaal:</strong> " +
      split.wapMm +
      " mm<br>"
    );
  }

  let calcCache = null;
  let mifLookupMeta = { fund: null, ogv: null, licht: null };

  function invalidateCalcCache() {
    calcCache = null;
  }

  function mifKeyForLayer(layer) {
    return layer === "fund" ? "mifFundering" : "mifOgv";
  }

  /** Ongewapende equivalente E onder fundering (Excel D14) — as onderbouw voor fund-MIF. */
  function mifOnderbouwFund() {
    const ong = runCalc(false, false);
    const d14 = ong.output.D14;
    return Math.max(8, Math.min(220, d14 || values.eOndergrond || 40));
  }

  function fieldAffectsMif(key) {
    return (
      key === "eOndergrond" ||
      key === "eFundering" ||
      key === "eOgv" ||
      key === "ogvDikte" ||
      key === "funderingBasis" ||
      key === "overhoogte" ||
      key === "druklaagDikte" ||
      key === "lichtDikte" ||
      key === "eDruklaag"
    );
  }

  function normalizeLichtFunderingLabel(label) {
    if (!label) return "";
    const s = String(label).trim();
    const low = s.toLowerCase();
    if (low === "schuimglas" || low === "glasschuim") return "Schuimglas";
    if (
      low === "bims" ||
      low === "puimsteen" ||
      low === "puinsteen" ||
      low === "tuinsteen" ||
      low === "puimsteen / bims" ||
      low === "puimsteen/bims" ||
      low === "bims / puimsteen"
    ) {
      return "Puimsteen / Bims";
    }
    if (low === "argex") return "Argex";
    if (low === "wings") return "Wings";
    return "";
  }

  function isLichtFunderingLabel(label) {
    return LICHT_FUNDERING_LABELS.indexOf(label) >= 0;
  }

  function lightOndergrondEntry(label) {
    const canon = normalizeLichtFunderingLabel(label);
    if (!canon) return null;
    const lists = MATERIAAL_LAAG.concat(MATERIAAL_ALLE);
    for (let i = 0; i < lists.length; i++) {
      if (lists[i].label === canon) return lists[i];
    }
    return null;
  }

  /** Lichte keuze wordt ondergrond; daarboven steenslag met geogrid (cel blijft kiesbaar). */
  function applyLightFillAsOndergrond(label) {
    const entry = lightOndergrondEntry(label);
    const steen = MATERIAAL_LAAG.find(function (m) {
      return m.label === STEENSLAG_LABEL;
    });
    if (!entry || !steen) return false;
    materiaalKeuze.eOndergrond = entry.label;
    values.eOndergrond = entry.mpa;
    materiaalKeuze.eFundering = steen.label;
    values.eFundering = steen.mpa;
    materiaalKeuze.eDruklaag = steen.label;
    values.eDruklaag = steen.mpa;
    values.druklaagAan = false;
    values.drukWapVrij = false;
    wapeningFund = true;
    values.wapTypeFund = WAPENING_DRUKLAAG_TYPE;
    const grid = wapeningTypeById(WAPENING_DRUKLAAG_TYPE);
    if (grid) values.sifFundering = grid.sif;
    expertDashBuilt = false;
    return true;
  }

  function migrateLightFillToOndergrond() {
    if (!lightOndergrondEntry(materiaalKeuze.eFundering)) return false;
    return applyLightFillAsOndergrond(materiaalKeuze.eFundering);
  }

  function normalizeMateriaalKeuzeAliases() {
    ["eFundering", "eOndergrond", "eOgv", "eDruklaag"].forEach(function (key) {
      const licht = normalizeLichtFunderingLabel(materiaalKeuze[key]);
      if (licht) materiaalKeuze[key] = licht;
    });
  }

  function lichtFunderingEntryForLabel(label) {
    const chosen = normalizeLichtFunderingLabel(label) || label;
    if (!chosen) return null;
    return (
      MATERIAAL_LAAG.find(function (m) {
        return m.label === chosen || normalizeLichtFunderingLabel(m.label) === chosen;
      }) || null
    );
  }

  function isLichtFunderingActive() {
    const chosen = normalizeLichtFunderingLabel(materiaalKeuze.eFundering) || materiaalKeuze.eFundering;
    if (chosen) {
      if (!isLichtFunderingLabel(chosen)) return false;
      return !!lichtFunderingEntryForLabel(chosen);
    }
    const m = MATERIAAL_LAAG.find(function (x) {
      return x.mpa === values.eFundering;
    });
    return !!(m && isLichtFunderingLabel(m.label));
  }

  function activeLichtLabel() {
    const chosen = normalizeLichtFunderingLabel(materiaalKeuze.eFundering) || materiaalKeuze.eFundering;
    if (chosen && isLichtFunderingLabel(chosen)) return chosen;
    return "Licht vulmateriaal";
  }

  function isDruklaagActief() {
    return isLichtFunderingActive();
  }

  function clampDruklaagDiktes() {
    if (!isDruklaagActief()) return;
    let basis = Math.max(50, Math.min(FUNDERING_BASIS_MAX_MM, Number(values.funderingBasis) || 0));
    let druk = Number(values.druklaagDikte) || DRUKLAAG_DEFAULT_MM;
    druk = Math.max(DRUKLAAG_MIN_MM, Math.min(DRUKLAAG_MAX_MM, druk));
    let licht = Math.max(0, basis - druk);
    if (licht > LICHT_MAX_MM) {
      licht = LICHT_MAX_MM;
      druk = Math.max(DRUKLAAG_MIN_MM, Math.min(DRUKLAAG_MAX_MM, basis - licht));
    }
    if (licht < LICHT_MIN_MM) {
      licht = LICHT_MIN_MM;
      druk = Math.max(DRUKLAAG_MIN_MM, Math.min(DRUKLAAG_MAX_MM, basis - licht));
    }
    basis = Math.max(LICHT_MIN_MM + DRUKLAAG_MIN_MM, Math.min(FUNDERING_BASIS_MAX_MM, licht + druk));
    values.funderingBasis = basis;
    values.druklaagDikte = druk;
    values.lichtDikte = Math.max(0, basis - druk);
  }

  function druklaagDikteField() {
    const basis = values.funderingBasis || 0;
    const maxD = Math.min(DRUKLAAG_MAX_MM, Math.max(DRUKLAAG_MIN_MM, basis - LICHT_MIN_MM));
    return {
      key: "druklaagDikte",
      label: "3B · Druklaag",
      unit: "mm",
      min: DRUKLAAG_MIN_MM,
      max: maxD,
      step: 10,
    };
  }

  function lichtDikteField() {
    const f = fundMeta(wapeningFund);
    values.lichtDikte = f.lichtDikte;
    return {
      key: "lichtDikte",
      label: "3A · " + activeLichtLabel(),
      unit: "mm",
      min: LICHT_MIN_MM,
      max: LICHT_MAX_MM,
      step: 10,
    };
  }

  function syncDrukLichtSliderDom() {
    if (!isDruklaagActief()) return;
    clampDruklaagDiktes();
    const f = fundMeta(wapeningFund);
    values.lichtDikte = f.lichtDikte;
    const maxD = Math.min(
      DRUKLAAG_MAX_MM,
      Math.max(DRUKLAAG_MIN_MM, (values.funderingBasis || 0) - LICHT_MIN_MM)
    );
    const dSl = document.getElementById("f-druklaagDikte");
    const dVal = document.getElementById("v-druklaagDikte");
    if (dSl) {
      dSl.max = String(maxD);
      dSl.value = String(values.druklaagDikte);
    }
    if (dVal) dVal.textContent = values.druklaagDikte + " mm";
    const lSl = document.getElementById("f-lichtDikte");
    const lVal = document.getElementById("v-lichtDikte");
    if (lSl) {
      lSl.max = String(LICHT_MAX_MM);
      lSl.value = String(f.lichtDikte);
    }
    if (lVal) lVal.textContent = f.lichtDikte + " mm";
    const bSl = document.getElementById("f-funderingBasis");
    const bVal = document.getElementById("v-funderingBasis");
    if (bSl) {
      bSl.max = String(FUNDERING_BASIS_MAX_MM);
      bSl.value = String(values.funderingBasis);
    }
    if (bVal) bVal.textContent = values.funderingBasis + " mm";
  }

  function lichtDrukDikteSectionHtml() {
    if (!isDruklaagActief()) return "";
    const f = fundMeta(wapeningFund);
    return (
      '<div class="field-section druklaag-section">' +
      '<div class="field-section-title">Dikte</div>' +
      '<p class="field-note">' +
      tx("Samen ") +
      f.basis +
      " mm " +
      tx("nominale fundering") +
      ". " +
      tx("Lichte laag tot 1000 mm; de fundering groeit mee, de druklaag blijft.") +
      "</p>" +
      fieldHtml(druklaagDikteField(), false) +
      fieldHtml(lichtDikteField(), false) +
      "</div>"
    );
  }

  function materiaalFieldHtmlLabeled(f, label) {
    const labelHtml = label
      ? '<label class="materiaal-label" for="mat-' +
        f.key +
        '">' +
        label +
        "</label>"
      : "";
    const aria = label ? "" : ' aria-label="' + (f.label || f.key) + '"';
    return (
      '<div class="field materiaal-field">' +
      labelHtml +
      '<select id="mat-' +
      f.key +
      '" class="materiaal-select" data-key="' +
      f.key +
      '"' +
      aria +
      ">" +
      materiaalSelectOptions(f.key) +
      "</select>" +
      fieldHtml(f, false) +
      "</div>"
    );
  }

  function lichtLayerCardHtml(kind, title, inner) {
    const kicker = kind === "onder" ? "Onderlaag" : "Boven in het pakket";
    return (
      '<div class="layer-card layer-card--' +
      kind +
      '">' +
      '<p class="layer-card__kicker">' +
      kicker +
      "</p>" +
      '<p class="layer-card__title">' +
      title +
      "</p>" +
      inner +
      "</div>"
    );
  }

  function lichtDrukMateriaalHtml() {
    const drukFld = {
      key: "eDruklaag",
      label: "E-modulus druklaag",
      unit: "MPa",
      min: 30,
      max: 600,
      step: 5,
    };
    const lichtFld = FIELDS.fund.materiaal[0];
    return (
      '<div class="field-section">' +
      '<div class="field-section-title">Materiaal</div>' +
      '<div class="layer-stack">' +
      lichtLayerCardHtml("druk", "Druklaag", materiaalFieldHtmlLabeled(drukFld, "")) +
      lichtLayerCardHtml(
        "onder",
        activeLichtLabel(),
        materiaalFieldHtmlLabeled(lichtFld, "")
      ) +
      "</div></div>"
    );
  }

  function fundBimsInvoerHtml(wapUit) {
    const drukFld = {
      key: "eDruklaag",
      label: "Stijfheid",
      unit: "MPa",
      min: 30,
      max: 600,
      step: 5,
    };
    const lichtFld = {
      key: "eFundering",
      label: "Stijfheid",
      unit: "MPa",
      min: 30,
      max: 600,
      step: 5,
    };
    return (
      lichtDrukDikteSectionHtml() +
      overhoogteInvoerHtml() +
      '<div class="field-section">' +
      '<div class="field-section-title">Materiaal</div>' +
      materiaalFieldHtmlLabeled(drukFld, "Druklaag") +
      materiaalFieldHtmlLabeled(lichtFld, activeLichtLabel()) +
      "</div>" +
      '<div class="field-section" data-druklaag-onafhankelijk="1">' +
      '<div class="field-section-title">Wapening druklaag</div>' +
      wapeningTypeHtml("druklaag", false, { compact: true, label: "" }) +
      '<p class="field-note">Los van de wapening op de fundering. Standaard geogrid bij een gewapende fundering.</p>' +
      "</div>" +
      (wapUit
        ? ""
        : '<div class="field-section">' +
          '<div class="field-section-title">Wapening op de lichte laag</div>' +
          wapeningTypeHtml("fund-licht", false, { compact: true, label: "" }) +
          "</div>")
    );
  }

  function overhoogteInvoerHtml() {
    const mm = Number(values.overhoogte) || 0;
    if (mm <= 0) {
      return '<button type="button" class="text-btn" data-add-overhoogte="1">+ Overhoogte</button>';
    }
    const oh = FIELDS.fund.dikte.find(function (f) {
      return f.key === "overhoogte";
    });
    return fieldHtml(Object.assign({}, oh, { label: "Overhoogte, ongewapend" }), false);
  }

  function lichtDrukWapeningHtml(disabled, opts) {
    opts = opts || {};
    const compact = { compact: true, label: "" };
    return (
      '<div class="field-section">' +
      '<div class="field-section-title">Wapening</div>' +
      (opts.includeToggle === false ? "" : wapeningToggleHtml("fund")) +
      '<div class="layer-stack">' +
      lichtLayerCardHtml(
        "druk",
        "Wapening druklaag",
        '<div data-druklaag-onafhankelijk="1">' +
          wapeningTypeHtml("druklaag", false, compact) +
          '<p class="field-note">Los van de wapening op de fundering. Standaard geogrid bij een gewapende fundering.</p>' +
          "</div>"
      ) +
      lichtLayerCardHtml(
        "onder",
        "Wapening onderlaag",
        wapeningTypeHtml("fund-licht", disabled, compact) +
          '<p class="field-note">Op de onderlaag kies je de wapening. De druklaag stel je hierboven apart in. Overhoogte blijft ongewapend.</p>'
      ) +
      "</div>" +
      factorLegendNote() +
      "</div>"
    );
  }

  function exitLichtFundering() {
    const druk = materiaalMatch("eDruklaag", MATERIAAL_DRUKLAAG);
    const fallback = MATERIAAL_LAAG.find(function (m) {
      return m.label === "Steenslag/steenmengsels";
    });
    const target =
      druk ||
      fallback ||
      MATERIAAL_LAAG.find(function (m) {
        return !isLichtFunderingLabel(m.label);
      });
    if (!target) return;
    materiaalKeuze.eFundering = target.label;
    values.eFundering = target.mpa;
    values.druklaagAan = false;
    values.eLichtFundering = values.eFundering;
    values.drukWapVrij = false;
    if (selected === "fund-licht" || selected === "fund-druk") selected = "fund";
    invalidateCalcCache();
    render();
  }

  function exitLichtFunderingBtnHtml() {
    return (
      '<p class="field-note exit-licht-wrap">' +
      '<button type="button" class="exit-licht-fundering layer-jump">' +
      "↩ Terug naar standaard fundering" +
      "</button>" +
      ' <span class="exit-licht-hint">— profiel wordt één laag; materiaal van de druklaag wordt overgenomen.</span></p>'
    );
  }

  function syncDruklaagFromFundering() {
    const lichtActive = isLichtFunderingActive();
    const wasDruklaag = !!values.druklaagAan;
    if (lichtActive) {
      values.druklaagAan = true;
      values.eLichtFundering = values.eFundering;
      if (!values.eDruklaag) values.eDruklaag = 150;
      if (!values.druklaagDikte) values.druklaagDikte = DRUKLAAG_DEFAULT_MM;
      if (!materiaalKeuze.eDruklaag) {
        materiaalKeuze.eDruklaag = "Steenslag/steenmengsels";
      }
      clampDruklaagDiktes();
      if (!wasDruklaag) {
        values.wapTypeFund = WAPENING_DRUKLAAG_TYPE;
        values.drukWapVrij = false;
      }
      lockLichtWapeningTypes();
      if (!wasDruklaag && (selected === "fund" || selected === "fund-druk")) {
        selected = "fund-licht";
      }
    } else {
      values.druklaagAan = false;
      values.eLichtFundering = values.eFundering;
      values.sifLicht = 0;
      values.mifLicht = 0;
      values.drukWapVrij = false;
      if (wasDruklaag) {
        values.wapTypeFund = WAPENING_TYPE_DEFAULT;
        const def = wapeningTypeById(WAPENING_TYPE_DEFAULT);
        if (def) values.sifFundering = def.sif;
      }
      syncMateriaalKeuzeFromValues("eFundering");
      if (wasDruklaag && (selected === "fund-druk" || selected === "fund-licht")) {
        selected = "fund";
      }
    }
  }

  function lichtWapeningTypeId() {
    return normalizeWapeningId(values.wapTypeLicht || WAPENING_LICHT_DEFAULT);
  }

  function druklaagWapeningTypeId() {
    return normalizeWapeningId(values.wapTypeFund || WAPENING_DRUKLAAG_TYPE);
  }

  /**
   * Effectieve wapening van de druklaag.
   * Zolang de gebruiker het extra veld niet zelf heeft gezet, volgt die de
   * funderingswapening: aan = geogrid (huidig gedrag), uit = ongewapend.
   * Na een eigen keuze geldt het veld los van de fundering.
   */
  function effectiveDrukTypeId(fundOn) {
    if (!isDruklaagActief()) return "none";
    if (values.drukWapVrij) return druklaagWapeningTypeId();
    /* Standaard geogrid, ook als de funderingsschakelaar uit staat. */
    return WAPENING_DRUKLAAG_TYPE || fundOn;
  }

  function druklaagOptieLabel(t) {
    if (!t || t.id === "none") return "Ongewapend";
    if (t.id === "grid_only") return "Geogrid";
    if (t.id === "grid_cell") return "Romfix-systeem";
    if (t.id === "cell_only") return "Alleen geocel";
    return t.label;
  }

  function druklaagVisueelNaam(typeId) {
    const id = normalizeWapeningId(typeId);
    if (!typeHasSif(id)) return "";
    if (id === "grid_only") return "Geogrid (E'Grid 30/30)";
    return druklaagOptieLabel(wapeningTypeById(id));
  }

  function typeHasSif(typeId) {
    const t = wapeningTypeById(typeId);
    return !!(t && t.id !== "none" && t.sif > 0);
  }

  function lichtHasWapening() {
    return typeHasSif(lichtWapeningTypeId());
  }

  /** Huidige druklaag: geogrid zolang de fundering gewapend is, tenzij het veld zelf is gezet. */
  function druklaagHasWapening() {
    return typeHasSif(effectiveDrukTypeId(!!wapeningFund));
  }

  function druklaagReinforcedMm(drukBasis, typeId) {
    if (!typeHasSif(typeId)) return 0;
    const basis = Math.max(0, Number(drukBasis) || 0);
    if (typeHasRcel(typeId)) return cellFillSplit(basis).wapMm;
    return basis;
  }

  function syncSifFromWapeningTypes() {
    const licht = wapeningTypeById(lichtWapeningTypeId());
    values.sifLicht = licht ? licht.sif : 0;
    const druk = wapeningTypeById(druklaagWapeningTypeId());
    values.sifFundering = druk ? druk.sif : 0;
  }

  function lockLichtWapeningTypes() {
    if (!values.wapTypeLicht) values.wapTypeLicht = WAPENING_LICHT_DEFAULT;
    if (!values.wapTypeFund) values.wapTypeFund = WAPENING_DRUKLAAG_TYPE;
    syncSifFromWapeningTypes();
  }

  function syncMifFromWapening() {
    if (typeof window.RomfixMif === "undefined") return;
    if (isDruklaagActief()) lockLichtWapeningTypes();
    if (wapeningFund || (isDruklaagActief() && druklaagHasWapening())) {
      const onderbouw = mifOnderbouwFund();
      if (isDruklaagActief()) {
        const drukType = effectiveDrukTypeId(!!wapeningFund);
        if (typeHasSif(drukType)) {
          const drukInfo = window.RomfixMif.lookupMif(
            drukType,
            onderbouw,
            values.eDruklaag || values.eFundering
          );
          values.mifFundering = drukInfo.mif;
          mifLookupMeta.fund = drukInfo;
        } else {
          values.mifFundering = 0;
          mifLookupMeta.fund = null;
        }
        const lichtType = lichtWapeningTypeId();
        if (wapeningFund && lichtHasWapening()) {
          const lichtInfo = window.RomfixMif.lookupMif(
            lichtType,
            onderbouw,
            values.eLichtFundering || values.eFundering
          );
          values.mifLicht = lichtInfo.mif;
          mifLookupMeta.licht = lichtInfo;
        } else {
          values.mifLicht = 0;
          mifLookupMeta.licht = null;
        }
        syncSifFromWapeningTypes();
      } else {
        const info = window.RomfixMif.lookupMif(
          normalizeWapeningId(values.wapTypeFund || WAPENING_TYPE_DEFAULT),
          onderbouw,
          values.eFundering
        );
        values.mifFundering = info.mif;
        mifLookupMeta.fund = info;
        mifLookupMeta.licht = null;
        values.sifLicht = 0;
        values.mifLicht = 0;
      }
    } else {
      mifLookupMeta.fund = null;
      mifLookupMeta.licht = null;
      if (!isDruklaagActief()) {
        values.sifLicht = 0;
        values.mifLicht = 0;
      }
    }
    if (wapeningOgv) {
      const info = window.RomfixMif.lookupMif(
        normalizeWapeningId(values.wapTypeOgv || WAPENING_TYPE_DEFAULT),
        values.eOndergrond,
        values.eOgv
      );
      values.mifOgv = info.mif;
      mifLookupMeta.ogv = info;
    } else {
      mifLookupMeta.ogv = null;
    }
  }

  function formatFactor(n) {
    return String(n).replace(".", ",");
  }

  function normalizeWapeningId(id) {
    return WAPENING_ID_ALIASES[id] || id;
  }

  function sifExcelRef(layer) {
    if (layer === "fund-licht") return "";
    return layer === "fund" ? "D19" : "D20";
  }

  function mifExcelRef(layer) {
    return layer === "fund" ? "E19" : "E20";
  }

  function sifFieldLabel(layer) {
    if (layer === "fund-licht") return "SIF";
    return expertMode ? sifExcelRef(layer) + " SIF" : "SIF";
  }

  function mifFieldLabel(layer) {
    return expertMode ? mifExcelRef(layer) + " MIF" : "MIF";
  }

  function laagIsSchuimglas(layer) {
    const key = layer === "ogv" ? "eOgv" : "eFundering";
    const m = materiaalMatch(key);
    if (!m) return false;
    const label = normalizeLichtFunderingLabel(m.label) || m.label;
    return label === "Schuimglas";
  }

  function wapeningOptionLabel(t, compact, layer) {
    if (!t) return "—";
    const rcel = laagIsSchuimglas(layer) ? "R'Cel 150/1" : "R'Cel 150/2";
    let name = t.label;
    if (t.id === "none") name = "Geen";
    else if (t.id === "grid_only") name = "Geogrid (E'Grid 30/30)";
    else if (t.id === "cell_only") name = "Geocel (" + rcel + ")";
    else if (t.id === "grid_cell") name = "Romfix combinatie (E'Grid + R'Cel)";
    if (!t.sif) return name;
    return name + " · SIF " + formatFactor(t.sif);
  }

  function syncWapeningOptionLabels() {
    document.querySelectorAll("select.wapening-type-select").forEach(function (sel) {
      const layer = sel.getAttribute("data-layer");
      sel.querySelectorAll("option").forEach(function (opt) {
        const t = wapeningTypeById(opt.value);
        if (t) opt.textContent = wapeningOptionLabel(t, false, layer);
      });
    });
  }

  function factorLegendNote() {
    return (
      '<p class="field-note factor-legend">' +
      "<strong>SIF</strong> = " +
      SIF_NAME +
      " · <strong>MIF</strong> = " +
      MIF_NAME +
      "</p>"
    );
  }

  function mifNoteHtml(layer, on) {
    const info = layer === "fund" ? mifLookupMeta.fund : mifLookupMeta.ogv;
    if (!on || !info) {
      return "Volgt uit de stijfheid van de ondergrond en de ongewapende stijfheid van deze laag.";
    }
    const extra =
      layer === "fund"
        ? " Ondergrond hier = stijfheid onder de fundering."
        : " Ondergrond hier = E-modulus bestaande bodem.";
    const schaal =
      info.eInfill > 250
        ? " Boven 250 MPa loopt de extra factor terug: wapening telt mee, niet 2–3× de cataloguswaarde."
        : "";
    return (
      "MIF " +
      formatFactor(info.mif) +
      " · ondergrond " +
      info.eOnderbouw +
      " MPa × ongewapende laag " +
      info.eInfill +
      " MPa." +
      extra +
      schaal
    );
  }

  function mifDisplayHtml(layer, disabled) {
    const on = wapeningForLayer(layer);
    const key = mifKeyForLayer(layer);
    const mifVal = on ? values[key] : "—";
    return (
      '<div class="field mif-auto-field' +
      (disabled || !on ? " field--disabled" : "") +
      '">' +
      '<div class="field-head"><span>' +
      mifFieldLabel(layer) +
      "</span>" +
      '<span class="field-val" id="v-' +
      key +
      '">' +
      mifVal +
      " —</span></div>" +
      '<p class="field-note" id="mif-note-' +
      layer +
      '">' +
      mifNoteHtml(layer, on) +
      "</p></div>"
    );
  }

  function refreshMifDisplays() {
    ["fund", "ogv"].forEach(function (layer) {
      const key = mifKeyForLayer(layer);
      const valEl = document.getElementById("v-" + key);
      const noteEl = document.getElementById("mif-note-" + layer);
      const on = wapeningForLayer(layer);
      if (valEl) valEl.textContent = on ? values[key] + " —" : "— —";
      if (noteEl) noteEl.innerHTML = mifNoteHtml(layer, on);
    });
  }

  /** Vier hoeken van het wapening-raster — elk slider-event herberekent max. één keer. */
  function getCalcCache() {
    if (!calcCache) {
      calcCache = {
        ff: runCalc(false, false),
        tf: runCalc(true, false),
        ft: runCalc(false, true),
        tt: runCalc(true, true),
        kf: runCalc(false, false, true),
        kt: runCalc(false, true, true),
      };
    }
    return calcCache;
  }

  function calcAt(fundWap, ogvWap) {
    const c = getCalcCache();
    if (!fundWap && !ogvWap) return c.ff;
    if (fundWap && !ogvWap) return c.tf;
    if (!fundWap && ogvWap) return c.ft;
    return c.tt;
  }

  /** Volledig ongewapend, ook als de druklaag een eigen wapening heeft. */
  function calcKale(ogvWap) {
    const c = getCalcCache();
    return ogvWap ? c.kt : c.kf;
  }

  function wapeningForLayer(id) {
    if (id === "fund") return wapeningFund;
    if (id === "ogv") return wapeningOgv;
    return false;
  }

  function normalizeWapFundering(mm) {
    const n = Number(mm);
    if (!Number.isFinite(n) || n <= 0) return WAP_FUNDERING_WERKING_DEFAULT;
    /* Oude deellinks: 100/150/200 was producthoogte, werkingsdikte = +150. */
    if (WAP_FUNDERING_KEUZES.indexOf(n) >= 0) {
      return Math.min(400, n + WAP_FUNDERING_WERKING_EXTRA);
    }
    return Math.max(50, Math.min(400, n));
  }

  function wapFunderingWerkingsdikte(standaardMm, dikteTotaal) {
    const working = Number(standaardMm) || 0;
    const totaal = Number(dikteTotaal) || 0;
    return Math.min(totaal, working);
  }

  function fundMeta(fundWap) {
    const basis = values.funderingBasis || 0;
    const oh = values.overhoogte || 0;
    const dikteTotaal = basis + oh;
    const druklaagAan = isDruklaagActief();
    const drukBasis = druklaagAan ? Number(values.druklaagDikte) || DRUKLAAG_DEFAULT_MM : basis;
    const lichtDikte = druklaagAan ? Math.max(0, basis - drukBasis) : 0;
    const drukStackMm = druklaagAan ? drukBasis + oh : dikteTotaal;
    const fundOn = fundWap === undefined ? wapeningFund : fundWap;
    const standaardWap = normalizeWapFundering(values.wapFundering);
    const fundTypeId = normalizeWapeningId(values.wapTypeFund || WAPENING_TYPE_DEFAULT);
    const lichtTypeId = lichtWapeningTypeId();
    const fundRcel = fundOn && !druklaagAan && typeHasRcel(fundTypeId);
    const lichtRcel = fundOn && druklaagAan && typeHasRcel(lichtTypeId) && lichtHasWapening();
    const fundSplit = fundRcel ? cellFillSplit(basis) : null;
    const lichtSplit = lichtRcel ? cellFillSplit(lichtDikte) : null;
    const ohGew = fundOn ? Math.min(oh, OVERHOOGTE_GEWAP_MAX) : 0;
    const ohOng = Math.max(0, oh - ohGew);
    let wapDikte = 0;
    if (fundOn && !druklaagAan) {
      if (fundSplit) {
        wapDikte = Math.min(fundSplit.wapMm + ohGew, dikteTotaal);
      } else {
        wapDikte = wapFunderingWerkingsdikte(standaardWap, basis + ohGew);
      }
    } else if (fundOn && druklaagAan) {
      wapDikte = drukBasis;
    }
    return {
      basis,
      oh,
      dikteTotaal,
      druklaagAan,
      drukBasis,
      lichtDikte,
      drukStackMm,
      ohGew,
      ohOng,
      standaardWap,
      wapDikte,
      fundSplit,
      lichtSplit,
      eLicht: values.eLichtFundering || values.eFundering,
      eDruk: values.eDruklaag || values.eFundering,
    };
  }

  function excelInvoer(fundOn, ogvOn, kale) {
    const f = fundMeta(kale ? false : fundOn);
    const drukTypeId = kale ? "none" : effectiveDrukTypeId(!!fundOn);
    const drukOn = !!(f.druklaagAan && typeHasSif(drukTypeId));
    const drukMm = drukOn ? druklaagReinforcedMm(f.drukBasis, drukTypeId) : 0;
    const drukSif = drukOn ? (wapeningTypeById(drukTypeId).sif || 0) : 0;
    const fundSifAan = !kale && !!fundOn && !f.druklaagAan;
    const inp = {
      sheet,
      B12: values.bovenDikte,
      B13: f.dikteTotaal,
      B14: values.ogvDikte,
      C13: f.druklaagAan ? f.eDruk : values.eFundering,
      C14: values.eOgv,
      C15: values.eOndergrond,
      B19: f.druklaagAan ? drukMm : fundSifAan ? f.wapDikte : 0,
      B20: !kale && ogvOn ? values.wapOgv : 0,
      D19: f.druklaagAan
        ? drukOn
          ? isFunderingVast()
            ? 99.9
            : drukSif
          : 0
        : fundSifAan
          ? isFunderingVast()
            ? 99.9
            : values.sifFundering
          : 0,
      D20: values.sifOgv,
      E19: values.mifFundering,
      E20: values.mifOgv,
      F13: values.funderingModus,
    };
    if (f.druklaagAan && f.lichtDikte > 0) {
      inp.B13Licht = f.lichtDikte;
      inp.C13Licht = f.eLicht;
      inp.sifLicht = !kale && fundOn && lichtHasWapening() ? values.sifLicht || 0 : 0;
      inp.mifLicht = values.mifLicht;
      if (!kale && fundOn && f.lichtSplit) inp.lichtWapMm = f.lichtSplit.wapMm;
    }
    return inp;
  }

  /** fundWap / ogvWap: expliciet per laag; undefined = huidige schakelaar. kale = alles uit. */
  function runCalc(fundWap, ogvWap, kale) {
    const fundOn = fundWap === undefined ? wapeningFund : fundWap;
    const ogvOn = ogvWap === undefined ? wapeningOgv : ogvWap;
    return window.computeRomfixWerkboek(excelInvoer(fundOn, ogvOn, !!kale));
  }

  function ogvLabel() {
    return PRESETS[sheet].labels.ogv;
  }

  function constructieBySheet(s) {
    return CONSTRUCTIE_TYPES.find(function (c) {
      return c.sheet === s;
    });
  }


  /** Print/PDF: type volgt de gekozen toplaag, niet het Excel-blad (roadbase heette altijd “Beton + fundering”). */
  function constructiePrintLabel() {
    const bovenL = bovenActieveLaag();
    if (bovenL) return tx(bovenL.label + " + fundering");
    const c = constructieBySheet(sheet);
    return c ? c.label : "";
  }


  function inferSheet() {
    const c = CONSTRUCTIE_TYPES.find(function (x) {
      return x.id === values.constructieType;
    });
    return c ? c.sheet : "capping";
  }

  function onderconstructieMm() {
    const f = fundMeta(wapeningFund);
    return f.dikteTotaal + (values.ogvDikte || 0);
  }

  function onderconstructieOmschrijving() {
    const f = fundMeta(wapeningFund);
    return f.dikteTotaal + "+" + values.ogvDikte + "=" + onderconstructieMm();
  }

  function isOnderGroep(id) {
    return id === "onder" || id === "fund" || id === "ogv" || id === "fund-licht" || id === "fund-druk";
  }

  function isFundSubLayer(id) {
    return id === "fund-licht" || id === "fund-druk";
  }

  function panelLayerMeta(id) {
    if (id === "fund-licht" && SUB_LAYERS[id]) {
      return Object.assign({}, SUB_LAYERS[id], { label: activeLichtLabel() });
    }
    if (SUB_LAYERS[id]) return SUB_LAYERS[id];
    return LAYERS.find(function (L) {
      return L.id === id;
    });
  }

  function ensureStandardSheet() {
    let changed = false;
    if (sheet !== "roadbase") {
      sheet = "roadbase";
      changed = true;
    }
    if (values.constructieType !== "beton-fund") {
      values.constructieType = "beton-fund";
      changed = true;
    }
    return changed;
  }

  function syncSheetFromInvoer() {
    if (!expertMode) {
      const changed = ensureStandardSheet();
      return changed;
    }
    const next = inferSheet();
    const changed = next !== sheet;
    sheet = next;
    renderSheetTabs();
    return changed;
  }

  function expertSheetTabsHtml() {
    return (
      '<div class="expert-sheet-tabs" role="tablist" aria-label="Berekening">' +
      CONSTRUCTIE_TYPES.map(function (c) {
        return (
          '<button type="button" class="expert-sheet-tab' +
          (sheet === c.sheet ? " active" : "") +
          '" data-sheet="' +
          c.sheet +
          '" role="tab" aria-selected="' +
          (sheet === c.sheet) +
          '">' +
          c.tab +
          "</button>"
        );
      }).join("") +
      "</div>"
    );
  }

  function renderSheetTabs() {
    document.querySelectorAll(".expert-sheet-tab").forEach(function (btn) {
      const active = btn.dataset.sheet === sheet;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function switchExpertSheet(nextSheet) {
    if (!expertMode || nextSheet === sheet) return;
    const constructie = constructieBySheet(nextSheet);
    sheet = nextSheet;
    if (constructie) values.constructieType = constructie.id;
    expertDashBuilt = false;
    render();
  }

  function constructieSectionHtml() {
    const cur = values.constructieType;
    const active = constructieBySheet(sheet);
    let html =
      '<div class="field-section">' +
      '<div class="field-section-title">Constructietype</div>' +
      '<div class="field">' +
      '<label class="materiaal-label" for="constructie-type">Type</label>' +
      '<select id="constructie-type" class="materiaal-select">';
    CONSTRUCTIE_TYPES.forEach(function (c) {
      html +=
        '<option value="' +
        c.id +
        '"' +
        (cur === c.id ? " selected" : "") +
        ">" +
        c.label +
        "</option>";
    });
    html +=
      "</select>" +
      '<p class="field-note sheet-note">Actieve berekening: <strong>' +
      (active ? active.tab : "") +
      "</strong> (automatisch)</p></div></div>";
    return html;
  }

  function loadPreset(s) {
    sheet = s;
    const p = PRESETS[sheet];
    const constructie = constructieBySheet(s);
    wapeningFund = false;
    wapeningOgv = false;
    materiaalKeuze = {
      eFundering: "Steenslag/steenmengsels",
      eOgv: "Steenslag/steenmengsels",
      eOndergrond: "",
    };
    const bovenToplaag = "klinkers";
    const mm = {};
    BOVEN_LAGEN.forEach(function (L) {
      mm[L.dikteKey] = L.defaultMm;
    });
    const activeLaag = BOVEN_LAGEN.find(function (L) {
      return L.id === bovenToplaag;
    });
    const straatzandMm = bovenToplaag === "klinkers" ? BOVEN_STRAATZAND.defaultMm : 0;
    values = {
      constructieType: constructie ? constructie.id : "onderconstructie",
      bovenToplaag: bovenToplaag,
      bovenKlinkers: mm.bovenKlinkers,
      bovenAsfalt: mm.bovenAsfalt,
      bovenAsfaltDek: 40,
      bovenAsfaltTussen: 50,
      bovenAsfaltOnder: 90,
      bovenBeton: mm.bovenBeton,
      bovenBedding: BOVEN_BEDDING_DEFAULT,
      bovenStraatzand: straatzandMm,
      bovenDikte: (activeLaag ? activeLaag.defaultMm : 0) + straatzandMm,
      funderingBasis: p.funderingBasis,
      overhoogte: p.overhoogte,
      ogvDikte: 0,
      drukWapVrij: false,
      eFundering: p.eFundering,
      eOgv: p.eOgv,
      eOndergrond: p.eOndergrond,
      wapFundering: normalizeWapFundering(p.wapFundering),
      wapOgv: p.wapOgv,
      sifFundering: p.sifFundering,
      sifOgv: p.sifOgv,
      wapTypeFund: WAPENING_TYPE_DEFAULT,
      wapTypeOgv: WAPENING_TYPE_DEFAULT,
      wapTypeLicht: WAPENING_LICHT_DEFAULT,
      mifFundering: 0,
      mifOgv: 0,
      funderingModus: p.funderingModus,
      druklaagAan: false,
      druklaagDikte: DRUKLAAG_DEFAULT_MM,
      eDruklaag: 150,
      eLichtFundering: p.eFundering,
      sifLicht: 0,
      mifLicht: 0,
      rcelHoogte: RCEL_HOOGTE_DEFAULT,
      maaiveldMm: 0,
    };
    syncWapeningTypesFromSif();
    syncDruklaagFromFundering();
    syncMifFromWapening();
  }

  function wapeningTypeById(id) {
    const norm = normalizeWapeningId(id);
    return WAPENING_TYPES.find(function (t) {
      return t.id === norm;
    });
  }

  function wapeningTypesForLayer(layer) {
    return WAPENING_TYPES;
  }

  function wapeningTypeKey(layer) {
    if (layer === "fund-licht") return "wapTypeLicht";
    if (layer === "druklaag" || layer === "fund") return "wapTypeFund";
    return "wapTypeOgv";
  }

  function sifKeyForLayer(layer) {
    if (layer === "fund-licht") return "sifLicht";
    if (layer === "druklaag" || layer === "fund") return "sifFundering";
    return "sifOgv";
  }

  function wapeningTypeLabel(typeId, layer) {
    const t = wapeningTypeById(typeId);
    return t ? wapeningOptionLabel(t, false, layer) : "—";
  }

  function wapeningTypeFromSif(sif) {
    const n = Number(sif);
    return (
      WAPENING_TYPES.find(function (t) {
        return t.sif === n;
      }) || null
    );
  }

  function syncWapeningTypesFromSif() {
    ["fund", "ogv", "fund-licht"].forEach(function (layer) {
      const typeKey = wapeningTypeKey(layer);
      const sifKey = sifKeyForLayer(layer);
      const match = wapeningTypeFromSif(values[sifKey]);
      if (match) values[typeKey] = match.id;
      else if (!values[typeKey]) values[typeKey] = WAPENING_TYPE_DEFAULT;
      values[typeKey] = normalizeWapeningId(values[typeKey]);
    });
  }

  function wapeningFieldsExceptSif(layer) {
    const sifKey = sifKeyForLayer(layer);
    return FIELDS[layer].wapening.filter(function (f) {
      return f.key !== sifKey;
    });
  }

  function wapeningTypeHtml(layer, disabled, htmlOpts) {
    htmlOpts = htmlOpts || {};
    const allowed = wapeningTypesForLayer(layer);
    const typeKey = wapeningTypeKey(layer);
    const sifKey = sifKeyForLayer(layer);
    const curType = normalizeWapeningId(
      layer === "druklaag"
        ? effectiveDrukTypeId(!!wapeningFund)
        : layer === "fund-licht"
          ? lichtWapeningTypeId()
          : layer === "fund" && isDruklaagActief()
            ? druklaagWapeningTypeId()
            : values[typeKey] || WAPENING_TYPE_DEFAULT
    );
    const cur = wapeningTypeById(curType);
    let opts = "";
    allowed.forEach(function (t) {
      opts +=
        '<option value="' +
        t.id +
        '"' +
        (curType === t.id ? " selected" : "") +
        ">" +
        (layer === "druklaag" ? druklaagOptieLabel(t) : wapeningOptionLabel(t, !!htmlOpts.compact, layer)) +
        "</option>";
    });
    const rcelNote = htmlOpts.compact
      ? ""
      : layer === "fund" && isDruklaagActief()
        ? '<p class="field-note">Alleen deze laag. Standaard E\'Grid (SIF 5). Mag ook uit, of het systeem — los van schuimglas.</p>'
        : layer === "fund-licht"
          ? '<p class="field-note">Alleen de lichte laag. Rekent niet door naar de druklaag-SIF.</p>'
          : "";
    const wapLabel =
      htmlOpts.label != null
        ? htmlOpts.label
        : layer === "fund-licht"
          ? "Wapening schuimglas / puimsteen"
          : layer === "druklaag" || (layer === "fund" && isDruklaagActief())
            ? "Wapening druklaag"
            : "Wapeningsconfiguratie";
    const labelHtml = wapLabel
      ? '<label class="materiaal-label" for="wap-type-' +
        layer +
        '">' +
        wapLabel +
        "</label>"
      : "";
    return (
      '<div class="field wapening-type-field' +
      (disabled ? " field--disabled" : "") +
      '">' +
      labelHtml +
      '<select id="wap-type-' +
      layer +
      '" class="wapening-type-select" data-layer="' +
      layer +
      '"' +
      (wapLabel ? "" : ' aria-label="' + (layer === "fund-licht" ? "Wapening schuimglas" : "Wapening druklaag") + '"') +
      (layer === "druklaag" ? ' data-druklaag-wap="1"' : "") +
      (disabled ? " disabled" : "") +
      ">" +
      opts +
      "</select>" +
      '<p class="field-note" id="wap-type-note-' +
      layer +
      '">' +
      sifFieldLabel(layer) +
      ': <strong>' +
      formatFactor(layer === "druklaag" ? (cur && cur.sif) || 0 : values[sifKey]) +
      "</strong>" +
      (cur && cur.id !== "none"
        ? " · " + (layer === "druklaag" ? druklaagOptieLabel(cur) : wapeningOptionLabel(cur, false, layer))
        : "") +
      "</p>" +
      (htmlOpts.compact ? "" : rcelNote) +
      (typeHasRcel(curType)
        ? htmlOpts.compact
          ? rcelHoogteKeuzeHtml(disabled)
          : rcelHoogteFieldHtml(disabled)
        : "") +
      (htmlOpts.compact ? "" : factorLegendNote()) +
      "</div>"
    );
  }

  function rcelHoogteKeuzeHtml(disabled) {
    const f = rcelHoogteField();
    const v = values[f.key];
    let html =
      '<div class="rcel-keuze' +
      (disabled ? " field--disabled" : "") +
      '">' +
      '<span class="materiaal-label">Celhoogte</span>' +
      '<div class="boven-keuze wap-keuze" role="radiogroup" aria-label="Celhoogte">';
    f.choices.forEach(function (mm) {
      const on = v === mm;
      html +=
        '<label class="boven-keuze-opt' +
        (on ? " boven-keuze-opt--active" : "") +
        '">' +
        '<input type="radio" name="choice-' +
        f.key +
        '" value="' +
        mm +
        '" data-wap-keuze="1" data-key="' +
        f.key +
        '"' +
        (on ? " checked" : "") +
        (disabled ? " disabled" : "") +
        " />" +
        "<span><strong>" +
        mm +
        "</strong></span></label>";
    });
    html += "</div></div>";
    return html;
  }

  function rcelHoogteFieldHtml(disabled) {
    return (
      choiceFieldHtml(rcelHoogteField(), disabled) +
      '<p class="field-note">Producthoogte van de cel — 100, 150 of 200 mm. Alles boven de cel, inclusief overhoogte, blijft ongewapend.</p>'
    );
  }

  function applyWapeningType(layer, typeId) {
    const t = wapeningTypeById(typeId);
    if (!t) return;
    const allowed = wapeningTypesForLayer(layer);
    if (
      !allowed.some(function (x) {
        return x.id === t.id;
      })
    ) {
      return;
    }
    if (layer === "druklaag") {
      values.drukWapVrij = true;
      values.wapTypeFund = t.id;
      values.sifFundering = t.sif;
      syncMifFromWapening();
      invalidateCalcCache();
      if (expertMode) {
        expertDashBuilt = false;
        render();
        return;
      }
      render();
      return;
    }
    values[wapeningTypeKey(layer)] = t.id;
    values[sifKeyForLayer(layer)] = t.sif;
    if (layer === "ogv") wapeningOgv = t.id !== "none";
    if (layer === "fund" || layer === "fund-licht" || layer === "fund-druk") {
      wapeningFund = t.id !== "none";
    }
    syncMifFromWapening();
    invalidateCalcCache();
    if (expertMode) {
      expertDashBuilt = false;
      render();
      return;
    }
    if (
      selected === "fund" ||
      selected === "fund-licht" ||
      selected === "fund-druk" ||
      selected === "ogv" ||
      selected === "onder"
    ) {
      renderPanel();
    }
    syncMateriaalEquivalentNotes();
    renderPakketSummary();
    renderVisual();
    renderTable();
    renderLayerTabs();
    applyI18n();
  }

  const VISUAL_PX_PER_MM = 0.55;
  const VISUAL_HEIGHT_MIN = 280;
  const VISUAL_HEIGHT_MAX = 960;
  const GROND_VISUAL_RATIO = 0.075;
  let visualPxPerMm = 0.72;
  let visualLayerMinPx = 34;
  /** Minimale hoogte in profiel als laag 0 mm is — blijft zichtbaar met label + MPa */
  const MIN_LAYER_VISUAL_PX = 48;

  function factor(ong, gew) {
    return ong > 0 ? Math.round((gew / ong) * 10) / 10 : "—";
  }

  function pctMeer(ong, gew) {
    const a = Number(ong);
    const b = Number(gew);
    if (!(a > 0) || !isFinite(b)) return null;
    return Math.round(((b - a) / a) * 100);
  }

  function pctTekst(n) {
    if (n == null) return "—";
    if (n > 0) return "+" + n + "%";
    return n + "%";
  }

  /** Volledig ongewapend pakket — ook als de druklaag een eigen keuze heeft. */
  function profielKaalMpa() {
    const k = calcKale(false);
    const fund = isDruklaagActief() ? k.output.E13 : k.output.D13;
    return { fund: Number(fund) || 0, ogv: Number(k.output.D14) || 0 };
  }

  /** Zelfde getallen als de koppen Ongewapend en Gewapend. */
  function stijfheidPercentages() {
    const ong = profielKaalMpa();
    const gew = profielConstructieMpa(wapeningFund, wapeningOgv);
    return {
      fund: pctMeer(ong.fund, gew.fund),
      ogv: pctMeer(ong.ogv, gew.ogv),
    };
  }

  function bovenLaagAan(laag) {
    return values.bovenToplaag === laag.id;
  }

  function bovenActieveLaag() {
    return BOVEN_LAGEN.find(function (L) {
      return L.id === values.bovenToplaag;
    });
  }

  function asfaltLaagMm(laag) {
    const n = Number(values[laag.key]);
    if (!Number.isFinite(n)) return laag.defaultMm;
    const stepped = Math.round(n / laag.step) * laag.step;
    return Math.max(laag.min, Math.min(laag.max, stepped));
  }

  function asfaltSum() {
    return ASFALT_LAGEN.reduce(function (sum, laag) {
      return sum + asfaltLaagMm(laag);
    }, 0);
  }

  function syncAsfaltTotal() {
    ASFALT_LAGEN.forEach(function (laag) {
      values[laag.key] = asfaltLaagMm(laag);
    });
    values.bovenAsfalt = asfaltSum();
  }

  /** Oude link met één asfaltdikte: verdeel naar dezelfde verhouding als 40/50/90. */
  function splitAsfaltTotal(total) {
    total = Math.max(0, Math.round(Number(total) || 0));
    const base = ASFALT_LAGEN.reduce(function (sum, laag) {
      return sum + laag.defaultMm;
    }, 0);
    if (!total || total === base) {
      ASFALT_LAGEN.forEach(function (laag) {
        values[laag.key] = total ? laag.defaultMm : 0;
      });
      values.bovenAsfalt = total ? base : 0;
      return;
    }
    let used = 0;
    ASFALT_LAGEN.forEach(function (laag, i) {
      if (i === ASFALT_LAGEN.length - 1) {
        values[laag.key] = Math.max(0, total - used);
        return;
      }
      const stepped = Math.round((total * laag.defaultMm) / base / laag.step) * laag.step;
      const mm = Math.max(laag.min, Math.min(laag.max, stepped));
      values[laag.key] = mm;
      used += mm;
    });
    values.bovenAsfalt = asfaltSum();
  }

  function vulAsfaltDefaults() {
    ASFALT_LAGEN.forEach(function (laag) {
      values[laag.key] = laag.defaultMm;
    });
    values.bovenAsfalt = asfaltSum();
  }

  function asfaltFieldDefs() {
    return ASFALT_LAGEN.map(function (laag) {
      return {
        key: laag.key,
        label: laag.label,
        unit: "mm",
        min: laag.min,
        max: laag.max,
        step: laag.step,
      };
    });
  }

  function asfaltVeldenHtml() {
    return (
      asfaltFieldDefs()
        .map(function (f) {
          return fieldHtml(f, false);
        })
        .join("") +
      '<p class="field-note" id="asfalt-totaal-note">Asfalt totaal ' +
      asfaltSum() +
      " mm. Elke laag apart.</p>"
    );
  }

  function bovenLaagMm(laag) {
    if (!bovenLaagAan(laag)) return 0;
    if (laag.id === "asfalt") return asfaltSum();
    return values[laag.dikteKey] || 0;
  }

  function bovenStraatzandActief() {
    return values.bovenToplaag === "klinkers";
  }

  function bovenBeddingId() {
    const id = values.bovenBedding;
    return BOVEN_BEDDING.some(function (b) {
      return b.id === id;
    })
      ? id
      : BOVEN_BEDDING_DEFAULT;
  }

  function bovenBeddingKeuze() {
    return (
      BOVEN_BEDDING.find(function (b) {
        return b.id === bovenBeddingId();
      }) || BOVEN_BEDDING[0]
    );
  }

  function bovenBeddingLabel() {
    return bovenBeddingKeuze().label;
  }

  function bovenStraatzandMm() {
    return bovenStraatzandActief() ? values.bovenStraatzand || 0 : 0;
  }

  function bovenTopDikteSum() {
    return (
      BOVEN_LAGEN.reduce(function (sum, L) {
        return sum + bovenLaagMm(L);
      }, 0) + bovenStraatzandMm()
    );
  }

  function bovenDikteOmschrijving() {
    const L = bovenActieveLaag();
    if (!L) return "0";
    const mm = bovenLaagMm(L);
    const sz = bovenStraatzandMm();
    if (L.id === "asfalt") {
      const bits = ASFALT_LAGEN.filter(function (laag) {
        return asfaltLaagMm(laag) > 0;
      }).map(function (laag) {
        return laag.label + " " + asfaltLaagMm(laag);
      });
      return bits.length ? bits.join(" + ") : "Asfalt 0";
    }
    if (L.id === "klinkers" && sz > 0) {
      return L.label + " " + mm + " + " + bovenBeddingLabel().toLowerCase() + " " + sz;
    }
    return L.label + " " + mm;
  }

  function bovenOmschrijving() {
    const top = bovenTopDikteSum();
    if (top <= 0) return "geen toplaag";
    return bovenDikteOmschrijving();
  }

  function syncBovenDikte() {
    if (values.bovenToplaag === "asfalt") syncAsfaltTotal();
    values.bovenDikte = bovenTopDikteSum();
  }

  function bovenLagenSectionHtml() {
    const active = bovenActieveLaag();
    let html =
      '<div class="field-section">' +
      '<div class="field-section-title">Kies toplaag</div>' +
      '<p class="field-note">Één laag: bestrating, asfalt of beton. Onder bestrating kies je de onderlaag.</p>' +
      '<div class="boven-keuze" role="radiogroup" aria-label="Toplaag">';
    BOVEN_LAGEN.forEach(function (L) {
      const on = bovenLaagAan(L);
      html +=
        '<label class="boven-keuze-opt' +
        (on ? " boven-keuze-opt--active" : "") +
        '">' +
        '<input type="radio" name="boven-toplaag" value="' +
        L.id +
        '" data-boven-toplaag="1"' +
        (on ? " checked" : "") +
        " />" +
        "<span><strong>" +
        L.label +
        "</strong>" +
        (L.note ? ' <span class="toggle-note">(' + L.note + ")</span>" : "") +
        "</span></label>";
    });
    html += "</div>";
    if (active && active.id === "asfalt") {
      html +=
        '<div class="field-section-title">Asfaltlagen</div>' +
        '<p class="field-note">Deklaag, tussenlaag en onderlaag, elk apart.</p>' +
        asfaltVeldenHtml();
    } else if (active) {
      html +=
        '<div class="field boven-laag-field">' +
        fieldHtml(
          {
            key: active.dikteKey,
            label: "Dikte " + active.label.toLowerCase(),
            unit: "mm",
            min: active.min,
            max: active.max,
            step: active.step,
          },
          false
        ) +
        "</div>";
    }
    if (active && active.id === "klinkers") {
      const bed = bovenBeddingKeuze();
      html +=
        '<div class="field boven-laag-field boven-laag-field--sub">' +
        '<div class="field-section-title">Onderlaag</div>' +
        '<p class="field-note">Tussen bestrating en onderconstructie — straatzand, drainagemortel of split (0–200 mm).</p>' +
        '<div class="boven-keuze" role="radiogroup" aria-label="Onderlaag bestrating">';
      BOVEN_BEDDING.forEach(function (b) {
        const on = b.id === bed.id;
        html +=
          '<label class="boven-keuze-opt' +
          (on ? " boven-keuze-opt--active" : "") +
          '">' +
          '<input type="radio" name="boven-bedding" value="' +
          b.id +
          '" data-boven-bedding="1"' +
          (on ? " checked" : "") +
          " />" +
          "<span><strong>" +
          b.label +
          "</strong></span></label>";
      });
      html +=
        "</div>" +
        fieldHtml(
          {
            key: BOVEN_STRAATZAND.dikteKey,
            label: "Dikte " + bed.label.toLowerCase() + " (max 20 cm)",
            unit: "mm",
            min: BOVEN_STRAATZAND.min,
            max: BOVEN_STRAATZAND.max,
            step: BOVEN_STRAATZAND.step,
          },
          false
        ) +
        "</div>";
    }
    html += "</div>";
    return html;
  }

  function onderPanelExtra() {
    const f = fundMeta(wapeningFund);
    return (
      '<div class="panel-extra">' +
      "<strong>Onderconstructie:</strong> " +
      onderconstructieOmschrijving() +
      " mm<br>" +
      "<strong>· " + tx("Fundering") + ":</strong> " +
      f.dikteTotaal +
      " mm<br>" +
      "<strong>· " + ogvLabel() + ":</strong> " +
      values.ogvDikte +
      " mm<br>" +
      pakketPanelLine() +
      "</div>"
    );
  }

  function laagOverzichtKaart(layerKey) {
    const f = fundMeta(wapeningFund);
    const title = layerKey === "fund" ? "Fundering" : ogvLabel();
    const mm = layerKey === "fund" ? f.dikteTotaal : values.ogvDikte || 0;
    const on =
      layerKey === "fund" && isDruklaagActief()
        ? wapeningFund && lichtHasWapening()
        : wapeningForLayer(layerKey);
    const active =
      selected === layerKey ||
      (layerKey === "fund" &&
        (selected === "fund-licht" || selected === "fund-druk" || selected === "onder"));
    const dikteVelden = (FIELDS[layerKey].dikte || []).filter(function (fld) {
      if (fld.key === "overhoogte") return false;
      return !(layerKey === "fund" && isDruklaagActief() && fld.key === "funderingBasis");
    });
    const dikteHtml = dikteVelden
      .map(function (fld) {
        return fieldHtml(fld, false);
      })
      .join("");
    return (
      '<section class="laag-kaart' +
      (active ? " laag-kaart--active" : "") +
      '" id="laag-' +
      layerKey +
      '" data-laag="' +
      layerKey +
      '">' +
      '<header class="laag-kaart__head">' +
      "<div><strong>" +
      '<span class="stap">' +
      (layerKey === "fund" ? "3" : "2") +
      "</span>" +
      title +
      '</strong> <span class="laag-kaart__mm">' +
      mm +
      " mm</span></div>" +
      wapeningToggleHtml(layerKey, true) +
      "</header>" +
      (layerKey === "fund" && isDruklaagActief() ? "" : dikteHtml) +
      (layerKey === "fund" && !isDruklaagActief() ? overhoogteInvoerHtml() : "") +
      (layerKey === "fund" && isDruklaagActief() ? fundBimsInvoerHtml(!on) : "") +
      (layerKey === "fund" && isDruklaagActief()
        ? ""
        : laagMateriaalInlineHtml(layerKey, "", { skipEquiv: true })) +
      (layerKey === "fund" && isDruklaagActief()
        ? ""
        : on
          ? wapeningTypeHtml(layerKey, false, { compact: true, label: "Wapening" })
          : "") +
      "</section>"
    );
  }

  function bovenOverzichtKaart() {
    const active = bovenActieveLaag();
    const mm = values.bovenDikte || 0;
    let html =
      '<section class="laag-kaart' +
      (selected === "boven" ? " laag-kaart--active" : "") +
      '" id="laag-boven" data-laag="boven">' +
      '<header class="laag-kaart__head"><div><strong><span class="stap">4</span>Bovenconstructie</strong> <span class="laag-kaart__mm">' +
      mm +
      " mm</span></div></header>" +
      '<label class="materiaal-label" for="boven-toplaag-sel">Toplaag</label>' +
      '<select id="boven-toplaag-sel" class="materiaal-select" data-boven-toplaag="1">';
    BOVEN_LAGEN.forEach(function (L) {
      html +=
        '<option value="' +
        L.id +
        '"' +
        (bovenLaagAan(L) ? " selected" : "") +
        ">" +
        L.label +
        "</option>";
    });
    html += "</select>";
    if (active && active.id === "asfalt") {
      html +=
        '<div class="field-section-title">Asfaltlagen</div>' + asfaltVeldenHtml();
    } else if (active) {
      html += fieldHtml(
        {
          key: active.dikteKey,
          label: "Dikte",
          unit: "mm",
          min: active.min,
          max: active.max,
          step: active.step,
        },
        false
      );
    }
    if (active && active.id === "klinkers") {
      const bed = bovenBeddingKeuze();
      html += '<label class="materiaal-label" for="boven-bedding-sel">Onder bestrating</label>';
      html += '<select id="boven-bedding-sel" class="materiaal-select" data-boven-bedding="1">';
      BOVEN_BEDDING.forEach(function (b) {
        html +=
          '<option value="' +
          b.id +
          '"' +
          (b.id === bed.id ? " selected" : "") +
          ">" +
          b.label +
          "</option>";
      });
      html += "</select>";
      html += fieldHtml(
        {
          key: BOVEN_STRAATZAND.dikteKey,
          label: "Dikte " + bed.label.toLowerCase(),
          unit: "mm",
          min: BOVEN_STRAATZAND.min,
          max: BOVEN_STRAATZAND.max,
          step: BOVEN_STRAATZAND.step,
        },
        false
      );
    }
    html += "</section>";
    return html;
  }

  function grondOverzichtKaart() {
    const fld = FIELDS.grond.materiaal[0];
    return (
      '<section class="laag-kaart' +
      (selected === "grond" ? " laag-kaart--active" : "") +
      '" id="laag-grond" data-laag="grond">' +
      '<header class="laag-kaart__head"><div><strong><span class="stap">1</span>Ondergrond</strong> <span class="laag-kaart__mm">' +
      (values.eOndergrond || 0) +
      " MPa" +
      (kgM3ForKey("eOndergrond") ? " · " + formatKg(kgM3ForKey("eOndergrond")) + " kg/m³" : "") +
      "</span></div></header>" +
      materiaalFieldHtml(fld, true) +
      "</section>"
    );
  }

  function onderconstructieOverviewHtml() {
    return (
      '<div class="laag-overzicht">' +
      laagOverzichtKaart("fund") +
      laagOverzichtKaart("ogv") +
      "</div>"
    );
  }

  function layerEquivalentText(layerKey) {
    if (layerKey === "fund") {
      const ong = calcAt(false, wapeningOgv);
      const gew = calcAt(true, wapeningOgv);
      if (wapeningFund) return ong.output.D13 + " → " + gew.output.E13 + " MPa";
      return ong.output.D13 + " MPa";
    }
    if (layerKey === "ogv") {
      const ong = calcAt(wapeningFund, false);
      const gew = calcAt(wapeningFund, true);
      if (wapeningOgv) return ong.output.D14 + " → " + gew.output.E14 + " MPa";
      return ong.output.D14 + " MPa";
    }
    return "";
  }

  function materiaalEquivalentHtml(layerKey) {
    const eq = layerEquivalentText(layerKey);
    if (!eq) return "";
    return (
      '<p class="field-note materiaal-equiv" data-equiv-layer="' +
      layerKey +
      '"><strong>Equivalente stijfheid</strong> (vulmateriaal + onderliggende lagen): ' +
      eq +
      "</p>"
    );
  }

  function syncMateriaalEquivalentNotes(root) {
    const scope = root || panelFields;
    if (!scope) return;
    scope.querySelectorAll("[data-equiv-layer]").forEach(function (el) {
      const html = materiaalEquivalentHtml(el.dataset.equivLayer);
      if (html) el.outerHTML = html;
    });
  }

  function laagMateriaalInlineHtml(layerKey, label, opts) {
    opts = opts || {};
    const materiaal = FIELDS[layerKey].materiaal;
    if (!materiaal.length) return "";
    const lichtModus = layerKey === "fund" && isDruklaagActief();
    const title =
      label == null
        ? ""
        : label + (lichtModus ? " · " + activeLichtLabel() : label ? "" : "");
    return (
      '<div class="field-section field-section--' +
      layerKey +
      '-materiaal">' +
      (title
        ? '<div class="field-section-title">' + title + "</div>"
        : "") +
      (lichtModus
        ? '<p class="field-note">Wijzig hier het licht materiaal, niet de druklaag. Of kies ↩ standaard fundering.</p>'
        : "") +
      materiaal
        .map(function (f) {
          return materiaalFieldHtml(f, !!opts.skipEquiv);
        })
        .join("") +
      (lichtModus ? exitLichtFunderingBtnHtml() : "") +
      (opts.skipEquiv ? "" : materiaalEquivalentHtml(layerKey)) +
      "</div>"
    );
  }

  function pakketPanelLine() {
    const pk = pakketMeta();
    return (
      "<strong>Totale pakketdikte:</strong> " +
      pk.totaal +
      " mm (" +
      pk.omschrijving +
      ")"
    );
  }

  function bovenPanelExtra() {
    const L = bovenActieveLaag();
    const warn =
      values.bovenDikte <= 0
        ? '<br><strong class="warn">Kies een toplaag met dikte &gt; 0.</strong>'
        : "";
    const sz = bovenStraatzandMm();
    const asfaltRegels =
      L && L.id === "asfalt"
        ? ASFALT_LAGEN.map(function (laag) {
            return "<br><strong>" + laag.label + ":</strong> " + asfaltLaagMm(laag) + " mm";
          }).join("") +
          "<br><strong>Asfalt totaal:</strong> " +
          asfaltSum() +
          " mm"
        : "";
    return (
      '<div class="panel-extra">' +
      "<strong>Toplaag:</strong> " +
      (L && L.id === "asfalt" ? L.label : L ? L.label + " · " + bovenLaagMm(L) + " mm" : "geen") +
      asfaltRegels +
      (sz > 0 ? "<br><strong>" + bovenBeddingLabel() + ":</strong> " + sz + " mm" : "") +
      (L && sz > 0
        ? "<br><strong>Bovenconstructie totaal:</strong> " + bovenTopDikteSum() + " mm"
        : "") +
      "<br>" +
      pakketPanelLine() +
      "<br>" +
      "<strong>Equivalent E:</strong> " +
      BOVEN_E_EQUIVALENT +
      " MPa — vaste stijfheid bovenconstructie (geen Romfix)" +
      warn +
      "</div>"
    );
  }

  function pakketMeta() {
    const f = fundMeta(wapeningFund);
    const boven = values.bovenDikte || 0;
    const fundering = f.dikteTotaal;
    const ogv = values.ogvDikte || 0;
    const totaal = boven + fundering + ogv;
    return {
      boven: boven,
      fundering: fundering,
      ogv: ogv,
      totaal: totaal,
      omschrijving: boven + "+" + fundering + "+" + ogv + "=" + totaal,
    };
  }

  function formatFactorNl(n) {
    if (n == null || n === "—") return "—";
    return String(n).replace(".", ",");
  }

  /** Duidelijke KPI-kaarten voor print/PDF (geen Excel-kort). */
  function printKpiCards(r) {
    const ogvNaam = tx(ogvLabel());
    const pakketSub = tx(
      "Bovenconstructie " +
        r.pk.boven +
        " mm · fundering " +
        r.pk.fundering +
        " mm · " +
        ogvLabel().toLowerCase() +
        " " +
        r.pk.ogv +
        " mm"
    );
    const fundMat = r.fundMateriaal ? "Materiaal: " + r.fundMateriaal + " · " : "";
    const pct = stijfheidPercentages();
    const ongM = profielConstructieMpa(false, false);
    const gewM = profielConstructieMpa(!!r.wapeningFund, !!r.wapeningOgv);
    const fund = r.wapeningFund
      ? {
          value: gewM.fund + " → " + ongM.fund + " MPa",
          sub:
            fundMat +
            "Gewapend → ongewapend · " +
            pctTekst(pct.fund) +
            " · " +
            formatFactorNl(factor(ongM.fund, gewM.fund)) +
            "× sterker",
        }
      : {
          value: ongM.fund + " MPa",
          sub: fundMat + "Geen wapening op deze laag",
        };
    const ogv = r.wapeningOgv
      ? {
          value: gewM.ogv + " → " + ongM.ogv + " MPa",
          sub:
            "Gewapend → ongewapend · " +
            pctTekst(pct.ogv) +
            " · " +
            formatFactorNl(factor(ongM.ogv, gewM.ogv)) +
            "× sterker",
        }
      : {
          value: ongM.ogv + " MPa",
          sub: "Geen wapening op deze laag",
        };
    const w = r.gewicht || gewichtMeta();
    const gewichtSub = gewichtSubTekst(w);
    return [
      { label: tx("Pakketdikte"), value: r.pk.totaal + " mm", sub: pakketSub },
      {
        label: tx("Gewichtcompensatie"),
        value: formatKg(w.pakketKg) + " kg/m²",
        sub: gewichtSub,
      },
      { label: tx("Stijfheid fundering"), value: tx(fund.value), sub: tx(fund.sub) },
      { label: tx("Stijfheid") + " " + ogvNaam.toLowerCase(), value: tx(ogv.value), sub: tx(ogv.sub) },
    ];
  }

  function renderPakketSummary() {
    if (!pakketSummaryEl) return;
    const pk = pakketMeta();
    const w = gewichtMeta();
    const m = (pk.totaal / 1000).toFixed(2).replace(".", ",");
    const deltaAbs = Math.abs(Math.round(w.delta));
    const gewichtCls =
      deltaAbs < 5 ? "kpi-chip kpi-chip--balans" : w.delta < 0 ? "kpi-chip kpi-chip--licht" : "kpi-chip kpi-chip--zwaar";
    const gewichtTxt = gewichtBalansTekst(w);
    const maaiveldTxt =
      (w.bovenMaaiveldMm || 0) > 0
        ? " · " + tx("maaiveld") + " " + Math.round(w.bovenMaaiveldMm) + " mm"
        : "";
    const pct = stijfheidPercentages();
    const pctDelen = [];
    if ((pct.fund || 0) !== 0) pctDelen.push("<strong>" + pctTekst(pct.fund) + "</strong>");
    if ((pct.ogv || 0) !== 0) {
      pctDelen.push("<strong>" + pctTekst(pct.ogv) + "</strong> " + ogvLabel().toLowerCase());
    }
    const pctCls = pctDelen.length ? "kpi-chip kpi-chip--licht" : "kpi-chip";
    const pctHtml = pctDelen.length
      ? tx("Gewapend t.o.v. ongewapend") + " " + pctDelen.join(" · ")
      : tx("Gewapend t.o.v. ongewapend") + " <strong>0%</strong>";
    pakketSummaryEl.innerHTML =
      '<div class="kpi-bar__main">' +
      '<span class="kpi-bar__label">Pakketdikte</span>' +
      '<span class="kpi-bar__value">' +
      pk.totaal +
      ' <small>mm</small> <span class="kpi-bar__m">(' +
      m +
      " m)</span></span></div>" +
      '<div class="kpi-bar__chips">' +
      '<span class="' +
      pctCls +
      '">' +
      pctHtml +
      "</span>" +
      '<span class="kpi-chip">' +
      tx("Boven") +
      " <strong>" +
      pk.boven +
      " mm</strong></span>" +
      '<span class="kpi-chip">' +
      tx("Fundering") +
      " <strong>" +
      pk.fundering +
      " mm</strong></span>" +
      '<span class="kpi-chip">' +
      tx(ogvLabel()) +
      ' <strong>' +
      pk.ogv +
      " mm</strong></span>" +
      '<span class="' +
      gewichtCls +
      '" title="' +
      gewichtSubTekst(w).replace(/"/g, "&quot;") +
      '">' +
      tx("Gewicht") +
      " <strong>" +
      formatKg(w.pakketKg) +
      " kg/m²</strong> · " +
      gewichtTxt +
      maaiveldTxt +
      "</span>" +
      "</div>";
  }

  /** Symbolische ondergrond in profiel — schaalt mee met pakket */
  function grondVisualMm() {
    const totaal = pakketMeta().totaal;
    if (totaal <= 0) return 60;
    return Math.max(40, Math.round(totaal * GROND_VISUAL_RATIO));
  }

  /** Som van alle mm in het profiel = één schaal */
  function visualProfielTotaalMm() {
    const pk = pakketMeta();
    return pk.totaal + grondVisualMm();
  }

  function isMobileViewport() {
    return window.matchMedia("(max-width: 720px)").matches;
  }

  function visualHeightPx() {
    const total = visualProfielTotaalMm();
    const minH = isMobileViewport() ? 220 : VISUAL_HEIGHT_MIN;
    const maxH = isMobileViewport() ? 480 : VISUAL_HEIGHT_MAX;
    return Math.min(maxH, Math.max(minH, Math.round(total * VISUAL_PX_PER_MM)));
  }

  /** Ruimte onder de kop, zodat het hele profiel in het telefoonscherm past. */
  function mobileVisualBudget() {
    const vh = window.innerHeight || 700;
    const cols = showOngewapend ? 2 : 1;
    const visual = document.getElementById("visual-gew");
    let start = 0;
    if (visual) {
      const top = visual.getBoundingClientRect().top;
      if (top > 48 && top < vh * 0.85) start = top;
    }
    if (!start) start = Math.min(400, Math.round(vh * 0.5));
    const below = showOngewapend ? 24 : 76;
    return Math.max(188, Math.round((vh - start - below) / cols));
  }

  /** Op een telefoon schaalt het hele profiel mee, zodat de onderste lagen in beeld blijven. */
  function prepareVisualScale() {
    if (!isMobileViewport()) {
      visualPxPerMm = 0.72;
      visualLayerMinPx = 34;
      return;
    }
    const budget = mobileVisualBudget();
    const total = Math.max(1, visualProfielTotaalMm());
    visualPxPerMm = Math.max(0.12, (budget - 20) / total);
    visualLayerMinPx = 32;
  }

  function flexMm(mm) {
    return Math.max(0, Number(mm) || 0);
  }

  function layerPx(mm, placeholder) {
    const w = flexMm(mm);
    if (w <= 0) return placeholder ? (isMobileViewport() ? 36 : MIN_LAYER_VISUAL_PX) : 0;
    return Math.max(visualLayerMinPx, Math.round(w * visualPxPerMm));
  }

  function fitMobileVisual(el) {
    if (!el) return;
    el.style.zoom = "";
    if (!isMobileViewport()) {
      el.classList.remove("visual--dense");
      return;
    }
    const budget = mobileVisualBudget();
    const h = el.getBoundingClientRect().height;
    if (h < 40 || h <= budget + 6) {
      el.classList.remove("visual--dense");
      return;
    }
    const s = Math.max(0.42, Math.round((budget / h) * 1000) / 1000);
    el.style.zoom = String(s);
    el.classList.toggle("visual--dense", s < 0.8);
  }

  function flexStyle(mm, placeholder) {
    const px = layerPx(mm, placeholder);
    if (!px) return "display:none";
    return "height:" + px + "px;min-height:" + px + "px;flex:0 0 auto";
  }

  function materiaalMpa(key) {
    return (values[key] || 0) + " MPa";
  }

  function mpaVal(n) {
    return (Number(n) || 0) + " MPa";
  }

  function isFunderingVast() {
    const s = String(values.funderingModus || "").trim().toLowerCase();
    return s === "vast" || s === "< vast";
  }

  function isBindendMateriaal(key) {
    const m = materiaalMatch(key);
    return !!(m && m.bindend);
  }

  function syncFunderingModusVanMateriaal() {
    if (isBindendMateriaal("eFundering") || isBindendMateriaal("eDruklaag")) {
      values.funderingModus = "vast";
    }
  }

  function eInFundering() {
    return isDruklaagActief() ? values.eDruklaag || values.eFundering : values.eFundering;
  }

  function eWFundering() {
    const eIn = eInFundering();
    if (isFunderingVast()) return eIn;
    const aust = window.austroadsAvg;
    if (!aust) return eIn;
    const f = fundMeta(false);
    const h = f.druklaagAan ? f.drukBasis : f.dikteTotaal;
    const onder = values.eOgv || values.eOndergrond;
    return aust(onder, h, eIn);
  }

  function funderingEwHtml() {
    const eIn = eInFundering();
    const eW = eWFundering();
    const vast = isFunderingVast();
    const bindend = isBindendMateriaal("eFundering") || isBindendMateriaal("eDruklaag");
    return (
      '<div class="field-section">' +
      '<div class="field-section-title">Ongewapende stijfheid van deze laag</div>' +
      '<p class="field-note">' +
      "<strong>In</strong> (catalogus): " +
      eIn +
      " MPa · <strong>W</strong> (zonder wapening): " +
      eW +
      " MPa. " +
      (vast
        ? "Vast: In en W zijn gelijk — het programma rekent met de ingevulde ongewapende stijfheid."
        : "Vrij: W volgt uit laagdikte en stijfheid van de ondergrond; alleen voor ongebonden materialen.") +
      (bindend ? " Menggranulaat en andere zelfbindende materialen staan altijd op vast." : "") +
      "</p></div>"
    );
  }

  /** Equivalente E per deelzone fundering (Excel: E46 / C26 / D46). */
  function fundSegmentEquivMpa(st, segment) {
    const eCap = isDruklaagActief() ? values.eDruklaag : values.eFundering;
    if (segment === "ongewTop") {
      return mpaVal(isFunderingVast() ? eCap : st.E46);
    }
    if (segment === "ongewOnder") return mpaVal(st.D46);
    if (segment === "gewap") return mpaVal(st.C26);
    return mpaVal(st.E46);
  }

  /**
   * Ongewapende overhoogte — Austroads/Thenn met stijfheid eronder.
   * Direct op gewapende oh: Austroads over C26. Met ongew. boven eronder: Thenn + D26 (gewap onder B25).
   */
  function fundOhOngEquivMpa(st, f) {
    const mat = f.druklaagAan ? f.eDruk : values.eFundering;
    if (isFunderingVast()) return mpaVal(mat);
    const aust = window.austroadsAvg;
    const thenn2 = window.thennTweeLagen;
    if (!aust) return fundSegmentEquivMpa(st, "ongewTop");

    const restOngHoog = Math.max(0, (st.B25 || 0) - f.ohOng);
    if (f.ohOng <= 0) return fundSegmentEquivMpa(st, "ongewTop");

    if (restOngHoog <= 0) {
      const onder =
        f.ohGew > 0 && (st.B26 || 0) > 0 ? st.C26 : st.D26;
      return mpaVal(aust(onder, f.ohOng, mat));
    }

    if (!thenn2) return fundSegmentEquivMpa(st, "ongewTop");
    const ongewBovenEquiv = aust(st.D26, restOngHoog, mat);
    return mpaVal(thenn2(f.ohOng, mat, restOngHoog, ongewBovenEquiv));
  }

  /** Equivalente E per deelzone OGV (Excel: C46 / C29 / B46). */
  function ogvSegmentEquivMpa(st, segment) {
    if (segment === "ongewTop") return mpaVal(st.C46);
    if (segment === "ongewOnder") return mpaVal(st.B46);
    if (segment === "gewap") return mpaVal(st.C29);
    return mpaVal(st.C46);
  }

  function layerSelected(id) {
    if (id === "onder") return selected === "onder";
    if (id === "fund" && (selected === "fund-licht" || selected === "fund-druk")) return true;
    return selected === id;
  }

  function druklaagSectionHtml(disabled) {
    if (!isDruklaagActief()) return "";
    return lichtDrukDikteSectionHtml();
  }

  function fundLichtPanelHtml() {
    const f = fundMeta(wapeningFund);
    return (
      lichtDrukDikteSectionHtml() +
      lichtDrukMateriaalHtml() +
      lichtDrukWapeningHtml(!wapeningFund) +
      exitLichtFunderingBtnHtml() +
      '<p class="field-note">Nominale fundering ' +
      f.basis +
      " mm = druklaag + schuimglas/puimsteen.</p>"
    );
  }

  function kgM3ForVisual(id, cls) {
    if (id === "grond") return 0;
    if (id === "boven") {
      const asfalt = ASFALT_LAGEN.find(function (laag) {
        return laag.cls === cls;
      });
      if (asfalt) return asfalt.kgM3 || 0;
      const laag = BOVEN_LAGEN.find(function (L) {
        return L.cls === cls;
      });
      if (laag) return laag.kgM3 || 0;
      const bed = BOVEN_BEDDING.find(function (b) {
        return b.cls === cls;
      });
      return bed ? bed.kgM3 || 0 : 0;
    }
    if (id === "ogv") return kgM3ForKey("eOgv");
    if (id === "fund-druk") return kgM3ForKey("eDruklaag");
    if (id === "fund-licht") return kgM3ForKey("eFundering");
    if (id === "fund") return kgM3ForKey("eFundering");
    return 0;
  }

  function visualLayerInner(name, mm, mpa, kg, kgUnit) {
    const mmHtml =
      mm != null && mm >= 0
        ? '<span class="visual-layer__mm">' + Math.round(mm) + " mm</span>"
        : "";
    const kgHtml =
      kg != null && kg > 0
        ? '<span class="visual-layer__kg">' + formatKg(kg) + " " + (kgUnit || "kg/m²") + "</span>"
        : "";
    const mpaHtml = mpa ? '<span class="visual-layer__mpa">' + mpa + "</span>" : "";
    return (
      '<span class="visual-layer__name">' +
      name +
      "</span>" +
      '<span class="visual-layer__vals">' +
      mmHtml +
      kgHtml +
      mpaHtml +
      "</span>"
    );
  }

  function lichtOngewapendMpa(f) {
    if (isFunderingVast()) return mpaVal(f.eLicht);
    const st = calcAt(false, wapeningOgv).state;
    return mpaVal(st.C27 || f.eLicht);
  }

  function lichtLaagMpaHtml(fundOn, gewState, f) {
    const ong = lichtOngewapendMpa(f);
    const versterkt = fundOn && lichtHasWapening() && Number(values.sifLicht) > 0;
    if (!versterkt) return ong;
    const gew = mpaVal((gewState && gewState.C27) || f.eLicht);
    if (gew === ong) return ong;
    return ong.replace(" MPa", "") + " → " + gew;
  }

  let visualKale = false;

  function liveFundState(fundOn, ogvOn) {
    if (visualKale && values.drukWapVrij) return calcKale(false).state;
    return calcAt(!!fundOn, !!ogvOn).state;
  }

  function drukLaagMpaHtml(fundOn, gewState, f, geogrid) {
    if (isFunderingVast()) return mpaVal(f.eDruk) + " vul";
    const st =
      visualKale && values.drukWapVrij
        ? calcKale(false).state
        : fundOn && gewState
          ? gewState
          : calcAt(false, wapeningOgv).state;
    const toonWap =
      !(visualKale && values.drukWapVrij) &&
      geogrid &&
      st.C26 > 0 &&
      (fundOn || values.drukWapVrij);
    if (toonWap) {
      const base = mpaVal(f.eDruk);
      const gew = mpaVal(st.C26);
      if (base === gew) return gew;
      return base.replace(" MPa", "") + " → " + gew;
    }
    return mpaVal(st.C25 || st.E46 || f.eDruk);
  }

  function stapVoor(id) {
    if (id === "grond") return "1";
    if (id === "ogv") return "2";
    if (id === "fund" || id === "fund-licht" || id === "fund-druk") return "3";
    if (id === "boven") return "4";
    return "";
  }

  function stampStappen(id, parts) {
    const base = stapVoor(id);
    if (!base || !parts || parts.length < 2) return parts;
    const needle = base + " · ";
    return parts.map(function (html, i) {
      const label = base + String.fromCharCode(97 + (parts.length - 1 - i)) + " · ";
      const marker = 'visual-layer__name">';
      const from = html.indexOf(marker);
      const at = from < 0 ? html.indexOf(needle) : html.indexOf(needle, from);
      if (at < 0) return html;
      return html.slice(0, at) + label + html.slice(at + needle.length);
    });
  }

  function segmentBtn(id, cls, name, mm, mpa, hMm, placeholder) {
    const stap = stapVoor(id);
    if (stap) name = stap + " · " + name;
    const h = flexMm(hMm);
    const show = h > 0 || placeholder;
    if (!show) return "";
    let kgShow = null;
    let kgUnit = "kg/m²";
    if (id === "grond") {
      kgShow = kgM3ForKey("eOndergrond") || null;
      kgUnit = "kg/m³";
    } else {
      const kgM3 = kgM3ForVisual(id, cls);
      kgShow = mm != null && mm > 0 && kgM3 > 0 ? mmToKgM2(mm, kgM3) : null;
    }
    const sel = layerSelected(id) ? " visual-layer--selected" : "";
    const title =
      name +
      (mm != null && mm > 0 ? " · " + Math.round(mm) + " mm" : mm === 0 ? " · 0 mm" : "") +
      (kgShow ? " · " + formatKg(kgShow) + " " + kgUnit : "") +
      (mpa ? " · " + mpa : "");
    return (
      '<button type="button" class="visual-layer visual-layer--' +
      cls +
      sel +
      (placeholder ? " visual-layer--placeholder" : "") +
      '" data-id="' +
      id +
      '" data-mm="' +
      h +
      '" style="' +
      flexStyle(h, placeholder) +
      '" aria-pressed="' +
      layerSelected(id) +
      '" title="' +
      title.replace(/"/g, "&quot;") +
      '">' +
      visualLayerInner(name, mm, mpa, kgShow, kgUnit) +
      "</button>"
    );
  }

  function visualStack(id, stackMm, innerHtml, placeholder) {
    if (!innerHtml) return "";
    const mm = flexMm(stackMm);
    if (mm <= 0 && !placeholder) return "";
    const sel = layerSelected(id) ? " visual-layer--selected" : "";
    return (
      '<div class="visual-stack' +
      sel +
      '" data-id="' +
      id +
      '" data-mm="' +
      mm +
      '" style="flex:0 0 auto;height:auto">' +
      innerHtml +
      "</div>"
    );
  }

  function toonLaagSamen(band, kaartEl) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = reduce ? "auto" : "smooth";
    const profile = document.querySelector(".card--profile");
    const vh = window.innerHeight;
    const margin = 24;
    if (band && profile && profile.scrollHeight > profile.clientHeight + 2) {
      const br0 = band.getBoundingClientRect();
      const pr0 = profile.getBoundingClientRect();
      const pad = 36;
      let inner = 0;
      if (br0.bottom > pr0.bottom - pad) inner = br0.bottom - (pr0.bottom - pad);
      if (br0.top - inner < pr0.top + pad) inner = br0.top - (pr0.top + pad);
      if (Math.abs(inner) > 1) profile.scrollTop += inner;
    }
    const cr = kaartEl ? kaartEl.getBoundingClientRect() : null;
    const pr = profile ? profile.getBoundingClientRect() : null;
    const grid = document.querySelector(".work-area__grid");
    let delta = 0;
    if (cr) {
      if (cr.height > vh - margin * 2) delta = cr.top - 88;
      else if (cr.bottom > vh - margin) delta = cr.bottom - (vh - margin);
      else if (cr.top < 80) delta = cr.top - 80;
    }
    if (pr && pr.top < 8) {
      const restore = pr.top - 12;
      const minDelta = cr ? cr.bottom - (vh - margin) : restore;
      const maxDelta = cr ? cr.top - 72 : restore;
      delta = Math.min(maxDelta, Math.max(restore, minDelta));
    }
    if (profile && pr && grid && 12 + pr.height <= vh - 8) {
      const room = grid.getBoundingClientRect().bottom - (12 + pr.height) - 8;
      if (delta > room) delta = Math.max(0, room);
    }
    if (Math.abs(delta) > 2) window.scrollBy({ top: delta, behavior: behavior });
  }

  function selectLayer(id) {
    selected = id;
    markVisited(id);
    syncOngewapendUi();
    renderPanel();
    renderVisual();
    renderLayerTabs();
    renderTable();
    applyI18n();
    const kaart =
      id === "fund-licht" || id === "fund-druk" || id === "onder" ? "fund" : id;
    const kaartEl = document.getElementById("laag-" + kaart);
    const band = document.querySelector('#visual-gew [data-id="' + id + '"]');
    if (!isMobileViewport()) {
      requestAnimationFrame(function () {
        toonLaagSamen(band, kaartEl);
      });
    }
    document.querySelectorAll(".stap-jump").forEach(function (btn) {
      const stap = btn.getAttribute("data-stap");
      const on =
        stap === id ||
        (stap === "fund" && (id === "fund-licht" || id === "fund-druk" || id === "onder"));
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (isMobileViewport()) {
      const panel = document.getElementById("panel-input");
      if (panel) {
        requestAnimationFrame(function () {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    }
  }

  function dikteLabel(id) {
    if (id === "boven") return bovenDikteOmschrijving() + " mm";
    if (id === "onder") return onderconstructieOmschrijving() + " mm";
    return "";
  }

  function wapDikteLabel(id) {
    if (id === "fund" && wapeningFund) return fundMeta(true).wapDikte + " mm";
    if (id === "ogv" && wapeningOgv) return values.wapOgv + " mm";
    return "—";
  }

  function wapeningBadge(id) {
    if (id === "onder") {
      return wapeningFund || wapeningOgv ? ' <span class="wap-badge">W</span>' : "";
    }
    if (id === "fund") return wapeningFund ? ' <span class="wap-badge">W</span>' : "";
    if (id === "ogv") return wapeningOgv ? ' <span class="wap-badge">W</span>' : "";
    return "";
  }

  function renderLayerTabs() {
    layerTabsEl.innerHTML = LAYERS.map(function (L) {
      const d = dikteLabel(L.id);
      const active = selected === L.id || (L.id === "onder" && isOnderGroep(selected));
      return (
        '<button type="button" class="layer-tab' +
        (active ? " active" : "") +
        '" data-id="' +
        L.id +
        '">' +
        L.label +
        wapeningBadge(L.id) +
        (d ? '<span class="layer-tab-dikte">' + d + "</span>" : "") +
        "</button>"
      );
    }).join("");

    layerTabsEl.querySelectorAll(".layer-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectLayer(btn.dataset.id);
      });
    });
  }

  function wapeningToggleHtml(layerId, compact) {
    const on =
      layerId === "fund" && isDruklaagActief()
        ? wapeningFund && lichtHasWapening()
        : wapeningForLayer(layerId);
    return (
      '<label class="toggle' +
      (compact ? " toggle--mini" : " toggle--panel") +
      '" title="Wapening">' +
      '<input type="checkbox" id="wapening-' +
      layerId +
      '" data-wap-layer="' +
      layerId +
      '"' +
      (on ? " checked" : "") +
      " />" +
      '<span class="toggle-ui"></span>' +
      (compact
        ? '<span class="toggle-mini-label">Wapening</span>'
        : "<span><strong>Romfix-wapening</strong> op deze laag</span>" +
          '<span class="toggle-status">' +
          (on ? "Aan" : "Uit") +
          "</span>") +
      "</label>"
    );
  }

  function fundPanelExtra() {
    const f = fundMeta(wapeningFund);
    const ong = calcAt(false, wapeningOgv);
    const gew = calcAt(true, wapeningOgv);
    const drukNote = f.druklaagAan
      ? "<strong>Druklaag:</strong> " +
        f.drukBasis +
        " mm · <strong>Licht:</strong> " +
        f.lichtDikte +
        " mm (" +
        (materiaalMatch("eFundering") ? materiaalMatch("eFundering").label : "") +
        ")<br>"
      : "";
    return (
      '<div class="panel-extra">' +
      drukNote +
      "<strong>Totaal:</strong> " +
      f.dikteTotaal +
      " mm (" +
      f.basis +
      " + " +
      f.oh +
      " overhoogte)<br>" +
      (wapeningFund
        ? (f.fundSplit || f.lichtSplit
            ? rcelSplitNoteHtml(f.druklaagAan ? f.lichtSplit : f.fundSplit)
            : "<strong>Standaard hoogte:</strong> " +
              f.standaardWap +
              " mm<br><strong>Werkingsdikte:</strong> " +
              f.wapDikte +
              " mm (" +
              f.standaardWap +
              " + " +
              WAP_FUNDERING_WERKING_EXTRA +
              ", max. " +
              f.basis +
              " mm onderlaag)" +
              (f.wapDikte < f.standaardWap + WAP_FUNDERING_WERKING_EXTRA
                ? " · <em>begrensd tot de onderlaag</em>"
                : "") +
              "<br>" +
              (f.oh > 0
                ? '<strong class="warn">Overhoogte ongewapend:</strong> ' + f.oh + " mm<br>"
                : "")) +
          "<strong>E:</strong> " +
          ong.output.D13 +
          " → " +
          gew.output.E13 +
          " MPa"
        : "<strong>Wapening uit</strong> · E=" + ong.output.D13 + " MPa") +
      "<br>" +
      pakketPanelLine() +
      "</div>"
    );
  }

  function grondPanelExtra() {
    const fundOng = calcAt(false, wapeningOgv);
    const fundGew = calcAt(true, wapeningOgv);
    const ogvOng = calcAt(wapeningFund, false);
    const ogvGew = calcAt(wapeningFund, true);
    return (
      '<div class="panel-extra">' +
      "<strong>E-modulus ondergrond:</strong> " +
      values.eOndergrond +
      " MPa<br>" +
      "<strong>Fundering:</strong> " +
      (wapeningFund ? fundOng.output.D13 + " → " + fundGew.output.E13 : fundOng.output.D13) +
      " MPa<br>" +
      "<strong>" + ogvLabel() + ":</strong> " +
      (wapeningOgv ? ogvOng.output.D14 + " → " + ogvGew.output.E14 : ogvOng.output.D14) +
      " MPa</div>"
    );
  }

  function ogvPanelExtra() {
    const ong = calcAt(wapeningFund, false);
    const gew = calcAt(wapeningFund, true);
    return (
      '<div class="panel-extra">' +
      (wapeningOgv
        ? "<strong>E:</strong> " + ong.output.D14 + " → " + gew.output.E14 + " MPa"
        : "<strong>Wapening uit</strong> · E=" + ong.output.D14 + " MPa") +
      "<br>" +
      pakketPanelLine() +
      "</div>"
    );
  }

  function materiaalListForKey(key) {
    if (key === "eFundering") {
      return MATERIAAL_LAAG;
    }
    if (key === "eDruklaag") return MATERIAAL_DRUKLAAG;
    if (key === "eOgv" || key === "eOndergrond") return MATERIAAL_ALLE;
    return [];
  }

  function materiaalOptionId(m) {
    return m.mpa + "|" + m.label;
  }

  function materiaalMatch(key, listOverride) {
    const list = listOverride || materiaalListForKey(key);
    const v = Number(values[key]);
    const rawChosen = materiaalKeuze[key];
    const chosen = normalizeLichtFunderingLabel(rawChosen) || rawChosen;
    if (chosen) {
      const byLabel = list.find(function (m) {
        return m.label === chosen || normalizeLichtFunderingLabel(m.label) === chosen;
      });
      if (byLabel) return byLabel;
    }
    const byMpa = list.filter(function (m) {
      return m.mpa === v;
    });
    return byMpa[0] || null;
  }

  function visibleMateriaalSelect(key) {
    const roots = [];
    if (expertMode && expertDashboardEl && !expertDashboardEl.hidden) {
      roots.push(expertDashboardEl);
    }
    if (!expertMode && panelFields) roots.push(panelFields);
    let i;
    for (i = 0; i < roots.length; i++) {
      const el = roots[i].querySelector('.materiaal-select[data-key="' + key + '"]');
      if (el) return el;
    }
    return null;
  }

  function syncMateriaalFromVisibleSelect(key) {
    const sel = visibleMateriaalSelect(key);
    if (!sel || !sel.value) return;
    const parts = sel.value.split("|");
    if (!parts[0] || parts[0] === "__exit__") return;
    if (parts[0] === "custom") {
      materiaalKeuze[key] = "";
      return;
    }
    const label = parts.slice(1).join("|");
    const list = materiaalListForKey(key);
    const fromList = list.find(function (m) {
      return m.label === label || normalizeLichtFunderingLabel(m.label) === label;
    });
    materiaalKeuze[key] = fromList ? fromList.label : label;
    if (fromList) values[key] = fromList.mpa;
  }

  function syncMateriaalKeuzeFromValues(key) {
    if (!materiaalListForKey(key).length) return;
    const m = materiaalMatch(key);
    materiaalKeuze[key] = m ? m.label : "";
  }

  function materiaalSelectOptions(key) {
    const list = materiaalListForKey(key).slice();
    const betonAt = list.findIndex(function (m) {
      return m.label === "Betongranulaat";
    });
    const hydrAt = list.findIndex(function (m) {
      return m.label === "Hydraulisch menggranulaat";
    });
    if (betonAt > -1 && hydrAt > -1 && betonAt !== hydrAt + 1) {
      const item = list.splice(betonAt, 1)[0];
      const after = list.findIndex(function (m) {
        return m.label === "Hydraulisch menggranulaat";
      });
      list.splice(after + 1, 0, item);
    }
    const argexAt = list.findIndex(function (m) {
      return m.label === "Argex";
    });
    const schuimAt = list.findIndex(function (m) {
      return m.label === "Schuimglas";
    });
    if (argexAt > -1 && schuimAt > -1 && argexAt !== schuimAt + 1) {
      const argex = list.splice(argexAt, 1)[0];
      const afterSchuim = list.findIndex(function (m) {
        return m.label === "Schuimglas";
      });
      list.splice(afterSchuim + 1, 0, argex);
    }
    const v = values[key];
    const match = materiaalMatch(key);
    let html = '<option value="">— Kies materiaal —</option>';
    if (key === "eFundering" && isDruklaagActief()) {
      html +=
        '<option value="__exit__|Standaard fundering">↩ Standaard fundering (geen puimsteen/schuimglas)</option>';
    }
    list.forEach(function (m) {
      html +=
        '<option value="' +
        materiaalOptionId(m) +
        '"' +
        (match && match.label === m.label ? " selected" : "") +
        ">" +
        m.label +
        " (" +
        m.mpa +
        " MPa" +
        (m.kgM3 ? " · " + formatKg(m.kgM3) + " kg/m³" : "") +
        ")</option>";
    });
    if (!match) {
      html +=
        '<option value="custom|' +
        v +
        '" selected>Aangepast (' +
        v +
        " MPa)</option>";
    }
    return html;
  }

  function materiaalFieldHtml(f, skipSlider) {
    return (
      '<div class="field materiaal-field">' +
      '<label class="materiaal-label" for="mat-' +
      f.key +
      '">Materiaaltype</label>' +
      '<select id="mat-' +
      f.key +
      '" class="materiaal-select" data-key="' +
      f.key +
      '">' +
      materiaalSelectOptions(f.key) +
      "</select>" +
      (skipSlider ? "" : fieldHtml(f, false)) +
      "</div>"
    );
  }

  function materiaalSectionHtml(fields, layerKey) {
    if (!fields.length) return "";
    return (
      '<div class="field-section">' +
      '<div class="field-section-title">Materiaal</div>' +
      fields
        .map(function (f) {
          return materiaalFieldHtml(f);
        })
        .join("") +
      (layerKey ? materiaalEquivalentHtml(layerKey) : "") +
      "</div>"
    );
  }

  function syncMateriaalSelect(key) {
    const sel = visibleMateriaalSelect(key) || document.getElementById("mat-" + key);
    if (!sel) return;
    sel.innerHTML = materiaalSelectOptions(key);
  }

  function fieldDefForKey(key, fields) {
    if (fields) {
      const hit = fields.find(function (f) {
        return f.key === key;
      });
      if (hit) return hit;
    }
    return expertAllFields()
      .concat(FIELDS.grond.materiaal)
      .find(function (f) {
        return f.key === key;
      });
  }

  function handleMateriaalSelectChange(key, value, fields) {
    if (!value) return;
    const parts = value.split("|");
    if (parts[0] === "__exit__") {
      exitLichtFundering();
      return;
    }
    if (parts[0] === "custom") {
      materiaalKeuze[key] = "";
      const customField = fieldDefForKey(key, fields);
      if (!customField) return;
      const scoped =
        fields && fields.some(function (f) {
          return f.key === key;
        })
          ? fields
          : [customField];
      applyFieldValue(key, parts[1], scoped);
      return;
    }
    applyMateriaalChange(key, parts[0], parts.slice(1).join("|"), fields);
  }

  function applyMateriaalChange(key, mpa, label, fields) {
    const list = materiaalListForKey(key);
    const fromList = list.find(function (m) {
      return m.label === label || normalizeLichtFunderingLabel(m.label) === label;
    });
    if (key === "eFundering" && lightOndergrondEntry(fromList ? fromList.label : label)) {
      applyLightFillAsOndergrond(fromList ? fromList.label : label);
      invalidateCalcCache();
      render();
      return;
    }
    materiaalKeuze[key] = fromList ? fromList.label : label;
    const field = fieldDefForKey(key, fields);
    if (!field) return;
    const scopedFields =
      fields && fields.some(function (f) {
        return f.key === key;
      })
        ? fields
        : [field];
    applyFieldValue(key, fromList ? fromList.mpa : mpa, scopedFields);
  }

  function choiceFieldHtml(f, disabled) {
    const v = values[f.key];
    let html =
      '<div class="field' +
      (disabled ? " field--disabled" : "") +
      '">' +
      '<div class="field-head"><span>' +
      f.label +
      '</span><span class="field-val" id="v-' +
      f.key +
      '">' +
      v +
      " " +
      f.unit +
      "</span></div>" +
      '<div class="boven-keuze wap-keuze" role="radiogroup" aria-label="' +
      f.label +
      '">';
    f.choices.forEach(function (mm) {
      const on = v === mm;
      html +=
        '<label class="boven-keuze-opt' +
        (on ? " boven-keuze-opt--active" : "") +
        '">' +
        '<input type="radio" name="choice-' +
        f.key +
        '" value="' +
        mm +
        '" data-wap-keuze="1" data-key="' +
        f.key +
        '"' +
        (on ? " checked" : "") +
        (disabled ? " disabled" : "") +
        " />" +
        "<span><strong>" +
        mm +
        " mm</strong></span></label>";
    });
    html += "</div>";
    if (f.key === "wapFundering" && wapeningFund) {
      const fmeta = fundMeta(true);
      html +=
        '<p class="field-note">Werkingsdikte = ' +
        v +
        " + " +
        WAP_FUNDERING_WERKING_EXTRA +
        " = <strong>" +
        fmeta.wapDikte +
        " mm</strong> (max. fundering " +
        fmeta.dikteTotaal +
        " mm).</p>";
    }
    html += "</div>";
    return html;
  }

  let rangeFocusKey = "";

  function rememberRangeFocus(el) {
    if (el && el.dataset && el.dataset.key) rangeFocusKey = el.dataset.key;
  }

  function restoreRangeFocus() {
    if (!rangeFocusKey) return;
    const active = document.activeElement;
    if (active && active.matches && active.matches('input[type="range"]')) return;
    if (active && active !== document.body && active !== document.documentElement) {
      const tag = active.tagName;
      if (tag === "SELECT" || tag === "TEXTAREA") return;
      if (tag === "INPUT" && active.type !== "range") return;
      if (active.isContentEditable) return;
    }
    const el = document.getElementById("f-" + rangeFocusKey);
    if (el && !el.disabled) el.focus({ preventScroll: true });
  }

  function nudgeRangeInput(el, key) {
    if (!el || el.disabled) return false;
    const min = Number(el.min);
    const max = Number(el.max);
    const step = Number(el.step);
    const useStep = step > 0 && isFinite(step) ? step : 1;
    let v = Number(el.value);
    if (!isFinite(v)) v = isFinite(min) ? min : 0;
    if (key === "ArrowLeft" || key === "ArrowDown") v -= useStep;
    else if (key === "ArrowRight" || key === "ArrowUp") v += useStep;
    else if (key === "PageDown") v -= useStep * 10;
    else if (key === "PageUp") v += useStep * 10;
    else if (key === "Home") v = min;
    else if (key === "End") v = max;
    else return false;
    if (isFinite(min) && useStep > 0) {
      v = min + Math.round((v - min) / useStep) * useStep;
    }
    if (isFinite(min)) v = Math.max(min, v);
    if (isFinite(max)) v = Math.min(max, v);
    const next = String(v);
    if (el.value === next) return true;
    el.value = next;
    return true;
  }

  function fieldHtml(f, disabled) {
    if (f.choices && f.choices.length) {
      return choiceFieldHtml(f, disabled);
    }
    const v = values[f.key];
    return (
      '<div class="field' +
      (disabled ? " field--disabled" : "") +
      '">' +
      '<div class="field-head"><label for="f-' +
      f.key +
      '">' +
      f.label +
      "</label>" +
      '<span class="field-val" id="v-' +
      f.key +
      '">' +
      v +
      " " +
      f.unit +
      "</span></div>" +
      '<input type="range" id="f-' +
      f.key +
      '" data-key="' +
      f.key +
      '"' +
      (disabled ? " disabled" : "") +
      ' min="' +
      f.min +
      '" max="' +
      f.max +
      '" step="' +
      f.step +
      '" value="' +
      v +
      '" />' +
      (f.key === "overhoogte"
        ? '<p class="field-note">Telt mee in de dikte. Wapening kies je op de onderlaag, niet op de overhoogte.</p>'
        : f.key === "wapFundering" || f.key === "wapOgv"
          ? '<p class="field-note">Standaard 300 mm — de MIF-waarden zijn bepaald over 300 mm funderingsmateriaal.</p>'
          : "") +
      "</div>"
    );
  }

  function sectionHtml(title, fields, disabled) {
    if (!fields.length) return "";
    return (
      '<div class="field-section">' +
      '<div class="field-section-title">' +
      title +
      "</div>" +
      fields.map(function (f) {
        return fieldHtml(f, disabled);
      }).join("") +
      "</div>"
    );
  }

  function allFieldsForLayer(layerId) {
    if (layerId === "boven") {
      const L = bovenActieveLaag();
      if (!L) return [];
      if (L.id === "asfalt") return asfaltFieldDefs();
      const fields = [
        {
          key: L.dikteKey,
          label: L.label,
          unit: "mm",
          min: L.min,
          max: L.max,
          step: L.step,
        },
      ];
      if (L.id === "klinkers") {
        fields.push({
          key: BOVEN_STRAATZAND.dikteKey,
          label: bovenBeddingLabel(),
          unit: "mm",
          min: BOVEN_STRAATZAND.min,
          max: BOVEN_STRAATZAND.max,
          step: BOVEN_STRAATZAND.step,
        });
      }
      return fields;
    }
    const g = FIELDS[layerId];
    const dikte = g.dikte || [];
    return dikte.concat(g.materiaal).concat(g.wapening);
  }

  function applyFieldValue(key, raw, fields) {
    const field = fields.find(function (f) {
      return f.key === key;
    });
    if (!field) return;
    const wasDruklaag = key === "eFundering" ? !!values.druklaagAan : false;
    const parsed = field.choices
      ? Number(raw)
      : field.step < 1
        ? parseFloat(raw)
        : Number(raw);
    if (key === "lichtDikte") {
      const licht = Math.max(LICHT_MIN_MM, Math.min(LICHT_MAX_MM, parsed));
      const druk = Math.max(
        DRUKLAAG_MIN_MM,
        Math.min(DRUKLAAG_MAX_MM, Number(values.druklaagDikte) || DRUKLAAG_DEFAULT_MM)
      );
      values.lichtDikte = licht;
      values.druklaagDikte = druk;
      values.funderingBasis = Math.min(FUNDERING_BASIS_MAX_MM, licht + druk);
    } else {
      values[key] = parsed;
    }
    if (key === "wapFundering") {
      values.wapFundering = Math.max(50, Math.min(400, Number(values.wapFundering) || 0));
    }
    if (key === "rcelHoogte") {
      const h = Number(values.rcelHoogte);
      values.rcelHoogte = RCEL_HOOGTE_KEUZES.indexOf(h) >= 0 ? h : RCEL_HOOGTE_DEFAULT;
      if (growOnderlaagVoorCel(values.rcelHoogte)) {
        invalidateCalcCache();
        render();
        return;
      }
    }
    if (key.indexOf("boven") === 0 && key.indexOf("Aan") < 0) {
      syncBovenDikte();
    }
    if (key.indexOf("bovenAsfalt") === 0 || (key.indexOf("boven") === 0 && key.indexOf("Aan") < 0)) {
      const note = document.getElementById("asfalt-totaal-note");
      if (note) note.textContent = "Asfalt totaal " + asfaltSum() + " mm. Elke laag apart.";
      document.querySelectorAll("#laag-boven .laag-kaart__mm").forEach(function (el) {
        el.textContent = (values.bovenDikte || 0) + " mm";
      });
    }
    if (key === "funderingBasis" || key === "druklaagDikte" || key === "lichtDikte") {
      clampDruklaagDiktes();
      syncDrukLichtSliderDom();
    }
    if (!field.choices) {
      const valEl = document.getElementById("v-" + key);
      const slider = document.getElementById("f-" + key);
      if (valEl) valEl.textContent = values[key] + " " + field.unit;
      if (slider) slider.value = values[key];
    }
    if (field.choices) {
      const choiceRoot = expertMode ? expertDashboardEl : panelFields;
      if (choiceRoot) {
        choiceRoot.querySelectorAll('[data-key="' + key + '"][data-wap-keuze]').forEach(function (el) {
          el.checked = Number(el.value) === values[key];
          const lbl = el.closest(".boven-keuze-opt");
          if (lbl) lbl.classList.toggle("boven-keuze-opt--active", el.checked);
        });
      }
    }
    if (key === "eFundering" || key === "eDruklaag") {
      syncFunderingModusVanMateriaal();
    }
    if (key === "eFundering") {
      syncDruklaagFromFundering();
      if (!expertMode && !!values.druklaagAan !== wasDruklaag) {
        invalidateCalcCache();
        render();
        restoreRangeFocus();
        return;
      }
    }
    if (key === "ogvDikte" && wapeningOgv) {
      values.wapOgv = values.ogvDikte;
      const wapVal = document.getElementById("v-wapOgv");
      const wapSl = document.getElementById("f-wapOgv");
      if (wapVal) wapVal.textContent = values.wapOgv + " mm";
      if (wapSl) wapSl.value = values.wapOgv;
    }
    if (materiaalListForKey(key).length) {
      syncMateriaalKeuzeFromValues(key);
      syncMateriaalSelect(key);
    }
    if (fieldAffectsMif(key)) {
      syncMifFromWapening();
      refreshMifDisplays();
    }
    invalidateCalcCache();
    if (expertMode) {
      refreshExpertLive();
      applyI18n();
      return;
    }
    if (selected === "fund" || selected === "fund-licht" || selected === "fund-druk") {
      const extra = panelFields.querySelector(".panel-extra");
      if (extra) extra.outerHTML = fundPanelExtra();
    }
    if (selected === "ogv") {
      const extra = panelFields.querySelector(".panel-extra");
      if (extra) extra.outerHTML = ogvPanelExtra();
    }
    if (selected === "boven") {
      const extra = panelFields.querySelector(".panel-extra");
      if (extra) extra.outerHTML = bovenPanelExtra();
    }
    if (selected === "onder") {
      const extra = panelFields.querySelector(".panel-extra");
      if (extra) extra.outerHTML = onderPanelExtra();
    }
    if (key === "eOndergrond") {
      document.querySelectorAll("#laag-grond .laag-kaart__mm").forEach(function (el) {
        const kg = kgM3ForKey("eOndergrond");
        el.textContent =
          (values.eOndergrond || 0) + " MPa" + (kg ? " · " + formatKg(kg) + " kg/m³" : "");
      });
      const extraGrond = panelFields.querySelector(".panel-extra");
      if (extraGrond) {
        if (selected === "grond") extraGrond.outerHTML = grondPanelExtra();
        else if (selected === "fund") extraGrond.outerHTML = fundPanelExtra();
        else if (selected === "ogv") extraGrond.outerHTML = ogvPanelExtra();
      }
    }
    syncMateriaalEquivalentNotes();
    if (key === "eFundering" || key === "eOgv") syncWapeningOptionLabels();
    renderPakketSummary();
    renderVisual();
    renderTable();
    renderLayerTabs();
    applyI18n();
  }

  function renderPanel() {
    panelTitle.textContent = "Lagen";
    panelHint.textContent = "";

    const html =
      '<div class="laag-overzicht">' +
      bovenOverzichtKaart() +
      laagOverzichtKaart("fund") +
      laagOverzichtKaart("ogv") +
      grondOverzichtKaart() +
      "</div>";

    panelFields.innerHTML = html;

    panelFields.querySelectorAll("[data-add-overhoogte]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        values.overhoogte = 50;
        invalidateCalcCache();
        render();
      });
    });

    panelFields.querySelectorAll("[data-wap-layer]").forEach(function (el) {
      el.addEventListener("change", function () {
        const layer = el.dataset.wapLayer;
        if (layer === "fund" || layer === "fund-druk") {
          wapeningFund = el.checked;
          if (isDruklaagActief() && wapeningFund && !lichtHasWapening()) {
            values.wapTypeLicht = WAPENING_LICHT_DEFAULT;
            const t = wapeningTypeById(values.wapTypeLicht);
            if (t) values.sifLicht = t.sif;
          }
        }
        if (layer === "ogv") wapeningOgv = el.checked;
        render();
      });
    });

    const constructieEl = document.getElementById("constructie-type");
    if (constructieEl) {
      constructieEl.addEventListener("change", function () {
        values.constructieType = constructieEl.value;
        syncBovenDikte();
        syncSheetFromInvoer();
        render();
      });
    }

    panelFields.querySelectorAll(".layer-jump").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.classList.contains("exit-licht-fundering")) {
          exitLichtFundering();
          return;
        }
        selectLayer(btn.dataset.jump);
      });
    });

    panelFields.querySelectorAll(".exit-licht-fundering:not(.layer-jump)").forEach(function (btn) {
      btn.addEventListener("click", exitLichtFundering);
    });

    panelFields.querySelectorAll("[data-boven-toplaag]").forEach(function (el) {
      el.addEventListener("change", function () {
        values.bovenToplaag = el.value;
        if (el.value === "klinkers") {
          if (!values.bovenBedding) values.bovenBedding = BOVEN_BEDDING_DEFAULT;
          if (!(values.bovenStraatzand > 0)) values.bovenStraatzand = BOVEN_STRAATZAND.defaultMm;
        }
        if (el.value === "asfalt" && asfaltSum() <= 0) vulAsfaltDefaults();
        syncBovenDikte();
        render();
      });
    });

    panelFields.querySelectorAll("[data-boven-bedding]").forEach(function (el) {
      el.addEventListener("change", function () {
        values.bovenBedding = el.value;
        render();
      });
    });

    let fields = allFieldsForLayer("boven")
      .concat(FIELDS.fund.dikte)
      .concat(FIELDS.fund.materiaal)
      .concat(FIELDS.ogv.dikte)
      .concat(FIELDS.ogv.materiaal)
      .concat(FIELDS.grond.materiaal)
      .concat(isDruklaagActief() ? FIELDS.fund.druklaag.concat([lichtDikteField()]) : []);
    fields = fields.concat([rcelHoogteField()]);

    panelFields.querySelectorAll("[data-wap-keuze]").forEach(function (el) {
      el.addEventListener("change", function () {
        if (!el.dataset.key) return;
        applyFieldValue(el.dataset.key, el.value, fields);
      });
    });

    panelFields.querySelectorAll(".wapening-type-select").forEach(function (sel) {
      sel.addEventListener("change", function () {
        if (!sel.dataset.layer) return;
        applyWapeningType(sel.dataset.layer, sel.value);
      });
    });

    panelFields.querySelectorAll(".expert-modus-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.disabled) return;
        if (isBindendMateriaal("eFundering") || isBindendMateriaal("eDruklaag")) {
          values.funderingModus = "vast";
        } else {
          values.funderingModus = btn.dataset.modus === "vast" ? "vast" : "vrij";
        }
        invalidateCalcCache();
        render();
      });
    });

    panelFields.querySelectorAll(".materiaal-select").forEach(function (sel) {
      sel.addEventListener("change", function () {
        if (!sel.dataset.key || !sel.value) return;
        handleMateriaalSelectChange(sel.dataset.key, sel.value, fields);
      });
    });

    panelFields.querySelectorAll("input[type=range]").forEach(function (el) {
      el.addEventListener("focus", function () {
        rememberRangeFocus(el);
      });
      el.addEventListener("input", function () {
        if (el.disabled || !el.dataset.key) return;
        applyFieldValue(el.dataset.key, el.value, fields);
      });
      el.addEventListener("keydown", function (e) {
        if (el.disabled) return;
        if (!nudgeRangeInput(el, e.key)) return;
        e.preventDefault();
        if (el.dataset.key) applyFieldValue(el.dataset.key, el.value, fields);
      });
    });
  }

  function fundRcelGeometrie(f) {
    if (f.fundSplit) return f.fundSplit;
    if (!f.druklaagAan && typeHasRcel(values.wapTypeFund)) return cellFillSplit(f.basis);
    return null;
  }

  function fundBandNaam(basisNaam) {
    const mat = materiaalLabel("eFundering");
    if (lightOndergrondEntry(materiaalKeuze.eOndergrond)) {
      return "Druklaag · " + (mat || STEENSLAG_LABEL);
    }
    return mat ? basisNaam + " · " + mat : basisNaam;
  }

  function fundRolNaam(rol) {
    const mat = materiaalLabel("eFundering");
    return "Onderlaag" + (mat ? " · " + mat : "") + " · " + rol;
  }

  /** Zelfde laagindeling als bij Bims: cel, gewapende overhoogte, ongewapende overhoogte. */
  function fundProfielBanden(f, fundOn) {
    if (!fundOn) {
      return [
        {
          name: fundBandNaam(PRESETS[sheet].labels.fund),
          mm: f.dikteTotaal,
          gewap: false,
          kind: "all",
        },
      ];
    }
    const bands = [];
    if (f.ohOng > 0) {
      bands.push({ name: fundRolNaam("ongewapende overhoogte"), mm: f.ohOng, gewap: false, kind: "ong" });
    }
    if (f.ohGew > 0) {
      bands.push({ name: fundRolNaam("gewapende overhoogte"), mm: f.ohGew, gewap: true, kind: "vul" });
    }
    const geo = fundRcelGeometrie(f);
    if (geo && geo.cell > 0) {
      if (geo.fillOng > 0) {
        bands.push({ name: fundRolNaam("ongewapende overhoogte"), mm: geo.fillOng, gewap: false, kind: "ong" });
      }
      if (geo.fillGew > 0) {
        bands.push({ name: fundRolNaam("gewapende overhoogte"), mm: geo.fillGew, gewap: true, kind: "vul" });
      }
      bands.push({ name: fundRolNaam("gewapende celhoogte"), mm: geo.cell, gewap: true, kind: "cel" });
      return bands;
    }
    const wap = Math.min(f.wapDikte || 0, f.basis || 0);
    const ong = Math.max(0, (f.basis || 0) - wap);
    const type = wapeningTypeById(values.wapTypeFund);
    const rol = typeHasRcel(values.wapTypeFund)
      ? "gewapende celhoogte"
      : type
        ? wapeningOptionLabel(type, false, "fund")
        : "gewapend";
    if (ong > 0) {
      bands.push({ name: fundRolNaam("ongewapende overhoogte"), mm: ong, gewap: false, kind: "ong" });
    }
    if (wap > 0) {
      bands.push({ name: fundRolNaam(rol), mm: wap, gewap: true, kind: "cel" });
    }
    return bands;
  }

  function renderFundVisual(fundWap, ogvWap) {
    const fundOn = fundWap !== undefined ? fundWap : wapeningFund;
    const ogvOn = ogvWap !== undefined ? ogvWap : wapeningOgv;
    const p = PRESETS[sheet];
    const f = fundMeta(fundOn);
    const ong = calcAt(false, ogvOn);
    const gew = calcAt(true, ogvOn);
    const st = gew.state;
    const parts = [];
    const eqOng = ong.output.D13 + " MPa";
    const eqGew = gew.output.E13 + " MPa";
    const placeholder = f.dikteTotaal <= 0;

    if (f.druklaagAan) {
      const lichtMat = materiaalMatch("eFundering", MATERIAAL_LAAG);
      const lichtLabel =
        (lichtMat && lichtMat.label) ||
        normalizeLichtFunderingLabel(materiaalKeuze.eFundering) ||
        "Puimsteen";
      const drukMat = materiaalMatch("eDruklaag", MATERIAAL_DRUKLAAG);
      const drukMatNaam = (drukMat && drukMat.label) || "Steenslag";
      const lichtType = wapeningTypeById(lichtWapeningTypeId());
      const lichtWapNaam =
        fundOn && lichtHasWapening() && lichtType
          ? wapeningOptionLabel(lichtType, false, "fund-licht")
          : "";
      if (f.ohOng > 0) {
        parts.push(
          segmentBtn(
            "fund-druk",
            "groen-licht",
            "ongewapende overhoogte · " + drukMatNaam,
            f.ohOng,
            drukLaagMpaHtml(fundOn, gew.state, f),
            f.ohOng
          )
        );
      }
      if (f.ohGew > 0) {
        parts.push(
          segmentBtn(
            "fund-druk",
            "gewap",
            "gewapende overhoogte · " + drukMatNaam,
            f.ohGew,
            drukLaagMpaHtml(fundOn, gew.state, f),
            f.ohGew
          )
        );
      }
      if (f.drukBasis > 0) {
        const drukTypeId = visualKale ? "none" : effectiveDrukTypeId(fundOn);
        const drukNaam = druklaagVisueelNaam(drukTypeId);
        const drukSplit = typeHasRcel(drukTypeId) ? cellFillSplit(f.drukBasis) : null;
        const drukMpa = drukLaagMpaHtml(fundOn, liveFundState(fundOn, ogvOn), f, !!drukNaam);
        if (drukSplit && drukSplit.cell > 0 && (drukSplit.fillOng > 0 || drukSplit.fillGew > 0)) {
          appendCellSplitParts(
            parts,
            "fund-druk",
            drukSplit,
            function (b) {
              if (b.kind === "ong") return drukLaagMpaHtml(false, null, f, false);
              return drukMpa;
            },
            { ong: "druk", vul: "gewap", cel: "gewap" },
            "Druklaag · " + drukMatNaam + (drukNaam ? " · " + drukNaam : "")
          );
        } else {
          parts.push(
            segmentBtn(
              "fund-druk",
              "druk",
              "Druklaag · " + drukMatNaam + (drukNaam ? " · " + drukNaam : ""),
              f.drukBasis,
              drukMpa,
              f.drukBasis,
              placeholder
            )
          );
        }
      }
      if (f.lichtDikte > 0) {
        const lichtAan = fundOn && lichtHasWapening();
        const split =
          lichtAan && f.lichtSplit && f.lichtSplit.fill >= 100 ? f.lichtSplit : null;
        if (split) {
          appendCellSplitParts(
            parts,
            "fund-licht",
            split,
            function (b) {
              if (b.kind === "ong") return lichtOngewapendMpa(f);
              return lichtLaagMpaHtml(fundOn, gew.state, f);
            },
            { ong: "groen-licht", vul: "gewap", cel: "gewap" },
            "Onderlaag · " + lichtLabel
          );
        } else {
          parts.push(
            segmentBtn(
              "fund-licht",
              lichtAan ? "gewap" : "licht",
              "Onderlaag · " + lichtLabel + (lichtWapNaam ? " · " + lichtWapNaam : ""),
              f.lichtDikte,
              lichtLaagMpaHtml(fundOn, gew.state, f),
              f.lichtDikte
            )
          );
        }
      }
      if (!parts.length) {
        parts.push(
          segmentBtn(
            "fund-druk",
            "druk",
            "Druklaag",
            f.dikteTotaal,
            drukLaagMpaHtml(fundOn, gew.state, f),
            f.dikteTotaal,
            placeholder
          )
        );
      }
      return visualStack("fund", f.dikteTotaal, stampStappen("fund", parts).join(""), placeholder);
    }

    const zoneId = "fund";
    const banden = fundProfielBanden(f, fundOn);
    banden.forEach(function (b) {
      const mpa = !fundOn
        ? eqOng
        : b.kind === "ong"
          ? fundSegmentEquivMpa(st, "ongewTop") || fundOhOngEquivMpa(st, f)
          : fundSegmentEquivMpa(st, "gewap") || eqGew;
      const cls = b.kind === "ong" ? "groen-licht" : b.gewap ? "gewap" : "fund";
      parts.push(segmentBtn(zoneId, cls, b.name, b.mm, mpa, b.mm, placeholder && b.kind === "cel"));
    });
    if (!parts.length) {
      parts.push(
        segmentBtn(
          zoneId,
          fundOn ? "gewap" : "fund",
          fundBandNaam(fundOn ? "Fundering" : p.labels.fund),
          f.dikteTotaal,
          fundOn ? eqGew : eqOng,
          f.dikteTotaal,
          placeholder
        )
      );
    }

    return visualStack("fund", f.dikteTotaal, stampStappen("fund", parts).join(""), placeholder);
  }

  function laagMateriaalNaam(key) {
    return materiaalLabel(key) || "";
  }

  function renderOgvVisual(fundWap, ogvWap) {
    const fundOn = fundWap !== undefined ? fundWap : wapeningFund;
    const ogvOn = ogvWap !== undefined ? ogvWap : wapeningOgv;
    const mat = materiaalLabel("eOgv");
    const label = ogvLabel() + (mat ? " · " + mat : "");
    const ong = calcAt(fundOn, false);
    const gew = calcAt(fundOn, true);
    const st = gew.state;
    const parts = [];
    const eqOng = ong.output.D14 + " MPa";
    const eqGew = gew.output.E14 + " MPa";
    const ogvMm = values.ogvDikte || 0;
    const placeholder = ogvMm <= 0;

    if (!ogvOn) {
      parts.push(segmentBtn("ogv", "ogv", label, ogvMm, eqOng, ogvMm, placeholder));
      return visualStack("ogv", ogvMm, stampStappen("ogv", parts).join(""), placeholder);
    }

    const ogvSplit = typeHasRcel(values.wapTypeOgv) ? cellFillSplit(ogvMm) : null;
    if (ogvSplit && ogvSplit.cell > 0 && ogvSplit.fill >= 100) {
      appendCellSplitParts(
        parts,
        "ogv",
        ogvSplit,
        function (b) {
          if (b.kind === "ong") return ogvSegmentEquivMpa(st, "ongewTop") || eqOng;
          return ogvSegmentEquivMpa(st, "gewap") || eqGew;
        },
        { ong: "groen-licht", vul: "gewap", cel: "gewap" },
        label
      );
    } else {
      if ((st.B28 || 0) > 0) {
        parts.push(
          segmentBtn(
            "ogv",
            "groen-licht",
            label + " · ongewapende overhoogte",
            Math.round(st.B28),
            ogvSegmentEquivMpa(st, "ongewTop"),
            st.B28
          )
        );
      }
      if ((st.B29 || 0) > 0) {
        const ogvType = wapeningTypeById(values.wapTypeOgv);
        const rol = typeHasRcel(values.wapTypeOgv)
          ? "gewapende celhoogte"
          : ogvType
            ? wapeningOptionLabel(ogvType, false, "ogv")
            : "gewapend";
        parts.push(
          segmentBtn(
            "ogv",
            "gewap",
            label + " · " + rol,
            Math.round(st.B29),
            ogvSegmentEquivMpa(st, "gewap"),
            st.B29
          )
        );
      }
      if ((st.B30 || 0) > 0) {
        parts.push(
          segmentBtn(
            "ogv",
            "ogv",
            label + " · ongewapend",
            Math.round(st.B30),
            ogvSegmentEquivMpa(st, "ongewOnder"),
            st.B30
          )
        );
      }
    }

    if (parts.length === 0) {
      parts.push(segmentBtn("ogv", "gewap", label, ogvMm, eqGew, ogvMm, placeholder));
    }

    return visualStack("ogv", ogvMm, stampStappen("ogv", parts).join(""), placeholder);
  }

  function renderBovenVisual() {
    const parts = [];
    const L = bovenActieveLaag();
    const topH = bovenTopDikteSum();
    const placeholder = topH <= 0;

    if (L && L.id === "asfalt") {
      const lagen = ASFALT_LAGEN.map(function (laag) {
        return { laag: laag, mm: asfaltLaagMm(laag) };
      }).filter(function (x) {
        return x.mm > 0;
      });
      if (!lagen.length) {
        parts.push(segmentBtn("boven", "asfalt", "Asfalt", 0, null, 0, true));
      } else {
        lagen.forEach(function (x) {
          parts.push(segmentBtn("boven", x.laag.cls, x.laag.label, x.mm, null, x.mm, false));
        });
      }
    } else if (L) {
      const laagMm = bovenLaagMm(L);
      parts.push(
        segmentBtn("boven", L.cls, L.label, laagMm, null, laagMm > 0 ? laagMm : 0, laagMm <= 0 && placeholder)
      );
      const sz = bovenStraatzandMm();
      if (L.id === "klinkers") {
        const bed = bovenBeddingKeuze();
        parts.push(
          segmentBtn("boven", bed.cls, bed.label, sz, null, sz, sz <= 0)
        );
      }
    }

    if (!parts.length) {
      parts.push(
        segmentBtn("boven", "boven", "Bovenconstructie", 0, null, 0, true)
      );
    }

    return visualStack("boven", topH, stampStappen("boven", parts).join(""), placeholder);
  }

  function renderOnderconstructieVisual(fundWap, ogvWap) {
    const mm = onderconstructieMm();
    const inner = renderFundVisual(fundWap, ogvWap) + renderOgvVisual(fundWap, ogvWap);
    const placeholder = mm <= 0;
    const sel = layerSelected("onder") ? " visual-layer--selected" : "";
    return (
      '<div class="visual-onder-wrap' +
      sel +
      '" data-id="onder" data-mm="' +
      mm +
      '" style="flex:0 0 auto;height:auto">' +
      inner +
      "</div>"
    );
  }

  function renderProfielHtml(fundWap, ogvWap, kale) {
    visualKale = !!kale;
    let html = renderBovenVisual();
    html += renderOnderconstructieVisual(fundWap, ogvWap);
    const grondMm = grondVisualMm();
    const grondMat = materiaalLabel("eOndergrond");
    html += segmentBtn(
      "grond",
      "grond",
      "Ondergrond" + (grondMat ? " · " + grondMat : ""),
      null,
      materiaalMpa("eOndergrond"),
      grondMm
    );
    return html;
  }

  function bindProfielClicks(root) {
    if (!root || root.dataset.boundClicks) return;
    root.dataset.boundClicks = "1";
    root.addEventListener("click", function (e) {
      const el = e.target.closest("[data-id]");
      if (!el || !root.contains(el)) return;
      selectLayer(el.dataset.id);
    });
  }

  /** Fundering + OGV equivalente E voor profielkolom (onderconstructie). */
  function profielConstructieMpa(fundWap, ogvWap) {
    const fundOng = calcAt(false, ogvWap);
    const fundGew = calcAt(fundWap, ogvWap);
    const ogvOng = calcAt(fundWap, false);
    const ogvGew = calcAt(fundWap, ogvWap);
    const fund = fundWap
      ? fundGew.output.E13
      : isDruklaagActief()
        ? fundOng.output.E13
        : fundOng.output.D13;
    const ogv = ogvWap ? ogvGew.output.E14 : ogvOng.output.D14;
    return { fund: Number(fund) || 0, ogv: Number(ogv) || 0 };
  }

  function profielConstructieMpaText(fundWap, ogvWap) {
    const m = profielConstructieMpa(fundWap, ogvWap);
    return m.fund + " / " + m.ogv + " MPa";
  }

  function updateVisualColLabels(gewEl, ongEl) {
    if (gewEl) {
      const label = gewEl.closest(".visual-col");
      const el = label && label.querySelector(".visual-col-label");
      if (el) {
        const fundWapZichtbaar = isDruklaagActief()
          ? (wapeningFund && lichtHasWapening()) || druklaagHasWapening()
          : wapeningFund;
        const wapAan = fundWapZichtbaar || wapeningOgv;
        /* Getal hoort bij het label: druklaag-geogrid telt mee, niet alleen de schakelaar. */
        const fundForNumber = wapeningFund || (isDruklaagActief() && druklaagHasWapening());
        el.classList.toggle("visual-col-label--rust", !wapAan);
        el.innerHTML =
          tx(wapAan ? "Gewapend" : "Opbouw") +
          '<span class="visual-col-mpa">' +
          profielConstructieMpaText(fundForNumber, wapeningOgv) +
          "</span>" +
          '<span class="visual-col-mpa-sub">' +
          tx("Fundering") +
          " / " +
          tx(ogvLabel()) +
          "</span>";
      }
    }
    if (ongEl) {
      const label = ongEl.closest(".visual-col");
      const el = label && label.querySelector(".visual-col-label");
      if (el) {
        el.innerHTML =
          tx("Ongewapend") +
          '<span class="visual-col-mpa">' +
          (function () {
            const m = profielKaalMpa();
            return m.fund + " / " + m.ogv + " MPa";
          })() +
          "</span>" +
          '<span class="visual-col-mpa-sub">' +
          tx("Fundering") +
          " / " +
          tx(ogvLabel()) +
          "</span>";
      }
    }
  }

  function visualSignature(nodes) {
    return nodes
      .map(function (n) {
        return (n.getAttribute("data-id") || "") + "|" + String(n.className).replace(" visual-layer--selected", "");
      })
      .join("~");
  }

  function syncVisualNode(node, neu) {
    if (node.getAttribute("style") !== neu.getAttribute("style")) node.setAttribute("style", neu.getAttribute("style") || "");
    if (node.getAttribute("data-mm") !== neu.getAttribute("data-mm")) {
      if (neu.hasAttribute("data-mm")) node.setAttribute("data-mm", neu.getAttribute("data-mm"));
    }
    if (node.className !== neu.className) node.className = neu.className;
    if (neu.hasAttribute("aria-pressed")) node.setAttribute("aria-pressed", neu.getAttribute("aria-pressed"));
    if (neu.title) node.title = neu.title;
    if (node.classList.contains("visual-stack")) {
      const oldKids = Array.prototype.slice.call(node.children);
      const newKids = Array.prototype.slice.call(neu.children);
      if (oldKids.length === newKids.length && visualSignature(oldKids) === visualSignature(newKids)) {
        oldKids.forEach(function (kid, i) {
          syncVisualNode(kid, newKids[i]);
        });
        return;
      }
    }
    if (node.innerHTML !== neu.innerHTML) node.innerHTML = neu.innerHTML;
  }

  function setVisualHtml(el, html, bindClicks) {
    const probe = document.createElement("div");
    probe.innerHTML = html;
    const next = Array.prototype.slice.call(probe.children);
    const prev = Array.prototype.slice.call(el.children);
    if (prev.length && prev.length === next.length && visualSignature(prev) === visualSignature(next)) {
      prev.forEach(function (node, i) {
        syncVisualNode(node, next[i]);
      });
      return;
    }
    el.innerHTML = html;
    if (bindClicks) bindProfielClicks(el);
  }

  function mountVisual(gewEl, ongEl, bindClicks) {
    if (!gewEl && !ongEl) return;
    prepareVisualScale();
    const htmlGew = renderProfielHtml(wapeningFund, wapeningOgv, false);
    const htmlOng = renderProfielHtml(false, false, true);

    if (gewEl) {
      gewEl.style.height = "auto";
      gewEl.dataset.totaalMm = String(visualProfielTotaalMm());
      setVisualHtml(gewEl, htmlGew, bindClicks);
    }
    if (ongEl) {
      ongEl.style.height = "auto";
      ongEl.dataset.totaalMm = String(visualProfielTotaalMm());
      setVisualHtml(ongEl, htmlOng, bindClicks);
      const col = ongEl.closest(".visual-col");
      if (col && col.id === "visual-col-ong") col.hidden = !showOngewapend;
    }
    visualKale = false;
    fitMobileVisual(gewEl);
    fitMobileVisual(ongEl);
    updateVisualColLabels(gewEl, ongEl);
  }

  function packageVisualLayers(root) {
    if (!root) return [];
    return Array.prototype.filter.call(root.querySelectorAll(".visual-layer"), function (el) {
      return el.getAttribute("data-id") !== "grond";
    });
  }

  function mmAtVisualY(root, y) {
    const layers = packageVisualLayers(root);
    let consumed = 0;
    for (let i = 0; i < layers.length; i++) {
      const el = layers[i];
      const rect = el.getBoundingClientRect();
      const mm = parseFloat(el.getAttribute("data-mm")) || 0;
      if (y < rect.top) return consumed;
      if (y <= rect.bottom) {
        if (mm <= 0 || rect.height <= 0) return consumed;
        return consumed + ((y - rect.top) / rect.height) * mm;
      }
      consumed += mm;
    }
    return consumed;
  }

  function yForMaaiveld(root, mm) {
    const layers = packageVisualLayers(root);
    const rootRect = root.getBoundingClientRect();
    let consumed = 0;
    let lastBottom = rootRect.top;
    for (let i = 0; i < layers.length; i++) {
      const el = layers[i];
      const rect = el.getBoundingClientRect();
      const layerMm = parseFloat(el.getAttribute("data-mm")) || 0;
      lastBottom = rect.bottom;
      if (layerMm <= 0) {
        if (mm <= consumed) return rect.top;
        continue;
      }
      if (mm <= consumed + layerMm) {
        return rect.top + ((mm - consumed) / layerMm) * rect.height;
      }
      consumed += layerMm;
    }
    return lastBottom;
  }

  function layoutMaaiveld() {
    const visual = document.getElementById("visual-gew");
    const track = document.getElementById("maaiveld-track");
    const thumb = document.getElementById("maaiveld-thumb");
    const mark = document.getElementById("maaiveld-mark");
    const wrap = document.getElementById("visual-wrap");
    const mmEl = document.getElementById("maaiveld-mm");
    if (!visual || !track || !thumb || !mark || !wrap) return;
    const layers = packageVisualLayers(visual);
    if (!layers.length) {
      track.hidden = true;
      mark.hidden = true;
      return;
    }
    track.hidden = false;
    mark.hidden = false;
    const rail = track.parentElement;
    const railRect = rail.getBoundingClientRect();
    const first = layers[0].getBoundingClientRect();
    const last = layers[layers.length - 1].getBoundingClientRect();
    const top = first.top - railRect.top;
    track.style.top = top + "px";
    track.style.height = Math.max(48, last.bottom - first.top) + "px";
    const mm = maaiveldMm();
    const max = Math.round(pakketMeta().totaal);
    const y = yForMaaiveld(visual, mm);
    thumb.style.top = y - railRect.top - top + "px";
    mark.style.top = y - wrap.getBoundingClientRect().top + "px";
    if (mmEl) {
      if (mm <= 0) mmEl.textContent = tx("op de verharding");
      else if (mm >= max) mmEl.textContent = tx("onder het pakket");
      else mmEl.textContent = mm + " mm";
    }
    thumb.setAttribute("aria-valuemin", "0");
    thumb.setAttribute("aria-valuemax", String(max));
    thumb.setAttribute("aria-valuenow", String(mm));
    thumb.setAttribute(
      "aria-valuetext",
      mm <= 0
        ? tx("Maaiveld op de verharding")
        : mm >= max
          ? tx("Maaiveld onder het pakket")
          : mm + " mm " + tx("onder de verharding")
    );
  }

  function scheduleMaaiveldLayout() {
    layoutMaaiveld();
    clearTimeout(scheduleMaaiveldLayout._t);
    scheduleMaaiveldLayout._t = setTimeout(layoutMaaiveld, 400);
  }

  function setMaaiveldMm(mm, snap) {
    const max = Math.max(0, Math.round(pakketMeta().totaal));
    let next = Math.round(Number(mm) || 0);
    if (snap) {
      if (next <= 5) next = 0;
      else if (max - next <= 5) next = max;
      else next = Math.round(next / 10) * 10;
    }
    if (next < 0) next = 0;
    if (next > max) next = max;
    if (values.maaiveldMm === next) {
      layoutMaaiveld();
      return;
    }
    values.maaiveldMm = next;
    renderPakketSummary();
    layoutMaaiveld();
  }

  function bindMaaiveld() {
    const track = document.getElementById("maaiveld-track");
    const thumb = document.getElementById("maaiveld-thumb");
    const visual = document.getElementById("visual-gew");
    if (!track || !visual || track.dataset.bound) return;
    track.dataset.bound = "1";
    function fromClientY(clientY) {
      setMaaiveldMm(mmAtVisualY(visual, clientY), true);
    }
    track.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      track.setPointerCapture(e.pointerId);
      fromClientY(e.clientY);
      e.preventDefault();
    });
    track.addEventListener("pointermove", function (e) {
      if (!track.hasPointerCapture(e.pointerId)) return;
      fromClientY(e.clientY);
    });
    if (!thumb) return;
    thumb.addEventListener("keydown", function (e) {
      const max = Math.round(pakketMeta().totaal);
      const cur = maaiveldMm();
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setMaaiveldMm(Math.min(max, cur + 10), false);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setMaaiveldMm(Math.max(0, cur - 10), false);
      } else if (e.key === "Home") {
        e.preventDefault();
        setMaaiveldMm(0, false);
      } else if (e.key === "End") {
        e.preventDefault();
        setMaaiveldMm(max, false);
      }
    });
  }

  function renderVisual() {
    mountVisual(visualGewEl, visualOngEl, true);
    scheduleMaaiveldLayout();
  }

  function renderExpertVisual() {
    mountVisual(
      document.getElementById("expert-visual-gew"),
      document.getElementById("expert-visual-ong"),
      false
    );
  }

  function renderTableInto(targetTable, options) {
    const opts = options || {};
    const bindClicks = opts.bindClicks !== false;
    const highlightId = opts.highlightId !== undefined ? opts.highlightId : selected;
    if (!targetTable) return;
    const tbody = targetTable.querySelector("tbody");
    if (!tbody) return;

    const p = PRESETS[sheet];
    const f = fundMeta(wapeningFund);
    const fundOng = calcAt(false, wapeningOgv);
    const fundGew = calcAt(true, wapeningOgv);
    const fundNu = calcAt(wapeningFund, wapeningOgv);
    const ogvOng = calcAt(wapeningFund, false);
    const ogvGew = calcAt(wapeningFund, true);

    const bovenL = bovenActieveLaag();
    const rows = [
      {
        id: "boven",
        laag: "Bovenconstructie · " + (bovenL ? bovenL.label : "—"),
        dikte: (bovenTopDikteSum() || "0") + " mm",
        wapMm: "—",
        ong: null,
        gew: null,
        wap: false,
      },
    ];
    if (bovenL && bovenL.id === "asfalt") {
      ASFALT_LAGEN.forEach(function (laag) {
        const mm = asfaltLaagMm(laag);
        if (mm <= 0) return;
        rows.push({
          id: "boven",
          laag: "↳ " + laag.label,
          dikte: String(mm),
          wapMm: "—",
          ong: null,
          gew: null,
          wap: false,
          sub: true,
        });
      });
    }
    if (bovenStraatzandMm() > 0) {
      rows.push({
        id: "boven",
        laag: "↳ " + bovenBeddingLabel(),
        dikte: String(bovenStraatzandMm()),
        wapMm: "—",
        ong: null,
        gew: null,
        wap: false,
        sub: true,
      });
    }
    rows.push({
      id: "onder",
      laag: "Onderconstructie",
      dikte: onderconstructieOmschrijving(),
      wapMm: "—",
      ong: null,
      gew: null,
      wap: wapeningFund || wapeningOgv,
      sub: false,
    });
    rows.push({
      id: "fund",
      laag:
        "↳ " +
        p.labels.fund +
        (materiaalNaamMpaKey("eFundering") ? " · " + materiaalNaamMpaKey("eFundering") : ""),
      dikte: f.basis + " + " + f.oh + " = " + f.dikteTotaal,
      wapMm: wapeningFund && !f.druklaagAan ? f.wapDikte : "—",
      ong: fundOng.output.D13,
      gew: fundGew.output.E13,
      wap: wapeningFund,
      sub: true,
    });
    if (!f.druklaagAan && wapeningFund) {
      fundProfielBanden(f, true).forEach(function (b) {
        rows.push({
          id: "fund",
          laag: "↳ ↳ " + b.name,
          dikte: String(b.mm),
          wapMm: b.gewap ? b.mm : "—",
          ong: null,
          gew: null,
          wap: b.gewap,
          sub: true,
        });
      });
    }
    if (f.druklaagAan) {
      const lichtMat = materiaalMatch("eFundering", MATERIAAL_LAAG);
      rows.push(
        {
          id: "fund-druk",
          laag:
            "↳ ↳ Druklaag · " +
            (materiaalNaamMpa(materiaalMatch("eDruklaag", MATERIAAL_DRUKLAAG), f.eDruk) || "druklaag") +
            " · " +
            (druklaagHasWapening()
              ? (wapeningTypeById(effectiveDrukTypeId(!!wapeningFund)) || {}).product || "E'Grid"
              : "ongewapend"),
          dikte: String(f.drukBasis) + (f.oh > 0 ? " + overhoogte " + f.oh + " ongewapend" : ""),
          wapMm: druklaagHasWapening()
            ? (wapeningTypeById(effectiveDrukTypeId(!!wapeningFund)) || {}).product || "E'Grid"
            : "—",
          ong: f.eDruk,
          gew: druklaagHasWapening() ? fundNu.state.C26 || f.eDruk : f.eDruk,
          wap: druklaagHasWapening(),
          sub: true,
        },
        {
          id: "fund-licht",
          laag:
            "↳ ↳ " +
            (materiaalNaamMpa(lichtMat, f.eLicht) || "Licht") +
            " · " +
            (wapeningFund && lichtHasWapening()
              ? (wapeningTypeById(lichtWapeningTypeId()) || {}).product || "R'Cel"
              : "ongewapend"),
          dikte: String(f.lichtDikte),
          wapMm:
            wapeningFund && lichtHasWapening()
              ? f.lichtSplit
                ? "R'Cel " + f.lichtSplit.cell
                : (wapeningTypeById(lichtWapeningTypeId()) || {}).product || "R'Cel"
              : "—",
          ong: f.eLicht,
          gew: wapeningFund && lichtHasWapening() ? fundGew.state.C27 || f.eLicht : f.eLicht,
          wap: wapeningFund && lichtHasWapening(),
          sub: true,
        }
      );
      if (wapeningFund && f.lichtSplit) {
        cellSplitBands(f.lichtSplit, "", (lichtMat && lichtMat.label) || "").forEach(function (b) {
          rows.push({
            id: "fund-licht",
            laag: "↳ ↳ ↳ " + b.name,
            dikte: String(b.mm),
            wapMm: b.kind === "ong" ? "—" : b.mm,
            ong: null,
            gew: null,
            wap: b.kind !== "ong",
            sub: true,
          });
        });
      }
    }
    rows.push(
      {
        id: "ogv",
        laag: "↳ " + p.labels.ogv + (laagMateriaalNaam("eOgv") ? " · " + laagMateriaalNaam("eOgv") : ""),
        dikte: String(values.ogvDikte),
        wapMm: wapeningOgv ? values.wapOgv : "—",
        ong: ogvOng.output.D14,
        gew: ogvGew.output.E14,
        wap: wapeningOgv,
        sub: true,
      },
      {
        id: "grond",
        laag: "Ondergrond" + (laagMateriaalNaam("eOndergrond") ? " · " + laagMateriaalNaam("eOndergrond") : ""),
        dikte: "—",
        wapMm: "—",
        ong: values.eOndergrond,
        gew: values.eOndergrond,
        wap: false,
      }
    );

    tbody.innerHTML = rows
      .map(function (r) {
        const fac = r.wap ? factor(r.ong, r.gew) : "—";
        const hasE = r.ong != null;
        return (
          '<tr class="table-row' +
          (r.sub ? " table-row--sub" : "") +
          (highlightId === r.id ? " table-row--selected" : "") +
          '" data-id="' +
          r.id +
          '"' +
          (bindClicks ? ' tabindex="0" role="button"' : "") +
          ">" +
          "<td>" +
          r.laag +
          (r.wap ? ' <span class="wap-badge">W</span>' : "") +
          '</td><td class="num">' +
          r.dikte +
          '</td><td class="num">' +
          r.wapMm +
          '</td><td class="num td-ong">' +
          (hasE ? r.ong + " MPa" : "—") +
          '</td><td class="num">' +
          (hasE ? (r.wap ? r.gew : r.ong) + " MPa" : "—") +
          '</td><td class="num factor td-ong">' +
          (r.wap ? fac + "×" : "—") +
          "</td></tr>"
        );
      })
      .join("");

    if (bindClicks) {
      tbody.querySelectorAll(".table-row").forEach(function (row) {
        function pick() {
          selectLayer(row.dataset.id);
        }
        row.addEventListener("click", pick);
        row.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pick();
          }
        });
      });
    }

    const pk = pakketMeta();
    let tfoot = targetTable.querySelector("tfoot");
    if (!tfoot) {
      tfoot = document.createElement("tfoot");
      targetTable.appendChild(tfoot);
    }
    tfoot.innerHTML =
      '<tr class="table-total">' +
      "<td><strong>Totale pakketdikte</strong></td>" +
      '<td class="num" colspan="5">' +
      pk.totaal +
      " mm (" +
      pk.omschrijving +
      ") · diepte onderkant " +
      ogvLabel() +
      "</td></tr>";
  }

  function renderTable() {
    if (tableEl && tableBody) {
      renderTableInto(tableEl, { bindClicks: true, highlightId: selected });
    }
  }

  function expertAllFields() {
    return allFieldsForLayer("boven")
      .concat(FIELDS.fund.dikte)
      .concat(FIELDS.fund.materiaal)
      .concat(FIELDS.fund.druklaag)
      .concat([lichtDikteField()])
      .concat([{ key: "eDruklaag", label: "E-modulus druklaag", unit: "MPa", min: 30, max: 600, step: 5 }])
      .concat(FIELDS.fund.wapening)
      .concat([rcelHoogteField()])
      .concat(FIELDS.ogv.dikte)
      .concat(FIELDS.ogv.materiaal)
      .concat(FIELDS.ogv.wapening)
      .concat(FIELDS.grond.materiaal);
  }

  function expertWapeningToggleHtml(layerId) {
    const on = wapeningForLayer(layerId);
    return (
      '<label class="toggle toggle--panel">' +
      '<input type="checkbox" id="expert-wap-' +
      layerId +
      '" data-expert-wap="' +
      layerId +
      '"' +
      (on ? " checked" : "") +
      " />" +
      '<span class="toggle-ui"></span>' +
      "<span><strong>Romfix-wapening</strong></span>" +
      '<span class="toggle-status">' +
      (on ? "Aan" : "Uit") +
      "</span></label>"
    );
  }

  function expertFunderingModusHtml() {
    const vast = isFunderingVast();
    const bindend = isBindendMateriaal("eFundering") || isBindendMateriaal("eDruklaag");
    return (
      '<div class="field-section">' +
      '<div class="field-section-title">Rekenwijze ongewapende stijfheid</div>' +
      '<div class="expert-modus-btns" role="group" aria-label="Rekenwijze">' +
      '<button type="button" class="expert-modus-btn' +
      (!vast ? " expert-modus-btn--active" : "") +
      '" data-modus="vrij"' +
      (bindend ? " disabled" : "") +
      ">Vrij</button>" +
      '<button type="button" class="expert-modus-btn' +
      (vast ? " expert-modus-btn--active" : "") +
      '" data-modus="vast">Vast</button>' +
      "</div>" +
      '<p class="field-note">' +
      (vast
        ? "Vast: rekenen met de ingevulde ongewapende stijfheid van de (onder)fundering. SIF doet niet mee in de ontwerpberekening."
        : "Vrij: het programma toetst of de ongewapende stijfheid van de (onder)fundering voldoet. Alleen voor ongebonden materialen.") +
      (bindend ? " Bij menggranulaat of zelfbindend materiaal is vrij uitgeschakeld." : "") +
      "</p></div>"
    );
  }

  function expertStiffnessCard(label, ong, gew, wapOn, detail) {
    const fac = wapOn ? factor(ong, gew) : "—";
    const delta = wapOn ? gew - ong : 0;
    const max = Math.max(ong, gew, 1);
    const pctOng = Math.round((ong / max) * 100);
    const pctGew = wapOn ? Math.round((gew / max) * 100) : pctOng;
    return (
      '<div class="expert-stiff-card' +
      (wapOn ? " expert-stiff-card--live" : "") +
      '">' +
      '<div class="expert-stiff-title"><span>' +
      label +
      "</span>" +
      (wapOn ? '<span class="wap-badge">W</span>' : "") +
      "</div>" +
      '<div class="expert-stiff-values">' +
      '<span class="expert-stiff-ong">' +
      ong +
      "</span>" +
      (wapOn
        ? '<span class="expert-stiff-arrow">→</span><span class="expert-stiff-gew">' + gew + "</span>"
        : "") +
      ' <small>MPa</small></div>' +
      '<div class="expert-stiff-meta">' +
      (wapOn
        ? "Winst: <strong>+" +
          delta +
          " MPa</strong> · factor <strong>" +
          fac +
          "×</strong>"
        : "Wapening uit") +
      (detail ? "<br>" + detail : "") +
      "</div>" +
      '<div class="expert-bar-wrap">' +
      '<div class="expert-bar-ong" style="width:' +
      pctOng +
      '%"></div>' +
      (wapOn
        ? '<div class="expert-bar-gew" style="width:' + pctGew + '%"></div>'
        : "") +
      "</div></div>"
    );
  }

  function expertKpiHtml() {
    const f = fundMeta(wapeningFund);
    const fundOng = calcAt(false, wapeningOgv);
    const fundGew = calcAt(true, wapeningOgv);
    const ogvOng = calcAt(wapeningFund, false);
    const ogvGew = calcAt(wapeningFund, true);
    const pk = pakketMeta();
    const m = (pk.totaal / 1000).toFixed(2).replace(".", ",");
    const activeTab =
      (CONSTRUCTIE_TYPES.find(function (c) {
        return c.sheet === sheet;
      }) || {}).tab || "";
    return (
      '<div class="expert-kpi__pakket">' +
      '<span class="expert-kpi__label">Pakket</span>' +
      '<span class="expert-kpi__value">' +
      pk.totaal +
      ' <small>mm</small> <span class="expert-kpi__sub">(' +
      m +
      " m)</span></span>" +
      '<span class="expert-kpi__chip">' +
      activeTab +
      "</span></div>" +
      '<div class="expert-stiffness">' +
      expertStiffnessCard(
        "Fundering (D13→E13)",
        fundOng.output.D13,
        fundGew.output.E13,
        wapeningFund,
        f.dikteTotaal + " mm · wap. " + (wapeningFund ? f.wapDikte : "—") + " mm"
      ) +
      expertStiffnessCard(
        ogvLabel() + " (D14→E14)",
        ogvOng.output.D14,
        ogvGew.output.E14,
        wapeningOgv,
        values.ogvDikte + " mm · wap. " + (wapeningOgv ? values.wapOgv : "—") + " mm"
      ) +
      "</div>"
    );
  }

  function expertCalcRow(label, val, unit) {
    const u = unit ? " " + unit : "";
    return (
      '<div class="expert-calc-row">' +
      '<span class="expert-calc-key">' +
      label +
      '</span><span class="expert-calc-val">' +
      (val == null || val === "" ? "—" : val) +
      u +
      "</span></div>"
    );
  }

  function expertCalcGroup(title, rows) {
    return (
      '<div class="expert-calc-group">' +
      '<div class="expert-calc-group__title">' +
      title +
      "</div>" +
      rows.join("") +
      "</div>"
    );
  }

  function expertCalcPanelHtml() {
    const fundOng = calcAt(false, wapeningOgv);
    const fundGew = calcAt(true, wapeningOgv);
    const ogvOng = calcAt(wapeningFund, false);
    const ogvGew = calcAt(wapeningFund, true);
    const st = fundGew.state;
    const f = fundMeta(wapeningFund);
    return (
      expertCalcGroup("Invoer diktes", [
        expertCalcRow("B12 · boven", st.B12, "mm"),
        expertCalcRow("B13 · fundering", st.B13, "mm"),
        expertCalcRow(
          "Licht fundering",
          isDruklaagActief() ? fundMeta(wapeningFund).lichtDikte + " mm · E " + values.eLichtFundering : "—",
          ""
        ),
        expertCalcRow(
          "Druklaag",
          isDruklaagActief()
            ? fundMeta(wapeningFund).drukBasis + " mm · E " + values.eDruklaag
            : "—",
          ""
        ),
        expertCalcRow("B14 · " + ogvLabel(), st.B14, "mm"),
        expertCalcRow("C19 · totaal", fundGew.output.C19, "mm"),
        expertCalcRow("C20 · totaal + boven", fundGew.output.C20, "mm"),
      ]) +
      expertCalcGroup("Invoer E & wapening", [
        expertCalcRow("C13 · fundering E", st.C13, "MPa"),
        expertCalcRow("C14 · OGV E", st.C14, "MPa"),
        expertCalcRow("C15 · ondergrond E", st.C31, "MPa"),
        expertCalcRow("B19 · fund. wap.", st.B19, "mm"),
        expertCalcRow("B20 · OGV wap.", st.B20, "mm"),
        expertCalcRow("F13 · modus", values.funderingModus, ""),
      ]) +
      expertCalcGroup("Wapening & factoren", [
        expertCalcRow("Fundering — configuratie", wapeningTypeLabel(values.wapTypeFund, "fund"), ""),
        expertCalcRow(
          "Licht — configuratie",
          isDruklaagActief() ? wapeningTypeLabel(lichtWapeningTypeId(), "fund-licht") : "—",
          ""
        ),
        expertCalcRow("OGV — configuratie", wapeningTypeLabel(values.wapTypeOgv, "ogv"), ""),
        expertCalcRow("D19 · " + SIF_NAME + " (SIF)", formatFactor(values.sifFundering), ""),
        expertCalcRow(
          "Licht SIF",
          isDruklaagActief() ? formatFactor(values.sifLicht) : "—",
          ""
        ),
        expertCalcRow("D20 · " + SIF_NAME + " (SIF)", formatFactor(values.sifOgv), ""),
        expertCalcRow("E19 · " + MIF_NAME + " (MIF)", values.mifFundering, ""),
        expertCalcRow("E20 · " + MIF_NAME + " (MIF)", values.mifOgv, ""),
        expertCalcRow(
          MIF_NAME + " — tabel (fund.)",
          mifLookupMeta.fund ? mifLookupMeta.fund.tabel : "—",
          ""
        ),
        expertCalcRow(
          MIF_NAME + " — as onderbouw × E In (fund.)",
          mifLookupMeta.fund
            ? mifLookupMeta.fund.eOnderbouw + " × " + mifLookupMeta.fund.eInfill + " MPa"
            : "—",
          ""
        ),
        expertCalcRow(
          MIF_NAME + " — tabel (OGV)",
          mifLookupMeta.ogv ? mifLookupMeta.ogv.tabel : "—",
          ""
        ),
        expertCalcRow(
          MIF_NAME + " — as onderbouw × E In (OGV)",
          mifLookupMeta.ogv
            ? mifLookupMeta.ogv.eOnderbouw + " × " + mifLookupMeta.ogv.eInfill + " MPa"
            : "—",
          ""
        ),
      ]) +
      expertCalcGroup("Fundering zones (mm)", [
        expertCalcRow("B25 ongew.", Math.round(st.B25), "mm"),
        expertCalcRow("B26 gewap.", Math.round(st.B26), "mm"),
        expertCalcRow("R'Cel", f.fundSplit ? f.fundSplit.cell : f.lichtSplit ? f.lichtSplit.cell : "—", "mm"),
        expertCalcRow("vulling gewap.", f.fundSplit ? f.fundSplit.fillGew : f.lichtSplit ? f.lichtSplit.fillGew : f.ohGew, "mm"),
        expertCalcRow("ongew. boven", f.fundSplit ? f.fundSplit.fillOng : f.lichtSplit ? f.lichtSplit.fillOng : f.ohOng, "mm"),
      ]) +
      expertCalcGroup("Equivalente E — fundering", [
        expertCalcRow("D13 zonder wap.", fundOng.output.D13, "MPa"),
        expertCalcRow("E13 met wap.", fundGew.output.E13, "MPa"),
        expertCalcRow("E25 gewap. keten", Math.round(st.E25), "MPa"),
        expertCalcRow("C26 gewap. zone", Math.round(st.C26), "MPa"),
        expertCalcRow("D46 ongew. onder", Math.round(st.D46), "MPa"),
        expertCalcRow("E46 ongew. boven", Math.round(st.E46), "MPa"),
      ]) +
      expertCalcGroup("OGV-keten & output", [
        expertCalcRow("F46 · Austroads", Math.round(st.F46), "MPa"),
        expertCalcRow("D54 · Thenn", Math.round(st.D54), "MPa"),
        expertCalcRow("F67 · Palmer", (Math.round(st.F67 * 1000) / 1000).toFixed(3), ""),
        expertCalcRow("D28 · gewap. OGV", Math.round(st.D28), "MPa"),
        expertCalcRow("E28 · met wap.", Math.round(st.E28), "MPa"),
        expertCalcRow("D14 zonder wap.", ogvOng.output.D14, "MPa"),
        expertCalcRow("E14 met wap.", ogvGew.output.E14, "MPa"),
      ])
    );
  }

  function expertSliderCard(title, sub, body, layerId) {
    return (
      '<section class="expert-card" data-expert-layer="' +
      (layerId || "") +
      '">' +
      '<div class="expert-card-title">' +
      title +
      "</div>" +
      '<div class="expert-card-sub">' +
      sub +
      "</div>" +
      body +
      "</section>"
    );
  }

  function renderExpertDashboard() {
    if (!expertDashboardEl) return;
    const p = PRESETS[sheet];
    const f = fundMeta(wapeningFund);

    expertDashboardEl.innerHTML =
      '<div class="expert-layout">' +
      '<header class="expert-top">' +
      '<div class="expert-dash-head">' +
      "<h2>Expert dashboard</h2>" +
      "<p>Alle parameters live — profiel, stijfheid en Excel-keten werken direct mee.</p>" +
      expertSheetTabsHtml() +
      "</div>" +
      '<div id="expert-kpi" class="expert-kpi"></div>' +
      "</header>" +
      '<div class="expert-main">' +
      '<section class="expert-panel expert-panel--visual">' +
      '<h3 class="expert-panel__title">Live profiel</h3>' +
      '<p class="expert-panel__sub">Gewapend vs ongewapend · zelfde diktes</p>' +
      '<div class="visual-compare expert-visual-compare">' +
      '<div class="visual-col visual-col--gew">' +
      '<p class="visual-col-label">Gewapend</p>' +
      '<div class="visual" id="expert-visual-gew"></div></div>' +
      '<div class="visual-col visual-col--ong">' +
      '<p class="visual-col-label">Ongewapend</p>' +
      '<div class="visual" id="expert-visual-ong"></div></div></div></section>' +
      '<section class="expert-panel expert-panel--sliders">' +
      '<h3 class="expert-panel__title">Parameters</h3>' +
      '<p class="expert-panel__sub">Diktes, materialen, ' +
      SIF_NAME +
      " (SIF) / " +
      MIF_NAME +
      " (MIF) en wapening</p>" +
      '<div class="expert-slider-grid">' +
      expertSliderCard(
        "Bovenconstructie",
        "E≈" + BOVEN_E_EQUIVALENT + " MPa (vast) · " + bovenOmschrijving(),
        bovenLagenSectionHtml(),
        "boven"
      ) +
      expertSliderCard(
        "Fundering + overhoogte",
        p.labels.fund +
          " · totaal " +
          f.dikteTotaal +
          " mm" +
          (f.druklaagAan ? " · licht " + f.lichtDikte + " + druk " + f.drukBasis : ""),
        sectionHtml("Dikte", FIELDS.fund.dikte, false) +
          (f.druklaagAan ? lichtDrukDikteSectionHtml() : "") +
          (f.druklaagAan
            ? '<div data-expert-wap-section="fund">' +
              expertWapeningToggleHtml("fund") +
              lichtDrukWapeningHtml(!wapeningFund, { includeToggle: false }) +
              "</div>"
            : '<div class="field-section" data-expert-wap-section="fund">' +
              '<div class="field-section-title">Wapening</div>' +
              expertWapeningToggleHtml("fund") +
              wapeningTypeHtml("fund", !wapeningFund) +
              "</div>") +
          (f.druklaagAan
            ? lichtDrukMateriaalHtml()
            : materiaalSectionHtml(FIELDS.fund.materiaal, "fund")) +
          expertFunderingModusHtml() +
          funderingEwHtml() +
          '<div class="field-section">' +
          '<div class="field-section-title">MIF en werkingsdikte</div>' +
          mifDisplayHtml("fund", !wapeningFund) +
          (f.druklaagAan
            ? ""
            : wapeningFieldsExceptSif("fund")
                .map(function (fld) {
                  return fieldHtml(fld, !wapeningFund);
                })
                .join("")) +
          "</div>",
        "fund"
      ) +
      expertSliderCard(
        ogvLabel(),
        p.labels.ogv + " · " + values.ogvDikte + " mm",
        '<div class="field-section" data-expert-wap-section="ogv">' +
          '<div class="field-section-title">Wapening</div>' +
          expertWapeningToggleHtml("ogv") +
          wapeningTypeHtml("ogv", !wapeningOgv) +
          "</div>" +
          sectionHtml("Dikte", FIELDS.ogv.dikte, false) +
          materiaalSectionHtml(FIELDS.ogv.materiaal, "ogv") +
          '<div class="field-section">' +
          '<div class="field-section-title">MIF en werkingsdikte</div>' +
          mifDisplayHtml("ogv", !wapeningOgv) +
          wapeningFieldsExceptSif("ogv")
            .map(function (fld) {
              return fieldHtml(fld, !wapeningOgv);
            })
            .join("") +
          "</div>",
        "ogv"
      ) +
      expertSliderCard(
        "Ondergrond & constructie",
        "E-ondergrond + Capping / RoadBase",
        materiaalSectionHtml(FIELDS.grond.materiaal) +
          '<div id="expert-grond-extra"></div>' +
          constructieSectionHtml(),
        "grond"
      ) +
      "</div></section></div>" +
      '<section class="expert-panel expert-panel--calc">' +
      "<details>" +
      '<summary class="expert-panel__title">Tussenstappen (alleen voor controle)</summary>' +
      '<p class="expert-panel__sub">Celverwijzingen voor eigenaar/ontwikkelaar — niet nodig voor de gebruiker.</p>' +
      '<div id="expert-calc-live" class="expert-calc-grid"></div></details></section>' +
      '<section class="expert-panel expert-panel--table">' +
      '<h3 class="expert-panel__title">Stijfheidstabel</h3>' +
      '<div class="table-wrap"><table class="table" id="expert-table">' +
      "<thead><tr>" +
      "<th>Laag</th>" +
      '<th class="num">Dikte (mm)</th>' +
      '<th class="num">Wap. (mm)</th>' +
      '<th class="num">Zonder wapening</th>' +
      '<th class="num">Met wapening</th>' +
      '<th class="num">Factor</th>' +
      "</tr></thead><tbody></tbody><tfoot></tfoot></table></div></section></div>";

    expertDashBuilt = true;
    bindExpertDashboardEvents();
    refreshExpertLive();
  }

  function syncExpertFieldDisplays() {
    if (!expertDashboardEl) return;
    expertAllFields().forEach(function (fld) {
      const valEl = document.getElementById("v-" + fld.key);
      const slider = document.getElementById("f-" + fld.key);
      if (valEl) valEl.textContent = values[fld.key] + " " + fld.unit;
      if (slider) slider.value = values[fld.key];
    });
    ["fund", "ogv"].forEach(function (layer) {
      const on = wapeningForLayer(layer);
      const section = expertDashboardEl.querySelector('[data-expert-wap-section="' + layer + '"]');
      if (!section) return;
      section.querySelectorAll(".field").forEach(function (fieldEl) {
        if (fieldEl.querySelector("[data-expert-wap]")) return;
        if (fieldEl.closest("[data-druklaag-onafhankelijk]")) return;
        fieldEl.classList.toggle("field--disabled", !on);
        fieldEl.querySelectorAll("input, select").forEach(function (inp) {
          inp.disabled = !on;
        });
      });
      const toggle = section.querySelector("[data-expert-wap]");
      if (toggle) toggle.checked = on;
      const status = section.querySelector(".toggle-status");
      if (status) status.textContent = on ? "Aan" : "Uit";
    });
    expertDashboardEl.querySelectorAll(".expert-modus-btn").forEach(function (btn) {
      const vast = isFunderingVast();
      const active = (btn.dataset.modus === "vast" && vast) || (btn.dataset.modus === "vrij" && !vast);
      btn.classList.toggle("expert-modus-btn--active", active);
    });
    const constructieEl = document.getElementById("constructie-type");
    if (constructieEl) constructieEl.value = values.constructieType;
    ["fund", "ogv", "fund-licht", "druklaag"].forEach(function (layer) {
      const sel = document.getElementById("wap-type-" + layer);
      const note = document.getElementById("wap-type-note-" + layer);
      const typeKey = wapeningTypeKey(layer);
      const sifKey = sifKeyForLayer(layer);
      const allowed = wapeningTypesForLayer(layer);
      const curType = normalizeWapeningId(
        layer === "druklaag"
          ? effectiveDrukTypeId(!!wapeningFund)
          : layer === "fund" && isDruklaagActief()
            ? WAPENING_DRUKLAAG_TYPE
            : layer === "fund-licht"
              ? lichtWapeningTypeId()
              : values[typeKey] || WAPENING_TYPE_DEFAULT
      );
      const cur = wapeningTypeById(curType);
      if (sel) {
        sel.innerHTML = allowed
          .map(function (t) {
            return (
              '<option value="' +
              t.id +
              '"' +
              (curType === t.id ? " selected" : "") +
              ">" +
              (layer === "druklaag" ? druklaagOptieLabel(t) : wapeningOptionLabel(t, false, layer)) +
              "</option>"
            );
          })
          .join("");
        sel.value = curType;
        sel.disabled =
          layer === "druklaag"
            ? false
            : allowed.length === 1 ||
              (layer === "fund" && !wapeningFund) ||
              (layer === "ogv" && !wapeningOgv) ||
              (layer === "fund-licht" && !wapeningFund);
      }
      if (note) {
        note.innerHTML =
          sifFieldLabel(layer) +
          ': <strong>' +
          formatFactor(layer === "druklaag" ? (cur && cur.sif) || 0 : values[sifKey]) +
          "</strong>" +
          (cur ? " · " + (layer === "druklaag" ? druklaagOptieLabel(cur) : cur.product) : "");
      }
    });
    renderSheetTabs();
    refreshMifDisplays();
  }

  function refreshExpertFundNote() {
    if (!expertDashboardEl || !wapeningFund) return;
    const wapField = expertDashboardEl.querySelector('[data-key="wapFundering"]');
    if (!wapField) return;
    const note = wapField.closest(".field");
    if (!note) return;
    const fmeta = fundMeta(true);
    const html =
      '<p class="field-note">Werkingsdikte = ' +
      values.wapFundering +
      " + " +
      WAP_FUNDERING_WERKING_EXTRA +
      " = <strong>" +
      fmeta.wapDikte +
      " mm</strong> (max. " +
      fmeta.dikteTotaal +
      " mm).</p>";
    const oldNote = note.querySelector(".field-note");
    if (oldNote) oldNote.outerHTML = html;
    else note.insertAdjacentHTML("beforeend", html);
  }

  function renderExpertTable() {
    renderTableInto(document.getElementById("expert-table"), {
      bindClicks: false,
      highlightId: null,
    });
  }

  function syncExpertCardSubs() {
    if (!expertDashboardEl) return;
    const p = PRESETS[sheet];
    const f = fundMeta(wapeningFund);
    const subs = {
      boven: "E≈" + BOVEN_E_EQUIVALENT + " MPa (vast) · " + bovenOmschrijving(),
      fund: p.labels.fund + " · totaal " + f.dikteTotaal + " mm",
      ogv: p.labels.ogv + " · " + values.ogvDikte + " mm",
    };
    expertDashboardEl.querySelectorAll("[data-expert-layer]").forEach(function (card) {
      const sub = card.querySelector(".expert-card-sub");
      const key = card.dataset.expertLayer;
      if (sub && subs[key]) sub.textContent = subs[key];
    });
  }

  function refreshExpertLive() {
    if (!expertDashboardEl || !expertMode) return;
    syncMifFromWapening();
    invalidateCalcCache();
    const kpi = document.getElementById("expert-kpi");
    if (kpi) kpi.innerHTML = expertKpiHtml();
    const calc = document.getElementById("expert-calc-live");
    if (calc) calc.innerHTML = expertCalcPanelHtml();
    const grondExtra = document.getElementById("expert-grond-extra");
    if (grondExtra) grondExtra.innerHTML = grondPanelExtra();
    syncExpertFieldDisplays();
    syncExpertCardSubs();
    refreshExpertFundNote();
    syncMateriaalEquivalentNotes(expertDashboardEl);
    renderExpertVisual();
    renderExpertTable();
  }

  function bindExpertDashboardEvents() {
    if (!expertDashboardEl || expertEventsBound) return;
    expertEventsBound = true;

    expertDashboardEl.addEventListener("click", function (e) {
      const tab = e.target.closest(".expert-sheet-tab");
      if (tab && tab.dataset.sheet) {
        switchExpertSheet(tab.dataset.sheet);
        return;
      }
      const modus = e.target.closest("[data-modus]");
      if (modus) {
        if (modus.disabled) return;
        if (isBindendMateriaal("eFundering") || isBindendMateriaal("eDruklaag")) {
          values.funderingModus = "vast";
        } else {
          values.funderingModus = modus.dataset.modus === "vast" ? "vast" : "vrij";
        }
        expertDashBuilt = false;
        render();
      }
    });

    expertDashboardEl.addEventListener("change", function (e) {
      const el = e.target;
      if (el.matches("[data-expert-wap]")) {
        if (el.dataset.expertWap === "fund") wapeningFund = el.checked;
        if (el.dataset.expertWap === "ogv") wapeningOgv = el.checked;
        syncMifFromWapening();
        refreshExpertLive();
        return;
      }
      if (el.id === "constructie-type") {
        values.constructieType = el.value;
        syncBovenDikte();
        syncSheetFromInvoer();
        expertDashBuilt = false;
        render();
        return;
      }
      if (el.matches("[data-boven-toplaag]")) {
        values.bovenToplaag = el.value;
        if (el.value === "klinkers") {
          if (!values.bovenBedding) values.bovenBedding = BOVEN_BEDDING_DEFAULT;
          if (!(values.bovenStraatzand > 0)) values.bovenStraatzand = BOVEN_STRAATZAND.defaultMm;
        }
        if (el.value === "asfalt" && asfaltSum() <= 0) vulAsfaltDefaults();
        syncBovenDikte();
        expertDashBuilt = false;
        render();
        return;
      }
      if (el.matches("[data-boven-bedding]")) {
        values.bovenBedding = el.value;
        refreshExpertLive();
        return;
      }
      if (el.matches("[data-wap-keuze]") && el.dataset.key) {
        applyFieldValue(el.dataset.key, el.value, expertAllFields());
        return;
      }
      if (el.matches(".wapening-type-select") && el.dataset.layer) {
        applyWapeningType(el.dataset.layer, el.value);
        return;
      }
      if (el.matches(".exit-licht-fundering")) {
        exitLichtFundering();
        return;
      }
      if (el.matches(".materiaal-select") && el.dataset.key && el.value) {
        handleMateriaalSelectChange(el.dataset.key, el.value, expertAllFields());
      }
    });

    expertDashboardEl.addEventListener("input", function (e) {
      const el = e.target;
      if (el.matches('input[type="range"]') && !el.disabled && el.dataset.key) {
        applyFieldValue(el.dataset.key, el.value, expertAllFields());
      }
    });

    expertDashboardEl.addEventListener("focusin", function (e) {
      if (e.target && e.target.matches && e.target.matches('input[type="range"]')) {
        rememberRangeFocus(e.target);
      }
    });

    expertDashboardEl.addEventListener("keydown", function (e) {
      const el = e.target;
      if (!el || !el.matches || !el.matches('input[type="range"]') || el.disabled) return;
      if (!nudgeRangeInput(el, e.key)) return;
      e.preventDefault();
      if (el.dataset.key) applyFieldValue(el.dataset.key, el.value, expertAllFields());
    });
  }

  function expertAuthenticated() {
    return sessionStorage.getItem(EXPERT_SESSION_KEY) === "1";
  }

  function showExpertLogin() {
    if (!expertLoginEl) return;
    expertLoginEl.hidden = false;
    if (expertLoginErrorEl) expertLoginErrorEl.hidden = true;
    if (expertPasswordEl) {
      expertPasswordEl.value = "";
      expertPasswordEl.focus();
    }
  }

  function hideExpertLogin() {
    if (expertLoginEl) expertLoginEl.hidden = true;
    if (expertLoginErrorEl) expertLoginErrorEl.hidden = true;
  }

  function submitExpertLogin() {
    if (!expertPasswordEl) return;
    const password = expertPasswordEl.value;
    fetch("/api/expert-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("auth");
        sessionStorage.setItem(EXPERT_SESSION_KEY, "1");
        hideExpertLogin();
        setExpertMode(true);
      })
      .catch(function () {
        if (expertLoginErrorEl) expertLoginErrorEl.hidden = false;
      });
  }

  function setExpertMode(on) {
    expertMode = !!on;
    expertDashBuilt = false;
    expertEventsBound = false;
    if (!expertMode) {
      ensureStandardSheet();
    }
    document.body.classList.toggle("expert-mode", expertMode);
    if (expertToggleEl) {
      expertToggleEl.setAttribute("aria-pressed", expertMode ? "true" : "false");
      expertToggleEl.textContent = expertMode ? tx("Standaard modus") : tx("Expert mode");
    }
    if (expertDashboardEl) expertDashboardEl.hidden = !expertMode;
    if (standardViewEl) standardViewEl.hidden = expertMode;
    render();
  }

  function requestExpertMode() {
    if (expertMode) {
      setExpertMode(false);
      return;
    }
    if (expertAuthenticated()) {
      setExpertMode(true);
      return;
    }
    showExpertLogin();
  }

  function render() {
    syncSheetFromInvoer();
    normalizeMateriaalKeuzeAliases();
    migrateLightFillToOndergrond();
    syncFunderingModusVanMateriaal();
    syncDruklaagFromFundering();
    syncMifFromWapening();
    invalidateCalcCache();
    if (expertMode) {
      if (!expertDashBuilt) {
        renderExpertDashboard();
      } else {
        refreshExpertLive();
      }
      applyI18n();
      return;
    }
    expertDashBuilt = false;
    markVisited(selected);
    syncOngewapendUi();
    renderPakketSummary();
    renderTable();
    renderLayerTabs();
    renderVisual();
    renderPanel();
    applyI18n();
    syncStapJump();
  }

  function syncStapJump() {
    document.querySelectorAll(".stap-jump").forEach(function (btn) {
      const stap = btn.getAttribute("data-stap");
      const on =
        stap === selected ||
        (stap === "fund" &&
          (selected === "fund-licht" || selected === "fund-druk" || selected === "onder"));
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  if (expertToggleEl) {
    expertToggleEl.addEventListener("click", requestExpertMode);
  }

  if (expertLoginSubmitEl) {
    expertLoginSubmitEl.addEventListener("click", submitExpertLogin);
  }

  if (expertLoginCancelEl) {
    expertLoginCancelEl.addEventListener("click", hideExpertLogin);
  }

  if (expertPasswordEl) {
    expertPasswordEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter") submitExpertLogin();
      if (e.key === "Escape") hideExpertLogin();
    });
  }

  if (expertLoginEl) {
    expertLoginEl.addEventListener("click", function (e) {
      if (e.target === expertLoginEl) hideExpertLogin();
    });
  }

  function setTableOpen(open) {
    if (!tableWrapEl || !tableToggleEl) return;
    tableWrapEl.hidden = !open;
    tableToggleEl.setAttribute("aria-expanded", open ? "true" : "false");
    tableToggleEl.textContent = open ? tx("Inklappen") : tx("Uitklappen");
  }

  if (tableToggleEl) {
    tableToggleEl.addEventListener("click", function () {
      setTableOpen(tableWrapEl && tableWrapEl.hidden);
    });
  }

  const ongewapendToggleEl = document.getElementById("toggle-ongewapend");
  if (ongewapendToggleEl) {
    ongewapendToggleEl.addEventListener("change", function () {
      showOngewapend = !!ongewapendToggleEl.checked;
      syncOngewapendUi();
      renderVisual();
      renderTable();
      applyI18n();
    });
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      renderVisual();
      if (expertMode) renderExpertVisual();
      applyI18n();
    }, 150);
  });

  function projectNaam() {
    const el = document.getElementById("project_naam");
    return el && el.value.trim() ? el.value.trim() : "";
  }

  function setShareStatus(text) {
    const el = document.getElementById("shareStatus");
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
  }

  function numOr(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? String(n) : String(fallback == null ? "" : fallback);
  }

  function compactState() {
    const v = values || {};
    const mk = materiaalKeuze || {};
    return [
      "1",
      sheet || "roadbase",
      wapeningFund ? "1" : "0",
      wapeningOgv ? "1" : "0",
      v.constructieType || "",
      v.bovenToplaag || "",
      numOr(v.bovenKlinkers, 0),
      numOr(v.bovenAsfalt, 0),
      numOr(v.bovenBeton, 0),
      numOr(v.bovenStraatzand, 0),
      numOr(v.funderingBasis, 0),
      numOr(v.overhoogte, 0),
      numOr(v.ogvDikte, 0),
      numOr(v.eFundering, 0),
      numOr(v.eOgv, 0),
      numOr(v.eOndergrond, 0),
      numOr(v.wapFundering, 0),
      numOr(v.wapOgv, 0),
      numOr(v.sifFundering, 0),
      numOr(v.sifOgv, 0),
      v.wapTypeFund || "",
      v.wapTypeOgv || "",
      v.druklaagAan ? "1" : "0",
      numOr(v.druklaagDikte, 0),
      numOr(v.eDruklaag, 0),
      mk.eFundering || "",
      mk.eOgv || "",
      mk.eOndergrond || "",
      projectNaam().replace(/\|/g, "/"),
      v.wapTypeLicht || "",
      numOr(v.sifLicht, 0),
      showOngewapend ? "1" : "0",
      numOr(v.rcelHoogte, RCEL_HOOGTE_DEFAULT),
      bovenBeddingId(),
      v.funderingModus || "vrij",
      mk.eDruklaag || "",
      numOr(asfaltLaagMm(ASFALT_LAGEN[0]), 0),
      numOr(asfaltLaagMm(ASFALT_LAGEN[1]), 0),
      numOr(asfaltLaagMm(ASFALT_LAGEN[2]), 0),
      numOr(v.maaiveldMm, 0),
      v.drukWapVrij ? "1" : "0",
    ].join("|");
  }

  function applyCompact(raw) {
    const p = raw.split("|");
    if (p[0] !== "1" || p.length < 25) return false;
    sheet = p[1] === "capping" ? "capping" : "roadbase";
    wapeningFund = p[2] === "1";
    wapeningOgv = p[3] === "1";
    values.constructieType = p[4] || values.constructieType;
    values.bovenToplaag = p[5] || values.bovenToplaag;
    values.bovenKlinkers = Number(p[6]) || 0;
    values.bovenAsfalt = Number(p[7]) || 0;
    values.bovenBeton = Number(p[8]) || 0;
    values.bovenStraatzand = Number(p[9]) || 0;
    values.funderingBasis = Number(p[10]) || 0;
    values.overhoogte = Number(p[11]) || 0;
    values.ogvDikte = Number(p[12]) || 0;
    values.eFundering = Number(p[13]) || 0;
    values.eOgv = Number(p[14]) || 0;
    values.eOndergrond = Number(p[15]) || 0;
    values.wapFundering = normalizeWapFundering(Number(p[16]) || 0);
    values.wapOgv = Number(p[17]) || 0;
    values.sifFundering = Number(p[18]) || 0;
    values.sifOgv = Number(p[19]) || 0;
    values.wapTypeFund = p[20] || values.wapTypeFund;
    values.wapTypeOgv = p[21] || values.wapTypeOgv;
    values.druklaagAan = p[22] === "1";
    values.druklaagDikte = Number(p[23]) || 0;
    values.eDruklaag = Number(p[24]) || 0;
    materiaalKeuze = {
      eFundering: p[25] || "",
      eOgv: p[26] || "",
      eOndergrond: p[27] || "",
      eDruklaag: p[35] || "",
    };
    if (p[28]) {
      const el = document.getElementById("project_naam");
      if (el) el.value = p[28];
    }
    if (p[29]) values.wapTypeLicht = normalizeWapeningId(p[29]);
    if (p[30] !== undefined && p[30] !== "") values.sifLicht = Number(p[30]) || values.sifLicht;
    if (p[31] === "1") {
      showOngewapend = true;
      visitedGroups.grond = visitedGroups.ogv = visitedGroups.fund = visitedGroups.boven = true;
    }
    if (p[32] !== undefined && p[32] !== "") {
      const h = Number(p[32]);
      values.rcelHoogte = RCEL_HOOGTE_KEUZES.indexOf(h) >= 0 ? h : RCEL_HOOGTE_DEFAULT;
    } else if (values.rcelHoogte == null) {
      values.rcelHoogte = RCEL_HOOGTE_DEFAULT;
    }
    if (p[33]) {
      values.bovenBedding = BOVEN_BEDDING.some(function (b) {
        return b.id === p[33];
      })
        ? p[33]
        : BOVEN_BEDDING_DEFAULT;
    } else if (!values.bovenBedding) {
      values.bovenBedding = BOVEN_BEDDING_DEFAULT;
    }
    if (p[34]) {
      const modus = String(p[34]).trim().toLowerCase();
      values.funderingModus = modus === "vast" || modus === "< vast" ? "vast" : "vrij";
    }
    if (p.length > 36 && p[36] !== "") {
      values.bovenAsfaltDek = Number(p[36]) || 0;
      values.bovenAsfaltTussen = Number(p[37]) || 0;
      values.bovenAsfaltOnder = Number(p[38]) || 0;
      syncAsfaltTotal();
    } else if (values.bovenToplaag === "asfalt") {
      splitAsfaltTotal(values.bovenAsfalt);
    }
    if (p.length > 39 && p[39] !== "") values.maaiveldMm = Number(p[39]) || 0;
    else if (values.maaiveldMm == null) values.maaiveldMm = 0;
    values.drukWapVrij = p.length > 40 && p[40] === "1";
    syncBovenDikte();
    syncFunderingModusVanMateriaal();
    visitedGroups.grond = true;
    visitedGroups.ogv = true;
    visitedGroups.fund = true;
    visitedGroups.boven = true;
    return true;
  }

  function applyState(st) {
    if (!st || typeof st !== "object") return;
    if (st.sheet) sheet = st.sheet;
    if (typeof st.wapeningFund === "boolean") wapeningFund = st.wapeningFund;
    if (typeof st.wapeningOgv === "boolean") wapeningOgv = st.wapeningOgv;
    if (st.materiaalKeuze) materiaalKeuze = st.materiaalKeuze;
    if (st.values) values = Object.assign({}, values, st.values);
    if (values.bovenToplaag === "asfalt" && values.bovenAsfaltDek == null) {
      splitAsfaltTotal(values.bovenAsfalt);
    }
    syncBovenDikte();
    if (st.project) {
      const el = document.getElementById("project_naam");
      if (el) el.value = st.project;
    }
  }

  var SHARE_B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  var SHARE_TOP = ["klinkers", "asfalt", "beton"];
  var SHARE_BED = ["straatzand", "drainagemortel", "split"];
  var SHARE_WAP = ["none", "grid_only", "cell_only", "grid_cell"];

  function shareBitWriter() {
    return {
      n: 0,
      bits: 0,
      out: [],
      write: function (val, width) {
        var mask = width >= 31 ? 0x7fffffff : (1 << width) - 1;
        this.n = (this.n << width) | (val & mask);
        this.bits += width;
        while (this.bits >= 8) {
          this.bits -= 8;
          this.out.push((this.n >> this.bits) & 255);
          this.n &= (1 << this.bits) - 1;
        }
      },
      bytes: function () {
        if (this.bits) this.out.push((this.n << (8 - this.bits)) & 255);
        return this.out;
      },
    };
  }

  function shareBitReader(bytes) {
    return {
      bytes: bytes,
      i: 0,
      n: 0,
      bits: 0,
      read: function (width) {
        while (this.bits < width) {
          var b = this.i < this.bytes.length ? this.bytes[this.i++] : 0;
          this.n = (this.n << 8) | b;
          this.bits += 8;
        }
        this.bits -= width;
        var mask = width >= 31 ? 0x7fffffff : (1 << width) - 1;
        var val = (this.n >> this.bits) & mask;
        this.n &= (1 << this.bits) - 1;
        return val;
      },
    };
  }

  function shareBytesToToken(bytes) {
    var n = 0;
    var bits = 0;
    var out = "";
    for (var i = 0; i < bytes.length; i++) {
      n = (n << 8) | bytes[i];
      bits += 8;
      while (bits >= 6) {
        bits -= 6;
        out += SHARE_B64[(n >> bits) & 63];
      }
    }
    if (bits) out += SHARE_B64[(n << (6 - bits)) & 63];
    return out;
  }

  function shareTokenToBytes(token) {
    var n = 0;
    var bits = 0;
    var out = [];
    for (var i = 0; i < token.length; i++) {
      var v = SHARE_B64.indexOf(token.charAt(i));
      if (v < 0) return null;
      n = (n << 6) | v;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out.push((n >> bits) & 255);
      }
    }
    return out;
  }

  function shareMatIndex(list, label) {
    if (!label) return 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].label === label) return i + 1;
    }
    return 0;
  }

  function shareMatLabel(list, idx) {
    if (!idx || idx > list.length) return "";
    return list[idx - 1].label;
  }

  function shareIdx(list, id, fallback) {
    var i = list.indexOf(id);
    return i >= 0 ? i : fallback;
  }

  function shareU16(n) {
    n = Math.round(Number(n) || 0);
    if (n < 0) return 0;
    if (n > 65535) return 65535;
    return n;
  }

  function packShareToken() {
    var v = values || {};
    var mk = materiaalKeuze || {};
    var w = shareBitWriter();
    var naam = projectNaam().slice(0, 80);
    var naamBytes = [];
    try {
      naamBytes = Array.prototype.slice.call(new TextEncoder().encode(naam));
    } catch (e) {
      naamBytes = [];
    }
    if (naamBytes.length > 180) naamBytes = naamBytes.slice(0, 180);
    w.write(4, 4);
    w.write(sheet === "capping" ? 1 : 0, 1);
    w.write(wapeningFund ? 1 : 0, 1);
    w.write(wapeningOgv ? 1 : 0, 1);
    w.write(v.druklaagAan ? 1 : 0, 1);
    w.write(showOngewapend ? 1 : 0, 1);
    w.write(String(v.funderingModus || "").toLowerCase().indexOf("vast") >= 0 ? 1 : 0, 1);
    w.write(shareIdx(SHARE_TOP, v.bovenToplaag, 2), 2);
    w.write(shareIdx(SHARE_BED, bovenBeddingId(), 0), 2);
    w.write(shareIdx(RCEL_HOOGTE_KEUZES, Number(v.rcelHoogte) || RCEL_HOOGTE_DEFAULT, 1), 2);
    w.write(shareIdx(SHARE_WAP, normalizeWapeningId(v.wapTypeFund || WAPENING_TYPE_DEFAULT), 3), 2);
    w.write(shareIdx(SHARE_WAP, normalizeWapeningId(v.wapTypeOgv || WAPENING_TYPE_DEFAULT), 3), 2);
    w.write(shareIdx(SHARE_WAP, normalizeWapeningId(v.wapTypeLicht || "none"), 0), 2);
    w.write(shareMatIndex(MATERIAAL_LAAG, mk.eFundering), 4);
    w.write(shareMatIndex(MATERIAAL_ALLE, mk.eOgv), 4);
    w.write(shareMatIndex(MATERIAAL_ALLE, mk.eOndergrond), 4);
    w.write(shareMatIndex(MATERIAAL_DRUKLAAG, mk.eDruklaag), 4);
    [
      v.bovenKlinkers,
      v.bovenAsfalt,
      v.bovenBeton,
      v.bovenStraatzand,
      v.funderingBasis,
      v.overhoogte,
      v.ogvDikte,
      v.eFundering,
      v.eOgv,
      v.eOndergrond,
      v.eDruklaag,
      v.druklaagDikte,
      v.wapFundering,
      v.wapOgv,
      Math.round((Number(v.sifFundering) || 0) * 10),
      Math.round((Number(v.sifOgv) || 0) * 10),
      Math.round((Number(v.sifLicht) || 0) * 10),
    ].forEach(function (num) {
      w.write(shareU16(num), 16);
    });
    ASFALT_LAGEN.forEach(function (laag) {
      w.write(shareU16(asfaltLaagMm(laag)), 16);
    });
    w.write(shareU16(v.maaiveldMm), 16);
    w.write(v.drukWapVrij ? 1 : 0, 1);
    w.write(naamBytes.length, 8);
    naamBytes.forEach(function (b) {
      w.write(b, 8);
    });
    return shareBytesToToken(w.bytes());
  }

  function applyShareToken(token) {
    var bytes = shareTokenToBytes(String(token || "").trim());
    if (!bytes || !bytes.length) return false;
    var r = shareBitReader(bytes);
    var shareVer = r.read(4);
    if (shareVer !== 1 && shareVer !== 2 && shareVer !== 3 && shareVer !== 4) return false;
    sheet = r.read(1) ? "capping" : "roadbase";
    wapeningFund = r.read(1) === 1;
    wapeningOgv = r.read(1) === 1;
    values.druklaagAan = r.read(1) === 1;
    showOngewapend = r.read(1) === 1;
    values.funderingModus = r.read(1) ? "vast" : "vrij";
    values.bovenToplaag = SHARE_TOP[r.read(2)] || "beton";
    values.bovenBedding = SHARE_BED[r.read(2)] || BOVEN_BEDDING_DEFAULT;
    values.rcelHoogte = RCEL_HOOGTE_KEUZES[r.read(2)] || RCEL_HOOGTE_DEFAULT;
    values.wapTypeFund = SHARE_WAP[r.read(2)] || WAPENING_TYPE_DEFAULT;
    values.wapTypeOgv = SHARE_WAP[r.read(2)] || WAPENING_TYPE_DEFAULT;
    values.wapTypeLicht = SHARE_WAP[r.read(2)] || "none";
    var matF = shareMatLabel(MATERIAAL_LAAG, r.read(4));
    var matO = shareMatLabel(MATERIAAL_ALLE, r.read(4));
    var matG = shareMatLabel(MATERIAAL_ALLE, r.read(4));
    var matD = shareMatLabel(MATERIAAL_DRUKLAAG, r.read(4));
    var nums = [];
    var numCount = shareVer === 3 ? 21 : shareVer === 2 ? 20 : 17;
    for (var i = 0; i < numCount; i++) nums.push(r.read(16));
    values.bovenKlinkers = nums[0];
    values.bovenAsfalt = nums[1];
    values.bovenBeton = nums[2];
    values.bovenStraatzand = nums[3];
    values.funderingBasis = nums[4];
    values.overhoogte = nums[5];
    values.ogvDikte = nums[6];
    values.eFundering = nums[7];
    values.eOgv = nums[8];
    values.eOndergrond = nums[9];
    values.eDruklaag = nums[10];
    values.druklaagDikte = nums[11];
    values.wapFundering = normalizeWapFundering(nums[12]);
    values.wapOgv = nums[13];
    values.sifFundering = nums[14] / 10;
    values.sifOgv = nums[15] / 10;
    values.sifLicht = nums[16] / 10;
    if (shareVer >= 2) {
      values.bovenAsfaltDek = nums[17];
      values.bovenAsfaltTussen = nums[18];
      values.bovenAsfaltOnder = nums[19];
      syncAsfaltTotal();
    } else if (values.bovenToplaag === "asfalt") {
      splitAsfaltTotal(values.bovenAsfalt);
    }
    values.maaiveldMm = shareVer >= 3 ? nums[20] : 0;
    values.drukWapVrij = shareVer >= 4 ? r.read(1) === 1 : false;
    materiaalKeuze = { eFundering: matF, eOgv: matO, eOndergrond: matG, eDruklaag: matD };
    var naamLen = r.read(8);
    var naamBytes = [];
    for (var j = 0; j < naamLen; j++) naamBytes.push(r.read(8));
    var naam = "";
    try {
      naam = new TextDecoder().decode(new Uint8Array(naamBytes));
    } catch (e2) {
      naam = "";
    }
    var el = document.getElementById("project_naam");
    if (el) el.value = naam;
    values.constructieType = sheet === "capping" ? "onderconstructie" : "beton-fund";
    syncBovenDikte();
    if (showOngewapend) {
      visitedGroups.grond = visitedGroups.ogv = visitedGroups.fund = visitedGroups.boven = true;
    }
    syncFunderingModusVanMateriaal();
    visitedGroups.grond = true;
    visitedGroups.ogv = true;
    visitedGroups.fund = true;
    visitedGroups.boven = true;
    return true;
  }

  function shareUrl() {
    const u = new URL(location.href);
    u.hash = "";
    u.search = "";
    u.searchParams.set("r", packShareToken());
    return u.toString();
  }

  function restoreFromUrl() {
    try {
      const u = new URL(location.href);
      const qr = u.searchParams.get("r");
      if (qr && applyShareToken(qr)) return true;
      const qc = u.searchParams.get("c");
      if (qc && applyCompact(qc)) return true;
      const qs = u.searchParams.get("s");
      if (qs) {
        applyState(JSON.parse(qs));
        syncFunderingModusVanMateriaal();
        return true;
      }
    } catch (e) {}
    const raw = location.hash.replace(/^#/, "");
    if (raw.indexOf("c=") === 0) {
      try {
        return applyCompact(decodeURIComponent(raw.slice(2)));
      } catch (e) {
        return false;
      }
    }
    if (raw.indexOf("s=") === 0) {
      try {
        applyState(JSON.parse(decodeURIComponent(raw.slice(2))));
        syncFunderingModusVanMateriaal();
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  function resultText() {
    const r = collectReport();
    const lines = [];
    lines.push(r.title);
    lines.push(r.date + " · " + r.sheetTab);
    lines.push(
      "Pakket " +
        r.pk.totaal +
        " mm (" +
        r.pk.omschrijving +
        ") · boven " +
        r.pk.boven +
        " · fundering " +
        r.pk.fundering +
        " · OGV " +
        r.pk.ogv
    );
    lines.push(
      "Fundering E: " +
        r.e.fundOng +
        (r.wapeningFund ? " → " + r.e.fundGew + " MPa (×" + r.e.fundFac + ")" : " MPa")
    );
    lines.push(
      "OGV E: " +
        r.e.ogvOng +
        (r.wapeningOgv ? " → " + r.e.ogvGew + " MPa (×" + r.e.ogvFac + ")" : " MPa")
    );
    r.invoer.forEach(function (row) {
      lines.push(row[0] + ": " + row[1]);
    });
    return lines.join("\n");
  }

  function inAppBrowser() {
    const ua = navigator.userAgent || "";
    return /Telegram|FBAN|FBAV|Instagram|Line\/|wv\)/i.test(ua) || !!window.TelegramWebviewProxy;
  }

  function materiaalLabel(key) {
    const m = materiaalMatch(key);
    if (m) return m.label;
    return materiaalKeuze[key] || "";
  }

  function materiaalNaamMpa(m, eFallback) {
    if (!m) {
      const e = Number(eFallback) || 0;
      return e ? e + " MPa" : "";
    }
    return m.label + " (" + m.mpa + " MPa" + (m.kgM3 ? " · " + formatKg(m.kgM3) + " kg/m³" : "") + ")";
  }

  function materiaalNaamMpaKey(key) {
    const m = materiaalMatch(key);
    if (m) return materiaalNaamMpa(m);
    const naam = materiaalKeuze[key] || "";
    const e = Number(values[key]) || 0;
    if (naam && e) return naam + " (" + e + " MPa)";
    if (naam) return naam;
    return e ? e + " MPa" : "";
  }

  function kgM3ForKey(key) {
    const m = materiaalMatch(key);
    return m && m.kgM3 ? m.kgM3 : 0;
  }

  function mmToKgM2(mm, kgM3) {
    return ((Number(mm) || 0) / 1000) * (Number(kgM3) || 0);
  }

  /** Millimeters vanaf de bovenzijde van de verharding tot het maaiveld. 0 = maaiveld op de verharding. */
  function maaiveldMm() {
    const max = Math.max(0, Math.round(Number(pakketMeta().totaal) || 0));
    let mm = Math.round(Number(values.maaiveldMm) || 0);
    if (!Number.isFinite(mm) || mm < 0) mm = 0;
    if (mm > max) mm = max;
    return mm;
  }

  function gewichtBalansTekst(w) {
    const deltaAbs = Math.abs(Math.round(w.delta));
    if (deltaAbs < 5) return tx("in balans");
    if (w.delta < 0) return formatKg(deltaAbs) + " kg/m² " + tx("lichter");
    return formatKg(deltaAbs) + " kg/m² " + tx("zwaarder");
  }

  function gewichtSubTekst(w) {
    const balans = gewichtBalansTekst(w);
    const boven = Math.round(w.bovenMaaiveldMm || 0);
    if (boven <= 0) {
      return tx("Zelfde hoogte slappe klei") + " " + formatKg(w.kleiKg) + " kg/m² · " + balans;
    }
    const onder = Math.round(w.onderMaaiveldMm || 0);
    if (onder <= 0) {
      return tx("Hele pakket boven maaiveld, veen wordt niet afgetrokken") + " · " + balans;
    }
    return (
      tx("Slappe klei alleen in het cunet") +
      " " +
      onder +
      " mm · " +
      formatKg(w.kleiKg) +
      " kg/m² · " +
      boven +
      " mm " +
      tx("boven maaiveld telt volledig mee") +
      " · " +
      balans
    );
  }

  function gewichtMeta() {
    const f = fundMeta(wapeningFund);
    const regels = [];
    const L = bovenActieveLaag();
    if (L && L.id === "asfalt") {
      ASFALT_LAGEN.forEach(function (laag) {
        const mm = asfaltLaagMm(laag);
        if (mm > 0) regels.push({ naam: laag.label, mm: mm, kgM3: laag.kgM3 || 0 });
      });
    } else if (L) {
      regels.push({ naam: L.label, mm: bovenLaagMm(L), kgM3: L.kgM3 || 0 });
    }
    if (L && L.id === "klinkers") {
      const bed = bovenBeddingKeuze();
      regels.push({ naam: bed.label, mm: bovenStraatzandMm(), kgM3: bed.kgM3 || 0 });
    }
    if (f.druklaagAan) {
      regels.push({
        naam: materiaalNaamMpa(materiaalMatch("eDruklaag", MATERIAAL_DRUKLAAG), f.eDruk) || "Druklaag",
        mm: f.drukStackMm,
        kgM3: kgM3ForKey("eDruklaag"),
      });
      regels.push({
        naam: materiaalNaamMpa(materiaalMatch("eFundering", MATERIAAL_LAAG), f.eLicht) || "Licht",
        mm: f.lichtDikte,
        kgM3: kgM3ForKey("eFundering"),
      });
    } else {
      regels.push({
        naam: materiaalNaamMpaKey("eFundering") || tx("Fundering"),
        mm: f.dikteTotaal,
        kgM3: kgM3ForKey("eFundering"),
      });
    }
    const ogvMm = Number(values.ogvDikte) || 0;
    if (ogvMm > 0) {
      regels.push({
        naam: materiaalNaamMpaKey("eOgv") || ogvLabel(),
        mm: ogvMm,
        kgM3: kgM3ForKey("eOgv"),
      });
    }
    const stand = maaiveldMm();
    let nogBoven = stand;
    let bovenKg = 0;
    let onderKg = 0;
    let onderMm = 0;
    regels.forEach(function (r) {
      const mm = Number(r.mm) || 0;
      const above = Math.min(mm, nogBoven);
      const below = mm - above;
      nogBoven -= above;
      bovenKg += mmToKgM2(above, r.kgM3);
      onderKg += mmToKgM2(below, r.kgM3);
      onderMm += below;
    });
    const pakketKg = bovenKg + onderKg;
    const hoogte = pakketMeta().totaal;
    const kleiKg = mmToKgM2(onderMm, REFERENTIE_KLEI_KG_M3);
    const delta = pakketKg - kleiKg;
    return {
      regels: regels,
      pakketKg: pakketKg,
      kleiKg: kleiKg,
      delta: delta,
      hoogte: hoogte,
      maaiveldMm: stand,
      bovenMaaiveldMm: stand - nogBoven,
      onderMaaiveldMm: onderMm,
      bovenKg: bovenKg,
      onderKg: onderKg,
    };
  }

  function formatKg(n) {
    const v = Math.round(n);
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function infillInCelTekst(key) {
    const naam = materiaalLabel(key);
    const e = Number(values[key]) || 0;
    if (naam && e) return naam + " · " + e + " MPa";
    if (naam) return naam;
    return e ? e + " MPa" : "—";
  }

  /** Alleen PDF-profiel: gekozen vulmateriaal bij fundering/overhoogte. */
  function pdfFundLayers(layers) {
    const mat = laagMateriaalNaam("eFundering");
    if (!mat) return layers;
    const fundCombo = PRESETS[sheet].labels.fund;
    return layers.map(function (L) {
      const name = L.name || "";
      if (name.indexOf(mat) !== -1) return L;
      let next = name;
      if (name.indexOf(fundCombo) === 0) {
        next = name.replace(fundCombo, fundCombo + " · " + mat);
      } else if (name.indexOf("Overhoogte") === 0) {
        next = name.replace("Overhoogte", "Overhoogte · " + mat);
      } else if (name.indexOf("Fundering") === 0) {
        next = name.replace("Fundering", "Fundering · " + mat);
      }
      return next === name ? L : Object.assign({}, L, { name: next });
    });
  }

  function fmtMm(n) {
    return (Number(n) || 0) + " mm";
  }

  function fmtMpa(n) {
    return (Number(n) || 0) + " MPa";
  }

  function mifRegel(meta, mif) {
    if (!meta) return String(mif);
    return (
      String(mif) +
      " (ondergrond " +
      meta.eOnderbouw +
      " MPa × laag " +
      meta.eInfill +
      " MPa)"
    );
  }

  function parseRgb(css) {
    const m = String(css || "").match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return [0.47, 0.71, 0];
    return [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255];
  }

  function visualLayers(colId) {
    const root = document.getElementById(colId);
    if (!root) return [];
    return Array.prototype.map
      .call(root.querySelectorAll(".visual-layer"), function (el) {
        const nameEl = el.querySelector(".visual-layer__name");
        const valsEl = el.querySelector(".visual-layer__vals");
        const cs = window.getComputedStyle(el);
        return {
          name: (nameEl && nameEl.textContent.trim()) || "",
          vals: valsEl
            ? valsEl.textContent
                .replace(/\s+/g, " ")
                .replace(/mm(?=\d)/gi, "mm ")
                .replace(/([²³%])(?=\d)/g, "$1 ")
                .trim()
            : "",
          mm: parseFloat(el.getAttribute("data-mm")) || 0,
          rgb: parseRgb(cs.backgroundColor),
        };
      })
      .filter(function (x) {
        return x.mm > 0 || x.name;
      });
  }

  function collectReport() {
    syncSheetFromInvoer();
    normalizeMateriaalKeuzeAliases();
    ["eFundering", "eOgv", "eOndergrond", "eDruklaag"].forEach(function (key) {
      syncMateriaalFromVisibleSelect(key);
      syncMateriaalKeuzeFromValues(key);
    });
    syncDruklaagFromFundering();
    syncMifFromWapening();
    invalidateCalcCache();
    setTableOpen(true);
    if (expertMode) {
      renderExpertVisual();
    } else {
      renderVisual();
      renderTable();
      renderPakketSummary();
    }
    applyI18n();

    const p = PRESETS[sheet];
    const f = fundMeta(wapeningFund);
    const fundOng = calcAt(false, wapeningOgv);
    const fundGew = calcAt(true, wapeningOgv);
    const ogvOng = calcAt(wapeningFund, false);
    const ogvGew = calcAt(wapeningFund, true);
    const live = calcAt(wapeningFund, wapeningOgv);
    const st = live.state;
    const pk = pakketMeta();
    const constructie = constructieBySheet(sheet);
    const bovenL = bovenActieveLaag();
    const fundType = wapeningTypeById(f.druklaagAan ? lichtWapeningTypeId() : values.wapTypeFund);
    const ogvType = wapeningTypeById(values.wapTypeOgv);
    const layersGew = visualLayers(expertMode ? "expert-visual-gew" : "visual-gew");
    const layersOng = visualLayers(expertMode ? "expert-visual-ong" : "visual-ong");

    const tableRows = [
      [
        "Bovenconstructie · " + (bovenL ? bovenL.label : "—"),
        fmtMm(bovenTopDikteSum()),
        "—",
        "—",
        "—",
        "—",
      ],
    ];
    if (bovenL && bovenL.id === "asfalt") {
      ASFALT_LAGEN.forEach(function (laag) {
        const mm = asfaltLaagMm(laag);
        if (mm <= 0) return;
        tableRows.push(["  " + laag.label, fmtMm(mm), "—", "—", "—", "—"]);
      });
    }
    if (bovenStraatzandMm() > 0) {
      tableRows.push(["  " + bovenBeddingLabel(), fmtMm(bovenStraatzandMm()), "—", "—", "—", "—"]);
    }
    tableRows.push([
      "Onderconstructie",
      onderconstructieOmschrijving() + " mm",
      "—",
      "—",
      "—",
      "—",
    ]);
    const fundKopOng = profielConstructieMpa(false, false);
    const fundKopGew = profielConstructieMpa(wapeningFund, wapeningOgv);
    tableRows.push([
      "  " +
        p.labels.fund +
        (materiaalNaamMpaKey("eFundering") ? " · " + materiaalNaamMpaKey("eFundering") : ""),
      f.basis + " + " + f.oh + " = " + f.dikteTotaal + " mm",
      wapeningFund ? fmtMm(f.wapDikte) : "—",
      fmtMpa(fundKopOng.fund),
      fmtMpa(wapeningFund ? fundKopGew.fund : fundKopOng.fund),
      wapeningFund ? factor(fundKopOng.fund, fundKopGew.fund) + "×" : "—",
    ]);
    if (!f.druklaagAan && wapeningFund) {
      fundProfielBanden(f, true).forEach(function (b) {
        tableRows.push([
          "    " + b.name,
          fmtMm(b.mm),
          b.gewap ? fmtMm(b.mm) : "—",
          "—",
          "—",
          "—",
        ]);
      });
    }
    if (f.druklaagAan) {
      const lichtMat = materiaalMatch("eFundering", MATERIAAL_LAAG);
      const drukType = wapeningTypeById(effectiveDrukTypeId(!!wapeningFund));
      const lichtType = wapeningTypeById(lichtWapeningTypeId());
      const drukNu = calcAt(wapeningFund, wapeningOgv);
      const drukNaam = druklaagHasWapening()
        ? wapeningOptionLabel(drukType, false, "fund")
        : "ongewapend";
      const lichtNaam = wapeningFund && lichtHasWapening()
        ? wapeningOptionLabel(lichtType, false, "fund-licht")
        : "ongewapend";
      tableRows.push([
        "    Druklaag · " + (materiaalKeuze.eDruklaag || "druklaag") + " · " + drukNaam,
        fmtMm(f.drukBasis),
        druklaagHasWapening() ? "SIF " + formatFactor(drukType ? drukType.sif : 5) : "—",
        fmtMpa(f.eDruk),
        fmtMpa(druklaagHasWapening() ? drukNu.state.C26 || f.eDruk : f.eDruk),
        druklaagHasWapening() ? factor(f.eDruk, drukNu.state.C26 || f.eDruk) + "×" : "—",
      ]);
      tableRows.push([
        "    " + ((lichtMat && lichtMat.label) || "Licht") + " · " + lichtNaam,
        fmtMm(f.lichtDikte),
        wapeningFund && lichtHasWapening() && f.lichtSplit ? "R'Cel " + f.lichtSplit.cell + " mm" : "—",
        fmtMpa(f.eLicht),
        fmtMpa(wapeningFund && lichtHasWapening() ? fundGew.state.C27 || f.eLicht : f.eLicht),
        wapeningFund && lichtHasWapening() ? factor(f.eLicht, fundGew.state.C27 || f.eLicht) + "×" : "—",
      ]);
      if (wapeningFund && f.lichtSplit) {
        cellSplitBands(f.lichtSplit, (lichtMat && lichtMat.label) || "").forEach(function (b) {
          tableRows.push([
            "      " + b.name,
            fmtMm(b.mm),
            b.kind === "ong" ? "—" : fmtMm(b.mm),
            "—",
            "—",
            "—",
          ]);
        });
      }
    }
    tableRows.push([
      "  " + p.labels.ogv + (laagMateriaalNaam("eOgv") ? " · " + laagMateriaalNaam("eOgv") : ""),
      fmtMm(values.ogvDikte),
      wapeningOgv ? fmtMm(values.wapOgv) : "—",
      fmtMpa(ogvOng.output.D14),
      fmtMpa(wapeningOgv ? ogvGew.output.E14 : ogvOng.output.D14),
      wapeningOgv ? factor(ogvOng.output.D14, ogvGew.output.E14) + "×" : "—",
    ]);
    tableRows.push([
      "Ondergrond" + (laagMateriaalNaam("eOndergrond") ? " · " + laagMateriaalNaam("eOndergrond") : ""),
      "—",
      "—",
      fmtMpa(values.eOndergrond),
      fmtMpa(values.eOndergrond),
      "—",
    ]);

    const invoer = [
      ["Project", projectNaam() || "—"],
      ["Constructietype", constructiePrintLabel()],
    ];
    if (bovenL && bovenL.id === "asfalt") {
      ASFALT_LAGEN.forEach(function (laag) {
        invoer.push([laag.label, fmtMm(asfaltLaagMm(laag))]);
      });
      invoer.push(["Asfalt totaal", fmtMm(asfaltSum())]);
    } else {
      invoer.push(["Toplaag", bovenL ? bovenL.label + " · " + fmtMm(bovenLaagMm(bovenL)) : "geen"]);
    }
    if (bovenStraatzandMm() > 0) {
      invoer.push([bovenBeddingLabel(), fmtMm(bovenStraatzandMm())]);
    }
    invoer.push(["Bovenconstructie totaal", fmtMm(pk.boven) + " · vaste equivalente E " + BOVEN_E_EQUIVALENT + " MPa (geen Romfix)"]);
    invoer.push(["Fundering nominaal", fmtMm(f.basis)]);
    invoer.push([
      "Overhoogte",
      fmtMm(f.oh) +
        (f.oh > OVERHOOGTE_GEWAP_MAX ? " (gewapend max " + OVERHOOGTE_GEWAP_MAX + " mm)" : ""),
    ]);
    invoer.push(["Fundering totaal", fmtMm(f.dikteTotaal)]);
    invoer.push(["Materiaal in fundering", infillInCelTekst("eFundering")]);
    if (f.druklaagAan) {
      invoer.push(["Licht fundering", fmtMm(f.lichtDikte) + " · " + (materiaalLabel("eFundering") || "") + " · " + fmtMpa(f.eLicht)]);
      invoer.push([
        "Druklaag",
        fmtMm(f.drukBasis) +
          " · " +
          (materiaalKeuze.eDruklaag || "") +
          " · " +
          fmtMpa(f.eDruk) +
          (druklaagHasWapening()
            ? " · " + wapeningOptionLabel(wapeningTypeById(effectiveDrukTypeId(!!wapeningFund)), false, "fund")
            : ""),
      ]);
      if (wapeningFund && f.lichtSplit) {
        invoer.push(["Gewapende celhoogte", fmtMm(f.lichtSplit.cell)]);
        if (f.lichtSplit.fillGew > 0) invoer.push(["Gewapende overhoogte", fmtMm(f.lichtSplit.fillGew)]);
        if (f.lichtSplit.fillOng > 0) invoer.push(["Ongewapende overhoogte", fmtMm(f.lichtSplit.fillOng)]);
      }
    }
    invoer.push([
      "Rekenwijze ongewapende stijfheid",
      isFunderingVast()
        ? "Vast — In = W, SIF doet niet mee"
        : "Vrij — W volgt uit laagdikte en ondergrond",
    ]);
    invoer.push(["Ongewapende stijfheid In / W", fmtMpa(eInFundering()) + " / " + fmtMpa(eWFundering())]);
    invoer.push([
      "Wapening fundering",
      wapeningFund
        ? "Aan · " + (fundType ? wapeningOptionLabel(fundType, false, f.druklaagAan ? "fund-licht" : "fund") : "—")
        : "Uit",
    ]);
    if (wapeningFund) {
      if (typeHasRcel(f.druklaagAan ? lichtWapeningTypeId() : values.wapTypeFund)) {
        const split = f.druklaagAan ? f.lichtSplit : f.fundSplit;
        invoer.push(["Hoogte R'Cel", fmtMm(split ? split.cell : rcelHoogteMm())]);
        invoer.push(["Infill in R'Cel", infillInCelTekst("eFundering")]);
        if (split && split.fillGew > 0 && !f.druklaagAan) {
          invoer.push(["Gewapende overhoogte", fmtMm(split.fillGew)]);
        }
        if (split && split.fillOng > 0 && !f.druklaagAan) {
          invoer.push(["Ongewapende overhoogte", fmtMm(split.fillOng)]);
        }
      }
      invoer.push(["Effectieve werkingsdikte fundering", fmtMm(f.wapDikte)]);
      if (f.druklaagAan) {
        invoer.push(["SIF druklaag (geogrid)", formatFactor(values.sifFundering)]);
        invoer.push(["SIF lichte laag", formatFactor(values.sifLicht)]);
        invoer.push(["MIF lichte laag", mifRegel(mifLookupMeta.licht, values.mifLicht)]);
      } else {
        invoer.push(["SIF fundering", formatFactor(values.sifFundering)]);
        invoer.push(["MIF fundering", mifRegel(mifLookupMeta.fund, values.mifFundering)]);
      }
    }
    invoer.push([p.labels.ogv, fmtMm(values.ogvDikte)]);
    invoer.push(["Vulmateriaal OGV", (materiaalLabel("eOgv") ? materiaalLabel("eOgv") + " · " : "") + fmtMpa(values.eOgv)]);
    invoer.push(["Wapening OGV", wapeningOgv ? "Aan · " + (ogvType ? wapeningOptionLabel(ogvType, false, "ogv") : "—") : "Uit"]);
    if (wapeningOgv) {
      invoer.push(["Werkingsdikte OGV", fmtMm(values.wapOgv)]);
      if (typeHasRcel(values.wapTypeOgv)) {
        invoer.push(["Infill in R'Cel (OGV)", infillInCelTekst("eOgv")]);
      }
      invoer.push(["SIF OGV", formatFactor(values.sifOgv)]);
      invoer.push(["MIF OGV", mifRegel(mifLookupMeta.ogv, values.mifOgv)]);
    }
    invoer.push([
      "Ondergrond",
      (materiaalLabel("eOndergrond") ? materiaalLabel("eOndergrond") + " · " : "") +
        fmtMpa(values.eOndergrond) +
        (kgM3ForKey("eOndergrond") ? " · " + formatKg(kgM3ForKey("eOndergrond")) + " kg/m³" : ""),
    ]);
    invoer.push(["Pakketdikte", pk.totaal + " mm (" + pk.omschrijving + ")"]);
    const gewichtPdf = gewichtMeta();
    invoer.push(["Gewicht pakket", formatKg(gewichtPdf.pakketKg) + " kg/m²"]);
    if ((gewichtPdf.bovenMaaiveldMm || 0) > 0) {
      invoer.push([
        "Maaiveld",
        Math.round(gewichtPdf.maaiveldMm) + " mm onder bovenzijde verharding",
      ]);
      invoer.push([
        "Boven maaiveld",
        fmtMm(gewichtPdf.bovenMaaiveldMm) + " · " + formatKg(gewichtPdf.bovenKg) + " kg/m²",
      ]);
      invoer.push([
        "Onder maaiveld (cunet)",
        fmtMm(gewichtPdf.onderMaaiveldMm) +
          " · vervangen slappe klei " +
          formatKg(gewichtPdf.kleiKg) +
          " kg/m²",
      ]);
    }
    gewichtPdf.regels.forEach(function (regel) {
      invoer.push([
        "  " + regel.naam,
        fmtMm(regel.mm) + " · " + formatKg(regel.kgM3) + " kg/m³ · " + formatKg(mmToKgM2(regel.mm, regel.kgM3)) + " kg/m²",
      ]);
    });
    const pctPdf = stijfheidPercentages();
    invoer.push([
      "Verschil gewapend t.o.v. ongewapend",
      pctTekst(pctPdf.fund) +
        (pctPdf.ogv ? " · " + p.labels.ogv.toLowerCase() + " " + pctTekst(pctPdf.ogv) : ""),
    ]);

    const excel = [
      ["B12 boven", fmtMm(st.B12)],
      ["B13 fundering", fmtMm(st.B13)],
      ["B14 " + p.labels.ogv, fmtMm(st.B14)],
      ["C19 totaal onderbouw", fmtMm(live.output.C19)],
      ["C20 totaal + boven", fmtMm(live.output.C20)],
      ["C13 fundering E", fmtMpa(st.C13)],
      ["C14 OGV E", fmtMpa(st.C14)],
      ["C15 ondergrond E", fmtMpa(st.C31)],
      ["B19 fund. wapening", fmtMm(st.B19)],
      ["B20 OGV wapening", fmtMm(st.B20)],
      ["B25 ongew. fundering", Math.round(st.B25) + " mm"],
      ["B26 gewap. fundering", Math.round(st.B26) + " mm"],
      ["B27 ongew. onder", Math.round(st.B27) + " mm"],
      ["D13 zonder wapening", fmtMpa(fundOng.output.D13)],
      ["E13 met wapening", fmtMpa(fundGew.output.E13)],
      ["E25 gewap. keten", fmtMpa(Math.round(st.E25))],
      ["C26 gewap. zone", fmtMpa(Math.round(st.C26))],
      ["D46 ongew. onder", fmtMpa(Math.round(st.D46))],
      ["E46 ongew. boven", fmtMpa(Math.round(st.E46))],
      ["F46 Austroads", fmtMpa(Math.round(st.F46))],
      ["D54 Thenn", fmtMpa(Math.round(st.D54))],
      ["F67 Palmer", (Math.round(st.F67 * 1000) / 1000).toFixed(3)],
      ["D14 zonder wapening", fmtMpa(ogvOng.output.D14)],
      ["E14 met wapening", fmtMpa(ogvGew.output.E14)],
    ];

    const report = {
      title: projectNaam() ? "Romfix — " + projectNaam() : "Romfix funderings rekenhulp",
      project: projectNaam(),
      date: new Date().toLocaleString(
        (function () {
          const code = window.RomfixI18n && window.RomfixI18n.lang();
          if (code === "en") return "en-GB";
          if (code === "da") return "da-DK";
          if (code === "de") return "de-DE";
          if (code === "pap") return "nl-CW";
          return "nl-NL";
        })()
      ),
      version: "2.3",
      sheetTab: constructie ? constructie.tab : sheet,
      constructieLabel: constructie ? constructie.label : "",
      pk: pk,
      f: f,
      wapeningFund: wapeningFund,
      wapeningOgv: wapeningOgv,
      fundMateriaal: materiaalNaamMpaKey("eFundering") || laagMateriaalNaam("eFundering"),
      gewicht: gewichtMeta(),
      e: {
        fundOng: fundOng.output.D13,
        fundGew: fundGew.output.E13,
        fundFac: wapeningFund ? factor(fundOng.output.D13, fundGew.output.E13) : "—",
        ogvOng: ogvOng.output.D14,
        ogvGew: ogvGew.output.E14,
        ogvFac: wapeningOgv ? factor(ogvOng.output.D14, ogvGew.output.E14) : "—",
        colGew: profielConstructieMpaText(wapeningFund, wapeningOgv),
        colOng: profielConstructieMpaText(false, false),
      },
      tableRows: tableRows,
      invoer: invoer,
      excel: excel,
      layersGew: pdfFundLayers(layersGew),
      layersOng: pdfFundLayers(layersOng),
      share: shareUrl(),
      disclaimer:
        "Indicatieve Romfix-berekening (werkboek v2.3). Geen bindende projectberekening. Controleer met ontwerp, verkeersklasse en sondering. Romfix adviseert bij elke overgang van funderingsmateriaal een R'tex scheidingsdoek.",
    };
    return localizeReport(report);
  }

  function localizeReport(r) {
    if (!window.RomfixI18n || window.RomfixI18n.lang() === "nl") return r;
    function loc(v, skip) {
      if (skip) return v;
      if (typeof v === "string") return window.RomfixI18n.tMix(v);
      if (Array.isArray(v)) return v.map(function (x) { return loc(x); });
      if (v && typeof v === "object") {
        const o = {};
        Object.keys(v).forEach(function (k) {
          o[k] = k === "share" || k === "version" || k === "date" || k === "rgb" ? v[k] : loc(v[k]);
        });
        return o;
      }
      return v;
    }
    return loc(r);
  }

  function htmlEscape(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function htmlTable(headers, rows, kv) {
    let h = "<table><thead><tr>";
    headers.forEach(function (c, i) {
      h += "<th" + (i && !kv ? ' class="num"' : "") + ">" + htmlEscape(c) + "</th>";
    });
    h += "</tr></thead><tbody>";
    rows.forEach(function (row) {
      h += "<tr>";
      row.forEach(function (c, i) {
        const cls = kv ? (i === 0 ? " scope='row'" : "") : i ? ' class="num"' : "";
        if (kv && i === 0) h += "<th class='print-kv-th'>" + htmlEscape(c) + "</th>";
        else h += "<td" + (i && !kv ? ' class="num"' : "") + ">" + htmlEscape(c) + "</td>";
      });
      h += "</tr>";
    });
    return h + "</tbody></table>";
  }

  function cloneVisualsHtml() {
    const src =
      document.querySelector("#standard-view .visual-compare") ||
      document.querySelector("#expert-dashboard .visual-compare");
    if (!src) return "";
    const node = src.cloneNode(true);
    node.querySelectorAll("[id]").forEach(function (el) {
      el.removeAttribute("id");
    });
    return '<div class="print-visuals">' + node.outerHTML + "</div>";
  }

  function buildPrintReport() {
    const r = collectReport();
    const el = document.getElementById("print-report");
    if (!el) return r;
    el.hidden = false;
    el.innerHTML =
      "<h1>" +
      htmlEscape(r.title) +
      "</h1>" +
      '<p class="print-meta">Romfix B.V. · ' +
      tx("werkboek") +
      " v" +
      r.version +
      " · " +
      htmlEscape(r.date) +
      "</p>" +
      (document.getElementById("pakket-summary")
        ? document.getElementById("pakket-summary").outerHTML
        : "") +
      '<div class="print-kpis">' +
      printKpiCards(r)
        .map(function (k) {
          return (
            '<div class="print-kpi">' +
            '<span class="print-kpi__label">' +
            htmlEscape(k.label) +
            "</span>" +
            "<strong>" +
            htmlEscape(k.value) +
            "</strong>" +
            '<span class="print-kpi__sub">' +
            htmlEscape(k.sub) +
            "</span></div>"
          );
        })
        .join("") +
      "</div>" +
      "<h2>" + tx("Profiel gewapend vs ongewapend") + "</h2>" +
      cloneVisualsHtml() +
      "<h2>" + tx("Waarden per laag") + "</h2>" +
      htmlTable(
        [tx("Situatie"), tx("Laag"), tx("Waarden")],
        r.layersGew
          .map(function (L) {
            return [tx("Gewapend"), L.name || "—", L.vals || "—"];
          })
          .concat(
            r.layersOng.map(function (L) {
              return [tx("Ongewapend"), L.name || "—", L.vals || "—"];
            })
          )
      ) +
      "<h2>" + tx("Stijfheidstabel") + "</h2>" +
      htmlTable(
        [tx("Laag"), tx("Dikte"), tx("Wapening"), tx("Zonder wapening"), tx("Met wapening"), tx("Factor")],
        r.tableRows
      ) +
      "<h2>" + tx("Invoer") + "</h2>" +
      htmlTable([tx("Onderdeel"), tx("Waarde")], r.invoer, true) +
      "<h2>" + tx("Toelichting") + "</h2>" +
      '<p class="print-advice"><strong>' +
      htmlEscape(
        "Romfix adviseert bij elke overgang van funderingsmateriaal een R'tex scheidingsdoek."
      ) +
      "</strong></p>" +
      '<p class="print-note">' +
      htmlEscape(r.disclaimer) +
      "</p>";
    return r;
  }

  function pdfEncode(s) {
    const map = {
      "€": 128,
      "‚": 130,
      "ƒ": 131,
      "„": 132,
      "…": 133,
      "†": 134,
      "‡": 135,
      "ˆ": 136,
      "‰": 137,
      "Š": 138,
      "‹": 139,
      "Œ": 140,
      "Ž": 142,
      "‘": 145,
      "’": 146,
      "“": 147,
      "”": 148,
      "•": 149,
      "–": 150,
      "—": 151,
      "˜": 152,
      "™": 153,
      "š": 154,
      "›": 155,
      "œ": 156,
      "ž": 158,
      "Ÿ": 159,
      À: 192,
      Á: 193,
      Â: 194,
      Ã: 195,
      Ä: 196,
      Å: 197,
      Æ: 198,
      Ç: 199,
      È: 200,
      É: 201,
      Ê: 202,
      Ë: 203,
      Ì: 204,
      Í: 205,
      Î: 206,
      Ï: 207,
      Ñ: 209,
      Ò: 210,
      Ó: 211,
      Ô: 212,
      Õ: 213,
      Ö: 214,
      "×": 215,
      "·": 183,
      "²": 178,
      "³": 179,
      Ø: 216,
      Ù: 217,
      Ú: 218,
      Û: 219,
      Ü: 220,
      Ý: 221,
      ß: 223,
      à: 224,
      á: 225,
      â: 226,
      ã: 227,
      ä: 228,
      å: 229,
      æ: 230,
      ç: 231,
      è: 232,
      é: 233,
      ê: 234,
      ë: 235,
      ì: 236,
      í: 237,
      î: 238,
      ï: 239,
      ñ: 241,
      ò: 242,
      ó: 243,
      ô: 244,
      õ: 245,
      ö: 246,
      "÷": 247,
      ø: 248,
      ù: 249,
      ú: 250,
      û: 251,
      ü: 252,
      ý: 253,
      ÿ: 255,
    };
    let out = "";
    const str = String(s == null ? "" : s)
      .replace(/\u2192/g, " -> ")
      .replace(/\u2014/g, " - ")
      .replace(/\u2013/g, "-")
      .replace(/\u2011/g, "-");
    for (let i = 0; i < str.length; i++) {
      const ch = str.charAt(i);
      let code = ch.charCodeAt(0);
      if (map[ch] != null) code = map[ch];
      else if (code === 160) code = 32;
      else if (code < 32 || (code > 126 && code < 128) || code > 255) code = 32;
      if (code === 40 || code === 41 || code === 92) out += "\\" + String.fromCharCode(code);
      else if (code < 32 || code > 126) out += "\\" + code.toString(8).padStart(3, "0");
      else out += String.fromCharCode(code);
    }
    return out;
  }

  function pdfTextWidth(s, size, bold) {
    return String(s || "").length * size * (bold ? 0.58 : 0.5);
  }

  function pdfWrap(s, size, maxW, bold) {
    const words = String(s || "").split(/\s+/);
    const lines = [];
    let cur = "";
    words.forEach(function (w) {
      const t = cur ? cur + " " + w : w;
      if (pdfTextWidth(t, size, bold) <= maxW) cur = t;
      else {
        if (cur) lines.push(cur);
        if (pdfTextWidth(w, size, bold) <= maxW) cur = w;
        else {
          let chunk = "";
          for (let i = 0; i < w.length; i++) {
            const n = chunk + w.charAt(i);
            if (pdfTextWidth(n, size, bold) <= maxW) chunk = n;
            else {
              if (chunk) lines.push(chunk);
              chunk = w.charAt(i);
            }
          }
          cur = chunk;
        }
      }
    });
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
  }

  function buildPdfBlob() {
    const r = collectReport();
    const pageW = 595;
    const pageH = 842;
    const margin = 40;
    const contentW = pageW - margin * 2;
    const pages = [];
    let ops = [];
    let y = pageH - 36;

    function flushPage() {
      if (ops.length) pages.push(ops);
      ops = [];
      y = pageH - 36;
    }
    function ensure(h) {
      if (y - h < 42) flushPage();
    }
    function rgb(rr, g, b) {
      return rr.toFixed(3) + " " + g.toFixed(3) + " " + b.toFixed(3);
    }
    function fillRect(x, yy, w, h, color) {
      ops.push(color + " rg " + x.toFixed(1) + " " + yy.toFixed(1) + " " + w.toFixed(1) + " " + h.toFixed(1) + " re f");
    }
    function strokeRect(x, yy, w, h, color) {
      ops.push(color + " RG 0.4 w " + x.toFixed(1) + " " + yy.toFixed(1) + " " + w.toFixed(1) + " " + h.toFixed(1) + " re S");
    }
    function textAt(x, yy, size, s, bold, color) {
      ops.push((color || "0 0 0") + " rg");
      ops.push(
        "BT /" +
          (bold ? "F2" : "F1") +
          " " +
          size +
          " Tf 1 0 0 1 " +
          x.toFixed(1) +
          " " +
          yy.toFixed(1) +
          " Tm (" +
          pdfEncode(s) +
          ") Tj ET"
      );
    }
    function heading(s) {
      ensure(28);
      y -= 18;
      fillRect(margin, y - 2, 42, 3, rgb(0.471, 0.714, 0));
      textAt(margin + 50, y, 12, s, true, rgb(0.106, 0.165, 0.29));
      y -= 10;
    }
    function para(s, size) {
      const sz = size || 8.5;
      const lines = pdfWrap(s, sz, contentW, false);
      lines.forEach(function (ln) {
        ensure(12);
        y -= 11;
        textAt(margin, y, sz, ln, false);
      });
    }
    function drawTable(headers, rows, colW, opts) {
      const o = opts || {};
      const headerH = 16;
      const pad = 4;
      const sz = o.size || 8;
      function rowHeight(cells, bold) {
        let h = 14;
        cells.forEach(function (c, i) {
          const lines = pdfWrap(String(c), sz, colW[i] - pad * 2, bold);
          h = Math.max(h, lines.length * 10 + 6);
        });
        return h;
      }
      ensure(headerH + 8);
      let x = margin;
      fillRect(margin, y - headerH, contentW, headerH, rgb(0.106, 0.165, 0.29));
      headers.forEach(function (h, i) {
        textAt(x + pad, y - headerH + 5, sz, h, true, "1 1 1");
        x += colW[i];
      });
      y -= headerH;
      rows.forEach(function (row, ri) {
        const rh = rowHeight(row, false);
        ensure(rh + 2);
        if (o.kv && ri % 2 === 0) fillRect(margin, y - rh, contentW, rh, rgb(0.953, 0.961, 0.973));
        let xx = margin;
        row.forEach(function (c, i) {
          strokeRect(xx, y - rh, colW[i], rh, rgb(0.773, 0.804, 0.847));
          const lines = pdfWrap(String(c), sz, colW[i] - pad * 2, o.kv && i === 0);
          let ty = y - 11;
          lines.forEach(function (ln) {
            textAt(xx + pad, ty, sz, ln, !!(o.kv && i === 0), rgb(0.12, 0.16, 0.23));
            ty -= 10;
          });
          xx += colW[i];
        });
        y -= rh;
      });
      y -= 6;
    }
    function drawStack(layers, x, label, sub, width) {
      textAt(x, y, 10, label, true, rgb(0.106, 0.165, 0.29));
      const subLines = pdfWrap(sub, 8, width, false);
      subLines.forEach(function (ln, i) {
        textAt(x, y - 12 - i * 10, 8, ln, false, rgb(0.3, 0.35, 0.4));
      });
      const totalMm =
        layers.reduce(function (s, L) {
          return s + (L.mm || 0);
        }, 0) || 1;
      const maxH = 210;
      let yy = y - 16 - subLines.length * 10;
      layers.forEach(function (L) {
        const h = Math.max(18, ((L.mm || 8) / totalMm) * maxH);
        yy -= h;
        const col = L.rgb || [0.47, 0.71, 0];
        fillRect(x, yy, width, h - 1.2, rgb(col[0], col[1], col[2]));
        const dark = col[0] + col[1] + col[2] < 1.55;
        const ink = dark ? "1 1 1" : rgb(0.12, 0.16, 0.23);
        const vals = String(L.vals || "").replace(/mm(?=\S)/gi, "mm ");
        const lines = pdfWrap((L.name || "") + (vals ? "   " + vals : ""), 7, width - 10, false).slice(0, 2);
        let ty = yy + h - 12;
        lines.forEach(function (ln) {
          textAt(x + 5, ty, 7, ln, false, ink);
          ty -= 9;
        });
      });
      return yy;
    }

    fillRect(0, pageH - 28, pageW, 28, rgb(0.106, 0.165, 0.29));
    textAt(margin, pageH - 19, 11, tx("Romfix funderings rekenhulp"), true, "1 1 1");
    textAt(pageW - margin - 90, pageH - 19, 9, "v" + r.version + "  " + tx("indicatief"), false, "1 1 1");
    y = pageH - 48;
    textAt(margin, y, 16, r.title, true, rgb(0.106, 0.165, 0.29));
    y -= 14;
    para(r.date, 9);
    y -= 8;

    const balk = document.getElementById("pakket-summary");
    const balkDikte = balk && balk.querySelector(".kpi-bar__value")
      ? balk.querySelector(".kpi-bar__value").innerText.replace(/\s+/g, " ").trim()
      : r.pk.totaal + " mm";
    const balkChips = balk
      ? Array.prototype.map.call(balk.querySelectorAll(".kpi-bar__chips > span"), function (el) {
          return el.innerText.replace(/\s+/g, " ").trim();
        })
      : [];
    const chipH = 16;
    const chipGap = 6;
    let chipRows = 1;
    let probeX = 0;
    balkChips.forEach(function (chip) {
      const w = Math.min(contentW - 8, pdfTextWidth(chip, 8, false) + 14);
      if (probeX > 0 && probeX + w > contentW) {
        chipRows += 1;
        probeX = w + chipGap;
      } else probeX += w + chipGap;
    });
    const balkH = 28 + chipRows * (chipH + 4) + 8;
    ensure(balkH + 6);
    fillRect(margin, y - balkH, contentW, balkH, rgb(0.965, 0.972, 0.98));
    textAt(margin + 10, y - 16, 8, "PAKKETDIKTE", false, rgb(0.42, 0.47, 0.54));
    textAt(margin + 10, y - 32, 13, balkDikte, true, rgb(0.106, 0.165, 0.29));
    let cx = margin + 10;
    let cy = y - 48;
    balkChips.forEach(function (chip) {
      const w = Math.min(contentW - 20, pdfTextWidth(chip, 8, false) + 14);
      if (cx > margin + 10 && cx + w > margin + contentW - 8) {
        cx = margin + 10;
        cy -= chipH + 4;
      }
      strokeRect(cx, cy - 3, w, chipH, rgb(0.82, 0.86, 0.9));
      textAt(cx + 6, cy + 1, 8, chip, false, rgb(0.15, 0.2, 0.28));
      cx += w + chipGap;
    });
    y -= balkH + 12;

    const kpis = printKpiCards(r);
    const kpiGap = 8;
    const kpiW = (contentW - kpiGap) / 2;
    const kpiInner = kpiW - 14;
    const kpiLineH = 9;
    const kpiBlocks = kpis.map(function (k) {
      return {
        label: k.label,
        value: k.value,
        lines: pdfWrap(k.sub, 7, kpiInner, false).slice(0, 4),
      };
    });
    for (let i = 0; i < kpiBlocks.length; i += 2) {
      const pair = kpiBlocks.slice(i, i + 2);
      const kpiH =
        28 +
        Math.max.apply(
          null,
          pair.map(function (b) {
            return b.lines.length * kpiLineH;
          })
        );
      ensure(kpiH + 8);
      pair.forEach(function (k, j) {
        const x = margin + j * (kpiW + kpiGap);
        strokeRect(x, y - kpiH, kpiW, kpiH, rgb(0.773, 0.804, 0.847));
        textAt(x + 7, y - 12, 7.5, k.label, false, rgb(0.4, 0.45, 0.5));
        textAt(x + 7, y - 24, 9, k.value, true, rgb(0.106, 0.165, 0.29));
        k.lines.forEach(function (ln, li) {
          textAt(x + 7, y - 34 - li * kpiLineH, 7, ln, false, rgb(0.3, 0.35, 0.4));
        });
      });
      y -= kpiH + 8;
    }
    y -= 4;

    heading(tx("Profiel gewapend vs ongewapend"));
    ensure(240);
    const leftBottom = drawStack(r.layersGew, margin, tx("Gewapend"), r.e.colGew, 250);
    const rightBottom = drawStack(r.layersOng, margin + 265, tx("Ongewapend"), r.e.colOng, 250);
    y = Math.min(leftBottom, rightBottom) - 10;

    function laagRijen(layers, situatie) {
      return layers.map(function (L) {
        return [situatie, L.name || "—", L.vals || "—"];
      });
    }
    const laagRows = laagRijen(r.layersGew, tx("Gewapend")).concat(laagRijen(r.layersOng, tx("Ongewapend")));
    if (laagRows.length) {
      heading(tx("Waarden per laag"));
      drawTable([tx("Situatie"), tx("Laag"), tx("Waarden")], laagRows, [78, 230, 207], { size: 7 });
    }

    heading(tx("Stijfheidstabel"));
    drawTable(
      [tx("Laag"), tx("Dikte"), tx("Wapening"), tx("Zonder"), tx("Met"), tx("Factor")],
      r.tableRows,
      [155, 95, 70, 70, 70, 55]
    );

    heading(tx("Invoer"));
    drawTable([tx("Onderdeel"), tx("Waarde")], r.invoer, [175, 340], { kv: true, size: 8 });

    heading(tx("Toelichting"));
    const advies =
      "Romfix adviseert bij elke overgang van funderingsmateriaal een R'tex scheidingsdoek.";
    const adviesLines = pdfWrap(tx(advies), 11, contentW - 16, true);
    const adviesH = 16 + adviesLines.length * 14;
    ensure(adviesH + 8);
    fillRect(margin, y - adviesH, contentW, adviesH, rgb(0.93, 0.97, 0.86));
    let ay = y - 16;
    adviesLines.forEach(function (ln) {
      textAt(margin + 8, ay, 11, ln, true, rgb(0.1, 0.25, 0.12));
      ay -= 14;
    });
    y -= adviesH + 8;
    para(r.disclaimer, 8);
    y -= 8;
    textAt(margin, 28, 8, tx("Romfix B.V. · www.romfix.nl · geen bindende projectberekening"), false, rgb(0.4, 0.45, 0.5));

    flushPage();

    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "PAGES",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    ];
    const kids = [];
    pages.forEach(function (pageOps) {
      const stream = pageOps.join("\n");
      objects.push("<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream");
      const contentId = objects.length;
      objects.push(
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " +
          pageW +
          " " +
          pageH +
          "] /Contents " +
          contentId +
          " 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>"
      );
      kids.push(objects.length + " 0 R");
    });
    objects[1] =
      "<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + kids.length + " >>";

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach(function (body, i) {
      offsets.push(pdf.length);
      pdf += i + 1 + " 0 obj\n" + body + "\nendobj\n";
    });
    const xref = pdf.length;
    pdf += "xref\n0 " + (objects.length + 1) + "\n";
    pdf += "0000000000 65535 f \n";
    offsets.slice(1).forEach(function (off) {
      pdf += String(off).padStart(10, "0") + " 00000 n \n";
    });
    pdf +=
      "trailer << /Size " +
      (objects.length + 1) +
      " /Root 1 0 R >>\nstartxref\n" +
      xref +
      "\n%%EOF";
    return new Blob([pdf], { type: "application/pdf" });
  }

  function safeFilename() {
    const naam = projectNaam() || "berekening";
    return (
      "romfix-" +
      naam
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) +
      ".pdf"
    );
  }

  function offerPdf(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    const fallback = document.getElementById("pdf-fallback");
    const link = document.getElementById("pdf-fallback-link");
    if (link) {
      if (link.dataset.prev) URL.revokeObjectURL(link.dataset.prev);
      link.href = url;
      link.setAttribute("download", filename);
      link.dataset.prev = url;
    }
    if (fallback) fallback.hidden = false;
    try {
      window.open(url, "_blank");
    } catch (_) {}
    setShareStatus(tx("PDF klaar. Werkt de download niet? Tik op ‘Tik hier om de PDF te openen’."));
    return url;
  }

  function makePdf() {
    buildPrintReport();
    const blob = buildPdfBlob();
    offerPdf(blob, safeFilename());
    return blob;
  }

  function printBlob(blob) {
    const url = URL.createObjectURL(blob);
    const fallback = document.getElementById("pdf-fallback");
    const link = document.getElementById("pdf-fallback-link");
    if (link) {
      if (link.dataset.prev) URL.revokeObjectURL(link.dataset.prev);
      link.href = url;
      link.setAttribute("download", safeFilename());
      link.dataset.prev = url;
    }
    if (fallback) fallback.hidden = false;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Romfix PDF");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = function () {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (_) {
        window.open(url, "_blank");
      }
    };
    setShareStatus(tx("Printvenster geopend. Kies ‘Opslaan als PDF’ voor een kopie."));
  }

  function printPdf() {
    buildPrintReport();
    const mobile = inAppBrowser() || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || "");
    if (mobile) {
      offerPdf(buildPdfBlob(), safeFilename());
      return;
    }
    document.body.classList.add("printing");
    window.print();
    setTimeout(function () {
      document.body.classList.remove("printing");
    }, 800);
  }

  function downloadPdf() {
    const btn = document.getElementById("btnDownloadPdf");
    if (btn) {
      btn.disabled = true;
      btn.textContent = tx("PDF maken…");
    }
    try {
      makePdf();
    } catch (err) {
      console.error(err);
      alert(tx("PDF maken lukte niet. Probeer Chrome of Safari, niet de in-app browser van Telegram."));
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = tx("Download PDF");
      }
    }
  }

  function mailResult() {
    const r = collectReport();
    const titel = r.title;
    const url = r.share;
    const body = (titel + "\n\n" + url + "\n\n" + resultText()).slice(0, 1800);
    try {
      makePdf();
    } catch (_) {}
    location.href =
      "mailto:?subject=" + encodeURIComponent(titel) + "&body=" + encodeURIComponent(body);
  }

  async function copyShareLink() {
    const url = shareUrl();
    try {
      history.replaceState(null, "", url);
    } catch (_) {}
    try {
      if (navigator.share) {
        await navigator.share({
          title: projectNaam() || tx("Romfix-berekening"),
          text: tx("Romfix berekening"),
          url: url,
        });
        setShareStatus(tx("Gedeeld."));
        return;
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus(tx("Korte link gekopieerd."));
    } catch (_) {
      window.prompt(tx("Kopieer deze link:"), url);
    }
  }

  function bindExport() {
    const printBtn = document.getElementById("btnPrintPdf");
    const dlBtn = document.getElementById("btnDownloadPdf");
    const mailBtn = document.getElementById("btnMail");
    const shareBtn = document.getElementById("btnShare");
    if (printBtn) printBtn.addEventListener("click", printPdf);
    if (dlBtn) dlBtn.addEventListener("click", downloadPdf);
    if (mailBtn) mailBtn.addEventListener("click", mailResult);
    if (shareBtn) shareBtn.addEventListener("click", copyShareLink);
  }

  window.RomfixExport = {
    printPdf: printPdf,
    downloadPdf: downloadPdf,
    buildPdfBlob: buildPdfBlob,
    buildPrintReport: buildPrintReport,
    collectReport: collectReport,
  };

  loadPreset("roadbase");
  restoreFromUrl();
  bindExport();
  bindMaaiveld();
  document.querySelectorAll(".stap-jump").forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectLayer(btn.getAttribute("data-stap"));
    });
  });
  if (window.RomfixI18n) {
    window.RomfixI18n.onChange = function () {
      if (expertToggleEl) {
        expertToggleEl.textContent = expertMode ? tx("Standaard modus") : tx("Expert mode");
      }
      if (tableToggleEl && tableWrapEl) {
        tableToggleEl.textContent = tableWrapEl.hidden ? tx("Uitklappen") : tx("Inklappen");
      }
      render();
    };
    window.RomfixI18n.bind();
  }
  render();
})();