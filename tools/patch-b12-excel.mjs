import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appPath = path.join(__dirname, "..", "..", "..", "prive", "RomfixVisuals", "public", "app.js");
const cssPath = path.join(__dirname, "..", "..", "..", "prive", "RomfixVisuals", "public", "styles.css");
const htmlPath = path.join(__dirname, "..", "..", "..", "prive", "RomfixVisuals", "public", "index.html");

let app = fs.readFileSync(appPath, "utf8");

if (app.includes("BOVEN_EXCEL_B12")) {
  console.log("already patched");
  process.exit(0);
}

app = app.replace(
  "  /** Vaste equivalente E van hele bovenconstructie (geen Romfix) */\n  const BOVEN_E_EQUIVALENT = 5000;",
  `  /** Vaste equivalente E van hele bovenconstructie (geen Romfix) */
  const BOVEN_E_EQUIVALENT = 5000;
  /** Excel Test 5 — totale bovenconstructiedikte B12 (mm) */
  const BOVEN_EXCEL_B12 = { capping: 1050, roadbase: 550 };
  const BOVEN_INVOER_LAGEN = "lagen";
  const BOVEN_INVOER_EXCEL = "excel";`
);

app = app.replace(
  `  function bovenTopDikteSum() {
    return (
      BOVEN_LAGEN.reduce(function (sum, L) {
        return sum + bovenLaagMm(L);
      }, 0) + bovenStraatzandMm()
    );
  }`,
  `  function bovenTopDikteSum() {
    return (
      BOVEN_LAGEN.reduce(function (sum, L) {
        return sum + bovenLaagMm(L);
      }, 0) + bovenStraatzandMm()
    );
  }

  function bovenExcelDefault() {
    return BOVEN_EXCEL_B12[sheet] || 500;
  }

  function isBovenExcelModus() {
    return values.bovenInvoerModus === BOVEN_INVOER_EXCEL;
  }`
);

app = app.replace(
  `  function bovenDikteOmschrijving() {
    const L = bovenActieveLaag();
    if (!L) return "0";`,
  `  function bovenDikteOmschrijving() {
    if (isBovenExcelModus()) {
      return "Excel B12 " + (values.bovenDikteExcel || bovenExcelDefault());
    }
    const L = bovenActieveLaag();
    if (!L) return "0";`
);

app = app.replace(
  `  function syncBovenDikte() {
    values.bovenDikte = bovenTopDikteSum();
  }`,
  `  function syncBovenDikte() {
    if (isBovenExcelModus()) {
      values.bovenDikte = Number(values.bovenDikteExcel) || bovenExcelDefault();
    } else {
      values.bovenDikte = bovenTopDikteSum();
    }
  }

  function laadTest5Preset() {
    loadPreset(sheet);
    values.bovenInvoerModus = BOVEN_INVOER_EXCEL;
    values.bovenDikteExcel = bovenExcelDefault();
    values.funderingModus = "vrij";
    values.wapFundering = 150;
    values.wapOgv = sheet === "capping" ? 300 : 250;
    values.sifFundering = 10;
    values.sifOgv = 10;
    syncWapeningTypesFromSif();
    syncBovenDikte();
    clampWapOgv();
    syncMifFromWapening();
    invalidateCalcCache();
    render();
  }

  function bovenInvoerModusHtml() {
    const excel = isBovenExcelModus();
    return (
      '<div class="field-section field-section--boven-modus">' +
      '<div class="field-section-title">Invoer bovenconstructie (B12)</div>' +
      '<div class="expert-modus-btns" role="group" aria-label="B12 invoermodus">' +
      '<button type="button" class="expert-modus-btn' +
      (!excel ? " expert-modus-btn--active" : "") +
      '" data-boven-modus="lagen">Laag voor laag</button>' +
      '<button type="button" class="expert-modus-btn' +
      (excel ? " expert-modus-btn--active" : "") +
      '" data-boven-modus="excel">Excel totaal</button>' +
      "</div>" +
      '<p class="field-note">Excel totaal = één dikte B12 zoals in het werkboek (Test 5: Capping 1050 mm, RoadBase 550 mm). E blijft ' +
      BOVEN_E_EQUIVALENT +
      " MPa.</p>" +
      '<button type="button" class="btn-test5" data-laad-test5="1">Laad Excel Test 5</button>' +
      "</div>"
    );
  }`
);

app = app.replace(
  `  function bovenLagenSectionHtml() {
    const active = bovenActieveLaag();
    let html =
      '<div class="field-section">' +
      '<div class="field-section-title">Kies toplaag</div>' +`,
  `  function bovenLagenSectionHtml() {
    const active = bovenActieveLaag();
    let html = bovenInvoerModusHtml();
    if (isBovenExcelModus()) {
      html +=
        '<div class="field-section">' +
        '<div class="field-section-title">Totale dikte B12</div>' +
        fieldHtml(
          {
            key: "bovenDikteExcel",
            label: "B12 bovenconstructie",
            unit: "mm",
            min: 0,
            max: 2000,
            step: 10,
          },
          false
        ) +
        "</div>";
      return html;
    }
    html +=
      '<div class="field-section">' +
      '<div class="field-section-title">Kies toplaag</div>' +`
);

