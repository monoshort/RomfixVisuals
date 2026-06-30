import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "prive", "RomfixVisuals", "public");
const appPath = path.join(root, "app.js");
const cssPath = path.join(root, "styles.css");
const htmlPath = path.join(root, "index.html");

let app = fs.readFileSync(appPath, "utf8");

if (!app.includes("TEST5_EXPECT")) {
  app = app.replace(
    "  const BOVEN_INVOER_EXCEL = \"excel\";",
    `  const BOVEN_INVOER_EXCEL = "excel";
  const MIF_BRON_TABEL = "tabel";
  const MIF_BRON_EXCEL = "excel";
  /** Verwachte waarden Excel Test 5 per sheet */
  const TEST5_EXPECT = {
    capping: { B12: 1050, B13: 250, B14: 300, B19: 250, B20: 300, E13: 360, E14: 110 },
    roadbase: { B12: 550, B13: 250, B14: 250, B19: 250, B20: 250, E13: 645, E14: 570 },
  };`
  );
}

if (!app.includes("values.mifBron ===")) {
  app = app.replace(
    "  function syncMifFromWapening() {\n    if (typeof window.RomfixMif === \"undefined\") return;",
    "  function syncMifFromWapening() {\n    if (values.mifBron === MIF_BRON_EXCEL) return;\n    if (typeof window.RomfixMif === \"undefined\") return;"
  );
}

app = app.replace(
  `  function laadTest5Preset() {
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
  }`,
  `  function laadTest5Preset() {
    const p = PRESETS[sheet];
    loadPreset(sheet);
    values.bovenInvoerModus = BOVEN_INVOER_EXCEL;
    values.bovenDikteExcel = bovenExcelDefault();
    values.funderingModus = "vrij";
    values.wapFundering = 150;
    values.wapOgv = sheet === "capping" ? 300 : 250;
    values.sifFundering = 10;
    values.sifOgv = 10;
    values.mifBron = MIF_BRON_EXCEL;
    values.mifFundering = p.mifFundering;
    values.mifOgv = p.mifOgv;
    values.test5Referentie = true;
    syncWapeningTypesFromSif();
    syncBovenDikte();
    clampWapOgv();
    invalidateCalcCache();
    render();
  }`
);

if (!app.includes("function excelParityStatus")) {
  app = app.replace(
    "  function renderPakketSummary() {",
    `  function excelParityStatus() {
    const exp = TEST5_EXPECT[sheet];
    if (!exp) return null;
    const f = fundMeta(wapeningFund);
    const calc = calcAt(wapeningFund, wapeningOgv);
    const e13 = wapeningFund ? calc.output.E13 : calc.output.D13;
    const e14 = wapeningOgv ? calc.output.E14 : calc.output.D14;
    const rows = [
      { key: "B12", label: "B12", got: values.bovenDikte, exp: exp.B12 },
      { key: "B13", label: "B13", got: f.dikteTotaal, exp: exp.B13 },
      { key: "B14", label: "B14", got: values.ogvDikte, exp: exp.B14 },
      { key: "B19", label: "B19", got: wapeningFund ? f.wapDikte : 0, exp: exp.B19 },
      { key: "B20", label: "B20", got: wapeningOgv ? values.wapOgv : 0, exp: exp.B20 },
      { key: "E13", label: "E13", got: e13, exp: exp.E13 },
      { key: "E14", label: "E14", got: e14, exp: exp.E14 },
    ];
    return {
      rows: rows.map(function (r) {
        const ok = Number(r.got) === Number(r.exp);
        return { label: r.label, got: r.got, exp: r.exp, ok: ok };
      }),
      allOk: rows.every(function (r) {
        return Number(r.got) === Number(r.exp);
      }),
    };
  }

  function renderExcelCompareStrip() {
    if (!values.test5Referentie && !isBovenExcelModus()) return "";
    const st = excelParityStatus();
    if (!st) return "";
    const title = st.allOk ? "Excel Test 5 — alles klopt" : "Excel Test 5 — vergelijk invoer";
    return (
      '<div class="excel-compare' +
      (st.allOk ? " excel-compare--ok" : "") +
      '">' +
      '<div class="excel-compare__title">' +
      title +
      (st.allOk ? " ✓" : "") +
      "</div>" +
      '<div class="excel-compare__grid">' +
      st.rows
        .map(function (r) {
          return (
            '<div class="excel-compare__cell' +
            (r.ok ? " excel-compare__cell--ok" : " excel-compare__cell--warn") +
            '">' +
            "<span>" +
            r.label +
            "</span>" +
            "<strong>" +
            (r.got == null ? "—" : r.got) +
            "</strong>" +
            (r.ok ? "" : '<small>Excel ' + r.exp + "</small>") +
            "</div>"
          );
        })
        .join("") +
      "</div></div>"
    );
  }

  function renderPakketSummary() {`
  );

  app = app.replace(
    `      "</div>";
  }

  /** Symbolische ondergrond in profiel — schaalt mee met pakket */
  function grondVisualMm() {`,
    (m) => m.replace(
      `      "</div>";
  }`,
      `      "</div>" + renderExcelCompareStrip();
  }`
    )
  );
}

