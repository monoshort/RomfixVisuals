(function () {
  const OVERHOOGTE_GEWAP_MAX = 150;
  /** Standaard producthoogte funderingswapening (mm) */
  const WAP_FUNDERING_KEUZES = [100, 150, 200];
  /** Werkingsdikte = standaardhoogte + dit bedrag */
  const WAP_FUNDERING_WERKING_EXTRA = 150;

  /** Support Improvement Factor / Modules Improvement Factor (Romfix-terminologie). */
  const SIF_NAME = "Support Improvement Factor";
  const MIF_NAME = "Modules Improvement Factor";

  /**
   * Wapeningsconfiguratie — zelfde ids/labels als prive/Romfix (script.js, live-berekeningen/kern.js).
   * SIF vast per type (Chris/Excel: 5,0 · 7,6 · 10,0) → D19/D20.
   */
  const WAPENING_TYPES = [
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
      wapFundering: 150,
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
      wapFundering: 150,
      wapOgv: 250,
      sifFundering: 10,
      sifOgv: 10,
      mifFundering: 4.3,
      mifOgv: 3.8,
      funderingModus: "vrij",
      labels: { fund: "Fundering + overhoogte", ogv: "Ondergrond verbetering" },
    },
  };

  const MATERIAAL_LAAG = [
    { label: "Menggranulaat", mpa: 400 },
    { label: "Hydraulisch menggranulaat", mpa: 600 },
    { label: "Metselwerkpuin", mpa: 150 },
    { label: "Steenslag/steenmengsels", mpa: 150 },
    { label: "BIMS", mpa: 125 },
    { label: "Schuimglas", mpa: 50 },
  ];

  const MATERIAAL_ONDERGROND = [
    { label: "Zand", mpa: 100 },
    { label: "Goed gegradeerd zand", mpa: 120 },
    { label: "Vaste klei", mpa: 50 },
    { label: "Veen/slappe klei", mpa: 30 },
  ];

  const MATERIAAL_ALLE = MATERIAAL_LAAG.concat(MATERIAAL_ONDERGROND);

  /** BIMS / schuimglas vereisen een dragende druklaag erboven (Thenn + wapening). */
  const LICHT_FUNDERING_LABELS = ["BIMS", "Schuimglas"];
  const DRUKLAAG_DEFAULT_MM = 150;
  const DRUKLAAG_MIN_MM = 80;
  const LICHT_MIN_MM = 50;
  const MATERIAAL_DRUKLAAG = MATERIAAL_LAAG.filter(function (m) {
    return LICHT_FUNDERING_LABELS.indexOf(m.label) < 0;
  });

  /** Vaste equivalente E van hele bovenconstructie (geen Romfix) */
  const BOVEN_E_EQUIVALENT = 5000;
  const BOVEN_LAGEN = [
    {
      id: "klinkers",
      dikteKey: "bovenKlinkers",
      label: "Klinkers",
      note: "ca. 5 cm",
      defaultMm: 50,
      min: 0,
      max: 100,
      step: 5,
      cls: "klinkers",
    },
    {
      id: "asfalt",
      dikteKey: "bovenAsfalt",
      label: "Asfalt",
      note: "max 18 cm",
      defaultMm: 180,
      min: 0,
      max: 180,
      step: 10,
      cls: "asfalt",
    },
    {
      id: "beton",
      dikteKey: "bovenBeton",
      label: "Beton",
      note: "20–25 cm",
      defaultMm: 225,
      min: 200,
      max: 250,
      step: 5,
      cls: "beton",
    },
  ];

  /** Onder klinkers — telt mee in bovenconstructie */
  const BOVEN_STRAATZAND = {
    dikteKey: "bovenStraatzand",
    label: "Straatzand",
    note: "onder klinkers, max 20 cm",
    defaultMm: 40,
    min: 0,
    max: 200,
    step: 10,
  };

  const LAYERS = [
    {
      id: "boven",
      label: "Bovenconstructie",
      hint: "Kies één toplaag (klinkers, asfalt of beton). Bij klinkers: straatzand eronder — samen bovenconstructie.",
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
      label: "Licht fundering",
      hint: "BIMS of schuimglas — gewapend met Romfix SIF 10 (E'Grid + R'Cel).",
    },
    "fund-druk": {
      label: "Druklaag",
      hint: "Dragende laag boven licht vulmateriaal; altijd voorzien van geogrid (SIF 5).",
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
        { key: "funderingBasis", label: "Fundering (nominaal)", unit: "mm", min: 50, max: 500, step: 10 },
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
          min: 80,
          max: 400,
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
          label: "Standaard hoogte wapening",
          unit: "mm",
          choices: WAP_FUNDERING_KEUZES,
        },
      ],
    },
    ogv: {
      dikte: [{ key: "ogvDikte", label: "Dikte laag", unit: "mm", min: 50, max: 600, step: 10 }],
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
  let wapeningFund = true;
  let wapeningOgv = true;
  let selected = "onder";
  let values = {};
  let materiaalKeuze = { eFundering: "", eDruklaag: "", eOgv: "", eOndergrond: "" };

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
  const guideToggleEl = document.getElementById("guide-toggle");
  const guidePanelEl = document.getElementById("guide-panel");
  const tableToggleEl = document.getElementById("table-toggle");
  const tableWrapEl = document.getElementById("table-wrap");
  const expertLoginEl = document.getElementById("expert-login");
  const expertPasswordEl = document.getElementById("expert-password");
  const expertLoginErrorEl = document.getElementById("expert-login-error");
  const expertLoginSubmitEl = document.getElementById("expert-login-submit");
  const expertLoginCancelEl = document.getElementById("expert-login-cancel");

  let expertMode = false;
  let expertDashBuilt = false;
  let expertEventsBound = false;
  const WAPENING_LICHT_TYPE = "grid_cell";
  const WAPENING_DRUKLAAG_TYPE = "grid_only";

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
      key === "eDruklaag"
    );
  }

  function normalizeLichtFunderingLabel(label) {
    if (!label) return "";
    const s = String(label).trim();
    if (s === "Schuimglas" || s === "schuimglas" || s === "Glasschuim" || s === "glasschuim") {
      return "Schuimglas";
    }
    if (s === "BIMS" || s === "bims") return "BIMS";
    return "";
  }

  function isLichtFunderingLabel(label) {
    return (
      LICHT_FUNDERING_LABELS.indexOf(label) >= 0 ||
      normalizeLichtFunderingLabel(label) !== ""
    );
  }

  function normalizeMateriaalKeuzeAliases() {
    const licht = normalizeLichtFunderingLabel(materiaalKeuze.eFundering);
    if (licht) materiaalKeuze.eFundering = licht;
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
      const licht = lichtFunderingEntryForLabel(chosen);
      return licht ? values.eFundering === licht.mpa : true;
    }
    const m = MATERIAAL_LAAG.find(function (x) {
      return x.mpa === values.eFundering;
    });
    return !!(m && isLichtFunderingLabel(m.label));
  }

  function isDruklaagActief() {
    return isLichtFunderingActive();
  }

  function clampDruklaagDiktes() {
    if (!isDruklaagActief()) return;
    const basis = values.funderingBasis || 0;
    let druk = Number(values.druklaagDikte) || DRUKLAAG_DEFAULT_MM;
    druk = Math.max(DRUKLAAG_MIN_MM, Math.min(basis - LICHT_MIN_MM, druk));
    if (basis < DRUKLAAG_MIN_MM + LICHT_MIN_MM) {
      druk = Math.max(DRUKLAAG_MIN_MM, Math.min(basis, druk));
    }
    values.druklaagDikte = druk;
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
      lockLichtWapeningTypes();
      if (!wasDruklaag && selected === "fund") selected = "fund-druk";
    } else {
      values.druklaagAan = false;
      values.eLichtFundering = values.eFundering;
      values.sifLicht = 0;
      values.mifLicht = 0;
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

  function lockLichtWapeningTypes() {
    const druk = wapeningTypeById(WAPENING_DRUKLAAG_TYPE);
    const licht = wapeningTypeById(WAPENING_LICHT_TYPE);
    if (druk) {
      values.wapTypeFund = druk.id;
      values.sifFundering = druk.sif;
    }
    if (licht) {
      values.sifLicht = licht.sif;
    }
  }

  function syncMifFromWapening() {
    if (typeof window.RomfixMif === "undefined") return;
    if (isDruklaagActief()) lockLichtWapeningTypes();
    if (wapeningFund) {
      const onderbouw = mifOnderbouwFund();
      if (isDruklaagActief()) {
        const drukInfo = window.RomfixMif.lookupMif(
          WAPENING_DRUKLAAG_TYPE,
          onderbouw,
          values.eDruklaag || values.eFundering
        );
        values.mifFundering = drukInfo.mif;
        mifLookupMeta.fund = drukInfo;
        const lichtInfo = window.RomfixMif.lookupMif(
          WAPENING_LICHT_TYPE,
          onderbouw,
          values.eLichtFundering || values.eFundering
        );
        values.mifLicht = lichtInfo.mif;
        values.sifLicht = (wapeningTypeById(WAPENING_LICHT_TYPE) || {}).sif || 10;
        mifLookupMeta.licht = lichtInfo;
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
    return layer === "fund" ? "D19" : "D20";
  }

  function mifExcelRef(layer) {
    return layer === "fund" ? "E19" : "E20";
  }

  function sifFieldLabel(layer) {
    return sifExcelRef(layer) + " SIF (-) · " + SIF_NAME;
  }

  function mifFieldLabel(layer) {
    return mifExcelRef(layer) + " MIF (-) · " + MIF_NAME;
  }

  function wapeningOptionLabel(t) {
    return t.label + " — " + t.product + " (SIF " + formatFactor(t.sif) + ")";
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
      return (
        "Automatisch uit ROMFIX " +
        MIF_NAME +
        " (MIF)-tabel (2D: stijfheid onderbouw × stijfheid invulling E In)."
      );
    }
    let extra =
      layer === "fund"
        ? " Onderbouw-as = ongewapende equivalente E onder fundering (D14)."
        : " Onderbouw-as = E-modulus ondergrond (C15).";
    return (
      "ROMFIX-tabel <strong>" +
      info.tabel +
      "</strong> · stijfheid onderbouw " +
      info.eOnderbouw +
      " MPa × E In " +
      info.eInfill +
      " MPa (2D-interpolatie)." +
      extra
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

  function wapeningForLayer(id) {
    if (id === "fund") return wapeningFund;
    if (id === "ogv") return wapeningOgv;
    return false;
  }

  function normalizeWapFundering(mm) {
    const n = Number(mm);
    if (WAP_FUNDERING_KEUZES.indexOf(n) >= 0) return n;
    return WAP_FUNDERING_KEUZES.reduce(function (best, opt) {
      return Math.abs(opt - n) < Math.abs(best - n) ? opt : best;
    }, WAP_FUNDERING_KEUZES[0]);
  }

  function wapFunderingWerkingsdikte(standaardMm, dikteTotaal) {
    const standaard = Number(standaardMm) || 0;
    const totaal = Number(dikteTotaal) || 0;
    return Math.min(totaal, standaard + WAP_FUNDERING_WERKING_EXTRA);
  }

  function fundMeta(fundWap) {
    const basis = values.funderingBasis || 0;
    const oh = values.overhoogte || 0;
    const dikteTotaal = basis + oh;
    const druklaagAan = isDruklaagActief();
    const drukBasis = druklaagAan ? Number(values.druklaagDikte) || DRUKLAAG_DEFAULT_MM : basis;
    const lichtDikte = druklaagAan ? Math.max(0, basis - drukBasis) : 0;
    const drukStackMm = druklaagAan ? drukBasis + oh : dikteTotaal;
    const ohGew = Math.min(oh, OVERHOOGTE_GEWAP_MAX);
    const ohOng = Math.max(0, oh - OVERHOOGTE_GEWAP_MAX);
    const fundOn = fundWap === undefined ? wapeningFund : fundWap;
    const standaardWap = normalizeWapFundering(values.wapFundering);
    let wapDikte = 0;
    if (fundOn) {
      /* Bij BIMS/schuimglas: hele druklaag heeft geogrid; lichtlaag is SIF 10. */
      wapDikte = druklaagAan
        ? drukStackMm
        : wapFunderingWerkingsdikte(standaardWap, drukStackMm);
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
      eLicht: values.eLichtFundering || values.eFundering,
      eDruk: values.eDruklaag || values.eFundering,
    };
  }

  function excelInvoer(fundOn, ogvOn) {
    const f = fundMeta(fundOn);
    const inp = {
      sheet,
      B12: values.bovenDikte,
      B13: f.dikteTotaal,
      B14: values.ogvDikte,
      C13: f.druklaagAan ? f.eDruk : values.eFundering,
      C14: values.eOgv,
      C15: values.eOndergrond,
      B19: fundOn ? f.wapDikte : 0,
      B20: ogvOn ? values.wapOgv : 0,
      D19: values.sifFundering,
      D20: values.sifOgv,
      E19: values.mifFundering,
      E20: values.mifOgv,
      F13: values.funderingModus,
    };
    if (f.druklaagAan && f.lichtDikte > 0) {
      inp.B13Licht = f.lichtDikte;
      inp.C13Licht = f.eLicht;
      inp.sifLicht = fundOn ? values.sifLicht || 10 : 0;
      inp.mifLicht = values.mifLicht;
    }
    return inp;
  }

  /** fundWap / ogvWap: expliciet per laag; undefined = huidige schakelaar */
  function runCalc(fundWap, ogvWap) {
    const fundOn = fundWap === undefined ? wapeningFund : fundWap;
    const ogvOn = ogvWap === undefined ? wapeningOgv : ogvWap;
    return window.computeRomfixWerkboek(excelInvoer(fundOn, ogvOn));
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
    if (bovenL) return bovenL.label + " + fundering";
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
    wapeningFund = true;
    wapeningOgv = true;
    materiaalKeuze = {
      eFundering: "Steenslag/steenmengsels",
      eOgv: "Steenslag/steenmengsels",
      eOndergrond: "",
    };
    const bovenToplaag = s === "capping" ? "klinkers" : "beton";
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
      bovenBeton: mm.bovenBeton,
      bovenStraatzand: straatzandMm,
      bovenDikte: (activeLaag ? activeLaag.defaultMm : 0) + straatzandMm,
      funderingBasis: p.funderingBasis,
      overhoogte: p.overhoogte,
      ogvDikte: p.ogvDikte,
      eFundering: p.eFundering,
      eOgv: p.eOgv,
      eOndergrond: p.eOndergrond,
      wapFundering: normalizeWapFundering(p.wapFundering),
      wapOgv: p.wapOgv,
      sifFundering: p.sifFundering,
      sifOgv: p.sifOgv,
      wapTypeFund: WAPENING_TYPE_DEFAULT,
      wapTypeOgv: WAPENING_TYPE_DEFAULT,
      mifFundering: 0,
      mifOgv: 0,
      funderingModus: p.funderingModus,
      druklaagAan: false,
      druklaagDikte: DRUKLAAG_DEFAULT_MM,
      eDruklaag: 150,
      eLichtFundering: p.eFundering,
      sifLicht: 0,
      mifLicht: 0,
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

  function wapeningTypeKey(layer) {
    return layer === "fund" ? "wapTypeFund" : "wapTypeOgv";
  }

  function sifKeyForLayer(layer) {
    return layer === "fund" ? "sifFundering" : "sifOgv";
  }

  function wapeningTypeLabel(typeId) {
    const t = wapeningTypeById(typeId);
    return t ? wapeningOptionLabel(t) : "—";
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
    ["fund", "ogv"].forEach(function (layer) {
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

  function wapeningTypeHtml(layer, disabled) {
    const lockedLicht = layer === "fund" && isDruklaagActief();
    if (lockedLicht) disabled = true;
    const typeKey = wapeningTypeKey(layer);
    const sifKey = sifKeyForLayer(layer);
    const curType = normalizeWapeningId(
      lockedLicht ? WAPENING_DRUKLAAG_TYPE : values[typeKey] || WAPENING_TYPE_DEFAULT
    );
    const cur = wapeningTypeById(curType);
    let opts = "";
    WAPENING_TYPES.forEach(function (t) {
      opts +=
        '<option value="' +
        t.id +
        '" title="SIF ' +
        formatFactor(t.sif) +
        " — " +
        SIF_NAME +
        '"' +
        (curType === t.id ? " selected" : "") +
        ">" +
        wapeningOptionLabel(t) +
        "</option>";
    });
    return (
      '<div class="field wapening-type-field' +
      (disabled ? " field--disabled" : "") +
      '">' +
      '<label class="materiaal-label" for="wap-type-' +
      layer +
      '">Wapeningsconfiguratie</label>' +
      '<select id="wap-type-' +
      layer +
      '" class="wapening-type-select" data-layer="' +
      layer +
      '"' +
      (disabled ? " disabled" : "") +
      ">" +
      opts +
      "</select>" +
      '<p class="field-note" id="wap-type-note-' +
      layer +
      '">' +
      sifFieldLabel(layer) +
      ': <strong>' +
      formatFactor(values[sifKey]) +
      "</strong>" +
      (cur ? " · " + cur.product : "") +
      "</p>" +
      (lockedLicht
        ? '<p class="field-note">Vast bij BIMS/schuimglas: druklaag = geogrid (SIF 5). Het lichte vulmateriaal eronder = Romfix SIF 10.</p>'
        : "") +
      factorLegendNote() +
      "</div>"
    );
  }

  function applyWapeningType(layer, typeId) {
    if (layer === "fund" && isDruklaagActief()) return;
    const t = wapeningTypeById(typeId);
    if (!t) return;
    values[wapeningTypeKey(layer)] = t.id;
    values[sifKeyForLayer(layer)] = t.sif;
    syncMifFromWapening();
    invalidateCalcCache();
    if (expertMode) {
      refreshExpertLive();
      return;
    }
    if (selected === "fund" || selected === "ogv" || selected === "onder") {
      renderPanel();
    }
    syncMateriaalEquivalentNotes();
    renderPakketSummary();
    renderVisual();
    renderTable();
    renderLayerTabs();
  }

  const VISUAL_PX_PER_MM = 0.55;
  const VISUAL_HEIGHT_MIN = 280;
  const VISUAL_HEIGHT_MAX = 960;
  const GROND_VISUAL_RATIO = 0.075;
  /** Minimale hoogte in profiel als laag 0 mm is — blijft zichtbaar met label + MPa */
  const MIN_LAYER_VISUAL_PX = 48;

  function factor(ong, gew) {
    return ong > 0 ? Math.round((gew / ong) * 10) / 10 : "—";
  }

  function bovenLaagAan(laag) {
    return values.bovenToplaag === laag.id;
  }

  function bovenActieveLaag() {
    return BOVEN_LAGEN.find(function (L) {
      return L.id === values.bovenToplaag;
    });
  }

  function bovenLaagMm(laag) {
    return bovenLaagAan(laag) ? values[laag.dikteKey] || 0 : 0;
  }

  function bovenStraatzandActief() {
    return values.bovenToplaag === "klinkers";
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
    if (L.id === "klinkers" && sz > 0) {
      return L.label + " " + mm + " + straatzand " + sz;
    }
    return L.label + " " + mm;
  }

  function bovenOmschrijving() {
    const top = bovenTopDikteSum();
    if (top <= 0) return "geen toplaag";
    return bovenDikteOmschrijving();
  }

  function syncBovenDikte() {
    values.bovenDikte = bovenTopDikteSum();
  }

  function bovenLagenSectionHtml() {
    const active = bovenActieveLaag();
    let html =
      '<div class="field-section">' +
      '<div class="field-section-title">Kies toplaag</div>' +
      '<p class="field-note">Één laag: klinkers, asfalt of beton.</p>' +
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
    if (active) {
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
      html +=
        '<div class="field boven-laag-field boven-laag-field--sub">' +
        '<p class="field-note">Laag tussen klinkers en onderconstructie — schaal in profiel beweegt mee (0–200 mm).</p>' +
        fieldHtml(
          {
            key: BOVEN_STRAATZAND.dikteKey,
            label: "Dikte straatzand (max 20 cm)",
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
      "<strong>· Fundering:</strong> " +
      f.dikteTotaal +
      " mm<br>" +
      "<strong>· " + ogvLabel() + ":</strong> " +
      values.ogvDikte +
      " mm<br>" +
      pakketPanelLine() +
      "</div>"
    );
  }

  function onderconstructieOverviewHtml() {
    const f = fundMeta(wapeningFund);
    const p = PRESETS[sheet];
    return (
      '<div class="field-section">' +
      '<div class="field-section-title">Deellagen</div>' +
      '<div class="onder-sub-btns">' +
      '<button type="button" class="layer-jump" data-jump="fund">' +
      p.labels.fund +
      " · " +
      f.dikteTotaal +
      " mm" +
      (wapeningFund ? ' <span class="wap-badge">W</span>' : "") +
      "</button>" +
      '<button type="button" class="layer-jump" data-jump="ogv">' +
      p.labels.ogv +
      " · " +
      values.ogvDikte +
      " mm" +
      (wapeningOgv ? ' <span class="wap-badge">W</span>' : "") +
      "</button>" +
      "</div></div>" +
      laagMateriaalInlineHtml("fund", p.labels.fund) +
      laagMateriaalInlineHtml("ogv", p.labels.ogv)
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

  function laagMateriaalInlineHtml(layerKey, label) {
    const materiaal = FIELDS[layerKey].materiaal;
    if (!materiaal.length) return "";
    const lichtModus = layerKey === "fund" && isDruklaagActief();
    return (
      '<div class="field-section field-section--' +
      layerKey +
      '-materiaal">' +
      '<div class="field-section-title">' +
      label +
      (lichtModus ? " · Licht vulmateriaal (BIMS/schuimglas)" : " · Materiaal") +
      "</div>" +
      (lichtModus
        ? '<p class="field-note">Wijzig hier het licht materiaal, niet de druklaag. Of kies ↩ standaard fundering.</p>'
        : "") +
      materiaal
        .map(function (f) {
          return materiaalFieldHtml(f);
        })
        .join("") +
      (lichtModus ? exitLichtFunderingBtnHtml() : "") +
      materiaalEquivalentHtml(layerKey) +
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
    return (
      '<div class="panel-extra">' +
      "<strong>Toplaag:</strong> " +
      (L ? L.label + " · " + bovenLaagMm(L) + " mm" : "geen") +
      (sz > 0 ? "<br><strong>Straatzand:</strong> " + sz + " mm" : "") +
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

  function renderPakketSummary() {
    if (!pakketSummaryEl) return;
    const pk = pakketMeta();
    const m = (pk.totaal / 1000).toFixed(2).replace(".", ",");
    pakketSummaryEl.innerHTML =
      '<div class="kpi-bar__main">' +
      '<span class="kpi-bar__label">Pakketdikte</span>' +
      '<span class="kpi-bar__value">' +
      pk.totaal +
      ' <small>mm</small> <span class="kpi-bar__m">(' +
      m +
      " m)</span></span></div>" +
      '<div class="kpi-bar__chips">' +
      '<span class="kpi-chip">Boven <strong>' +
      pk.boven +
      " mm</strong></span>" +
      '<span class="kpi-chip">Fundering <strong>' +
      pk.fundering +
      " mm</strong></span>" +
      '<span class="kpi-chip">' +
      ogvLabel() +
      ' <strong>' +
      pk.ogv +
      " mm</strong></span>" +
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

  function flexMm(mm) {
    return Math.max(0, Number(mm) || 0);
  }

  function flexStyle(mm, placeholder) {
    const w = flexMm(mm);
    if (w <= 0) {
      if (placeholder) {
        return "flex:0 0 auto;min-height:" + MIN_LAYER_VISUAL_PX + "px";
      }
      return "flex:0 0 0;min-height:0;display:none";
    }
    return "flex:" + w + " 1 0;min-height:0";
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
    if (id === "onder") return selected === "onder" || isOnderGroep(selected);
    if (id === "fund" && (selected === "fund-licht" || selected === "fund-druk")) return true;
    return selected === id;
  }

  function druklaagSectionHtml(disabled) {
    if (!isDruklaagActief()) return "";
    const f = fundMeta(wapeningFund);
    let html =
      '<div class="field-section druklaag-section">' +
      '<div class="field-section-title">Druklaag (automatisch)</div>' +
      '<p class="field-note">Licht vulmateriaal (BIMS/schuimglas) krijgt Romfix SIF 10. Deze druklaag erboven krijgt geogrid (SIF 5), ' +
      f.drukStackMm +
      " mm incl. overhoogte.</p>";
    FIELDS.fund.druklaag.forEach(function (fld) {
      html += fieldHtml(fld, disabled);
    });
    html += materiaalSectionHtml(
      [{ key: "eDruklaag", label: "E-modulus druklaag", unit: "MPa", min: 30, max: 600, step: 5 }],
      null
    );
    html +=
      '<p class="field-note">Alleen de druklaag wijzigen laat BIMS/schuimglas staan. Gebruik ↩ terug voor één funderingslaag.</p>';
    html += exitLichtFunderingBtnHtml();
    html += "</div>";
    return html;
  }

  function fundLichtPanelHtml() {
    const f = fundMeta(wapeningFund);
    return (
      '<div class="field-section">' +
      '<div class="field-section-title">Licht fundering</div>' +
      '<p class="field-note">Automatisch actief bij BIMS of schuimglas. Deze laag is gewapend met Romfix SIF 10 (E\'Grid + R\'Cel). Kies een granulaat of ↩ standaard fundering om terug te gaan.</p>' +
      (wapeningFund
        ? '<p class="field-note"><strong>SIF 10</strong> · MIF ' +
          formatFactor(values.mifLicht || 0) +
          " · hele laagdikte " +
          f.lichtDikte +
          " mm.</p>"
        : '<p class="field-note">Wapening staat uit — licht vulmateriaal telt dan ongewapend.</p>') +
      materiaalSectionHtml(FIELDS.fund.materiaal, null) +
      exitLichtFunderingBtnHtml() +
      '<p class="field-note">Dikte licht laag: <strong>' +
      f.lichtDikte +
      " mm</strong> (rest van nominale fundering " +
      f.basis +
      " mm na druklaag).</p></div>"
    );
  }

  function visualLayerInner(name, mm, mpa) {
    const mmHtml =
      mm != null && mm >= 0
        ? '<span class="visual-layer__mm">' + Math.round(mm) + " mm</span>"
        : "";
    const mpaHtml = mpa ? '<span class="visual-layer__mpa">' + mpa + "</span>" : "";
    return (
      '<span class="visual-layer__name">' +
      name +
      "</span>" +
      '<span class="visual-layer__vals">' +
      mmHtml +
      mpaHtml +
      "</span>"
    );
  }

  function segmentBtn(id, cls, name, mm, mpa, hMm, placeholder) {
    const h = flexMm(hMm);
    const show = h > 0 || placeholder;
    if (!show) return "";
    const sel = layerSelected(id) ? " visual-layer--selected" : "";
    const title =
      name +
      (mm != null && mm > 0 ? " · " + Math.round(mm) + " mm" : mm === 0 ? " · 0 mm" : "") +
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
      visualLayerInner(name, mm, mpa) +
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
      '" style="' +
      flexStyle(mm, placeholder) +
      '">' +
      innerHtml +
      "</div>"
    );
  }

  function selectLayer(id) {
    selected = id;
    renderPanel();
    renderVisual();
    renderLayerTabs();
    renderTable();
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

  function wapeningToggleHtml(layerId) {
    const on = wapeningForLayer(layerId);
    return (
      '<label class="toggle toggle--panel">' +
      '<input type="checkbox" id="wapening-layer"' +
      (on ? " checked" : "") +
      " />" +
      '<span class="toggle-ui"></span>' +
      "<span><strong>Romfix-wapening</strong> op deze laag</span>" +
      '<span class="toggle-status">' +
      (on ? "Aan" : "Uit") +
      "</span></label>"
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
        ? "<strong>Standaard hoogte:</strong> " +
          f.standaardWap +
          " mm<br><strong>Werkingsdikte:</strong> " +
          f.wapDikte +
          " mm (" +
          f.standaardWap +
          " + " +
          WAP_FUNDERING_WERKING_EXTRA +
          ", max. " +
          f.dikteTotaal +
          " mm fundering)" +
          (f.wapDikte < f.standaardWap + WAP_FUNDERING_WERKING_EXTRA
            ? " · <em>begrensd door fundering</em>"
            : "") +
          "<br>" +
          (f.ohOng > 0
            ? '<strong class="warn">Ongewapend:</strong> ' + f.ohOng + " mm overhoogte<br>"
            : "") +
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
    const v = values[key];
    const chosen = normalizeLichtFunderingLabel(materiaalKeuze[key]) || materiaalKeuze[key];
    if (chosen) {
      const exact = list.find(function (m) {
        return m.label === chosen && m.mpa === v;
      });
      if (exact) return exact;
      const byLabel = list.find(function (m) {
        return m.label === chosen || normalizeLichtFunderingLabel(m.label) === chosen;
      });
      if (byLabel) return byLabel;
    }
    return list.find(function (m) {
      return m.mpa === v;
    });
  }

  function syncMateriaalKeuzeFromValues(key) {
    if (!materiaalListForKey(key).length) return;
    const m = materiaalMatch(key);
    materiaalKeuze[key] = m ? m.label : "";
  }

  function materiaalSelectOptions(key) {
    const list = materiaalListForKey(key);
    const v = values[key];
    const match = materiaalMatch(key);
    let html = '<option value="">— Kies materiaal —</option>';
    if (key === "eFundering" && isDruklaagActief()) {
      html +=
        '<option value="__exit__|Standaard fundering">↩ Standaard fundering (geen BIMS/schuimglas)</option>';
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
        " MPa)</option>";
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

  function materiaalFieldHtml(f) {
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
      fieldHtml(f, false) +
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
    const sel = document.getElementById("mat-" + key);
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
        ? '<p class="field-note">Verhoogt de totale funderingdikte (max. werkingsdikte wapening).</p>'
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
          label: BOVEN_STRAATZAND.label,
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
    values[key] = field.choices
      ? Number(raw)
      : field.step < 1
        ? parseFloat(raw)
        : Number(raw);
    if (key === "wapFundering") {
      values.wapFundering = normalizeWapFundering(values.wapFundering);
    }
    if (key.indexOf("boven") === 0 && key.indexOf("Aan") < 0) {
      syncBovenDikte();
    }
    const valEl = document.getElementById("v-" + key);
    const slider = document.getElementById("f-" + key);
    if (valEl) valEl.textContent = values[key] + " " + field.unit;
    if (slider) slider.value = values[key];
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
    if (key === "eFundering") {
      syncDruklaagFromFundering();
      if (!expertMode) {
        invalidateCalcCache();
        render();
        return;
      }
    }
    if (key === "funderingBasis" || key === "druklaagDikte") {
      clampDruklaagDiktes();
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
      return;
    }
    if (
      selected === "fund" &&
      (key === "wapFundering" || key === "funderingBasis" || key === "overhoogte")
    ) {
      renderPanel();
    } else if (selected === "fund") {
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
      const extraGrond = panelFields.querySelector(".panel-extra");
      if (extraGrond) {
        if (selected === "grond") extraGrond.outerHTML = grondPanelExtra();
        else if (selected === "fund") extraGrond.outerHTML = fundPanelExtra();
        else if (selected === "ogv") extraGrond.outerHTML = ogvPanelExtra();
      }
    }
    syncMateriaalEquivalentNotes();
    renderPakketSummary();
    renderVisual();
    renderTable();
    renderLayerTabs();
  }

  function renderPanel() {
    const panelId = selected;
    const meta = panelLayerMeta(panelId);
    const groups = FIELDS[panelId] || (isFundSubLayer(panelId) ? FIELDS.fund : FIELDS.onder);
    const wapLayer = panelId === "fund-druk" ? "fund" : panelId;
    const layerWap = wapeningForLayer(wapLayer);
    const hasWap =
      panelId === "fund-druk" || panelId === "ogv" || (panelId === "fund" && !isDruklaagActief());

    panelTitle.textContent = meta ? meta.label : "Laag";
    panelHint.textContent = meta ? meta.hint : "";

    let html = panelId === "boven" ? bovenLagenSectionHtml() : "";
    if (panelId === "onder") {
      html += onderconstructieOverviewHtml();
    } else if (panelId === "fund-licht") {
      html += fundLichtPanelHtml();
    } else if (panelId === "fund-druk") {
      html += druklaagSectionHtml(false);
      html += '<div class="field-section"><div class="field-section-title">Wapening (druklaag)</div>';
      html += wapeningToggleHtml("fund");
      html += wapeningTypeHtml("fund", !layerWap);
      html += mifDisplayHtml("fund", !layerWap);
      if (!layerWap) {
        html += '<p class="field-note">Wapening staat uit — druklaag telt dan als ongewapend granulaat, licht vulmateriaal zonder SIF 10.</p>';
      } else {
        html +=
          '<p class="field-note">Geogrid over de hele druklaag (' +
          fundMeta(true).drukStackMm +
          " mm). Geen geocel-hoogte op deze laag.</p>";
      }
      html += "</div>";
    } else if (groups && groups.dikte && groups.dikte.length) {
      html += sectionHtml("Dikte", groups.dikte, false);
      if (panelId === "fund" && isDruklaagActief()) {
        html += druklaagSectionHtml(false);
        html +=
          '<p class="field-note">Klik <strong>Druklaag</strong> of <strong>Licht fundering</strong> in het profiel voor wapening / materiaal per deel.</p>';
      }
    }
    if (
      groups &&
      groups.materiaal &&
      groups.materiaal.length &&
      panelId !== "fund-licht" &&
      panelId !== "fund-druk"
    ) {
      const matLayer =
        panelId === "fund" || panelId === "ogv" || panelId === "grond" ? panelId : null;
      const lichtModus = panelId === "fund" && isDruklaagActief();
      const matLabel = lichtModus ? "Licht vulmateriaal (BIMS/schuimglas)" : "Materiaal";
      html +=
        '<div class="field-section"><div class="field-section-title">' +
        matLabel +
        "</div>" +
        (lichtModus
          ? '<p class="field-note">Druklaag-materiaal wijzigen laat BIMS/schuimglas in het profiel staan.</p>'
          : "") +
        groups.materiaal
          .map(function (f) {
            return materiaalFieldHtml(f);
          })
          .join("") +
        (lichtModus ? exitLichtFunderingBtnHtml() : "") +
        (matLayer ? materiaalEquivalentHtml(matLayer) : "") +
        "</div>";
    }
    if (hasWap && panelId !== "fund-druk") {
      html += '<div class="field-section"><div class="field-section-title">Wapening</div>';
      html += wapeningToggleHtml(wapLayer);
      html += wapeningTypeHtml(wapLayer, !layerWap);
      wapeningFieldsExceptSif(wapLayer).forEach(function (f) {
        html += fieldHtml(f, !layerWap);
      });
      html += mifDisplayHtml(wapLayer, !layerWap);
      if (!layerWap) {
        html += '<p class="field-note">Wapening staat uit — dikte wordt pas meegenomen als je wapening aanzet.</p>';
      }
      html += "</div>";
    }
    html +=
      panelId === "boven"
        ? bovenPanelExtra()
        : panelId === "onder"
          ? onderPanelExtra()
          : panelId === "fund" || panelId === "fund-druk"
            ? fundPanelExtra()
            : panelId === "fund-licht"
              ? '<div class="panel-extra">' + pakketPanelLine() + "</div>"
              : panelId === "ogv"
                ? ogvPanelExtra()
                : panelId === "grond"
                  ? grondPanelExtra()
                  : "";

    panelFields.innerHTML = html;

    const wapEl = document.getElementById("wapening-layer");
    if (wapEl) {
      wapEl.addEventListener("change", function () {
        if (selected === "fund" || selected === "fund-druk") wapeningFund = wapEl.checked;
        if (selected === "ogv") wapeningOgv = wapEl.checked;
        render();
      });
    }

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
        syncBovenDikte();
        render();
      });
    });

    const fields =
      selected === "onder"
        ? FIELDS.fund.materiaal.concat(FIELDS.ogv.materiaal)
        : selected === "fund-licht"
          ? FIELDS.fund.materiaal
          : selected === "fund-druk"
            ? FIELDS.fund.druklaag.concat([
                { key: "eDruklaag", label: "E-modulus druklaag", unit: "MPa", min: 30, max: 600, step: 5 },
              ]).concat(FIELDS.fund.wapening)
            : selected === "fund" ||
                selected === "ogv" ||
                selected === "boven" ||
                selected === "grond"
              ? allFieldsForLayer(selected).concat(
                  selected === "fund" && isDruklaagActief() ? FIELDS.fund.druklaag : []
                )
              : [];

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

    panelFields.querySelectorAll(".materiaal-select").forEach(function (sel) {
      sel.addEventListener("change", function () {
        if (!sel.dataset.key || !sel.value) return;
        handleMateriaalSelectChange(sel.dataset.key, sel.value, fields);
      });
    });

    panelFields.querySelectorAll("input[type=range]:not([disabled])").forEach(function (el) {
      el.addEventListener("input", function () {
        applyFieldValue(el.dataset.key, el.value, fields);
      });
    });
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
        "Licht fundering";
      const eqDruk = fundOn
        ? mpaVal(gew.state.C26 || f.eDruk)
        : mpaVal(f.eDruk);

      if (f.drukStackMm > 0) {
        parts.push(
          segmentBtn(
            "fund-druk",
            "druk",
            fundOn ? "Druklaag · geogrid" : "Druklaag",
            f.drukStackMm,
            eqDruk,
            f.drukStackMm,
            placeholder
          )
        );
      }
      if (f.lichtDikte > 0) {
        const lichtEq = fundOn
          ? mpaVal(gew.state.C27 || f.eLicht)
          : mpaVal(f.eLicht);
        parts.push(
          segmentBtn(
            "fund-licht",
            "licht",
            lichtLabel,
            f.lichtDikte,
            lichtEq,
            f.lichtDikte
          )
        );
      }
      if (!parts.length) {
        parts.push(
          segmentBtn(
            "fund-druk",
            "druk",
            "Druklaag",
            f.dikteTotaal,
            eqDruk,
            f.dikteTotaal,
            placeholder
          )
        );
      }
      return visualStack("fund", f.dikteTotaal, parts.join(""), placeholder);
    }

    const zoneId = "fund";
    const zonePrefix = p.labels.fund;

    if (!fundOn) {
      parts.push(
        segmentBtn(zoneId, "fund", p.labels.fund, f.dikteTotaal, eqOng, f.dikteTotaal, placeholder)
      );
      return visualStack("fund", f.dikteTotaal, parts.join(""), placeholder);
    }

    if (f.ohOng > 0) {
      parts.push(
        segmentBtn(
          zoneId,
          "ongew",
          zonePrefix + " · oh ongew.",
          f.ohOng,
          fundOhOngEquivMpa(st, f),
          f.ohOng
        )
      );
    }

    const restOngHoog = Math.max(0, (st.B25 || 0) - f.ohOng);
    if (restOngHoog > 0) {
      parts.push(
        segmentBtn(
          zoneId,
          "ongew",
          zonePrefix + " · ongew. boven",
          Math.round(restOngHoog),
          fundSegmentEquivMpa(st, "ongewTop"),
          restOngHoog
        )
      );
    }

    if (f.ohGew > 0 && (st.B26 || 0) > 0) {
      parts.push(
        segmentBtn(
          zoneId,
          "gewap",
          zonePrefix + " · oh gew.",
          f.ohGew,
          fundSegmentEquivMpa(st, "gewap"),
          f.ohGew
        )
      );
    }

    const basisGew = Math.max(0, (st.B26 || 0) - f.ohGew);
    if (basisGew > 0) {
      parts.push(
        segmentBtn(
          zoneId,
          "gewap",
          zonePrefix + " · gewapend",
          Math.round(basisGew),
          fundSegmentEquivMpa(st, "gewap"),
          basisGew
        )
      );
    } else if ((st.B26 || 0) > 0 && f.ohGew === 0) {
      parts.push(
        segmentBtn(
          zoneId,
          "gewap",
          zonePrefix,
          Math.round(st.B26),
          fundSegmentEquivMpa(st, "gewap"),
          st.B26
        )
      );
    }

    if ((st.B27 || 0) > 0) {
      parts.push(
        segmentBtn(
          zoneId,
          "ongew",
          zonePrefix + " · ongew. onder",
          Math.round(st.B27),
          fundSegmentEquivMpa(st, "ongewOnder"),
          st.B27
        )
      );
    }

    if (parts.length === 0) {
      parts.push(
        segmentBtn(zoneId, "gewap", zonePrefix, f.dikteTotaal, eqGew, f.dikteTotaal, placeholder)
      );
    }

    return visualStack("fund", f.dikteTotaal, parts.join(""), placeholder);
  }

  function renderOgvVisual(fundWap, ogvWap) {
    const fundOn = fundWap !== undefined ? fundWap : wapeningFund;
    const ogvOn = ogvWap !== undefined ? ogvWap : wapeningOgv;
    const label = ogvLabel();
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
      return visualStack("ogv", ogvMm, parts.join(""), placeholder);
    }

    if ((st.B28 || 0) > 0) {
      parts.push(
        segmentBtn(
          "ogv",
          "ongew",
          label + " · ongew. boven",
          Math.round(st.B28),
          ogvSegmentEquivMpa(st, "ongewTop"),
          st.B28
        )
      );
    }

    if ((st.B29 || 0) > 0) {
      parts.push(
        segmentBtn(
          "ogv",
          "gewap",
          label + " · gewapend",
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
          "ongew",
          label + " · ongew. onder",
          Math.round(st.B30),
          ogvSegmentEquivMpa(st, "ongewOnder"),
          st.B30
        )
      );
    }

    if (parts.length === 0) {
      parts.push(segmentBtn("ogv", "gewap", label, ogvMm, eqGew, ogvMm, placeholder));
    }

    return visualStack("ogv", ogvMm, parts.join(""), placeholder);
  }

  function renderBovenVisual() {
    const parts = [];
    const L = bovenActieveLaag();
    const topH = bovenTopDikteSum();
    const placeholder = topH <= 0;

    if (L) {
      const laagMm = bovenLaagMm(L);
      parts.push(
        segmentBtn("boven", L.cls, L.label, laagMm, null, laagMm > 0 ? laagMm : 0, laagMm <= 0 && placeholder)
      );
      const sz = bovenStraatzandMm();
      if (sz > 0 || (L.id === "klinkers" && placeholder)) {
        parts.push(
          segmentBtn(
            "boven",
            "straatzand",
            BOVEN_STRAATZAND.label,
            sz,
            null,
            sz > 0 ? sz : 0,
            sz <= 0 && placeholder
          )
        );
      }
    }

    if (!parts.length) {
      parts.push(
        segmentBtn("boven", "boven", "Bovenconstructie", 0, null, 0, true)
      );
    }

    return visualStack("boven", topH, parts.join(""), placeholder);
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
      '" style="' +
      flexStyle(mm, placeholder) +
      '">' +
      inner +
      "</div>"
    );
  }

  function renderProfielHtml(fundWap, ogvWap) {
    let html = renderBovenVisual();
    html += renderOnderconstructieVisual(fundWap, ogvWap);
    const grondMm = grondVisualMm();
    html += segmentBtn("grond", "grond", "Ondergrond", null, materiaalMpa("eOndergrond"), grondMm);
    return html;
  }

  function bindProfielClicks(root) {
    if (!root) return;
    root.querySelectorAll(".visual-layer, .visual-stack, .visual-onder-wrap").forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (!el.dataset.id) return;
        e.stopPropagation();
        selectLayer(el.dataset.id);
      });
    });
  }

  /** Fundering + OGV equivalente E voor profielkolom (onderconstructie). */
  function profielConstructieMpaText(fundWap, ogvWap) {
    const fundOng = calcAt(false, ogvWap);
    const fundGew = calcAt(fundWap, ogvWap);
    const ogvOng = calcAt(fundWap, false);
    const ogvGew = calcAt(fundWap, ogvWap);
    const fund = fundWap ? fundGew.output.E13 : fundOng.output.D13;
    const ogv = ogvWap ? ogvGew.output.E14 : ogvOng.output.D14;
    return fund + " / " + ogv + " MPa";
  }

  function updateVisualColLabels(gewEl, ongEl) {
    if (gewEl) {
      const label = gewEl.closest(".visual-col");
      const el = label && label.querySelector(".visual-col-label");
      if (el) {
        el.innerHTML =
          "Gewapend" +
          '<span class="visual-col-mpa">' +
          profielConstructieMpaText(wapeningFund, wapeningOgv) +
          "</span>" +
          '<span class="visual-col-mpa-sub">Fundering / ' +
          ogvLabel() +
          "</span>";
      }
    }
    if (ongEl) {
      const label = ongEl.closest(".visual-col");
      const el = label && label.querySelector(".visual-col-label");
      if (el) {
        el.innerHTML =
          "Ongewapend" +
          '<span class="visual-col-mpa">' +
          profielConstructieMpaText(false, false) +
          "</span>" +
          '<span class="visual-col-mpa-sub">Fundering / ' +
          ogvLabel() +
          "</span>";
      }
    }
  }

  function mountVisual(gewEl, ongEl, bindClicks) {
    if (!gewEl && !ongEl) return;
    const hPx = visualHeightPx();
    const htmlGew = renderProfielHtml(wapeningFund, wapeningOgv);
    const htmlOng = renderProfielHtml(false, false);

    if (gewEl) {
      gewEl.innerHTML = htmlGew;
      gewEl.style.height = hPx + "px";
      gewEl.dataset.totaalMm = String(visualProfielTotaalMm());
      if (bindClicks) bindProfielClicks(gewEl);
    }
    if (ongEl) {
      ongEl.innerHTML = htmlOng;
      ongEl.style.height = hPx + "px";
      ongEl.dataset.totaalMm = String(visualProfielTotaalMm());
      if (bindClicks) bindProfielClicks(ongEl);
    }
    updateVisualColLabels(gewEl, ongEl);
  }

  function renderVisual() {
    mountVisual(visualGewEl, visualOngEl, true);
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
    if (bovenStraatzandMm() > 0) {
      rows.push({
        id: "boven",
        laag: "↳ " + BOVEN_STRAATZAND.label,
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
      laag: "↳ " + p.labels.fund,
      dikte: f.basis + " + " + f.oh + " = " + f.dikteTotaal,
      wapMm: wapeningFund && !f.druklaagAan ? f.wapDikte : "—",
      ong: fundOng.output.D13,
      gew: fundGew.output.E13,
      wap: wapeningFund,
      sub: true,
    });
    if (f.druklaagAan) {
      const lichtMat = materiaalMatch("eFundering", MATERIAAL_LAAG);
      rows.push(
        {
          id: "fund-druk",
          laag: "↳ ↳ Druklaag · geogrid",
          dikte: String(f.drukStackMm),
          wapMm: wapeningFund ? "geogrid" : "—",
          ong: fundOng.state.C25 || f.eDruk,
          gew: fundGew.state.C26 || fundGew.output.E13,
          wap: wapeningFund,
          sub: true,
        },
        {
          id: "fund-licht",
          laag: "↳ ↳ " + ((lichtMat && lichtMat.label) || "Licht"),
          dikte: String(f.lichtDikte),
          wapMm: wapeningFund ? "SIF 10" : "—",
          ong: fundOng.state.C27 || f.eLicht,
          gew: fundGew.state.C27 || f.eLicht,
          wap: wapeningFund,
          sub: true,
        }
      );
    }
    rows.push(
      {
        id: "ogv",
        laag: "↳ " + p.labels.ogv,
        dikte: String(values.ogvDikte),
        wapMm: wapeningOgv ? values.wapOgv : "—",
        ong: ogvOng.output.D14,
        gew: ogvGew.output.E14,
        wap: wapeningOgv,
        sub: true,
      },
      {
        id: "grond",
        laag: "Ondergrond",
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
          '</td><td class="num">' +
          (hasE ? r.ong + " MPa" : "—") +
          '</td><td class="num">' +
          (hasE ? (r.wap ? r.gew : r.ong) + " MPa" : "—") +
          '</td><td class="num factor">' +
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
      .concat([{ key: "eDruklaag", label: "E-modulus druklaag", unit: "MPa", min: 30, max: 600, step: 5 }])
      .concat(FIELDS.fund.wapening)
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
    return (
      '<div class="field-section">' +
      '<div class="field-section-title">Fundering modus (F13)</div>' +
      '<div class="expert-modus-btns" role="group" aria-label="Fundering modus">' +
      '<button type="button" class="expert-modus-btn' +
      (!vast ? " expert-modus-btn--active" : "") +
      '" data-modus="vrij">Vrij</button>' +
      '<button type="button" class="expert-modus-btn' +
      (vast ? " expert-modus-btn--active" : "") +
      '" data-modus="vast">Vast</button>' +
      "</div>" +
      '<p class="field-note">Vast: D13 = vulmateriaal E. Vrij: volledige Excel-keten.</p></div>'
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
        expertCalcRow("Fundering — configuratie", wapeningTypeLabel(values.wapTypeFund), ""),
        expertCalcRow("OGV — configuratie", wapeningTypeLabel(values.wapTypeOgv), ""),
        expertCalcRow("D19 · " + SIF_NAME + " (SIF)", formatFactor(values.sifFundering), ""),
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
        expertCalcRow("oh ongew.", f.ohOng, "mm"),
        expertCalcRow("oh gewap.", f.ohGew, "mm"),
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
        expertFunderingModusHtml() +
          sectionHtml("Dikte", FIELDS.fund.dikte, false) +
          (f.druklaagAan
            ? '<div class="field-section"><div class="field-section-title">Licht vulmateriaal</div>' +
              FIELDS.fund.materiaal
                .map(function (fld) {
                  return materiaalFieldHtml(fld);
                })
                .join("") +
              '<p class="field-note">Licht laag: <strong>' +
              f.lichtDikte +
              " mm</strong></p></div>" +
              druklaagSectionHtml(false)
            : materiaalSectionHtml(FIELDS.fund.materiaal, "fund")) +
          '<div class="field-section" data-expert-wap-section="fund">' +
          '<div class="field-section-title">' +
          (f.druklaagAan ? "Wapening (SIF 10 licht + geogrid druklaag)" : "Wapening") +
          "</div>" +
          expertWapeningToggleHtml("fund") +
          wapeningTypeHtml("fund", !wapeningFund) +
          (f.druklaagAan
            ? '<p class="field-note">Geogrid over de hele druklaag; SIF 10 op BIMS/schuimglas. Geen geocel-hoogte.</p>'
            : wapeningFieldsExceptSif("fund")
                .map(function (fld) {
                  return fieldHtml(fld, !wapeningFund);
                })
                .join("")) +
          mifDisplayHtml("fund", !wapeningFund) +
          "</div>",
        "fund"
      ) +
      expertSliderCard(
        ogvLabel(),
        p.labels.ogv + " · " + values.ogvDikte + " mm",
        sectionHtml("Dikte", FIELDS.ogv.dikte, false) +
          materiaalSectionHtml(FIELDS.ogv.materiaal, "ogv") +
          '<div class="field-section" data-expert-wap-section="ogv">' +
          '<div class="field-section-title">Wapening</div>' +
          expertWapeningToggleHtml("ogv") +
          wapeningTypeHtml("ogv", !wapeningOgv) +
          wapeningFieldsExceptSif("ogv")
            .map(function (fld) {
              return fieldHtml(fld, !wapeningOgv);
            })
            .join("") +
          mifDisplayHtml("ogv", !wapeningOgv) +
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
      '<h3 class="expert-panel__title">Live berekening</h3>' +
      '<p class="expert-panel__sub">Excel-cellen en tussenstappen · werkt direct mee met sliders</p>' +
      '<div id="expert-calc-live" class="expert-calc-grid"></div></section>' +
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
    ["fund", "ogv"].forEach(function (layer) {
      const sel = document.getElementById("wap-type-" + layer);
      const note = document.getElementById("wap-type-note-" + layer);
      const typeKey = wapeningTypeKey(layer);
      const sifKey = sifKeyForLayer(layer);
      const cur = wapeningTypeById(values[typeKey]);
      if (sel) sel.value = normalizeWapeningId(values[typeKey] || WAPENING_TYPE_DEFAULT);
      if (note) {
        note.innerHTML =
          sifFieldLabel(layer) +
          ': <strong>' +
          formatFactor(values[sifKey]) +
          "</strong>" +
          (cur ? " · " + cur.product : "");
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
        values.funderingModus = modus.dataset.modus === "vast" ? "vast" : "vrij";
        refreshExpertLive();
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
        syncBovenDikte();
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
      expertToggleEl.textContent = expertMode ? "Standaard modus" : "Expert mode";
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
    syncDruklaagFromFundering();
    syncMifFromWapening();
    invalidateCalcCache();
    if (expertMode) {
      if (!expertDashBuilt) {
        renderExpertDashboard();
      } else {
        refreshExpertLive();
      }
      return;
    }
    expertDashBuilt = false;
    renderPakketSummary();
    renderTable();
    renderLayerTabs();
    renderVisual();
    renderPanel();
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

  function setGuideOpen(open) {
    if (!guidePanelEl || !guideToggleEl) return;
    guidePanelEl.hidden = !open;
    guideToggleEl.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (guideToggleEl) {
    guideToggleEl.addEventListener("click", function () {
      setGuideOpen(guidePanelEl && guidePanelEl.hidden);
    });
  }

  if (guidePanelEl) {
    guidePanelEl.querySelectorAll("[data-guide-jump]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.dataset.guideJump) selectLayer(btn.dataset.guideJump);
      });
    });
  }

  function setTableOpen(open) {
    if (!tableWrapEl || !tableToggleEl) return;
    tableWrapEl.hidden = !open;
    tableToggleEl.setAttribute("aria-expanded", open ? "true" : "false");
    tableToggleEl.textContent = open ? "Inklappen" : "Uitklappen";
  }

  if (tableToggleEl) {
    tableToggleEl.addEventListener("click", function () {
      setTableOpen(tableWrapEl && tableWrapEl.hidden);
    });
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      renderVisual();
      if (expertMode) renderExpertVisual();
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
    values.wapFundering = Number(p[16]) || 0;
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
    };
    if (p[28]) {
      const el = document.getElementById("project_naam");
      if (el) el.value = p[28];
    }
    values.bovenDikte =
      (bovenActieveLaag() ? Number(values[bovenActieveLaag().dikteKey]) || 0 : 0) +
      (Number(values.bovenStraatzand) || 0);
    return true;
  }

  function applyState(st) {
    if (!st || typeof st !== "object") return;
    if (st.sheet) sheet = st.sheet;
    if (typeof st.wapeningFund === "boolean") wapeningFund = st.wapeningFund;
    if (typeof st.wapeningOgv === "boolean") wapeningOgv = st.wapeningOgv;
    if (st.materiaalKeuze) materiaalKeuze = st.materiaalKeuze;
    if (st.values) values = Object.assign({}, values, st.values);
    if (st.project) {
      const el = document.getElementById("project_naam");
      if (el) el.value = st.project;
    }
  }

  function shareUrl() {
    const u = new URL(location.href.split("#")[0]);
    u.hash = "c=" + encodeURIComponent(compactState());
    return u.toString();
  }

  function restoreFromUrl() {
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
      " · tabel " +
      meta.tabel +
      " (" +
      meta.eOnderbouw +
      " × " +
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
          vals: valsEl ? valsEl.textContent.replace(/\s+/g, " ").trim() : "",
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
    const fundType = wapeningTypeById(values.wapTypeFund);
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
    if (bovenStraatzandMm() > 0) {
      tableRows.push(["  Straatzand", fmtMm(bovenStraatzandMm()), "—", "—", "—", "—"]);
    }
    tableRows.push([
      "Onderconstructie",
      onderconstructieOmschrijving() + " mm",
      "—",
      "—",
      "—",
      "—",
    ]);
    tableRows.push([
      "  " + p.labels.fund,
      f.basis + " + " + f.oh + " = " + f.dikteTotaal + " mm",
      wapeningFund ? fmtMm(f.wapDikte) : "—",
      fmtMpa(fundOng.output.D13),
      fmtMpa(wapeningFund ? fundGew.output.E13 : fundOng.output.D13),
      wapeningFund ? factor(fundOng.output.D13, fundGew.output.E13) + "×" : "—",
    ]);
    tableRows.push([
      "  " + p.labels.ogv,
      fmtMm(values.ogvDikte),
      wapeningOgv ? fmtMm(values.wapOgv) : "—",
      fmtMpa(ogvOng.output.D14),
      fmtMpa(wapeningOgv ? ogvGew.output.E14 : ogvOng.output.D14),
      wapeningOgv ? factor(ogvOng.output.D14, ogvGew.output.E14) + "×" : "—",
    ]);
    tableRows.push([
      "Ondergrond",
      "—",
      "—",
      fmtMpa(values.eOndergrond),
      fmtMpa(values.eOndergrond),
      "—",
    ]);

    const invoer = [
      ["Project", projectNaam() || "—"],
      ["Constructietype", constructiePrintLabel() + " · " + (constructie ? constructie.tab : sheet)],
      ["Toplaag", bovenL ? bovenL.label + " · " + fmtMm(bovenLaagMm(bovenL)) : "geen"],
    ];
    if (bovenStraatzandMm() > 0) {
      invoer.push(["Straatzand", fmtMm(bovenStraatzandMm())]);
    }
    invoer.push(["Bovenconstructie totaal", fmtMm(pk.boven) + " · vaste equivalente E " + BOVEN_E_EQUIVALENT + " MPa (geen Romfix)"]);
    invoer.push(["Fundering nominaal", fmtMm(f.basis)]);
    invoer.push(["Overhoogte", fmtMm(f.oh) + (f.oh > OVERHOOGTE_GEWAP_MAX ? " (gewapend max " + OVERHOOGTE_GEWAP_MAX + " mm)" : "")]);
    invoer.push(["Fundering totaal", fmtMm(f.dikteTotaal)]);
    invoer.push(["Vulmateriaal fundering", (materiaalLabel("eFundering") ? materiaalLabel("eFundering") + " · " : "") + fmtMpa(values.eFundering)]);
    if (f.druklaagAan) {
      invoer.push(["Licht fundering", fmtMm(f.lichtDikte) + " · " + fmtMpa(f.eLicht)]);
      invoer.push(["Druklaag", fmtMm(f.drukBasis) + " · " + (materiaalKeuze.eDruklaag || "") + " · " + fmtMpa(f.eDruk)]);
    }
    invoer.push(["Fundering modus (F13)", isFunderingVast() ? "Vast — D13 = vulmateriaal E" : "Vrij — volledige Excel-keten"]);
    invoer.push(["Wapening fundering", wapeningFund ? "Aan · " + (fundType ? wapeningOptionLabel(fundType) : "—") : "Uit"]);
    if (wapeningFund) {
      invoer.push(["Standaard hoogte wapening", fmtMm(f.standaardWap)]);
      invoer.push(["Werkingsdikte fundering", fmtMm(f.wapDikte) + " (standaard + " + WAP_FUNDERING_WERKING_EXTRA + " mm, max laag)"]);
      invoer.push(["SIF fundering (D19)", formatFactor(values.sifFundering) + " · " + SIF_NAME]);
      invoer.push(["MIF fundering (E19)", mifRegel(mifLookupMeta.fund, values.mifFundering)]);
    }
    invoer.push([p.labels.ogv, fmtMm(values.ogvDikte)]);
    invoer.push(["Vulmateriaal OGV", (materiaalLabel("eOgv") ? materiaalLabel("eOgv") + " · " : "") + fmtMpa(values.eOgv)]);
    invoer.push(["Wapening OGV", wapeningOgv ? "Aan · " + (ogvType ? wapeningOptionLabel(ogvType) : "—") : "Uit"]);
    if (wapeningOgv) {
      invoer.push(["Werkingsdikte OGV", fmtMm(values.wapOgv)]);
      invoer.push(["SIF OGV (D20)", formatFactor(values.sifOgv) + " · " + SIF_NAME]);
      invoer.push(["MIF OGV (E20)", mifRegel(mifLookupMeta.ogv, values.mifOgv)]);
    }
    invoer.push(["Ondergrond", (materiaalLabel("eOndergrond") ? materiaalLabel("eOndergrond") + " · " : "") + fmtMpa(values.eOndergrond)]);
    invoer.push(["Pakketdikte", pk.totaal + " mm (" + pk.omschrijving + ")"]);

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

    return {
      title: projectNaam() ? "Romfix — " + projectNaam() : "Romfix sterkteberekening",
      project: projectNaam(),
      date: new Date().toLocaleString("nl-NL"),
      version: "2.3",
      sheetTab: constructie ? constructie.tab : sheet,
      constructieLabel: constructie ? constructie.label : "",
      pk: pk,
      f: f,
      wapeningFund: wapeningFund,
      wapeningOgv: wapeningOgv,
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
      layersGew: layersGew,
      layersOng: layersOng,
      share: shareUrl(),
      disclaimer:
        "Indicatieve berekening volgens Romfix-werkboek v2.3 (Palmer-Barber, Austroads, Thenn + MIF-tabellen). Geen bindende projectberekening. Controleer met ontwerp, verkeersklasse en sondering.",
    };
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
      '<p class="print-meta">Romfix B.V. · werkboek v' +
      r.version +
      " · " +
      htmlEscape(r.sheetTab) +
      " · " +
      htmlEscape(r.date) +
      "</p>" +
      '<div class="print-kpis">' +
      '<div class="print-kpi">Pakket<strong>' +
      r.pk.totaal +
      " mm</strong>" +
      r.pk.omschrijving +
      "</div>" +
      '<div class="print-kpi">Fundering E<strong>' +
      r.e.fundOng +
      (r.wapeningFund ? " → " + r.e.fundGew : "") +
      " MPa</strong>" +
      (r.wapeningFund ? "factor " + r.e.fundFac + "×" : "wapening uit") +
      "</div>" +
      '<div class="print-kpi">OGV E<strong>' +
      r.e.ogvOng +
      (r.wapeningOgv ? " → " + r.e.ogvGew : "") +
      " MPa</strong>" +
      (r.wapeningOgv ? "factor " + r.e.ogvFac + "×" : "wapening uit") +
      "</div></div>" +
      "<h2>Profiel gewapend vs ongewapend</h2>" +
      cloneVisualsHtml() +
      "<h2>Stijfheidstabel</h2>" +
      htmlTable(["Laag", "Dikte", "Wapening", "Zonder wapening", "Met wapening", "Factor"], r.tableRows) +
      "<h2>Invoer (volledig)</h2>" +
      htmlTable(["Parameter", "Waarde"], r.invoer, true) +
      "<h2>Toelichting</h2>" +
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
    const str = String(s == null ? "" : s);
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
    function drawStack(layers, x, label, sub) {
      textAt(x, y, 10, label, true, rgb(0.106, 0.165, 0.29));
      textAt(x, y - 12, 8, sub, false, rgb(0.3, 0.35, 0.4));
      const totalMm =
        layers.reduce(function (s, L) {
          return s + (L.mm || 0);
        }, 0) || 1;
      const maxH = 250;
      let yy = y - 18;
      layers.forEach(function (L) {
        const h = Math.max(16, (L.mm / totalMm) * maxH);
        yy -= h;
        const col = L.rgb || [0.47, 0.71, 0];
        fillRect(x, yy, 248, h - 1.2, rgb(col[0], col[1], col[2]));
        const dark = col[0] + col[1] + col[2] < 1.45;
        const ink = dark ? "1 1 1" : rgb(0.12, 0.16, 0.23);
        const nameLines = pdfWrap((L.name || "") + (L.vals ? "  " + L.vals : ""), 8, 236, false);
        textAt(x + 6, yy + Math.max(4, h / 2 - 4), 8, nameLines[0], false, ink);
      });
    }

    fillRect(0, pageH - 28, pageW, 28, rgb(0.106, 0.165, 0.29));
    textAt(margin, pageH - 19, 11, "Romfix sterkteberekening", true, "1 1 1");
    textAt(pageW - margin - 90, pageH - 19, 9, "v" + r.version + "  indicatief", false, "1 1 1");
    y = pageH - 48;
    textAt(margin, y, 16, r.title, true, rgb(0.106, 0.165, 0.29));
    y -= 14;
    para(r.sheetTab + "  ·  " + r.date, 9);
    y -= 6;

    const kpiH = 36;
    ensure(kpiH + 8);
    const kpis = [
      ["Pakket", r.pk.totaal + " mm", r.pk.omschrijving],
      [
        "Fundering E",
        r.e.fundOng + (r.wapeningFund ? " → " + r.e.fundGew : "") + " MPa",
        r.wapeningFund ? "factor " + r.e.fundFac + "×" : "wapening uit",
      ],
      [
        "OGV E",
        r.e.ogvOng + (r.wapeningOgv ? " → " + r.e.ogvGew : "") + " MPa",
        r.wapeningOgv ? "factor " + r.e.ogvFac + "×" : "wapening uit",
      ],
    ];
    kpis.forEach(function (k, i) {
      const x = margin + i * 172;
      strokeRect(x, y - kpiH, 164, kpiH, rgb(0.773, 0.804, 0.847));
      textAt(x + 6, y - 12, 7.5, k[0], false, rgb(0.4, 0.45, 0.5));
      textAt(x + 6, y - 24, 10, k[1], true, rgb(0.106, 0.165, 0.29));
      textAt(x + 6, y - 34, 7, k[2], false, rgb(0.3, 0.35, 0.4));
    });
    y -= kpiH + 10;

    heading("Profiel gewapend vs ongewapend");
    const stackTop = y;
    const leftH =
      20 +
      Math.max(
        80,
        r.layersGew.reduce(function (s, L) {
          return s + Math.max(16, 1);
        }, 0)
      );
    ensure(270);
    drawStack(r.layersGew, margin, "Gewapend", r.e.colGew);
    drawStack(r.layersOng, margin + 275, "Ongewapend", r.e.colOng);
    y = stackTop - 270;

    heading("Stijfheidstabel");
    drawTable(
      ["Laag", "Dikte", "Wapening", "Zonder", "Met", "Factor"],
      r.tableRows,
      [155, 95, 70, 70, 70, 55]
    );

    heading("Invoer (volledig)");
    drawTable(["Parameter", "Waarde"], r.invoer, [190, 325], { kv: true });

    heading("Toelichting");
    para(r.disclaimer, 8);
    y -= 8;
    textAt(margin, 28, 8, "Romfix B.V. · www.romfix.nl · geen bindende projectberekening", false, rgb(0.4, 0.45, 0.5));

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
    setShareStatus("PDF klaar. Werkt de download niet? Tik op ‘Tik hier om de PDF te openen’.");
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
    setShareStatus("Printvenster geopend. Kies ‘Opslaan als PDF’ voor een kopie.");
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
      btn.textContent = "PDF maken…";
    }
    try {
      makePdf();
    } catch (err) {
      console.error(err);
      alert("PDF maken lukte niet. Probeer Chrome of Safari, niet de in-app browser van Telegram.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Download PDF";
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
          title: projectNaam() || "Romfix-berekening",
          text: "Romfix berekening",
          url: url,
        });
        setShareStatus("Gedeeld.");
        return;
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Link gekopieerd.");
    } catch (_) {
      window.prompt("Kopieer deze link:", url);
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
  render();
})();