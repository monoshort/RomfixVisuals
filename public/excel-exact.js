/**
 * Rekenketen 1:1 naar Capping_Romfix / RoadBase_Romfix (Romfix workbook versie 2.3).
 * Circulaire celverwijzingen (F61–F67 ↔ D25–D30 ↔ D51–D55) met Gauss–Seidel-iteratie.
 */

const EXCEL_MIF_R1 = { capping: 4.5, roadbase: 4.3 };
const EXCEL_MIF_R2 = { capping: 4.8, roadbase: 3.8 };

function palmerF2(B61, Csum, Eratio) {
  if (!Csum || Csum === 0 || !Eratio || !Number.isFinite(Eratio) || Eratio === 0) return 1;
  const E61 = Eratio;
  const t = B61 / Math.sqrt(B61 * B61 + Csum * Csum * Math.pow(E61, 2 / 3));
  return t * (1 - 1 / E61) + 1 / E61;
}

function austroadsAvg(eOnder, hMm, eCap) {
  if (!eOnder || eOnder <= 0 || !hMm || hMm <= 0) {
    return Math.round(eOnder > 0 ? eOnder : 0);
  }
  const eRaw = eOnder * Math.pow(2, hMm / 125);
  const r = Math.pow(eRaw / eOnder, 1 / 5);
  let cur = Math.min(r * eOnder, eCap);
  const seq = [cur];
  for (let i = 0; i < 4; i++) {
    cur = Math.min(r * cur, eCap);
    seq.push(cur);
  }
  return Math.round(seq.reduce((a, b) => a + b, 0) / 5);
}

function thennEq(b1, c1, b2, c2, b3, c3) {
  const sumH = b1 + b2 + b3;
  if (sumH <= 0) return 0;
  const sum =
    b1 * Math.pow(Math.max(0, c1), 1 / 3) +
    b2 * Math.pow(Math.max(0, c2), 1 / 3) +
    b3 * Math.pow(Math.max(0, c3), 1 / 3);
  return Math.round(Math.pow(sum / sumH, 3));
}

function thennEq2(b2, c2, b3, c3) {
  const sumH = b2 + b3;
  if (sumH <= 0) return 0;
  if (b3 === 0) return Math.round(c2);
  const sum = b2 * Math.pow(c2, 1 / 3) + b3 * Math.pow(c3, 1 / 3);
  return Math.round(Math.pow(sum / sumH, 3));
}

/** Thenn de Barros — twee opeenvolgende lagen (bijv. licht materiaal + druklaag). */
function thennTweeLagen(h1, e1, h2, e2) {
  return thennEq2(h1, e1, h2, e2);
}

function roundExcel(x) {
  if (x === "" || x == null || !Number.isFinite(x)) return 0;
  return Math.round(x);
}

function isVastF13(F13) {
  const s = String(F13 || "").trim().toLowerCase();
  return s === "vast" || s === "< vast";
}

