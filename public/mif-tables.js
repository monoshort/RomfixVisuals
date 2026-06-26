/**
 * Modules Improvement Factor (MIF) — ROMFIX® 2D-tabellen (stijfheid onderbouw × stijfheid infill).
 * Bron: Romfix-documentatie / live-berekeningen kern.js (versie 2.3).
 */
(function (root) {
  const MIF_SUB = [40, 60, 80, 100, 120, 140, 160, 180, 200, 220];
  const MIF_INF = [75, 100, 125, 150, 175, 200, 225, 250];

  /** Alleen geocel (R'Cel) */
  const MIF_TABLE_RCEL = [
    [3.3, 2.9, 2.6, 2.3, 2.1, 1.9, 1.8, 1.7],
    [3.4, 3.0, 2.7, 2.4, 2.2, 2.0, 1.9, 1.8],
    [3.4, 3.1, 2.8, 2.5, 2.3, 2.1, 2.0, 1.9],
    [3.5, 3.1, 2.8, 2.6, 2.3, 2.2, 2.0, 1.9],
    [3.6, 3.2, 2.9, 2.6, 2.3, 2.2, 2.1, 2.0],
    [3.7, 3.3, 3.0, 2.7, 2.5, 2.3, 2.2, 2.1],
    [3.7, 3.4, 3.0, 2.8, 2.5, 2.4, 2.2, 2.1],
    [3.8, 3.4, 3.1, 2.8, 2.6, 2.4, 2.3, 2.2],
    [3.8, 3.5, 3.1, 2.9, 2.6, 2.5, 2.3, 2.3],
    [3.9, 3.5, 3.2, 2.9, 2.7, 2.5, 2.4, 2.3],
  ];

  /** Geocel + geogrid (R'Cel + E'Grid) */
  const MIF_TABLE_RCEL_GRID = [
    [4.8, 4.3, 3.8, 3.4, 3.1, 2.8, 2.6, 2.5],
    [4.9, 4.4, 3.9, 3.5, 3.2, 2.9, 2.7, 2.6],
    [5.0, 4.5, 4.0, 3.6, 3.3, 3.1, 2.9, 2.7],
    [5.2, 4.6, 4.2, 3.7, 3.4, 3.2, 3.0, 2.9],
    [5.3, 4.7, 4.3, 3.9, 3.5, 3.3, 3.1, 3.0],
    [5.4, 4.8, 4.4, 4.0, 3.6, 3.4, 3.2, 3.1],
    [5.4, 4.9, 4.4, 4.0, 3.7, 3.5, 3.3, 3.1],
    [5.5, 5.0, 4.5, 4.1, 3.8, 3.5, 3.3, 3.2],
    [5.6, 5.1, 4.6, 4.2, 3.9, 3.6, 3.4, 3.3],
    [5.7, 5.1, 4.7, 4.3, 3.9, 3.7, 3.5, 3.4],
  ];

  /** Alleen GeoGrid: geschaald uit R'Cel-tabel (SIF-grid / SIF-cel = 5,0 / 7,6). */
  const MIF_GRID_ONLY_SCALE = 5.0 / 7.6;

  /** Zelfde ids als prive/Romfix: grid_only · cell_only · grid_cell */
  const MIF_TABLE_META = {
    cell_only: { id: "cell_only", label: "R'Cel", grid: MIF_TABLE_RCEL },
    grid_cell: { id: "grid_cell", label: "R'Cel + E'Grid", grid: MIF_TABLE_RCEL_GRID },
    grid_only: {
      id: "grid_only",
      label: "E'Grid (geschaald uit R'Cel)",
      grid: MIF_TABLE_RCEL,
      scale: MIF_GRID_ONLY_SCALE,
    },
  };

  const WAPENING_ID_ALIASES = {
    egrid: "grid_only",
    rcel: "cell_only",
    beide: "grid_cell",
  };

  function clampSegment(val, arr) {
    const n = arr.length;
    if (n < 2) return { i0: 0, i1: 0, t: 0 };
    if (val <= arr[0]) {
      const span = arr[1] - arr[0] || 1;
      return { i0: 0, i1: 1, t: (val - arr[0]) / span };
    }
    if (val >= arr[n - 1]) {
      const span = arr[n - 1] - arr[n - 2] || 1;
      return { i0: n - 2, i1: n - 1, t: (val - arr[n - 2]) / span };
    }
    let i = 0;
    for (; i < n - 1; i++) {
      if (val <= arr[i + 1]) break;
    }
    const span = arr[i + 1] - arr[i] || 1;
    return { i0: i, i1: i + 1, t: (val - arr[i]) / span };
  }

  function mifInterpGrid(x, y, z) {
    const rx = clampSegment(x, MIF_SUB);
    const ry = clampSegment(y, MIF_INF);
    const f00 = z[rx.i0][ry.i0];
    const f01 = z[rx.i0][ry.i1];
    const f10 = z[rx.i1][ry.i0];
    const f11 = z[rx.i1][ry.i1];
    const bottom = f00 + (f10 - f00) * rx.t;
    const top = f01 + (f11 - f01) * rx.t;
    return bottom + (top - bottom) * ry.t;
  }

  /**
   * @param {string} typeId - grid_only | cell_only | grid_cell
   * @param {number} eOnderbouw - stijfheid onderbouw (MPa)
   * @param {number} eInfill - stijfheid invulling E In (MPa)
   */
  function lookupMif(typeId, eOnderbouw, eInfill) {
    const norm = WAPENING_ID_ALIASES[typeId] || typeId;
    const meta = MIF_TABLE_META[norm] || MIF_TABLE_META.grid_cell;
    const x = Math.max(1, Number(eOnderbouw) || 1);
    const y = Math.max(1, Number(eInfill) || 1);
    let base = mifInterpGrid(x, y, meta.grid);
    if (meta.scale) base *= meta.scale;
    return {
      mif: Math.round(Math.max(1, Math.min(20, base)) * 100) / 100,
      tabel: meta.label,
      typeId: meta.id,
      eOnderbouw: Math.round(x),
      eInfill: Math.round(y),
    };
  }

  const api = {
    MIF_SUB,
    MIF_INF,
    MIF_TABLE_RCEL,
    MIF_TABLE_RCEL_GRID,
    lookupMif,
    mifInterpGrid,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RomfixMif = api;
})(typeof window !== "undefined" ? window : globalThis);