if (!app.includes("visual-stack--excel")) {
  app = app.replace(
    `  function renderBovenVisual() {
    const parts = [];
    const L = bovenActieveLaag();
    const topH = bovenTopDikteSum();
    const placeholder = topH <= 0;

    if (L) {`,
    `  function renderBovenVisual() {
    if (isBovenExcelModus()) {
      const topH = values.bovenDikte || 0;
      const placeholder = topH <= 0;
      const inner = segmentBtn(
        "boven",
        "boven",
        "B12 · bovenconstructie",
        topH,
        BOVEN_E_EQUIVALENT + " MPa",
        topH,
        placeholder
      );
      const sel = layerSelected("boven") ? " visual-layer--selected" : "";
      return (
        '<div class="visual-stack visual-stack--excel' +
        sel +
        '" data-id="boven" data-mm="' +
        topH +
        '" style="' +
        flexStyle(topH, placeholder) +
        '">' +
        inner +
        '<span class="visual-excel-badge">Excel B12</span></div>'
      );
    }
    const parts = [];
    const L = bovenActieveLaag();
    const topH = bovenTopDikteSum();
    const placeholder = topH <= 0;

    if (L) {`
  );
}

app = app.replace(
  `    const bovenL = bovenActieveLaag();
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
    }`,
  `    const bovenL = bovenActieveLaag();
    const rows = [];
    if (isBovenExcelModus()) {
      rows.push({
        id: "boven",
        laag: "Bovenconstructie · B12 (Excel)",
        dikte: (values.bovenDikte || 0) + " mm · E " + BOVEN_E_EQUIVALENT,
        wapMm: "—",
        ong: null,
        gew: null,
        wap: false,
      });
    } else {
      rows.push({
        id: "boven",
        laag: "Bovenconstructie · " + (bovenL ? bovenL.label : "—"),
        dikte: (bovenTopDikteSum() || "0") + " mm",
        wapMm: "—",
        ong: null,
        gew: null,
        wap: false,
      });
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
    }`
);

if (!app.includes("values.mifBron = MIF_BRON_TABEL")) {
  app = app.replace(
    `      bovenDikteExcel: BOVEN_EXCEL_B12[s],
      funderingBasis: p.funderingBasis,`,
    `      bovenDikteExcel: BOVEN_EXCEL_B12[s],
      mifBron: MIF_BRON_TABEL,
      test5Referentie: false,
      funderingBasis: p.funderingBasis,`
  );
}

if (!app.includes('values.mifBron = MIF_BRON_TABEL')) {
  app = app.replace(
    `        values.bovenInvoerModus = modus === "excel" ? BOVEN_INVOER_EXCEL : BOVEN_INVOER_LAGEN;
        if (modus === "excel" && !values.bovenDikteExcel) {
          values.bovenDikteExcel = bovenExcelDefault();
        }
        syncBovenDikte();
        render();`,
    `        values.bovenInvoerModus = modus === "excel" ? BOVEN_INVOER_EXCEL : BOVEN_INVOER_LAGEN;
        if (modus === "excel" && !values.bovenDikteExcel) {
          values.bovenDikteExcel = bovenExcelDefault();
        }
        values.test5Referentie = false;
        syncBovenDikte();
        render();`
  );
}

// Reset mif bron when MIF-affecting fields change
if (!app.includes('values.mifBron = MIF_BRON_TABEL')) {
  app = app.replace(
    `    if (fieldAffectsMif(key)) {
      syncMifFromWapening();
      refreshMifDisplays();
    }`,
    `    if (fieldAffectsMif(key)) {
      values.mifBron = MIF_BRON_TABEL;
      values.test5Referentie = false;
      syncMifFromWapening();
      refreshMifDisplays();
    }`
  );
}

fs.writeFileSync(appPath, app, "utf8");

let css = fs.readFileSync(cssPath, "utf8");
if (!css.includes(".visual-stack--excel")) {
  css += `
.visual-stack--excel {
  position: relative;
  border: 2px dashed rgba(27, 42, 74, 0.35);
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.15);
}
.visual-excel-badge {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--navy);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.1rem 0.35rem;
  pointer-events: none;
}
.excel-compare {
  width: 100%;
  margin-top: 0.65rem;
  padding-top: 0.65rem;
  border-top: 1px solid var(--border);
}
.excel-compare--ok .excel-compare__title {
  color: #15803d;
}
.excel-compare__title {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--navy);
  margin-bottom: 0.4rem;
}
.excel-compare__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.excel-compare__cell {
  font-size: 0.68rem;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.2rem 0.45rem;
  display: flex;
  flex-direction: column;
  min-width: 3.5rem;
}
.excel-compare__cell strong {
  font-size: 0.82rem;
  color: var(--navy);
}
.excel-compare__cell small {
  color: #b45309;
  font-size: 0.62rem;
}
.excel-compare__cell--ok {
  border-color: rgba(21, 128, 61, 0.35);
  background: rgba(21, 128, 61, 0.06);
}
.excel-compare__cell--warn {
  border-color: rgba(180, 83, 9, 0.4);
  background: rgba(254, 243, 199, 0.35);
}
.kpi-bar {
  flex-direction: column;
  align-items: stretch;
}
`;
  fs.writeFileSync(cssPath, css, "utf8");
}

let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace(/v=20260628-b12/g, "v=20260628-klopt");
if (!html.includes("20260628-klopt")) {
  html = html.replace(/app\.js\?v=[^"]+/, "app.js?v=20260628-klopt");
  html = html.replace(/styles\.css\?v=[^"]+/, "styles.css?v=20260628-klopt");
}
fs.writeFileSync(htmlPath, html, "utf8");

console.log("patch-excel-klopt OK");