function computeRomfixWerkboek(inp) {
  const sheet = inp.sheet === "roadbase" ? "roadbase" : "capping";
  const mif1 = inp.E19 != null ? Number(inp.E19) : EXCEL_MIF_R1[sheet];
  const mif2 = inp.E20 != null ? Number(inp.E20) : EXCEL_MIF_R2[sheet];

  const B12 = Number(inp.B12);
  const B13 = Number(inp.B13);
  const B14 = Number(inp.B14);
  const C13 = Number(inp.C13);
  const C14 = Number(inp.C14);
  const C15 = Number(inp.C15);
  const D19 = Number(inp.D19);
  const D20 = Number(inp.D20);
  const B19 = inp.B19 === "" || inp.B19 == null ? 0 : Number(inp.B19);
  const B20 = inp.B20 === "" || inp.B20 == null ? 0 : Number(inp.B20);
  const F13 = inp.F13 != null ? String(inp.F13) : "vrij";
  const B61 = 150;

  const lichtMm = Math.max(0, Math.min(B13, Number(inp.B13Licht) || 0));
  const eLicht = lichtMm > 0 ? Number(inp.C13Licht) || C13 : C13;
  const fundDrukMm = Math.max(0, B13 - lichtMm);
  /** BIMS/schuimglas: SIF 10 op de lichte laag; druklaag gebruikt D19 (geogrid). */
  const sifLicht = lichtMm > 0 ? Number(inp.sifLicht) || 0 : 0;
  const mifLicht =
    inp.mifLicht != null && inp.mifLicht !== "" ? Number(inp.mifLicht) : mif1;

  const C19 = B12 + B13;
  const C20 = B12 + B13 + B14;

  function calcFundZoneSplit(b13Eff, b19Eff) {
    const b25 =
      b19Eff === b13Eff
        ? 0
        : b19Eff === 0
          ? b13Eff
          : B12 + b13Eff === C19
            ? b13Eff - b19Eff
            : B12 + b19Eff === C19
              ? 0
              : C19 - B12 - b19Eff;
    const b27druk =
      b19Eff === 0 || B12 + b13Eff === C19
        ? 0
        : B12 + b19Eff === C19
          ? b13Eff - b19Eff
          : B12 + b13Eff - C19;
    const b26 = b19Eff === 0 ? 0 : b19Eff;
    return { B25: b25, B26: b26, B27: b27druk };
  }

  const s = {
    B12,
    B13,
    B14,
    C13,
    C14,
    C15,
    C31: C15,
    D19,
    D20,
    B19,
    B20,
    E19: mif1,
    E20: mif2,
    F13,
    C19,
    C20,
    B61,
    F61: 1,
    F62: 1,
    F63: 1,
    F64: 1,
    F65: 1,
    F66: 1,
    F67: 1,
    G37: C15,
    B25: 0,
    B26: 0,
    B27: 0,
    B28: 0,
    B29: 0,
    B30: 0,
    C25: 0,
    C26: 0,
    C27: 0,
    C28: 0,
    C29: 0,
    C30: 0,
    D25: C15,
    D26: C15,
    D27: C15,
    D28: C15,
    D29: C15,
    D30: C15,
    B46: 11,
    C46: 11,
    D46: 11,
    E46: 11,
    F46: 11,
    G46: 11,
    D51: 0,
    D52: 0,
    D53: 0,
    D54: 0,
    D55: 0,
    D56: 0,
    E25: 0,
    E28: 0,
  };

  const maxIter = 250;

  for (let it = 0; it < maxIter; it++) {
    s.G37 = C15 / s.F67;

    s.B46 = austroadsAvg(s.C31, s.B30, s.C14);
    s.C46 = austroadsAvg(s.D29, s.B28, s.C14);
    s.D46 = austroadsAvg(s.D28, s.B27, s.C13);
    s.E46 = austroadsAvg(s.D26, s.B25, s.C13);
    s.F46 = austroadsAvg(s.C15, s.B14, s.C14);
    s.G46 = austroadsAvg(s.G37, s.B13, s.C13);

    if (lichtMm > 0) {
      const wap = Math.max(0, Math.min(B19, fundDrukMm));
      s.B26 = wap;
      s.B25 = Math.max(0, fundDrukMm - wap);
      s.B27 = lichtMm;
    } else {
      const fundZones = calcFundZoneSplit(B13, B19);
      s.B25 = fundZones.B25;
      s.B26 = fundZones.B26;
      s.B27 = fundZones.B27;
    }

    if (lichtMm > 0 && s.B27 > 0) {
      s.D46 = austroadsAvg(s.D28, lichtMm, eLicht);
    } else {
      s.D46 = austroadsAvg(s.D28, s.B27, C13);
    }

    s.B28 =
      B14 === B20 || B14 === 0
        ? 0
        : B20 === 0
          ? +B14
          : B12 + B13 + B14 === C20
            ? B14 - B20
            : B12 + B13 + B20 === C20
              ? 0
              : C20 - B12 - B13 - B20;

    s.B30 =
      B20 === "" || B20 === 0
        ? 0
        : B12 + B13 + B14 === C20
          ? 0
          : B12 + B13 + B20 === C20
            ? B14 - B20
            : B12 + B13 + B14 - C20;

    s.B29 = B20 === 0 || B20 === "" ? 0 : B20;

    s.C25 = isVastF13(F13) ? C13 : s.B25 === 0 ? 0 : s.E46;

    s.C27 = s.B27 === 0 ? 0 : s.D46;
    if (sifLicht > 0 && lichtMm > 0 && s.B27 > 0) {
      s.C27 = roundExcel(Math.min(sifLicht * s.D28, mifLicht * eLicht));
    }

    s.C28 = s.B28 === 0 ? 0 : s.C46;

    s.C30 = s.B30 === 0 ? 0 : s.B46;

    s.C26 =
      s.B26 === 0 ? 0 : roundExcel(Math.min(D19 * s.D27, mif1 * C13));

    s.C29 =
      s.B29 === 0
        ? 0
        : s.B30 === 0
          ? roundExcel(Math.min(D20 * s.C31, mif2 * C14))
          : roundExcel(Math.min(D20 * s.D30, mif2 * C14));

    s.D30 = s.B30 === 0 ? s.C31 : roundExcel(s.C31 / s.F66);
    s.D29 = s.B29 === 0 ? s.D30 : roundExcel(s.C31 / s.F65);
    s.D28 = s.B28 === 0 ? s.D29 : roundExcel(s.C31 / s.F64);
    s.D27 = s.B27 === 0 ? s.D28 : roundExcel(s.D28 / s.F63);
    s.D26 = s.B26 === 0 ? s.D27 : roundExcel(s.D28 / s.F62);
    s.D25 = s.B25 === 0 ? s.D26 : roundExcel(s.D28 / s.F61);

    const b51 = s.B25;
    const c51 = b51 > 0 ? s.C25 : 0;
    const b52 = s.B26;
    const c52 = b52 > 0 ? s.C26 : 0;
    const b53 = s.B27;
    const c53 = b53 > 0 ? s.C27 : 0;
    s.D51 = thennEq(b51, c51, b52, c52, b53, c53);

    s.D52 =
      b52 + b53 === 0 ? 0 : b53 === 0 ? Math.round(c52) : thennEq2(b52, c52, b53, c53);

    s.D53 = c53;

    const b54 = s.B28;
    const c54 = b54 > 0 ? s.C28 : 0;
    const b55 = s.B29;
    const c55 = b55 > 0 ? s.C29 : 0;
    const b56 = s.B30;
    const c56 = b56 > 0 ? s.C30 : 0;
    s.D54 = thennEq(b54, c54, b55, c55, b56, c56);
    s.D55 = b55 + b56 === 0 ? 0 : b56 === 0 ? Math.round(c55) : thennEq2(b55, c55, b56, c56);
    s.D56 = c56;

    s.E25 = s.D51;
    s.E28 = s.D54;

    const c61 = s.B25 + s.B26 + s.B27;
    const E61 = c61 === 0 || s.D28 === 0 ? 1 : s.D51 / s.D28;
    const d61 = c61 === 0 ? null : B61 / c61;
    s.F61 = d61 == null ? 1 : palmerF2(B61, c61, E61);

    const c62 = s.B26 + s.B27;
    const E62 = c62 === 0 || s.D28 === 0 ? 1 : s.D52 / s.D28;
    const d62 = c62 === 0 ? null : B61 / c62;
    s.F62 = d62 == null ? 1 : palmerF2(B61, c62, E62);

    const c63 = s.B27;
    const E63 = c63 === 0 || s.D28 === 0 ? 1 : s.D53 / s.D28;
    const d63 = c63 === 0 ? null : B61 / c63;
    s.F63 = d63 == null ? 1 : palmerF2(B61, c63, E63);

    const c64 = s.B28 + s.B29 + s.B30;
    const E64 = c64 === 0 || s.C31 === 0 ? 1 : s.D54 / s.C31;
    const d64 = c64 === 0 ? null : B61 / c64;
    s.F64 = d64 == null ? 1 : palmerF2(B61, c64, E64);

    const c65 = s.B29 + s.B30;
    const E65 = c65 === 0 || s.C31 === 0 ? 1 : s.D55 / s.C31;
    const d65 = c65 === 0 ? null : B61 / c65;
    s.F65 = d65 == null ? 1 : palmerF2(B61, c65, E65);

    const c66 = s.B30;
    const E66 = c66 === 0 || s.C31 === 0 ? 1 : s.D56 / s.C31;
    const d66 = c66 === 0 ? null : B61 / c66;
    s.F66 = d66 == null ? 1 : palmerF2(B61, c66, E66);

    const c67 = s.B14;
    const E67 = s.C15 === 0 ? 1 : s.F46 / s.C15;
    const d67 = c67 === 0 ? null : B61 / c67;
    s.F67 = d67 == null ? 1 : palmerF2(B61, c67, E67);

    if (it > 5) {
      const err = Math.abs(s.F67 - C15 / s.G37);
      if (err < 1e-9 && it > 20) break;
    }
  }

  const D13 = isVastF13(F13) ? C13 : s.G46;
  const E13 = isVastF13(F13) ? Math.max(D13, s.E25) : s.E25;
  const D14 = s.F46;
  const E14 = s.E28;

  return {
    state: s,
    sheet,
    output: { D13, E13, D14, E14, C19, C20 },
  };
}