app = app.replace(
      `bovenDikte: (activeLaag ? activeLaag.defaultMm : 0) + straatzandMm,
      funderingBasis: p.funderingBasis,`,
      `bovenDikte: (activeLaag ? activeLaag.defaultMm : 0) + straatzandMm,
      bovenInvoerModus: BOVEN_INVOER_LAGEN,
      bovenDikteExcel: BOVEN_EXCEL_B12[s],
      funderingBasis: p.funderingBasis,`
);

app = app.replace(
  `    if (layerId === "boven") {
      const L = bovenActieveLaag();
      if (!L) return [];
      const fields = [`,
  `    if (layerId === "boven") {
      if (isBovenExcelModus()) {
        return [
          {
            key: "bovenDikteExcel",
            label: "B12 bovenconstructie",
            unit: "mm",
            min: 0,
            max: 2000,
            step: 10,
          },
        ];
      }
      const L = bovenActieveLaag();
      if (!L) return [];
      const fields = [`
);

app = app.replace(
  `    if (key.indexOf("boven") === 0 && key.indexOf("Aan") < 0) {
      syncBovenDikte();
    }`,
  `    if (key === "bovenDikteExcel") {
      syncBovenDikte();
    }
    if (key.indexOf("boven") === 0 && key.indexOf("Aan") < 0 && key !== "bovenDikteExcel") {
      syncBovenDikte();
    }`
);

app = app.replace(
  `    panelFields.querySelectorAll("[data-boven-toplaag]").forEach(function (el) {
      el.addEventListener("change", function () {
        values.bovenToplaag = el.value;
        syncBovenDikte();
        render();
      });
    });`,
  `    panelFields.querySelectorAll("[data-boven-modus]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const modus = btn.dataset.bovenModus;
        values.bovenInvoerModus = modus === "excel" ? BOVEN_INVOER_EXCEL : BOVEN_INVOER_LAGEN;
        if (modus === "excel" && !values.bovenDikteExcel) {
          values.bovenDikteExcel = bovenExcelDefault();
        }
        syncBovenDikte();
        render();
      });
    });

    panelFields.querySelectorAll("[data-laad-test5]").forEach(function (btn) {
      btn.addEventListener("click", laadTest5Preset);
    });

    panelFields.querySelectorAll("[data-boven-toplaag]").forEach(function (el) {
      el.addEventListener("change", function () {
        values.bovenToplaag = el.value;
        syncBovenDikte();
        render();
      });
    });`
);

app = app.replace(
  `      "<p>Alle parameters live — profiel, stijfheid en Excel-keten werken direct mee.</p>" +
      expertSheetTabsHtml() +`,
  `      "<p>Alle parameters live — profiel, stijfheid en Excel-keten werken direct mee.</p>" +
      '<p class="expert-dash-actions"><button type="button" class="btn-test5" data-laad-test5="1">Laad Excel Test 5</button></p>' +
      expertSheetTabsHtml() +`
);

app = app.replace(
  `    expertDashboardEl.addEventListener("click", function (e) {
      const tab = e.target.closest(".expert-sheet-tab");`,
  `    expertDashboardEl.addEventListener("click", function (e) {
      if (e.target.closest("[data-laad-test5]")) {
        laadTest5Preset();
        return;
      }
      const bovenModus = e.target.closest("[data-boven-modus]");
      if (bovenModus) {
        const modus = bovenModus.dataset.bovenModus;
        values.bovenInvoerModus = modus === "excel" ? BOVEN_INVOER_EXCEL : BOVEN_INVOER_LAGEN;
        if (modus === "excel" && !values.bovenDikteExcel) {
          values.bovenDikteExcel = bovenExcelDefault();
        }
        syncBovenDikte();
        expertDashBuilt = false;
        render();
        return;
      }
      const tab = e.target.closest(".expert-sheet-tab");`
);

app = app.replace(
  `  function render() {
    syncSheetFromInvoer();`,
  `  function render() {
    syncBovenDikte();
    syncSheetFromInvoer();`
);

fs.writeFileSync(appPath, app, "utf8");

let css = fs.readFileSync(cssPath, "utf8");
if (!css.includes(".btn-test5")) {
  css += `
.btn-test5 {
  margin-top: 0.5rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--navy);
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
}
.btn-test5:hover {
  background: rgba(27, 42, 74, 0.06);
  border-color: var(--navy);
}
.expert-dash-actions {
  margin: 0.35rem 0 0.5rem;
}
`;
  fs.writeFileSync(cssPath, css, "utf8");
}

let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace(/v=20260628-improve/g, "v=20260628-b12");
fs.writeFileSync(htmlPath, html, "utf8");

console.log("patch-b12-excel OK");