/**
 * Equivalente stijfheid ondergrond na verbeteringslaag (alleen C15 + B14/C14).
 * Gebruikt de Excel-keten: Austroads (F46) → laagopsplitsing → Thenn (D54) → Palmer (F67).
 */
function computeOndergrondVerbetering(inp) {
  const sheet = inp.sheet === "roadbase" ? "roadbase" : "capping";
  const werkboek = computeRomfixWerkboek({
    sheet,
    B12: 0,
    B13: 0,
    B14: Number(inp.B14),
    C14: Number(inp.C14),
    C15: Number(inp.C15),
    B19: 0,
    B20: inp.B20 === "" || inp.B20 == null ? 0 : Number(inp.B20),
    D19: inp.D19 != null ? Number(inp.D19) : 10,
    D20: inp.D20 != null ? Number(inp.D20) : 10,
    E19: inp.E19,
    E20: inp.E20,
    F13: "vrij",
  });
  const s = werkboek.state;
  const o = werkboek.output;
  const eOnder = Number(inp.C15);
  const eEq = o.E14;

  return {
    eOndergrond: eOnder,
    dikteMm: Number(inp.B14),
    eMateriaal: Number(inp.C14),
    eOngewapend: o.D14,
    eEquivalent: eEq,
    austroadsF46: s.F46,
    thennD54: s.D54,
    palmerF67: s.F67,
    d28: s.D28,
    verbeteringFactor: eOnder > 0 ? Math.round((eEq / eOnder) * 10) / 10 : 0,
    gewapendC29: s.C29,
    state: s,
    output: o,
  };
}

if (typeof window !== "undefined") {
  window.computeRomfixWerkboek = computeRomfixWerkboek;
  window.computeOndergrondVerbetering = computeOndergrondVerbetering;
  window.austroadsAvg = austroadsAvg;
  window.thennTweeLagen = thennTweeLagen;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    computeRomfixWerkboek,
    computeOndergrondVerbetering,
    austroadsAvg,
    palmerF2,
    thennTweeLagen,
  };
}
